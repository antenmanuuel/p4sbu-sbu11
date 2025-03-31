const express = require('express');
const router = express.Router();
const User = require('../models/users');
const PermitType = require('../models/permit_types');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Get Pending Users
router.get('/pending-users', verifyToken, isAdmin, async (req, res) => {
    try {
        const pendingUsers = await User.find({ isApproved: false })
            .select('-password') // Don't send password
            .sort({ createdAt: -1 });

        res.status(200).json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Approve User
router.put('/approve-user/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { isApproved: true },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User approved successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get All Users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        // Support filtering and pagination
        const { status, userType, search, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query based on filters
        const query = {};

        if (status) {
            if (status === 'active') {
                query.isApproved = true;
            } else if (status === 'inactive' || status === 'pending') {
                query.isApproved = false;
            }
        }

        if (userType) {
            query.userType = userType;
        }

        if (search) {
            // Search in multiple fields
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { sbuId: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);

        // Get users with pagination
        const users = await User.find(query)
            .select('-password') // Don't send password
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Transform user data to include status field
        const transformedUsers = users.map(user => {
            const userData = user.toObject();
            userData.status = userData.isApproved ? 'active' : 'inactive';
            if (!userData.isApproved) {
                // Check if this is a new registration
                const daysSinceCreation = userData.createdAt ?
                    Math.floor((Date.now() - new Date(userData.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                if (daysSinceCreation < 7) {
                    userData.status = 'pending';
                }
            }
            return userData;
        });

        // Calculate total pages
        const totalPages = Math.ceil(total / limit);

        res.status(200).json({
            users: transformedUsers,
            pagination: {
                total,
                currentPage: parseInt(page),
                totalPages
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get User by ID
router.get('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update User
router.put('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const updates = req.body;

        // Don't allow updating password through this route for security
        if (updates.password) {
            delete updates.password;
        }

        const user = await User.findByIdAndUpdate(
            userId,
            updates,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Toggle User Status (active/inactive)
router.put('/users/:userId/toggle-status', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        const { status } = req.body;

        if (!status || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status provided' });
        }

        const isApproved = status === 'active';

        const user = await User.findByIdAndUpdate(
            userId,
            { isApproved },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: `User ${isApproved ? 'activated' : 'deactivated'} successfully`,
            user
        });
    } catch (error) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete User
router.delete('/users/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;

        // Don't allow deleting the default admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.email === 'admin@stonybrook.edu') {
            return res.status(403).json({ message: 'Default admin account cannot be deleted' });
        }

        await User.findByIdAndDelete(userId);

        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PERMIT TYPE ROUTES
// Get All Permit Types with pagination
router.get('/permit-types', verifyToken, isAdmin, async (req, res) => {
    try {
        const { category, duration, search, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build query based on filters
        const query = {};

        if (category) {
            query.category = category;
        }

        if (duration) {
            query.duration = duration;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { 'lots.lotName': { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await PermitType.countDocuments(query);

        // Get permit types with pagination
        const permitTypes = await PermitType.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Calculate total pages
        const totalPages = Math.ceil(total / parseInt(limit));

        res.status(200).json({
            permitTypes,
            pagination: {
                total,
                totalPages,
                currentPage: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching permit types:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single permit type by ID
router.get('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findById(req.params.permitTypeId);

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json(permitType);
    } catch (error) {
        console.error('Error fetching permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new permit type
router.post('/permit-types', verifyToken, isAdmin, async (req, res) => {
    try {
        const newPermitType = new PermitType(req.body);
        await newPermitType.save();

        res.status(201).json({
            message: 'Permit type created successfully',
            permitType: newPermitType
        });
    } catch (error) {
        console.error('Error creating permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a permit type
router.put('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findByIdAndUpdate(
            req.params.permitTypeId,
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json({
            message: 'Permit type updated successfully',
            permitType
        });
    } catch (error) {
        console.error('Error updating permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a permit type
router.delete('/permit-types/:permitTypeId', verifyToken, isAdmin, async (req, res) => {
    try {
        const permitType = await PermitType.findByIdAndDelete(req.params.permitTypeId);

        if (!permitType) {
            return res.status(404).json({ message: 'Permit type not found' });
        }

        res.status(200).json({
            message: 'Permit type deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting permit type:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 