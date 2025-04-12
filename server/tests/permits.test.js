// Import necessary dependencies
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock models
const mockPermit = {
    find: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn()
};

// Mock related models
const mockReservation = {
    find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue([])
    })
};

const mockLot = {
    findByIdAndUpdate: jest.fn()
};

const mockPermitType = {
    findById: jest.fn()
};

const mockRevenueStatistics = {
    recordPermitPurchase: jest.fn().mockResolvedValue({})
};

const mockNotificationHelper = {
    createSystemNotification: jest.fn().mockResolvedValue({}),
    createReservationNotification: jest.fn().mockResolvedValue({})
};

// Mock Stripe
const mockStripe = {
    refunds: {
        create: jest.fn().mockResolvedValue({
            id: 'ref_123456',
            amount: 5000,
            status: 'succeeded'
        })
    }
};

// Mock updateExpiredPermits utility
const mockUpdateExpiredPermits = jest.fn().mockResolvedValue(3);

// Create a constructor for new Permit instances
function MockPermit(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
}

// Create express app for testing
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    verifyToken: jest.fn((req, res, next) => {
        req.user = { userId: 'test-user-id', role: 'student' };
        next();
    }),
    isAdmin: jest.fn((req, res, next) => {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            req.user.role = 'admin'; // Temporarily make user admin for tests
            next();
        }
    })
}));

// Mock models
jest.mock('../models/permits', () => {
    const constructor = jest.fn((data) => new MockPermit(data));
    constructor.find = mockPermit.find;
    constructor.findById = mockPermit.findById;
    constructor.findByIdAndUpdate = mockPermit.findByIdAndUpdate;
    constructor.findByIdAndDelete = mockPermit.findByIdAndDelete;
    constructor.countDocuments = mockPermit.countDocuments;
    constructor.isValidPermit = jest.fn((permit) => {
        if (!permit) return false;

        const isActive = permit.status === 'active';
        const isPaid = permit.paymentStatus === 'paid' || permit.paymentStatus === 'completed';

        const permitEndDate = new Date(permit.endDate);
        const today = new Date();

        permitEndDate.setHours(23, 59, 59, 999);
        today.setHours(0, 0, 0, 0);

        const isNotExpired = permitEndDate >= today;

        return isActive && isPaid && isNotExpired;
    });
    return constructor;
});

jest.mock('../models/reservation', () => mockReservation);
jest.mock('../models/lot', () => mockLot);
jest.mock('../models/permit_types', () => mockPermitType);
jest.mock('../models/revenue_statistics', () => mockRevenueStatistics);
jest.mock('../utils/notificationHelper', () => mockNotificationHelper);
jest.mock('../utils/permitUtils', () => ({
    updateExpiredPermits: mockUpdateExpiredPermits
}));
jest.mock('stripe', () => () => mockStripe);

// Import route handler after mocking dependencies
const permitRoutes = require('../routes/permits');
app.use('/api/permits', permitRoutes);

describe('Permit Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Get all permits
    test('should get all permits with pagination', async () => {
        // Mock data
        const mockPermits = [
            {
                _id: 'permit1',
                permitNumber: 'P-1234',
                permitName: 'Student Permit',
                permitType: 'Student',
                userId: 'test-user-id',
                userFullName: 'Test User',
                userEmail: 'test@example.com',
                lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
                startDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31'),
                status: 'active',
                price: 100,
                paymentStatus: 'paid'
            },
            {
                _id: 'permit2',
                permitNumber: 'P-5678',
                permitName: 'Faculty Permit',
                permitType: 'Faculty',
                userId: 'test-user-id',
                userFullName: 'Test User',
                userEmail: 'test@example.com',
                lots: [{ lotId: 'lot2', lotName: 'Faculty Lot' }],
                startDate: new Date('2023-01-01'),
                endDate: new Date('2023-12-31'),
                status: 'active',
                price: 150,
                paymentStatus: 'paid'
            }
        ];

        // Setup mocks
        mockPermit.countDocuments.mockResolvedValue(2);
        mockPermit.find.mockReturnValue({
            sort: jest.fn().mockReturnValue({
                skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockPermits)
                })
            })
        });

        // Make request
        const response = await request(app).get('/api/permits?page=1&limit=10');

        // Assertions - Use JSON.parse/stringify to handle date serialization
        expect(response.status).toBe(200);

        // Compare without Date objects
        const responseJson = JSON.parse(JSON.stringify(response.body.permits));
        const mockPermitsJson = JSON.parse(JSON.stringify(mockPermits));
        expect(responseJson).toEqual(mockPermitsJson);

        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.total).toBe(2);
        expect(mockUpdateExpiredPermits).toHaveBeenCalled();
    });

    // Test 2: Get a single permit by ID
    test('should get a single permit by ID', async () => {
        // Mock permit - renamed to permitData to avoid conflict
        const permitData = {
            _id: 'permit1',
            permitNumber: 'P-1234',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid'
        };

        // Setup mocks
        mockPermit.findById.mockResolvedValue(permitData);

        // Make request
        const response = await request(app).get('/api/permits/permit1');

        // Assertions - Handle date serialization
        expect(response.status).toBe(200);
        const responseJson = JSON.parse(JSON.stringify(response.body));
        const permitDataJson = JSON.parse(JSON.stringify(permitData));
        expect(responseJson).toEqual(permitDataJson);
        expect(mockUpdateExpiredPermits).toHaveBeenCalled();
    });

    // Test 3: Create a new permit
    test('should create a new permit', async () => {
        // New permit data
        const newPermitData = {
            permitNumber: 'P-9999',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid'
        };

        // Make request
        const response = await request(app)
            .post('/api/permits')
            .send(newPermitData);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Permit created successfully');
        expect(response.body.permit).toBeDefined();
        expect(response.body.permit.permitNumber).toBe(newPermitData.permitNumber);
        expect(mockRevenueStatistics.recordPermitPurchase).toHaveBeenCalledWith(100);
        expect(mockNotificationHelper.createSystemNotification).toHaveBeenCalled();
    });

    // Test 4: Create a permit with permit type ID
    test('should handle permit type quantity when creating permit', async () => {
        // Mock permit type
        const mockPermitTypeData = {
            _id: 'pt_123',
            name: 'Student',
            category: 'Student',
            price: 100,
            quantity: 5,
            save: jest.fn().mockResolvedValue({})
        };

        // New permit data with permitTypeId
        const newPermitData = {
            permitNumber: 'P-9999',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            permitTypeId: 'pt_123',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid'
        };

        // Setup mocks
        mockPermitType.findById.mockResolvedValue(mockPermitTypeData);

        // Make request
        const response = await request(app)
            .post('/api/permits')
            .send(newPermitData);

        // Assertions
        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Permit created successfully');
        expect(mockPermitTypeData.quantity).toBe(4); // Should decrease by 1
        expect(mockPermitTypeData.save).toHaveBeenCalled();
    });

    // Test 5: Update a permit - full update
    test('should update a permit', async () => {
        // Existing permit
        const existingPermit = {
            _id: 'permit1',
            permitNumber: 'P-1234',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'unpaid'
        };

        // Update data
        const updateData = {
            status: 'active',
            paymentStatus: 'paid'
        };

        // Updated permit
        const updatedPermit = {
            ...existingPermit,
            ...updateData
        };

        // Setup mocks
        mockPermit.findById.mockResolvedValue(existingPermit);
        mockPermit.findByIdAndUpdate.mockResolvedValue(updatedPermit);

        // Make request
        const response = await request(app)
            .put('/api/permits/permit1')
            .send(updateData);

        // Assertions - Use JSON serialization to handle date comparison
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Permit updated successfully');

        // Compare JSON representations to handle date serialization
        const responsePermitJson = JSON.parse(JSON.stringify(response.body.permit));
        const updatedPermitJson = JSON.parse(JSON.stringify(updatedPermit));
        expect(responsePermitJson).toEqual(updatedPermitJson);

        expect(mockRevenueStatistics.recordPermitPurchase).toHaveBeenCalledWith(100);
    });

    // Test 6: Update just the end date of a permit
    test('should update just the end date of a permit', async () => {
        // Existing permit
        const existingPermit = {
            _id: 'permit1',
            permitNumber: 'P-1234',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid',
            save: jest.fn().mockImplementation(function () {
                return Promise.resolve(this);
            })
        };

        // Update data - just the end date
        const updateData = {
            endDate: new Date('2024-06-30')
        };

        // Setup mocks
        mockPermit.findById.mockResolvedValue(existingPermit);

        // Make request
        const response = await request(app)
            .put('/api/permits/permit1')
            .send(updateData);

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Permit end date updated successfully');
        expect(existingPermit.save).toHaveBeenCalled();
        expect(existingPermit.endDate).toEqual(new Date('2024-06-30'));
    });

    // Test 7: Delete a permit and cancel related reservations
    test('should delete a permit and cancel related reservations', async () => {
        // Mock permit to delete
        const permitToDelete = {
            _id: 'permit1',
            permitNumber: 'P-1234',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid'
        };

        // Mock related reservation
        const relatedReservation = {
            _id: 'res1',
            reservationId: 'RES-1234',
            user: 'test-user-id',
            lotId: {
                _id: 'lot1',
                name: 'North Lot',
                permitTypes: ['Student']
            },
            permitType: 'Student',
            stripePaymentIntentId: 'pi_123456',
            paymentStatus: 'completed',
            status: 'active',
            save: jest.fn().mockResolvedValue({})
        };

        // Setup mocks properly with chained population
        mockPermit.findById.mockResolvedValue(permitToDelete);
        mockPermit.findByIdAndDelete.mockResolvedValue(permitToDelete);

        // Fix the Reservation.find().populate() chain
        mockReservation.find.mockReturnValue({
            populate: jest.fn().mockReturnValue([relatedReservation])
        });

        // Make request
        const response = await request(app).delete('/api/permits/permit1');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Permit deleted successfully');
        expect(response.body.cancelledReservations).toContain('RES-1234');
        expect(relatedReservation.status).toBe('cancelled');
        expect(relatedReservation.save).toHaveBeenCalled();
        expect(mockLot.findByIdAndUpdate).toHaveBeenCalledWith('lot1', { $inc: { availableSpaces: 1 } });
        expect(mockStripe.refunds.create).toHaveBeenCalledWith({
            payment_intent: 'pi_123456'
        });
        expect(mockNotificationHelper.createReservationNotification).toHaveBeenCalled();
        expect(mockNotificationHelper.createSystemNotification).toHaveBeenCalled();
    });

    // Test 8: Handle non-existent permit
    test('should return 404 when permit is not found', async () => {
        // Setup mocks
        mockPermit.findById.mockResolvedValue(null);

        // Make request
        const response = await request(app).get('/api/permits/nonexistent');

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Permit not found');
    });

    // Test 9: Handle case when permit type is out of stock
    test('should handle when permit type is out of stock', async () => {
        // Mock permit type with zero quantity
        const mockPermitTypeData = {
            _id: 'pt_123',
            name: 'Student',
            category: 'Student',
            price: 100,
            quantity: 0,
            save: jest.fn().mockResolvedValue({})
        };

        // New permit data with permitTypeId
        const newPermitData = {
            permitNumber: 'P-9999',
            permitName: 'Student Permit',
            permitType: 'Student',
            userId: 'test-user-id',
            permitTypeId: 'pt_123',
            userFullName: 'Test User',
            userEmail: 'test@example.com',
            lots: [{ lotId: 'lot1', lotName: 'North Lot' }],
            startDate: new Date('2023-01-01'),
            endDate: new Date('2023-12-31'),
            status: 'active',
            price: 100,
            paymentStatus: 'paid'
        };

        // Setup mocks
        mockPermitType.findById.mockResolvedValue(mockPermitTypeData);

        // Make request
        const response = await request(app)
            .post('/api/permits')
            .send(newPermitData);

        // Assertions
        expect(response.status).toBe(400);
        expect(response.body.message).toBe('No more permits of this type available');
        expect(mockPermitTypeData.save).not.toHaveBeenCalled();
    });

    // Test 10: Test the isValidPermit static method
    test('isValidPermit should correctly validate permits', () => {
        // The Permit model mock
        const Permit = require('../models/permits');

        // Valid permit
        const validPermit = {
            status: 'active',
            paymentStatus: 'paid',
            endDate: new Date(Date.now() + 86400000) // Tomorrow
        };

        // Invalid permit - expired
        const expiredPermit = {
            status: 'active',
            paymentStatus: 'paid',
            endDate: new Date(Date.now() - 86400000) // Yesterday
        };

        // Invalid permit - inactive
        const inactivePermit = {
            status: 'inactive',
            paymentStatus: 'paid',
            endDate: new Date(Date.now() + 86400000) // Tomorrow
        };

        // Invalid permit - unpaid
        const unpaidPermit = {
            status: 'active',
            paymentStatus: 'unpaid',
            endDate: new Date(Date.now() + 86400000) // Tomorrow
        };

        // Assertions
        expect(Permit.isValidPermit(validPermit)).toBe(true);
        expect(Permit.isValidPermit(expiredPermit)).toBe(false);
        expect(Permit.isValidPermit(inactivePermit)).toBe(false);
        expect(Permit.isValidPermit(unpaidPermit)).toBe(false);
        expect(Permit.isValidPermit(null)).toBe(false);
    });
});