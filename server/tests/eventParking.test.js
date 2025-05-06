// Import necessary dependencies
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Helper function to create chainable query mock
const createQueryMock = (returnValue) => {
    // Create the object first
    const queryMock = {};

    // Then add all methods that reference the object itself
    queryMock.populate = jest.fn().mockReturnValue(queryMock);
    queryMock.select = jest.fn().mockReturnValue(queryMock);
    queryMock.sort = jest.fn().mockReturnValue(queryMock);
    queryMock.skip = jest.fn().mockReturnValue(queryMock);
    queryMock.limit = jest.fn().mockReturnValue(queryMock);
    queryMock.then = jest.fn().mockImplementation(callback => Promise.resolve(callback(returnValue)));
    queryMock.exec = jest.fn().mockResolvedValue(returnValue);

    return queryMock;
};

// Mock models
const mockEventRequest = {
    find: jest.fn(),
    findOne: jest.fn(),
    countDocuments: jest.fn(),
    save: jest.fn()
};

const mockLot = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn()
};

const mockUser = {
    find: jest.fn(),
    findById: jest.fn()
};

// Mock notification helper
const mockNotificationHelper = {
    createSystemNotification: jest.fn().mockResolvedValue({})
};

// Mock email service
const mockEmailService = {
    sendGenericEmail: jest.fn().mockResolvedValue({})
};

// Create a constructor for new EventRequest instances
function MockEventRequest(data) {
    Object.assign(this, data);
    this.status = 'pending';
    this.requestId = data.requestId || `EPR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    this.save = jest.fn().mockResolvedValue(this);

    // Add toObject method for Mongoose compatibility
    this.toObject = function () {
        return { ...this };
    };

    return this;
}

// Helper to make mock arrays compatible with toObject
const addToObjectToArrayItems = (array) => {
    return array.map(item => {
        if (!item.toObject) {
            item.toObject = function () {
                return { ...this };
            };
        }
        return item;
    });
};

// Mock auth middleware
const mockVerifyToken = jest.fn((req, res, next) => {
    req.user = {
        userId: 'test-user-id',
        userType: 'faculty'
    };
    next();
});

// Create express app
const app = express();
app.use(express.json());

// Mock dependencies
jest.mock('../middleware/auth', () => ({
    verifyToken: mockVerifyToken,
    isAdmin: jest.fn((req, res, next) => {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }
        next();
    })
}));

jest.mock('../models/eventRequest', () => {
    const constructor = jest.fn((data) => new MockEventRequest(data));
    constructor.find = mockEventRequest.find;
    constructor.findOne = mockEventRequest.findOne;
    constructor.countDocuments = mockEventRequest.countDocuments;
    return constructor;
});

jest.mock('../models/lot', () => mockLot);
jest.mock('../models/users', () => mockUser);
jest.mock('../utils/notificationHelper', () => mockNotificationHelper);
jest.mock('../services/emailService', () => mockEmailService);

// Import the REAL routes - don't mock them
const eventParkingRoutes = require('../routes/eventParking');

// Use the real router in our app
app.use('/api/event-parking', eventParkingRoutes);

describe('Event Parking Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Reset the verifyToken mock to its default behavior for faculty
        mockVerifyToken.mockImplementation((req, res, next) => {
            req.user = {
                userId: 'test-user-id',
                userType: 'faculty'
            };
            next();
        });
    });

    afterAll(() => {
        jest.clearAllMocks();
    });

    // Test 1: Create a new event request successfully
    test('should create a new event request successfully', async () => {
        // Mock save to return the object with a requestId
        const saveMock = jest.fn().mockImplementation(function () {
            this.requestId = 'EPR-20230101-1234';
            return Promise.resolve(this);
        });

        MockEventRequest.prototype.save = saveMock;

        // Mock data
        const requestData = {
            eventName: 'Test Event',
            eventDescription: 'A test event for the parking system',
            eventDate: new Date().toISOString(),
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            location: 'Engineering Building',
            expectedAttendees: 100,
            parkingLotPreference: 'lot-id-123',
            specialRequirements: 'Special needs',
            organizerName: 'Test Organizer',
            organizerEmail: 'test@example.com',
            organizerPhone: '123-456-7890',
            departmentName: 'Computer Science'
        };

        // Mock User.find to return a list of admin users
        mockUser.find.mockReturnValue(createQueryMock([
            { _id: 'admin1' },
            { _id: 'admin2' }
        ]));

        // Mock lot lookup with enough capacity
        const mockLotData = {
            _id: 'lot-id-123',
            lotId: 'lot-id-123',
            name: 'Test Lot',
            availableSpaces: 200,
            totalSpaces: 200
        };
        mockLot.findOne.mockReturnValue(createQueryMock(mockLotData));

        // Make the request
        const response = await request(app)
            .post('/api/event-parking')
            .send(requestData);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requestId).toBeDefined();
        expect(response.body.data.status).toBe('pending');
    });

    // Test 2: Create a new event request with missing required fields
    test('should return 400 if required fields are missing', async () => {
        // Mock data with missing fields
        const requestData = {
            eventName: 'Test Event',
            // Missing required fields
            location: 'Engineering Building'
        };

        // Make the request
        const response = await request(app)
            .post('/api/event-parking')
            .send(requestData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
    });

    // Test 3: Get faculty's own event requests
    test('should get faculty event requests', async () => {
        // Mock data with toObject method
        const mockRequests = addToObjectToArrayItems([
            {
                _id: 'request1',
                requestId: 'EPR-20240101-1234',
                eventName: 'Faculty Event',
                status: 'pending'
            }
        ]);

        // Setup mock with chainable query
        mockEventRequest.find.mockReturnValue(createQueryMock(mockRequests));

        // Make the request
        const response = await request(app)
            .get('/api/event-parking/my-requests');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        // Objects will be processed by toObject now, so we can't directly compare
        expect(response.body.data[0].requestId).toEqual('EPR-20240101-1234');
        expect(mockEventRequest.find).toHaveBeenCalledWith({ requestedBy: 'test-user-id' });
    });

    // Test 4: Get available parking lots
    test('should get available parking lots', async () => {
        // Mock data
        const mockLots = [
            {
                _id: 'lot1',
                name: 'North Lot',
                location: 'North Campus',
                active: true
            }
        ];

        // Setup mock with chainable query
        mockLot.find.mockReturnValue(createQueryMock(mockLots));

        // Make the request
        const response = await request(app)
            .get('/api/event-parking/available-lots');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockLots);
        expect(mockLot.find).toHaveBeenCalledWith({ active: true });
    });

    // Test 5: Get a specific event request by ID
    test('should get a specific event request by ID', async () => {
        // Mock data with toObject method
        const mockRequest = new MockEventRequest({
            _id: 'request1',
            requestId: 'EPR-20240101-1234',
            eventName: 'Test Event',
            status: 'pending',
            requestedBy: {
                _id: 'test-user-id'
            }
        });

        // Setup mock with chainable query
        mockEventRequest.findOne.mockReturnValue(createQueryMock(mockRequest));

        // Make the request
        const response = await request(app)
            .get('/api/event-parking/EPR-20240101-1234');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requestId).toEqual('EPR-20240101-1234');
        expect(mockEventRequest.findOne).toHaveBeenCalledWith({ requestId: 'EPR-20240101-1234' });
    });

    // Test 6: Get non-existent request
    test('should return 404 for non-existent request', async () => {
        // Setup mock with chainable query
        mockEventRequest.findOne.mockReturnValue(createQueryMock(null));

        // Make the request
        const response = await request(app)
            .get('/api/event-parking/nonexistent-id');

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(mockEventRequest.findOne).toHaveBeenCalledWith({ requestId: 'nonexistent-id' });
    });

    // Test 7: Get all event requests (as admin)
    test('should get all event requests as admin', async () => {
        // Mock data with toObject method
        const mockRequests = addToObjectToArrayItems([
            {
                _id: 'request1',
                requestId: 'EPR-20240101-1234',
                eventName: 'Faculty Event 1',
                status: 'pending'
            },
            {
                _id: 'request2',
                requestId: 'EPR-20240101-5678',
                eventName: 'Faculty Event 2',
                status: 'approved'
            }
        ]);

        // Setup mocks with chainable queries
        mockEventRequest.find.mockReturnValue(createQueryMock(mockRequests));
        mockEventRequest.countDocuments.mockResolvedValue(2);

        // Override the auth middleware for this test to simulate admin user
        mockVerifyToken.mockImplementationOnce((req, res, next) => {
            req.user = { userId: 'admin-user-id', userType: 'admin' };
            next();
        });

        // Make the request
        const response = await request(app)
            .get('/api/event-parking');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requests.length).toEqual(2);
        expect(response.body.data.pagination.total).toBe(2);
        expect(mockEventRequest.find).toHaveBeenCalled();
        expect(mockEventRequest.countDocuments).toHaveBeenCalled();
    });

    // Test 8: Get filtered event requests by status
    test('should get filtered event requests by status as admin', async () => {
        // Mock data with toObject method
        const mockRequests = addToObjectToArrayItems([
            {
                _id: 'request1',
                requestId: 'EPR-20240101-1234',
                eventName: 'Faculty Event 1',
                status: 'pending'
            }
        ]);

        // Setup mocks with chainable queries
        mockEventRequest.find.mockReturnValue(createQueryMock(mockRequests));
        mockEventRequest.countDocuments.mockResolvedValue(1);

        // Override the auth middleware for this test to simulate admin user
        mockVerifyToken.mockImplementationOnce((req, res, next) => {
            req.user = { userId: 'admin-user-id', userType: 'admin' };
            next();
        });

        // Make the request
        const response = await request(app)
            .get('/api/event-parking?status=pending');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.requests.length).toEqual(1);
        expect(response.body.data.pagination.total).toBe(1);
        expect(mockEventRequest.find).toHaveBeenCalled();
        expect(mockEventRequest.countDocuments).toHaveBeenCalled();
    });

    // Test 9: Block non-faculty from creating event request
    test('should block non-faculty from creating event request', async () => {
        // Override the auth middleware for this specific test
        mockVerifyToken.mockImplementationOnce((req, res, next) => {
            req.user = { userId: 'student-user-id', userType: 'student' };
            next();
        });

        // Mock data
        const requestData = {
            eventName: 'Test Event',
            eventDescription: 'A test event',
            eventDate: new Date().toISOString(),
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString(),
            location: 'Engineering Building',
            expectedAttendees: 100,
            organizerName: 'Test Organizer',
            organizerEmail: 'test@example.com',
            organizerPhone: '123-456-7890',
            departmentName: 'Computer Science'
        };

        // Make the request
        const response = await request(app)
            .post('/api/event-parking')
            .send(requestData);

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });

    // Test 10: Update event request status as admin
    test('should update event request status as admin', async () => {
        // Mock data with lot reference for approval
        const mockRequest = new MockEventRequest({
            _id: 'request1',
            requestId: 'EPR-20240101-1234',
            eventName: 'Test Event',
            status: 'pending',
            expectedAttendees: 50,
            parkingLotPreference: 'lot-id-123'
        });

        // Add custom save method for this test
        mockRequest.save = jest.fn().mockResolvedValue({
            ...mockRequest,
            status: 'approved'
        });

        // Setup mock with chainable query
        mockEventRequest.findOne.mockReturnValue(createQueryMock(mockRequest));

        // Setup user mock
        mockUser.findById.mockReturnValue(createQueryMock({
            _id: 'faculty-id',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com'
        }));

        // Setup lot mock
        const mockLotData = {
            _id: 'lot-id-123',
            lotId: 'lot-id-123',
            name: 'Test Lot',
            availableSpaces: 200,
            totalSpaces: 200,
            save: jest.fn().mockResolvedValue({})
        };
        mockLot.findOne.mockReturnValue(createQueryMock(mockLotData));

        // Override the auth middleware for this test to simulate admin user
        mockVerifyToken.mockImplementationOnce((req, res, next) => {
            req.user = { userId: 'admin-user-id', userType: 'admin' };
            next();
        });

        // Make the request
        const response = await request(app)
            .put('/api/event-parking/EPR-20240101-1234/status')
            .send({
                status: 'approved',
                adminNotes: 'Approved for event parking'
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockEventRequest.findOne).toHaveBeenCalledWith({ requestId: 'EPR-20240101-1234' });
        expect(mockRequest.save).toHaveBeenCalled();
    });

    // Test 11: Block non-admin from updating request status
    test('should block non-admin from updating request status', async () => {
        // Make the request (as faculty, since that's the default in beforeEach)
        const response = await request(app)
            .put('/api/event-parking/EPR-20240101-1234/status')
            .send({
                status: 'approved',
                adminNotes: 'Approved for event parking'
            });

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
    });
}); 