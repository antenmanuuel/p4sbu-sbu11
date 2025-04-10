// TP: this .js file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 


const express = require('express');
const router = express.Router();
const Ticket = require('../models/tickets');
const User = require('../models/users');
const RevenueStatistics = require('../models/revenue_statistics');
const { verifyToken, isAdmin } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const NotificationHelper = require('../utils/notificationHelper');

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

// Create a new ticket (admin)
router.post('/admin/tickets', verifyToken, isAdmin, async (req, res) => {
    try {
        const { name, amount, userId } = req.body;

        if (!name || !amount || !userId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const ticket = new Ticket({
            name,
            amount,
            date_posted: new Date(),
            isPaid: false,
            user: userId,
            canPetition: true
        });

        const savedTicket = await ticket.save();

        // Create a notification for the user
        try {
            await NotificationHelper.createFineNotification(
                userId,
                savedTicket,
                '/past-citations'
            );
            console.log('Notification created for new ticket');
        } catch (notificationError) {
            console.error('Error creating notification for ticket:', notificationError);
            // Continue even if notification creation fails
        }

        res.status(201).json(savedTicket);
    } catch (error) {
        console.error('Error creating ticket:', error);
        res.status(500).json({ message: 'Error creating ticket' });
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