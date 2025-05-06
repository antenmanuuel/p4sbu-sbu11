/**
 * This module provides a comprehensive set of utility functions for creating
 * and managing different types of notifications throughout the application.
 * It handles user preferences, notification creation, and distribution to users
 * based on different events in the system (permits, reservations, fines, etc.).
 */


const Notification = require('../models/notification');
const User = require('../models/users');
const NotificationPreferences = require('../models/notification_preferences');

/**
 * NotificationHelper - Collection of utility functions for notification management
 * 
 * This object contains methods for:
 * - Checking if notifications should be sent based on user preferences
 * - Creating various types of notifications (permit, reservation, fine, system)
 * - Sending notifications to individual users or groups of users
 */
const NotificationHelper = {
    /**
     * Checks if a notification should be created based on a user's preferences
     * 
     * This function respects user notification preferences and prevents sending
     * unwanted notifications. It also creates default preferences if none exist.
     * 
     * @param {string} userId - MongoDB ID of the user
     * @param {string} type - Category of notification (fine, permit, reservation, system, etc.)
     * @param {string} channel - Delivery channel (email, push)
     * @returns {Promise<boolean>} Whether notification should be created based on user preferences
     */
    shouldCreateNotification: async (userId, type, channel = 'push') => {
        try {
            //  FETCH USER PREFERENCES 
            // Look up the user's notification preferences
            const preferences = await NotificationPreferences.findOne({ user: userId });

            //  CREATE DEFAULT PREFERENCES IF NONE EXIST 
            // If the user doesn't have preferences set up yet, create default ones
            // Default is to allow all notifications
            if (!preferences) {
                const newPreferences = new NotificationPreferences({ user: userId });
                await newPreferences.save();
                return true; // Default to allowing notifications
            }

            //  CHECK GLOBAL CHANNEL SETTINGS 
            // First check if the user has globally disabled a notification channel
            // If the user has turned off all email or push notifications, respect that setting
            if (channel === 'email' && !preferences.enableEmail) return false;
            if (channel === 'push' && !preferences.enablePush) return false;

            //  CHECK SPECIFIC NOTIFICATION TYPE SETTINGS 
            // If global notifications are enabled, check specific notification type preferences
            // Each notification type can be individually enabled/disabled by the user
            if (channel === 'email') {
                // Check email notification preferences for each type
                switch (type) {
                    case 'fine': return preferences.emailForFine;
                    case 'permit': return preferences.emailForPermit;
                    case 'reservation': return preferences.emailForReservation;
                    case 'system': return preferences.emailForSystem;
                    case 'user-activity': return preferences.emailForUserActivity;
                    case 'system-alerts': return preferences.emailForSystemAlerts;
                    default: return true; // Default to allowing if type not recognized
                }
            } else if (channel === 'push') {
                // Check push notification preferences for each type
                switch (type) {
                    case 'fine': return preferences.pushForFine;
                    case 'permit': return preferences.pushForPermit;
                    case 'reservation': return preferences.pushForReservation;
                    case 'system': return preferences.pushForSystem;
                    case 'user-activity': return preferences.pushForUserActivity;
                    case 'system-alerts': return preferences.pushForSystemAlerts;
                    default: return true; // Default to allowing if type not recognized
                }
            }

            // Default to allowing notifications if channel type not recognized
            return true;
        } catch (error) {
            //  ERROR HANDLING 
            // Log the error but don't prevent the application flow
            console.error('Error checking notification preferences:', error);
            // Default to allowing notifications if there's an error
            // This ensures important notifications are not missed due to errors
            return true;
        }
    },

    /**
     * Creates a notification for a parking citation/fine
     * 
     * Notifies users about fines they've received and provides a link
     * to view and pay the fine.
     * 
     * @param {string} userId - MongoDB ID of the user receiving the fine
     * @param {Object} ticket - The parking ticket/citation object
     * @param {string} actionUrl - URL where user can take action on the fine
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createFineNotification: async (userId, ticket, actionUrl = '/past-citations') => {
        //  CHECK USER PREFERENCES 
        // First check if the user wants to receive fine notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'fine', 'push');
        if (!shouldCreate) {
            console.log(`Skipping fine notification for user ${userId} based on preferences`);
            return null;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with fine-specific information
        const notification = new Notification({
            user: userId,
            type: 'fine',
            title: 'Payment Due',
            message: `You have a fine of $${ticket.amount.toFixed(2)} for ${ticket.name} that needs to be paid.`,
            relatedDocumentId: ticket._id,       // Reference to the actual ticket
            relatedDocumentType: 'ticket',       // Type of related document for queries
            actionUrl,                           // URL to view/pay the fine
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    },

    /**
     * Creates a notification for permit expiration
     * 
     * Notifies users when their parking permits are about to expire or have expired,
     * with different messaging based on expiration timeframe.
     * 
     * @param {string} userId - MongoDB ID of the user who owns the permit
     * @param {Object} permit - The parking permit object
     * @param {string} actionUrl - URL where user can take action (renew permit)
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createPermitExpirationNotification: async (userId, permit, actionUrl = '/dashboard') => {
        //  CHECK USER PREFERENCES 
        // First check if the user wants to receive permit notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'permit', 'push');
        if (!shouldCreate) {
            console.log(`Skipping permit notification for user ${userId} based on preferences`);
            return null;
        }

        //  CALCULATE EXPIRATION TIMEFRAME 
        // Determine how many days until the permit expires (or if already expired)
        const now = new Date();
        const endDate = new Date(permit.endDate);
        const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

        //  CUSTOMIZE MESSAGE BASED ON TIMEFRAME 
        // Create different messages based on when the permit expires
        let message = '';
        if (daysRemaining <= 0) {
            // Permit has already expired
            message = `Your ${permit.permitName} permit has expired.`;
        } else if (daysRemaining <= 7) {
            // Permit will expire within a week (show days)
            message = `Your ${permit.permitName} permit will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}.`;
        } else {
            // Permit expires in more than a week (show date)
            message = `Your ${permit.permitName} permit will expire on ${endDate.toLocaleDateString()}.`;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with permit-specific information
        const notification = new Notification({
            user: userId,
            type: 'permit',
            // Title changes based on whether already expired or expiring soon
            title: daysRemaining <= 0 ? 'Permit Expired' : 'Permit Expiring Soon',
            message,
            relatedDocumentId: permit._id,       // Reference to the actual permit
            relatedDocumentType: 'permit',       // Type of related document for queries
            actionUrl,                           // URL to manage/renew permit
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    },

    /**
     * Creates a notification for parking reservation status changes
     * 
     * Notifies users about changes to their parking reservations including
     * when reservations become active, complete, or are cancelled.
     * 
     * @param {string} userId - MongoDB ID of the user who made the reservation
     * @param {Object} reservation - The parking reservation object
     * @param {string} status - New status of the reservation (active, completed, cancelled)
     * @param {string} actionUrl - URL where user can view reservation details
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createReservationNotification: async (userId, reservation, status, actionUrl = '/past-reservations') => {
        //  CHECK USER PREFERENCES 
        // First check if the user wants to receive reservation notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'reservation', 'push');
        if (!shouldCreate) {
            console.log(`Skipping reservation notification for user ${userId} based on preferences`);
            return null;
        }

        //  CUSTOMIZE MESSAGE BASED ON STATUS 
        // Set different title and message based on reservation status
        let title = '';
        let message = '';

        if (status === 'completed') {
            // Reservation has ended
            title = 'Reservation Completed';
            message = `Your reservation at ${reservation.lotId.name} has been completed.`;
        } else if (status === 'cancelled') {
            // Reservation was cancelled (either by user or system)
            title = 'Reservation Cancelled';
            message = `Your reservation at ${reservation.lotId.name} has been cancelled.`;
        } else if (status === 'active') {
            // Reservation is now active (payment confirmed, time window started)
            title = 'Reservation Active';
            message = `Your reservation at ${reservation.lotId.name} is now active.`;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with reservation-specific information
        const notification = new Notification({
            user: userId,
            type: 'reservation',
            title,
            message,
            relatedDocumentId: reservation._id,    // Reference to the actual reservation
            relatedDocumentType: 'reservation',    // Type of related document for queries
            actionUrl,                             // URL to view reservation details
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    },

    /**
     * Creates a general system notification for an individual user
     * 
     * Used for general announcements, system status updates, or other
     * communications that don't fit into specific categories.
     * 
     * @param {string} userId - MongoDB ID of the user
     * @param {string} title - Title of the notification
     * @param {string} message - Detailed message
     * @param {string|null} actionUrl - Optional URL where user can take action
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createSystemNotification: async (userId, title, message, actionUrl = null) => {
        //  CHECK USER PREFERENCES 
        // First check if the user wants to receive system notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(userId, 'system', 'push');
        if (!shouldCreate) {
            console.log(`Skipping system notification for user ${userId} based on preferences`);
            return null;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with system-specific information
        const notification = new Notification({
            user: userId,
            type: 'system',
            title,
            message,
            actionUrl,                             // URL is optional for system notifications
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    },

    /**
     * Creates notifications for multiple users at once
     * 
     * Used for broadcast announcements, system-wide alerts, or targeted
     * communications to specific user groups (students, faculty, etc.)
     * 
     * @param {string} type - Category of notification (system, fine, permit, reservation)
     * @param {string} title - Title of the notification
     * @param {string} message - Detailed message
     * @param {string|null} actionUrl - Optional URL where users can take action
     * @param {Array<string>} userTypes - Types of users to target (student, faculty, admin)
     * @returns {Promise<number>} Number of notifications successfully created
     */
    createNotificationForAllUsers: async (type, title, message, actionUrl = null, userTypes = ['student', 'faculty']) => {
        //  FIND ELIGIBLE USERS 
        // Get all users of the specified types
        const users = await User.find({ userType: { $in: userTypes } }).select('_id');

        let notificationsCreated = 0;

        //  CREATE NOTIFICATIONS FOR EACH USER 
        // Iterate through each user and create a notification if their preferences allow
        for (const user of users) {
            // Check individual preferences to respect user notification settings
            const shouldCreate = await NotificationHelper.shouldCreateNotification(user._id, type, 'push');
            if (shouldCreate) {
                // Create a new notification for this specific user
                const notification = new Notification({
                    user: user._id,
                    type,
                    title,
                    message,
                    actionUrl,
                    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
                });

                // Save the notification and increment counter
                await notification.save();
                notificationsCreated++;
            }
        }

        // Return the number of notifications actually created
        // This may be less than the number of users if some have disabled notifications
        return notificationsCreated;
    },

    /**
     * Creates a notification for administrators about user activity
     * 
     * Used to alert admins about significant user actions that may
     * require attention or monitoring (e.g., many failed login attempts)
     * 
     * @param {string} adminId - MongoDB ID of the admin user
     * @param {string} title - Title of the notification
     * @param {string} message - Detailed message about the activity
     * @param {string} actionUrl - URL where admin can investigate the activity
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createUserActivityNotification: async (adminId, title, message, actionUrl = '/admin-dashboard') => {
        //  CHECK ADMIN PREFERENCES 
        // First check if the admin wants to receive user activity notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(adminId, 'user-activity', 'push');
        if (!shouldCreate) {
            console.log(`Skipping user activity notification for admin ${adminId} based on preferences`);
            return null;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with user activity information
        const notification = new Notification({
            user: adminId,
            type: 'user-activity',
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Expires in 14 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    },

    /**
     * Creates a system alert notification for administrators
     * 
     * Used for critical system events that require admin attention,
     * such as system errors, security concerns, or capacity issues.
     * 
     * @param {string} adminId - MongoDB ID of the admin user
     * @param {string} title - Title of the alert
     * @param {string} message - Detailed message about the system alert
     * @param {string} actionUrl - URL where admin can address the issue
     * @returns {Promise<Object|null>} Created notification or null if skipped
     */
    createSystemAlertNotification: async (adminId, title, message, actionUrl = '/admin-dashboard') => {
        //  CHECK ADMIN PREFERENCES 
        // First check if the admin wants to receive system alert notifications
        const shouldCreate = await NotificationHelper.shouldCreateNotification(adminId, 'system-alerts', 'push');
        if (!shouldCreate) {
            console.log(`Skipping system alert notification for admin ${adminId} based on preferences`);
            return null;
        }

        //  CREATE NOTIFICATION DOCUMENT 
        // Create a new notification with system alert information
        const notification = new Notification({
            user: adminId,
            type: 'system-alerts',
            title,
            message,
            actionUrl,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expires in 7 days
        });

        //  SAVE NOTIFICATION 
        // Save to database and return the created notification
        await notification.save();
        return notification;
    }
};

// Export the helper object for use throughout the application
module.exports = NotificationHelper; 