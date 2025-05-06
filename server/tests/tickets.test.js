// Import necessary dependencies
const request = require('supertest');
const express = require('express');

// Mock the Ticket model without using mongoose
const mockTicket = {
    find: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn()
};

// Mock the User model
const mockUser = {
    findById: jest.fn()
};

// Mock RevenueStatistics
const mockRevenueStatistics = {
    recordCitationPayment: jest.fn().mockResolvedValue({})
};

// Mock NotificationHelper
const mockNotificationHelper = {
    createFineNotification: jest.fn().mockResolvedValue({}),
    createSystemNotification: jest.fn().mockResolvedValue({})
};

// Create a constructor function for new Ticket instances
function MockTicket(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
}

// Add ability to mock implementation for testing
MockTicket.mockImplementation = jest.fn((implementation) => {
    // Store the implementation to use in the constructor
    MockTicket._mockImplementation = implementation;
});

// Reset the mock implementation
MockTicket.mockReset = () => {
    MockTicket._mockImplementation = null;
};

// Create express app
const app = express();
app.use(express.json());

// Mock routes/tickets.js to access and modify it
jest.mock('../routes/tickets', () => {
    // Get original module
    const originalModule = jest.requireActual('../routes/tickets');

    // Return a copy of the original module with custom middleware
    return originalModule;
});

// Mock auth middleware
jest.mock('../middleware/auth', () => {
    const verifyToken = jest.fn((req, res, next) => {
        req.user = { userId: 'test-user-id', userType: 'user' };
        next();
    });

    const isAdmin = jest.fn((req, res, next) => next());

    return {
        verifyToken,
        isAdmin
    };
});

// Mock express-validator module functions first
jest.mock('express-validator', () => {
    // Create middleware function that will be used in routes
    const middleware = (req, res, next) => next();

    // Create a chainable validator that returns the middleware at the end of the chain
    const chainableValidator = {
        isMongoId: () => chainableValidator,
        isFloat: () => chainableValidator,
        isInt: () => chainableValidator,
        isArray: () => chainableValidator,
        isIn: () => chainableValidator,
        isObject: () => chainableValidator,
        isNumeric: () => chainableValidator,
        notEmpty: () => chainableValidator,
        optional: () => chainableValidator,
        trim: () => chainableValidator,
        withMessage: () => middleware
    };

    // Create parameter functions that initialize the chain
    const param = jest.fn().mockReturnValue(chainableValidator);
    const body = jest.fn().mockReturnValue(chainableValidator);
    const query = jest.fn().mockReturnValue(chainableValidator);

    // Mock the validation result function
    const validationResult = jest.fn().mockImplementation(() => ({
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([])
    }));

    return {
        param,
        body,
        query,
        validationResult
    };
});

// Handle the populate method mock
const setupPopulate = (mockObject) => {
    if (!mockObject) return null;

    // Create a populate method that returns the object itself for chaining
    mockObject.populate = jest.fn().mockReturnValue(mockObject);
    return mockObject;
};

// Mock the Ticket model
jest.mock('../models/tickets', () => {
    // Create a proper mock with all the needed methods
    const mockConstructor = jest.fn((data) => {
        if (MockTicket._mockImplementation) {
            return MockTicket._mockImplementation(data);
        }
        return new MockTicket(data);
    });

    // Attach the mock methods to the constructor function
    mockConstructor.find = mockTicket.find;
    mockConstructor.findById = mockTicket.findById;

    // For findOne, add special handling to return an object with populate
    mockConstructor.findOne = jest.fn().mockImplementation((...args) => {
        const result = mockTicket.findOne(...args);
        return setupPopulate(result);
    });

    mockConstructor.findByIdAndUpdate = mockTicket.findByIdAndUpdate;
    mockConstructor.findByIdAndDelete = mockTicket.findByIdAndDelete;
    mockConstructor.countDocuments = mockTicket.countDocuments;

    return mockConstructor;
});

// Mock the User model
jest.mock('../models/users', () => mockUser);

// Mock RevenueStatistics
jest.mock('../models/revenue_statistics', () => mockRevenueStatistics);

// Mock NotificationHelper
jest.mock('../utils/notificationHelper', () => mockNotificationHelper);

// Mock Stripe before importing routes
jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => {
        return {
            paymentMethods: {
                list: jest.fn().mockResolvedValue({
                    data: [{ id: 'pm_123456' }]
                }),
                attach: jest.fn().mockResolvedValue({})
            },
            customers: {
                create: jest.fn().mockResolvedValue({ id: 'cus_123456' })
            },
            paymentIntents: {
                create: jest.fn().mockResolvedValue({
                    id: 'pi_123456',
                    client_secret: 'secret',
                    status: 'succeeded',
                    charges: { data: [{ receipt_url: 'https://receipt.url' }] }
                })
            }
        };
    });
});

// Set test environment before importing routes
process.env.NODE_ENV = 'test';

// Import the actual routes after mocking
const ticketsRoutes = require('../routes/tickets');
app.use('/api', ticketsRoutes);

describe('Tickets Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(() => {
        // Clean up environment variable after tests
        delete process.env.NODE_ENV;
    });

    describe('User Ticket Routes', () => {
        test('should get user tickets successfully', async () => {
            // Mock data
            const mockTickets = [
                { _id: 'ticket1', name: 'Parking Violation', amount: 50, user: 'test-user-id' },
                { _id: 'ticket2', name: 'Speeding Ticket', amount: 100, user: 'test-user-id' }
            ];

            // Setup mocks
            mockTicket.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue(mockTickets)
            });

            // Make request
            const response = await request(app).get('/api/user/tickets');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockTickets);
            expect(mockTicket.find).toHaveBeenCalledWith({ user: 'test-user-id' });
        });

        test('should handle server error when fetching tickets', async () => {
            // Setup mock to throw error
            mockTicket.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            // Make request
            const response = await request(app).get('/api/user/tickets');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Error fetching tickets');
        });

        test('should pay a ticket successfully', async () => {
            // Mock user data
            const mockUserData = {
                _id: 'test-user-id',
                email: 'test@example.com',
                firstName: 'Test',
                lastName: 'User',
                stripeCustomerId: 'cus_123456',
                save: jest.fn().mockResolvedValue({})
            };

            // Mock ticket data with user field
            const mockTicketData = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: {
                    _id: 'test-user-id',
                    email: 'test@example.com'
                },
                isPaid: false,
                save: jest.fn().mockResolvedValue({})
            };

            // Setup mocks
            mockUser.findById.mockResolvedValue(mockUserData);
            mockTicket.findOne.mockResolvedValue(mockTicketData);

            // Make request
            const response = await request(app)
                .post('/api/user/tickets/ticket1/pay')
                .send({ paymentMethodId: 'pm_123456' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mockTicketData.isPaid).toBe(true);
            expect(mockTicketData.save).toHaveBeenCalled();
            expect(mockRevenueStatistics.recordCitationPayment).toHaveBeenCalledWith(50);
        });

        test('should return 404 if ticket is not found for payment', async () => {
            // Setup mocks - findOne returns null
            mockTicket.findOne.mockResolvedValue(null);

            // Make request
            const response = await request(app)
                .post('/api/user/tickets/nonexistent/pay')
                .send({ paymentMethodId: 'pm_123456' });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        test('should return 400 if ticket is already paid', async () => {
            // Mock ticket data that is already paid
            const mockTicketData = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: 'test-user-id',
                isPaid: true
            };

            // Setup mocks
            mockTicket.findOne.mockResolvedValue(mockTicketData);

            // Make request
            const response = await request(app)
                .post('/api/user/tickets/ticket1/pay')
                .send({ paymentMethodId: 'pm_123456' });

            // Assertions
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Ticket is already paid');
        });
    });

    describe('Admin Ticket Routes', () => {
        // Mock auth middleware for admin routes
        beforeEach(() => {
            jest.clearAllMocks();

            // Override auth middleware for admin routes
            const auth = require('../middleware/auth');
            auth.verifyToken.mockImplementation((req, res, next) => {
                req.user = { userId: 'admin-user-id', userType: 'admin' };
                next();
            });
        });

        test('should create a ticket successfully', async () => {
            // Mock user for the ticket
            const mockUserData = {
                _id: 'user1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User'
            };

            // Create a Date object but use string representation for comparison
            const ticketDate = new Date();
            const ticketDateString = ticketDate.toISOString();

            // Mock the saved ticket with its save method returning the expected response
            const mockSavedTicket = {
                _id: 'new-ticket-id',
                name: 'Parking Violation',
                amount: 50,
                user: 'user1',
                date_posted: ticketDateString,
                isPaid: false,
                canPetition: true
            };

            // Reset all mocks
            jest.clearAllMocks();

            // Setup user mock to properly return data
            mockUser.findById.mockImplementation((id) => {
                if (id === 'user1') {
                    return Promise.resolve(mockUserData);
                }
                return Promise.resolve(null);
            });

            // Create a mock ticket with custom save method
            const mockTicketInstance = {
                ...mockSavedTicket,
                date_posted: ticketDate,
                // This save method will be called when new ticket is created
                save: jest.fn().mockImplementation(() => {
                    return Promise.resolve(mockSavedTicket);
                })
            };

            // Reset the constructor mock
            MockTicket.mockImplementation(() => mockTicketInstance);

            // Make request - no details field
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'Parking Violation',
                    amount: 50,
                    userId: 'user1'
                });

            // Assertions
            expect(response.status).toBe(201);
            expect(response.body).toEqual(mockSavedTicket);
            expect(mockUser.findById).toHaveBeenCalledWith('user1');
            expect(mockTicketInstance.save).toHaveBeenCalled();
            expect(mockNotificationHelper.createFineNotification).toHaveBeenCalled();
        });

        test('should return 400 if required fields are missing', async () => {
            // Reset all mocks
            jest.clearAllMocks();

            // Make request with missing fields
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'Parking Violation'
                    // Missing amount and userId
                });

            // Assertions
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Missing required fields');
        });

        test('should return 404 if user is not found', async () => {
            // Reset all mocks
            jest.clearAllMocks();

            // Setup user mock to always return null
            mockUser.findById.mockImplementation(() => {
                return Promise.resolve(null);
            });

            // Make request
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'Parking Violation',
                    amount: 50,
                    userId: 'nonexistent'
                });

            // Assertions - Make sure the response has proper error status
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
            expect(mockUser.findById).toHaveBeenCalledWith('nonexistent');
        });

        test('should get all tickets with pagination', async () => {
            // Mock data
            const mockTickets = [
                { _id: 'ticket1', name: 'Parking Violation', amount: 50 },
                { _id: 'ticket2', name: 'Speeding Ticket', amount: 100 }
            ];

            // Setup mocks
            mockTicket.countDocuments.mockResolvedValue(2);
            mockTicket.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockTickets)
                        })
                    })
                })
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.tickets).toEqual(mockTickets);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.total).toBe(2);
        });

        test('should filter tickets by userId and isPaid', async () => {
            // Mock data
            const mockTickets = [
                { _id: 'ticket1', name: 'Parking Violation', amount: 50, user: 'user1', isPaid: true }
            ];

            // Setup mocks
            mockTicket.countDocuments.mockResolvedValue(1);
            mockTicket.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockTickets)
                        })
                    })
                })
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets?userId=user1&isPaid=true');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.tickets).toEqual(mockTickets);
            expect(mockTicket.find).toHaveBeenCalled();
            // Verify the query contains userId and isPaid
            expect(mockTicket.find.mock.calls[0][0]).toEqual({ user: 'user1', isPaid: true });
        });

        test('should get a ticket by ID', async () => {
            // Reset findById mock
            mockTicket.findById.mockReset();

            // Mock data
            const testTicket = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
            };

            // Setup proper mock with populate chain that resolves to the test ticket
            mockTicket.findById.mockImplementation(() => {
                return {
                    populate: jest.fn().mockResolvedValue(testTicket)
                };
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(testTicket);
            expect(mockTicket.findById).toHaveBeenCalledWith('ticket1');
        });

        test('should return 404 if ticket not found when getting by ID', async () => {
            // Reset findById mock
            mockTicket.findById.mockReset();

            // Setup proper mock that resolves to null after populate
            mockTicket.findById.mockImplementation(() => {
                return {
                    populate: jest.fn().mockResolvedValue(null)
                };
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        test('should update a ticket', async () => {
            // Mock data for updated ticket
            const mockUpdatedTicket = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 75, // Updated amount
                user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
            };

            // Setup mocks
            mockTicket.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUpdatedTicket)
            });

            // Make request
            const response = await request(app)
                .put('/api/admin/tickets/ticket1')
                .send({ amount: 75 });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ticket updated successfully');
            expect(response.body.ticket).toEqual(mockUpdatedTicket);
            expect(mockTicket.findByIdAndUpdate).toHaveBeenCalledWith(
                'ticket1',
                { amount: 75 },
                { new: true }
            );
        });

        test('should return 404 if ticket not found during update', async () => {
            // Setup mocks
            mockTicket.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            // Make request
            const response = await request(app)
                .put('/api/admin/tickets/nonexistent')
                .send({ amount: 75 });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        test('should delete a ticket', async () => {
            // Setup mocks
            mockTicket.findByIdAndDelete.mockResolvedValue({
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50
            });

            // Make request
            const response = await request(app).delete('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ticket deleted successfully');
            expect(mockTicket.findByIdAndDelete).toHaveBeenCalledWith('ticket1');
        });

        test('should return 404 if ticket not found during deletion', async () => {
            // Setup mocks
            mockTicket.findByIdAndDelete.mockResolvedValue(null);

            // Make request
            const response = await request(app).delete('/api/admin/tickets/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        test('should handle server error when deleting a ticket', async () => {
            // Setup mocks to throw error
            mockTicket.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).delete('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Server error');
        });
    });
});