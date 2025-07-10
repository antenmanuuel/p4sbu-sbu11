const request = require('supertest');
const express = require('express');

// Mock the Lot model without using mongoose
const mockLot = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn()
};

// Create a constructor function for new Lot instances
function MockLot(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
}

// Add ability to mock implementation for testing
MockLot.mockImplementation = jest.fn((implementation) => {
    // Store the implementation to use in the constructor
    MockLot._mockImplementation = implementation;
});

// Reset the mock implementation
MockLot.mockReset = () => {
    MockLot._mockImplementation = null;
};

// Create express app
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = { userId: 'test-user-id', userType: 'admin' };
        next();
    },
    isAdmin: (req, res, next) => next()
}));

// Mock express-validator module functions first, before requiring the routes
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

// Mock the Lot model
jest.mock('../models/lot', () => {
    // Create a proper mock with all the needed methods
    const mockConstructor = jest.fn((data) => {
        if (MockLot._mockImplementation) {
            return MockLot._mockImplementation(data);
        }
        return new MockLot(data);
    });

    // Attach the mock methods to the constructor function
    mockConstructor.find = mockLot.find;
    mockConstructor.findById = mockLot.findById;
    mockConstructor.findByIdAndUpdate = mockLot.findByIdAndUpdate;
    mockConstructor.findByIdAndDelete = mockLot.findByIdAndDelete;
    mockConstructor.countDocuments = mockLot.countDocuments;

    return mockConstructor;
});

// Import the actual routes after mocking
const lotsRoutes = require('../routes/lots');
app.use('/api/lots', lotsRoutes);

describe('Lots Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/lots', () => {
        it('should get all lots with pagination', async () => {
            // Mock data
            const mockLots = [
                { _id: 'lot1', name: 'North Lot' },
                { _id: 'lot2', name: 'South Lot' }
            ];

            // Setup mocks
            mockLot.countDocuments.mockResolvedValue(2);
            mockLot.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockLots)
            });

            // Make request
            const response = await request(app).get('/api/lots');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('lots');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination.total).toBe(2);
            expect(mockLot.find).toHaveBeenCalled();
            expect(mockLot.countDocuments).toHaveBeenCalled();
        });

        it('should filter lots by query parameters', async () => {
            // Setup mocks
            mockLot.countDocuments.mockResolvedValue(1);
            mockLot.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'lot1' }])
            });

            // Make request with query parameters
            await request(app).get('/api/lots?status=Active&permitType=Faculty');

            // Verify the query was correctly constructed
            expect(mockLot.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'Active',
                    permitTypes: { $in: ['Faculty'] }
                })
            );
        });

        it('should handle search functionality', async () => {
            // Setup mocks
            mockLot.countDocuments.mockResolvedValue(1);
            mockLot.find.mockReturnValue({
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue([{ _id: 'lot1' }])
            });

            // Make request with search
            await request(app).get('/api/lots?search=north');

            // Verify search query
            expect(mockLot.find).toHaveBeenCalledWith({
                $or: [
                    { name: { $regex: 'north', $options: 'i' } },
                    { address: { $regex: 'north', $options: 'i' } }
                ]
            });
        });

        it('should handle server errors', async () => {
            // Setup mock to throw error
            mockLot.countDocuments.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).get('/api/lots');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to fetch parking lots');
        });
    });

    describe('GET /api/lots/:id', () => {
        it('should get a lot by ID', async () => {
            // Setup mock
            const mockLotData = { _id: 'lot1', name: 'North Lot' };
            mockLot.findById.mockResolvedValue(mockLotData);

            // Make request
            const response = await request(app).get('/api/lots/lot1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('lot');
            expect(response.body.lot).toEqual(mockLotData);
            expect(mockLot.findById).toHaveBeenCalledWith('lot1');
        });

        it('should return 404 if lot not found', async () => {
            // Setup mock
            mockLot.findById.mockResolvedValue(null);

            // Make request
            const response = await request(app).get('/api/lots/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Parking lot not found');
        });

        it('should handle server errors', async () => {
            // Setup mock to throw error
            mockLot.findById.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).get('/api/lots/lot1');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to fetch parking lot');
        });
    });

    describe('POST /api/lots', () => {
        it('should create a new lot', async () => {
            // Setup mock new lot
            const newLot = {
                _id: 'new-lot-id',
                name: 'New Lot',
                address: '123 Test St',
                location: { latitude: 40.7, longitude: -74.0 },
                totalSpaces: 100,
                availableSpaces: 100,
                permitTypes: ['Faculty'],
                status: 'Active',
                lotId: 'LOT-12345-678'
            };

            // Mock the constructor behavior
            MockLot.mockImplementation((data) => {
                return {
                    ...data,
                    ...newLot,
                    save: jest.fn().mockResolvedValue()
                };
            });

            // Make request
            const response = await request(app)
                .post('/api/lots')
                .send({
                    name: 'New Lot',
                    address: '123 Test St',
                    location: { latitude: 40.7, longitude: -74.0 },
                    totalSpaces: 100,
                    availableSpaces: 100,
                    permitTypes: ['Faculty'],
                    status: 'Active'
                });

            // Assertions
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Parking lot created successfully');
            expect(response.body.lot).toMatchObject({
                name: 'New Lot',
                address: '123 Test St'
            });
        });

        it('should handle server errors during creation', async () => {
            // Setup mock to throw error on save
            MockLot.mockImplementation(() => {
                return {
                    save: jest.fn().mockRejectedValue(new Error('Database error'))
                };
            });

            // Make request
            const response = await request(app)
                .post('/api/lots')
                .send({
                    name: 'New Lot',
                    address: '123 Test St',
                    location: { latitude: 40.7, longitude: -74.0 },
                    totalSpaces: 100,
                    availableSpaces: 100,
                    permitTypes: ['Faculty'],
                    status: 'Active'
                });

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Failed to create parking lot');
        });
    });

    describe('PUT /api/lots/:id', () => {
        it('should update a lot', async () => {
            // Setup mocks
            const existingLot = {
                _id: 'lot1',
                name: 'Original Lot',
                totalSpaces: 50,
                availableSpaces: 30
            };

            const updatedLot = {
                ...existingLot,
                name: 'Updated Lot',
                totalSpaces: 100
            };

            mockLot.findById.mockResolvedValue(existingLot);
            mockLot.findByIdAndUpdate.mockResolvedValue(updatedLot);

            // Make request
            const response = await request(app)
                .put('/api/lots/lot1')
                .send({
                    name: 'Updated Lot',
                    totalSpaces: 100
                });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Lot updated successfully');
            expect(response.body.lot).toEqual(updatedLot);
            expect(mockLot.findByIdAndUpdate).toHaveBeenCalledWith(
                'lot1',
                { $set: expect.objectContaining({ name: 'Updated Lot', totalSpaces: 100 }) },
                { new: true, runValidators: true }
            );
        });

        it('should return 404 if lot not found', async () => {
            // Setup mock
            mockLot.findById.mockResolvedValue(null);

            // Make request
            const response = await request(app)
                .put('/api/lots/nonexistent')
                .send({ name: 'Updated Lot' });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Lot not found');
        });

        it('should handle server errors', async () => {
            // Setup mocks to throw error
            mockLot.findById.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app)
                .put('/api/lots/lot1')
                .send({ name: 'Updated Lot' });

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error updating lot');
        });
    });

    describe('PATCH /api/lots/:id/status', () => {
        it('should update a lot status', async () => {
            // Setup mock
            const updatedLot = {
                _id: 'lot1',
                name: 'Test Lot',
                status: 'Maintenance'
            };
            mockLot.findByIdAndUpdate.mockResolvedValue(updatedLot);

            // Make request
            const response = await request(app)
                .patch('/api/lots/lot1/status')
                .send({ status: 'Maintenance' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('lot');
            expect(response.body.lot.status).toBe('Maintenance');
            expect(mockLot.findByIdAndUpdate).toHaveBeenCalledWith(
                'lot1',
                { status: 'Maintenance' },
                { new: true, runValidators: true }
            );
        });

        it('should return 404 if lot not found', async () => {
            // Setup mock
            mockLot.findByIdAndUpdate.mockResolvedValue(null);

            // Make request
            const response = await request(app)
                .patch('/api/lots/nonexistent/status')
                .send({ status: 'Maintenance' });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Parking lot not found');
        });

        it('should handle server errors', async () => {
            // Setup mock to throw error
            mockLot.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app)
                .patch('/api/lots/lot1/status')
                .send({ status: 'Maintenance' });

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to update lot status');
        });
    });

    describe('DELETE /api/lots/:id', () => {
        it('should delete a lot', async () => {
            // Setup mock
            mockLot.findByIdAndDelete.mockResolvedValue({ _id: 'lot1' });

            // Make request
            const response = await request(app).delete('/api/lots/lot1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Parking lot deleted successfully');
            expect(mockLot.findByIdAndDelete).toHaveBeenCalledWith('lot1');
        });

        it('should return 404 if lot not found', async () => {
            // Setup mock
            mockLot.findByIdAndDelete.mockResolvedValue(null);

            // Make request
            const response = await request(app).delete('/api/lots/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body.message).toBe('Parking lot not found');
        });

        it('should handle server errors', async () => {
            // Setup mock to throw error
            mockLot.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).delete('/api/lots/lot1');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body.message).toBe('Failed to delete parking lot');
        });
    });
}); 