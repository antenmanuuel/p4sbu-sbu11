const mongoose = require('mongoose');
const User = require('../models/users');
const Lot = require('../models/lot');

// Create default admin user function
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
                sbuId: '99999999', // Special admin ID
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

// Create default lots
const createDefaultLots = async () => {
    try {
        const lotsCount = await Lot.countDocuments();
        if (lotsCount === 0) {
            const lots = [
                {
                    lotId: 'LOT001',
                    name: 'North P Lot',
                    latitude: 40.9181,
                    longitude: -73.1259
                },
                {
                    lotId: 'LOT002',
                    name: 'South P Lot',
                    latitude: 40.9048,
                    longitude: -73.1278
                },
                {
                    lotId: 'LOT003',
                    name: 'Administration Garage',
                    latitude: 40.9158,
                    longitude: -73.1243
                },
                {
                    lotId: 'LOT004',
                    name: 'Health Sciences Garage',
                    latitude: 40.9085,
                    longitude: -73.1161
                },
                {
                    lotId: 'LOT005',
                    name: 'Chapin Apartments Lot',
                    latitude: 40.9222,
                    longitude: -73.1267
                },
                {
                    lotId: 'LOT006',
                    name: 'Stadium Lot',
                    latitude: 40.9218,
                    longitude: -73.1225
                },
                {
                    lotId: 'LOT007',
                    name: 'West Apartment Lot',
                    latitude: 40.9154,
                    longitude: -73.1310
                },
                {
                    lotId: 'LOT008',
                    name: 'Engineering Lot',
                    latitude: 40.9138,
                    longitude: -73.1247
                },
                {
                    lotId: 'LOT009',
                    name: 'East Campus Lot',
                    latitude: 40.9110,
                    longitude: -73.1180
                },
                {
                    lotId: 'LOT010',
                    name: 'Visitor Parking Center',
                    latitude: 40.9155,
                    longitude: -73.1235
                }
            ];

            await Lot.insertMany(lots);
            console.log('Default lots created successfully');
        }
    } catch (error) {
        console.error('Error creating default lots:', error);
    }
};

// Enhanced connect function with retry logic
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