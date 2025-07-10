/**
 * This module contains utility functions for managing parking permit-related operations,
 * specifically focused on maintaining the status of permits based on their expiration dates
 * and notifying users about expiring or expired permits.
 */

const Permit = require('../models/permits');
const NotificationHelper = require('./notificationHelper');
const User = require('../models/users');
const emailService = require('../services/emailService');

/**
 * Updates the status of expired permits in the system and sends notifications
 * 
 * This function performs several operations:
 * 1. Identifies and updates permits that have already expired (end date in the past)
 * 2. Sends notifications (both in-app and email) to users about their expired permits
 * 3. Identifies permits that will expire soon (within 7 days)
 * 4. Sends advance notifications at specific intervals (7 days, 3 days, 1 day before expiry)
 * 
 * This function is called:
 * - On server startup to ensure consistency
 * - On a daily schedule to regularly check permit statuses
 * 
 * @returns {Promise<number>} The number of permits that were updated to expired
 */
const updateExpiredPermits = async () => {
    try {
        // Get today's date and reset time to beginning of day
        // This ensures consistent handling of date comparisons
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        //  HANDLE ALREADY EXPIRED PERMITS 
        // Query the database for active permits that have end dates in the past
        const expiredPermits = await Permit.find({
            status: 'active',           // Only consider permits that are currently active
            endDate: { $lt: today }     // Only consider permits where end date is earlier than today
        });

        // If we found expired permits that need updating
        if (expiredPermits.length > 0) {
            console.log(`Found ${expiredPermits.length} expired permits to update`);

            //  BULK UPDATE PERMIT STATUS 
            // Use updateMany for efficient bulk update instead of individual updates
            // This marks all expired permits as 'expired' in a single database operation
            const updateResult = await Permit.updateMany(
                {
                    status: 'active',
                    endDate: { $lt: today }
                },
                { $set: { status: 'expired' } }
            );

            // Log the number of documents that were actually modified
            console.log(`Updated ${updateResult.nModified || updateResult.modifiedCount} expired permits`);

            //  NOTIFICATION PROCESSING FOR EXPIRED PERMITS 
            // For each expired permit, create notifications to inform users
            for (const permit of expiredPermits) {
                try {
                    //  IN-APP NOTIFICATION 
                    // Create in-app notification that will appear in the user's notification center
                    // This helps users track the status of their permits
                    await NotificationHelper.createPermitExpirationNotification(
                        permit.userId,       // User ID who owns the permit
                        permit,              // The permit object
                        '/dashboard'         // Link to view permit details
                    );

                    //  EMAIL NOTIFICATION 
                    // Also send an email notification about the expired permit
                    try {
                        // Retrieve full user details to get their name and email
                        const user = await User.findById(permit.userId);
                        
                        // Only send email if we have a valid user with an email address
                        if (user && user.email) {
                            // Using the reservation confirmation email template with customized content for permit expiration
                            // This reuses the email template designed for reservations but with permit-specific content
                            const emailResult = await emailService.sendReservationConfirmation(
                                user.email,                              // Recipient email
                                `${user.firstName} ${user.lastName}`,    // Recipient name
                                {
                                    _id: permit._id,                     // MongoDB document ID
                                    id: permit.permitNumber,             // Human-readable permit number
                                    // Join multiple lot names with commas if permit applies to multiple lots
                                    lotId: { name: permit.lots.map(l => l.lotName).join(', ') },
                                    startTime: permit.startDate,         // When permit became valid
                                    endTime: permit.endDate,             // When permit expired
                                    status: 'Permit Expired',            // Current status for display
                                    totalPrice: permit.price,            // Cost of the permit
                                    // Additional permit-specific details for the email template
                                    permitDetails: {
                                        permitName: permit.permitName,   // Name of the permit type
                                        permitType: permit.permitType,   // Category of permit
                                        message: 'Your permit has expired. Please renew your permit to continue parking in designated areas.'
                                    }
                                },
                                // Base URL for any links in the email
                                process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                            );
                            
                            // Log successful email delivery with message ID for tracking
                            console.log(`Permit expiration email sent to ${user.email}: ${emailResult.messageId}`);
                        }
                    } catch (emailError) {
                        // Log email errors but don't let them stop the process
                        console.error(`Failed to send permit expiration email for permit ${permit._id}:`, emailError);
                    }
                } catch (notifyError) {
                    // Log notification errors but continue processing other permits
                    console.error(`Error creating notification for expired permit ${permit._id}:`, notifyError);
                }
            }
        }

        //  HANDLE SOON-TO-EXPIRE PERMITS 
        // Calculate date 7 days from today for finding permits expiring soon
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        // Find permits that will expire within the next 7 days but haven't expired yet
        const expiringPermits = await Permit.find({
            status: 'active',                       // Only active permits
            endDate: { $gte: today, $lte: nextWeek } // End date between today and 7 days from now
        });

        // If we found permits that are about to expire
        if (expiringPermits.length > 0) {
            console.log(`Found ${expiringPermits.length} permits about to expire in the next 7 days`);

            //  ADVANCE NOTIFICATION PROCESSING 
            // For each soon-to-expire permit, create notifications based on how many days are left
            for (const permit of expiringPermits) {
                try {
                    // Calculate exact number of days until expiration
                    // The Math.ceil ensures we round up partial days
                    const daysUntilExpiry = Math.ceil((new Date(permit.endDate) - today) / (1000 * 60 * 60 * 24));

                    //  SCHEDULED NOTIFICATIONS 
                    // Only send notifications at specific milestones: 7 days, 3 days, and 1 day before expiration
                    // This prevents sending too many notifications and annoying users
                    if (daysUntilExpiry === 7 || daysUntilExpiry === 3 || daysUntilExpiry === 1) {
                        //  IN-APP NOTIFICATION 
                        // Create in-app notification about the soon-to-expire permit
                        await NotificationHelper.createPermitExpirationNotification(
                            permit.userId,
                            permit,
                            '/dashboard'
                        );

                        //  EMAIL NOTIFICATION 
                        // Send email notification about the soon-to-expire permit
                        try {
                            // Retrieve user details
                            const user = await User.findById(permit.userId);
                            if (user && user.email) {
                                // Using the reservation confirmation email template with permit-specific content
                                const emailResult = await emailService.sendReservationConfirmation(
                                    user.email,
                                    `${user.firstName} ${user.lastName}`,
                                    {
                                        _id: permit._id,
                                        id: permit.permitNumber,
                                        lotId: { name: permit.lots.map(l => l.lotName).join(', ') },
                                        startTime: permit.startDate,
                                        endTime: permit.endDate,
                                        status: 'Permit Expiring Soon',   // Status for display
                                        totalPrice: permit.price,
                                        permitDetails: {
                                            permitName: permit.permitName,
                                            permitType: permit.permitType,
                                            // Dynamic message with grammatically correct pluralization
                                            message: `Your permit will expire in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}. Please renew your permit to avoid disruption in your parking privileges.`,
                                            daysRemaining: daysUntilExpiry // For template to display countdown
                                        }
                                    },
                                    process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                                );
                                
                                // Log successful email delivery
                                console.log(`Permit expiring soon email sent to ${user.email}: ${emailResult.messageId}`);
                            }
                        } catch (emailError) {
                            // Log email errors but continue processing
                            console.error(`Failed to send permit expiring soon email for permit ${permit._id}:`, emailError);
                        }
                    }
                } catch (notifyError) {
                    // Log notification errors but continue processing other permits
                    console.error(`Error creating notification for expiring permit ${permit._id}:`, notifyError);
                }
            }
        }

        // Return count of updated permits for reporting/logging
        return expiredPermits.length;
    } catch (error) {
        // Catch and log any unexpected errors in the entire process
        console.error('Error updating expired permits:', error);
        // Return 0 to indicate no permits were updated due to error
        return 0;
    }
};

// Export the function for use in other modules
module.exports = {
    updateExpiredPermits
};