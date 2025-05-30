/**
 * This module defines API routes for parking lot management, including:
 * - Retrieving parking lots with filtering and searching
 * - Creating, updating, and deleting parking lots (admin only)
 * - Managing lot status and capacity
 * 
 * The module handles both public routes for viewing lots and
 * restricted admin-only routes for managing the lots data.
 * Includes robust validation using express-validator.
 */

const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const Lot = require('../models/lot');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * GET /api/lots
 * 
 * Retrieves a paginated and filtered list of parking lots
 * Supports complex filtering by status, permit type, rate type, and user type
 * Includes search functionality for lot name and address
 * 
 * @access Public
 * @query {string} [page=1] - Page number for pagination
 * @query {string} [limit=10] - Number of results per page
 * @query {string} [status] - Filter by lot status (Active, Inactive, Maintenance)
 * @query {string} [permitType] - Filter by permitted parking type
 * @query {string} [rateType] - Filter by rate type (Hourly, Permit-based)
 * @query {string} [userType] - Filter for lots appropriate for specific user types
 * @query {string} [search] - Search term for lot name and address
 * @returns {Object} - Lots array and pagination metadata
 */
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter query
        const filterQuery = {};

        // Filter by status if provided
        if (req.query.status) {
            filterQuery.status = req.query.status;
        }

        // Filter by permit type if provided
        if (req.query.permitType) {
            filterQuery.permitTypes = { $in: [req.query.permitType] };
        }

        // Filter by rate type if provided
        if (req.query.rateType) {
            if (req.query.rateType.toLowerCase() === 'hourly') {
                filterQuery.rateType = 'Hourly';
            } else if (req.query.rateType.toLowerCase() === 'permit') {
                filterQuery.rateType = 'Permit-based';
            }
        }

        // Handle userType filter - but don't filter out metered lots or other general permits
        if (req.query.userType && req.query.userType !== 'admin') {
            const userType = req.query.userType.toLowerCase();

            // For visitors, only show metered lots
            if (userType === 'visitor') {
                filterQuery['features.isMetered'] = true;
            } else {
                filterQuery.$or = [
                    // Always include metered lots
                    { 'features.isMetered': true },

                    // Include lots with appropriate permit types
                    {
                        permitTypes: {
                            $in: userType === 'faculty'
                                ? [/faculty/i, /staff/i, /all/i, /visitor/i, /general/i]
                                : userType === 'student'
                                    ? [/student/i, /commuter/i, /resident/i, /all/i, /visitor/i, /general/i]
                                    : [/.*/] // Include all lots if userType is unknown
                        }
                    }
                ];
            }
        }

        // Search functionality
        if (req.query.search) {
            const searchTerm = req.query.search;
            // If we already have an $or condition from userType, we need to use $and to combine
            if (filterQuery.$or) {
                filterQuery.$and = [
                    { $or: filterQuery.$or },
                    {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { address: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                ];
                // Remove the original $or now that it's in $and
                delete filterQuery.$or;
            } else {
                filterQuery.$or = [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { address: { $regex: searchTerm, $options: 'i' } }
                ];
            }
        }

        // Get total count for pagination
        const total = await Lot.countDocuments(filterQuery);

        // Get the lots with pagination
        const lots = await Lot.find(filterQuery)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit);

        // Return the results
        res.status(200).json({
            lots,
            pagination: {
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching lots:', error);
        res.status(500).json({ message: 'Failed to fetch parking lots' });
    }
});

/**
 * GET /api/lots/:id
 * 
 * Retrieves a single parking lot by its MongoDB ID
 * Includes validation to ensure the ID is in proper format
 * 
 * @access Public
 * @param {string} id - MongoDB ID of the parking lot
 * @returns {Object} - Complete parking lot information
 */
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid lot ID')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const lot = await Lot.findById(req.params.id);

        if (!lot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }

        res.status(200).json({ lot });
    } catch (error) {
        console.error('Error fetching lot:', error);
        res.status(500).json({ message: 'Failed to fetch parking lot' });
    }
});

/**
 * POST /api/lots
 * 
 * Creates a new parking lot with a unique identifier
 * Includes comprehensive validation for all required fields
 * Generates a unique lotId for the new parking lot
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @body {string} name - Name of the parking lot
 * @body {string} address - Physical address of the lot
 * @body {Object} location - Geographic coordinates
 * @body {number} location.latitude - Latitude coordinate
 * @body {number} location.longitude - Longitude coordinate
 * @body {number} totalSpaces - Total parking capacity
 * @body {number} availableSpaces - Currently available spaces
 * @body {Array<string>} permitTypes - Types of permits allowed in this lot
 * @body {string} status - Current lot status (Active, Inactive, Maintenance)
 * @returns {Object} - Success message and created lot data
 */
router.post('/', [
    verifyToken,
    isAdmin,
    body('name').notEmpty().withMessage('Name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('location.latitude').isFloat().withMessage('Valid latitude is required'),
    body('location.longitude').isFloat().withMessage('Valid longitude is required'),
    body('totalSpaces').isInt({ min: 1 }).withMessage('Total spaces must be at least 1'),
    body('availableSpaces').isInt({ min: 0 }).withMessage('Available spaces must be at least 0'),
    body('permitTypes').isArray().withMessage('Permit types must be an array'),
    body('status').isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // Generate a unique lotId
        const lotIdPrefix = "LOT";
        const timestamp = new Date().getTime();
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const uniqueLotId = `${lotIdPrefix}-${timestamp}-${randomSuffix}`;

        // Add the lotId to the request body
        const lotData = {
            ...req.body,
            lotId: uniqueLotId
        };

        const newLot = new Lot(lotData);
        await newLot.save();

        res.status(201).json({
            success: true,
            message: 'Parking lot created successfully',
            lot: newLot
        });
    } catch (error) {
        console.error('Error creating lot:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create parking lot',
            error: error.message
        });
    }
});

/**
 * PUT /api/lots/:id
 * 
 * Updates an existing parking lot's information
 * Supports partial updates with validation for all fields
 * Includes intelligent handling of capacity constraints:
 * - Ensures available spaces don't exceed total spaces
 * - Adjusts available spaces if total capacity is reduced
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the lot to update
 * @body {string} [name] - Name of the parking lot
 * @body {string} [address] - Physical address of the lot
 * @body {Object} [location] - Geographic coordinates
 * @body {number} [totalSpaces] - Total parking capacity
 * @body {number} [availableSpaces] - Currently available spaces
 * @body {Array<string>} [permitTypes] - Types of permits allowed
 * @body {string} [rateType] - Rate type (Hourly, Permit-based)
 * @body {number} [hourlyRate] - Cost per hour for hourly parking
 * @body {number} [semesterRate] - Cost per semester for permit parking
 * @body {string} [status] - Lot status (Active, Inactive, Maintenance)
 * @body {Object} [features] - Additional lot features and amenities
 * @returns {Object} - Success message and updated lot data
 */
router.put('/:id', [
    verifyToken,
    isAdmin,
    param('id').isMongoId().withMessage('Invalid lot ID'),
    // List all validations, but make them optional for partial updates
    body('name').optional().trim().notEmpty().withMessage('Name is required'),
    body('address').optional().trim().notEmpty().withMessage('Address is required'),
    body('location').optional().isObject().withMessage('Location must be an object'),
    body('location.latitude').optional().isNumeric().withMessage('Latitude must be a number'),
    body('location.longitude').optional().isNumeric().withMessage('Longitude must be a number'),
    body('totalSpaces').optional().isInt({ min: 1 }).withMessage('Total spaces must be a positive integer'),
    body('availableSpaces').optional().isInt({ min: 0 }).withMessage('Available spaces must be a non-negative integer'),
    body('permitTypes').optional().isArray().withMessage('Permit types must be an array'),
    body('hourlyRate').optional().isNumeric().withMessage('Hourly rate must be a number'),
    body('semesterRate').optional().isNumeric().withMessage('Semester rate must be a number'),
    body('rateType').optional().isIn(['Hourly', 'Permit-based']).withMessage('Rate type must be either Hourly or Permit-based'),
    body('status').optional().isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Status must be one of: Active, Inactive, Maintenance'),
    body('features').optional().isObject().withMessage('Features must be an object')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        // Get current lot to check validation rules
        const existingLot = await Lot.findById(req.params.id);
        if (!existingLot) {
            return res.status(404).json({
                success: false,
                message: 'Lot not found'
            });
        }

        // Handle availableSpaces validation manually to avoid MongoDB validation errors
        let updateData = { ...req.body };

        // Handle numeric conversions properly for totalSpaces and availableSpaces
        if (updateData.totalSpaces !== undefined) {
            updateData.totalSpaces = Number(updateData.totalSpaces);
            // Ensure it's a valid number and at least 1
            if (isNaN(updateData.totalSpaces) || updateData.totalSpaces < 1) {
                updateData.totalSpaces = 1;
            }
        }

        if (updateData.availableSpaces !== undefined) {
            updateData.availableSpaces = Number(updateData.availableSpaces);
            // Ensure it's a valid number and at least 0
            if (isNaN(updateData.availableSpaces) || updateData.availableSpaces < 0) {
                updateData.availableSpaces = 0;
            }
        }

        // If both are being updated, ensure availableSpaces doesn't exceed totalSpaces
        if (updateData.totalSpaces !== undefined && updateData.availableSpaces !== undefined) {
            if (updateData.availableSpaces > updateData.totalSpaces) {
                updateData.availableSpaces = updateData.totalSpaces;
            }
        }

        // If only totalSpaces is updated and it's less than current availableSpaces, adjust availableSpaces
        if (updateData.totalSpaces !== undefined && updateData.availableSpaces === undefined) {
            const existingAvailableSpaces = Number(existingLot.availableSpaces);
            if (existingAvailableSpaces > updateData.totalSpaces) {
                updateData.availableSpaces = updateData.totalSpaces;
            }
        }

        try {
            const updatedLot = await Lot.findByIdAndUpdate(
                req.params.id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            res.status(200).json({
                success: true,
                message: 'Lot updated successfully',
                lot: updatedLot
            });
        } catch (error) {
            console.error('Error updating lot:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating lot',
                error: error.message
            });
        }
    } catch (error) {
        console.error('Error updating lot:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating lot',
            error: error.message
        });
    }
});

/**
 * PATCH /api/lots/:id/status
 * 
 * Updates only the status of a parking lot
 * Simplified endpoint for quick status changes without modifying other data
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the lot to update
 * @body {string} status - New status ('Active', 'Inactive', or 'Maintenance')
 * @returns {Object} - Updated lot information
 */
router.patch('/:id/status', [
    verifyToken,
    isAdmin,
    param('id').isMongoId().withMessage('Invalid lot ID'),
    body('status').isIn(['Active', 'Inactive', 'Maintenance']).withMessage('Invalid status')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const updatedLot = await Lot.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!updatedLot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }

        res.status(200).json({ lot: updatedLot });
    } catch (error) {
        console.error('Error updating lot status:', error);
        res.status(500).json({ message: 'Failed to update lot status' });
    }
});

/**
 * DELETE /api/lots/:id
 * 
 * Permanently removes a parking lot from the system
 * Requires admin authentication and validates the lot ID
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the lot to delete
 * @returns {Object} - Success message
 */
router.delete('/:id', [
    verifyToken,
    isAdmin,
    param('id').isMongoId().withMessage('Invalid lot ID')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const deletedLot = await Lot.findByIdAndDelete(req.params.id);

        if (!deletedLot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }

        res.status(200).json({ message: 'Parking lot deleted successfully' });
    } catch (error) {
        console.error('Error deleting lot:', error);
        res.status(500).json({ message: 'Failed to delete parking lot' });
    }
});

module.exports = router;