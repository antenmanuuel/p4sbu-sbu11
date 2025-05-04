const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api'; // Default server API URL
const MONGODB_URI = 'mongodb+srv://anten:Test2001@p4sbu.wmmfr.mongodb.net/?retryWrites=true&w=majority&appName=P4SBU'; // MongoDB Atlas connection
const NUM_USERS = 5; // Reduced number for easier debugging, can increase later
const TEST_DATE = '2025-05-02';
const TEST_START_TIME = '15:00'; // 3:00 PM
const TEST_END_TIME = '16:00'; // 4:00 PM
const TARGET_LOCATION = 'Test Location';
const TARGET_LOT = 'Test Concurrency Lot';
// Get JWT Secret from environment or use a test secret
const JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_for_concurrency_testing';

// Add a test ID to identify all test created records for cleanup
const TEST_ID = `test_${Date.now()}`;

// Global variables
let testLot = null; // Will hold the test lot object

/**
 * Generates a random password with required complexity
 */
function generateRandomPassword(length = 12) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()-_=+';
    const allChars = lowercase + uppercase + numbers + symbols;

    const randomBytes = crypto.randomBytes(length);
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % allChars.length;
        password += allChars.charAt(randomIndex);
    }

    // Ensure complexity by including at least one of each character type
    let hasLower = false, hasUpper = false, hasNumber = false, hasSymbol = false;
    for (const char of password) {
        hasLower = hasLower || lowercase.includes(char);
        hasUpper = hasUpper || uppercase.includes(char);
        hasNumber = hasNumber || numbers.includes(char);
        hasSymbol = hasSymbol || symbols.includes(char);
    }

    let modified = password;
    if (!hasLower) modified = lowercase[Math.floor(Math.random() * lowercase.length)] + modified.slice(1);
    if (!hasUpper) modified = modified.slice(0, 1) + uppercase[Math.floor(Math.random() * uppercase.length)] + modified.slice(2);
    if (!hasNumber) modified = modified.slice(0, 2) + numbers[Math.floor(Math.random() * numbers.length)] + modified.slice(3);
    if (!hasSymbol) modified = modified.slice(0, 3) + symbols[Math.floor(Math.random() * symbols.length)] + modified.slice(4);

    return modified;
}

/**
 * Directly insert a user in the database
 */
async function createTestUser(index) {
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    // Create a valid SBU ID (9 digits)
    const sbuId = String(100000000 + Math.floor(Math.random() * 900000000)).substring(0, 9);

    // Create user object with all required fields
    const user = {
        firstName: `User${index}`,
        lastName: "Test",
        email: `user${index}_${TEST_ID}@stonybrook.edu`,
        sbuId: sbuId,
        password: hashedPassword,
        userType: "student",
        status: "active",
        isApproved: true, // Set to true so we can login
        dateJoined: new Date(),
        createdAt: new Date(),
        testId: TEST_ID // For cleanup identification
    };

    // Store the plain password for login purposes
    return {
        ...user,
        plainPassword
    };
}

/**
 * Generate a JWT token directly instead of relying on login
 */
function generateToken(userId, email, userType = 'student') {
    // Create JWT token with same format as the auth service
    const token = jwt.sign(
        {
            userId: userId,
            email: email,
            userType: userType
        },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return token;
}

/**
 * Create test users by direct database insertion
 */
async function setupUsers() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const usersCollection = db.collection('users');

        console.log('Creating test users...');

        // Create array to hold user objects
        const users = [];
        for (let i = 0; i < NUM_USERS; i++) {
            users.push(await createTestUser(i));
        }

        // First clean up any existing test users
        await usersCollection.deleteMany({
            email: { $regex: TEST_ID }
        });

        // Create copies for database insertion (without plainPassword field)
        const usersForDb = users.map(user => {
            const dbUser = { ...user };
            delete dbUser.plainPassword;
            return dbUser;
        });

        // Insert users directly into database
        const result = await usersCollection.insertMany(usersForDb);
        console.log(`Created ${users.length} test users`);

        // Add MongoDB _id to each user object for reference
        const insertedIds = result.insertedIds;
        users.forEach((user, index) => {
            if (insertedIds[index]) {
                user._id = insertedIds[index].toString();
                // Generate a token for each user
                user.token = generateToken(user._id, user.email, user.userType);
            }
        });

        // Return users with plainPassword, _id and token
        return users;
    } catch (error) {
        console.error('Error creating test users:', error);
        return [];
    } finally {
        await client.close();
    }
}

/**
 * Search for parking spaces
 */
async function searchParking(token) {
    try {
        console.log('Searching for parking spaces...');

        // Using the generic lots endpoint with query parameters for searching
        const response = await axios.get(
            `${API_BASE_URL}/lots`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data) {
            // Extract lots from different possible response formats
            let lots = null;
            if (Array.isArray(response.data)) {
                lots = response.data;
            } else if (response.data.lots && Array.isArray(response.data.lots)) {
                lots = response.data.lots;
            }

            if (lots && lots.length > 0) {
                console.log(`Found ${lots.length} parking lots`);

                // Debug - print lot names to identify our target
                lots.forEach(lot => {
                    console.log(`- Lot: ${lot.name || 'Unnamed'}`);
                });

                return lots;
            } else {
                console.error('No parking lots found in search results');
                console.log('Response data:', JSON.stringify(response.data, null, 2));
                return null;
            }
        } else {
            console.error('No data received from lots endpoint');
            return null;
        }
    } catch (error) {
        console.error('Search parking failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Get parking lot details by ID
 */
async function getParkingLotDetails(token, lotId) {
    try {
        console.log(`Getting details for lot ID: ${lotId}`);

        const response = await axios.get(
            `${API_BASE_URL}/lots/${lotId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (response.data && response.data.lot) {
            console.log(`Successfully retrieved details for ${response.data.lot.name}`);
            return response.data.lot;
        } else {
            console.error('No lot details found in response');
            if (response.data) {
                console.log('Response data:', JSON.stringify(response.data, null, 2));
            }
            return null;
        }
    } catch (error) {
        console.error('Get parking lot details failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        return null;
    }
}

/**
 * Create a car directly in the database instead of using the API
 */
async function createCarInDatabase(user) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const carsCollection = db.collection('cars');

        console.log(`Creating car for user ${user.email} directly in database...`);

        // Create car data matching the schema
        const carData = {
            plateNumber: `ABC${Math.floor(Math.random() * 1000)}`,
            stateProv: 'NY',
            make: 'Volkswagen',
            model: 'Tiguan',
            color: 'Brown',
            bodyType: 'SUV',
            userId: new ObjectId(user._id),
            year: '2023',
            testId: TEST_ID, // For test identification (not in schema but helpful)
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await carsCollection.insertOne(carData);

        if (result.insertedId) {
            console.log(`Successfully created car with ID: ${result.insertedId}`);
            return {
                ...carData,
                _id: result.insertedId.toString()
            };
        } else {
            console.error('Failed to create car in database');
            return null;
        }
    } catch (error) {
        console.error('Create car in database failed:', error);
        return null;
    } finally {
        await client.close();
    }
}

/**
 * Create reservation directly in the database 
 */
async function createReservationInDatabase(user, lotId, carId) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const reservationsCollection = db.collection('reservations');
        const lotsCollection = db.collection('lots');

        console.log(`Creating reservation for user ${user.email}, lot ${lotId}, car ${carId}...`);

        // First check if there are available spots
        const lotObjectId = typeof lotId === 'string' ? new ObjectId(lotId) : lotId;
        const lot = await lotsCollection.findOne({ _id: lotObjectId });

        if (!lot) {
            return { status: 'failed', message: 'Parking lot not found' };
        }

        if (lot.availableSpaces <= 0) {
            console.log(`❌ [${user.email}] No available spaces in lot ${lot.name}`);
            return { status: 'failed', message: 'No available parking spaces' };
        }

        // Generate a unique reservation ID
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const reservationId = `RES-${dateStr}-${randomSuffix}`;

        // Create dates from strings
        const startTimeDate = new Date(`${TEST_DATE}T${TEST_START_TIME}:00`);
        const endTimeDate = new Date(`${TEST_DATE}T${TEST_END_TIME}:00`);

        // Convert string IDs to ObjectId if they're not already
        const userObjectId = typeof user._id === 'string' ? new ObjectId(user._id) : user._id;
        const carObjectId = typeof carId === 'string' ? new ObjectId(carId) : carId;

        // Create reservation data matching the schema
        const reservationData = {
            reservationId: reservationId,
            user: userObjectId,
            lotId: lotObjectId,
            startTime: startTimeDate,
            endTime: endTimeDate,
            permitType: 'student', // Default permit type
            vehicleInfo: carObjectId,
            paymentStatus: 'completed',
            stripePaymentIntentId: `pi_test_${Date.now()}`,
            stripePaymentMethodId: `pm_test_${Date.now()}`,
            stripeReceiptUrl: `https://test.receipt.url/${Date.now()}`,
            status: 'active',
            totalPrice: 5.00, // Fixed price for test
            notes: 'Created for concurrency testing',
            testId: TEST_ID, // For test identification (not in schema but helpful)
            createdAt: new Date(),
            updatedAt: new Date()
        };

        // Use a session for transaction to ensure atomicity
        const session = client.startSession();
        let reservationResult;

        try {
            await session.withTransaction(async () => {
                // Decrement available spaces atomically
                const updateResult = await lotsCollection.findOneAndUpdate(
                    { _id: lotObjectId, availableSpaces: { $gt: 0 } }, // Only update if spots available
                    { $inc: { availableSpaces: -1 } },
                    { returnDocument: 'after', session }
                );

                // If no update happened, it means another concurrent user got the spot
                if (!updateResult.value) {
                    throw new Error('No available parking spaces');
                }

                // Insert the reservation
                const insertResult = await reservationsCollection.insertOne(
                    reservationData,
                    { session }
                );

                if (!insertResult.insertedId) {
                    throw new Error('Failed to create reservation');
                }

                reservationResult = {
                    status: 'success',
                    reservationId: reservationId,
                    _id: insertResult.insertedId.toString(),
                    availableSpaces: updateResult.value.availableSpaces
                };
            });

            if (reservationResult) {
                console.log(`Successfully created reservation with ID: ${reservationId} (${reservationResult.availableSpaces} spots remaining)`);
                return reservationResult;
            } else {
                return { status: 'failed', message: 'Transaction failed' };
            }
        } catch (error) {
            if (error.message === 'No available parking spaces') {
                console.error(`Transaction failed: All parking spaces were taken by other users`);
                return { status: 'failed', message: 'All parking spaces were taken by other users' };
            } else {
                console.error(`Transaction failed: ${error.message}`);
                return { status: 'failed', message: `Transaction failed: ${error.message}` };
            }
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error('Create reservation in database failed:', error);
        return { status: 'failed', message: error.message };
    } finally {
        await client.close();
    }
}

/**
 * Runs a single user test by authenticating, finding a parking spot, and making a reservation
 * @param {Object} user - User details including email and password
 * @returns {Object} - Test result with status and timing information
 */
async function runSingleUserTest(user) {
    const result = {
        email: user.email,
        status: 'failed',
        steps: [],
        timings: {},
        testId: TEST_ID,
        timestamp: new Date().toISOString()
    };

    try {
        console.log(`Running test for user: ${user.email}`);
        let startTime, endTime;

        // Check if we already have an authentication token
        if (!user.token) {
            startTime = Date.now();
            result.steps.push('authentication');

            try {
                const token = await authenticateUser(user.email, user.password);
                user.token = token;

                endTime = Date.now();
                result.timings.authentication = endTime - startTime;
                console.log(`✅ [${user.email}] Authentication successful (${result.timings.authentication}ms)`);
            } catch (error) {
                result.message = `Authentication failed: ${error.message}`;
                result.timings.authentication = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }
        }

        // Search for parking
        startTime = Date.now();
        result.steps.push('search');

        try {
            const searchResults = await searchParking(user.token);

            if (!searchResults || searchResults.length === 0) {
                result.message = 'No parking lots found';
                result.timings.search = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            // Find the target lot in the search results
            const targetLot = searchResults.find(lot =>
                lot.name.includes(TARGET_LOT) || lot._id.toString() === TARGET_LOT);

            if (!targetLot) {
                result.message = `Target lot "${TARGET_LOT}" not found in search results`;
                result.timings.search = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            user.lotId = targetLot._id.toString();
            endTime = Date.now();
            result.timings.search = endTime - startTime;
            console.log(`✅ [${user.email}] Found parking lot: ${targetLot.name} (${result.timings.search}ms)`);
        } catch (error) {
            result.message = `Search failed: ${error.message}`;
            result.timings.search = Date.now() - startTime;
            console.error(`❌ [${user.email}] ${result.message}`);
            return result;
        }

        // Get lot details
        startTime = Date.now();
        result.steps.push('lot_details');

        try {
            const lotDetails = await getParkingLotDetails(user.token, user.lotId);

            if (!lotDetails) {
                result.message = 'Failed to get lot details';
                result.timings.lot_details = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            endTime = Date.now();
            result.timings.lot_details = endTime - startTime;
            console.log(`✅ [${user.email}] Got lot details (${result.timings.lot_details}ms)`);
        } catch (error) {
            result.message = `Get lot details failed: ${error.message}`;
            result.timings.lot_details = Date.now() - startTime;
            console.error(`❌ [${user.email}] ${result.message}`);
            return result;
        }

        // Create a car for the user
        startTime = Date.now();
        result.steps.push('create_car');

        try {
            const car = await createCarInDatabase(user);

            if (!car || !car._id) {
                result.message = 'Failed to create car';
                result.timings.create_car = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            user.carId = car._id;

            endTime = Date.now();
            result.timings.create_car = endTime - startTime;
            console.log(`✅ [${user.email}] Created car with ID: ${user.carId} (${result.timings.create_car}ms)`);
        } catch (error) {
            result.message = `Car creation failed: ${error.message}`;
            result.timings.create_car = Date.now() - startTime;
            console.error(`❌ [${user.email}] ${result.message}`);
            return result;
        }

        // Make a reservation
        startTime = Date.now();
        result.steps.push('reservation');

        try {
            const reservationResponse = await createReservationInDatabase(user, user.lotId, user.carId);

            if (!reservationResponse || reservationResponse.status === 'failed') {
                // More descriptive error message that includes the actual reason
                result.message = reservationResponse.message || 'Reservation failed: Parking availability issue';
                result.timings.reservation = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            if (!reservationResponse._id) {
                result.message = 'Reservation created but no ID was returned';
                result.timings.reservation = Date.now() - startTime;
                console.error(`❌ [${user.email}] ${result.message}`);
                return result;
            }

            endTime = Date.now();
            result.timings.reservation = endTime - startTime;
            result.reservationId = reservationResponse.reservationId;
            result.totalTime = Object.values(result.timings).reduce((total, time) => total + time, 0);
            result.status = 'success';
            console.log(`✅ [${user.email}] Created reservation with ID: ${result.reservationId} (${result.timings.reservation}ms)`);
        } catch (error) {
            result.message = `Reservation failed: ${error.message}`;
            result.timings.reservation = Date.now() - startTime;
            console.error(`❌ [${user.email}] ${result.message}`);
            return result;
        }

        console.log(`✅ [${user.email}] Test completed successfully in ${result.totalTime}ms`);
        return result;
    } catch (error) {
        result.message = `Unexpected error: ${error.message}`;
        console.error(`❌ [${user.email}] ${result.message}`);
        return result;
    }
}

/**
 * Create a test parking lot with limited capacity directly in the database
 * @param {number} capacity - The capacity of the test lot
 */
async function ensureTestParkingLot(capacity = 2) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const lotsCollection = db.collection('lots');

        console.log(`Creating test parking lot with capacity of ${capacity} spots for concurrency testing...`);

        // Delete any test lots first
        await lotsCollection.deleteMany({ testId: TEST_ID });

        // Create a test lot with the specified capacity matching the schema
        const testLot = {
            name: TARGET_LOT,
            address: TARGET_LOCATION,
            description: 'Test lot created specifically for concurrency testing',
            location: {
                latitude: 40.9123,
                longitude: -73.1234
            },
            totalSpaces: capacity,
            availableSpaces: capacity,
            permitTypes: ['student', 'faculty', 'staff'],
            hourlyRate: 2.5,
            semesterRate: 100,
            rateType: 'Hourly',
            status: 'Active',
            features: {
                isEV: false,
                isMetered: true,
                isAccessible: true
            },
            testId: TEST_ID, // For test identification (not in schema but helpful)
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const result = await lotsCollection.insertOne(testLot);

        if (result.insertedId) {
            console.log(`Successfully created test parking lot: "${testLot.name}" with ${testLot.totalSpaces} spots`);
            return {
                ...testLot,
                _id: result.insertedId.toString()
            };
        } else {
            console.error('Failed to create test parking lot');
            return null;
        }
    } catch (error) {
        console.error('Error creating test parking lot:', error);
        return null;
    } finally {
        await client.close();
    }
}

/**
 * Clean up all test data after the test
 * @param {string} lotId - ID of the test lot to clean up
 * @param {Array} users - Array of test users to clean up
 */
async function cleanupTestData(lotId, users = []) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();

        console.log('Cleaning up test data...');

        // Delete test users
        const usersCollection = db.collection('users');
        const userEmails = users.map(u => u.email);

        let userQuery = userEmails.length > 0
            ? { email: { $in: userEmails } }
            : { email: { $regex: TEST_ID } };

        const userResult = await usersCollection.deleteMany(userQuery);
        console.log(`Removed ${userResult.deletedCount} test users`);

        // Delete test cars
        const carsCollection = db.collection('cars');
        let carQuery = { testId: TEST_ID };
        const carResult = await carsCollection.deleteMany(carQuery);
        console.log(`Removed ${carResult.deletedCount} test cars`);

        // Delete test reservations
        const reservationsCollection = db.collection('reservations');
        let reservationQuery = { testId: TEST_ID };
        const reservationResult = await reservationsCollection.deleteMany(reservationQuery);
        console.log(`Removed ${reservationResult.deletedCount} test reservations`);

        // Delete test lots
        const lotsCollection = db.collection('lots');
        let lotQuery = lotId ? { _id: new ObjectId(lotId) } : { testId: TEST_ID };
        const lotResult = await lotsCollection.deleteMany(lotQuery);
        console.log(`Removed ${lotResult.deletedCount} test parking lots`);
    } catch (error) {
        console.error(`Error cleaning up test data: ${error.message}`);
    } finally {
        await client.close();
    }
}

/**
 * Log results to console and save to file
 */
function logResults(results) {
    console.log('\n----- CONCURRENCY TEST RESULTS -----');
    console.log(`Total Users: ${results.length}`);

    // Ensure we're properly filtering based on status
    const successful = results.filter(r => r && r.status === 'success');
    const failed = results.filter(r => r && r.status === 'failed');

    console.log(`Successful Reservations: ${successful.length}`);
    console.log(`Failed Reservations: ${failed.length}`);

    // Calculate response times for successful requests
    if (successful.length > 0) {
        // Make sure all times are numbers
        const times = successful.map(r => typeof r.time === 'number' ? r.time : 0);

        if (times.length > 0 && times.some(t => t > 0)) {
            const sum = times.reduce((acc, val) => acc + val, 0);
            const avg = sum / times.filter(t => t > 0).length;
            const min = Math.min(...times.filter(t => t > 0));
            const max = Math.max(...times.filter(t => t > 0));

            console.log(`Average Response Time: ${avg.toFixed(2)}ms`);
            console.log(`Min Response Time: ${min}ms`);
            console.log(`Max Response Time: ${max}ms`);
        } else {
            console.log('No valid timing data available');
        }
    } else {
        console.log('No successful reservations to calculate timing statistics');
    }

    // Show failure reasons with better descriptions
    const failureReasons = {};
    failed.forEach(f => {
        // More descriptive and categorized reasons
        let reason = f.message || 'Unknown error';

        // Categorize and improve common error messages
        if (reason.includes('No available parking spaces')) {
            reason = 'Parking lot full: No available spaces remaining';
        } else if (reason.includes('No valid response')) {
            reason = 'Failed to reserve: All spots were taken';
        } else if (reason.includes('Transaction failed')) {
            reason = 'Concurrency conflict: Another user reserved the last spot';
        }

        failureReasons[reason] = (failureReasons[reason] || 0) + 1;
    });

    console.log('\n❌ Failure Reasons:');
    Object.entries(failureReasons).forEach(([reason, count]) => {
        console.log(`- ${reason}: ${count} users`);
    });

    // Create a detailed report
    const report = {
        timestamp: new Date().toISOString(),
        testId: TEST_ID,
        results: results.map(r => ({
            status: r.status,
            time: r.time,
            message: r.message || '',
            reservationId: r.reservationId || ''
        })),
        summary: {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            failureReasons
        }
    };

    // Save to file with more descriptive name
    const filename = `concurrency-test-results-${new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-')}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));

    // Also save to the standard filename for backward compatibility
    fs.writeFileSync('concurrency-test-results.json', JSON.stringify(report, null, 2));

    console.log(`\nResults saved to ${filename}`);
    console.log('Results also saved to concurrency-test-results.json');

    // Print a concise summary
    console.log('\nCONCURRENCY TEST SUMMARY:');
    console.log(`${successful.length} of ${results.length} users (${((successful.length / results.length) * 100).toFixed(2)}%) got a reservation`);
    console.log(`${failed.length} of ${results.length} users (${((failed.length / results.length) * 100).toFixed(2)}%) failed to get a reservation`);

    return report;
}

/**
 * Ensure we have enough test users for the concurrency test
 * @param {number} numUsers - Number of users needed
 * @returns {Array} - Array of test users with authentication tokens
 */
async function ensureTestUsers(numUsers) {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db();
        const usersCollection = db.collection('users');

        console.log(`Ensuring ${numUsers} test users are available...`);

        // First clean up any existing test users to avoid conflicts
        await usersCollection.deleteMany({
            email: { $regex: TEST_ID }
        });

        // Create array to hold user objects
        const users = [];
        for (let i = 0; i < numUsers; i++) {
            users.push(await createTestUser(i));
        }

        // Create copies for database insertion (without plainPassword field)
        const usersForDb = users.map(user => {
            const dbUser = { ...user };
            delete dbUser.plainPassword;
            return dbUser;
        });

        // Insert users directly into database
        const result = await usersCollection.insertMany(usersForDb);
        console.log(`Created ${users.length} test users`);

        // Add MongoDB _id to each user object for reference
        const insertedIds = result.insertedIds;
        users.forEach((user, index) => {
            if (insertedIds[index]) {
                user._id = insertedIds[index].toString();
                // Generate a token for each user
                user.token = generateToken(user._id, user.email, user.userType);
            }
        });

        return users;
    } catch (error) {
        console.error('Error creating test users:', error);
        return [];
    } finally {
        await client.close();
    }
}

/**
 * Runs a concurrency test with multiple users attempting to reserve parking spots simultaneously
 * @param {number} numUsers - Number of users to run in the test
 * @param {number} capacity - Capacity of the test parking lot
 */
async function concurrencyTest(numUsers = 5, capacity = 2) {
    console.log(`\n🚀 Starting concurrency test with ${numUsers} users competing for ${capacity} parking spots`);
    console.log(`Test ID: ${TEST_ID}`);
    console.log(`Test Lot: "${TARGET_LOT}" at "${TARGET_LOCATION}"`);
    const startTime = Date.now();

    const results = {
        testId: TEST_ID,
        timestamp: new Date().toISOString(),
        numUsers,
        capacity,
        targetLot: TARGET_LOT,
        users: [],
        status: 'running',
        summary: {},
        startTime
    };

    let testUsers = [];

    try {
        // Create test data
        console.log("📋 Creating test data...");
        testUsers = await ensureTestUsers(numUsers);

        if (testUsers.length < 2) {
            console.error("❌ Need at least 2 users for concurrency test");
            results.status = 'failed';
            results.error = 'Insufficient users';
            return results;
        }

        console.log(`✅ Created ${testUsers.length} test users`);

        // Create test parking lot with specified capacity
        testLot = await ensureTestParkingLot(capacity);
        console.log(`✅ Test parking lot created: ${testLot.name} (${testLot._id})`);
        console.log(`   Capacity: ${testLot.totalSpaces} spots, Available: ${testLot.availableSpaces} spots`);

        // Store the test lot in the global variable for the mock functions to use
        testLot = testLot;

        // Override API functions with test versions that return our test lot
        const originalSearchParking = searchParking;
        searchParking = async (token) => {
            console.log('Using test lot instead of searching through API...');
            return [testLot];
        };

        const originalGetParkingLotDetails = getParkingLotDetails;
        getParkingLotDetails = async (token, lotId) => {
            console.log(`Using test lot details instead of API lookup for: ${lotId}`);
            return testLot;
        };

        // Skip initial reservation and run all users concurrently
        console.log("\n🏁 Running ALL users concurrently for maximum competition...");
        const concurrentStartTime = Date.now();

        // Track when each request starts and finishes
        const timing = {
            startTimes: {},
            endTimes: {},
            reservationCreationTimes: [],
            reservations: []
        };

        // Modified runSingleUserTest that tracks exact timing
        const runTimedUserTest = async (user) => {
            const requestId = `${user.email}_${Date.now()}`;
            timing.startTimes[requestId] = Date.now();

            // Run the actual test
            const result = await runSingleUserTest(user);

            timing.endTimes[requestId] = Date.now();

            // Add reservation creation timestamp if successful
            if (result.status === 'success') {
                const reservationTime = timing.endTimes[requestId];
                timing.reservationCreationTimes.push(reservationTime);
                timing.reservations.push({
                    userId: user._id,
                    email: user.email,
                    timestamp: reservationTime,
                    reservationId: result.reservationId,
                    duration: timing.endTimes[requestId] - timing.startTimes[requestId]
                });
            }

            return { ...result, requestId };
        };

        // Run all tests concurrently
        const promises = testUsers.map(user => runTimedUserTest(user));
        const concurrentResults = await Promise.all(promises);

        const concurrentEndTime = Date.now();
        const concurrentDuration = concurrentEndTime - concurrentStartTime;

        console.log(`✅ Concurrent reservations completed in ${concurrentDuration}ms`);

        // Add results to the overall results object
        results.users = concurrentResults;

        // Calculate summary statistics
        const successCount = results.users.filter(r => r.status === 'success').length;
        const failCount = results.users.filter(r => r.status === 'failed').length;

        // Sort reservations chronologically
        timing.reservations.sort((a, b) => a.timestamp - b.timestamp);

        // Calculate time differences between successful reservations
        const reservationIntervals = [];
        for (let i = 1; i < timing.reservationCreationTimes.length; i++) {
            reservationIntervals.push(timing.reservationCreationTimes[i] - timing.reservationCreationTimes[i - 1]);
        }

        // Calculate concurrency metrics
        const allStartTimes = Object.values(timing.startTimes);
        const allEndTimes = Object.values(timing.endTimes);
        const minStartTime = Math.min(...allStartTimes);
        const maxEndTime = Math.max(...allEndTimes);

        // Calculate overlapping requests
        const timeline = [];
        Object.keys(timing.startTimes).forEach(id => {
            timeline.push({ time: timing.startTimes[id], type: 'start', id });
            timeline.push({ time: timing.endTimes[id], type: 'end', id });
        });

        timeline.sort((a, b) => a.time - b.time);

        let maxConcurrent = 0;
        let currentConcurrent = 0;
        let concurrentPeriods = [];

        timeline.forEach(event => {
            if (event.type === 'start') {
                currentConcurrent++;
                if (currentConcurrent > maxConcurrent) {
                    maxConcurrent = currentConcurrent;
                }
            } else {
                // Record periods of maximum concurrency
                if (currentConcurrent === maxConcurrent) {
                    concurrentPeriods.push({
                        count: currentConcurrent,
                        endTime: event.time
                    });
                }
                currentConcurrent--;
            }
        });

        // Calculate detailed statistics
        const durations = results.users.map(r => {
            const requestId = r.requestId;
            return timing.endTimes[requestId] - timing.startTimes[requestId];
        });

        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

        // Calculate successful reservation timings
        const successfulDurations = results.users
            .filter(r => r.status === 'success')
            .map(r => {
                const requestId = r.requestId;
                return timing.endTimes[requestId] - timing.startTimes[requestId];
            });

        const successAvgDuration = successfulDurations.length > 0
            ? successfulDurations.reduce((sum, d) => sum + d, 0) / successfulDurations.length
            : 0;

        results.summary = {
            totalUsers: results.users.length,
            successCount,
            failCount,
            successRate: (successCount / results.users.length * 100).toFixed(2) + '%',
            totalReservations: successCount,
            lotCapacity: testLot.totalSpaces,
            capacityUtilization: (successCount / testLot.totalSpaces * 100).toFixed(2) + '%',
            expectedFailures: Math.max(0, numUsers - capacity),
            expectedSuccessRate: (Math.min(numUsers, capacity) / numUsers * 100).toFixed(2) + '%',
            actualSuccessRate: (successCount / numUsers * 100).toFixed(2) + '%',
            maxConcurrentRequests: maxConcurrent,

            // Timing metrics
            timingMetrics: {
                minRequestDuration: minDuration,
                maxRequestDuration: maxDuration,
                avgRequestDuration: avgDuration,
                successfulRequestAvgDuration: successAvgDuration,
                reservationIntervals: reservationIntervals,
                avgReservationInterval: reservationIntervals.length > 0
                    ? reservationIntervals.reduce((sum, i) => sum + i, 0) / reservationIntervals.length
                    : 0,
                totalTestSpan: maxEndTime - minStartTime,
                reservationTimeline: timing.reservations.map(r => ({
                    email: r.email,
                    timestamp: new Date(r.timestamp).toISOString(),
                    elapsedMs: r.timestamp - minStartTime,
                    duration: r.duration
                }))
            }
        };

        results.endTime = Date.now();
        results.duration = results.endTime - results.startTime;
        results.status = 'completed';

        // Generate report
        console.log("\n📊 Concurrency Test Results:");
        console.log(`Total Users: ${results.summary.totalUsers}`);
        console.log(`Parking Capacity: ${results.summary.lotCapacity} spots`);
        console.log(`Successful Reservations: ${results.summary.successCount}`);
        console.log(`Failed Reservations: ${results.summary.failCount}`);
        console.log(`Success Rate: ${results.summary.successRate}`);
        console.log(`Expected Success Rate: ${results.summary.expectedSuccessRate}`);
        console.log(`Capacity Utilization: ${results.summary.capacityUtilization}`);

        console.log("\n⏱️ Concurrency Metrics:");
        console.log(`Max Concurrent Requests: ${results.summary.maxConcurrentRequests}`);
        console.log(`Total Test Duration: ${results.duration}ms`);
        console.log(`Min Request Duration: ${results.summary.timingMetrics.minRequestDuration}ms`);
        console.log(`Max Request Duration: ${results.summary.timingMetrics.maxRequestDuration}ms`);
        console.log(`Avg Request Duration: ${results.summary.timingMetrics.avgRequestDuration.toFixed(2)}ms`);
        console.log(`Successful Request Avg Duration: ${results.summary.timingMetrics.successfulRequestAvgDuration.toFixed(2)}ms`);

        if (successCount >= 2) {
            console.log(`Avg Time Between Successful Reservations: ${results.summary.timingMetrics.avgReservationInterval.toFixed(2)}ms`);
        }

        // Show chronological reservation timeline
        if (timing.reservations.length > 0) {
            console.log("\n⏳ Reservation Timeline:");
            timing.reservations.forEach((res, idx) => {
                console.log(`${idx + 1}. ${res.email} at +${res.timestamp - minStartTime}ms (took ${res.duration}ms)`);
            });
        }

        // Show failure reasons with better descriptions
        const failureReasons = {};
        results.users
            .filter(r => r.status === 'failed')
            .forEach(r => {
                // More descriptive and categorized reasons
                let reason = r.message || 'Unknown error';

                // Categorize and improve common error messages
                if (reason.includes('No available parking spaces')) {
                    reason = 'Parking lot full: No available spaces remaining';
                } else if (reason.includes('No valid response')) {
                    reason = 'Failed to reserve: All spots were taken';
                } else if (reason.includes('Transaction failed')) {
                    reason = 'Concurrency conflict: Another user reserved the last spot';
                }

                failureReasons[reason] = (failureReasons[reason] || 0) + 1;
            });

        console.log("\n❌ Failure Reasons:");
        Object.entries(failureReasons).forEach(([reason, count]) => {
            console.log(`- ${reason}: ${count} users`);
        });

        // Save detailed results to a JSON file
        const filename = `concurrency-test-results-${TEST_ID}.json`;
        fs.writeFileSync(filename, JSON.stringify(results, null, 2));
        console.log(`\nDetailed results saved to ${filename}`);

        return results;
    } catch (error) {
        console.error(`❌ Test failed with error: ${error.message}`);
        results.status = 'failed';
        results.error = error.message;
        results.endTime = Date.now();
        results.duration = results.endTime - results.startTime;
        return results;
    } finally {
        console.log("\n🧹 Cleaning up test data...");
        try {
            // Cleanup test data
            if (testLot) {
                await cleanupTestData(testLot._id, testUsers);
                console.log("✅ Test data cleanup completed");
            }
        } catch (cleanupError) {
            console.error(`⚠️ Error during cleanup: ${cleanupError.message}`);
        }
    }
}

// Process command line arguments
const args = process.argv.slice(2);
let numUsers = 10; // Default number of users
let capacity = 2;  // Default capacity

// Parse command line arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '--users' || args[i] === '-u') {
        if (i + 1 < args.length) {
            numUsers = parseInt(args[i + 1]);
            if (isNaN(numUsers)) {
                console.error(`Invalid number of users: ${args[i + 1]}`);
                process.exit(1);
            }
            i++; // Skip the next argument
        }
    } else if (args[i] === '--capacity' || args[i] === '-c') {
        if (i + 1 < args.length) {
            capacity = parseInt(args[i + 1]);
            if (isNaN(capacity)) {
                console.error(`Invalid capacity: ${args[i + 1]}`);
                process.exit(1);
            }
            i++; // Skip the next argument
        }
    } else if (!isNaN(parseInt(args[i]))) {
        // For backward compatibility, treat a single number as users
        numUsers = parseInt(args[i]);
    } else if (args[i] === '--help' || args[i] === '-h') {
        console.log(`
Concurrency Test for Parking Reservation System

Usage:
  node concurrencyTest.js [options]
  
Options:
  --users, -u <number>      Number of users to include in the test (default: 10)
  --capacity, -c <number>   Parking lot capacity (default: 2)
  --help, -h                Show this help message

Examples:
  node concurrencyTest.js                  Run with 10 users competing for 2 spots
  node concurrencyTest.js 15               Run with 15 users competing for 2 spots
  node concurrencyTest.js -u 20 -c 5       Run with 20 users competing for 5 spots
        `);
        process.exit(0);
    }
}

console.log(`Setting up concurrency test with ${numUsers} users competing for a limited capacity test lot (${capacity} spots)`);
console.log(`Test lot: "${TARGET_LOT}" at "${TARGET_LOCATION}"`);
console.log('This test uses a dedicated test lot and will not affect production data');

// Run the concurrency test with parsed arguments
concurrencyTest(numUsers, capacity); 