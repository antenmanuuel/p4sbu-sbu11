const request = require('supertest');
const express = require('express');
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Mocks
jest.mock('../models/users');
jest.mock('../models/user_activity');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

// Mock middleware
jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = {
            userId: 'mockUserId',
            email: 'john@example.com',
            userType: 'student'
        };
        next();
    }
}));

// Setup test app
const app = express();
app.use(express.json());

// Import routes
const userRoutes = require('../routes/users');
app.use('/api/user', userRoutes);

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/user/profile', () => {
        it('should get user profile successfully', async () => {
            const mockUser = {
                _id: 'mockUserId',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                userType: 'student',
                sbuId: '12345678',
                phone: '123-456-7890',
                isApproved: true,
                car: { make: 'Toyota', model: 'Camry' },
                createdAt: new Date()
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });
            User.countDocuments = jest.fn().mockResolvedValue(100);

            const res = await request(app).get('/api/user/profile');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('_id', 'mockUserId');
            expect(User.findById).toHaveBeenCalledWith('mockUserId');
        });

        it('should return 404 if user not found', async () => {
            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            const res = await request(app).get('/api/user/profile');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('PUT /api/user/profile', () => {
        const mockUser = {
            _id: 'mockUserId',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            userType: 'student',
            phone: '123-456-7890',
            save: jest.fn().mockResolvedValue()
        };

        it('should update user profile successfully', async () => {
            User.findById = jest.fn()
                .mockResolvedValueOnce(mockUser)
                .mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue({
                        ...mockUser,
                        phone: '555-555-5555'
                    })
                });

            UserActivity.logActivity = jest.fn().mockResolvedValue();

            const res = await request(app)
                .put('/api/user/profile')
                .send({
                    phone: '555-555-5555',
                    address: '123 Main St'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Profile updated successfully');
            expect(res.body).toHaveProperty('user');
            expect(mockUser.save).toHaveBeenCalledTimes(1);
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
        });

        it('should return 404 if user not found', async () => {
            User.findById = jest.fn().mockResolvedValue(null);

            const res = await request(app)
                .put('/api/user/profile')
                .send({ phone: '555-555-5555' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('PUT /api/user/change-password', () => {
        const mockUser = {
            _id: 'mockUserId',
            password: 'hashedPassword',
            save: jest.fn().mockResolvedValue()
        };

        it('should change password successfully', async () => {
            User.findById = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(true);
            UserActivity.logActivity = jest.fn().mockResolvedValue();

            const res = await request(app)
                .put('/api/user/change-password')
                .send({
                    currentPassword: 'oldPassword',
                    newPassword: 'newPassword'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Password changed successfully');
            expect(mockUser.save).toHaveBeenCalledTimes(1);
            expect(mockUser.password).toBe('newPassword');
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if current password is incorrect', async () => {
            User.findById = jest.fn().mockResolvedValue(mockUser);
            bcrypt.compare = jest.fn().mockResolvedValue(false);
            UserActivity.logActivity = jest.fn().mockResolvedValue();

            const res = await request(app)
                .put('/api/user/change-password')
                .send({
                    currentPassword: 'wrongPassword',
                    newPassword: 'newPassword'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Current password is incorrect');
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if parameters are missing', async () => {
            const res = await request(app)
                .put('/api/user/change-password')
                .send({ currentPassword: 'oldPassword' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Current password and new password are required');
        });
    });

    describe('GET /api/user/activity', () => {
        it('should get user activity history successfully', async () => {
            const mockActivities = [
                {
                    _id: 'activity1',
                    user: 'mockUserId',
                    activity_type: 'login',
                    created_at: new Date()
                },
                {
                    _id: 'activity2',
                    user: 'mockUserId',
                    activity_type: 'profile_update',
                    created_at: new Date()
                }
            ];

            UserActivity.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockActivities)
                })
            });

            const res = await request(app).get('/api/user/activity');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(UserActivity.find).toHaveBeenCalledWith({ user: 'mockUserId' });
        });
    });
}); 