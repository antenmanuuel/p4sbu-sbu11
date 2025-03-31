const express = require('express');
const router = express.Router();
const Ticket = require('../models/tickets');
const { verifyToken, isAdmin, verifyAdmin } = require('../middleware/auth');

// Get Revenue Statistics (Admin)
router.get('/revenue', verifyToken, verifyAdmin, async (req, res) => {
    try {
        // Get all tickets grouped by month (to count all citations including unpaid ones)
        const allTickets = await Ticket.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: "$date_posted" },
                        month: { $month: "$date_posted" }
                    },
                    totalCitations: { $sum: "$amount" },
                    totalCount: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Get all paid tickets grouped by month (for revenue calculation)
        const paidTickets = await Ticket.aggregate([
            { $match: { isPaid: true } },
            {
                $group: {
                    _id: {
                        year: { $year: "$paidAt" },
                        month: { $month: "$paidAt" }
                    },
                    paidAmount: { $sum: "$amount" },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        // Transform the data into the format expected by the frontend
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const currentDate = new Date();

        // Create a base structure for the last 4 months
        const revenueData = [];
        for (let i = 3; i >= 0; i--) {
            const targetDate = new Date(currentDate);
            targetDate.setMonth(currentDate.getMonth() - i);

            const month = targetDate.getMonth();
            const year = targetDate.getFullYear();

            revenueData.push({
                month: monthNames[month],
                year: year,
                value: 0,
                permits: 30000, // Mock data for now since we don't have real permit revenue
                citations: 0,   // Will include all citations (both paid and unpaid)
                other: 3500     // Mock data for other revenue
            });
        }

        // Fill in the citation amounts from all tickets (including unpaid ones)
        allTickets.forEach(item => {
            const monthIndex = item._id.month - 1; // MongoDB months are 1-based
            const year = item._id.year;

            // Find if this month exists in our revenue data
            const revenueEntry = revenueData.find(entry =>
                entry.month === monthNames[monthIndex] && entry.year === year
            );

            if (revenueEntry) {
                // Set citations to include all tickets (paid and unpaid)
                revenueEntry.citations = item.totalCitations;
            }
        });

        // Calculate revenue values (only including paid citations in the total)
        paidTickets.forEach(item => {
            const monthIndex = item._id.month - 1; // MongoDB months are 1-based
            const year = item._id.year;

            // Find if this month exists in our revenue data
            const revenueEntry = revenueData.find(entry =>
                entry.month === monthNames[monthIndex] && entry.year === year
            );

            if (revenueEntry) {
                // Add paid citations to the total value
                revenueEntry.value = revenueEntry.permits + item.paidAmount + revenueEntry.other;
            }
        });

        // Recalculate total values
        revenueData.forEach(item => {
            if (item.value === 0) {
                // If no paid citations, the value is just permits + other
                item.value = item.permits + item.other;
            }
        });

        res.status(200).json({
            revenueData: revenueData
        });
    } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 