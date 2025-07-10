/**
 * This module defines API routes for user authentication, including:
 * - User registration and account creation
 * - Login and session management
 * - Password reset functionality (forgot/reset password)
 * - Session management and timeout logging
 * 
 * The module enforces security by:
 * - Password hashing with bcrypt
 * - JWT token generation for stateless authentication
 * - Secure password reset flows
 * - Activity logging
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const { verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * 
 * Registers a new user in the system with pending approval status
 * Handles different registration flows based on user type:
 * - Students/Faculty: Requires valid SBU ID
 * - Visitors: Generates a unique visitor ID automatically
 * 
 * Creates user record, logs the activity, sends confirmation email,
 * and generates an initial authentication token.
 * 
 * @body {string} firstName - User's first name
 * @body {string} lastName - User's last name
 * @body {string} email - User's email address (used for login)
 * @body {string} password - User's password (will be hashed)
 * @body {string} sbuId - SBU ID number (required for students/faculty, ignored for visitors)
 * @body {string} userType - Type of user (student, faculty, visitor, admin)
 * @returns {Object} - Registration status, user data, and authentication token
 */
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, sbuId, userType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        let finalSbuId = sbuId;

        // Always generate a unique ID for visitors
        if (userType === 'visitor') {
            // Generate a unique visitor ID with prefix 'V' followed by timestamp and random digits
            const timestamp = new Date().getTime().toString().slice(-6);
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            finalSbuId = `V${timestamp}${randomDigits}`;

            // Ensure it's unique by checking against existing IDs
            const existingId = await User.findOne({ sbuId: finalSbuId });
            if (existingId) {
                // Try again with a different random number if collision occurs
                const newRandomDigits = Math.floor(1000 + Math.random() * 9000);
                finalSbuId = `V${timestamp}${newRandomDigits}`;
            }
        } else if (sbuId) {
            // For non-visitors, check if SBU ID is already registered
            const existingSbuId = await User.findOne({ sbuId });
            if (existingSbuId) {
                return res.status(400).json({ message: 'User already exists with this SBU ID' });
            }
        } else {
            return res.status(400).json({ message: 'SBU ID is required for non-visitor users' });
        }

        // Create new user - will be pending approval
        const newUser = new User({
            firstName,
            lastName,
            email,
            password, // Will be hashed by the pre-save hook in the User model
            sbuId: finalSbuId,
            userType,
            isApproved: false // Default is false, needs admin approval
        });

        await newUser.save();

        // Log account creation activity
        await UserActivity.logActivity({
            user: newUser._id,
            activity_type: 'account_created',
            description: 'Account created',
            details: userType === 'visitor' ? `Welcome to P4SBU (Visitor) - Assigned ID: ${finalSbuId}` : 'Welcome to P4SBU',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Send registration confirmation email
        try {
            const baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173';
            const userName = `${firstName} ${lastName}`;
            await emailService.sendAccountRegistrationEmail(
                email,
                userName,
                userType,
                baseUrl
            );
            console.log('Registration confirmation email sent to:', email);
        } catch (emailError) {
            console.error('Error sending registration confirmation email:', emailError);
            // Continue even if email sending fails
        }

        // Create JWT token
        const token = jwt.sign(
            {
                userId: newUser._id,
                email: newUser.email,
                userType: newUser.userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Return success with token and user info (excluding password)
        const userWithoutPassword = { ...newUser.toObject() };
        delete userWithoutPassword.password;

        res.status(201).json({
            message: 'Registration successful! Your account is pending approval.',
            userId: newUser._id,
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

/**
 * POST /api/auth/login
 * 
 * Authenticates a user and generates an access token
 * Verifies credentials, checks approval status, and logs login activity
 * Supports extended sessions with "remember me" functionality
 * 
 * @body {string} email - User's email address
 * @body {string} password - User's password
 * @body {boolean} rememberMe - Whether to create a long-lived token (30 days vs 24 hours)
 * @returns {Object} - Authentication token and user data on success
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, rememberMe } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if user is approved - critical check!
        if (!user.isApproved) {
            return res.status(403).json({ message: 'Your account is pending approval from an administrator' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Log failed login attempt
            await UserActivity.logActivity({
                user: user._id,
                activity_type: 'login_failed',
                description: 'Failed login attempt',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Set token expiration based on rememberMe flag
        const expiresIn = rememberMe ? '30d' : '24h';

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType
            },
            process.env.JWT_SECRET,
            { expiresIn }
        );

        // Log successful login
        await UserActivity.logActivity({
            user: user._id,
            activity_type: 'login',
            description: 'Logged in from new device',
            details: `${req.headers['user-agent'] || 'Unknown device'} - ${rememberMe ? 'Extended session (30 days)' : 'Standard session (24 hours)'}`,
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        // Return success with token and user info (excluding password)
        const userWithoutPassword = { ...user.toObject() };
        delete userWithoutPassword.password;

        res.status(200).json({
            token,
            user: userWithoutPassword
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

/**
 * POST /api/auth/forgot-password
 * 
 * Initiates the password reset process for a user
 * Generates a secure token, stores it with expiration, and sends reset email
 * Implements security best practices:
 * - Same response message whether account exists or not (prevent user enumeration)
 * - Limited token validity (1 hour)
 * - Server-side logging of reset requests
 * 
 * @body {string} email - Email address of the account to reset
 * @returns {Object} - Generic success message (intentionally vague for security)
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        console.log('Received password reset request for email:', email);

        // Generate a random token
        const buffer = crypto.randomBytes(32);
        const token = buffer.toString('hex');

        // Find the user by email
        const user = await User.findOne({ email });

        // Always return a success message even if user not found (security best practice)
        if (!user) {
            console.log('User not found with email:', email);
            return res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }

        console.log('User found, setting reset token for user ID:', user._id);

        // Set the reset token and expiration (1 hour)
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        await user.save();
        console.log('User saved with reset token');

        // Send the reset email
        const baseUrl = process.env.PROD_CLIENT_URL || process.env.CLIENT_URL || 'http://localhost:5173';
        console.log('Using client base URL from env:', baseUrl);

        const emailResult = await emailService.sendPasswordResetEmail(email, token, baseUrl);

        if (emailResult.success) {
            console.log('Password reset email sent successfully');
            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        } else {
            console.error('Email sending failed:', emailResult.error);
            res.json({
                message: 'If an account with that email exists, a password reset link has been sent.'
            });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request' });
    }
});

/**
 * POST /api/auth/reset-password
 * 
 * Completes the password reset process by setting a new password
 * Verifies the reset token validity and expiration
 * 
 * @body {string} token - Password reset token from the reset email
 * @body {string} password - New password to set (will be hashed)
 * @returns {Object} - Success or error message
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        // Validate inputs
        if (!token || !password) {
            return res.status(400).json({ message: 'Token and password are required' });
        }

        // Find user with the given token that hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                message: 'Password reset token is invalid or has expired. Please request a new one.'
            });
        }

        // Update the user's password and clear the reset token fields
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset' });
    }
});

/**
 * POST /api/auth/session-timeout
 * 
 * Logs user session timeouts for security monitoring
 * Called by the client when a session expires due to inactivity
 * 
 * @middleware verifyToken - Ensures the request has valid authentication
 * @returns {Object} - Confirmation message
 */
router.post('/session-timeout', verifyToken, async (req, res) => {
    try {
        // Log session timeout
        await UserActivity.logActivity({
            user: req.user.userId,
            activity_type: 'session_timeout',
            description: 'User session timed out due to inactivity',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Session timeout logged successfully' });
    } catch (error) {
        console.error('Error logging session timeout:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 