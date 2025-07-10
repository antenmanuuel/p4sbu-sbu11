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
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const Reservation = require('../models/reservation');
const Lot = require('../models/lot');
const User = require('../models/users');
const Permit = require('../models/permits');
const NotificationHelper = require('../utils/notificationHelper');
const emailService = require('../services/emailService');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Car = require('../models/car');
const { updateExpiredReservations } = require('../utils/reservationUtils');
const RevenueStatistics = require('../models/revenue_statistics');

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

        const { startDate, endDate, showPastOnly, search } = req.query;

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

        // Get lot information for determining if it's metered/permit-based
        const lot = reservation.lotId ? await Lot.findById(reservation.lotId) : null;
        const isPermitBasedLot = lot && lot.rateType === 'Permit-based';
        const isMeteredLot = lot && lot.features && lot.features.isMetered;

        // For metered lots, calculate the actual billable amount based on time constraints
        let adjustedPrice = reservation.totalPrice;

        if (isMeteredLot && lot) {
            // Check if it's a weekend (0 = Sunday, 6 = Saturday)
            const dayOfWeek = new Date(reservation.startTime).getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            if (isWeekend) {
                // Free on weekends
                console.log("Weekend reservation - no charge for metered lot");
                adjustedPrice = 0;
            } else {
                // Calculate billable hours (only between 7am and 7pm)
                const startHour = new Date(reservation.startTime).getHours();
                const startMinute = new Date(reservation.startTime).getMinutes();
                const endHour = new Date(reservation.endTime).getHours();
                const endMinute = new Date(reservation.endTime).getMinutes();

                // Convert to decimal hours for more accurate calculation
                const startTimeDecimal = startHour + (startMinute / 60);
                const endTimeDecimal = endHour + (endMinute / 60);

                // Define billable window (7AM to 7PM = 7.0 to 19.0)
                const billableStartHour = 7.0;
                const billableEndHour = 19.0;

                // Calculate overlap with billable hours
                const overlapStart = Math.max(startTimeDecimal, billableStartHour);
                const overlapEnd = Math.min(endTimeDecimal, billableEndHour);
                const billableHours = Math.max(0, overlapEnd - overlapStart);

                // Use hourlyRate with a default of $2.50 if not defined
                const hourlyRate = lot.hourlyRate || 2.50;
                adjustedPrice = billableHours * hourlyRate;

                // Ensure the price is a valid number
                if (isNaN(adjustedPrice) || adjustedPrice < 0) {
                    console.log("Warning: Invalid price calculation result. Using default pricing.");
                    adjustedPrice = 0;
                }

                console.log(`Metered lot reservation: ${billableHours.toFixed(1)} billable hours (7am-7pm only) at $${hourlyRate}/hour = $${adjustedPrice.toFixed(2)}`);
            }
        }

        // Log reservation details to help with debugging
        console.log('Cancelling reservation:', {
            id: reservation.reservationId,
            originalPrice: reservation.totalPrice,
            adjustedPrice: adjustedPrice,
            status: reservation.status,
            isFreeReservation: reservation.isFreeReservation,
            freeReason: reservation.freeReason,
            lotType: lot?.rateType,
            isMeteredLot,
            isPermitBasedLot,
            hasPaymentId: !!reservation.stripePaymentIntentId
        });

        // Process refund if applicable
        let refundResult = null;
        if (reservation.stripePaymentIntentId && reservation.totalPrice > 0) {
            // First check: is this a permit-based lot (meaning the payment was for a permit, not just a reservation)

            // Second check: is there a permit linked to this payment
            const permitLinkedToPayment = await Permit.findOne({
                userId: req.user.userId,
                paymentId: reservation.stripePaymentIntentId
            });

            // Do not refund if this was a permit purchase (either permit-based lot or explicit permit link)
            if (!isPermitBasedLot && !permitLinkedToPayment) {
                try {
                    // Use the adjusted price based on billable hours for metered lots
                    const refundAmount = isMeteredLot ? adjustedPrice : reservation.totalPrice;

                    // Skip refund if the amount is zero
                    if (refundAmount <= 0) {
                        console.log("Skipping refund because adjusted amount is $0");
                        refundResult = {
                            refundId: null,
                            amount: 0,
                            status: 'skipped',
                            reason: 'No billable hours based on time constraints'
                        };
                    } else {
                        const refund = await stripe.refunds.create({
                            payment_intent: reservation.stripePaymentIntentId,
                            amount: Math.round(refundAmount * 100)
                        });

                        refundResult = {
                            refundId: refund.id,
                            amount: refund.amount / 100,
                            status: refund.status,
                            originalAmount: reservation.totalPrice,
                            adjustedAmount: adjustedPrice
                        };

                        reservation.paymentStatus = 'refunded';
                        // Update the refundInfo field for proper billing history tracking
                        reservation.refundInfo = {
                            refundId: refund.id,
                            amount: refund.amount / 100,
                            status: refund.status,
                            refundedAt: new Date(),
                            originalAmount: reservation.totalPrice,
                            adjustedAmount: adjustedPrice
                        };

                        // Record refund in revenue statistics
                        try {
                            // Use the appropriate refund type based on the lot type
                            if (isMeteredLot || (lot.rateType === 'Hourly')) {
                                await RevenueStatistics.recordMeteredRefund(refund.amount / 100);
                                console.log(`Recorded metered parking refund: $${refund.amount / 100} for reservation at ${lot.name}`);
                            } else {
                                await RevenueStatistics.recordRefund(refund.amount / 100);
                                console.log(`Recorded refund: $${refund.amount / 100} for reservation at ${lot.name}`);
                            }
                        } catch (revenueError) {
                            console.error('Failed to record refund in revenue statistics:', revenueError);
                            // Continue processing even if revenue recording fails
                        }
                    }

                    // Add specific notification for metered lot refunds
                    if (isMeteredLot) {
                        try {
                            // Only send notification if there was an actual refund
                            if (refundResult.status !== 'skipped' && refundResult.amount > 0) {
                                await NotificationHelper.createSystemNotification(
                                    req.user.userId,
                                    'Refund Processed',
                                    `A refund of $${refundResult.amount.toFixed(2)} has been processed for your cancelled reservation at ${lot.name}.`,
                                    '/billing'
                                );
                            } else {
                                await NotificationHelper.createSystemNotification(
                                    req.user.userId,
                                    'Reservation Cancelled',
                                    `Your reservation at ${lot.name} has been cancelled. No refund was processed as there were no billable hours based on time-based pricing rules.`,
                                    '/billing'
                                );
                            }
                        } catch (error) {
                            console.error('Error sending refund notification:', error);
                        }
                    }
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

            // Send email notification about the cancellation
            try {
                // Get user details for email
                const user = await User.findById(req.user.userId);

                if (user && user.email) {
                    // Send email notification about the cancellation
                    const emailResult = await emailService.sendReservationConfirmation(
                        user.email,
                        `${user.firstName} ${user.lastName}`,
                        {
                            _id: reservation._id,
                            id: reservation.reservationId,
                            lotId: reservation.lotId,
                            startTime: reservation.startTime,
                            endTime: reservation.endTime,
                            status: 'cancelled',
                            totalPrice: reservation.totalPrice,
                            refundInfo: reservation.refundInfo || null
                        },
                        process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
                    );

                    console.log(`Reservation cancellation email sent to ${user.email}: ${emailResult.success ? emailResult.messageId || 'success' : 'failed'}`);
                }
            } catch (emailError) {
                console.error('Failed to send reservation cancellation email:', emailError);
                // Continue even if email sending fails
            }
        } catch (error) {
            console.error('Notification error:', error);
        }

        // Return success response with info about permit retention
        let responseMessage;
        if (reservation.usedExistingPermit || reservation.compatiblePermitId) {
            responseMessage = 'Reservation cancelled successfully. Your permit remains active for other compatible lots.';
        } else if (refundResult) {
            responseMessage = 'Reservation cancelled successfully with refund processed.';
        } else if (reservation.totalPrice === 0 || reservation.isFreeReservation) {
            responseMessage = 'Free reservation cancelled successfully.';
        } else if (isMeteredLot) {
            responseMessage = 'Metered parking reservation cancelled successfully.';
        } else {
            responseMessage = 'Reservation cancelled successfully.';
        }

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
        const { additionalHours } = req.body;

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

                // If customer has a Stripe customer ID, include it in the payment options
                // This is required when using a saved payment method
                if (user.stripeCustomerId) {
                    paymentOptions.customer = user.stripeCustomerId;
                    console.log(`Using customer ID from user: ${user.stripeCustomerId} for payment method: ${req.body.paymentMethodId}`);
                } else if (req.body.customerId) {
                    // If customerId is sent with the payment info, use that instead
                    paymentOptions.customer = req.body.customerId;
                    console.log(`Using customer ID from payment info: ${req.body.customerId} for payment method: ${req.body.paymentMethodId}`);
                }

                const paymentIntent = await stripe.paymentIntents.create(paymentOptions);

                paymentResult = {
                    success: true,
                    paymentIntentId: paymentIntent.id,
                    amount: additionalPrice
                };

                // Record revenue statistics for the extension payment
                try {
                    if (reservation.lotId.rateType === 'Hourly' || (reservation.lotId.features && reservation.lotId.features.isMetered)) {
                        await RevenueStatistics.recordMeteredPurchase(additionalPrice);
                        console.log(`Recorded metered parking extension revenue: $${additionalPrice} for reservation at ${reservation.lotId.name}`);
                    } else {
                        // For other types of reservations, record as permit revenue
                        await RevenueStatistics.recordPermitPurchase(additionalPrice);
                        console.log(`Recorded extension revenue: $${additionalPrice} for reservation at ${reservation.lotId.name}`);
                    }
                } catch (revenueError) {
                    console.error('Failed to record extension revenue statistics:', revenueError);
                    // Continue processing even if revenue recording fails
                }
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

            // Send email notification about the reservation extension
            try {
                // Get user details for email
                const user = await User.findById(req.user.userId);

                if (user && user.email) {
                    // Send email notification about the extension
                    const emailResult = await emailService.sendReservationConfirmation(
                        user.email,
                        `${user.firstName} ${user.lastName}`,
                        {
                            _id: reservation._id,
                            id: reservation.reservationId,
                            lotId: reservation.lotId,
                            startTime: reservation.startTime,
                            endTime: newEndTime, // Updated end time
                            status: reservation.status,
                            totalPrice: reservation.totalPrice,
                            additionalInfo: {
                                isExtension: true,
                                additionalHours: additionalHours,
                                additionalPrice: additionalPrice,
                                extensionMessage: `Your reservation has been extended for ${additionalHours} additional hours.`
                            }
                        },
                        process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
                    );

                    console.log(`Reservation extension email sent to ${user.email}: ${emailResult.success ? emailResult.messageId || 'success' : 'failed'}`);
                }
            } catch (emailError) {
                console.error('Failed to send reservation extension email:', emailError);
                // Continue even if email sending fails
            }
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

            // Check if the reservation starts on a weekend (0 = Sunday, 6 = Saturday)
            const isWeekend = start.getDay() === 0 || start.getDay() === 6;

            // Free parking on weekends
            if (isWeekend) {
                console.log(`Reservation starts on weekend (day ${start.getDay()}) - parking is free`);
                totalPrice = 0;
            } else {
                // For metered lots, charges are only imposed from 7am to 7pm on weekdays
                const isMeteredLot = lot.features && lot.features.isMetered;

                if (isMeteredLot) {
                    // Check if it's a weekend (0 = Sunday, 6 = Saturday)
                    const dayOfWeek = start.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

                    if (isWeekend) {
                        // Free on weekends
                        console.log("Weekend reservation - no charge for metered lot");
                        totalPrice = 0;
                    } else {
                        // Calculate billable hours (only between 7am and 7pm)
                        const startHour = start.getHours();
                        const startMinute = start.getMinutes();
                        const endHour = end.getHours();
                        const endMinute = end.getMinutes();

                        // Convert to decimal hours for more accurate calculation
                        const startTimeDecimal = startHour + (startMinute / 60);
                        const endTimeDecimal = endHour + (endMinute / 60);

                        // Define billable window (7AM to 7PM = 7.0 to 19.0)
                        const billableStartHour = 7.0;
                        const billableEndHour = 19.0;

                        // Calculate overlap with billable hours
                        const overlapStart = Math.max(startTimeDecimal, billableStartHour);
                        const overlapEnd = Math.min(endTimeDecimal, billableEndHour);
                        const billableHours = Math.max(0, overlapEnd - overlapStart);

                        // Use hourlyRate with a default of $2.50 if not defined
                        const hourlyRate = lot.hourlyRate || 2.50;
                        totalPrice = billableHours * hourlyRate;

                        // Ensure the price is a valid number
                        if (isNaN(totalPrice) || totalPrice < 0) {
                            console.log("Warning: Invalid price calculation result. Using default pricing.");
                            totalPrice = 0;
                        }

                        console.log(`Metered lot reservation: ${billableHours.toFixed(1)} billable hours (7am-7pm only) at $${hourlyRate}/hour = $${totalPrice.toFixed(2)}`);
                    }
                } else {
                    // For non-metered hourly lots, charge for all hours
                    const hours = (end - start) / (1000 * 60 * 60);
                    totalPrice = hours * lot.hourlyRate;
                }
            }
        } else if (lot.rateType === 'Permit-based') {
            // Check if the reservation starts on a weekend (0 = Sunday, 6 = Saturday)
            const start = new Date(startTime);
            const isWeekend = start.getDay() === 0 || start.getDay() === 6;

            // Free parking on weekends
            if (isWeekend) {
                console.log(`Permit-based reservation starts on weekend (day ${start.getDay()}) - parking is free`);
                totalPrice = 0;
            } else {
                totalPrice = lot.semesterRate || 0;
            }
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
                        customerId: user.stripeCustomerId,
                        refundId: refund.id,
                        amount: refund.amount / 100,
                        status: refund.status
                    };

                    // Record permit refund in revenue statistics
                    try {
                        await RevenueStatistics.recordRefund(refund.amount / 100);
                        console.log(`Recorded permit refund: $${refund.amount / 100} for ${oldPermit.permitType} permit`);
                    } catch (revenueError) {
                        console.error('Failed to record permit refund in revenue statistics:', revenueError);
                        // Continue processing even if revenue recording fails
                    }

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

        // Check if this is a reservation starting on a weekend
        const startTimeDay = new Date(startTime).getDay();
        const isWeekend = startTimeDay === 0 || startTimeDay === 6; // 0 = Sunday, 6 = Saturday

        // If reservation is on a weekend, it's free
        if (isWeekend) {
            permitCompatible = true;
            if (validUserPermits.length > 0) {
                compatiblePermitId = validUserPermits[0]._id; // Use the first valid permit if available
            }
            console.log(`Weekend reservation (day ${startTimeDay}) - parking is free for all lot types`);
        }
        // Otherwise, check the time-based rules for weekdays
        else {
            // Check if this is a reservation starting before 7am or after 4pm with any valid permit
            const startTimeHour = new Date(startTime).getHours();
            const hasAnyPermit = validUserPermits.length > 0;
            const isAfter4PM = startTimeHour >= 16; // 4pm is 16 in 24-hour format
            const isBefore7AM = startTimeHour < 7;  // Before 7am
            const isPermitBasedLot = lot.rateType === 'Permit-based';

            // If reservation is for a permit-based lot, starts before 7am or after 4pm, and user has any permit, make it free
            if (isPermitBasedLot && (isBefore7AM || isAfter4PM) && hasAnyPermit) {
                permitCompatible = true;
                compatiblePermitId = validUserPermits[0]._id; // Use the first valid permit
                console.log(`Permit-based lot reservation during free hours (${startTimeHour}:00) with permit - reservation will be free`);
            }
        }

        // If permit is compatible, make reservation free
        if (permitCompatible) {
            totalPrice = 0;
            console.log('Compatible permit found or weekend - reservation will be free');
        }

        // Process payment if needed
        let paymentStatus = 'completed'; // Default to completed for free reservations
        let stripePaymentIntentId = null;
        let stripePaymentMethodId = null;
        let stripeReceiptUrl = null;

        // Only process payment if the price is greater than 0 and payment info is provided
        if (totalPrice > 0 && paymentInfo) {
            try {
                const amount = totalPrice * 100; // Stripe expects amount in cents

                // Define payment options
                const paymentOptions = {
                    amount: Math.round(amount),
                    currency: 'usd',
                    payment_method: paymentInfo.paymentMethodId,
                    confirm: true,
                    description: `Reservation for ${lot.name}`,
                    metadata: {
                        userId: req.user.userId,
                        lotId: lotId,
                        lotName: lot.name,
                        startTime,
                        endTime,
                        permitType
                    },
                    receipt_email: user.email,
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                };

                // If customer has a Stripe customer ID, include it in the payment options
                // This is required when using a saved payment method
                if (user.stripeCustomerId) {
                    paymentOptions.customer = user.stripeCustomerId;
                    console.log(`Using customer ID from user: ${user.stripeCustomerId} for payment method: ${paymentInfo.paymentMethodId}`);
                } else if (paymentInfo.customerId) {
                    // If customerId is sent with the payment info, use that instead
                    paymentOptions.customer = paymentInfo.customerId;
                    console.log(`Using customer ID from payment info: ${paymentInfo.customerId} for payment method: ${paymentInfo.paymentMethodId}`);
                }

                const paymentIntent = await stripe.paymentIntents.create(paymentOptions);
                paymentStatus = paymentIntent.status === 'succeeded' ? 'completed' : 'pending';
                stripePaymentIntentId = paymentIntent.id;
                stripePaymentMethodId = paymentInfo.paymentMethodId;
                stripeReceiptUrl = paymentIntent.charges?.data[0]?.receipt_url || null;

                // Record revenue statistics for this payment if it was successful
                if (paymentStatus === 'completed' && totalPrice > 0) {
                    try {
                        // Only hourly parking revenue is tracked here (permit revenue is tracked separately)
                        if (lot.rateType === 'Hourly' || (lot.features && lot.features.isMetered)) {
                            await RevenueStatistics.recordMeteredPurchase(totalPrice);
                            console.log(`Recorded metered parking revenue: $${totalPrice} for reservation at ${lot.name}`);
                        } else {
                            // For other types of non-permit reservations, record as permit revenue
                            // since there isn't a specific category for non-metered, non-permit reservations
                            await RevenueStatistics.recordPermitPurchase(totalPrice);
                            console.log(`Recorded reservation revenue: $${totalPrice} for reservation at ${lot.name}`);
                        }
                    } catch (revenueError) {
                        console.error('Failed to record revenue statistics:', revenueError);
                        // Continue processing even if revenue recording fails
                    }
                }
            } catch (stripeError) {
                console.error('Stripe payment failed:', stripeError);
                return res.status(400).json({
                    message: 'Payment processing failed',
                    error: stripeError.message
                });
            }
        } else {
            // For free reservations, mark payment as completed
            if (totalPrice === 0) {
                console.log('Free reservation - setting payment status to completed');
                paymentStatus = 'completed';
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

                // Extract the base permit type without the word "Permit" if present
                let basePermitType = cleanPermitType;
                if (basePermitType && basePermitType.endsWith(' Permit')) {
                    basePermitType = basePermitType.replace(' Permit', '');
                }

                // Create a new permit with end date 4 months from now
                const fourMonthsFromNow = new Date();
                fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4);
                fourMonthsFromNow.setHours(23, 59, 59, 999); // Set to end of day

                const permitStatus = paymentStatus === 'completed' ? 'active' : 'pending';

                newPermit = new Permit({
                    permitNumber,
                    permitName: `${cleanPermitType}`,
                    permitType: basePermitType,
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

                // Record permit purchase in revenue statistics
                try {
                    if (newPermit.price > 0 && newPermit.paymentStatus === 'paid') {
                        await RevenueStatistics.recordPermitPurchase(newPermit.price);
                        console.log(`Recorded permit purchase revenue: $${newPermit.price} for ${newPermit.permitName}`);
                    }
                } catch (revenueError) {
                    console.error('Failed to record permit purchase revenue:', revenueError);
                    // Continue processing even if revenue recording fails
                }

                // Create notification for permit
                try {
                    await NotificationHelper.createSystemNotification(
                        req.user.userId,
                        'New Permit Created',
                        `Your ${cleanPermitType} permit has been created and is now active until ${fourMonthsFromNow.toLocaleDateString()}.`,
                        '/dashboard'
                    );

                    // Send email notification about the new permit
                    try {
                        if (user.email) {
                            // Send email notification about the permit
                            const emailResult = await emailService.sendReservationConfirmation(
                                user.email,
                                `${user.firstName} ${user.lastName}`,
                                {
                                    _id: newPermit._id,
                                    id: newPermit.permitNumber,
                                    lotId: { name: lot.name },
                                    startTime: newPermit.startDate,
                                    endTime: newPermit.endDate,
                                    status: 'Permit Created',
                                    totalPrice: newPermit.price,
                                    permitDetails: {
                                        permitType: cleanPermitType,
                                        permitNumber: newPermit.permitNumber
                                    },
                                    // Add receipt information if payment was processed
                                    receiptInfo: newPermit.price > 0 && stripePaymentIntentId ? {
                                        paymentId: stripePaymentIntentId,
                                        paymentDate: new Date(),
                                        paymentMethod: stripePaymentMethodId ? 'Credit Card' : 'Online Payment',
                                        receiptUrl: stripeReceiptUrl || null,
                                        amount: newPermit.price,
                                        description: `Payment for ${cleanPermitType} Permit - Valid until ${fourMonthsFromNow.toLocaleDateString()}`
                                    } : null
                                },
                                process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
                            );

                            console.log(`Permit creation email sent to ${user.email}: ${emailResult.success ? emailResult.messageId || 'success' : 'failed'}`);
                        }
                    } catch (emailError) {
                        console.error('Failed to send permit creation email:', emailError);
                        // Continue even if email sending fails
                    }
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
        // For free reservations or when a permit is compatible, always set to active
        let reservationStatus = 'active';

        // Only use pending status for non-free reservations that haven't been paid
        if (totalPrice > 0 && !permitCompatible && paymentStatus !== 'completed') {
            reservationStatus = 'pending';
        }

        // Track if this price was adjusted due to time-based rules
        const isWeekendParking = new Date(startTime).getDay() === 0 || new Date(startTime).getDay() === 6;
        const startHour = new Date(startTime).getHours();
        const isMeteredLotWithTimeDiscount = (lot.features && lot.features.isMetered) &&
            (startHour < 7 || startHour >= 19 || isWeekendParking);
        const isPermitLotWithTimeDiscount = (lot.rateType === 'Permit-based') &&
            ((startHour < 7 || startHour >= 16) || isWeekendParking);

        const adjustedForTimeRules = isWeekendParking || isMeteredLotWithTimeDiscount || isPermitLotWithTimeDiscount;
        const freeReason = isWeekendParking ? 'Weekend (free parking)' :
            isMeteredLotWithTimeDiscount ? 'Outside metered hours (7am-7pm)' :
                isPermitLotWithTimeDiscount ? 'Outside permit enforcement hours (7am-4pm)' : '';

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
            compatiblePermitId: compatiblePermitId,
            // Add explicit free reservation flag if client sent it or if time-based rules apply
            isFreeReservation: req.body.isFreeReservation === true || totalPrice === 0,
            freeReason: req.body.freeReason || freeReason,
            // Add field to track if time-based rules applied
            adjustedForTimeRules: adjustedForTimeRules,
            // Store time details for better tracking
            timeDetails: {
                isWeekend: isWeekendParking,
                startHour,
                isMeteredLot: lot.features && lot.features.isMetered,
                isPermitBasedLot: lot.rateType === 'Permit-based'
            }
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

            // Send email notification about the new reservation
            try {
                if (user.email) {
                    // Send email notification about the reservation
                    const emailResult = await emailService.sendReservationConfirmation(
                        user.email,
                        `${user.firstName} ${user.lastName}`,
                        savedReservation,
                        process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
                    );

                    console.log(`Reservation confirmation email sent to ${user.email}: ${emailResult.success ? emailResult.messageId || 'success' : 'failed'}`);
                }
            } catch (emailError) {
                console.error('Failed to send reservation confirmation email:', emailError);
                // Continue even if email sending fails
            }
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