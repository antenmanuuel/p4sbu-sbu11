const express = require('express');
const router = express.Router();
const Permit = require('../models/permits');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/permits - Retrieve permits with optional filtering & pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    // Accept query parameters for filtering: status, permitType, search, page, limit
    const { status, permitType, search, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (permitType) {
      query.permitType = permitType;
    }
    if (search) {
      // Allow searching by permit number, name, or user information
      query.$or = [
        { permitNumber: { $regex: search, $options: 'i' } },
        { permitName: { $regex: search, $options: 'i' } },
        { userFullName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Permit.countDocuments(query);
    const permits = await Permit.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      permits,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/permits/active-count - Get count of active permits
router.get('/active-count', verifyToken, async (req, res) => {
  try {
    const count = await Permit.countDocuments({ status: 'active' });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching active permits count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/permits/:id - Retrieve a single permit by its ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    res.status(200).json(permit);
  } catch (error) {
    console.error('Error fetching permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/permits - Create a new permit
router.post('/', verifyToken, async (req, res) => {
  try {
    // Expected body: permitNumber, permitName, permitType, userId, userFullName, userEmail, lots,
    // startDate, endDate, status, price, paymentStatus, paymentId, permitTypeId
    const newPermit = new Permit(req.body);
    const savedPermit = await newPermit.save();
    res.status(201).json({ message: 'Permit created successfully', permit: savedPermit });
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permits/:id - Update an existing permit
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updatedPermit = await Permit.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedPermit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    res.status(200).json({ message: 'Permit updated successfully', permit: updatedPermit });
  } catch (error) {
    console.error('Error updating permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/permits/:id - Delete a permit (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedPermit = await Permit.findByIdAndDelete(req.params.id);
    if (!deletedPermit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    res.status(200).json({ message: 'Permit deleted successfully' });
  } catch (error) {
    console.error('Error deleting permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permits/:id/toggle-status - Toggle permit status (active/inactive)
router.put('/:id/toggle-status', verifyToken, isAdmin, async (req, res) => {
  try {
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    // For simplicity, toggling between active and inactive (pending remains unchanged)
    let newStatus;
    if (permit.status === 'active') {
      newStatus = 'inactive';
    } else if (permit.status === 'inactive') {
      newStatus = 'active';
    } else {
      newStatus = 'active';
    }
    permit.status = newStatus;
    const updatedPermit = await permit.save();
    res.status(200).json({ message: `Permit status updated to ${newStatus}`, permit: updatedPermit });
  } catch (error) {
    console.error('Error toggling permit status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permits/:id/payment-status - Update the payment status of a permit
router.put('/:id/payment-status', verifyToken, async (req, res) => {
  try {
    // Expected body: { paymentStatus: 'paid' | 'unpaid' | 'refunded' }
    const { paymentStatus } = req.body;
    if (!paymentStatus || !['paid', 'unpaid', 'refunded'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }
    permit.paymentStatus = paymentStatus;
    const updatedPermit = await permit.save();
    res.status(200).json({ message: 'Payment status updated successfully', permit: updatedPermit });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;