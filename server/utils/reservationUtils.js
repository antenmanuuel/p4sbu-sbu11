const Reservation = require('../models/reservation');
const NotificationHelper = require('./notificationHelper');
const { toEasternTime, formatETDate } = require('./dateUtils');

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

/**
 * Converts a reservation object's date fields to Eastern Time
 * @param {Object} reservation - Reservation object
 * @returns {Object} Reservation object with times converted to Eastern Time
 */
const convertReservationTimesToET = (reservation) => {
    if (!reservation) return reservation;

    // If reservation is a Mongoose document, convert it to a plain object
    const reservationObj = reservation.toObject ? reservation.toObject() : JSON.parse(JSON.stringify(reservation));

    // Convert date fields to Eastern Time
    if (reservationObj.startTime) {
        const etStartTime = toEasternTime(new Date(reservationObj.startTime));
        reservationObj.startTime = etStartTime.toISOString();
        // Add a display field for formatted date
        reservationObj.startTimeFormatted = formatETDate(reservationObj.startTime);
    }

    if (reservationObj.endTime) {
        const etEndTime = toEasternTime(new Date(reservationObj.endTime));
        reservationObj.endTime = etEndTime.toISOString();
        // Add a display field for formatted date
        reservationObj.endTimeFormatted = formatETDate(reservationObj.endTime);
    }

    if (reservationObj.createdAt) {
        const etCreatedAt = toEasternTime(new Date(reservationObj.createdAt));
        reservationObj.createdAt = etCreatedAt.toISOString();
        // Add a display field for formatted date
        reservationObj.createdAtFormatted = formatETDate(reservationObj.createdAt);
    }

    if (reservationObj.cancelledAt) {
        const etCancelledAt = toEasternTime(new Date(reservationObj.cancelledAt));
        reservationObj.cancelledAt = etCancelledAt.toISOString();
        // Add a display field for formatted date
        reservationObj.cancelledAtFormatted = formatETDate(reservationObj.cancelledAt);
    }

    // Handle refundInfo if it exists
    if (reservationObj.refundInfo && reservationObj.refundInfo.refundedAt) {
        const etRefundedAt = toEasternTime(new Date(reservationObj.refundInfo.refundedAt));
        reservationObj.refundInfo.refundedAt = etRefundedAt.toISOString();
        reservationObj.refundInfo.refundedAtFormatted = formatETDate(reservationObj.refundInfo.refundedAt);
    }

    // Handle extension history if it exists
    if (reservationObj.extensionHistory && Array.isArray(reservationObj.extensionHistory)) {
        reservationObj.extensionHistory = reservationObj.extensionHistory.map(ext => {
            const extCopy = { ...ext };
            if (extCopy.extendedAt) {
                const etExtendedAt = toEasternTime(new Date(extCopy.extendedAt));
                extCopy.extendedAt = etExtendedAt.toISOString();
                extCopy.extendedAtFormatted = formatETDate(extCopy.extendedAt);
            }
            return extCopy;
        });
    }

    return reservationObj;
};

/**
 * Prepares a reservation response by converting all time fields to Eastern Time
 * @param {Object|Array} data - Reservation data (single object or array)
 * @returns {Object|Array} Reservation data with times in Eastern Time
 */
const prepareReservationResponse = (data) => {
    if (Array.isArray(data)) {
        // Convert each reservation in the array
        return data.map(reservation => convertReservationTimesToET(reservation));
    } else {
        // Convert a single reservation
        return convertReservationTimesToET(data);
    }
};

module.exports = {
    updateExpiredReservations,
    convertReservationTimesToET,
    prepareReservationResponse
}; 