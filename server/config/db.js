/**
 * This module provides functionality for:
 * - Establishing a reliable MongoDB connection with retry logic
 * - Creating initial application data for the database
 * - Setting up event handlers for database connection states
 * - Properly closing database connections on application termination
 * 
 * The module creates default admin users and parking lots when
 * the database is first initialized to ensure the application
 * has baseline data to operate with.
 */

const mongoose = require('mongoose');
const User = require('../models/users');
const Lot = require('../models/lot');

/**
 * Creates a default admin user if none exists in the database
 * 
 * This function ensures there's always at least one admin user
 * available in the system for first-time setup. The default
 * admin credentials are logged to the console for initial access.
 * 
 * @async
 * @returns {Promise<void>}
 */
const createDefaultAdmin = async () => {
    try {
        // Check if admin user already exists
        const adminExists = await User.findOne({ userType: 'admin' });

        if (!adminExists) {
            // Create default admin user
            const adminUser = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@stonybrook.edu',
                password: 'admin123', // Will be hashed by the pre-save hook
                sbuId: '999999999', // Special admin ID
                phone: '',
                userType: 'admin',
                isApproved: true // Admin is automatically approved
            });

            await adminUser.save();
            console.log('Default admin user created successfully');
            console.log('Email: admin@stonybrook.edu');
            console.log('Password: admin123');
        }
    } catch (error) {
        console.error('Error creating default admin user:', error);
    }
};

/**
 * Creates default parking lots if none exist in the database
 * 
 * This function ensures the system has initial parking lot data
 * for testing and demonstration purposes. Each lot is created with
 * default values for capacity, rates, and features.
 * 
 * @async
 * @returns {Promise<void>}
 */
const createDefaultLots = async () => {
    try {
        const lotsCount = await Lot.countDocuments();
        if (lotsCount === 0) {
            const lots = [
                {
                    lotId: 'LOT001',
                    name: 'North P Lot',
                    address: 'im an address 1',
                    description: 'im a description 1',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT002',
                    name: 'South P Lot',
                    address: 'im an address 2',
                    description: 'im a description 2',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT003',
                    name: 'Administration Garage',
                    address: 'im an address 3',
                    description: 'im a description 3',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT004',
                    name: 'Health Sciences Garage',
                    address: 'im an address 4',
                    description: 'im a description 4',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT005',
                    name: 'Chapin Apartments Lot',
                    address: 'im an address 5',
                    description: 'im a description 5',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT006',
                    name: 'Stadium Lot',
                    address: 'im an address 6',
                    description: 'im a description 6',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT007',
                    name: 'West Apartment Lot',
                    address: 'im an address 7',
                    description: 'im a description 7',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT008',
                    name: 'Engineering Lot',
                    address: 'im an address 8',
                    description: 'im a description 8',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT009',
                    name: 'East Campus Lot',
                    address: 'im an address 9',
                    description: 'im a description 9',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                },
                {
                    lotId: 'LOT010',
                    name: 'Visitor Parking Center',
                    address: 'im an address 10',
                    description: 'im a description 10',
                    location: { latitude: 40.922, longitude: -72.124 },
                    totalSpaces: 100,
                    availableSpaces: 42,
                    permitTypes: ['Faculty', 'Commuter Student'],
                    hourlyRate: 2.5,
                    semesterRate: 150,
                    rateType: 'Permit-based',
                    status: 'Active',
                    features: { isEV: false, isMetered: true, isAccessible: true }
                }
            ];

            await Lot.insertMany(lots);
            console.log('Default lots created successfully');
        }
    } catch (error) {
        console.error('Error creating default lots:', error);
    }
};

/**
 * Establishes a connection to the MongoDB database with retry logic
 * 
 * This function attempts to connect to MongoDB using the connection
 * string from environment variables. If connection fails, it will
 * retry with a configurable delay up to a maximum number of attempts.
 * After successful connection, it initializes default data.
 * 
 * @async
 * @param {number} retryCount - Maximum number of connection attempts
 * @param {number} delay - Delay in milliseconds between retry attempts
 * @returns {Promise<boolean>} True if connection is successful
 */
const connectDB = async (retryCount = 3, delay = 3000) => {
    let attempts = 0;

    while (attempts < retryCount) {
        try {
            console.log(`MongoDB connection attempt ${attempts + 1}/${retryCount}`);

            const conn = await mongoose.connect(process.env.MONGODB_URI);

            console.log(`MongoDB Connected: ${conn.connection.host}`);

            // Create default admin and lots after DB connection
            await createDefaultAdmin();
            await createDefaultLots();

            return true;
        } catch (error) {
            attempts++;

            console.error('MongoDB connection error:', error.message);

            // Check if it's a credential/auth error
            if (error.message.includes('Authentication failed') ||
                error.message.includes('bad auth') ||
                error.message.includes('not authorized')) {
                console.error('MongoDB authentication failed. Please check your credentials in .env file');
                process.exit(1); // Exit immediately for auth errors
            }

            // If we've reached max retries, exit
            if (attempts >= retryCount) {
                console.error('Maximum MongoDB connection attempts reached. Server will now exit.');
                process.exit(1);
            }

            // Otherwise wait and retry
            console.log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
};

// Handling connection events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected');
});

// Handle app termination and close mongoose connection properly
process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to app termination');
    process.exit(0);
});

module.exports = { connectDB };