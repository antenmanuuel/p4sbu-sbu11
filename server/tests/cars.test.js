const request = require('supertest');
const express = require('express');
const { verifyToken } = require('../middleware/auth');

// Mock Car model before requiring it
const mockCarModel = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn()
};

// Mock modules
jest.mock('../models/car', () => {
    // Create a constructor function for our mock
    const MockCar = function (data) {
        this._id = data._id || 'mock-car-id';
        this.plateNumber = data.plateNumber;
        this.stateProv = data.stateProv;
        this.make = data.make;
        this.model = data.model;
        this.color = data.color;
        this.bodyType = data.bodyType;
        this.year = data.year;
        this.userId = data.userId;
        this.save = jest.fn().mockResolvedValue(this);
    };

    // Add static methods to the constructor
    return Object.assign(MockCar, mockCarModel);
});

jest.mock('../middleware/auth', () => ({
    verifyToken: jest.fn((req, res, next) => {
        req.user = { userId: 'test-user-id' };
        next();
    })
}));

// Setup test app
const app = express();
app.use(express.json());

// Import routes after mocking
const carRoutes = require('../routes/cars');
app.use('/api', carRoutes);

describe('Car Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Get all cars for a user
    test('should get all cars for a user', async () => {
        // Mock car data
        const mockCars = [
            {
                _id: 'car1',
                plateNumber: 'ABC123',
                stateProv: 'NY',
                make: 'Toyota',
                model: 'Camry',
                color: 'Blue',
                bodyType: 'Sedan',
                year: '2020',
                userId: 'test-user-id'
            },
            {
                _id: 'car2',
                plateNumber: 'XYZ789',
                stateProv: 'NY',
                make: 'Honda',
                model: 'Civic',
                color: 'Red',
                bodyType: 'Sedan',
                year: '2019',
                userId: 'test-user-id'
            }
        ];

        // Setup the mock find method to return our mock cars
        mockCarModel.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockCars)
        });

        // Make the request
        const response = await request(app).get('/api');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.cars).toBeDefined();
        expect(response.body.cars.length).toBe(2);
        expect(mockCarModel.find).toHaveBeenCalledWith({ userId: 'test-user-id' });
    });

    // Test 2: Create a new car
    test('should create a new car successfully', async () => {
        // Mock car data
        const mockCarData = {
            plateNumber: 'DEF456',
            stateProv: 'NY',
            make: 'Ford',
            model: 'Mustang',
            color: 'Black',
            bodyType: 'Coupe',
            year: '2022'
        };

        // Make the request
        const response = await request(app)
            .post('/api')
            .send(mockCarData);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.car).toBeDefined();
    });

    // Test 3: Update an existing car
    test('should update an existing car', async () => {
        // Mock existing car
        const mockExistingCar = {
            _id: 'car-to-update',
            plateNumber: 'GHI789',
            stateProv: 'NY',
            make: 'Nissan',
            model: 'Altima',
            color: 'Silver',
            bodyType: 'Sedan',
            year: '2018',
            userId: 'test-user-id'
        };

        // Mock updated data
        const mockUpdatedData = {
            color: 'Gold',
            year: '2018'
        };

        // Mock findById and findByIdAndUpdate
        mockCarModel.findById.mockResolvedValue(mockExistingCar);
        mockCarModel.findByIdAndUpdate.mockResolvedValue({
            ...mockExistingCar,
            ...mockUpdatedData
        });

        // Make the request
        const response = await request(app)
            .put('/api/car-to-update')
            .send(mockUpdatedData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.car).toBeDefined();
        expect(response.body.data.car.color).toBe('Gold');
        expect(mockCarModel.findById).toHaveBeenCalledWith('car-to-update');
        expect(mockCarModel.findByIdAndUpdate).toHaveBeenCalledWith(
            'car-to-update',
            expect.objectContaining({
                color: 'Gold',
                userId: 'test-user-id'
            }),
            expect.anything()
        );
    });

    // Test 4: Update a car that doesn't exist
    test('should return 404 if car to update does not exist', async () => {
        // Mock car not found
        mockCarModel.findById.mockResolvedValue(null);

        // Make the request
        const response = await request(app)
            .put('/api/nonexistent-car')
            .send({
                color: 'Purple'
            });

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Car not found');
    });

    // Test 5: Update a car that belongs to a different user
    test('should return 403 if car belongs to a different user', async () => {
        // Mock car belonging to another user
        const mockExistingCar = {
            _id: 'car-to-update',
            plateNumber: 'JKL012',
            userId: 'different-user-id'
        };

        // Mock findById
        mockCarModel.findById.mockResolvedValue(mockExistingCar);

        // Make the request
        const response = await request(app)
            .put('/api/car-to-update')
            .send({
                color: 'Yellow'
            });

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('You do not have permission to update this car');
    });

    // Test 6: Delete a car
    test('should delete a car successfully', async () => {
        // Mock existing car
        const mockExistingCar = {
            _id: 'car-to-delete',
            plateNumber: 'MNO345',
            userId: 'test-user-id'
        };

        // Mock findById and findByIdAndDelete
        mockCarModel.findById.mockResolvedValue(mockExistingCar);
        mockCarModel.findByIdAndDelete.mockResolvedValue({});

        // Make the request
        const response = await request(app)
            .delete('/api/car-to-delete');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Car deleted successfully');
        expect(mockCarModel.findById).toHaveBeenCalledWith('car-to-delete');
        expect(mockCarModel.findByIdAndDelete).toHaveBeenCalledWith('car-to-delete');
    });

    // Test 7: Delete a car that doesn't exist
    test('should return 404 if car to delete does not exist', async () => {
        // Mock car not found
        mockCarModel.findById.mockResolvedValue(null);

        // Make the request
        const response = await request(app)
            .delete('/api/nonexistent-car');

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Car not found');
    });

    // Test 8: Delete a car that belongs to a different user
    test('should return 403 if car to delete belongs to a different user', async () => {
        // Mock car belonging to another user
        const mockExistingCar = {
            _id: 'car-to-delete',
            plateNumber: 'PQR678',
            userId: 'different-user-id'
        };

        // Mock findById
        mockCarModel.findById.mockResolvedValue(mockExistingCar);

        // Make the request
        const response = await request(app)
            .delete('/api/car-to-delete');

        // Assertions
        expect(response.status).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('You do not have permission to delete this car');
    });
}); 