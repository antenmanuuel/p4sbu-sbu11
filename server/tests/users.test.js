const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Setup mocks BEFORE requiring the models
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('mongoose');

// Create mock implementations for models
const mockUserMethods = {
    findById: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn().mockResolvedValue(100),
    aggregate: jest.fn()
};

const mockUserActivityMethods = {
    find: jest.fn(),
    create: jest.fn(),
    logActivity: jest.fn().mockResolvedValue({})
};

const mockNotificationMethods = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndDelete: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn()
};

// Mock the User model
jest.mock('../models/users', () => {
    function MockUser(data) {
        this._id = data?._id || 'mockUserId';
        this.firstName = data?.firstName || 'John';
        this.lastName = data?.lastName || 'Doe';
        this.email = data?.email || 'john@example.com';
        this.password = data?.password || 'hashedPassword';
        this.userType = data?.userType || 'student';
        this.sbuId = data?.sbuId || '12345678';
        this.phone = data?.phone || '';
        this.address = data?.address || '';
        this.isApproved = data?.isApproved !== undefined ? data.isApproved : true;
        this.stripeCustomerId = data?.stripeCustomerId || null;
        this.defaultPaymentMethodId = data?.defaultPaymentMethodId || null;
        this.createdAt = data?.createdAt || new Date();
        this.save = jest.fn().mockResolvedValue(this);
    }

    // Add static methods to the constructor
    Object.assign(MockUser, mockUserMethods);
    return MockUser;
});

// Mock UserActivity model
jest.mock('../models/user_activity', () => {
    const mock = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data)
    }));

    // Add static methods
    Object.assign(mock, mockUserActivityMethods);
    return mock;
});

// Mock Notification model
jest.mock('../models/notification', () => {
    const mock = jest.fn().mockImplementation((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(data)
    }));

    // Add static methods
    Object.assign(mock, mockNotificationMethods);
    return mock;
});

// Now we can safely require the models
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const Notification = require('../models/notification');

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

// Setup mock Stripe
const mockStripe = {
    customers: {
        create: jest.fn().mockResolvedValue({ id: 'cus_mock123456' }),
        list: jest.fn().mockResolvedValue({ data: [] })
    },
    paymentMethods: {
        list: jest.fn().mockResolvedValue({
            data: [
                {
                    id: 'pm_123456',
                    card: {
                        brand: 'visa',
                        last4: '4242',
                        exp_month: 12,
                        exp_year: 2025
                    }
                }
            ]
        }),
        attach: jest.fn().mockResolvedValue({}),
        detach: jest.fn().mockResolvedValue({}),
        retrieve: jest.fn().mockResolvedValue({
            id: 'pm_123456',
            card: {
                brand: 'visa',
                last4: '4242',
                exp_month: 12,
                exp_year: 2025
            }
        })
    },
    paymentIntents: {
        create: jest.fn().mockResolvedValue({
            id: 'pi_mock123456',
            status: 'succeeded',
            client_secret: 'secret_mock',
            charges: { data: [{ receipt_url: 'https://mock-receipt.url' }] }
        })
    },
    refunds: {
        create: jest.fn().mockResolvedValue({
            id: 'ref_mock123456',
            amount: 1000,
            status: 'succeeded'
        })
    }
};

jest.mock('stripe', () => () => mockStripe);

// Mock mongoose.Types.ObjectId
mongoose.Types = {
    ObjectId: jest.fn().mockImplementation((id) => id)
};

// Create a shared mock for Reservation aggregate
const mockReservationAggregate = jest.fn();

// Add the missing mock for PermitSchema.statics.isValidPermit
jest.mock('../models/permits', () => {
    // Create a mock permit model
    const mockPermitModel = function (data) {
        return data;
    };

    // Add the required static method that's causing the error
    mockPermitModel.isValidPermit = jest.fn().mockReturnValue(true);

    // Add aggregate method that's needed for billing history
    mockPermitModel.aggregate = jest.fn().mockResolvedValue([
        {
            _id: 'permit1',
            date: new Date(),
            description: 'Student Permit',
            amount: 100,
            status: 'paid',
            type: 'permit'
        }
    ]);

    return mockPermitModel;
});

// Create a more consistent structure for mocks
const permitFindMock = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
            {
                _id: 'permit1',
                createdAt: new Date(),
                permitName: 'Student Permit',
                price: 100,
                paymentStatus: 'paid',
                lots: [{ lotId: { name: 'Faculty Lot' } }],
                startDate: new Date(),
                endDate: new Date(Date.now() + 86400000 * 30)
            }
        ])
    })
});

const reservationFindMock = jest.fn().mockReturnValue({
    populate: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
            {
                _id: 'reservation1',
                createdAt: new Date(),
                reservationId: '12345678',
                totalPrice: 10.50,
                paymentStatus: 'paid',
                lotId: { name: 'North Lot', rateType: 'Hourly', hourlyRate: 2.5 },
                startTime: new Date(),
                endTime: new Date(Date.now() + 3600000)
            }
        ])
    })
});

// Mock mongoose models with consistent functions 
mongoose.model = jest.fn().mockImplementation((modelName) => {
    if (modelName === 'Reservation') {
        return {
            aggregate: mockReservationAggregate,
            find: reservationFindMock
        };
    }
    if (modelName === 'Permit') {
        return {
            find: permitFindMock,
            aggregate: jest.fn().mockResolvedValue([])
        };
    }
    if (modelName === 'Lot') {
        return {}; // Basic mock for Lot if needed
    }
    return {}; // Default mock for other models
});

// Setup test app
const app = express();
app.use(express.json());

// Import routes
const userRoutes = require('../routes/users');
app.use('/api/user', userRoutes);

describe('User Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset the aggregate mock before each test involving it
        mockReservationAggregate.mockClear();
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

            mockUserMethods.findById.mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            const res = await request(app).get('/api/user/profile');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('_id', 'mockUserId');
            expect(mockUserMethods.findById).toHaveBeenCalledWith('mockUserId');
        });

        it('should return 404 if user not found', async () => {
            mockUserMethods.findById.mockReturnValue({
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
            mockUserMethods.findById
                .mockResolvedValueOnce(mockUser)
                .mockReturnValueOnce({
                    select: jest.fn().mockResolvedValue({
                        ...mockUser,
                        phone: '555-555-5555'
                    })
                });

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
            expect(mockUserActivityMethods.logActivity).toHaveBeenCalled();
        });

        it('should return 404 if user not found', async () => {
            mockUserMethods.findById.mockResolvedValue(null);

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
            mockUserMethods.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);

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
            expect(mockUserActivityMethods.logActivity).toHaveBeenCalled();
        });

        it('should return 400 if current password is incorrect', async () => {
            mockUserMethods.findById.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(false);

            const res = await request(app)
                .put('/api/user/change-password')
                .send({
                    currentPassword: 'wrongPassword',
                    newPassword: 'newPassword'
                });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Current password is incorrect');
            expect(mockUserActivityMethods.logActivity).toHaveBeenCalled();
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

            mockUserActivityMethods.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    limit: jest.fn().mockResolvedValue(mockActivities)
                })
            });

            const res = await request(app).get('/api/user/activity');

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(2);
            expect(mockUserActivityMethods.find).toHaveBeenCalledWith({ user: 'mockUserId' });
        });
    });

    // Tests for billing history
    describe('GET /api/user/billing-history', () => {
        beforeEach(() => {
            // Reset mocks before each test
            permitFindMock.mockClear();
            reservationFindMock.mockClear();
        });

        it('should get user billing history successfully', async () => {
            // Make the request
            const res = await request(app).get('/api/user/billing-history');

            // Verify the response
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('billingHistory');
            expect(Array.isArray(res.body.billingHistory)).toBe(true);

            // Verify that the find methods were called
            expect(permitFindMock).toHaveBeenCalled();
            expect(reservationFindMock).toHaveBeenCalled();
        });

        it('should handle errors when fetching billing history', async () => {
            // Make the permit find throw an error for this test only
            permitFindMock.mockImplementationOnce(() => {
                throw new Error('Database error');
            });

            // Make the request
            const res = await request(app).get('/api/user/billing-history');

            // Verify the error response
            expect(res.status).toBe(500);
            expect(res.body).toHaveProperty('success', false);
            expect(res.body).toHaveProperty('message', 'Server error');
        });
    });

    // Tests for payment methods
    describe('GET /api/user/payment-methods', () => {
        it('should get user payment methods successfully', async () => {
            mockUserMethods.findById.mockResolvedValue({
                _id: 'mockUserId',
                stripeCustomerId: 'cus_123456',
                defaultPaymentMethodId: 'pm_123456'
            });

            const res = await request(app).get('/api/user/payment-methods');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('paymentMethods');
            expect(Array.isArray(res.body.paymentMethods)).toBe(true);
            expect(mockStripe.paymentMethods.list).toHaveBeenCalledWith({
                customer: 'cus_123456',
                type: 'card'
            });
        });

        it('should return empty array if user has no Stripe customer ID', async () => {
            mockUserMethods.findById.mockResolvedValue({
                _id: 'mockUserId'
            });

            const res = await request(app).get('/api/user/payment-methods');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('paymentMethods');
            expect(res.body.paymentMethods).toEqual([]);
        });

        it('should return 404 if user not found', async () => {
            mockUserMethods.findById.mockResolvedValue(null);

            const res = await request(app).get('/api/user/payment-methods');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('POST /api/user/payment-methods', () => {
        it('should save a new payment method with existing customer', async () => {
            const mockUser = {
                _id: 'mockUserId',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                stripeCustomerId: 'cus_123456',
                defaultPaymentMethodId: null,
                save: jest.fn().mockResolvedValue()
            };

            mockUserMethods.findById.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/user/payment-methods')
                .send({
                    paymentMethodId: 'pm_123456',
                    isDefault: true
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('paymentMethod');
            expect(mockStripe.paymentMethods.attach).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should create a new customer and save payment method', async () => {
            const mockUser = {
                _id: 'mockUserId',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                stripeCustomerId: null,
                save: jest.fn().mockResolvedValue()
            };

            mockUserMethods.findById.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/user/payment-methods')
                .send({
                    paymentMethodId: 'pm_123456',
                    isDefault: true
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(mockStripe.customers.create).toHaveBeenCalled();
            expect(mockStripe.paymentMethods.attach).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should return 400 if payment method ID is missing', async () => {
            const res = await request(app)
                .post('/api/user/payment-methods')
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Payment method ID is required');
        });
    });

    describe('DELETE /api/user/payment-methods/:paymentMethodId', () => {
        it('should delete a payment method successfully', async () => {
            const mockUser = {
                _id: 'mockUserId',
                stripeCustomerId: 'cus_123456',
                defaultPaymentMethodId: 'pm_123456',
                save: jest.fn().mockResolvedValue()
            };

            mockUserMethods.findById.mockResolvedValue(mockUser);

            const res = await request(app)
                .delete('/api/user/payment-methods/pm_123456');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(mockStripe.paymentMethods.detach).toHaveBeenCalledWith('pm_123456');
            expect(mockStripe.paymentMethods.list).toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should return 400 if user has no customer ID', async () => {
            mockUserMethods.findById.mockResolvedValue({
                _id: 'mockUserId'
            });

            const res = await request(app)
                .delete('/api/user/payment-methods/pm_123456');

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'No payment methods found for this user');
        });
    });

    // Tests for notifications
    describe('GET /api/user/notifications', () => {
        it('should get user notifications successfully', async () => {
            const mockNotifications = [
                {
                    _id: 'notification1',
                    user: 'mockUserId',
                    message: 'Test notification',
                    isRead: false,
                    createdAt: new Date()
                }
            ];

            mockNotificationMethods.find.mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockNotifications)
                    })
                })
            });

            mockNotificationMethods.countDocuments
                .mockResolvedValueOnce(5)  // Unread count
                .mockResolvedValueOnce(10); // Total count

            const res = await request(app).get('/api/user/notifications');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('notifications');
            expect(res.body).toHaveProperty('unreadCount', 5);
            expect(res.body).toHaveProperty('totalCount', 10);
            expect(mockNotificationMethods.find).toHaveBeenCalled();
            expect(mockNotificationMethods.countDocuments).toHaveBeenCalledTimes(2);
        });
    });

    describe('PUT /api/user/notifications/:notificationId/read', () => {
        it('should mark a notification as read', async () => {
            const mockNotification = {
                _id: 'notification1',
                user: 'mockUserId',
                message: 'Test notification',
                isRead: false,
                save: jest.fn().mockResolvedValue()
            };

            mockNotificationMethods.findOne.mockResolvedValue(mockNotification);

            const res = await request(app)
                .put('/api/user/notifications/notification1/read');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Notification marked as read');
            expect(mockNotification.isRead).toBe(true);
            expect(mockNotification.save).toHaveBeenCalled();
        });

        it('should return 404 if notification not found', async () => {
            mockNotificationMethods.findOne.mockResolvedValue(null);

            const res = await request(app)
                .put('/api/user/notifications/notification1/read');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Notification not found');
        });
    });

    describe('PUT /api/user/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            mockNotificationMethods.updateMany.mockResolvedValue({ modifiedCount: 5 });

            const res = await request(app)
                .put('/api/user/notifications/read-all');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'All notifications marked as read');
            expect(res.body).toHaveProperty('count', 5);
            expect(mockNotificationMethods.updateMany).toHaveBeenCalledWith(
                { user: 'mockUserId', isRead: false },
                { $set: { isRead: true } }
            );
        });
    });

    describe('DELETE /api/user/notifications/:notificationId', () => {
        it('should delete a notification', async () => {
            const mockNotification = {
                _id: 'notification1',
                user: 'mockUserId',
                message: 'Test notification'
            };

            mockNotificationMethods.findOne.mockResolvedValue(mockNotification);
            mockNotificationMethods.findByIdAndDelete.mockResolvedValue({});

            const res = await request(app)
                .delete('/api/user/notifications/notification1');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Notification deleted successfully');
            expect(mockNotificationMethods.findByIdAndDelete).toHaveBeenCalledWith('notification1');
        });

        it('should return 404 if notification not found', async () => {
            mockNotificationMethods.findOne.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/user/notifications/notification1');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Notification not found');
        });
    });
}); 