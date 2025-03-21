const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/users');
const UserActivity = require('../models/user_activity');

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

        res.status(201).json({
            message: 'Registration successful! Your account is pending approval.',
            userId: newUser._id
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

        res.status(200).json({
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                userType: user.userType
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router; 