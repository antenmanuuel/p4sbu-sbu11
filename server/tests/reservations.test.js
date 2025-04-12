// Import necessary dependencies
const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock models with essential functions
const mockReservation = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    countDocuments: jest.fn()
};

const mockLot = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    save: jest.fn()
};

const mockUser = {
    findById: jest.fn()
};

const mockCar = {
    findById: jest.fn(),
    updateMany: jest.fn(),
    save: jest.fn()
};

const mockPermit = {
    find: jest.fn(),
    isValidPermit: jest.fn().mockReturnValue(true),
    save: jest.fn()
};

// Add mock constructor with static method
mockPermit.isValidPermit = jest.fn().mockReturnValue(true);

// Mock Stripe for payment processing
const mockStripe = {
    paymentMethods: {
        list: jest.fn().mockResolvedValue({ data: [] }),
        attach: jest.fn().mockResolvedValue({})
    },
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_123456',
            status: 'succeeded',
            client_secret: 'secret',
            charges: { data: [{ receipt_url: 'https://receipt.url' }] }
        })
    },
    customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_123456' })
    },
    refunds: {
        create: jest.fn().mockResolvedValue({
            id: 'ref_123456',
            amount: 1000,
            status: 'succeeded'
        })
    }
};

// Mock RevenueStatistics
const mockRevenueStatistics = {
    recordMeteredPurchase: jest.fn().mockResolvedValue({}),
    recordRefund: jest.fn().mockResolvedValue({})
};

// Mock PermitType
const mockPermitType = {
    find: jest.fn().mockResolvedValue([]),
    isValidPermitType: jest.fn().mockReturnValue(true)
};

// Add static method to the mock
mockPermitType.isValidPermitType = jest.fn().mockReturnValue(true);

// Mock reservation update utility
const mockUpdateExpiredReservations = jest.fn().mockResolvedValue(3);

// Mock notification helper
const mockNotificationHelper = {
    createReservationNotification: jest.fn().mockResolvedValue({}),
    createSystemNotification: jest.fn().mockResolvedValue({})
};

// Create a constructor for new Reservation instances
function MockReservation(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
    return this;
}

// Create express app
const app = express();
app.use(express.json());

// Helper function for mock chains
const createPopulateMock = (returnValue) => {
    return {
        populate: jest.fn().mockImplementation(() => {
            return {
                populate: jest.fn().mockResolvedValue(returnValue)
            };
        })
    };
};

// Mock all dependencies
jest.mock('../middleware/auth', () => ({
    verifyToken: jest.fn((req, res, next) => {
        req.user = { userId: 'test-user-id' };
        next();
    })
}));

jest.mock('stripe', () => () => mockStripe);

jest.mock('../models/reservation', () => {
    const constructor = jest.fn((data) => new MockReservation(data));
    constructor.find = mockReservation.find;
    constructor.findOne = mockReservation.findOne;
    constructor.findById = mockReservation.findById;
    constructor.findByIdAndUpdate = mockReservation.findByIdAndUpdate;
    constructor.countDocuments = mockReservation.countDocuments;
    return constructor;
});

jest.mock('../models/lot', () => mockLot);
jest.mock('../models/users', () => mockUser);
jest.mock('../models/car', () => {
    const constructor = jest.fn((data) => ({
        ...data,
        _id: 'test-car-id',
        save: jest.fn().mockResolvedValue({ _id: 'test-car-id', ...data })
    }));
    constructor.findById = mockCar.findById;
    constructor.updateMany = mockCar.updateMany;
    return constructor;
});

jest.mock('../models/permits', () => {
    const constructor = mockPermit;
    // Ensure static methods are properly added to the constructor
    constructor.isValidPermit = mockPermit.isValidPermit;
    return constructor;
});
jest.mock('../models/permit_types', () => {
    const constructor = mockPermitType;
    // Ensure static methods are properly added to the constructor
    constructor.isValidPermitType = mockPermitType.isValidPermitType;
    return constructor;
});
jest.mock('../models/revenue_statistics', () => mockRevenueStatistics);
jest.mock('../utils/reservationUtils', () => ({
    updateExpiredReservations: mockUpdateExpiredReservations
}));
jest.mock('../utils/notificationHelper', () => mockNotificationHelper);

// Import the route handler after mocking dependencies
const reservationsRoutes = require('../routes/reservations');
app.use('/api', reservationsRoutes);

describe('Reservation Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Test 1: Creating a new reservation
    test('should create a new reservation successfully', async () => {
        // Mock dependencies for creation flow
        mockUser.findById.mockResolvedValue({
            _id: 'test-user-id',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            stripeCustomerId: 'cus_123456',
            save: jest.fn().mockResolvedValue({})
        });

        mockLot.findById.mockResolvedValue({
            _id: 'test-lot-id',
            name: 'Test Lot',
            availableSpaces: 10,
            rateType: 'Hourly',
            hourlyRate: 2.50,
            permitTypes: ['Standard'],
            save: jest.fn().mockResolvedValue({})
        });

        mockCar.findById.mockResolvedValue({
            _id: 'test-car-id',
            plateNumber: 'ABC123',
            make: 'Toyota',
            model: 'Camry',
            color: 'Blue',
            userId: 'test-user-id'
        });

        // Mock stripe payment methods and customer methods
        mockStripe.paymentMethods.list.mockResolvedValue({
            data: []
        });

        // Mock empty permits array (for checking existing permits)
        mockPermit.find.mockResolvedValue([]);

        // Make the request
        const response = await request(app)
            .post('/api')
            .send({
                lotId: 'test-lot-id',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                vehicleInfo: 'test-car-id',
                paymentInfo: {
                    paymentMethodId: 'pm_123456'
                }
            });

        // Assertions - check only status and response structure to avoid brittle tests
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.reservation).toBeDefined();

        // Verify core dependencies were called
        expect(mockUser.findById).toHaveBeenCalled();
        expect(mockLot.findById).toHaveBeenCalled();
        expect(mockCar.findById).toHaveBeenCalled();
    });

    // Test 2: Creating a reservation with a non-existent lot
    test('should return 404 if lot is not found', async () => {
        // Mock user found but lot not found
        mockUser.findById.mockResolvedValue({
            _id: 'test-user-id',
            firstName: 'Test',
            lastName: 'User'
        });

        mockLot.findById.mockResolvedValue(null);

        // Make the request
        const response = await request(app)
            .post('/api')
            .send({
                lotId: 'nonexistent-lot-id',
                startTime: new Date().toISOString(),
                endTime: new Date(Date.now() + 3600000).toISOString(),
                vehicleInfo: 'test-car-id'
            });

        // Assertions
        expect(response.status).toBe(404);
        expect(response.body.message || response.body.error).toBeDefined();
        expect(mockLot.findById).toHaveBeenCalledWith('nonexistent-lot-id');
    });

    // Test 3: Getting a user's reservations
    test('should get all user reservations', async () => {
        // Mock reservations for the get request
        const mockReservations = [
            {
                _id: 'res1',
                reservationId: 'RES-20240101-1234',
                lotId: 'lot1',
                status: 'active'
            }
        ];

        // Setup the find method to return a properly chained response
        mockReservation.find.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockReservations)
                })
            })
        });

        // Make the request - use the correct endpoint
        const response = await request(app).get('/api');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reservations).toBeDefined();
        expect(mockReservation.find).toHaveBeenCalledWith({ user: 'test-user-id' });
    });

    // Test 4: Getting a specific reservation by ID
    test('should get a specific reservation by ID', async () => {
        // Mock a specific reservation
        const mockReservationData = {
            _id: 'res1',
            reservationId: 'RES-20240101-1234',
            user: 'test-user-id',
            status: 'active'
        };

        // Setup the findOne method with proper chaining
        mockReservation.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockReservationData)
            })
        });

        // Make the request
        const response = await request(app).get('/api/RES-20240101-1234');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.reservation).toBeDefined();
        expect(mockReservation.findOne).toHaveBeenCalledWith({
            reservationId: 'RES-20240101-1234',
            user: 'test-user-id'
        });
    });

    // Test 5: Cancelling a reservation
    test('should cancel a reservation and process refund', async () => {
        // Mock the reservation for cancellation
        const mockReservationData = {
            _id: 'res1',
            reservationId: 'RES-20240101-1234',
            user: 'test-user-id',
            lotId: {
                _id: 'lot1',
                name: 'Test Lot'
            },
            totalPrice: 10.00,
            paymentStatus: 'completed',
            stripePaymentIntentId: 'pi_123456',
            status: 'active',
            save: jest.fn().mockResolvedValue({})
        };

        // Setup the findOne method
        mockReservation.findOne.mockReturnValue({
            populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockReservationData)
            })
        });

        // Make the request
        const response = await request(app)
            .post('/api/RES-20240101-1234/cancel')
            .send({ reason: 'Testing cancellation' });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockStripe.refunds.create).toHaveBeenCalled();
        expect(mockRevenueStatistics.recordRefund).toHaveBeenCalled();
    });

    // Test 6: Extending a reservation
    test('should extend a reservation', async () => {
        // Mock the reservation for extension
        const mockReservationData = {
            _id: 'res1',
            reservationId: 'RES-20240101-1234',
            user: 'test-user-id',
            lotId: {
                _id: 'lot1',
                name: 'Test Lot',
                rateType: 'Hourly',
                hourlyRate: 2.50,
                availableSpaces: 5,
                features: { isMetered: true }
            },
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000),
            totalPrice: 2.50,
            paymentStatus: 'completed',
            stripePaymentIntentId: 'pi_original123',
            status: 'active',
            extensionHistory: [],
            save: jest.fn().mockResolvedValue({})
        };

        // Setup the findOne method with proper population
        mockReservation.findOne.mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockReservationData)
        });

        // User for payment processing
        mockUser.findById.mockResolvedValue({
            _id: 'test-user-id',
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            stripeCustomerId: 'cus_123456',
            save: jest.fn().mockResolvedValue({})
        });

        // Mock Stripe payment methods list
        mockStripe.paymentMethods.list.mockResolvedValue({
            data: [{ id: 'pm_123456' }]
        });

        // Mock successful payment intent
        mockStripe.paymentIntents.create.mockResolvedValue({
            id: 'pi_extension123',
            status: 'succeeded',
            client_secret: 'secret',
            charges: { data: [{ receipt_url: 'https://extension-receipt.url' }] }
        });

        // Make the request - using the correct route path
        const response = await request(app)
            .post('/api/RES-20240101-1234/extend')
            .send({
                additionalHours: 2,
                isMetered: true,
                paymentMethodId: 'pm_123456'
            });

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockReservation.findOne).toHaveBeenCalled();
        expect(mockReservationData.save).toHaveBeenCalled();
        expect(mockStripe.paymentIntents.create).toHaveBeenCalled();
    });

    // Test 7: Check and update expired reservations
    test('should check and update expired reservations', async () => {
        // Make the request
        const response = await request(app).put('/api/check-expired');

        // Assertions
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(mockUpdateExpiredReservations).toHaveBeenCalled();
    });
});