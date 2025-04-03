const Permit = require('../models/permits');
const NotificationHelper = require('./notificationHelper');

/**
 * Utility function to find and update expired permits
 * Finds all active permits with end dates in the past and updates their status to 'expired'
 * Also sends notifications for permits that are about to expire or have expired
 * @returns {Promise<number>} Number of permits updated
 */
const updateExpiredPermits = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Find active permits that have expired
        const expiredPermits = await Permit.find({
            status: 'active',
            endDate: { $lt: today }
        });

        if (expiredPermits.length > 0) {
            console.log(`Found ${expiredPermits.length} expired permits to update`);

            // Update all expired permits to have status "expired"
            const updateResult = await Permit.updateMany(
                {
                    status: 'active',
                    endDate: { $lt: today }
                },
                { $set: { status: 'expired' } }
            );

            console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} expired permits`);

            // Create notifications for each expired permit
            for (const permit of expiredPermits) {
                try {
                    await NotificationHelper.createPermitExpirationNotification(
                        permit.userId,
                        permit,
                        '/dashboard'
                    );
                } catch (notifyError) {
                    console.error(`Error creating notification for expired permit ${permit._id}:`, notifyError);
                }
            }
        }

        // Find permits that are about to expire in the next 7 days
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const expiringPermits = await Permit.find({
            status: 'active',
            endDate: { $gte: today, $lte: nextWeek }
        });

        if (expiringPermits.length > 0) {
            console.log(`Found ${expiringPermits.length} permits about to expire in the next 7 days`);

            // Create notifications for each soon-to-expire permit
            for (const permit of expiringPermits) {
                try {
                    // Only notify if we haven't already sent a notification in the last 2 days
                    // This prevents spamming users with multiple notifications for the same permit

                    // Calculate days until expiration to ensure we don't send too many notifications
                    const daysUntilExpiry = Math.ceil((new Date(permit.endDate) - today) / (1000 * 60 * 60 * 24));

                    // Send notifications at 7 days, 3 days, and 1 day before expiration
                    if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
                        await NotificationHelper.createPermitExpirationNotification(
                            permit.userId,
                            permit,
                            '/dashboard'
                        );
                    }
                } catch (notifyError) {
                    console.error(`Error creating notification for expiring permit ${permit._id}:`, notifyError);
                }
            }
        }

        return expiredPermits.length;
    } catch (error) {
        console.error('Error updating expired permits:', error);
        return 0;
    }
};

module.exports = {
    updateExpiredPermits
}; 