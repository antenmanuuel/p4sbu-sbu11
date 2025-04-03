const Notification = require('../models/notification');
const User = require('../models/users');

/**
 * Notification Helper Utility
 * Provides functions to create different types of notifications for users
 */
const NotificationHelper = {
    /**
     * Create a fine notification
     * @param {string} userId - User ID
     * @param {Object} ticket - Ticket object
     * @param {string} actionUrl - URL to take action on the fine
     * @returns {Promise<Object>} Created notification
     */
    createFineNotification: async (userId, ticket, actionUrl = '/past-citations') => {
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

        // Create notifications in bulk
        const notifications = users.map(user => ({
            user: user._id,
            type,
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }

        return notifications.length;
    }
};

module.exports = NotificationHelper; 