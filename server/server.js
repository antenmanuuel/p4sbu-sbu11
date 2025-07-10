// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

// Reference: https://docs.stripe.com/webhooks?lang=node

/**
 * This file sets up the Express server, middleware, routes, and database connection
 * for the SBU Parking Management System. It handles API endpoints, authentication,
 * webhook integrations, and serves the frontend in production.
 */

//  ENVIRONMENT CONFIGURATION 
// Load environment variables from .env file to make them accessible via process.env
require('dotenv').config();

// Add detailed error handling for module loading using a try-catch block to gracefully
// handle any errors during initialization and prevent server crashes
try {
    //  CORE DEPENDENCIES 
    // Express: Web framework for Node.js
    const express = require('express');
    // CORS: middleware to enable API access from different domains
    const cors = require('cors');
    // Database connection utility
    const { connectDB } = require('./config/db');
    const mongoose = require('mongoose');

    //  ROUTE IMPORTS 
    // Import all route handlers to organize API endpoints by functionality
    const authRoutes = require('./routes/auth');             // Authentication routes (login, register)
    const userRoutes = require('./routes/users');            // User profile management
    const adminRoutes = require('./routes/admin');           // Admin-only functionality
    const ticketRoutes = require('./routes/tickets');        // Parking tickets management
    const statisticsRoutes = require('./routes/statistics'); // Data analysis and reports
    const lotsRoutes = require('./routes/lots');             // Multiple parking lots operations
    const lotRoutes = require('./routes/lot');               // Single lot operations
    const permitTypeRoutes = require('./routes/permit_types');  // Permit type management
    const permitRoutes = require('./routes/permits');        // User permit management
    const reservationRoutes = require('./routes/reservations'); // Parking spot reservations
    const carRoutes = require('./routes/cars');              // User's registered vehicles
    const revenueStatisticsRoutes = require('./routes/statistics'); // Financial reporting
    const contactRoutes = require('./routes/contact');       // Contact form and support
    const eventParkingRoutes = require('./routes/eventParking'); // Special event parking requests
    const chatbotRoutes = require('./routes/chatbot');       // Chatbot API endpoints

    //  UTILITY IMPORTS 
    // Path: For file path operations, used for serving static files
    const path = require('path');

    // Import utilities for background maintenance tasks
    // Used to automatically expire permits and reservations when they reach end date
    const { updateExpiredPermits } = require('./utils/permitUtils');
    const { updateExpiredReservations } = require('./utils/reservationUtils');

    //  PAYMENT PROCESSING SETUP 
    // Initialize Stripe payment processing API
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    //  EXPRESS APPLICATION SETUP 
    // Create Express application instance
    const app = express();
    // Set server port, defaulting to 5000 if not specified in environment
    const PORT = process.env.PORT || 5000;
    // JWT secret for authentication tokens
    const JWT_SECRET = process.env.JWT_SECRET;

    //  CONFIGURATION VALIDATION 
    // Check if Stripe keys are set to ensure payment functionality works
    if (!process.env.STRIPE_SECRET_KEY) {
        console.warn('Stripe secret key not provided. Payment processing will be limited.');
    } else {
        console.log('Stripe API configured successfully');
    }

    // Debug logging to verify environment configuration
    console.log('Environment variables loaded:');
    console.log('PORT:', PORT);
    console.log('JWT_SECRET exists:', !!JWT_SECRET);
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

    // Critical security check - ensure JWT secret is defined
    // Without this, authentication would be compromised
    if (!JWT_SECRET) {
        console.error('ERROR: JWT_SECRET is not set in environment variables');
        process.exit(1); // Exit with error code if JWT secret is missing
    }

    //  CORS CONFIGURATION 
    // Enhanced CORS setup to allow requests only from authorized origins
    const corsOptions = {
        origin: function (origin, callback) {
            // List of domains allowed to access the API
            const allowedOrigins = [
                'http://localhost:3000',  // React development server
                'http://localhost:5173',  // Vite development server
                process.env.CLIENT_URL,   // Dynamic client URL from environment variable
                process.env.NODE_ENV === 'production' ? 'https://p4sbu-parking-app.herokuapp.com' : null, // Production URL
            ].filter(Boolean); // Remove null/undefined values

            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                // Log and block unauthorized origins for security
                console.warn(`CORS blocked request from origin: ${origin}`);
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,                // Allow cookies and authentication headers
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], // Allowed HTTP methods
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], // Allowed headers
        exposedHeaders: ['Content-Length', 'X-Content-Type-Options'], // Headers clients can read
        preflightContinue: false,         // Handle OPTIONS requests internally
        optionsSuccessStatus: 204         // Return 204 for successful OPTIONS requests
    };

    //  MIDDLEWARE SETUP 
    // Apply CORS middleware to all routes
    app.use(cors(corsOptions));

    //  STRIPE WEBHOOK HANDLING 
    // This specific stripe code block references stripe api docs examples (https://docs.stripe.com/webhooks?lang=node)
    // TP: ChatGPT participated/contributed to this webhook code block by modifying/optimizing and formatting initial version was written by Student based on Stripe API Doc example
    // TP: Additionally, it added descriptive comments for readability purposes. 

    /**
     * Stripe webhook endpoint for handling payment events
     * Must be defined before the express.json() middleware because Stripe requires the raw request body
     * This endpoint processes payment success and failure events and updates reservations accordingly
     */
    app.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
        let event;

        try {
            if (webhookSecret) {
                // Verify the event with the webhook secret to ensure it's from Stripe
                const signature = req.headers['stripe-signature'];
                event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
            } else {
                // If no webhook secret is defined, use the event as-is (not recommended for production)
                event = req.body;
            }
        } catch (err) {
            // Handle webhook signature verification failure
            console.error(`Webhook signature verification failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        // Handle different payment event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                // Payment was successful - update reservation status
                const paymentIntent = event.data.object;
                console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
                try {
                    // Update the reservation associated with this payment
                    const Reservation = require('./models/reservation');
                    const updatedReservation = await Reservation.findOneAndUpdate(
                        { stripePaymentIntentId: paymentIntent.id }, // Find by Stripe payment ID
                        {
                            paymentStatus: 'completed',  // Mark payment as completed
                            status: 'active',            // Activate the reservation
                            stripeReceiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null // Store receipt URL
                        },
                        { new: true } // Return the updated document
                    );
                    if (updatedReservation) {
                        console.log(`Updated reservation status: ${updatedReservation.reservationId}`);
                    }
                } catch (err) {
                    console.error('Error updating reservation from webhook:', err);
                }
                break;
            case 'payment_intent.payment_failed':
                // Payment failed - update reservation to reflect failure
                const failedPaymentIntent = event.data.object;
                console.error(`Payment failed: ${failedPaymentIntent.last_payment_error?.message}`);
                try {
                    // Update the reservation to indicate payment failure
                    const Reservation = require('./models/reservation');
                    const updatedReservation = await Reservation.findOneAndUpdate(
                        { stripePaymentIntentId: failedPaymentIntent.id },
                        {
                            paymentStatus: 'failed',  // Mark payment as failed
                            status: 'pending'         // Keep reservation in pending state
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
                // Log unhandled event types for debugging
                console.log(`Unhandled event type ${event.type}`);
        }

        // Return a 200 response to acknowledge receipt of the event
        // This prevents Stripe from resending the webhook
        res.send();
    });

    //  JSON PARSING MIDDLEWARE 
    // Must be after the Stripe webhook handler which needs the raw body
    app.use(express.json());

    //  REQUEST LOGGING MIDDLEWARE 
    // Log all incoming requests for debugging and monitoring
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl}`);
        next(); // Pass control to the next middleware
    });

    //  DATABASE CONNECTION 
    // Connect to MongoDB using the configuration in config/db.js
    connectDB();

    //  API ROUTES REGISTRATION 
    // Register all route handlers with their respective URL prefixes
    app.use('/api', authRoutes);                    // Authentication routes (login/register)
    app.use('/api/user', userRoutes);               // User profile management
    app.use('/api/admin', adminRoutes);             // Admin dashboard and operations
    app.use('/api', ticketRoutes);                  // Parking tickets management
    app.use('/api/admin/statistics', statisticsRoutes); // Admin analytics endpoints
    app.use('/api/lots', lotsRoutes);               // Multiple parking lots operations
    app.use('/api/lot', lotRoutes);                 // Single parking lot operations
    app.use('/api/permit-types', permitTypeRoutes); // Permit type configuration
    app.use('/api/permits', permitRoutes);          // User permit management
    app.use('/api/reservations', reservationRoutes); // Parking spot reservations
    app.use('/api/cars', carRoutes);                // Registered vehicles management
    app.use('/api/statistics', revenueStatisticsRoutes); // General statistics endpoints
    app.use('/api/contact', contactRoutes);         // Contact and support messaging
    app.use('/api/event-parking', eventParkingRoutes); // Special event parking requests
    app.use('/api/chatbot', chatbotRoutes);         // Chatbot API endpoints

    //  HEALTH CHECK ENDPOINT 
    // Simple endpoint to verify the server is running
    // Used by monitoring systems and load balancers
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', message: 'Server is running' });
    });

    //  PRODUCTION CONFIGURATION 
    // Serve static files from React app in production environment
    if (process.env.NODE_ENV === 'production') {
        console.log(`Serving static files from: ${path.join(__dirname, '../client/dist')}`);

        // Serve static files (JS, CSS, images) from the React build folder
        app.use(express.static(path.join(__dirname, '../client/dist'), {
            setHeaders: (res, path) => {
                // Set proper MIME types for different file types
                // This ensures browsers interpret the files correctly
                if (path.endsWith('.js')) {
                    res.set('Content-Type', 'application/javascript');
                    console.log(`Setting Content-Type for JS file: ${path}`);
                } else if (path.endsWith('.mjs')) {
                    res.set('Content-Type', 'application/javascript');
                    console.log(`Setting Content-Type for MJS file: ${path}`);
                } else if (path.endsWith('.css')) {
                    res.set('Content-Type', 'text/css');
                    console.log(`Setting Content-Type for CSS file: ${path}`);
                }
            }
        }));

        // Handle React routing by serving index.html for all non-API routes
        // This enables client-side routing with React Router
        app.get('*', (req, res) => {
            console.log(`Serving index.html for path: ${req.originalUrl}`);
            res.sendFile(path.join(__dirname, '../client/dist/index.html'));
        });
    }

    //  ERROR HANDLING 
    // 404 handler for routes that don't exist
    app.use((req, res) => {
        console.log(`404 Not Found: ${req.originalUrl}`);
        res.status(404).json({ message: 'Route not found' });
    });

    // Global error handler for all uncaught exceptions in routes
    app.use((err, req, res, next) => {
        console.error('Server error:', err);
        res.status(err.status || 500).json({
            message: err.message || 'An unexpected error occurred',
            // Only show detailed error in development, not in production (security best practice)
            error: process.env.NODE_ENV === 'production' ? {} : err
        });
    });

    // TP: ClaudeAI was given initial Student-written code and suggested/modified startServer logic to include signal logic for failures/connection closed etc.

    /**
     * Server startup function with port fallback mechanism
     * Attempts to start the server on the specified port, and if that port is in use,
     * it tries the next port number up to a maximum number of attempts
     * 
     * @param {number} initialPort - The port to try first
     */
    const startServer = async (initialPort) => {
        let port = initialPort;
        let attemptCount = 0;
        const maxAttempts = 5;  // Maximum number of ports to try

        while (attemptCount < maxAttempts) {
            try {
                // Attempt to start the server on the current port
                const server = app.listen(port, () => {
                    console.log(`Server running on port ${port}`);
                    console.log(`API endpoint available at http://localhost:${port}/api`);
                });

                //  GRACEFUL SHUTDOWN HANDLING 
                // Setup proper shutdown on SIGTERM signal (e.g., Heroku shutdown)
                // This ensures all connections are closed properly
                process.on('SIGTERM', () => {
                    console.log('SIGTERM signal received: closing HTTP server');
                    server.close(() => {
                        console.log('HTTP server closed');
                        // Close MongoDB connection to prevent data corruption
                        mongoose.connection.close(false, () => {
                            console.log('MongoDB connection closed');
                            process.exit(0);
                        });
                    });
                });

                //  MAINTENANCE TASKS 
                // Process expired permits and reservations on server startup
                await updateExpiredPermits();
                await updateExpiredReservations();

                //  SCHEDULED TASKS 
                // Schedule a daily check for expired permits and reservations
                const HOURS_24 = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
                setInterval(async () => {
                    console.log('Running scheduled check for expired permits and reservations...');
                    try {
                        // Update status of expired permits
                        const updatedPermitCount = await updateExpiredPermits();
                        // Update status of expired reservations
                        const updatedReservationCount = await updateExpiredReservations();
                        console.log(`Scheduled check complete. Updated ${updatedPermitCount} expired permits and ${updatedReservationCount} expired reservations.`);
                    } catch (error) {
                        console.error('Error in scheduled expiration check:', error);
                    }
                }, HOURS_24);

                console.log('Scheduled daily check for expired permits and reservations');

                break; // Successfully started server, exit the loop
            } catch (error) {
                // Handle port already in use error by trying the next port
                if (error.code === 'EADDRINUSE') {
                    attemptCount++;
                    console.log(`Port ${port} is already in use. Trying port ${port + 1}...`);
                    port++;
                } else {
                    // For other errors, log and exit
                    console.error('Error starting server:', error);
                    process.exit(1);
                }
            }
        }

        // If we couldn't find an available port after max attempts, exit
        if (attemptCount >= maxAttempts) {
            console.error(`Could not find an available port after ${maxAttempts} attempts.`);
            process.exit(1);
        }
    };

    //  START SERVER 
    // Initialize the server with the configured port
    if (process.env.VERCEL) {
        module.exports = app;
    } else {
        startServer(PORT);
    }

} catch (error) {
    console.error('Fatal error during server initialization:', error);
    process.exit(1);
}