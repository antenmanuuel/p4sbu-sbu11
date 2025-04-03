const Reservation = require('../models/reservation');
const NotificationHelper = require('./notificationHelper');

/**
 * Utility function to find and update expired reservations
 * Finds reservations with end times in the past and updates their status to 'completed'
 * Also sends notifications to users about completed reservations
 * @returns {Promise<number>} Number of reservations updated
 */
const updateExpiredReservations = async () => {
    try {
        const now = new Date();

        // Find active/pending reservations that have ended
        const expiredReservations = await Reservation.find({
            status: { $in: ['active', 'pending'] },
            endTime: { $lt: now }
        }).populate('lotId');

        if (expiredReservations.length > 0) {
            console.log(`Found ${expiredReservations.length} expired reservations to update`);

            // Update all expired reservations to have status "completed"
            const updateResult = await Reservation.updateMany(
                {
                    status: { $in: ['active', 'pending'] },
                    endTime: { $lt: now }
                },
                { $set: { status: 'completed' } }
            );

            console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} expired reservations to completed`);

            // Create notifications for each completed reservation
            for (const reservation of expiredReservations) {
                try {
                    await NotificationHelper.createReservationNotification(
                        reservation.user,
                        reservation,
                        'completed',
                        '/past-reservations'
                    );
                    console.log(`Created completion notification for reservation ${reservation._id}`);
                } catch (notifyError) {
                    console.error(`Error creating notification for completed reservation ${reservation._id}:`, notifyError);
                    // Continue to next reservation even if notification fails
                }
            }
        }

        return expiredReservations.length;
    } catch (error) {
        console.error('Error updating expired reservations:', error);
        return 0;
    }
};

module.exports = {
    updateExpiredReservations
}; 