const request = require('supertest');
const express = require('express');
const Ticket = require('../models/tickets');

// Mock ticket model
jest.mock('../models/tickets', () => ({
    aggregate: jest.fn()
}));

// Setup express app
const app = express();
app.use(express.json());

// Mock auth middleware
jest.mock('../middleware/auth', () => ({
    verifyToken: (req, res, next) => {
        req.user = {
            userId: 'admin-user-id',
            email: 'admin@example.com',
            userType: 'admin'
        };
        next();
    },
    verifyAdmin: (req, res, next) => next(),
    isAdmin: (req, res, next) => next()
}));

// Import statistics routes
const statisticsRoutes = require('../routes/statistics');
app.use('/api/admin/statistics', statisticsRoutes);

describe('Statistics Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/admin/statistics/revenue', () => {
        it('should get revenue statistics data for last 4 months', async () => {
            // Mock data for all tickets (including unpaid)
            const mockAllTickets = [
                {
                    _id: { year: 2023, month: 11 },
                    totalCitations: 5000,
                    totalCount: 50
                },
                {
                    _id: { year: 2023, month: 12 },
                    totalCitations: 7500,
                    totalCount: 75
                },
                {
                    _id: { year: 2024, month: 1 },
                    totalCitations: 6000,
                    totalCount: 60
                },
                {
                    _id: { year: 2024, month: 2 },
                    totalCitations: 8000,
                    totalCount: 80
                }
            ];

            // Mock data for paid tickets only
            const mockPaidTickets = [
                {
                    _id: { year: 2023, month: 11 },
                    paidAmount: 3000,
                    count: 30
                },
                {
                    _id: { year: 2023, month: 12 },
                    paidAmount: 4500,
                    count: 45
                },
                {
                    _id: { year: 2024, month: 1 },
                    paidAmount: 3500,
                    count: 35
                },
                {
                    _id: { year: 2024, month: 2 },
                    paidAmount: 5000,
                    count: 50
                }
            ];

            // Setup aggregate mock to return different values on each call
            Ticket.aggregate
                .mockResolvedValueOnce(mockAllTickets)    // First call returns all tickets
                .mockResolvedValueOnce(mockPaidTickets);  // Second call returns paid tickets

            // Make request
            const response = await request(app).get('/api/admin/statistics/revenue');

            // Assertions
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('revenueData');
            expect(Array.isArray(response.body.revenueData)).toBe(true);
            expect(response.body.revenueData.length).toBe(4); // Last 4 months

            // Check if data structure is correct
            const dataPoint = response.body.revenueData[0];
            expect(dataPoint).toHaveProperty('month');
            expect(dataPoint).toHaveProperty('year');
            expect(dataPoint).toHaveProperty('value');
            expect(dataPoint).toHaveProperty('permits');
            expect(dataPoint).toHaveProperty('citations');
            expect(dataPoint).toHaveProperty('other');

            // Verify the aggregation calls
            expect(Ticket.aggregate).toHaveBeenCalledTimes(2);
            expect(Ticket.aggregate).toHaveBeenNthCalledWith(1, expect.arrayContaining([
                expect.objectContaining({
                    $group: expect.objectContaining({
                        _id: expect.any(Object),
                        totalCitations: expect.any(Object),
                        totalCount: expect.any(Object)
                    })
                })
            ]));
            expect(Ticket.aggregate).toHaveBeenNthCalledWith(2, expect.arrayContaining([
                expect.objectContaining({
                    $match: { isPaid: true }
                })
            ]));
        });

        it('should handle errors when fetching revenue statistics', async () => {
            // Mock error
            Ticket.aggregate.mockRejectedValue(new Error('Database error'));

            // Make request
            const response = await request(app).get('/api/admin/statistics/revenue');

            // Assertions
            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('message', 'Server error');
        });
    });
}); 