const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// User Registration
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, sbuId, userType } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Check if SBU ID is already registered
        const existingSbuId = await User.findOne({ sbuId });
        if (existingSbuId) {
            return res.status(400).json({ message: 'User already exists with this SBU ID' });
        }

        // Create new user - will be pending approval
        const newUser = new User({
            firstName,
            lastName,
            email,
            password, // Will be hashed by the pre-save hook in the User model
            sbuId,
            userType,
            isApproved: false // Default is false, needs admin approval
        });

        await newUser.save();

        // Log account creation activity
        await UserActivity.logActivity({
            user: newUser._id,
            activity_type: 'account_created',
            description: 'Account created',
            details: 'Welcome to P4SBU',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

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

// User Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

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

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                userType: user.userType
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Log successful login
        await UserActivity.logActivity({
            user: user._id,
            activity_type: 'login',
            description: 'Logged in from new device',
            details: req.headers['user-agent'] || 'Unknown device',
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

// Forgot Password Route
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
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
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

// Reset Password Route
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

module.exports = router; 