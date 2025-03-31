const express = require('express');
const router = express.Router();
const Ticket = require('../models/tickets');
const User = require('../models/users');
const { verifyToken, isAdmin } = require('../middleware/auth');

// USER TICKET ROUTES

// Get user's tickets
router.get('/user/tickets', verifyToken, async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});

// Pay a ticket
router.post('/user/tickets/:ticketId/pay', verifyToken, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.ticketId,
            user: req.user.userId
        });

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.isPaid) {
            return res.status(400).json({ message: 'Ticket is already paid' });
        }

        // Update ticket status
        ticket.isPaid = true;
        ticket.paidAt = new Date();
        await ticket.save();

        // In a real application with WebSockets, we would emit an event here
        // io.emit('ticketPaid', { ticketId: ticket._id, amount: ticket.amount });

        // For now, we're just updating ticket status without real-time notifications

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Error processing payment' });
    }
});

// ADMIN TICKET ROUTES

// Create a new ticket (admin)
router.post('/admin/tickets', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, amount, userId } = req.body;

        if (!name || !amount || !userId) {
            return res.status(400).json({ message: 'Name, amount, and userId are required' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newTicket = new Ticket({
            name,
            amount,
            user: userId,
            date_posted: new Date(),
            isPaid: false
        });

        await newTicket.save();

        // Populate user data in response
        const ticket = await Ticket.findById(newTicket._id).populate('user', 'firstName lastName email sbuId');

        res.status(201).json({
            message: 'Ticket created successfully',
            ticket
        });
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all tickets (admin)
router.get('/admin/tickets', verifyToken, isAdmin, async (req, res) => {
    try {
        // Support filtering and pagination
        const { userId, isPaid, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * parseInt(limit);

        // Build query based on filters
        const query = {};

        if (userId) {
            query.user = userId;
        }

        if (isPaid !== undefined) {
            query.isPaid = isPaid === 'true';
        }

        // Get total count for pagination
        const total = await Ticket.countDocuments(query);

        // Get tickets with pagination
        const tickets = await Ticket.find(query)
            .populate('user', 'firstName lastName email sbuId')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate total pages
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            tickets,
            pagination: {
                total,
                currentPage: parseInt(page),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get ticket by ID (admin)
router.get('/admin/tickets/:ticketId', verifyToken, isAdmin, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        const ticket = await Ticket.findById(ticketId).populate('user', 'firstName lastName email sbuId');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error('Error fetching ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update ticket (admin)
router.put('/admin/tickets/:ticketId', verifyToken, isAdmin, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;
        const updates = req.body;

        const updatedTicket = await Ticket.findByIdAndUpdate(
            ticketId,
            updates,
            { new: true }
        ).populate('user', 'firstName lastName email sbuId');

        if (!updatedTicket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json({
            message: 'Ticket updated successfully',
            ticket: updatedTicket
        });
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete ticket (admin)
router.delete('/admin/tickets/:ticketId', verifyToken, isAdmin, async (req, res) => {
    try {
        const ticketId = req.params.ticketId;

        // Delete the ticket
        const result = await Ticket.findByIdAndDelete(ticketId);

        if (!result) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        res.status(200).json({
            message: 'Ticket deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting ticket:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 