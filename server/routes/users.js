const express = require('express');
const router = express.Router();
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Notification = require('../models/notification');

// Get user profile
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
            adminStats = {
                totalUsersManaged: await User.countDocuments(),
                totalPermitsManaged: 1879, // Mock data
                actionsThisMonth: 138, // Mock data
                lastLogin: 'Today, 8:45 AM',
                role: 'System Administrator'
            };
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

// Update user profile
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

// Change password
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

// Get user's activity history
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

// Get user's billing history
router.get('/billing-history', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find permits with payment status "paid" for this user
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
            { $match: { 'permits.paymentStatus': 'paid' } },
            {
                $project: {
                    _id: '$permits._id',
                    date: '$permits.createdAt',
                    description: { $concat: ['$permits.permitName', ' Permit'] },
                    amount: '$permits.price',
                    status: '$permits.paymentStatus',
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
                    paymentStatus: 'completed'
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
                    status: {
                        $cond: {
                            if: { $eq: ['$paymentStatus', 'completed'] },
                            then: 'Paid',
                            else: '$paymentStatus'
                        }
                    },
                    type: { $literal: 'metered' }
                }
            },
            { $sort: { date: -1 } }
        ]);

        // Combine both types of transactions and sort by date
        const combinedHistory = [...permits, ...meteredReservations]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        res.status(200).json({
            success: true,
            billingHistory: combinedHistory.map(item => ({
                _id: item._id.toString(),
                date: item.date,
                description: item.description,
                amount: item.amount,
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

// Get user's saved payment methods
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

// Save a payment method
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

// Delete a payment method
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

// Set a payment method as default
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

// Get user notifications
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

// Mark notification as read
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

// Mark all notifications as read
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

// Delete a notification
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

module.exports = router;

