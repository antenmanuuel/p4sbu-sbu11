const request = require('supertest');
const express = require('express');
const PermitType = require('../models/permit_types');

// Mocks
jest.mock('../models/permit_types');

// Create app instances for admin tests (all routes require admin)
const adminApp = express();
adminApp.use(express.json());

// Mock admin middleware
const adminAuthMiddleware = {
    verifyToken: (req, res, next) => {
        req.user = {
            userId: 'adminUserId',
            email: 'admin@example.com',
            userType: 'admin'
        };
        next();
    },
    isAdmin: (req, res, next) => {
        // For admin, we allow access
        next();
    }
};

// Setup for admin tests
jest.mock('../middleware/auth', () => adminAuthMiddleware);
const adminPermitTypesRoutes = require('../routes/permit_types');
adminApp.use('/api/permit-types', adminPermitTypesRoutes);

describe('Permit Types Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/permit-types', () => {
        it('should get all permit types with pagination', async () => {
            const mockPermitTypes = [
                {
                    id: 'PT001',
                    name: 'Student Regular',
                    category: 'Student',
                    price: 150
                },
                {
                    id: 'PT002',
                    name: 'Faculty Premium',
                    category: 'Faculty',
                    price: 300
                }
            ];

            PermitType.countDocuments = jest.fn().mockResolvedValue(2);
            PermitType.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue(mockPermitTypes)
                    })
                })
            });

            const res = await request(adminApp).get('/api/permit-types');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('permitTypes');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.permitTypes.length).toBe(2);
            expect(res.body.pagination).toHaveProperty('total', 2);
            expect(res.body.pagination).toHaveProperty('currentPage', 1);
        });

        it('should handle search functionality', async () => {
            PermitType.countDocuments = jest.fn().mockResolvedValue(1);
            PermitType.find = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    skip: jest.fn().mockReturnValue({
                        limit: jest.fn().mockResolvedValue([{ id: 'PT001', name: 'Student Regular' }])
                    })
                })
            });

            await request(adminApp).get('/api/permit-types?search=Student');

            expect(PermitType.find).toHaveBeenCalledWith({
                name: { $regex: 'Student', $options: 'i' }
            });
        });
    });

    describe('POST /api/permit-types', () => {
        it('should create a new permit type successfully', async () => {
            // Mock the findOne for generating a new ID
            PermitType.findOne = jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                    exec: jest.fn().mockResolvedValue({
                        id: 'PT005'
                    })
                })
            });

            const mockNewPermitType = {
                id: 'PT006',
                name: 'New Permit Type',
                category: 'Student',
                quantity: 200,
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
                price: 250,
                lots: ['lot1', 'lot2'],
                duration: 'Semester'
            };

            const mockSave = jest.fn().mockResolvedValue(mockNewPermitType);
            PermitType.mockImplementation(() => ({
                save: mockSave,
                ...mockNewPermitType
            }));

            const permitTypeData = {
                name: 'New Permit Type',
                category: 'Student',
                quantity: 200,
                startDate: new Date(),
                endDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
                price: 250,
                lots: ['lot1', 'lot2'],
                duration: 'Semester'
            };

            const res = await request(adminApp)
                .post('/api/permit-types')
                .send(permitTypeData);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('message', 'Permit type created successfully');
            expect(res.body).toHaveProperty('permitType');
            expect(mockSave).toHaveBeenCalledTimes(1);
        });
    });

    describe('PUT /api/permit-types/:id', () => {
        it('should update a permit type successfully', async () => {
            const mockUpdatedPermitType = {
                id: 'PT001',
                name: 'Updated Permit Type',
                category: 'Student',
                price: 275
            };

            PermitType.findOneAndUpdate = jest.fn().mockResolvedValue(mockUpdatedPermitType);

            const res = await request(adminApp)
                .put('/api/permit-types/PT001')
                .send({
                    name: 'Updated Permit Type',
                    price: 275
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Permit type updated successfully');
            expect(res.body).toHaveProperty('permitType');
            expect(res.body.permitType).toEqual(mockUpdatedPermitType);
            expect(PermitType.findOneAndUpdate).toHaveBeenCalledWith(
                { id: 'PT001' },
                {
                    name: 'Updated Permit Type',
                    price: 275
                },
                { new: true }
            );
        });

        it('should return 404 if permit type not found', async () => {
            PermitType.findOneAndUpdate = jest.fn().mockResolvedValue(null);

            const res = await request(adminApp)
                .put('/api/permit-types/nonexistent')
                .send({ name: 'Updated Name' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Permit type not found');
        });
    });

    describe('DELETE /api/permit-types/:id', () => {
        it('should delete a permit type successfully', async () => {
            PermitType.findOneAndDelete = jest.fn().mockResolvedValue({ id: 'PT001' });

            const res = await request(adminApp).delete('/api/permit-types/PT001');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Permit type deleted successfully');
            expect(PermitType.findOneAndDelete).toHaveBeenCalledWith({ id: 'PT001' });
        });

        it('should return 404 if permit type not found', async () => {
            PermitType.findOneAndDelete = jest.fn().mockResolvedValue(null);

            const res = await request(adminApp).delete('/api/permit-types/nonexistent');

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Permit type not found');
        });
    });
}); 