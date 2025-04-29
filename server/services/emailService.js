const nodemailer = require('nodemailer');
require('dotenv').config();

let transporter;
let emailConfigured = false;

// Configure Nodemailer with Gmail SMTP
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    console.log('Initializing email service with:', process.env.EMAIL_USER);

    // Create reusable transporter using Gmail SMTP
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // Verify transport configuration
    transporter.verify((error, success) => {
        if (error) {
            console.error('Email service setup error:', error);
            console.error('==== EMAIL AUTHENTICATION FAILED ====');
            console.error('If using Gmail, make sure to:');
            console.error('1. Enable 2-Step Verification in your Google Account');
            console.error('2. Generate an App Password (Google Account > Security > App passwords)');
            console.error('3. Use that 16-character App Password in your .env file');
            console.error('4. Make sure "Less secure app access" is turned OFF - App Passwords are more secure');
            console.error('================================');
            emailConfigured = false;
        } else {
            console.log('Email service is successfully configured and ready to send messages');
            emailConfigured = true;
        }
    });
} else {
    console.warn('Email credentials not provided in .env file. EMAIL_USER and EMAIL_PASSWORD are required.');
    console.warn('Email service will be disabled - notifications will be logged but not sent.');
    emailConfigured = false;
}

const emailService = {
    /**
     * Send password reset email
     * @param {string} to - Recipient email address
     * @param {string} token - Password reset token
     * @param {string} baseUrl - Base URL for the client application
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendPasswordResetEmail: async (to, token, baseUrl) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent reset email to:', to);
            console.log('Reset token:', token);
            console.log('Reset URL would be:', `${baseUrl}/reset-password/${token}`);
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Log for debugging
            console.log('Reset email parameters:');
            console.log('- Client base URL:', baseUrl);
            console.log('- Token:', token);
            console.log('- Recipient:', to);

            // Ensure baseUrl doesn't have a trailing slash
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

            // Create the reset URL
            const resetUrl = `${cleanBaseUrl}/reset-password/${token}`;

            console.log('Generated reset URL:', resetUrl);

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to,
                subject: 'Password Reset Request',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #cc0000; text-align: center;">Reset Your Password</h2>
            <p>Hello,</p>
            <p>You requested a password reset for your SBU Parking System account. Please click the button below to reset your password.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            <p>For security reasons, this link will expire in 1 hour.</p>
            <p>If the button above doesn't work, copy and paste the following URL into your browser:</p>
            <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 3px;">${resetUrl}</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
            </p>
          </div>
        `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Password reset email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send reservation confirmation email
     * @param {string} to - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {Object} reservation - Reservation details
     * @param {string} baseUrl - Base URL for the client application
     * @param {boolean} isReminder - Whether this is a reminder email (default: false)
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendReservationConfirmation: async (to, userName, reservation, baseUrl, isReminder = false) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log(`Email service disabled. Would have sent ${isReminder ? 'reminder' : 'confirmation'} to:`, to);
            console.log('Reservation details:', JSON.stringify(reservation, null, 2));
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Ensure baseUrl is a string to prevent "endsWith is not a function" error
            if (typeof baseUrl !== 'string') {
                console.warn('Invalid baseUrl provided to sendReservationConfirmation:', baseUrl);
                baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_BASE_URL || 'http://localhost:5173';
            }

            // Format dates for display
            const startTime = new Date(reservation.startTime).toLocaleString();
            const endTime = new Date(reservation.endTime).toLocaleString();

            // Create reservation link
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const reservationUrl = `${cleanBaseUrl}/dashboard`;

            // Check if this is a cancellation notification
            const isCancelled = reservation.status === 'cancelled';

            // Set the appropriate subject line
            let subject;
            if (isReminder) {
                subject = 'Parking Reservation Reminder';
            } else if (isCancelled) {
                subject = 'Parking Reservation Cancelled';
            } else {
                subject = 'Parking Reservation Confirmation';
            }

            // Set appropriate heading and message based on status
            let heading, message;
            if (isReminder) {
                heading = 'Upcoming Reservation Reminder';
                message = 'This is a reminder about your upcoming parking reservation. Here are the details:';
            } else if (isCancelled) {
                heading = 'Reservation Cancellation';
                message = 'Your parking reservation has been cancelled. Here are the details:';
            } else {
                heading = 'Reservation Confirmation';
                message = 'Your parking reservation has been confirmed. Here are the details:';
            }

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to,
                subject,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #cc0000; text-align: center;">${heading}</h2>
            <p>Hello ${userName || ''},</p>
            <p>${message}</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Reservation ID:</strong> ${reservation._id || reservation.id}</p>
              <p><strong>Parking Lot:</strong> ${reservation.lotName || (reservation.lotId && reservation.lotId.name) || 'Not specified'}</p>
              <p><strong>Start Time:</strong> ${startTime}</p>
              <p><strong>End Time:</strong> ${endTime}</p>
              <p><strong>Status:</strong> ${reservation.status || 'Confirmed'}</p>
              <p><strong>Payment:</strong> ${
                    // Check various possible price fields
                    (reservation.amount > 0 || reservation.totalAmount > 0 || reservation.price > 0 || reservation.totalPrice > 0)
                        ? `$${parseFloat(reservation.amount || reservation.totalAmount || reservation.price || reservation.totalPrice).toFixed(2)}`
                        : reservation.freeReservation || reservation.permitToCancel || (reservation.freeParkingReason && reservation.freeParkingReason.includes('permit'))
                            ? 'Free (Covered by existing permit)'
                            : reservation.freeAfter4PM
                                ? 'Free (After 4PM access with permit)'
                                : 'Free'
                    }</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${reservationUrl}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Reservation</a>
            </div>
            
            <p>${isCancelled
                        ? 'If you believe this cancellation was made in error, please contact our support team.'
                        : isReminder
                            ? 'Remember to arrive on time for your reservation. If you need to make any changes, please do so at least 2 hours before the scheduled start time.'
                            : 'Thank you for using the SBU Parking System. If you need to make any changes to your reservation, please visit your dashboard.'}</p>
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
            </p>
          </div>
        `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Reservation ${isReminder ? 'reminder' : (isCancelled ? 'cancellation' : 'confirmation')} email sent:`, info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Failed to send reservation ${isReminder ? 'reminder' : 'confirmation'} email:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send citation notification email
     * @param {string} to - Recipient email address
     * @param {Object} citation - Citation details
     * @param {boolean} isPaid - Whether the citation has been paid
     * @param {string} baseUrl - Base URL for the client application
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendCitationNotification: async (to, citation, isPaid, baseUrl) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent citation notification to:', to);
            console.log('Citation details:', JSON.stringify(citation, null, 2));
            console.log('Is paid:', isPaid);
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Format date for display
            const issueDate = citation.date_posted ? new Date(citation.date_posted).toLocaleDateString() :
                new Date(citation.issueDate || citation.createdAt).toLocaleDateString();

            // Format due date - this will show the 2 week deadline
            const dueDate = citation.dueDate ? new Date(citation.dueDate).toLocaleDateString() : 'Two weeks from issue date';

            // Create citation link
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const citationUrl = `${cleanBaseUrl}/past-citations`;

            const subject = isPaid ? 'Parking Citation Payment Confirmation' : 'Parking Citation Notification';

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to,
                subject,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #cc0000; text-align: center;">${isPaid ? 'Citation Payment Confirmation' : 'Citation Notification'}</h2>
            <p>Hello,</p>
            <p>${isPaid
                        ? 'Your payment for the following parking citation has been received and processed.'
                        : 'You have received a parking citation. Please review the details below:'}</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Citation ID:</strong> ${citation._id || citation.id}</p>
              <p><strong>Issue Date:</strong> ${issueDate}</p>
              <p><strong>Vehicle:</strong> ${citation.vehicle || 'Not specified'}</p>
              <p><strong>Violation:</strong> ${citation.reason || citation.violationType || 'Parking violation'}</p>
              <p><strong>Amount:</strong> $${parseFloat(citation.amount).toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
              <p><strong>Status:</strong> ${isPaid ? 'Paid' : 'Unpaid'}</p>
              ${isPaid ? `<p><strong>Payment Date:</strong> ${new Date().toLocaleDateString()}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${citationUrl}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                ${isPaid ? 'View Receipt' : 'Pay Citation'}
              </a>
            </div>
            
            ${isPaid
                        ? '<p>Thank you for your payment. This citation has been marked as resolved in our system.</p>'
                        : '<p>Please pay this citation by the due date to avoid additional penalties. If you believe this citation was issued in error, please contact our office.</p>'}
            
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
            <p style="color: #666; text-align: center; font-size: 12px;">
              &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
            </p>
          </div>
        `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log(`Citation ${isPaid ? 'payment' : 'notification'} email sent:`, info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`Failed to send citation ${isPaid ? 'payment' : 'notification'} email:`, error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send a notification about a new contact form submission
     * @param {Object} contactData - Contact form submission data
     * @param {string} adminEmail - Admin email to send notification to
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendContactFormNotification: async (contactData, adminEmail = null) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent contact form notification.');
            console.log('Contact form data:', JSON.stringify(contactData, null, 2));
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Determine recipient - use admin email if provided, otherwise use the configured email
            const recipient = adminEmail || process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com';

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to: recipient,
                subject: `New Contact Form Submission: ${contactData.subject}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">New Contact Form Submission</h2>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Name:</strong> ${contactData.firstName} ${contactData.lastName}</p>
                        <p><strong>Email:</strong> ${contactData.email}</p>
                        ${contactData.phone ? `<p><strong>Phone:</strong> ${contactData.phone}</p>` : ''}
                        <p><strong>Subject:</strong> ${contactData.subject}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background-color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            ${contactData.message.replace(/\n/g, '<br>')}
                        </div>
                        <p><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            // Also send an auto-reply to the user
            const userMailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to: contactData.email,
                subject: 'We received your contact form submission',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">Thank You for Contacting Us</h2>
                    
                    <p>Hello ${contactData.firstName},</p>
                    
                    <p>We have received your message regarding "${contactData.subject}". Our team will review your inquiry and get back to you as soon as possible.</p>
                    
                    <p>For your reference, here's a copy of your message:</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        ${contactData.message.replace(/\n/g, '<br>')}
                    </div>
                    
                    <p>If you have any additional information to add, please feel free to reply to this email.</p>
                    
                    <p>Thank you for using SBU Parking System.</p>
                    
                    <p>Best regards,<br>SBU Parking System Team</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            // Send notification to admin
            const adminInfo = await transporter.sendMail(mailOptions);
            console.log('Contact form notification email sent to admin:', adminInfo.messageId);

            // Send auto-reply to user
            const userInfo = await transporter.sendMail(userMailOptions);
            console.log('Contact form auto-reply sent to user:', userInfo.messageId);

            return {
                success: true,
                adminMessageId: adminInfo.messageId,
                userMessageId: userInfo.messageId
            };
        } catch (error) {
            console.error('Failed to send contact form notification emails:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send a notification when contact form status is updated
     * @param {Object} contactData - Contact form data with status information
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendContactStatusNotification: async (contactData) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent contact status update notification.');
            console.log('Contact status data:', JSON.stringify(contactData, null, 2));
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Format the status for display
            let statusDisplay = contactData.status;
            let statusColor = '#333333';
            let statusMessage = '';

            if (contactData.status === 'in-progress') {
                statusDisplay = 'In Progress';
                statusColor = '#f59e0b'; // Amber
                statusMessage = 'We are currently working on your request.';
            } else if (contactData.status === 'resolved') {
                statusDisplay = 'Resolved';
                statusColor = '#10b981'; // Green
                statusMessage = 'Your request has been resolved.';
            } else if (contactData.status === 'new') {
                statusDisplay = 'New';
                statusColor = '#3b82f6'; // Blue
                statusMessage = 'Your request has been received and is pending review.';
            }

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to: contactData.email,
                subject: `Update on Your Contact Request: ${contactData.subject}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">Contact Request Update</h2>
                    
                    <p>Hello ${contactData.firstName},</p>
                    
                    <p>We're writing to inform you that the status of your contact request regarding "${contactData.subject}" has been updated.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusDisplay}</span></p>
                        <p>${statusMessage}</p>
                        
                        ${contactData.notes ? `
                        <p><strong>Additional Notes:</strong></p>
                        <div style="background-color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            ${contactData.notes.replace(/\n/g, '<br>')}
                        </div>
                        ` : ''}
                    </div>
                    
                    <p>For your reference, your original message was:</p>
                    
                    <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        ${contactData.message.replace(/\n/g, '<br>')}
                    </div>
                    
                    <p>If you have any questions or need further assistance, please feel free to reply to this email.</p>
                    
                    <p>Thank you for using SBU Parking System.</p>
                    
                    <p>Best regards,<br>SBU Parking System Support Team</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            // Send notification to user
            const info = await transporter.sendMail(mailOptions);
            console.log('Contact status update email sent:', info.messageId);

            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Failed to send contact status notification email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send a notification when a follow-up is added to a contact form submission
     * @param {Object} data - Follow-up data including contact information
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendContactFollowupNotification: async (data) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent contact follow-up notification.');
            console.log('Follow-up data:', JSON.stringify(data, null, 2));
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to: data.email,
                subject: `Follow-up on Your Contact Request: ${data.subject}`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">New Follow-up Message</h2>
                    
                    <p>Hello ${data.firstName},</p>
                    
                    <p>We have an update regarding your contact request about "${data.subject}".</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Follow-up from ${data.adminName || 'SBU Parking Support'}:</strong></p>
                        <div style="background-color: white; padding: 10px; border-radius: 5px; margin-top: 10px;">
                            ${data.followupMessage.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                    
                    <p>If you have any questions or would like to respond, please feel free to reply to this email.</p>
                    
                    <p>Thank you for using SBU Parking System.</p>
                    
                    <p>Best regards,<br>SBU Parking System Support Team</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            // Send notification to user
            const info = await transporter.sendMail(mailOptions);
            console.log('Contact follow-up notification email sent:', info.messageId);

            return {
                success: true,
                messageId: info.messageId
            };
        } catch (error) {
            console.error('Failed to send contact follow-up notification email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send account registration confirmation email
     * @param {string} to - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {string} userType - Type of user (student, faculty, visitor, etc.)
     * @param {string} baseUrl - Base URL for the client application
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendAccountRegistrationEmail: async (to, userName, userType, baseUrl) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent account registration confirmation to:', to);
            console.log('User type:', userType);
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Ensure baseUrl is a string
            if (typeof baseUrl !== 'string') {
                baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_BASE_URL || 'http://localhost:5173';
            }

            // Create login URL
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const loginUrl = `${cleanBaseUrl}/login`;

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to,
                subject: 'SBU Parking System - Account Registration Confirmation',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">Account Registration Confirmation</h2>
                    
                    <p>Hello ${userName || ''},</p>
                    
                    <p>Thank you for registering with the SBU Parking System. Your account has been created and is currently awaiting administrative approval.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Account Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                        <p><strong>Status:</strong> <span style="color: #f59e0b; font-weight: bold;">Pending Approval</span></p>
                    </div>
                    
                    <p>You will receive another email once your account has been approved. Once approved, you will be able to access all the features of the SBU Parking System, including:</p>
                    
                    <ul style="margin: 15px 0;">
                        <li>Parking reservations</li>
                        <li>Permit management</li>
                        <li>Citation payments</li>
                        <li>Parking lot availability information</li>
                    </ul>
                    
                    <p>If you have any questions about your account or need assistance, please contact our support team.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${loginUrl}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                    </div>
                    
                    <p>Thank you for choosing the SBU Parking System.</p>
                    
                    <p>Best regards,<br>SBU Parking System Team</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Account registration confirmation email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send account registration confirmation email:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Send account approval notification email
     * @param {string} to - Recipient email address
     * @param {string} userName - User's name for personalization
     * @param {string} userType - Type of user (student, faculty, visitor, etc.)
     * @param {string} baseUrl - Base URL for the client application
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendAccountApprovalEmail: async (to, userName, userType, baseUrl) => {
        // If email is not configured, just log the action and return success
        if (!emailConfigured) {
            console.log('Email service disabled. Would have sent account approval notification to:', to);
            console.log('User type:', userType);
            return { success: true, messageId: 'email-service-disabled' };
        }

        try {
            // Ensure baseUrl is a string
            if (typeof baseUrl !== 'string') {
                baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_BASE_URL || 'http://localhost:5173';
            }

            // Create dashboard URL
            const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            const dashboardUrl = `${cleanBaseUrl}/dashboard`;

            const mailOptions = {
                from: `"SBU Parking System" <${process.env.EMAIL_USER || 'noreply@sbuparkingsystem.com'}>`,
                to,
                subject: 'SBU Parking System - Your Account Has Been Approved',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #cc0000; text-align: center;">Account Approved</h2>
                    
                    <p>Hello ${userName || ''},</p>
                    
                    <p>Great news! Your SBU Parking System account has been approved by our administrators. You now have full access to all the features and services.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Account Type:</strong> ${userType.charAt(0).toUpperCase() + userType.slice(1)}</p>
                        <p><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">Active</span></p>
                    </div>
                    
                    <p>With your approved account, you can now:</p>
                    
                    <ul style="margin: 15px 0;">
                        <li>Make parking reservations</li>
                        <li>Manage your parking permits</li>
                        <li>View parking lot availability</li>
                        <li>Pay citations (if applicable)</li>
                        <li>Access your personalized dashboard</li>
                    </ul>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${dashboardUrl}" style="background-color: #cc0000; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
                    </div>
                    
                    <p>If you have any questions or need assistance using our system, please don't hesitate to contact our support team.</p>
                    
                    <p>Thank you for choosing the SBU Parking System. We look forward to providing you with a convenient parking experience.</p>
                    
                    <p>Best regards,<br>SBU Parking System Team</p>
                    
                    <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                    <p style="color: #666; text-align: center; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} SBU Parking System. All rights reserved.
                    </p>
                </div>
                `
            };

            const info = await transporter.sendMail(mailOptions);
            console.log('Account approval notification email sent:', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Failed to send account approval notification email:', error);
            return { success: false, error: error.message };
        }
    }
};

module.exports = emailService; 