// Import necessary dependencies
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock models
const mockContact = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn()
};

// Mock User model
const mockUser = {
    findById: jest.fn().mockResolvedValue({
        _id: 'admin-user-id',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        role: 'admin'
    })
};

// Mock emailService
const mockEmailService = {
    sendContactFormNotification: jest.fn().mockResolvedValue({
        success: true,
        adminMessageId: 'admin-msg-123',
        userMessageId: 'user-msg-123'
    }),
    sendContactStatusNotification: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'status-msg-123'
    }),
    sendContactFollowupNotification: jest.fn().mockResolvedValue({
        success: true,
        messageId: 'followup-msg-123'
    })
};

// Create a constructor for new Contact instances
function MockContact(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockImplementation(function () {
        this._id = this._id || new mongoose.Types.ObjectId().toString();
        this.createdAt = this.createdAt || new Date();
        this.updatedAt = new Date();
        return Promise.resolve(this);
    });
    return this;
}

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    verifyToken: jest.fn((req, res, next) => {
        req.user = { userId: 'admin-user-id', role: 'admin' };
        next();
    }),
    isAdmin: jest.fn((req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }
    })
}));

// Mock models
jest.mock('../models/contact', () => {
    const constructor = jest.fn((data) => new MockContact(data));
    constructor.find = mockContact.find;
    constructor.findById = mockContact.findById;
    constructor.findByIdAndUpdate = mockContact.findByIdAndUpdate;
    constructor.countDocuments = mockContact.countDocuments;
    return constructor;
});

jest.mock('../models/users', () => mockUser);
jest.mock('../services/emailService', () => mockEmailService);

// Mock mongoose.Types.ObjectId.isValid to always return true for tests
mongoose.Types.ObjectId.isValid = jest.fn(() => true);

// Import route handler after mocking dependencies
const contactRoutes = require('../routes/contact');
app.use('/api/contact', contactRoutes);

describe('Contact Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    // Test 1: Submit contact form
    test('should submit a contact form successfully', async () => {
        // Define form data
        const formData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '555-123-4567',
            subject: 'Test Subject',
            message: 'This is a test message'
        };

        // Make request
        const response = await request(app)
            .post('/api/contact')
            .send(formData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Contact form submitted successfully');
        expect(response.body.data).toBeDefined();
        expect(response.body.data.adminMessageId).toBe('admin-msg-123');
        expect(response.body.data.userMessageId).toBe('user-msg-123');
        expect(mockEmailService.sendContactFormNotification).toHaveBeenCalledWith(
            expect.objectContaining(formData)
        );
    });

    // Test 2: Submit contact form with missing required fields
    test('should return 400 if required fields are missing', async () => {
        // Define incomplete form data
        const incompleteFormData = {
            firstName: 'John',
            // lastName is missing
            email: 'john.doe@example.com',
            subject: 'Test Subject'
            // message is missing
        };

        // Make request
        const response = await request(app)
            .post('/api/contact')
            .send(incompleteFormData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Please provide all required fields');
        expect(mockEmailService.sendContactFormNotification).not.toHaveBeenCalled();
    });

    // Test 3: Submit contact form with invalid email
    test('should return 400 if email format is invalid', async () => {
        // Define form data with invalid email
        const formData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'invalid-email',
            subject: 'Test Subject',
            message: 'This is a test message'
        };

        // Make request
        const response = await request(app)
            .post('/api/contact')
            .send(formData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Please provide a valid email address');
        expect(mockEmailService.sendContactFormNotification).not.toHaveBeenCalled();
    });

    // Test 4: Get all contact form submissions
    test('should get all contact submissions with pagination', async () => {
        // Convert dates to strings to match expected response format
        const mockSubmissions = [
            {
                _id: 'submission1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                subject: 'Test Subject 1',
                message: 'This is test message 1',
                status: 'new',
                createdAt: '2023-01-01T00:00:00.000Z'
            },
            {
                _id: 'submission2',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane.smith@example.com',
                subject: 'Test Subject 2',
                message: 'This is test message 2',
                status: 'in-progress',
                createdAt: '2023-01-02T00:00:00.000Z'
            }
        ];

        // Setup mocks
        mockContact.countDocuments.mockResolvedValue(2);
        mockContact.find.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockSubmissions)
                })
            })
        });

        // Make request
        const response = await request(app).get('/api/contact?page=1&limit=10');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.data).toEqual(mockSubmissions);
        expect(response.body.data.pagination).toBeDefined();
        expect(response.body.data.pagination.total).toBe(2);
        expect(response.body.data.pagination.page).toBe(1);
    });

    // Test 5: Get contact submission counts by status
    test('should get contact submission counts by status', async () => {
        // Setup mocks
        mockContact.countDocuments
            .mockResolvedValueOnce(10) // total
            .mockResolvedValueOnce(5)  // new
            .mockResolvedValueOnce(3)  // in-progress
            .mockResolvedValueOnce(2); // resolved

        // Make request
        const response = await request(app).get('/api/contact/count');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.counts).toEqual({
            total: 10,
            new: 5,
            inProgress: 3,
            resolved: 2
        });
    });

    // Test 6: Get a single contact submission
    test('should get a single contact submission', async () => {
        // Mock submission
        const mockSubmission = {
            _id: 'submission1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            subject: 'Test Subject',
            message: 'This is a test message',
            status: 'new',
            followups: [],
            createdAt: '2023-01-01T00:00:00.000Z'
        };

        // Setup mocks
        mockContact.findById.mockResolvedValue(mockSubmission);

        // Make request
        const response = await request(app).get('/api/contact/submission1');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSubmission);
        expect(mockContact.findById).toHaveBeenCalledWith('submission1');
    });

    // Test 7: Get a non-existent contact submission
    test('should return 404 if contact submission is not found', async () => {
        // Setup mocks
        mockContact.findById.mockResolvedValue(null);

        // Make request
        const response = await request(app).get('/api/contact/nonexistent');

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Submission not found');
    });

    // Test 8: Update contact submission status
    test('should update contact submission status', async () => {
        // Mock current submission
        const currentSubmission = {
            _id: 'submission1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            subject: 'Test Subject',
            message: 'This is a test message',
            status: 'new'
        };

        // Mock updated submission
        const updatedSubmission = {
            ...currentSubmission,
            status: 'in-progress',
            notes: 'Working on this'
        };

        // Setup mocks
        mockContact.findById.mockResolvedValue(currentSubmission);
        mockContact.findByIdAndUpdate.mockResolvedValue(updatedSubmission);

        // Make request
        const response = await request(app)
            .put('/api/contact/submission1')
            .send({
                status: 'in-progress',
                notes: 'Working on this'
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.data).toEqual(updatedSubmission);
        expect(response.body.data.message).toBe('Submission updated successfully');
        expect(mockEmailService.sendContactStatusNotification).toHaveBeenCalled();
    });

    // Test 9: Add a follow-up to a contact submission
    test('should add a follow-up to a contact submission', async () => {
        // Mock submission
        const mockSubmission = {
            _id: 'submission1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            subject: 'Test Subject',
            message: 'This is a test message',
            status: 'new',
            followups: [],
            save: jest.fn().mockImplementation(function () {
                this.status = 'in-progress';
                this.followups.push({
                    message: 'Follow-up message',
                    addedBy: 'admin-user-id',
                    addedByName: 'Admin User',
                    createdAt: expect.any(Date),
                    isInternal: false
                });
                return Promise.resolve(this);
            })
        };

        // Setup mocks
        mockContact.findById.mockResolvedValue(mockSubmission);

        // Make request
        const response = await request(app)
            .post('/api/contact/submission1/followup')
            .send({
                message: 'Follow-up message',
                isInternal: false
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Follow-up added successfully');
        expect(mockSubmission.save).toHaveBeenCalled();
        expect(mockEmailService.sendContactFollowupNotification).toHaveBeenCalled();
    });

    // Test 10: Add an internal follow-up (no email notification)
    test('should add an internal follow-up without sending email', async () => {
        // Mock submission
        const mockSubmission = {
            _id: 'submission1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            subject: 'Test Subject',
            message: 'This is a test message',
            status: 'in-progress',
            followups: [],
            save: jest.fn().mockImplementation(function () {
                this.followups.push({
                    message: 'Internal note',
                    addedBy: 'admin-user-id',
                    addedByName: 'Admin User',
                    createdAt: expect.any(Date),
                    isInternal: true
                });
                return Promise.resolve(this);
            })
        };

        // Setup mocks
        mockContact.findById.mockResolvedValue(mockSubmission);

        // Make request
        const response = await request(app)
            .post('/api/contact/submission1/followup')
            .send({
                message: 'Internal note',
                isInternal: true
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('Follow-up added successfully');
        expect(mockSubmission.save).toHaveBeenCalled();
        expect(mockEmailService.sendContactFollowupNotification).not.toHaveBeenCalled();
    });
}); 