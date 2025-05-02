/**
 * This module defines API routes for administrator operations, including:
 * - User management (approval, role changes, viewing, updating)
 * - Permit type management (CRUD operations)
 * - Reservation management (viewing and statistics)
 * 
 * All routes in this module are protected with authentication middleware
 * and require administrator privileges to access.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/users');
const PermitType = require('../models/permit_types');
const Reservation = require('../models/reservation');
const { verifyToken, isAdmin } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');
const Permit = require('../models/permits');
const Ticket = require('../models/tickets');

/**
 * USER MANAGEMENT ROUTES
 * 
 * This section contains routes for managing user accounts, including:
 * - Viewing pending and approved users
 * - Approving new user registrations
 * - Updating user information
 * - Changing user roles and status
 * - Deleting user accounts
 */

/**
 * GET /api/admin/pending-users
 * 
 * Retrieves all users waiting for account approval
 * Used on the admin dashboard to review new registrations
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @returns {Array} - List of pending users, sorted by creation date
 */
router.get('/pending-users', verifyToken, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false })
            .select('-password') // Don't send password
            .sort({ createdAt: -1 });

        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/admin/approve-user/:userId
 * 
 * Approves a pending user account, granting them system access
 * Creates a notification and sends an email to the user
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to approve
 * @returns {Object} - Message and updated user information
 */
router.put('/approve-user/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isApproved: true },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a notification for the user about their account approval
        try {
            await NotificationHelper.createSystemNotification(
                userId,
                'Account Approved',
                'Your account has been approved. You now have full access to all features.',
                '/dashboard'
            );
            console.log('Account approval notification created for user:', userId);
        } catch (notificationError) {
            console.error('Error creating account approval notification:', notificationError);
            // Continue even if notification creation fails
        }

        // Send account approval email notification
        try {
            const emailService = require('../services/emailService');
            const baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173';
            const userName = `${updatedUser.firstName} ${updatedUser.lastName}`;

            await emailService.sendAccountApprovalEmail(
                updatedUser.email,
                userName,
                updatedUser.userType,
                baseUrl
            );
            console.log('Account approval email sent to:', updatedUser.email);
        } catch (emailError) {
            console.error('Error sending account approval email:', emailError);
            // Continue even if email sending fails
        }

        res.status(200).json({
            message: 'User approved successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/admin/users
 * 
 * Retrieves a paginated and filtered list of all users in the system
 * Supports filtering by status, user type, and search term
 * Returns pagination metadata for front-end display
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} status - Filter by user status (active, inactive, pending)
 * @query {string} userType - Filter by user type (student, faculty, admin, visitor)
 * @query {string} search - Search term for user fields
 * @query {number} page - Page number for pagination
 * @query {number} limit - Number of results per page
 * @returns {Object} - Users array and pagination metadata
 */
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        // Support filtering and pagination
        const { status, userType, search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};

        if (status) {
            if (status === 'active') {
                query.isApproved = true;
            } else if (status === 'inactive' || status === 'pending') {
                query.isApproved = false;
            }
        }

        if (userType) {
            query.userType = userType;
        }

        if (search) {
            // Search in multiple fields
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { sbuId: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get users with pagination
        const users = await User.find(query)
            .select('-password') // Don't send password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Transform user data to include status field
        const transformedUsers = users.map(user => {
            const userData = user.toObject();
            userData.status = userData.isApproved ? 'active' : 'inactive';
            if (!userData.isApproved) {
                // Check if this is a new registration
                const daysSinceCreation = userData.createdAt ?
                    Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                if (daysSinceCreation < 7) {
                    userData.status = 'pending';
                }
            }
            return userData;
        });

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            users: transformedUsers,
            pagination: {
                total,
                currentPage: parseInt(page),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/admin/users/:userId
 * 
 * Retrieves detailed information for a specific user by ID
 * Used for viewing user profile details in admin interface
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to retrieve
 * @returns {Object} - Complete user information (except password)
 */
router.get('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/admin/users/:userId
 * 
 * Updates a user's information (excluding password)
 * Used for modifying user profile data from admin panel
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to update
 * @body {Object} updates - Object containing fields to update
 * @returns {Object} - Message and updated user information
 */
router.put('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;

        // Don't allow updating password through this route for security
        if (updates.password) {
            delete updates.password;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/admin/users/:userId/toggle-status
 * 
 * Activates or deactivates a user account
 * Deactivated users cannot log in or access the system
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to update
 * @body {string} status - New status ('active' or 'inactive')
 * @returns {Object} - Message and updated user information
 */
router.put('/users/:userId/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const isApproved = status === 'active';

        const user = await User.findByIdAndUpdate(
            userId,
            { isApproved },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: `User ${isApproved ? 'activated' : 'deactivated'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/admin/users/:userId/change-role
 * 
 * Changes a user's role within the system
 * Includes complex logic to handle data cleanup when changing roles:
 * - Removes type-specific permits/reservations
 * - Cleans up vehicles and payment methods
 * - Creates notifications to inform the user
 * - Enforces limits on admin count
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to update
 * @body {string} role - New role ('student', 'faculty', 'visitor', 'admin')
 * @returns {Object} - Message and updated user information
 */
router.put('/users/:userId/change-role', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { role } = req.body;

        // Validate the role parameter
        if (!role || !['student', 'faculty', 'visitor', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role - must be student, faculty, visitor, or admin' });
        }

        // Get the user to check current role
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't allow changing the default admin account
        if (user.email === 'admin@stonybrook.edu') {
            return res.status(403).json({ message: 'Default admin account role cannot be changed' });
        }

        // If promoting to admin, check the admin limit (max 5)
        if (role === 'admin' && user.userType !== 'admin') {
            const adminCount = await User.countDocuments({ userType: 'admin' });
            if (adminCount >= 5) {
                return res.status(400).json({ message: 'Admin limit reached (maximum 5 admins allowed)' });
            }
        }

        // Handle special case for visitor IDs
        let updateData = { userType: role };
        if (role === 'visitor' && user.userType !== 'visitor') {
            // Generate a visitor ID if changing to visitor
            const visitorId = `V${Date.now().toString().substring(0, 10)}`;
            updateData.sbuId = visitorId;
        }

        // Clean up user-specific records based on the new role
        try {
            // Different cleanup logic based on the target role
            let cleanupOperations = [];
            let cleanupMessage = '';

            // Delete all cars for the user
            const Car = require('../models/car');
            const deleteCarsOperation = Car.deleteMany({ userId: userId });

            // Clear payment method information
            updateData.defaultPaymentMethodId = null;

            if (role === 'admin') {
                // Admins shouldn't have any permits, reservations or tickets
                cleanupOperations = [
                    // Delete all permits
                    Permit.deleteMany({ userId: userId }),
                    // Delete all reservations
                    Reservation.deleteMany({ user: userId }),
                    // Delete all tickets
                    Ticket.deleteMany({ user: userId }),
                    // Delete all cars
                    deleteCarsOperation
                ];
                cleanupMessage = 'As part of your promotion to admin, your permits, reservations, tickets, and vehicle information have been removed.';
            }
            else if (role === 'faculty') {
                // Faculty shouldn't have student-specific permits/reservations
                cleanupOperations = [
                    // Only delete Student permits
                    Permit.deleteMany({
                        userId: userId,
                        permitType: 'Student'
                    }),
                    // Keep faculty reservations intact
                    // Delete unpaid tickets if any
                    Ticket.deleteMany({ user: userId, isPaid: false }),
                    // Delete all cars
                    deleteCarsOperation
                ];
                cleanupMessage = 'As part of your role change to faculty, your student permits and vehicle information have been removed.';
            }
            else if (role === 'student') {
                // Students shouldn't have faculty-specific permits
                cleanupOperations = [
                    // Only delete Faculty permits
                    Permit.deleteMany({
                        userId: userId,
                        permitType: 'Faculty'
                    }),
                    // Keep student reservations intact
                    // Keep tickets intact
                    // Delete all cars
                    deleteCarsOperation
                ];
                cleanupMessage = 'As part of your role change to student, your faculty permits and vehicle information have been removed.';
            }
            else if (role === 'visitor') {
                // Visitors shouldn't have any permits, reservations or unpaid tickets
                cleanupOperations = [
                    // Delete all permits
                    Permit.deleteMany({ userId: userId }),
                    // Delete all reservations
                    Reservation.deleteMany({ user: userId }),
                    // Delete all tickets
                    Ticket.deleteMany({ user: userId }),
                    // Delete all cars
                    deleteCarsOperation
                ];
                cleanupMessage = 'As part of your role change to visitor, your permits, reservations, tickets, and vehicle information have been removed.';
            }

            if (cleanupOperations.length > 0) {
                const cleanupResults = await Promise.allSettled(cleanupOperations);

                // Log results of cleanup operations
                const operationMap = {
                    'admin': ['permits', 'reservations', 'tickets', 'vehicles'],
                    'visitor': ['permits', 'reservations', 'tickets', 'vehicles'],
                    'faculty': ['student permits', 'unpaid tickets', 'vehicles'],
                    'student': ['faculty permits', 'vehicles']
                };

                console.log(`Cleanup results for user changed to ${role}:`,
                    cleanupResults.map((result, index) => {
                        const operation = operationMap[role][index];

                        if (result.status === 'fulfilled') {
                            return `${operation}: ${result.value.deletedCount} deleted`;
                        } else {
                            return `${operation}: failed - ${result.reason}`;
                        }
                    })
                );

                // Create notification about data cleanup
                if (cleanupMessage) {
                    await NotificationHelper.createSystemNotification(
                        userId,
                        'Data Cleanup for Role Change',
                        cleanupMessage,
                        role === 'admin' ? '/admin-dashboard' : '/dashboard'
                    );
                }
            }
        } catch (cleanupError) {
            console.error(`Error cleaning up user data for new ${role}:`, cleanupError);
            // Continue even if cleanup fails
        }

        // Update user role
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        // Create notification for the user
        try {
            if (role === 'admin') {
                await NotificationHelper.createSystemNotification(
                    userId,
                    'Administrator Role Granted',
                    'You have been granted administrator privileges on the system.',
                    '/admin-dashboard'
                );
            } else {
                await NotificationHelper.createSystemNotification(
                    userId,
                    'Role Changed',
                    `Your account role has been updated to ${role}.`,
                    '/dashboard'
                );
            }
        } catch (notificationError) {
            console.error('Error creating role change notification:', notificationError);
            // Continue even if notification creation fails
        }

        res.status(200).json({
            message: role === 'admin'
                ? 'User promoted to admin successfully'
                : user.userType === 'admin'
                    ? 'User demoted from admin successfully'
                    : `User role changed to ${role} successfully`,
            user: updatedUser
        });
    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * DELETE /api/admin/users/:userId
 * 
 * Permanently deletes a user account from the system
 * Prevents deletion of the default admin account
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} userId - ID of the user to delete
 * @returns {Object} - Success message
 */
router.delete('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Don't allow deleting the default admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'admin@stonybrook.edu') {
            return res.status(403).json({ message: 'Default admin account cannot be deleted' });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PERMIT TYPE MANAGEMENT ROUTES
 * 
 * This section contains routes for managing permit types, including:
 * - Creating new permit types
 * - Retrieving, updating, and deleting existing types
 * - Filtering and paginating permit type listings
 */

/**
 * GET /api/admin/permit-types
 * 
 * Retrieves a paginated and filtered list of all permit types
 * Supports filtering by category, duration, and search term
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} category - Filter by permit category
 * @query {string} duration - Filter by permit duration
 * @query {string} search - Search term for permit fields
 * @query {number} page - Page number for pagination
 * @query {number} limit - Number of results per page
 * @returns {Object} - Permit types array and pagination metadata
 */
router.get('/permit-types', verifyToken, isAdmin, async (req, res) => {
    try {
        const { category, duration, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query based on filters
        const query = {};

        if (category) {
            query.category = category;
        }

        if (duration) {
            query.duration = duration;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { 'lots.lotName': { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await PermitType.countDocuments(query);

        // Get permit types with pagination
        const permitTypes = await PermitType.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate total pages
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            permitTypes,
            pagination: {
                total,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching permit types:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/admin/permit-types/:permitTypeId
 * 
 * Retrieves a single permit type by its ID
 * Used for viewing and editing detailed permit type information
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} permitTypeId - ID of the permit type to retrieve
 * @returns {Object} - Complete permit type information
 */
router.get('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findById(req.params.permitTypeId);

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json(permitType);
    } catch (error) {
        console.error('Error fetching permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * POST /api/admin/permit-types
 * 
 * Creates a new permit type in the system
 * Permit types define what permits users can purchase
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @body {Object} permitTypeData - Complete permit type information
 * @returns {Object} - Success message and created permit type
 */
router.post('/permit-types', verifyToken, isAdmin, async (req, res) => {
    try {
        const newPermitType = new PermitType(req.body);
        await newPermitType.save();

        res.status(201).json({
            message: 'Permit type created successfully',
            permitType: newPermitType
        });
    } catch (error) {
        console.error('Error creating permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/admin/permit-types/:permitTypeId
 * 
 * Updates an existing permit type
 * Validates the updated data and updates the last modified timestamp
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} permitTypeId - ID of the permit type to update
 * @body {Object} updates - Fields to update on the permit type
 * @returns {Object} - Success message and updated permit type
 */
router.put('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findByIdAndUpdate(
            req.params.permitTypeId,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json({
            message: 'Permit type updated successfully',
            permitType
        });
    } catch (error) {
        console.error('Error updating permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * DELETE /api/admin/permit-types/:permitTypeId
 * 
 * Deletes a permit type from the system
 * This does not affect existing permits of this type
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} permitTypeId - ID of the permit type to delete
 * @returns {Object} - Success message
 */
router.delete('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findByIdAndDelete(req.params.permitTypeId);

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json({
            message: 'Permit type deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * RESERVATION MANAGEMENT ROUTES
 * 
 * This section contains routes for administrators to manage parking reservations:
 * - Viewing all reservations with filtering and pagination
 * - Getting reservation statistics
 */

/**
 * GET /api/admin/reservations
 * 
 * Retrieves a paginated and filtered list of all parking reservations
 * Supports complex filtering by multiple fields and search terms
 * Populates related data (user, lot, vehicle) for complete information
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} status - Filter by reservation status
 * @query {string} startDate - Filter by minimum start date
 * @query {string} endDate - Filter by maximum start date
 * @query {string} userId - Filter by specific user
 * @query {string} search - Search term across multiple fields
 * @query {number} page - Page number for pagination
 * @query {number} limit - Number of results per page
 * @returns {Object} - Reservations array and pagination metadata
 */
router.get('/reservations', verifyToken, isAdmin, async (req, res) => {
    try {
        // Support filtering and pagination
        const { status, startDate, endDate, userId, search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};

        if (status) {
            query.status = status;
        }

        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999); // Set to end of day
                query.startTime.$lte = endDateObj;
            }
        }

        if (userId) {
            query.user = userId;
        }

        if (search) {
            // Search in reservation ID or populate and search in user fields
            query.$or = [
                { reservationId: { $regex: search, $options: 'i' } }
                // We'll handle user and lot name search after fetching the data
            ];
        }

        // Get total count for pagination
        const total = await Reservation.countDocuments(query);

        // Get reservations with pagination and populate related fields
        const reservations = await Reservation.find(query)
            .populate('user', 'firstName lastName email')
            .populate('lotId', 'name address location')
            .populate('vehicleInfo', 'plateNumber stateProv make model color')
            .sort({ startTime: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // If there was a search term and we want to search in populated fields,
        // we need to filter the results after populating
        let filteredReservations = reservations;
        if (search && reservations.length > 0) {
            const searchRegex = new RegExp(search, 'i');
            filteredReservations = reservations.filter(reservation => {
                // Check if search matches user name or email
                const userMatch = reservation.user && (
                    (reservation.user.firstName && searchRegex.test(reservation.user.firstName)) ||
                    (reservation.user.lastName && searchRegex.test(reservation.user.lastName)) ||
                    (reservation.user.email && searchRegex.test(reservation.user.email))
                );

                // Check if search matches lot name or address
                const lotMatch = reservation.lotId && (
                    (reservation.lotId.name && searchRegex.test(reservation.lotId.name)) ||
                    (reservation.lotId.address && searchRegex.test(reservation.lotId.address))
                );

                // Check if search matches vehicle info
                const vehicleMatch = reservation.vehicleInfo && (
                    (reservation.vehicleInfo.plateNumber && searchRegex.test(reservation.vehicleInfo.plateNumber)) ||
                    (reservation.vehicleInfo.make && searchRegex.test(reservation.vehicleInfo.make)) ||
                    (reservation.vehicleInfo.model && searchRegex.test(reservation.vehicleInfo.model))
                );

                return userMatch || lotMatch || vehicleMatch || searchRegex.test(reservation.reservationId);
            });
        }

        // Calculate total pages based on filtered count
        const filteredTotal = search ? filteredReservations.length : total;
        const totalPages = Math.ceil(filteredTotal / limit);

        res.status(200).json({
            reservations: filteredReservations,
            pagination: {
                total: filteredTotal,
                currentPage: parseInt(page),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/admin/reservations/count
 * 
 * Gets a count of active reservations for dashboard metrics
 * Can be filtered by different reservation statuses
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} status - Status to count (defaults to 'active')
 * @returns {Object} - Count and status queried
 */
router.get('/reservations/count', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status = 'active' } = req.query;

        // Build query based on status
        const query = { status };

        // For active status, ensure we only count reservations that haven't ended
        if (status === 'active') {
            const now = new Date();
            query.endTime = { $gte: now };
        }

        // Get count of reservations matching the query
        const count = await Reservation.countDocuments(query);

        res.status(200).json({
            count,
            status
        });
    } catch (error) {
        console.error('Error fetching reservation count:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;