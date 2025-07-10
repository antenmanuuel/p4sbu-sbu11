const request = require('supertest');
const express = require('express');
const User = require('../models/users');
const PermitType = require('../models/permit_types');

// Mocks
jest.mock('../models/users');
jest.mock('../models/permit_types');

// Setup admin app with admin auth middleware
const adminApp = express();
adminApp.use(express.json());

// Mock auth middleware for admin
jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = {
            userId: 'admin-user-id',
            email: 'admin@example.com',
            userType: 'admin'
        };
        next();
    },
    isAdmin: (req, res, next) => {
        // This middleware should only allow admins
        next();
    }
}));

// Import admin routes
const adminRoutes = require('../routes/admin');
adminApp.use('/api', adminRoutes);

describe('Admin Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/pending-users', () => {
        it('should get all users pending approval', async () => {
            // Mock pending users
            const mockPendingUsers = [
                { _id: 'user1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', isApproved: false },
                { _id: 'user2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', isApproved: false }
            ];

            User.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockResolvedValue(mockPendingUsers)
                })
            });

            // Make request
            const response = await request(adminApp).get('/api/pending-users');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockPendingUsers);
            expect(User.find).toHaveBeenCalledWith({ isApproved: false });
        });

        it('should handle server errors', async () => {
            // Mock server error
            User.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockRejectedValue(new Error('Database error'))
                })
            });

            // Make request
            const response = await request(adminApp).get('/api/pending-users');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Server error');
        });
    });

    describe('PUT /api/approve-user/:userId', () => {
        it('should approve a user', async () => {
            // Mock updated user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                isApproved: true
            };

            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request
            const response = await request(adminApp).put('/api/approve-user/user1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User approved successfully');
            expect(response.body).toHaveProperty('user', mockUser);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user1',
                { isApproved: true },
                { new: true }
            );
        });

        it('should return 404 if user not found', async () => {
            // Mock user not found
            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            // Make request
            const response = await request(adminApp).put('/api/approve-user/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('GET /api/users', () => {
        it('should get all users with filtering and pagination', async () => {
            // Mock users
            const mockUsers = [
                {
                    _id: 'user1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    userType: 'student',
                    isApproved: true,
                    createdAt: new Date(),
                    toObject: () => ({
                        _id: 'user1',
                        firstName: 'John',
                        lastName: 'Doe',
                        email: 'john@example.com',
                        userType: 'student',
                        isApproved: true,
                        createdAt: new Date()
                    })
                },
                {
                    _id: 'user2',
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                    userType: 'faculty',
                    isApproved: false,
                    createdAt: new Date(),
                    toObject: () => ({
                        _id: 'user2',
                        firstName: 'Jane',
                        lastName: 'Smith',
                        email: 'jane@example.com',
                        userType: 'faculty',
                        isApproved: false,
                        createdAt: new Date()
                    })
                }
            ];

            User.countDocuments = jest.fn().mockResolvedValue(2);
            User.find = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                    sort: jest.fn().mockReturnValue({
                        skip: jest.fn().mockReturnValue({
                            limit: jest.fn().mockResolvedValue(mockUsers)
                        })
                    })
                })
            });

            // Make request with filters
            const response = await request(adminApp).get('/api/users?status=active&userType=student&search=john');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('users');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('total', 2);
            expect(User.find).toHaveBeenCalled();
            expect(User.countDocuments).toHaveBeenCalled();
        });
    });

    describe('GET /api/users/:userId', () => {
        it('should get user by ID', async () => {
            // Mock user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                userType: 'student',
                isApproved: true
            };

            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request
            const response = await request(adminApp).get('/api/users/user1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockUser);
            expect(User.findById).toHaveBeenCalledWith('user1');
        });

        it('should return 404 if user not found', async () => {
            // Mock user not found
            User.findById = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(null)
            });

            // Make request
            const response = await request(adminApp).get('/api/users/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('PUT /api/users/:userId', () => {
        it('should update a user', async () => {
            // Mock updated user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Smith', // Updated last name
                email: 'john@example.com',
                userType: 'student'
            };

            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request
            const response = await request(adminApp)
                .put('/api/users/user1')
                .send({ lastName: 'Smith' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User updated successfully');
            expect(response.body).toHaveProperty('user', mockUser);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user1',
                { lastName: 'Smith' },
                { new: true }
            );
        });

        it('should not update password through this endpoint', async () => {
            // Mock updated user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            };

            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request with password (should be stripped)
            const response = await request(adminApp)
                .put('/api/users/user1')
                .send({ firstName: 'Johnny', password: 'newpassword123' });

            // Assertions
            expect(response.status).toBe(200);
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user1',
                { firstName: 'Johnny' }, // Password should be removed
                { new: true }
            );
        });
    });

    describe('PUT /api/users/:userId/toggle-status', () => {
        it('should activate a user', async () => {
            // Mock updated user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                isApproved: true
            };

            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request
            const response = await request(adminApp)
                .put('/api/users/user1/toggle-status')
                .send({ status: 'active' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User activated successfully');
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
                'user1',
                { isApproved: true },
                { new: true }
            );
        });

        it('should deactivate a user', async () => {
            // Mock updated user
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                isApproved: false
            };

            User.findByIdAndUpdate = jest.fn().mockReturnValue({
                select: jest.fn().mockResolvedValue(mockUser)
            });

            // Make request
            const response = await request(adminApp)
                .put('/api/users/user1/toggle-status')
                .send({ status: 'inactive' });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User deactivated successfully');
        });

        it('should return 400 for invalid status', async () => {
            // Make request with invalid status
            const response = await request(adminApp)
                .put('/api/users/user1/toggle-status')
                .send({ status: 'invalid' });

            // Assertions
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('message', 'Invalid status provided');
        });
    });

    describe('DELETE /api/users/:userId', () => {
        it('should delete a user', async () => {
            // Mock user to delete
            const mockUser = {
                _id: 'user1',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com'
            };

            User.findById = jest.fn().mockResolvedValue(mockUser);
            User.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'user1' });

            // Make request
            const response = await request(adminApp).delete('/api/users/user1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'User deleted successfully');
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('user1');
        });

        it('should not allow deleting the default admin', async () => {
            // Mock default admin user
            const mockDefaultAdmin = {
                _id: 'admin1',
                email: 'admin@stonybrook.edu'
            };

            User.findById = jest.fn().mockResolvedValue(mockDefaultAdmin);

            // Make request
            const response = await request(adminApp).delete('/api/users/admin1');

            // Assertions
            expect(response.status).toBe(403);
            expect(response.body).toHaveProperty('message', 'Default admin account cannot be deleted');
            expect(User.findByIdAndDelete).not.toHaveBeenCalled();
        });

        it('should return 404 if user not found', async () => {
            // Mock user not found
            User.findById = jest.fn().mockResolvedValue(null);

            // Make request
            const response = await request(adminApp).delete('/api/users/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found');
        });
    });

    // PERMIT TYPE ROUTES
    describe('GET /api/permit-types', () => {
        it('should get all permit types with filtering and pagination', async () => {
            // Mock permit types
            const mockPermitTypes = [
                { _id: 'pt1', name: 'Student Semester', category: 'Student', duration: 'Semester' },
                { _id: 'pt2', name: 'Faculty Annual', category: 'Faculty', duration: 'Annual' }
            ];

            PermitType.countDocuments = jest.fn().mockResolvedValue(2);
            PermitType.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockPermitTypes)
                    })
                })
            });

            // Make request with filters
            const response = await request(adminApp).get('/api/permit-types?category=Student&duration=Semester');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('permitTypes');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.pagination).toHaveProperty('total', 2);
            expect(PermitType.find).toHaveBeenCalled();
            expect(PermitType.countDocuments).toHaveBeenCalled();
        });
    });

    describe('GET /api/permit-types/:permitTypeId', () => {
        it('should get a permit type by ID', async () => {
            // Mock permit type
            const mockPermitType = {
                _id: 'pt1',
                name: 'Student Semester',
                category: 'Student',
                duration: 'Semester',
                price: 150
            };

            PermitType.findById = jest.fn().mockResolvedValue(mockPermitType);

            // Make request
            const response = await request(adminApp).get('/api/permit-types/pt1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toEqual(mockPermitType);
            expect(PermitType.findById).toHaveBeenCalledWith('pt1');
        });

        it('should return 404 if permit type not found', async () => {
            // Mock permit type not found
            PermitType.findById = jest.fn().mockResolvedValue(null);

            // Make request
            const response = await request(adminApp).get('/api/permit-types/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Permit type not found');
        });
    });

    describe('POST /api/permit-types', () => {
        it('should handle server errors during creation', async () => {
            // Mock error during save
            const mockError = new Error('Database error');
            PermitType.mockImplementation(() => ({
                save: jest.fn().mockRejectedValue(mockError)
            }));

            // Make request
            const response = await request(adminApp)
                .post('/api/permit-types')
                .send({
                    name: 'New Permit Type',
                    category: 'Staff'
                });

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Server error');
        });
    });

    describe('PUT /api/permit-types/:permitTypeId', () => {
        it('should update a permit type', async () => {
            // Mock updated permit type
            const mockUpdatedPermitType = {
                _id: 'pt1',
                name: 'Updated Permit Type',
                category: 'Student',
                price: 175
            };

            PermitType.findByIdAndUpdate = jest.fn().mockResolvedValue(mockUpdatedPermitType);

            // Make request
            const response = await request(adminApp)
                .put('/api/permit-types/pt1')
                .send({
                    name: 'Updated Permit Type',
                    price: 175
                });

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Permit type updated successfully');
            expect(response.body).toHaveProperty('permitType', mockUpdatedPermitType);
            expect(PermitType.findByIdAndUpdate).toHaveBeenCalledWith(
                'pt1',
                expect.objectContaining({
                    name: 'Updated Permit Type',
                    price: 175,
                    updatedAt: expect.any(Number)
                }),
                { new: true, runValidators: true }
            );
        });

        it('should return 404 if permit type not found', async () => {
            // Mock permit type not found
            PermitType.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

            // Make request
            const response = await request(adminApp)
                .put('/api/permit-types/nonexistent')
                .send({ name: 'Updated Permit Type' });

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Permit type not found');
        });
    });

    describe('DELETE /api/permit-types/:permitTypeId', () => {
        it('should delete a permit type', async () => {
            // Mock permit type to delete
            const mockPermitType = {
                _id: 'pt1',
                name: 'Student Semester'
            };

            PermitType.findByIdAndDelete = jest.fn().mockResolvedValue(mockPermitType);

            // Make request
            const response = await request(adminApp).delete('/api/permit-types/pt1');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Permit type deleted successfully');
            expect(PermitType.findByIdAndDelete).toHaveBeenCalledWith('pt1');
        });

        it('should return 404 if permit type not found', async () => {
            // Mock permit type not found
            PermitType.findByIdAndDelete = jest.fn().mockResolvedValue(null);

            // Make request
            const response = await request(adminApp).delete('/api/permit-types/nonexistent');

            // Assertions
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('message', 'Permit type not found');
        });
    });
}); 