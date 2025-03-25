const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');
require('dotenv').config();

// Configure Mailgun transport
const auth = {
    auth: {
        api_key: process.env.MAILGUN_API_KEY,
        domain: process.env.MAILGUN_DOMAIN
    }
};

// Create transport
const transporter = nodemailer.createTransport(mailgunTransport(auth));

// Verify transport configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('Email service setup error:', error);
    } else {
        console.log('Email service is ready to send messages');
    }
});

const emailService = {
    /**
     * Send password reset email
     * @param {string} to - Recipient email address
     * @param {string} token - Password reset token
     * @param {string} baseUrl - Base URL for the client application
     * @returns {Promise} - Promise resolving to the result of the email sending
     */
    sendPasswordResetEmail: async (to, token, baseUrl) => {
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
                from: `"SBU Parking System" <${process.env.EMAIL_FROM || 'noreply@sbuparkingsystem.com'}>`,
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
    }
};

module.exports = emailService; 