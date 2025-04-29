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

// Get Pending Users
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

// Approve User
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

// Get All Users
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

// Get User by ID
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

// Update User
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

// Toggle User Status (active/inactive)
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

// Change User Role (student, faculty, visitor, admin)
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

// Delete User
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

// PERMIT TYPE ROUTES
// Get All Permit Types with pagination
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

// Get a single permit type by ID
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

// Create a new permit type
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

// Update a permit type
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

// Delete a permit type
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

// Get all reservations (admin only)
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

// Get active reservations count
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