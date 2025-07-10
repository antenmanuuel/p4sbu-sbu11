// TP: this .js file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

/**
 * This module defines API routes for managing parking citation tickets, including:
 * - User routes for viewing and paying issued tickets
 * - Admin routes for creating, managing, and tracking tickets
 * - Payment processing through Stripe for citation payments
 * - Notification and email systems for communicating ticket status
 * - Revenue tracking for paid citations
 * 
 * Citations/tickets represent violations issued to users, which can be paid
 * through various payment methods and contribute to parking system revenue.
 */

const express = require('express');
const router = express.Router();
const Ticket = require('../models/tickets');
const User = require('../models/users');
const RevenueStatistics = require('../models/revenue_statistics');
const { verifyToken, isAdmin } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');
const emailService = require('../services/emailService');

// Initialize Stripe with conditional logic to handle tests
let stripe;
if (process.env.STRIPE_SECRET_KEY) {
    // Use the real Stripe with the API key
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else if (process.env.NODE_ENV === 'test') {
    // Create a mock Stripe for testing
    console.log('Creating mock Stripe instance for testing');
    stripe = {
        customers: {
            create: jest.fn().mockResolvedValue({ id: 'cus_mock123456' }),
            list: jest.fn().mockResolvedValue({ data: [] })
        },
        paymentMethods: {
            list: jest.fn().mockResolvedValue({ data: [] }),
            attach: jest.fn().mockResolvedValue({})
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
} else {
    // Fallback for other environments without a key - log error and provide minimal mock
    console.error('STRIPE_SECRET_KEY not found and not in test environment. Creating minimal mock.');
    stripe = {
        customers: { create: () => ({ id: 'mock_customer_id' }), list: () => ({ data: [] }) },
        paymentMethods: { list: () => ({ data: [] }), attach: () => ({}) },
        paymentIntents: { create: () => ({ id: 'mock_payment_intent_id', status: 'failed' }) },
        refunds: { create: () => ({ id: 'mock_refund_id', status: 'failed' }) }
    };
}

// USER TICKET ROUTES

/**
 * GET /api/tickets/user/tickets
 * 
 * Retrieves all tickets (citations) for the currently authenticated user
 * Sorted by creation date with most recent tickets first
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Array} - List of ticket objects belonging to the user
 */
router.get('/user/tickets', verifyToken, async (req, res) => {
    try {
        const tickets = await Ticket.find({ user: req.user.userId }).sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching tickets' });
    }
});

/**
 * POST /api/tickets/user/tickets/:ticketId/pay
 * 
 * Processes payment for a specific ticket
 * Supports credit card payments via Stripe or student account payments
 * Updates ticket status, sends notifications, and records revenue
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} ticketId - ID of the ticket to pay
 * @body {string} [paymentMethodId] - Stripe payment method ID for credit card payments
 * @returns {Object} - Updated ticket information and payment details
 */
router.post('/user/tickets/:ticketId/pay', verifyToken, async (req, res) => {
    try {
        const ticket = await Ticket.findOne({
            _id: req.params.ticketId,
            user: req.user.userId
        }).populate('user');

        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        if (ticket.isPaid) {
            return res.status(400).json({ message: 'Ticket is already paid' });
        }

        // Create a payment intent with Stripe if paymentMethodId is provided
        let paymentIntent = null;
        const { paymentMethodId } = req.body;

        if (paymentMethodId) {
            try {
                // Check if user has a Stripe customer ID
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // Log for debugging
                console.log('Processing payment for ticket:', {
                    ticketId: ticket._id,
                    amount: ticket.amount,
                    paymentMethodId,
                    userStripeCustomerId: user.stripeCustomerId
                });

                // First determine if we need to create/attach a payment method
                let stripeCustomerId = user.stripeCustomerId;
                let paymentMethodBelongsToCustomer = false;

                if (stripeCustomerId) {
                    // Check if the payment method belongs to this customer
                    try {
                        const paymentMethods = await stripe.paymentMethods.list({
                            customer: stripeCustomerId,
                            type: 'card',
                        });

                        paymentMethodBelongsToCustomer = paymentMethods.data.some(pm => pm.id === paymentMethodId);
                        console.log(`Payment method ${paymentMethodId} belongs to customer? ${paymentMethodBelongsToCustomer}`);
                    } catch (listError) {
                        console.error('Error checking payment methods:', listError);
                    }

                    if (!paymentMethodBelongsToCustomer) {
                        // Attach the payment method to the customer
                        try {
                            await stripe.paymentMethods.attach(paymentMethodId, {
                                customer: stripeCustomerId,
                            });
                            console.log('Payment method attached to customer');
                        } catch (attachError) {
                            console.error('Error attaching payment method:', attachError);
                            // If this fails, we'll continue and let Stripe handle it in the PaymentIntent
                        }
                    }
                } else {
                    // Create a customer for the user if they don't have one
                    try {
                        const customer = await stripe.customers.create({
                            email: user.email,
                            name: `${user.firstName} ${user.lastName}`,
                            metadata: {
                                userId: user._id.toString()
                            }
                        });

                        // Update the user with the new customer ID
                        stripeCustomerId = customer.id;
                        user.stripeCustomerId = stripeCustomerId;
                        await user.save();
                        console.log('Created new Stripe customer:', stripeCustomerId);

                        // Attach the payment method to the customer
                        await stripe.paymentMethods.attach(paymentMethodId, {
                            customer: stripeCustomerId,
                        });
                        console.log('Payment method attached to new customer');
                    } catch (customerError) {
                        console.error('Error creating customer:', customerError);
                        return res.status(400).json({
                            message: 'Payment processing failed - unable to create customer',
                            error: customerError.message
                        });
                    }
                }

                // Now create the payment intent with the customer ID
                const paymentOptions = {
                    amount: Math.round(ticket.amount * 100), // Stripe uses cents
                    currency: 'usd',
                    customer: stripeCustomerId, // Always include customer ID with the payment method
                    payment_method: paymentMethodId,
                    confirm: true,
                    description: `Citation payment for ${ticket.name}`,
                    metadata: {
                        ticketId: ticket._id.toString(),
                        studentId: ticket.user.studentId || 'N/A',
                        violationType: ticket.name
                    },
                    // Add configuration to prevent redirect issues
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                };

                if (ticket.user.email) {
                    paymentOptions.receipt_email = ticket.user.email;
                }

                // Create the payment intent
                console.log('Creating payment intent with options:', paymentOptions);
                paymentIntent = await stripe.paymentIntents.create(paymentOptions);
                console.log('Payment intent created:', paymentIntent.id);

                // Store payment info with the ticket
                ticket.stripePaymentIntentId = paymentIntent.id;
                ticket.paymentMethod = 'credit-card';
            } catch (stripeError) {
                console.error('Stripe payment failed:', stripeError);
                return res.status(400).json({
                    message: 'Payment processing failed',
                    error: stripeError.message
                });
            }
        } else {
            // If no payment method ID, assume student account payment
            ticket.paymentMethod = 'student-account';
        }

        // Update ticket status
        ticket.isPaid = true;
        ticket.paidAt = new Date();
        await ticket.save();

        // Record the revenue from this ticket payment
        if (ticket.amount > 0) {
            try {
                await RevenueStatistics.recordCitationPayment(ticket.amount);
                console.log(`Recorded revenue for ticket payment: $${ticket.amount}`);
            } catch (revenueError) {
                console.error('Failed to record revenue statistics for ticket:', revenueError);
                // Continue processing even if revenue recording fails
            }
        }

        // Send an email notification about the payment
        try {
            const emailResult = await emailService.sendCitationNotification(
                ticket.user.email,
                ticket,
                true, // isPaid = true
                process.env.CLIENT_BASE_URL || 'http://localhost:5173'
            );
            console.log('Citation payment confirmation email sent:', emailResult.messageId);
        } catch (emailError) {
            console.error('Failed to send citation payment email:', emailError);
            // Continue even if email sending fails
        }

        res.json({
            success: true,
            ticket,
            paymentIntent: paymentIntent ? {
                id: paymentIntent.id,
                clientSecret: paymentIntent.client_secret,
                status: paymentIntent.status,
                receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null
            } : null
        });
    } catch (error) {
        console.error('Error processing citation payment:', error);
        res.status(500).json({ success: false, message: 'Error processing payment', error: error.message });
    }
});

// ADMIN TICKET ROUTES

/**
 * POST /api/tickets/admin/tickets
 * 
 * Creates a new citation ticket for a user
 * Sends notification and email to the cited user
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @body {string} name - Name/description of the violation
 * @body {number} amount - Fine amount for the citation
 * @body {string} userId - ID of the user receiving the citation
 * @returns {Object} - Created ticket information
 */
router.post('/admin/tickets', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, amount, userId } = req.body;

        if (!name || !amount || !userId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create new ticket
        const newTicket = new Ticket({
            name,
            amount: parseFloat(amount),
            user: userId,
            date_posted: new Date(),
            isPaid: false,
            canPetition: true
        });

        // Save ticket
        const savedTicket = await newTicket.save();

        // Try to create notification
        try {
            await NotificationHelper.createFineNotification(
                userId,
                savedTicket._id,
                name,
                parseFloat(amount)
            );
            console.log('Notification created for new ticket');
        } catch (notificationError) {
            console.error('Error creating ticket notification:', notificationError);
            // Continue even if notification fails
        }

        // Find the user associated with this citation
        if (user && user.email) {
            try {
                const emailResult = await emailService.sendCitationNotification(
                    user.email,
                    savedTicket,
                    false, // isPaid = false
                    process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                );
                console.log('Citation notification email sent:', emailResult.messageId);
            } catch (emailError) {
                console.error('Failed to send citation notification email:', emailError);
                // Continue even if email sending fails
            }
        }

        res.status(201).json(savedTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating ticket' });
    }
});

/**
 * GET /api/tickets/admin/tickets
 * 
 * Retrieves a paginated and filterable list of all citation tickets
 * Supports filtering by user and payment status
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} [userId] - Filter tickets by specific user
 * @query {boolean} [isPaid] - Filter tickets by payment status
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of tickets per page
 * @returns {Object} - List of tickets and pagination metadata
 */
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

/**
 * GET /api/tickets/admin/tickets/:ticketId
 * 
 * Retrieves detailed information for a single ticket
 * Includes populated user information
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} ticketId - ID of the ticket to retrieve
 * @returns {Object} - Complete ticket information with user details
 */
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

/**
 * PUT /api/tickets/admin/tickets/:ticketId
 * 
 * Updates an existing ticket's information
 * Can update any fields (amount, status, etc.)
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} ticketId - ID of the ticket to update
 * @body {Object} - Fields to update (all fields optional)
 * @returns {Object} - Success message and updated ticket
 */
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

/**
 * DELETE /api/tickets/admin/tickets/:ticketId
 * 
 * Removes a ticket from the system
 * Permanently deletes the record
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} ticketId - ID of the ticket to delete
 * @returns {Object} - Success message
 */
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