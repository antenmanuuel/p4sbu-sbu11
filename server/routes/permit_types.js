/**
 * This module defines API routes for managing parking permit types, including:
 * - Public access to valid, non-expired permit options
 * - Admin management of permit types (CRUD operations)
 * - Handling of both MongoDB ObjectID and custom ID lookups
 * 
 * Permit types represent the different parking permits that can be purchased
 * by users, with various durations, prices, and applicable parking locations.
 */

const express = require('express');
const router = express.Router();
const PermitType = require('../models/permit_types');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * GET /api/permit-types/public
 * 
 * Retrieves a list of valid, non-expired permit types for public display
 * Filters out expired permits and removes sensitive fields
 * Used by the client application to show purchase options to users
 * 
 * @access Public
 * @returns {Object} - List of available permit types with core details only
 */
router.get('/public', async (req, res) => {
  try {
    // Get all permit types
    const allPermitTypes = await PermitType.find({})
      .select('id name category duration price endDate')
      .sort({ name: 1 });

    // Filter out expired permit types using our static method
    const validPermitTypes = allPermitTypes.filter(permitType =>
      PermitType.isValidPermitType(permitType)
    );

    // Filter out endDate from the final response
    const finalPermitTypes = validPermitTypes.map(({ id, name, category, duration, price }) => ({
      id, name, category, duration, price
    }));

    res.status(200).json({
      permitTypes: finalPermitTypes
    });
  } catch (error) {
    console.error("Error fetching public permit types:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/permit-types
 * 
 * Retrieves a paginated and searchable list of all permit types
 * Used in the admin dashboard for managing permit types
 * Includes expired permits and full permit details
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} [search] - Optional search term for permit type names
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of results per page
 * @returns {Object} - Permit types array and pagination metadata
 */
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    const total = await PermitType.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    const permitTypes = await PermitType.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
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
    console.error("Error fetching permit types:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * GET /api/permit-types/:id
 * 
 * Retrieves a single permit type by ID
 * Supports lookup by both MongoDB _id and custom ID format (PT001)
 * Includes all permit type details
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - Either MongoDB ObjectID or custom permit type ID
 * @returns {Object} - Complete permit type information
 */
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const permitTypeId = req.params.id;

    // Try to find the permit type by MongoDB _id first, then by custom id if not found
    let permitType;

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = permitTypeId.match(/^[0-9a-fA-F]{24}$/);

    if (isValidObjectId) {
      // First try to find by MongoDB _id
      permitType = await PermitType.findById(permitTypeId);
    }

    // If not found by _id or not a valid ObjectId, try to find by custom id
    if (!permitType) {
      permitType = await PermitType.findOne({ id: permitTypeId });
    }

    if (!permitType) {
      console.log(`Permit type not found with ID: ${permitTypeId}`);
      return res.status(404).json({ message: 'Permit type not found' });
    }

    res.status(200).json(permitType);
  } catch (error) {
    console.error("Error fetching permit type:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/permit-types
 * 
 * Creates a new permit type with auto-generated ID
 * Automatically generates sequential custom IDs in format PT001, PT002, etc.
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @body {string} name - Name of the permit type (e.g., "Student Semester Pass")
 * @body {string} category - Category of the permit (e.g., "Student", "Faculty")
 * @body {number} quantity - Available quantity of this permit type
 * @body {string} startDate - Date when the permit becomes valid
 * @body {string} endDate - Expiration date of the permit
 * @body {number} price - Cost of the permit
 * @body {Array} lots - Array of parking lots where this permit is valid
 * @body {string} duration - Duration of the permit (e.g., "Semester", "Annual")
 * @returns {Object} - Success message and created permit type data
 */
router.post('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, category, quantity, startDate, endDate, price, lots, duration } = req.body;

    // Generate a new custom id based on the most recent permit type
    const lastPermitType = await PermitType.findOne({}).sort({ createdAt: -1 }).exec();
    let nextNumber = 1;
    if (lastPermitType && lastPermitType.id) {
      const lastNumber = parseInt(lastPermitType.id.replace(/^PT/, ''), 10);
      nextNumber = lastNumber + 1;
    }
    const newId = 'PT' + nextNumber.toString().padStart(3, '0');

    // Create new PermitType document with the generated id
    const newPermitType = new PermitType({
      id: newId,
      name,
      category,
      quantity,
      startDate,
      endDate,
      price,
      lots,
      duration
    });

    const savedPermitType = await newPermitType.save();
    res.status(201).json({ message: 'Permit type created successfully', permitType: savedPermitType });
  } catch (error) {
    console.error("Error creating permit type:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * PUT /api/permit-types/:id
 * 
 * Updates an existing permit type
 * Supports updates by both MongoDB _id and custom ID format
 * All fields are optional for partial updates
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - Either MongoDB ObjectID or custom permit type ID
 * @body {Object} - Object containing fields to update
 * @returns {Object} - Success message and updated permit type data
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const permitTypeId = req.params.id;
    const updateData = req.body;

    // Try to find the permit type by MongoDB _id first, then by custom id if not found
    let updatedPermitType;

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = permitTypeId.match(/^[0-9a-fA-F]{24}$/);

    if (isValidObjectId) {
      // First try to find by MongoDB _id
      updatedPermitType = await PermitType.findByIdAndUpdate(
        permitTypeId,
        updateData,
        { new: true }
      );
    }

    // If not found by _id or not a valid ObjectId, try to find by custom id
    if (!updatedPermitType) {
      updatedPermitType = await PermitType.findOneAndUpdate(
        { id: permitTypeId },
        updateData,
        { new: true }
      );
    }

    if (!updatedPermitType) {
      console.log(`Permit type not found with ID: ${permitTypeId}`);
      return res.status(404).json({ message: 'Permit type not found' });
    }

    res.status(200).json({ message: 'Permit type updated successfully', permitType: updatedPermitType });
  } catch (error) {
    console.error("Error updating permit type:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/permit-types/:id
 * 
 * Removes a permit type from the system
 * Supports deletion by both MongoDB _id and custom ID format
 * This does not affect existing permits of this type already purchased
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - Either MongoDB ObjectID or custom permit type ID
 * @returns {Object} - Success message
 */
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const permitTypeId = req.params.id;

    // Try to delete by MongoDB _id first, then by custom id if not found
    let deletedPermitType;

    // Check if the ID is a valid MongoDB ObjectId
    const isValidObjectId = permitTypeId.match(/^[0-9a-fA-F]{24}$/);

    if (isValidObjectId) {
      // First try to find by MongoDB _id
      deletedPermitType = await PermitType.findByIdAndDelete(permitTypeId);
    }

    // If not found by _id or not a valid ObjectId, try to find by custom id
    if (!deletedPermitType) {
      deletedPermitType = await PermitType.findOneAndDelete({ id: permitTypeId });
    }

    if (!deletedPermitType) {
      console.log(`Permit type not found with ID: ${permitTypeId}`);
      return res.status(404).json({ message: 'Permit type not found' });
    }

    res.status(200).json({ message: 'Permit type deleted successfully' });
  } catch (error) {
    console.error("Error deleting permit type:", error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;