// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

// Reference: https://docs.stripe.com/webhooks?lang=node


// Load environment variables from .env file
require('dotenv').config();

// Add detailed error handling for module loading
try {
    const express = require('express');
    const cors = require('cors');
    const { connectDB } = require('./config/db');

    // Import routes
    const authRoutes = require('./routes/auth');
    const userRoutes = require('./routes/users');
    const adminRoutes = require('./routes/admin');
    const ticketRoutes = require('./routes/tickets');
    const statisticsRoutes = require('./routes/statistics');
    const lotsRoutes = require('./routes/lots');
    const lotRoutes = require('./routes/lot');
    const permitTypeRoutes = require('./routes/permit_types');
    const permitRoutes = require('./routes/permits');
    const reservationRoutes = require('./routes/reservations');
    const carRoutes = require('./routes/cars');
    const revenueStatisticsRoutes = require('./routes/statistics');

    // Import permit utility to check expired permits
    const { updateExpiredPermits } = require('./utils/permitUtils');
    const { updateExpiredReservations } = require('./utils/reservationUtils');

    // Initialize Stripe
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    const app = express();
    const PORT = process.env.PORT || 5000;
    const JWT_SECRET = process.env.JWT_SECRET;

    // Check if Stripe keys are set
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('Stripe secret key not provided. Payment processing will be limited.');
    } else {
        console.log('Stripe API configured successfully');
    }

    // Debug logging
    console.log('Environment variables loaded:');
    console.log('PORT:', PORT);
    console.log('JWT_SECRET exists:', !!JWT_SECRET);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

    // Ensure JWT_SECRET is defined
    if (!JWT_SECRET) {
        console.error('ERROR: JWT_SECRET is not set in environment variables');
        process.exit(1);
    }

    // Enhanced CORS configuration
    const corsOptions = {
        origin: function (origin, callback) {
            const allowedOrigins = [
                'http://localhost:3000',
                'http://localhost:5173',
            ];

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked request from origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    };

    // Middleware
    app.use(cors(corsOptions));
    // This specific stripe code block references stripe api docs examples (https://docs.stripe.com/webhooks?lang=node)
    // TP: ChatGPT participated/contributed to this webhook code block by modifying/optimizing and formatting initial version was written by Student based on Stripe API Doc example
    // TP: Additionally, it added descriptive comments for readability purposes. 

    // Stripe webhook endpoint for handling payment events
    // Must be defined before the express.json() middleware
    app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => { 
        let event;

        try {
            if (webhookSecret) {
                // Verify the event with the webhook secret
                const signature = req.headers['stripe-signature'];
                event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
            } else {
                // If no webhook secret is defined, use the event as-is
                event = req.body;
            }
        } catch (err) {
            console.error(`Webhook signature verification failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
                try {
                    // Update any associated reservations
                    const Reservation = require('./models/reservation');
                    const updatedReservation = await Reservation.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntent.id },
                        {
                            paymentStatus: 'completed',
                            status: 'active',
                            stripeReceiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null
                        },
                        { new: true }
                    );
                    if (updatedReservation) {
                        console.log(`Updated reservation status: ${updatedReservation.reservationId}`);
                    }
                } catch (err) {
                    console.error('Error updating reservation from webhook:', err);
                }
                break;
            case 'payment_intent.payment_failed':
                const failedPaymentIntent = event.data.object;
                console.error(`Payment failed: ${failedPaymentIntent.last_payment_error?.message}`);
                try {
                    // Update any associated reservations
                    const Reservation = require('./models/reservation');
                    const updatedReservation = await Reservation.findOneAndUpdate(
                        { stripePaymentIntentId: failedPaymentIntent.id },
                        {
                            paymentStatus: 'failed',
                            status: 'pending'
                        },
                        { new: true }
                    );
                    if (updatedReservation) {
                        console.log(`Updated reservation with failed payment status: ${updatedReservation.reservationId}`);
                    }
                } catch (err) {
                    console.error('Error updating reservation with failed payment status:', err);
                }
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        res.send();
    });

    // Apply JSON parsing middleware after the webhook
    app.use(express.json());

    // Request logger middleware
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl}`);
        next();
    });

    // Connect to MongoDB
    connectDB();

    // API Routes
    app.use('/api', authRoutes);
    app.use('/api/user', userRoutes);
    app.use('/api/admin', adminRoutes);
    app.use('/api', ticketRoutes);
    app.use('/api/admin/statistics', statisticsRoutes);
    app.use('/api/lots', lotsRoutes);
    app.use('/api/lot', lotRoutes);
    app.use('/api/permit-types', permitTypeRoutes);
    app.use('/api/permits', permitRoutes);
    app.use('/api/reservations', reservationRoutes);
    app.use('/api/cars', carRoutes);
    app.use('/api/statistics', revenueStatisticsRoutes);

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', message: 'Server is running' });
    });

    // Handle 404 errors
    app.use((req, res) => {
        console.log(`404 Not Found: ${req.originalUrl}`);
        res.status(404).json({ message: 'Route not found' });
    });

    // Global error handler
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(err.status || 500).json({
            message: err.message || 'An unexpected error occurred',
            error: process.env.NODE_ENV === 'production' ? {} : err
        });
    });

    // TP: ClaudeAI was given initial Student-written code and suggested/modified startServer logic to include signal logic for failures/connetion closed etc.

    // Server startup with port fallback
    const startServer = async (initialPort) => {
        let port = initialPort;
        let attemptCount = 0;
        const maxAttempts = 5;

        while (attemptCount < maxAttempts) {
            try {
                const server = app.listen(port, () => {
                    console.log(`Server running on port ${port}`);
                    console.log(`API endpoint available at http://localhost:${port}/api`);
                });

                // Setup graceful shutdown
                process.on('SIGTERM', () => {
                    console.log('SIGTERM signal received: closing HTTP server');
                    server.close(() => {
                        console.log('HTTP server closed');
                        // Close MongoDB connection
                        mongoose.connection.close(false, () => {
                            console.log('MongoDB connection closed');
                            process.exit(0);
                        });
                    });
                });

                // Run updateExpiredPermits function
                await updateExpiredPermits();

                // Run updateExpiredReservations function
                await updateExpiredReservations();

                // Schedule a daily check for expired permits
                const HOURS_24 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                setInterval(async () => {
                    console.log('Running scheduled check for expired permits and reservations...');
                    try {
                        const updatedPermitCount = await updateExpiredPermits();
                        const updatedReservationCount = await updateExpiredReservations();
                        console.log(`Scheduled check complete. Updated ${updatedPermitCount} expired permits and ${updatedReservationCount} expired reservations.`);
                    } catch (error) {
                        console.error('Error in scheduled expiration check:', error);
                    }
                }, HOURS_24);

                console.log('Scheduled daily check for expired permits and reservations');

                break; // Successfully started server, exit the loop
            } catch (error) {
                if (error.code === 'EADDRINUSE') {
                    attemptCount++;
                    console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
                    port++;
                } else {
                    console.error('Error starting server:', error);
                    process.exit(1);
                }
            }
        }

        if (attemptCount >= maxAttempts) {
            console.error(`Could not find an available port after ${maxAttempts} attempts.`);
            process.exit(1);
        }
    };

    // Start the server with the configured port
    startServer(PORT);

} catch (error) {
    console.error('Fatal error during server initialization:', error);
    process.exit(1);
}