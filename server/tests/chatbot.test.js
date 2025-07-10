const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const chatbotRoutes = require('../routes/chatbot');
const auth = require('../middleware/auth');
const User = require('../models/users');
const Lot = require('../models/lot');
const Reservation = require('../models/reservation');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());
app.use('/api/chatbot', chatbotRoutes);

describe('Chatbot API', () => {
  let mongoServer;
  let testUser;
  let authToken;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@stonybrook.edu',
      sbuId: '123456789',
      password: 'password123',
      userType: 'student',
      status: 'active',
      isApproved: true
    });
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser._id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test parking lot
    const testLot = new Lot({
      lotId: 'TEST001',
      name: 'Test Parking Lot',
      address: '123 Test Street',
      location: { latitude: 40.9176, longitude: -73.1218 },
      totalSpaces: 100,
      availableSpaces: 50,
      permitTypes: ['Student'],
      hourlyRate: 2.50,
      status: 'active'
    });
    await testLot.save();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  describe('POST /api/chatbot/chat', () => {
    it('should respond to findParking intent', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I need to find parking',
          intent: 'findParking'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('Test');
      expect(response.body.response).toContain('parking');
      expect(response.body.data).toHaveProperty('availableLots');
    });

    it('should respond to availability intent', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'What is the parking availability?',
          intent: 'availability'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('occupancy');
      expect(response.body.data).toHaveProperty('totalSpaces');
      expect(response.body.data).toHaveProperty('availableSpaces');
    });

    it('should respond to myReservations intent', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Show my reservations',
          intent: 'myReservations'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('reservations');
      expect(response.body.data).toHaveProperty('reservations');
    });

    it('should handle help intent', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I need help',
          intent: 'help'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('help');
      expect(response.body.response).toContain('parking');
    });

    it('should handle buildingParking intent', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'I need parking near the library',
          intent: 'buildingParking'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('parking');
      expect(response.body.data).toHaveProperty('buildingRecommendation');
    });

    it('should handle unknown intent with default response', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          message: 'Random message',
          intent: 'unknown'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.response).toContain('understand');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/chatbot/chat')
        .send({
          message: 'Test message',
          intent: 'help'
        });

      expect(response.status).toBe(401);
    });

    it('should handle errors gracefully', async () => {
      // Test with invalid user ID in token
      const invalidToken = jwt.sign(
        { id: new mongoose.Types.ObjectId(), email: 'invalid@test.com' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .post('/api/chatbot/chat')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          message: 'Test message',
          intent: 'help'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });
  });

  describe('GET /api/chatbot/stats', () => {
    it('should return user stats', async () => {
      const response = await request(app)
        .get('/api/chatbot/stats')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.stats).toHaveProperty('activeReservations');
      expect(response.body.stats).toHaveProperty('activePermits');
      expect(response.body.stats).toHaveProperty('availableLots');
    });

    it('should require authentication for stats', async () => {
      const response = await request(app)
        .get('/api/chatbot/stats');

      expect(response.status).toBe(401);
    });
  });
});
