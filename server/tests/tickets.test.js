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
    mockConstructor.findOne = mockTicket.findOne;
    mockConstructor.findByIdAndUpdate = mockTicket.findByIdAndUpdate;
    mockConstructor.findByIdAndDelete = mockTicket.findByIdAndDelete;
    mockConstructor.countDocuments = mockTicket.countDocuments;

    return mockConstructor;
});

// Mock the User model
jest.mock('../models/users', () => {
    return mockUser;
});

// Setup populate method for the returned mock objects
const setupPopulateMock = (mockObject) => {
    if (!mockObject) return null;
    mockObject.populate = jest.fn().mockReturnValue(mockObject);
    return mockObject;
};

// Import the actual routes after mocking
const ticketsRoutes = require('../routes/tickets');
app.use('/api', ticketsRoutes);

describe('Tickets Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('User Ticket Routes', () => {
        it('should get user tickets successfully', async () => {
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

        it('should handle server error when fetching tickets', async () => {
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

        it('should pay a ticket successfully', async () => {
            // Mock data
            const mockTicketData = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: 'test-user-id',
                isPaid: false,
                save: jest.fn().mockResolvedValue()
            };

            // Setup mocks
            mockTicket.findOne.mockResolvedValue(mockTicketData);

            // Make request
            const response = await request(app).post('/api/user/tickets/ticket1/pay');

            // Assertions
            expect(response.status).toBe(200);
            expect(mockTicket.findOne).toHaveBeenCalledWith({
                _id: 'ticket1',
                user: 'test-user-id'
            });
            expect(mockTicketData.save).toHaveBeenCalled();
            expect(mockTicketData.isPaid).toBe(true);
            expect(mockTicketData.paidAt).toBeDefined();
        });

        it('should return 404 if ticket is not found for payment', async () => {
            // Setup mock
            mockTicket.findOne.mockResolvedValue(null);

            // Make request
            const response = await request(app).post('/api/user/tickets/nonexistent/pay');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        it('should return 400 if ticket is already paid', async () => {
            // Mock data
            const mockPaidTicket = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: 'test-user-id',
                isPaid: true
            };

            // Setup mocks
            mockTicket.findOne.mockResolvedValue(mockPaidTicket);

            // Make request
            const response = await request(app).post('/api/user/tickets/ticket1/pay');

            // Assertions
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Ticket is already paid');
        });
    });

    describe('Admin Ticket Routes', () => {
        beforeEach(() => {
            // Override auth middleware for admin routes
            const auth = require('../middleware/auth');
            auth.verifyToken.mockImplementation((req, res, next) => {
                req.user = { userId: 'admin-user-id', userType: 'admin' };
                next();
            });
        });

        it('should create a ticket successfully', async () => {
            // Setup user mock
            mockUser.findById.mockResolvedValue({ _id: 'user1', firstName: 'John', lastName: 'Doe' });

            // Setup ticket mock
            const mockSavedTicket = {
                _id: 'new-ticket-id',
                name: 'New Ticket',
                amount: 75,
                user: 'user1',
                date_posted: new Date(),
                isPaid: false
            };

            mockTicket.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    ...mockSavedTicket,
                    user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
                })
            });

            // Mock constructor behavior
            MockTicket.mockImplementation(() => ({
                _id: 'new-ticket-id',
                save: jest.fn().mockResolvedValue()
            }));

            // Make request
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'New Ticket',
                    amount: 75,
                    userId: 'user1'
                });

            // Assertions
            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Ticket created successfully');
            expect(response.body).toHaveProperty('ticket');
            expect(mockUser.findById).toHaveBeenCalledWith('user1');
        });

        it('should return 400 if required fields are missing', async () => {
            // Make request with missing fields
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'New Ticket'
                    // Missing amount and userId
                });

            // Assertions
            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Name, amount, and userId are required');
        });

        it('should return 404 if user is not found', async () => {
            // Setup user mock to return null
            mockUser.findById.mockResolvedValue(null);

            // Make request
            const response = await request(app)
                .post('/api/admin/tickets')
                .send({
                    name: 'New Ticket',
                    amount: 75,
                    userId: 'nonexistent'
                });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('User not found');
        });

        it('should get all tickets with pagination', async () => {
            // Mock data
            const mockTickets = [
                {
                    _id: 'ticket1',
                    name: 'Parking Violation',
                    amount: 50,
                    user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
                }
            ];

            // Setup mocks
            mockTicket.countDocuments.mockResolvedValue(1);
            mockTicket.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockTickets)
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('tickets');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination.total).toBe(1);
            expect(response.body.pagination.currentPage).toBe(1);
            expect(response.body.pagination.totalPages).toBe(1);
        });

        it('should filter tickets by userId and isPaid', async () => {
            // Setup mocks
            mockTicket.countDocuments.mockResolvedValue(1);
            mockTicket.find.mockReturnValue({
                populate: jest.fn().mockReturnThis(),
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'ticket1' }])
            });

            // Make request with query parameters
            await request(app).get('/api/admin/tickets?userId=user1&isPaid=true');

            // Verify the query was correctly constructed
            expect(mockTicket.find).toHaveBeenCalledWith({
                user: 'user1',
                isPaid: true
            });
        });

        it('should get a ticket by ID', async () => {
            // Mock data
            const mockTicketData = {
                _id: 'ticket1',
                name: 'Parking Violation',
                amount: 50,
                user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
            };

            // Setup mock
            mockTicket.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockTicketData)
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockTicketData);
            expect(mockTicket.findById).toHaveBeenCalledWith('ticket1');
        });

        it('should return 404 if ticket not found when getting by ID', async () => {
            // Setup mock
            mockTicket.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            // Make request
            const response = await request(app).get('/api/admin/tickets/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        it('should update a ticket', async () => {
            // Mock data
            const updatedTicket = {
                _id: 'ticket1',
                name: 'Updated Ticket',
                amount: 100,
                user: { _id: 'user1', firstName: 'John', lastName: 'Doe' }
            };

            // Setup mock
            mockTicket.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(updatedTicket)
            });

            // Make request
            const response = await request(app)
                .put('/api/admin/tickets/ticket1')
                .send({
                    name: 'Updated Ticket',
                    amount: 100
                });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ticket updated successfully');
            expect(response.body.ticket).toEqual(updatedTicket);
            expect(mockTicket.findByIdAndUpdate).toHaveBeenCalledWith(
                'ticket1',
                { name: 'Updated Ticket', amount: 100 },
                { new: true }
            );
        });

        it('should return 404 if ticket not found during update', async () => {
            // Setup mock
            mockTicket.findByIdAndUpdate.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            // Make request
            const response = await request(app)
                .put('/api/admin/tickets/nonexistent')
                .send({ name: 'Updated Ticket' });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        it('should delete a ticket', async () => {
            // Setup mock
            mockTicket.findByIdAndDelete.mockResolvedValue({ _id: 'ticket1' });

            // Make request
            const response = await request(app).delete('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Ticket deleted successfully');
            expect(mockTicket.findByIdAndDelete).toHaveBeenCalledWith('ticket1');
        });

        it('should return 404 if ticket not found during deletion', async () => {
            // Setup mock
            mockTicket.findByIdAndDelete.mockResolvedValue(null);

            // Make request
            const response = await request(app).delete('/api/admin/tickets/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Ticket not found');
        });

        it('should handle server error when deleting a ticket', async () => {
            // Setup mock to throw error
            mockTicket.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).delete('/api/admin/tickets/ticket1');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Server error');
        });
    });
});