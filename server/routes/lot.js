const express = require('express');
const router = express.Router();
const Lot = require('../models/lot');
const { verifyToken } = require('../middleware/auth');

// GET /api/lots - Retrieve all parking lots
router.get('/', verifyToken, async (req, res) => {
  try {
    const lots = await Lot.find({});
    // Transform each lot to include an "id" property for front-end compatibility
    const transformedLots = lots.map(lot => ({
      id: lot.lotId, // map lotId to id so front-end code works as expected
      name: lot.name,
      latitude: lot.latitude,
      longitude: lot.longitude,
      availableSpaces: lot.availableSpaces,
      totalSpaces: lot.totalSpaces,
      createdAt: lot.createdAt,
    }));
    res.status(200).json(transformedLots);
  } catch (err) {
    console.error('Error retrieving lots:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;