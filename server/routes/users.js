/**
 * This module defines API routes for managing user accounts and profiles, including:
 * - User profile management (view, update, change password)
 * - Account activity and billing history tracking
 * - Payment method management through Stripe integration
 * - Notification system with preferences and settings
 * - User activity logging for security and compliance
 * 
 * The module provides both standard user routes and secure mechanisms
 * for managing personal data, payment information, and notification preferences.
 */

const express = require('express');
const router = express.Router();
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Notification = require('../models/notification');
const NotificationPreferences = require('../models/notification_preferences');
const Permit = require('../models/permits');

/**
 * GET /api/users/profile
 * 
 * Retrieves the authenticated user's profile information
 * Includes basic user data, permits, and additional admin statistics for admin users
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} User profile details, permits, and optional admin statistics
 */
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find user but don't return password
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create the response with all necessary user fields
        const userProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            sbuId: user.sbuId,
            idLabel: user.userType === 'visitor' ? 'Visitor ID' : 'SBU ID',
            phone: user.phone || '', // Include phone if it exists
            isApproved: user.isApproved,
            car: user.car,
            createdAt: user.createdAt
        };

        // Get user permits (this would link to your permits collection in a real app)
        // For now we'll just return mock data
        const userPermits = [
            {
                id: 'P-2024-001',
                type: 'Commuter Core',
                validFrom: '2024-01-01',
                validUntil: '2024-12-31',
                status: 'Active',
                vehicle: {
                    make: 'Toyota',
                    model: 'Camry',
                    year: '2020',
                    color: 'Blue',
                    licensePlate: 'NY-ABC-123'
                }
            }
        ];

        // Additional admin statistics (only for admin users)
        let adminStats = null;
        if (user.userType === 'admin') {
            try {
                // Get latest login activity for the user
                const lastLoginActivity = await UserActivity.findOne({
                    user: user._id,
                    activity_type: 'login'
                }).sort({ created_at: -1 });

                // Format last login time
                let lastLogin = 'Never logged in';
                if (lastLoginActivity) {
                    const loginDate = new Date(lastLoginActivity.created_at);
                    const today = new Date();
                    const isToday = loginDate.toDateString() === today.toDateString();

                    if (isToday) {
                        lastLogin = `Today, ${loginDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                    } else {
                        lastLogin = loginDate.toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                    }
                }

                // Get actual counts from database
                const totalUsersManaged = await User.countDocuments() || 0;
                const totalPermitsManaged = await Permit.countDocuments() || 0;

                // Count admin actions for the current month
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                // Don't track actions anymore
                adminStats = {
                    totalUsersManaged,
                    totalPermitsManaged,
                    lastLogin,
                    role: user.userType === 'admin' ? 'System Administrator' : 'Staff'
                };

                console.log('Admin stats loaded from database:', adminStats);
            } catch (error) {
                console.error('Error fetching admin statistics:', error);
                // Use actual data when possible, zeros for anything that failed
                adminStats = {
                    totalUsersManaged: 0,
                    totalPermitsManaged: 0,
                    lastLogin: 'Unknown',
                    role: 'System Administrator'
                };
            }
        }

        res.status(200).json({
            user: userProfile,
            permits: userPermits,
            adminStats
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/profile
 * 
 * Updates the authenticated user's profile information
 * Supports updating phone, address, and emergency contact details
 * Logs user activity for security and audit purposes
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {string} [phone] - User's phone number
 * @body {string} [address] - User's address
 * @body {string} [emergencyContact] - User's emergency contact information
 * @returns {Object} Updated user profile information
 */
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone, address, emergencyContact } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Track previous data for activity logging
        const previousPhone = user.phone;
        const previousAddress = user.address;
        const previousEmergencyContact = user.emergencyContact;

        // Update fields if provided
        if (phone !== undefined) {
            user.phone = phone;
        }
        if (address !== undefined) {
            user.address = address;
        }
        if (emergencyContact !== undefined) {
            user.emergencyContact = emergencyContact;
        }

        // Save the updated user
        await user.save();

        // Log profile update activity if any field changed
        const fieldsChanged = [];
        if (previousPhone !== phone) fieldsChanged.push('phone');
        if (previousAddress !== address) fieldsChanged.push('address');
        if (previousEmergencyContact !== emergencyContact) fieldsChanged.push('emergencyContact');

        if (fieldsChanged.length > 0) {
            await UserActivity.logActivity({
                user: userId,
                activity_type: 'profile_update',
                description: 'Profile information updated',
                details: `Updated: ${fieldsChanged.join(', ')}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
        }

        // Return updated user without password
        const updatedUser = await User.findById(userId).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                userType: updatedUser.userType,
                sbuId: updatedUser.sbuId,
                idLabel: updatedUser.userType === 'visitor' ? 'Visitor ID' : 'SBU ID',
                phone: updatedUser.phone || '',
                address: updatedUser.address || '',
                emergencyContact: updatedUser.emergencyContact || '',
                isApproved: updatedUser.isApproved,
                car: updatedUser.car,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/change-password
 * 
 * Changes the authenticated user's password
 * Validates current password before allowing change
 * Logs security-related activity for audit purposes
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {string} currentPassword - User's current password for verification
 * @body {string} newPassword - New password to set
 * @returns {Object} Success message for password change
 */
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Find user with password
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            // Log failed password change attempt
            await UserActivity.logActivity({
                user: user._id,
                activity_type: 'password_change_failed',
                description: 'Failed password change attempt',
                details: 'Current password verification failed',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword; // Will be hashed by the pre-save hook
        await user.save();

        // Log successful password change
        await UserActivity.logActivity({
            user: user._id,
            activity_type: 'password_change',
            description: 'Password changed successfully',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

/**
 * GET /api/users/activity
 * 
 * Retrieves the authenticated user's recent account activity
 * Limited to the 10 most recent activities
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Array} List of recent user activities with timestamps
 */
router.get('/activity', verifyToken, async (req, res) => {
    try {
        // Get the most recent activities for the user, limited to 10
        const activities = await UserActivity.find({ user: req.user.userId })
            .sort({ created_at: -1 })
            .limit(10);

        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/users/billing-history
 * 
 * Retrieves the authenticated user's complete billing history
 * Includes permits, reservations, and any associated refunds
 * Combines all transaction types into a chronological history
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} Comprehensive billing history with transaction details
 */
router.get('/billing-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find permits for this user - include both active and refunded permits
        const permits = await User.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'permits',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'permits'
                }
            },
            { $unwind: '$permits' },
            // Include both paid permits and those that were paid but later refunded
            {
                $match: {
                    $or: [
                        { 'permits.paymentStatus': 'paid' },
                        // Include permits that were paid but later refunded for permit switches
                        {
                            'permits.paymentStatus': 'refunded',
                            'permits.replacesPermitId': { $exists: true, $ne: null }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: '$permits._id',
                    date: '$permits.createdAt',
                    description: {
                        $cond: {
                            if: { $regexMatch: { input: '$permits.permitName', regex: /Permit$/ } },
                            then: '$permits.permitName',
                            else: { $concat: ['$permits.permitName', ' Permit'] }
                        }
                    },
                    amount: '$permits.price',
                    status: {
                        $cond: {
                            if: { $eq: ['$permits.paymentStatus', 'refunded'] },
                            then: {
                                $cond: {
                                    if: { $ne: [{ $ifNull: ['$permits.replacesPermitId', null] }, null] },
                                    then: 'Paid', // For permits that were switched, show as paid
                                    else: 'Refunded'  // For permits that were refunded, show as refunded
                                }
                            },
                            else: '$permits.paymentStatus'
                        }
                    },
                    type: { $literal: 'permit' }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Find completed metered parking reservations (hourly) for this user
        const Reservation = mongoose.model('Reservation');
        const Lot = mongoose.model('Lot');

        const meteredReservations = await Reservation.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    // Include all reservations, including refunded ones
                }
            },
            {
                $lookup: {
                    from: 'lots',
                    localField: 'lotId',
                    foreignField: '_id',
                    as: 'lot'
                }
            },
            { $unwind: { path: '$lot', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $or: [
                        { 'lot.rateType': 'Hourly' },
                        { 'lot.features.isMetered': true }
                    ]
                }
            },
            {
                $project: {
                    _id: '$_id',
                    date: '$createdAt',
                    description: {
                        $concat: [
                            'Metered Parking at ',
                            { $ifNull: ['$lot.name', 'Unknown Lot'] },
                            ' (Reservation #',
                            { $substr: ['$reservationId', 0, 8] },
                            ')'
                        ]
                    },
                    amount: '$totalPrice',
                    status: 'Paid', // Always show as "Paid" for original transactions
                    type: { $literal: 'metered' },
                    // Track refund state separately
                    originalPaymentStatus: '$paymentStatus',
                    wasRefunded: { $eq: ['$paymentStatus', 'refunded'] }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Find refunds for cancelled or refunded reservations
        const refunds = await Reservation.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    paymentStatus: 'refunded',
                    'refundInfo.amount': { $gt: 0 }
                }
            },
            {
                $lookup: {
                    from: 'lots',
                    localField: 'lotId',
                    foreignField: '_id',
                    as: 'lot'
                }
            },
            { $unwind: { path: '$lot', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    _id: { $concat: [{ $toString: '$_id' }, '_refund'] },
                    date: '$refundInfo.refundedAt',
                    description: {
                        $concat: [
                            'Refund: Cancelled Reservation at ',
                            { $ifNull: ['$lot.name', 'Unknown Lot'] },
                            ' (Reservation #',
                            { $substr: ['$reservationId', 0, 8] },
                            ')'
                        ]
                    },
                    amount: { $multiply: ['$refundInfo.amount', -1] }, // Negative amount for refunds
                    status: 'Refunded',
                    type: { $literal: 'refund' }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Find refunds for cancelled or refunded permits (without replacesPermitId)
        const permitRefunds = await Permit.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    $or: [
                        // Match permits explicitly marked as refunded
                        { paymentStatus: 'refunded', replacesPermitId: { $exists: false } },
                        // Also match inactive permits with refund data that don't have a replacesPermitId
                        {
                            status: 'inactive',
                            refundedAt: { $exists: true, $ne: null },
                            replacesPermitId: { $exists: false }
                        }
                    ]
                }
            },
            {
                $project: {
                    _id: { $concat: [{ $toString: '$_id' }, '_refund'] },
                    date: { $ifNull: ['$refundedAt', '$updatedAt'] },
                    description: {
                        $concat: [
                            'Refund: Cancelled Permit - ',
                            { $ifNull: ['$permitName', 'Permit'] }
                        ]
                    },
                    amount: { $multiply: [{ $ifNull: ['$price', 0] }, -1] }, // Negative amount for refunds
                    status: 'Refunded',
                    type: { $literal: 'refund' }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Find refunds for permits that were switched (those with replacesPermitId)
        const permitSwitchRefunds = await Permit.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    paymentStatus: 'refunded',
                    replacesPermitId: { $exists: true, $ne: null }
                }
            },
            {
                $project: {
                    _id: { $concat: [{ $toString: '$_id' }, '_switch_refund'] },
                    date: { $ifNull: ['$refundedAt', '$updatedAt'] },
                    description: {
                        $concat: [
                            'Refund: Permit Switch - ',
                            { $ifNull: ['$permitName', 'Permit'] }
                        ]
                    },
                    amount: { $multiply: [{ $ifNull: ['$price', 0] }, -1] }, // Negative amount for refunds
                    status: 'Refunded',
                    type: { $literal: 'refund' }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Combine all types of transactions and sort by date
        const combinedHistory = [...permits, ...meteredReservations, ...refunds, ...permitRefunds, ...permitSwitchRefunds]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            billingHistory: combinedHistory.map(item => ({
                _id: item._id.toString(),
                date: item.date,
                description: item.description,
                amount: parseFloat(item.amount.toFixed(2)),
                status: item.status === 'paid' ? 'Paid' : item.status,
                type: item.type
            }))
        });
    } catch (error) {
        console.error('Error fetching billing history:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * GET /api/users/payment-methods
 * 
 * Retrieves the authenticated user's saved payment methods from Stripe
 * Returns formatted card information with masked details for security
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} List of saved payment methods with card details
 */
router.get('/payment-methods', verifyToken, async (req, res) => {
    try {
        // Get user to check for Stripe customer ID
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user doesn't have a Stripe customer ID yet, they have no payment methods
        if (!user.stripeCustomerId) {
            return res.json({ paymentMethods: [] });
        }

        // Retrieve customer's payment methods from Stripe
        const paymentMethods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: 'card',
        });

        // Transform the payment methods to only include the data we need
        const formattedPaymentMethods = paymentMethods.data.map(pm => ({
            id: pm.id,
            brand: pm.card.brand,
            last4: pm.card.last4,
            exp_month: pm.card.exp_month,
            exp_year: pm.card.exp_year,
            isDefault: pm.id === user.defaultPaymentMethodId
        }));

        res.json({ paymentMethods: formattedPaymentMethods });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ message: 'Failed to fetch payment methods' });
    }
});

/**
 * POST /api/users/payment-methods
 * 
 * Saves a new payment method for the authenticated user
 * Creates Stripe customer if user doesn't have one
 * Optionally sets the payment method as default
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {string} paymentMethodId - Stripe payment method ID to save
 * @body {boolean} [isDefault] - Whether to set as default payment method
 * @returns {Object} Saved payment method details
 */
router.post('/payment-methods', verifyToken, async (req, res) => {
    try {
        const { paymentMethodId, isDefault } = req.body;

        if (!paymentMethodId) {
            return res.status(400).json({ message: 'Payment method ID is required' });
        }

        // Get user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let customerId = user.stripeCustomerId;

        // If user doesn't have a Stripe customer ID yet, create one
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                metadata: {
                    userId: user._id.toString()
                }
            });

            customerId = customer.id;

            // Update user with Stripe customer ID
            user.stripeCustomerId = customerId;
            await user.save();
        }

        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
            customer: customerId,
        });

        // If this is the default payment method or the user has no default, set it as default
        if (isDefault || !user.defaultPaymentMethodId) {
            user.defaultPaymentMethodId = paymentMethodId;
            await user.save();
        }

        // Get the payment method details to return
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        res.json({
            success: true,
            paymentMethod: {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
                isDefault: paymentMethodId === user.defaultPaymentMethodId
            }
        });
    } catch (error) {
        console.error('Error saving payment method:', error);
        res.status(500).json({ message: 'Failed to save payment method' });
    }
});

/**
 * DELETE /api/users/payment-methods/:paymentMethodId
 * 
 * Deletes a specific payment method for the authenticated user
 * Handles default payment method reassignment if needed
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} paymentMethodId - ID of the payment method to delete
 * @returns {Object} Success confirmation
 */
router.delete('/payment-methods/:paymentMethodId', verifyToken, async (req, res) => {
    try {
        const { paymentMethodId } = req.params;

        // Get user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Make sure the user has a Stripe customer ID
        if (!user.stripeCustomerId) {
            return res.status(400).json({ message: 'No payment methods found for this user' });
        }

        // Detach the payment method from the customer
        await stripe.paymentMethods.detach(paymentMethodId);

        // If this was the default payment method, clear it
        if (user.defaultPaymentMethodId === paymentMethodId) {
            user.defaultPaymentMethodId = null;

            // Try to find another payment method to set as default
            const paymentMethods = await stripe.paymentMethods.list({
                customer: user.stripeCustomerId,
                type: 'card',
            });

            if (paymentMethods.data.length > 0) {
                user.defaultPaymentMethodId = paymentMethods.data[0].id;
            }

            await user.save();
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting payment method:', error);
        res.status(500).json({ message: 'Failed to delete payment method' });
    }
});

/**
 * PUT /api/users/payment-methods/:paymentMethodId/default
 * 
 * Sets a specific payment method as the default for the authenticated user
 * Used for streamlining future payments
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} paymentMethodId - ID of the payment method to set as default
 * @returns {Object} Updated payment method with default status
 */
router.put('/payment-methods/:paymentMethodId/default', verifyToken, async (req, res) => {
    try {
        const { paymentMethodId } = req.params;

        // Get user
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Make sure the user has a Stripe customer ID
        if (!user.stripeCustomerId) {
            return res.status(400).json({ message: 'No payment methods found for this user' });
        }

        // Set the payment method as default
        user.defaultPaymentMethodId = paymentMethodId;
        await user.save();

        // Get the payment method details to return
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        res.json({
            success: true,
            paymentMethod: {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                exp_month: paymentMethod.card.exp_month,
                exp_year: paymentMethod.card.exp_year,
                isDefault: true
            }
        });
    } catch (error) {
        console.error('Error setting default payment method:', error);
        res.status(500).json({ message: 'Failed to set default payment method' });
    }
});

/**
 * GET /api/users/notifications
 * 
 * Retrieves notifications for the authenticated user
 * Supports pagination and filtering for unread notifications
 * Includes metadata about notification counts
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @query {number} [limit=10] - Maximum number of notifications to return
 * @query {boolean} [unreadOnly=false] - Whether to only return unread notifications
 * @query {number} [skip=0] - Number of notifications to skip (for pagination)
 * @returns {Object} List of notifications with count metadata
 */
router.get('/notifications', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { limit = 10, unreadOnly = false, skip = 0 } = req.query;

        // Build query
        const query = { user: userId };

        // Only get unread notifications if specified
        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        // Get notifications with pagination
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(parseInt(skip))
            .limit(parseInt(limit));

        // Count total unread notifications
        const unreadCount = await Notification.countDocuments({
            user: userId,
            isRead: false
        });

        // Count total notifications
        const totalCount = await Notification.countDocuments({ user: userId });

        res.status(200).json({
            notifications,
            unreadCount,
            totalCount
        });
    } catch (error) {
        console.error('Error fetching user notifications:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/notifications/:notificationId/read
 * 
 * Marks a specific notification as read for the authenticated user
 * Verifies notification ownership before updating
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} notificationId - ID of the notification to mark as read
 * @returns {Object} Updated notification information
 */
router.put('/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        // Verify notification belongs to user
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Update notification status
        notification.isRead = true;
        await notification.save();

        res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/notifications/read-all
 * 
 * Marks all unread notifications as read for the authenticated user
 * Updates multiple notifications in a single operation
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} Success message with count of updated notifications
 */
router.put('/notifications/read-all', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Update all user's unread notifications
        const result = await Notification.updateMany(
            { user: userId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({
            message: 'All notifications marked as read',
            count: result.modifiedCount
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * DELETE /api/users/notifications/:notificationId
 * 
 * Deletes a specific notification for the authenticated user
 * Verifies notification ownership before deletion
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} notificationId - ID of the notification to delete
 * @returns {Object} Success confirmation message
 */
router.delete('/notifications/:notificationId', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user.userId;

        // Verify notification belongs to user
        const notification = await Notification.findOne({
            _id: notificationId,
            user: userId
        });

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        // Delete the notification
        await Notification.findByIdAndDelete(notificationId);

        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * GET /api/users/notification-preferences
 * 
 * Retrieves notification preferences for the authenticated user
 * Creates default preferences if none exist
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} User's notification preference settings
 */
router.get('/notification-preferences', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find user's notification preferences, or create default if not exists
        let preferences = await NotificationPreferences.findOne({ user: userId });

        if (!preferences) {
            // Create default preferences
            preferences = new NotificationPreferences({ user: userId });
            await preferences.save();
        }

        res.status(200).json({
            success: true,
            preferences
        });
    } catch (error) {
        console.error('Error fetching notification preferences:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * PUT /api/users/notification-preferences
 * 
 * Updates notification preferences for the authenticated user
 * Supports granular control over email and push notification settings
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {Object} - Notification preference fields to update
 * @returns {Object} Updated notification preferences
 */
router.put('/notification-preferences', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const updateData = req.body;

        // Extract only valid fields for update
        const validFields = [
            'enableEmail', 'enablePush',
            'emailForReservation', 'emailForPermit', 'emailForFine', 'emailForSystem',
            'pushForReservation', 'pushForPermit', 'pushForFine', 'pushForSystem',
            // Admin-specific notification preferences
            'emailForUserActivity', 'emailForSystemAlerts',
            'pushForUserActivity', 'pushForSystemAlerts'
        ];

        const filteredUpdate = {};
        validFields.forEach(field => {
            if (updateData[field] !== undefined) {
                filteredUpdate[field] = updateData[field];
            }
        });

        // Find and update the preferences, create if not exists
        let preferences = await NotificationPreferences.findOneAndUpdate(
            { user: userId },
            {
                $set: filteredUpdate,
                $setOnInsert: { user: userId }
            },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: 'Notification preferences updated',
            preferences
        });
    } catch (error) {
        console.error('Error updating notification preferences:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

