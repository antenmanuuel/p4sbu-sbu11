const Notification = require('../models/notification');
const User = require('../models/users');
const NotificationPreferences = require('../models/notification_preferences');

/**
 * Notification Helper Utility
 * Provides functions to create different types of notifications for users
 */
const NotificationHelper = {
    /**
     * Check if notifications should be created based on user preferences
     * @param {string} userId - User ID
     * @param {string} type - Notification type (fine, permit, reservation, system, user-activity, system-alerts)
     * @param {string} channel - Notification channel (email, push)
     * @returns {Promise<boolean>} Whether notification should be created
     */
    shouldCreateNotification: async (userId, type, channel = 'push') => {
        try {
            // Get user notification preferences
            const preferences = await NotificationPreferences.findOne({ user: userId });

            // If no preferences exist, create default and allow notifications
            if (!preferences) {
                const newPreferences = new NotificationPreferences({ user: userId });
                await newPreferences.save();
                return true;
            }

            // Check if notifications are globally enabled for the channel
            if (channel === 'email' && !preferences.enableEmail) return false;
            if (channel === 'push' && !preferences.enablePush) return false;

            // Check specific notification type preferences
            if (channel === 'email') {
                switch (type) {
                    case 'fine': return preferences.emailForFine;
                    case 'permit': return preferences.emailForPermit;
                    case 'reservation': return preferences.emailForReservation;
                    case 'system': return preferences.emailForSystem;
                    case 'user-activity': return preferences.emailForUserActivity;
                    case 'system-alerts': return preferences.emailForSystemAlerts;
                    default: return true;
                }
            } else if (channel === 'push') {
                switch (type) {
                    case 'fine': return preferences.pushForFine;
                    case 'permit': return preferences.pushForPermit;
                    case 'reservation': return preferences.pushForReservation;
                    case 'system': return preferences.pushForSystem;
                    case 'user-activity': return preferences.pushForUserActivity;
                    case 'system-alerts': return preferences.pushForSystemAlerts;
                    default: return true;
                }
            }

            return true;
        } catch (error) {
            console.error('Error checking notification preferences:', error);
            // Default to allowing notifications if there's an error
            return true;
        }
    },

    /**
     * Create a fine notification
     * @param {string} userId - User ID
     * @param {Object} ticket - Ticket object
     * @param {string} actionUrl - URL to take action on the fine
     * @returns {Promise<Object>} Created notification
     */
    createFineNotification: async (userId, ticket, actionUrl = '/past-citations') => {
        // Check if notification should be created based on user preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'fine', 'push');
        if (!shouldCreate) {
            console.log(`Skipping fine notification for user ${userId} based on preferences`);
            return null;
        }

        const notification = new Notification({
            user: userId,
            type: 'fine',
            title: 'Payment Due',
            message: `You have a fine of $${ticket.amount.toFixed(2)} for ${ticket.name} that needs to be paid.`,
            relatedDocumentId: ticket._id,
            relatedDocumentType: 'ticket',
            actionUrl,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
        });

        await notification.save();
        return notification;
    },

    /**
     * Create a permit expiration notification
     * @param {string} userId - User ID
     * @param {Object} permit - Permit object
     * @param {string} actionUrl - URL to take action on the permit
     * @returns {Promise<Object>} Created notification
     */
    createPermitExpirationNotification: async (userId, permit, actionUrl = '/dashboard') => {
        // Check if notification should be created based on user preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'permit', 'push');
        if (!shouldCreate) {
            console.log(`Skipping permit notification for user ${userId} based on preferences`);
            return null;
        }

        const now = new Date();
        const endDate = new Date(permit.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        let message = '';
        if (daysRemaining <= 0) {
            message = `Your ${permit.permitName} permit has expired.`;
        } else if (daysRemaining <= 7) {
            message = `Your ${permit.permitName} permit will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;
        } else {
            message = `Your ${permit.permitName} permit will expire on ${endDate.toLocaleDateString()}.`;
        }

        const notification = new Notification({
            user: userId,
            type: 'permit',
            title: daysRemaining <= 0 ? 'Permit Expired' : 'Permit Expiring Soon',
            message,
            relatedDocumentId: permit._id,
            relatedDocumentType: 'permit',
            actionUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        await notification.save();
        return notification;
    },

    /**
     * Create a reservation notification
     * @param {string} userId - User ID
     * @param {Object} reservation - Reservation object
     * @param {string} status - Status of the reservation (active, completed, cancelled)
     * @param {string} actionUrl - URL to take action on the reservation
     * @returns {Promise<Object>} Created notification
     */
    createReservationNotification: async (userId, reservation, status, actionUrl = '/past-reservations') => {
        // Check if notification should be created based on user preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'reservation', 'push');
        if (!shouldCreate) {
            console.log(`Skipping reservation notification for user ${userId} based on preferences`);
            return null;
        }

        let title = '';
        let message = '';

        if (status === 'completed') {
            title = 'Reservation Completed';
            message = `Your reservation at ${reservation.lotId.name} has been completed.`;
        } else if (status === 'cancelled') {
            title = 'Reservation Cancelled';
            message = `Your reservation at ${reservation.lotId.name} has been cancelled.`;
        } else if (status === 'active') {
            title = 'Reservation Active';
            message = `Your reservation at ${reservation.lotId.name} is now active.`;
        }

        const notification = new Notification({
            user: userId,
            type: 'reservation',
            title,
            message,
            relatedDocumentId: reservation._id,
            relatedDocumentType: 'reservation',
            actionUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        await notification.save();
        return notification;
    },

    /**
     * Create a system notification
     * @param {string} userId - User ID
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} actionUrl - URL to take action
     * @returns {Promise<Object>} Created notification
     */
    createSystemNotification: async (userId, title, message, actionUrl = null) => {
        // Check if notification should be created based on user preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'system', 'push');
        if (!shouldCreate) {
            console.log(`Skipping system notification for user ${userId} based on preferences`);
            return null;
        }

        const notification = new Notification({
            user: userId,
            type: 'system',
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
        });

        await notification.save();
        return notification;
    },

    /**
     * Create a notification for all users
     * @param {string} type - Notification type (system, fine, permit, reservation)
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} actionUrl - URL to take action
     * @param {Array} userTypes - Array of user types to target (student, faculty, admin)
     * @returns {Promise<number>} Number of notifications created
     */
    createNotificationForAllUsers: async (type, title, message, actionUrl = null, userTypes = ['student', 'faculty']) => {
        // Get all user IDs of specified types
        const users = await User.find({ userType: { $in: userTypes } }).select('_id');

        let notificationsCreated = 0;

        // Check preferences for each user individually and create notifications accordingly
        for (const user of users) {
            const shouldCreate = await NotificationHelper.shouldCreateNotification(user._id, type, 'push');
            if (shouldCreate) {
                const notification = new Notification({
                    user: user._id,
                    type,
                    title,
                    message,
                    actionUrl,
                    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
                });

                await notification.save();
                notificationsCreated++;
            }
        }

        return notificationsCreated;
    },

    /**
     * Create a user activity notification for admin
     * @param {string} adminId - Admin user ID
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} actionUrl - URL to take action
     * @returns {Promise<Object>} Created notification
     */
    createUserActivityNotification: async (adminId, title, message, actionUrl = '/admin-dashboard') => {
        // Check if notification should be created based on admin preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(adminId, 'user-activity', 'push');
        if (!shouldCreate) {
            console.log(`Skipping user activity notification for admin ${adminId} based on preferences`);
            return null;
        }

        const notification = new Notification({
            user: adminId,
            type: 'user-activity',
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
        });

        await notification.save();
        return notification;
    },

    /**
     * Create a system alert notification for admin
     * @param {string} adminId - Admin user ID
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} actionUrl - URL to take action
     * @returns {Promise<Object>} Created notification
     */
    createSystemAlertNotification: async (adminId, title, message, actionUrl = '/admin-dashboard') => {
        // Check if notification should be created based on admin preferences
        const shouldCreate = await NotificationHelper.shouldCreateNotification(adminId, 'system-alerts', 'push');
        if (!shouldCreate) {
            console.log(`Skipping system alert notification for admin ${adminId} based on preferences`);
            return null;
        }

        const notification = new Notification({
            user: adminId,
            type: 'system-alerts',
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        await notification.save();
        return notification;
    }
};

module.exports = NotificationHelper; 