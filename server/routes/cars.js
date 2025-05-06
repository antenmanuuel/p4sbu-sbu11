/**
 * This module defines API routes for user vehicle management, including:
 * - Retrieving user vehicles (all and primary)
 * - Creating new vehicle records
 * - Updating existing vehicle information
 * - Deleting vehicles from user profile
 * 
 * All routes in this module are protected with authentication middleware
 * and enforce ownership verification to ensure users can only access
 * their own vehicle data.
 */

const express = require('express');
const router = express.Router();
const Car = require('../models/car');
const { verifyToken } = require('../middleware/auth');

/**
 * GET /api/cars
 * 
 * Retrieves all vehicles registered for the current authenticated user
 * Results are sorted by creation date (newest first)
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} - Success status and array of user's vehicles
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        // Get all cars for the user, sorted by creation date instead of isPrimary
        const cars = await Car.find({ userId: req.user.userId })
            .sort({ createdAt: -1 }); // Sort by creation date

        res.status(200).json({
            success: true,
            message: 'Cars retrieved successfully',
            cars: cars
        });
    } catch (error) {
        console.error('Error retrieving cars:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cars',
            error: error.message
        });
    }
});

/**
 * GET /api/cars/primary
 * 
 * Retrieves the user's primary vehicle
 * If no vehicle is marked as primary, returns the most recently added vehicle
 * Used for pre-filling reservation forms and user preferences
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @returns {Object} - Success status, vehicle data, and primary status
 */
router.get('/primary', verifyToken, async (req, res) => {
    try {
        const primaryCar = await Car.findOne({
            userId: req.user.userId,
            isPrimary: true
        });

        if (!primaryCar) {
            // If no primary car is set, get the most recently created car
            const mostRecentCar = await Car.findOne({ userId: req.user.userId })
                .sort({ createdAt: -1 });

            if (!mostRecentCar) {
                return res.status(404).json({
                    success: false,
                    message: 'No cars found for this user'
                });
            }

            return res.status(200).json({
                success: true,
                data: { car: mostRecentCar, isPrimary: false }
            });
        }

        res.status(200).json({
            success: true,
            data: { car: primaryCar, isPrimary: true }
        });
    } catch (error) {
        console.error('Error fetching primary car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch primary car',
            error: error.message
        });
    }
});

/**
 * POST /api/cars
 * 
 * Creates a new vehicle record for the current user
 * All vehicle identification details are captured including plate, make, model
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {string} plateNumber - Vehicle license plate number
 * @body {string} stateProv - State/province where vehicle is registered
 * @body {string} make - Vehicle manufacturer
 * @body {string} model - Vehicle model
 * @body {string} color - Vehicle color
 * @body {string} bodyType - Vehicle body type (sedan, SUV, etc.)
 * @body {number} year - Vehicle manufacturing year
 * @returns {Object} - Success status and newly created vehicle data
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { plateNumber, stateProv, make, model, color, bodyType, year } = req.body;

        // Create the new car with user ID, no primary designation
        const newCar = new Car({
            plateNumber,
            stateProv,
            make,
            model,
            color,
            bodyType,
            year,
            userId: req.user.userId
            // No isPrimary field
        });

        // No need to update other cars as isPrimary concept is removed

        await newCar.save();

        res.status(201).json({
            success: true,
            message: 'Car saved successfully',
            data: { car: newCar }
        });
    } catch (error) {
        console.error('Error saving car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save car',
            error: error.message
        });
    }
});

/**
 * PUT /api/cars/:id
 * 
 * Updates an existing vehicle's information
 * Verifies ownership before allowing updates to prevent unauthorized access
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} id - ID of the vehicle to update
 * @body {string} plateNumber - Vehicle license plate number
 * @body {string} stateProv - State/province where vehicle is registered
 * @body {string} make - Vehicle manufacturer
 * @body {string} model - Vehicle model
 * @body {string} color - Vehicle color
 * @body {string} bodyType - Vehicle body type (sedan, SUV, etc.)
 * @body {number} year - Vehicle manufacturing year
 * @returns {Object} - Success status and updated vehicle data
 */
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const carId = req.params.id;
        const { plateNumber, stateProv, make, model, color, bodyType, year } = req.body;

        // Find the car and verify ownership
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // Check if the car belongs to the user
        if (car.userId && car.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this car'
            });
        }

        // No need to check or update isPrimary

        // Update the car
        const updatedCar = await Car.findByIdAndUpdate(
            carId,
            {
                plateNumber: plateNumber || car.plateNumber,
                stateProv: stateProv || car.stateProv,
                make: make || car.make,
                model: model || car.model,
                color: color || car.color,
                bodyType: bodyType || car.bodyType,
                year: year || car.year,
                userId: req.user.userId // Ensure the user ID is set
                // No isPrimary field
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Car updated successfully',
            data: { car: updatedCar }
        });
    } catch (error) {
        console.error('Error updating car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update car',
            error: error.message
        });
    }
});

/**
 * DELETE /api/cars/:id
 * 
 * Removes a vehicle from the user's profile
 * Verifies ownership before allowing deletion to prevent unauthorized access
 * 
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} id - ID of the vehicle to delete
 * @returns {Object} - Success status and confirmation message
 */
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const carId = req.params.id;

        // Find the car and verify ownership
        const car = await Car.findById(carId);
        if (!car) {
            return res.status(404).json({
                success: false,
                message: 'Car not found'
            });
        }

        // Check if the car belongs to the user
        if (car.userId && car.userId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this car'
            });
        }

        await Car.findByIdAndDelete(carId);

        res.status(200).json({
            success: true,
            message: 'Car deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting car:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete car',
            error: error.message
        });
    }
});

module.exports = router;