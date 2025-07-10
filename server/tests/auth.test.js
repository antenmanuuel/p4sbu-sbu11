const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const UserActivity = require('../models/user_activity');

// Mocks
jest.mock('../models/users');
jest.mock('../models/user_activity');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../services/emailService', () => ({
    sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true })
}));

// Setup test app
const app = express();
app.use(express.json());

// Import routes
const authRoutes = require('../routes/auth');
app.use('/api', authRoutes);

describe('Auth Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/register', () => {
        const mockUser = {
            _id: 'mockUserId',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            sbuId: '12345678',
            userType: 'student',
            isApproved: false,
            toObject: jest.fn().mockReturnValue({
                _id: 'mockUserId',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                sbuId: '12345678',
                userType: 'student',
                isApproved: false,
            })
        };

        it('should register a new user successfully', async () => {
            // Mock implementations
            User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
            const mockSave = jest.fn();
            User.mockImplementation(() => ({
                save: mockSave,
                ...mockUser
            }));
            mockSave.mockResolvedValueOnce();
            UserActivity.logActivity.mockResolvedValueOnce();
            jwt.sign.mockReturnValueOnce('mock-token');

            // Test request
            const res = await request(app)
                .post('/api/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    sbuId: '123456789',
                    userType: 'student'
                });

            // Assertions
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('token', 'mock-token');
            expect(res.body).toHaveProperty('message', 'Registration successful! Your account is pending approval.');
            expect(User.findOne).toHaveBeenCalledTimes(2);
            expect(mockSave).toHaveBeenCalledTimes(1);
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if user with email already exists', async () => {
            User.findOne.mockResolvedValueOnce({ email: 'john@example.com' });

            const res = await request(app)
                .post('/api/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    sbuId: '123456789',
                    userType: 'student'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'User already exists with this email');
        });

        it('should return 400 if user with sbuId already exists', async () => {
            User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ sbuId: '123456789' });

            const res = await request(app)
                .post('/api/register')
                .send({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    password: 'password123',
                    sbuId: '12345678',
                    userType: 'student'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'User already exists with this SBU ID');
        });
    });

    describe('POST /api/login', () => {
        const mockUser = {
            _id: 'mockUserId',
            email: 'john@example.com',
            password: 'hashedPassword',
            userType: 'student',
            isApproved: true,
            toObject: jest.fn().mockReturnValue({
                _id: 'mockUserId',
                email: 'john@example.com',
                userType: 'student',
                isApproved: true
            })
        };

        it('should login a user successfully', async () => {
            User.findOne.mockResolvedValueOnce(mockUser);
            bcrypt.compare.mockResolvedValueOnce(true);
            jwt.sign.mockReturnValueOnce('mock-token');
            UserActivity.logActivity.mockResolvedValueOnce();

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'john@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token', 'mock-token');
            expect(User.findOne).toHaveBeenCalledTimes(1);
            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
        });

        it('should return 400 if user not found', async () => {
            User.findOne.mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Invalid email or password');
        });

        it('should return 403 if user account is not approved', async () => {
            User.findOne.mockResolvedValueOnce({
                ...mockUser,
                isApproved: false
            });

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'john@example.com',
                    password: 'password123'
                });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'Your account is pending approval from an administrator');
        });

        it('should return 400 if password is incorrect', async () => {
            User.findOne.mockResolvedValueOnce(mockUser);
            bcrypt.compare.mockResolvedValueOnce(false);
            UserActivity.logActivity.mockResolvedValueOnce();

            const res = await request(app)
                .post('/api/login')
                .send({
                    email: 'john@example.com',
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Invalid email or password');
            expect(UserActivity.logActivity).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/forgot-password', () => {
        it('should generate reset token when email exists', async () => {
            const mockUser = {
                _id: 'mockUserId',
                email: 'john@example.com',
                save: jest.fn().mockResolvedValueOnce()
            };

            User.findOne.mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .post('/api/forgot-password')
                .send({ email: 'john@example.com' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(mockUser.save).toHaveBeenCalledTimes(1);
            expect(mockUser.resetPasswordToken).toBeDefined();
            expect(mockUser.resetPasswordExpires).toBeDefined();
        });

        it('should return standard message when email does not exist', async () => {
            User.findOne.mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/forgot-password')
                .send({ email: 'nonexistent@example.com' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'If an account with that email exists, a password reset link has been sent.');
        });
    });

    describe('POST /api/reset-password', () => {
        it('should reset password with valid token', async () => {
            const mockUser = {
                _id: 'mockUserId',
                email: 'john@example.com',
                save: jest.fn().mockResolvedValueOnce()
            };

            User.findOne.mockResolvedValueOnce(mockUser);

            const res = await request(app)
                .post('/api/reset-password')
                .send({
                    token: 'valid-token',
                    password: 'newpassword123'
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Password has been reset successfully. You can now log in with your new password.');
            expect(mockUser.save).toHaveBeenCalledTimes(1);
            expect(mockUser.password).toBe('newpassword123');
            expect(mockUser.resetPasswordToken).toBeUndefined();
            expect(mockUser.resetPasswordExpires).toBeUndefined();
        });

        it('should return 400 with invalid token', async () => {
            User.findOne.mockResolvedValueOnce(null);

            const res = await request(app)
                .post('/api/reset-password')
                .send({
                    token: 'invalid-token',
                    password: 'newpassword123'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Password reset token is invalid or has expired. Please request a new one.');
        });

        it('should return 400 with missing parameters', async () => {
            const res = await request(app)
                .post('/api/reset-password')
                .send({ token: 'valid-token' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Token and password are required');
        });
    });
}); 