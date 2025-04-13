const express = require('express');
const router = express.Router();
const PermitType = require('../models/permit_types');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/permit-types/public - Retrieve permit types for public consumption
// This endpoint doesn't require admin permissions
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

// GET /api/permit-types - Retrieve permit types with optional search and pagination
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

// GET /api/permit-types/:id - Get a single permit type by ID
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

// POST /api/permit-types - Create a new permit type
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


// PUT /api/permit-types/:id - Update an existing permit type
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

// DELETE /api/permit-types/:id - Delete a permit type
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