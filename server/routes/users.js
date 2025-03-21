const express = require('express');
const router = express.Router();
const User = require('../models/users');
const UserActivity = require('../models/user_activity');
const { verifyToken } = require('../middleware/auth');
const bcrypt = require('bcrypt');

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;

        // Find user but don't return password
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Create the response with all necessary user fields
        const userProfile = {
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            userType: user.userType,
            sbuId: user.sbuId,
            phone: user.phone || '', // Include phone if it exists
            isApproved: user.isApproved,
            car: user.car,
            createdAt: user.createdAt
        };

        // Get user permits (this would link to your permits collection in a real app)
        // For now we'll just return mock data
        const userPermits = [
            {
                id: 'P-2024-001',
                type: 'Commuter Core',
                validFrom: '2024-01-01',
                validUntil: '2024-12-31',
                status: 'Active',
                vehicle: {
                    make: 'Toyota',
                    model: 'Camry',
                    year: '2020',
                    color: 'Blue',
                    licensePlate: 'NY-ABC-123'
                }
            }
        ];

        // Additional admin statistics (only for admin users)
        let adminStats = null;
        if (user.userType === 'admin') {
            adminStats = {
                totalUsersManaged: await User.countDocuments(),
                totalPermitsManaged: 1879, // Mock data
                actionsThisMonth: 138, // Mock data
                lastLogin: 'Today, 8:45 AM',
                role: 'System Administrator'
            };
        }

        res.status(200).json({
            user: userProfile,
            permits: userPermits,
            adminStats
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone, address, emergencyContact } = req.body;

        // Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Track previous data for activity logging
        const previousPhone = user.phone;
        const previousAddress = user.address;
        const previousEmergencyContact = user.emergencyContact;

        // Update fields if provided
        if (phone !== undefined) {
            user.phone = phone;
        }
        if (address !== undefined) {
            user.address = address;
        }
        if (emergencyContact !== undefined) {
            user.emergencyContact = emergencyContact;
        }

        // Save the updated user
        await user.save();

        // Log profile update activity if any field changed
        const fieldsChanged = [];
        if (previousPhone !== phone) fieldsChanged.push('phone');
        if (previousAddress !== address) fieldsChanged.push('address');
        if (previousEmergencyContact !== emergencyContact) fieldsChanged.push('emergencyContact');

        if (fieldsChanged.length > 0) {
            await UserActivity.logActivity({
                user: userId,
                activity_type: 'profile_update',
                description: 'Profile information updated',
                details: `Updated: ${fieldsChanged.join(', ')}`,
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });
        }

        // Return updated user without password
        const updatedUser = await User.findById(userId).select('-password');

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                _id: updatedUser._id,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                email: updatedUser.email,
                userType: updatedUser.userType,
                sbuId: updatedUser.sbuId,
                phone: updatedUser.phone || '',
                address: updatedUser.address || '',
                emergencyContact: updatedUser.emergencyContact || '',
                isApproved: updatedUser.isApproved,
                car: updatedUser.car,
                createdAt: updatedUser.createdAt
            }
        });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Change password
router.put('/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        // Find user with password
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            // Log failed password change attempt
            await UserActivity.logActivity({
                user: user._id,
                activity_type: 'password_change_failed',
                description: 'Failed password change attempt',
                details: 'Current password verification failed',
                ip_address: req.ip,
                user_agent: req.headers['user-agent']
            });

            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Update password
        user.password = newPassword; // Will be hashed by the pre-save hook
        await user.save();

        // Log successful password change
        await UserActivity.logActivity({
            user: user._id,
            activity_type: 'password_change',
            description: 'Password changed successfully',
            ip_address: req.ip,
            user_agent: req.headers['user-agent']
        });

        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ message: 'Server error during password change' });
    }
});

// Get user's activity history
router.get('/activity', verifyToken, async (req, res) => {
    try {
        // Get the most recent activities for the user, limited to 10
        const activities = await UserActivity.find({ user: req.user.userId })
            .sort({ created_at: -1 })
            .limit(10);

        res.status(200).json(activities);
    } catch (error) {
        console.error('Error fetching user activity:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

