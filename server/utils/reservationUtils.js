/**
 * This module contains utility functions for managing reservation-related operations,
 * specifically focused on maintaining the status of reservations based on time.
 */

//  DEPENDENCIES 
// Import the Reservation model for database operations
const Reservation = require('../models/reservation');
// Import notification helper for creating user notifications
const NotificationHelper = require('./notificationHelper');
// Import User model to retrieve user data for notifications
const User = require('../models/users');
// Import email service for sending email notifications
const emailService = require('../services/emailService');

/**
 * Updates the status of expired reservations in the system
 * 
 * This function performs several operations:
 * 1. Identifies reservations with end times in the past but not marked as completed
 * 2. Updates their status to 'completed' in bulk
 * 3. Sends notifications (both in-app and email) to users about their completed reservations
 * 4. Includes different messaging for metered vs permit-based parking
 * 
 * This function is called:
 * - On server startup to ensure consistency
 * - On a daily schedule to regularly update reservation statuses
 * 
 * @returns {Promise<number>} The number of reservations that were updated to completed
 */
const updateExpiredReservations = async () => {
    try {
        // Get current time for comparison with reservation end times
        const now = new Date();

        //  FIND EXPIRED RESERVATIONS 
        // Query the database for active or pending reservations that have end times in the past
        // We also populate the lot information to determine lot type for notifications
        const expiredReservations = await Reservation.find({
            status: { $in: ['active', 'pending'] }, // Only consider reservations that aren't already completed/cancelled
            endTime: { $lt: now }                  // Only consider reservations where end time is earlier than now
        }).populate('lotId');                      // Include lot details for notification messages

        // If we found expired reservations that need updating
        if (expiredReservations.length > 0) {
            console.log(`Found ${expiredReservations.length} expired reservations to update`);

            //  BULK UPDATE RESERVATION STATUS 
            // Use updateMany for efficient bulk update instead of individual updates
            // This marks all expired reservations as 'completed' in a single database operation
            const updateResult = await Reservation.updateMany(
                {
                    status: { $in: ['active', 'pending'] },
                    endTime: { $lt: now }
                },
                { $set: { status: 'completed' } }
            );

            // Log the number of documents that were actually modified
            // Note: modifiedCount is used in newer MongoDB versions, nModified in older versions
            console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} expired reservations to completed`);

            //  NOTIFICATION PROCESSING 
            // For each expired reservation, create notifications to inform users
            for (const reservation of expiredReservations) {
                try {
                    //  IN-APP NOTIFICATION 
                    // Create in-app notification that will appear in the user's notification center
                    // This helps users track the status of their reservations 
                    await NotificationHelper.createReservationNotification(
                        reservation.user,        // User ID who made the reservation
                        reservation,             // The reservation object
                        'completed',             // The new status
                        '/past-reservations'     // Link to view completed reservations
                    );
                    console.log(`Created completion notification for reservation ${reservation._id}`);

                    //  EMAIL NOTIFICATION 
                    // Also send an email notification about the completed reservation
                    try {
                        // Retrieve full user details to get their name and email
                        const user = await User.findById(reservation.user);
                        
                        // Only send email if we have a valid user with an email address
                        if (user && user.email) {
                            //  DETERMINE RESERVATION TYPE 
                            // Different messaging for metered (hourly) vs permit-based reservations
                            // Check if this reservation was for a metered/hourly parking spot
                            const isMetered = reservation.lotId &&
                                (reservation.lotId.rateType === 'Hourly' ||
                                    reservation.lotId.isMetered ||
                                    reservation.lotId.meteredParking);

                            //  CUSTOMIZE MESSAGE BASED ON RESERVATION TYPE 
                            // Create appropriate message based on the type of reservation
                            let completionMessage = "Your parking reservation has been completed.";
                            if (isMetered) {
                                completionMessage = "Your metered parking session has ended. Thank you for using SBU Parking System.";
                            }

                            //  SEND EMAIL NOTIFICATION 
                            // Use the email service to send a formatted confirmation email
                            const emailResult = await emailService.sendReservationConfirmation(
                                user.email,                              // Recipient email
                                `${user.firstName} ${user.lastName}`,    // Recipient name
                                {
                                    _id: reservation._id,                // MongoDB document ID
                                    id: reservation.reservationId,       // Human-readable reservation ID
                                    lotId: reservation.lotId,            // Parking lot details
                                    startTime: reservation.startTime,    // When reservation started
                                    endTime: reservation.endTime,        // When reservation ended
                                    status: 'completed',                 // Current status
                                    totalPrice: reservation.totalPrice,  // Total cost of reservation
                                    additionalInfo: {
                                        completionMessage: completionMessage,  // Custom message
                                        isMetered: isMetered                   // Type flag for template
                                    }
                                },
                                // Base URL for any links in the email
                                process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                            );
                            
                            // Log successful email delivery with message ID for tracking
                            console.log(`Reservation completion email sent to ${user.email}: ${emailResult.messageId}`);
                        }
                    } catch (emailError) {
                        // Log email errors but don't let them stop the process
                        // This ensures other reservations still get processed even if one email fails
                        console.error(`Failed to send reservation completion email for reservation ${reservation._id}:`, emailError);
                    }
                } catch (notifyError) {
                    // Log notification errors but continue processing other reservations
                    console.error(`Error creating notification for completed reservation ${reservation._id}:`, notifyError);
                    // Continue to next reservation even if notification fails
                }
            }
        }

        // Return count of updated reservations for reporting/logging
        return expiredReservations.length;
    } catch (error) {
        // Catch and log any unexpected errors in the entire process
        console.error('Error updating expired reservations:', error);
        // Return 0 to indicate no reservations were updated due to error
        return 0;
    }
};

// Export the function for use in other modules
module.exports = {
    updateExpiredReservations
};