/**
 * Reservation Routes - Handles all reservation-related API endpoints
 * 
 * This file contains all API endpoints for managing parking reservations, including:
 * - Creating new reservations
 * - Retrieving user reservations
 * - Canceling reservations
 * - Extending reservations
 * - Processing payments and refunds
 * - Managing permit-related functionality for reservations
 */

const express = require('express');
const router = express.Router();
const Reservation = require('../models/reservation');
const Lot = require('../models/lot');
const Car = require('../models/car');
const Permit = require('../models/permits');
const PermitType = require('../models/permit_types');
const User = require('../models/users');
const { verifyToken } = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const RevenueStatistics = require('../models/revenue_statistics');
const { updateExpiredReservations } = require('../utils/reservationUtils');
const NotificationHelper = require('../utils/notificationHelper');
const emailService = require('../services/emailService');

/**
 * Helper function to generate a unique reservation ID
 * 
 * Format: RES-YYYYMMDD-XXXX where:
 * - YYYYMMDD is the current date
 * - XXXX is a random 4-digit number
 * 
 * @returns {string} A unique reservation ID
 */
const generateReservationId = () => {
    // Generate a reservation ID in format: RES-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.getFullYear().toString() +
        (date.getMonth() + 1).toString().padStart(2, '0') +
        date.getDate().toString().padStart(2, '0');

    // Generate a random 4-digit suffix
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);

    // Combine to form the reservation ID
    return `RES-${dateStr}-${randomSuffix}`;
};

/**
 * @route GET /api/reservations
 * @desc Get all reservations for the current user
 * @access Private - Requires authentication
 * 
 * Query parameters:
 * - status: Filter by reservation status
 * - startDate: Filter by reservations after this date
 * - endDate: Filter by reservations before this date
 * - showPastOnly: If true, show only completed or cancelled reservations
 * - search: Search by lot name, address, permit type, or vehicle info
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        // First update any expired reservations in the database
        await updateExpiredReservations();

        const { status, startDate, endDate, showPastOnly, search } = req.query;

        // Build query
        const query = { user: req.user.userId }; // Only show user's own reservations

        // Filter past reservations (completed or cancelled) if showPastOnly is true
        if (showPastOnly === 'true') {
            // Use explicit array of values instead of regex
            query.status = { $in: ['completed', 'cancelled'] };
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999); // Set to end of day
                query.startTime.$lte = endDateObj;
            }
        }

        // Search filter
        if (search && search.trim()) {
            const searchQuery = search.trim();
            // We'll manually filter after getting results since we need to search in populated fields
        }

        // Get reservations with lot and vehicle details
        let reservations = await Reservation.find(query)
            .populate('lotId', 'name address location permitTypes')
            .populate('vehicleInfo', 'plateNumber stateProv make model color bodyType')
            .sort({ startTime: -1 });

        // Apply search filter if provided
        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            reservations = reservations.filter(reservation => {
                // Search in reservation ID
                if (reservation.reservationId && searchRegex.test(reservation.reservationId)) {
                    return true;
                }
                // Search in lot name and address
                if (reservation.lotId &&
                    ((reservation.lotId.name && searchRegex.test(reservation.lotId.name)) ||
                        (reservation.lotId.address && searchRegex.test(reservation.lotId.address)))) {
                    return true;
                }
                // Search in permit type/spot number
                if (reservation.permitType && searchRegex.test(reservation.permitType)) {
                    return true;
                }
                // Search in vehicle info
                if (reservation.vehicleInfo &&
                    ((reservation.vehicleInfo.plateNumber && searchRegex.test(reservation.vehicleInfo.plateNumber)) ||
                        (reservation.vehicleInfo.make && searchRegex.test(reservation.vehicleInfo.make)) ||
                        (reservation.vehicleInfo.model && searchRegex.test(reservation.vehicleInfo.model)))) {
                    return true;
                }
                return false;
            });
        }

        res.status(200).json({
            success: true,
            data: { reservations }
        });
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reservations',
            error: error.message
        });
    }
});

/**
 * @route GET /api/reservations/:id
 * @desc Get a specific reservation by ID
 * @access Private - Requires authentication
 * 
 * Path parameters:
 * - id: The reservation ID to retrieve
 */
router.get('/:id', verifyToken, async (req, res) => {
    try {
        // First update any expired reservations in the database
        await updateExpiredReservations();

        const reservation = await Reservation.findOne({
            reservationId: req.params.id,
            user: req.user.userId
        })
            .populate('lotId', 'name address location permitTypes hourlyRate semesterRate rateType')
            .populate('vehicleInfo', 'plateNumber stateProv make model color bodyType');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { reservation }
        });
    } catch (error) {
        console.error('Error fetching reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reservation',
            error: error.message
        });
    }
});

/**
 * @route POST /api/reservations/:id/cancel
 * @desc Cancel a reservation and process refund if applicable
 * @access Private - Requires authentication
 * 
 * Path parameters:
 * - id: The reservation ID to cancel
 * 
 * Request body:
 * - reason: Optional reason for cancellation
 */
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const reservationId = req.params.id;

        // Find the reservation
        const reservation = await Reservation.findOne({
            reservationId: reservationId,
            user: req.user.userId
        }).populate('lotId');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check if reservation is already cancelled or completed
        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Reservation is already cancelled'
            });
        }

        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed reservation'
            });
        }

        // Process refund if applicable
        let refundResult = null;
        if (reservation.stripePaymentIntentId && reservation.totalPrice > 0) {
            // First check: is this a permit-based lot (meaning the payment was for a permit, not just a reservation)
            const lot = await Lot.findById(reservation.lotId);
            const isPermitBasedLot = lot && lot.rateType === 'Permit-based';

            // Second check: is there a permit linked to this payment
            const permitLinkedToPayment = await Permit.findOne({
                userId: req.user.userId,
                paymentId: reservation.stripePaymentIntentId
            });

            // Do not refund if this was a permit purchase (either permit-based lot or explicit permit link)
            if (!isPermitBasedLot && !permitLinkedToPayment) {
                try {
                    const refund = await stripe.refunds.create({
                        payment_intent: reservation.stripePaymentIntentId,
                        amount: Math.round(reservation.totalPrice * 100)
                    });

                    refundResult = {
                        refundId: refund.id,
                        amount: refund.amount / 100,
                        status: refund.status
                    };

                    reservation.paymentStatus = 'refunded';
                } catch (error) {
                    console.error('Refund processing error:', error);
                }
            } else {
                console.log('Skipping refund because payment was for a permit purchase');
            }
        }

        // Update reservation status
        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelReason = req.body.reason || 'User cancelled';
        await reservation.save();

        // Free up the parking space
        if (reservation.lotId) {
            await Lot.findByIdAndUpdate(
                reservation.lotId._id,
                { $inc: { availableSpaces: 1 } }
            );
        }

        // Notify user
        try {
            // Create an appropriate message
            const hasPermit = reservation.usedExistingPermit || reservation.compatiblePermitId;
            const message = hasPermit
                ? `Your reservation at ${reservation.lotId.name} has been cancelled. Your permit remains active for other compatible lots.`
                : `Your reservation at ${reservation.lotId.name} has been cancelled.`;

            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'Reservation Cancelled',
                message,
                '/dashboard'
            );
        } catch (error) {
            console.error('Notification error:', error);
        }

        // Return success response with info about permit retention
        const responseMessage = reservation.usedExistingPermit || reservation.compatiblePermitId
            ? 'Reservation cancelled successfully. Your permit remains active for other compatible lots.'
            : (refundResult ? 'Reservation cancelled successfully with refund processed.' : 'Reservation cancelled successfully without refund since payment was for a permit.');

        res.status(200).json({
            success: true,
            message: responseMessage,
            data: {
                reservation,
                refund: refundResult,
                permitRetained: true, // Always true - permits are never deactivated
                reservationRefunded: refundResult ? true : false
            }
        });
    } catch (error) {
        console.error('Error cancelling reservation:', error);
        res.status(500).json({
            success: false,
            message: 'An error occurred while cancelling the reservation',
            error: error.message
        });
    }
});

/**
 * @route POST /api/reservations/:id/extend
 * @desc Extend a reservation's end time
 * @access Private - Requires authentication
 * 
 * Path parameters:
 * - id: The reservation ID to extend
 * 
 * Request body:
 * - additionalHours: Number of hours to extend the reservation
 * - isMetered: Whether this is a metered parking spot (optional)
 * - paymentMethodId: Stripe payment method ID for additional charges (optional)
 */
router.post('/:id/extend', verifyToken, async (req, res) => {
    try {
        const { additionalHours, isMetered } = req.body;

        if (!additionalHours || isNaN(additionalHours) || additionalHours <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid additional hours are required'
            });
        }

        // Find reservation
        const reservation = await Reservation.findOne({
            reservationId: req.params.id,
            user: req.user.userId
        }).populate('lotId');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check if reservation can be extended
        if (reservation.status !== 'active' && reservation.status !== 'upcoming' && reservation.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot extend a ${reservation.status} reservation`
            });
        }

        // Calculate new end time
        const currentEndTime = new Date(reservation.endTime);
        const newEndTime = new Date(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000));

        // Calculate additional price
        let additionalPrice = 0;
        if (reservation.lotId && reservation.lotId.rateType === 'Hourly') {
            additionalPrice = additionalHours * reservation.lotId.hourlyRate;
        }

        // Process additional payment if needed
        let paymentResult = null;
        if (additionalPrice > 0 && req.body.paymentMethodId) {
            try {
                // Get user to check for customer ID
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                // Create payment intent with Stripe
                const paymentOptions = {
                    amount: Math.round(additionalPrice * 100), // Stripe uses cents
                    currency: 'usd',
                    customer: user.stripeCustomerId,
                    payment_method: req.body.paymentMethodId,
                    confirm: true,
                    description: `Extending reservation at ${reservation.lotId.name}`,
                    metadata: {
                        reservationId: reservation.reservationId,
                        additionalHours: additionalHours.toString()
                    },
                    // Fix for redirect-based payment methods error
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                };

                const paymentIntent = await stripe.paymentIntents.create(paymentOptions);

                paymentResult = {
                    success: true,
                    paymentIntentId: paymentIntent.id,
                    amount: additionalPrice
                };
            } catch (stripeError) {
                console.error('Stripe payment failed for extension:', stripeError);
                return res.status(400).json({
                    success: false,
                    message: 'Payment processing failed',
                    error: stripeError.message
                });
            }
        }

        // Update reservation
        reservation.endTime = newEndTime;
        if (additionalPrice > 0) {
            reservation.totalPrice += additionalPrice;
        }

        // Save extension history
        reservation.extensionHistory = reservation.extensionHistory || [];
        reservation.extensionHistory.push({
            extendedAt: new Date(),
            additionalHours,
            additionalPrice,
            paymentIntentId: paymentResult?.paymentIntentId || null
        });

        await reservation.save();

        // Notify user of extension
        try {
            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'Reservation Extended',
                `Your reservation at ${reservation.lotId.name} has been extended for ${additionalHours} hours.`,
                '/dashboard'
            );
        } catch (error) {
            console.error('Error creating notification:', error);
        }

        res.status(200).json({
            success: true,
            message: 'Reservation extended successfully',
            data: {
                reservation,
                extension: {
                    previousEndTime: currentEndTime,
                    newEndTime,
                    additionalHours,
                    additionalPrice,
                    paymentResult
                }
            }
        });
    } catch (error) {
        console.error('Error extending reservation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to extend reservation',
            error: error.message
        });
    }
});

/**
 * @route PUT /api/reservations/check-expired
 * @desc Manual endpoint to check and update expired reservations
 * @access Private - Requires authentication
 * 
 * This endpoint is typically called by an admin or scheduled job
 * to ensure reservation statuses are updated appropriately
 */
router.put('/check-expired', verifyToken, async (req, res) => {
    try {
        const updatedCount = await updateExpiredReservations();
        res.status(200).json({
            success: true,
            message: `Checked for expired reservations. Updated ${updatedCount} reservations to completed.`
        });
    } catch (error) {
        console.error('Error checking expired reservations:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

/**
 * @route POST /api/reservations
 * @desc Create a new parking reservation
 * @access Private - Requires authentication
 * 
 * Request body:
 * - lotId: ID of the parking lot
 * - startTime: Start time of the reservation
 * - endTime: End time of the reservation
 * - permitType: Type of permit (e.g., 'student', 'faculty')
 * - vehicleInfo: Either a vehicle ID or complete vehicle information
 * - paymentInfo: Payment method details
 * - isSwitchingPermitType: Boolean indicating if user is switching permit types
 * - permitToReplaceId: ID of permit to replace (if switching)
 */
router.post('/', verifyToken, async (req, res) => {
    try {
        const { lotId, startTime, endTime, permitType, vehicleInfo, paymentInfo, isSwitchingPermitType, permitToReplaceId } = req.body;

        // Get user information
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Validate lot exists
        const lot = await Lot.findById(lotId);
        if (!lot) {
            return res.status(404).json({ message: 'Parking lot not found' });
        }

        // Check if lot has available spaces
        if (lot.availableSpaces <= 0) {
            return res.status(400).json({ message: 'No available spaces in this lot' });
        }

        // Check if user already has an active reservation
        const existingActiveReservations = await Reservation.find({
            user: req.user.userId,
            status: { $in: ['active', 'pending'] },
            endTime: { $gt: new Date() }
        });

        if (existingActiveReservations && existingActiveReservations.length > 0) {
            return res.status(400).json({
                message: 'You already have an active reservation. Please complete or cancel your existing reservation before creating a new one.'
            });
        }

        // Calculate initial price based on lot type
        let totalPrice = 0;
        if (lot.rateType === 'Hourly') {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const hours = (end - start) / (1000 * 60 * 60);
            totalPrice = hours * lot.hourlyRate;
        } else if (lot.rateType === 'Permit-based') {
            totalPrice = lot.semesterRate || 0;
        }

        // Handle permit switching if requested
        let permitSwitchResult = null;
        if (isSwitchingPermitType && permitToReplaceId) {
            console.log(`Handling permit switch request: replacing permit ${permitToReplaceId} with new ${permitType} permit`);

            // Find the permit to replace
            const oldPermit = await Permit.findById(permitToReplaceId);
            if (!oldPermit) {
                return res.status(404).json({ message: 'Permit to replace not found' });
            }

            // Verify the permit belongs to this user
            if (oldPermit.userId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: 'Not authorized to replace this permit' });
            }

            // Process refund for the old permit if it was paid
            let refundResult = null;
            if (oldPermit.paymentId && oldPermit.price > 0 && oldPermit.paymentStatus === 'paid') {
                try {
                    // Issue refund via Stripe
                    const refund = await stripe.refunds.create({
                        payment_intent: oldPermit.paymentId,
                    });

                    // Update permit status
                    oldPermit.paymentStatus = 'refunded';
                    oldPermit.status = 'inactive';
                    oldPermit.refundId = refund.id;
                    oldPermit.refundedAt = new Date();
                    await oldPermit.save();

                    refundResult = {
                        success: true,
                        refundId: refund.id,
                        amount: refund.amount / 100,
                        status: refund.status
                    };

                    console.log(`Successfully refunded permit ${oldPermit.permitNumber} (${oldPermit.permitType})`);

                    // Notify user of refund
                    try {
                        await NotificationHelper.createSystemNotification(
                            user._id,
                            'Permit Refunded',
                            `Your ${oldPermit.permitType} permit has been refunded as part of switching to a new permit type.`,
                            '/dashboard'
                        );
                    } catch (notificationError) {
                        console.error('Error creating refund notification:', notificationError);
                    }
                } catch (refundError) {
                    console.error('Refund processing error:', refundError);
                    return res.status(400).json({
                        message: 'Failed to process refund for existing permit',
                        error: refundError.message
                    });
                }
            }

            permitSwitchResult = {
                oldPermitId: oldPermit._id,
                oldPermitType: oldPermit.permitType,
                refundResult
            };
        }

        // Retrieve all active user permits
        const userPermits = await Permit.find({
            userId: user._id,
            status: 'active',
            paymentStatus: { $in: ['paid', 'completed'] }
        });

        // Filter to only valid permits
        const validUserPermits = userPermits.filter(permit => Permit.isValidPermit(permit));
        console.log(`User has ${validUserPermits.length} valid permits. Checking compatibility...`);

        // Check if any permit is compatible with the lot's required types
        let permitCompatible = false;
        let compatiblePermitId = null;

        if (validUserPermits.length > 0 && lot.permitTypes && lot.permitTypes.length > 0) {
            for (const permit of validUserPermits) {
                // Use exact permit type matching - the permit type must exactly match one of the lot's required types
                if (lot.permitTypes.includes(permit.permitType)) {
                    permitCompatible = true;
                    compatiblePermitId = permit._id;
                    console.log(`Permit type "${permit.permitType}" is compatible with lot requirements: ${lot.permitTypes.join(', ')}`);
                    break;
                }
            }
        }

        // If permit is compatible, make reservation free
        if (permitCompatible) {
            totalPrice = 0;
            console.log('Compatible permit found - reservation will be free');
        }

        // Process payment if needed
        let paymentStatus = permitCompatible ? 'completed' : 'pending';
        let stripePaymentIntentId = null;
        let stripePaymentMethodId = null;
        let stripeReceiptUrl = null;

        if (paymentInfo && paymentInfo.paymentMethodId && totalPrice > 0) {
            try {
                // Get user to check for customer ID
                const currentUser = await User.findById(req.user.userId);

                // Create payment intent with Stripe
                const paymentOptions = {
                    amount: Math.round(totalPrice * 100), // Stripe uses cents
                    currency: 'usd',
                    customer: currentUser.stripeCustomerId,
                    payment_method: paymentInfo.paymentMethodId,
                    confirm: true,
                    description: `Parking reservation at ${lot.name}`,
                    // Fix for redirect-based payment methods error
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                };

                const paymentIntent = await stripe.paymentIntents.create(paymentOptions);
                paymentStatus = paymentIntent.status === 'succeeded' ? 'completed' : 'pending';
                stripePaymentIntentId = paymentIntent.id;
                stripePaymentMethodId = paymentInfo.paymentMethodId;
                stripeReceiptUrl = paymentIntent.charges?.data[0]?.receipt_url || null;
            } catch (stripeError) {
                console.error('Stripe payment failed:', stripeError);
                return res.status(400).json({
                    message: 'Payment processing failed',
                    error: stripeError.message
                });
            }
        }

        // Process vehicle information
        let car;
        if (typeof vehicleInfo === 'string' || (vehicleInfo.carId && typeof vehicleInfo.carId === 'string')) {
            const carId = typeof vehicleInfo === 'string' ? vehicleInfo : vehicleInfo.carId;
            car = await Car.findById(carId);
            if (!car) {
                return res.status(400).json({ message: 'Invalid vehicle information' });
            }
        } else {
            // Check if car already exists
            let existingCar = null;
            if (vehicleInfo.plateNumber) {
                existingCar = await Car.findOne({
                    userId: req.user.userId,
                    plateNumber: vehicleInfo.plateNumber.toUpperCase(),
                    stateProv: vehicleInfo.state || vehicleInfo.stateProv
                });
            }

            if (existingCar) {
                car = existingCar;
            } else {
                // Create a new car
                car = new Car({
                    plateNumber: vehicleInfo.plateNumber,
                    stateProv: vehicleInfo.state || vehicleInfo.stateProv,
                    make: vehicleInfo.make,
                    model: vehicleInfo.model,
                    color: vehicleInfo.color,
                    bodyType: vehicleInfo.bodyType,
                    year: vehicleInfo.year,
                    userId: req.user.userId,
                    isPrimary: vehicleInfo.saveAsPrimary || false
                });
                await car.save();
            }
        }

        // Create a permit if needed and none exists yet
        let newPermit = null;
        if (lot.rateType === 'Permit-based' && !permitCompatible && totalPrice > 0) {
            try {
                console.log('Creating new permit for permit-based reservation');

                // Generate a unique permit number
                const permitNumber = `P-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

                // Trim permitType to remove any trailing/leading spaces
                const cleanPermitType = permitType ? permitType.trim() : permitType;

                // Create a new permit with end date 4 months from now
                const fourMonthsFromNow = new Date();
                fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4);
                fourMonthsFromNow.setHours(23, 59, 59, 999); // Set to end of day

                const permitStatus = paymentStatus === 'completed' ? 'active' : 'pending';

                newPermit = new Permit({
                    permitNumber,
                    permitName: `${cleanPermitType} Permit`,
                    permitType: cleanPermitType,
                    userId: req.user.userId,
                    userFullName: `${user.firstName} ${user.lastName}`,
                    userEmail: user.email,
                    lots: [{
                        lotId: lot._id.toString(),
                        lotName: lot.name
                    }],
                    startDate: new Date(),
                    endDate: fourMonthsFromNow,
                    status: permitStatus,
                    price: totalPrice,
                    paymentStatus: paymentStatus === 'completed' ? 'paid' : 'pending',
                    paymentId: stripePaymentIntentId,
                    // If this permit is replacing another, store the reference
                    replacedPermitId: permitSwitchResult ? permitSwitchResult.oldPermitId : null,
                    notes: permitSwitchResult ? `Replaced previous ${permitSwitchResult.oldPermitType} permit` : ''
                });

                await newPermit.save();
                console.log('New permit created:', newPermit._id);

                // Create notification for permit
                try {
                    await NotificationHelper.createSystemNotification(
                        req.user.userId,
                        'New Permit Created',
                        `Your ${cleanPermitType} permit has been created and is now active until ${fourMonthsFromNow.toLocaleDateString()}.`,
                        '/dashboard'
                    );
                } catch (notificationError) {
                    console.error('Error creating permit notification:', notificationError);
                }
            } catch (permitError) {
                console.error('Error creating permit:', permitError);
                // Don't fail the entire request if permit creation fails
            }
        }

        // Generate a unique reservation ID
        const reservationId = generateReservationId();

        // Determine the reservation status
        const reservationStatus = permitCompatible ? 'active' : (paymentStatus === 'completed' ? 'active' : 'pending');

        // Create the reservation
        const reservation = new Reservation({
            reservationId,
            user: req.user.userId,
            lotId,
            startTime,
            endTime,
            permitType,
            vehicleInfo: car._id,
            paymentStatus,
            stripePaymentIntentId,
            stripePaymentMethodId,
            stripeReceiptUrl,
            totalPrice,
            status: reservationStatus,
            usedExistingPermit: permitCompatible,
            compatiblePermitId: compatiblePermitId
        });

        // Save the reservation
        const savedReservation = await reservation.save();

        // Update the lot's available spaces
        lot.availableSpaces -= 1;
        await lot.save();

        // Create notification
        try {
            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'New Reservation Confirmed',
                `Your reservation at ${lot.name} has been confirmed.`,
                '/dashboard'
            );
        } catch (notificationError) {
            console.error('Error creating notification:', notificationError);
        }

        // Return success response with reservation and permit details
        return res.status(201).json({
            success: true,
            message: 'Reservation created successfully!',
            data: {
                reservation: {
                    id: savedReservation._id,
                    reservationId: savedReservation.reservationId,
                    status: savedReservation.status,
                    startTime: savedReservation.startTime,
                    endTime: savedReservation.endTime,
                    totalPrice: savedReservation.totalPrice
                },
                permit: newPermit ? {
                    id: newPermit._id,
                    permitNumber: newPermit.permitNumber,
                    permitType: newPermit.permitType,
                    status: newPermit.status,
                    validFrom: newPermit.startDate,
                    validUntil: newPermit.endDate
                } : null,
                lotName: lot.name,
                // Include permit switching info if applicable
                permitSwitched: isSwitchingPermitType && permitSwitchResult ? {
                    oldPermitType: permitSwitchResult.oldPermitType,
                    newPermitType: newPermit ? newPermit.permitType : permitType,
                    refundProcessed: permitSwitchResult.refundResult ? true : false,
                    refundAmount: permitSwitchResult.refundResult ? permitSwitchResult.refundResult.amount : 0
                } : null
            }
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ message: 'An error occurred while creating the reservation', error: error.message });
    }
});

module.exports = router; 