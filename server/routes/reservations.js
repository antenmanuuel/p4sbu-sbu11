const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservation');
const { verifyToken, isAdmin } = require('../middleware/auth');

// GET /api/reservations/active-count - Get count of active reservations
router.get('/active-count', verifyToken, async (req, res) => {
  try {
    const count = await Reservation.countDocuments({ status: 'active' });
    res.status(200).json({ count });
  } catch (error) {
    console.error('Error fetching active reservations count:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reservations - Get all reservations with filtering and pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, userId, lotId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }
    if (userId) {
      query.user = userId;
    }
    if (lotId) {
      query.lotId = lotId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Reservation.countDocuments(query);
    const reservations = await Reservation.find(query)
      .populate('user', 'firstName lastName email')
      .populate('lotId', 'name')
      // Temporarily comment out the vehicleInfo populate to get the page working
      // .populate('vehicleInfo', 'make model year plateNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      reservations,
      pagination: {
        total,
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/reservations/:id - Get a single reservation by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'firstName lastName email')
      .populate('lotId', 'name')
      // temporarily comment out the vehicleInfo populate to get the page working
      // .populate('vehicleInfo', 'make model year plateNumber');

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json(reservation);
  } catch (error) {
    console.error('Error fetching reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/reservations - Create a new reservation
router.post('/', verifyToken, async (req, res) => {
  try {
    const newReservation = new Reservation(req.body);
    const savedReservation = await newReservation.save();
    res.status(201).json(savedReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/reservations/:id - Update a reservation
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedReservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json(updatedReservation);
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/reservations/:id - Delete a reservation (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const deletedReservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!deletedReservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 