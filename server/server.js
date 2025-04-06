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

    const app = express();
    const PORT = process.env.PORT || 5000;
    const JWT_SECRET = process.env.JWT_SECRET;

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

    // Start server with better error handling
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Health check available at: http://localhost:${PORT}/health`);
        console.log(`API endpoint example: http://localhost:${PORT}/api/login`);
    });

    // Handle server errors
    server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
            console.error(`Port ${PORT} is already in use. Try a different port.`);
        } else {
            console.error('Server error:', error);
        }
        process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

} catch (error) {
    console.error('Fatal error during server initialization:', error);
    process.exit(1);
}