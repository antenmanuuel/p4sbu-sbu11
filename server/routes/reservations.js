// TP: this .js file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

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

// Helper function to generate a unique reservation ID
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

// POST /api/reservations - Create a new reservation
router.post('/', verifyToken, async (req, res) => {
    try {
        const { lotId, startTime, endTime, permitType, vehicleInfo, paymentInfo } = req.body;

        console.log('Creating reservation with data:', { lotId, startTime, endTime, permitType, vehicleInfo });

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

        // Check if permit type is valid for this lot
        if (permitType && lot.permitTypes && lot.permitTypes.length > 0) {
            if (!lot.permitTypes.includes(permitType)) {
                return res.status(400).json({ message: 'Selected permit type is not valid for this lot' });
            }
        }

        // Calculate total price based on duration for hourly lots
        let totalPrice = 0;
        if (lot.rateType === 'Hourly') {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const durationHours = (end - start) / (1000 * 60 * 60);
            totalPrice = durationHours * lot.hourlyRate;
        } else if (lot.rateType === 'Permit-based') {
            // For permit-based lots, the price depends on the permit type
            // This would typically be handled by the permit type system
            totalPrice = lot.semesterRate || 0; // Default to semester rate
        }

        // Check if the reservation starts after 4PM for free access with permit
        const isFreeAfter4PM = () => {
            const start = new Date(startTime);
            return start.getHours() >= 16; // 4PM = 16:00
        };

        // Check if user already has an active permit for this permit type
        let existingPermit = null;
        let permitToCancel = null;
        let freeReservation = false;
        let freeAfter4PM = false;

        // Find existing permits for this user that are active and paid
        const userPermits = await Permit.find({
            userId: user._id,
            status: 'active',
            paymentStatus: { $in: ['paid', 'completed'] }
        });

        // Filter valid permits using our static method
        const validUserPermits = userPermits.filter(permit => Permit.isValidPermit(permit));

        // If user has any valid permits and the reservation is after 4PM,
        // it's free for lots with permit types
        if (validUserPermits.length > 0 && isFreeAfter4PM() &&
            lot.permitTypes && lot.permitTypes.length > 0) {
            console.log('Reservation after 4PM with valid permit - free access granted');
            freeReservation = true;
            freeAfter4PM = true;
            totalPrice = 0;
        }
        // Otherwise, check for existing permit as normal
        else if (lot.rateType === 'Permit-based') {
            if (validUserPermits.length > 0) {
                console.log(`User has ${validUserPermits.length} valid permits. Checking compatibility...`);

                // First, check if user has a permit for this exact lot
                existingPermit = validUserPermits.find(p =>
                    p.lots.some(l => l.lotId.toString() === lotId.toString())
                );

                if (existingPermit) {
                    // User already has a permit for this exact lot - no need to charge
                    console.log('User has an existing permit for this lot - no charge needed');
                    freeReservation = true;
                    totalPrice = 0;
                } else {
                    // Check if user has a permit with the same permit type but for a different lot
                    const sameTypePermit = validUserPermits.find(p =>
                        p.permitType === (permitType || 'Standard') &&
                        !p.lots.some(l => l.lotId.toString() === lotId.toString())
                    );

                    if (sameTypePermit) {
                        // User is switching lots but has the same permit type
                        console.log('User is switching lots with same permit type - updating existing permit');
                        permitToCancel = sameTypePermit;
                        freeReservation = true;
                        totalPrice = 0;
                    }
                }
            }
        }

        // Create or find car information
        let car;
        if (typeof vehicleInfo === 'string' || (vehicleInfo.carId && typeof vehicleInfo.carId === 'string')) {
            // If vehicleInfo is already a Car document ID or contains a carId property
            const carId = typeof vehicleInfo === 'string' ? vehicleInfo : vehicleInfo.carId;
            car = await Car.findById(carId);
            if (!car) {
                return res.status(400).json({ message: 'Invalid vehicle information' });
            }

            // Verify the car belongs to the user
            if (car.userId && car.userId.toString() !== req.user.userId) {
                return res.status(403).json({ message: 'You do not have permission to use this vehicle' });
            }
        } else {
            // Create a new car document
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

            // If this should be saved as primary car, update any existing primary cars
            if (vehicleInfo.saveAsPrimary) {
                await Car.updateMany(
                    { userId: req.user.userId, _id: { $ne: car._id }, isPrimary: true },
                    { $set: { isPrimary: false } }
                );
            }
        }

        // Process payment with Stripe (only if payment is needed)
        let paymentStatus = freeReservation ? 'completed' : 'pending';
        let stripePaymentIntentId = null;
        let stripePaymentMethodId = null;
        let stripeReceiptUrl = null;

        if (paymentInfo && paymentInfo.paymentMethodId && totalPrice > 0 && !freeReservation) {
            try {
                // Get user to check for customer ID
                const currentUser = await User.findById(req.user.userId);
                if (!currentUser) {
                    return res.status(404).json({ message: 'User not found' });
                }

                console.log('Processing payment with method:', {
                    paymentMethodId: paymentInfo.paymentMethodId,
                    userStripeCustomerId: currentUser.stripeCustomerId
                });

                // Check for customer ID and handle payment method attachment
                let stripeCustomerId = currentUser.stripeCustomerId;
                let paymentMethodBelongsToCustomer = false;

                if (stripeCustomerId) {
                    // Check if payment method belongs to this customer
                    try {
                        const paymentMethods = await stripe.paymentMethods.list({
                            customer: stripeCustomerId,
                            type: 'card',
                        });

                        paymentMethodBelongsToCustomer = paymentMethods.data.some(pm => pm.id === paymentInfo.paymentMethodId);
                        console.log(`Payment method ${paymentInfo.paymentMethodId} belongs to customer? ${paymentMethodBelongsToCustomer}`);
                    } catch (listError) {
                        console.error('Error checking payment methods:', listError);
                    }

                    if (!paymentMethodBelongsToCustomer) {
                        // Attach payment method to customer
                        try {
                            await stripe.paymentMethods.attach(paymentInfo.paymentMethodId, {
                                customer: stripeCustomerId,
                            });
                            console.log('Payment method attached to customer');
                        } catch (attachError) {
                            console.error('Error attaching payment method:', attachError);
                        }
                    }
                } else {
                    // Create a customer if the user doesn't have one
                    try {
                        const customer = await stripe.customers.create({
                            email: currentUser.email,
                            name: `${currentUser.firstName} ${currentUser.lastName}`,
                            metadata: {
                                userId: currentUser._id.toString()
                            }
                        });

                        stripeCustomerId = customer.id;
                        // Update user with customer ID
                        currentUser.stripeCustomerId = stripeCustomerId;
                        await currentUser.save();
                        console.log('Created new Stripe customer:', stripeCustomerId);

                        // Attach payment method to new customer
                        await stripe.paymentMethods.attach(paymentInfo.paymentMethodId, {
                            customer: stripeCustomerId,
                        });
                        console.log('Payment method attached to new customer');
                    } catch (customerError) {
                        console.error('Error creating customer:', customerError);
                        return res.status(400).json({
                            message: 'Payment processing failed - unable to create customer',
                            error: customerError.message
                        });
                    }
                }

                // Create payment intent with Stripe - always include customer ID
                const paymentOptions = {
                    amount: Math.round(totalPrice * 100), // Stripe uses cents
                    currency: 'usd',
                    customer: stripeCustomerId, // Include customer ID with payment method
                    payment_method: paymentInfo.paymentMethodId,
                    confirm: true,
                    description: `Parking reservation at ${lot.name}`,
                    metadata: {
                        lotId: lotId.toString(),
                        permitType: permitType || 'N/A',
                        startTime: new Date(startTime).toISOString(),
                        endTime: new Date(endTime).toISOString()
                    },
                    automatic_payment_methods: {
                        enabled: true,
                        allow_redirects: 'never'
                    }
                };

                console.log('Creating payment intent with options:', JSON.stringify(paymentOptions));
                const paymentIntent = await stripe.paymentIntents.create(paymentOptions);

                // Set the payment fields
                paymentStatus = paymentIntent.status === 'succeeded' ? 'completed' : 'pending';
                stripePaymentIntentId = paymentIntent.id;
                stripePaymentMethodId = paymentInfo.paymentMethodId;
                stripeReceiptUrl = paymentIntent.charges?.data[0]?.receipt_url || null;

                console.log('Stripe payment successful:', stripePaymentIntentId);
            } catch (stripeError) {
                console.error('Stripe payment failed:', stripeError);
                return res.status(400).json({
                    message: 'Payment processing failed',
                    error: stripeError.message
                });
            }
        }

        // Generate a unique reservation ID
        const reservationId = generateReservationId();

        // Create the reservation with the car reference
        const reservation = new Reservation({
            reservationId,
            user: req.user.userId,
            lotId,
            startTime,
            endTime,
            permitType,
            vehicleInfo: car._id, // Use the car document ID
            paymentStatus,
            stripePaymentIntentId,
            stripePaymentMethodId,
            stripeReceiptUrl,
            totalPrice,
            status: paymentStatus === 'completed' ? 'active' : 'pending',
            usedExistingPermit: freeReservation
        });

        // Save the reservation
        console.log('Attempting to save reservation...', {
            userId: req.user.userId,
            lotId,
            permitType,
            vehicleId: car._id,
            totalPrice,
            freeReservation
        });
        const savedReservation = await reservation.save();
        console.log('Reservation saved successfully:', savedReservation._id);

        // Update the lot's available spaces
        lot.availableSpaces -= 1;
        await lot.save();
        console.log('Updated lot available spaces:', lot.availableSpaces);

        // If we're cancelling an existing permit (switching lots)
        let cancelledPermitId = null;
        if (permitToCancel) {
            try {
                console.log(`Cancelling existing permit ${permitToCancel._id} for lot switch`);
                permitToCancel.status = 'inactive';
                permitToCancel.endDate = new Date(); // End immediately
                await permitToCancel.save();
                cancelledPermitId = permitToCancel._id;
            } catch (error) {
                console.error('Error cancelling existing permit:', error);
                // Continue even if cancellation fails
            }
        }

        // For permit-based reservations, create a permit if user doesn't have one
        let newPermit = null;
        if (lot.rateType === 'Permit-based' && !existingPermit) {
            try {
                console.log('Creating permit for permit-based reservation');
                let actualPermitType = permitType || 'Standard';

                // Find permit type details if available
                let permitTypeDetails = null;
                try {
                    // Try different ways to find the permit type
                    const potentialPermitTypes = await PermitType.find({
                        $or: [
                            { name: actualPermitType },
                            { category: actualPermitType }
                        ]
                    });

                    // Filter to only valid (non-expired) permit types
                    const validPermitTypes = potentialPermitTypes.filter(pt =>
                        PermitType.isValidPermitType(pt)
                    );

                    if (validPermitTypes.length > 0) {
                        // Sort by price (lowest first) and pick the first one
                        permitTypeDetails = validPermitTypes.sort((a, b) => a.price - b.price)[0];

                        // Check if quantity is available
                        if (permitTypeDetails.quantity <= 0) {
                            console.log('No permits available for type:', permitTypeDetails.name);
                            throw new Error(`No ${permitTypeDetails.name} permits available`);
                        }

                        // Decrease the quantity
                        permitTypeDetails.quantity -= 1;
                        await permitTypeDetails.save();
                        console.log('Decreased permit type quantity for:', permitTypeDetails.name);
                    }
                } catch (permitTypeError) {
                    console.error('Error finding permit type:', permitTypeError);
                }

                // Generate a unique permit number
                const permitNumber = `P-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

                // Create a new permit
                const endDateTime = new Date(endTime);
                // Set time to end of day (23:59:59.999) to be consistent with expiration checks
                endDateTime.setHours(23, 59, 59, 999);

                // Determine payment status
                const permitPaymentStatus = freeReservation ? 'paid' : (paymentStatus === 'completed' ? 'paid' : 'unpaid');

                newPermit = new Permit({
                    permitNumber,
                    permitName: `${actualPermitType} Permit`,
                    permitType: permitTypeDetails?.category || actualPermitType,
                    userId: req.user.userId,
                    userFullName: `${user.firstName} ${user.lastName}`,
                    userEmail: user.email,
                    lots: [{
                        lotId: lot._id.toString(),
                        lotName: lot.name
                    }],
                    startDate: new Date(startTime),
                    endDate: endDateTime,
                    status: 'active',
                    price: totalPrice,
                    paymentStatus: permitPaymentStatus,
                    paymentId: stripePaymentIntentId || null,
                    permitTypeId: permitTypeDetails?._id || null,
                    replacesPermitId: cancelledPermitId
                });

                await newPermit.save();
                console.log('Permit created:', newPermit._id);

                // Record revenue statistics for paid permits
                if (permitPaymentStatus === 'paid' && totalPrice > 0) {
                    try {
                        await RevenueStatistics.recordPermitPurchase(totalPrice);
                        console.log(`Recorded revenue for permit purchase: $${totalPrice}`);
                    } catch (revenueError) {
                        console.error('Failed to record revenue statistics:', revenueError);
                        // Continue processing even if revenue recording fails
                    }
                }
            } catch (permitError) {
                console.error('Error creating permit:', permitError);
                // Don't fail the entire request if permit creation fails
            }
        }

        // Add new permit to the reservation statistics 
        if (newPermit) {
            try {
                await RevenueStatistics.recordPermitPurchase(newPermit.price);
                console.log(`Recorded permit revenue: $${newPermit.price}`);
            } catch (error) {
                console.error('Failed to record permit revenue statistics:', error);
            }
        }

        // Create a notification for the user about their new reservation
        try {
            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'New Reservation Confirmed',
                `Your reservation at ${lot.name} has been confirmed from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}.`,
                '/dashboard'
            );
            console.log('Reservation creation notification sent to user:', req.user.userId);
        } catch (notificationError) {
            console.error('Error creating reservation notification:', notificationError);
            // Continue even if notification creation fails
        }

        // Create the appropriate success message
        let successMessage = '';
        if (freeAfter4PM) {
            successMessage = 'Reservation created successfully - free access granted after 4PM with permit';
        } else if (freeReservation) {
            successMessage = 'Reservation created successfully using existing permit';
        } else {
            successMessage = 'Reservation created successfully';
        }

        res.status(201).json({
            success: true,
            message: successMessage,
            data: {
                reservation: savedReservation,
                paymentStatus: stripePaymentIntentId ? 'completed' : (freeReservation ? 'completed' : 'pending'),
                usedExistingPermit: freeReservation,
                freeAfter4PM: freeAfter4PM,
                newPermitCreated: newPermit ? true : false,
                existingPermitId: existingPermit ? existingPermit._id : null,
                cancelledPermitId: cancelledPermitId
            }
        });
    } catch (error) {
        console.error('Error creating reservation:', error);
        res.status(500).json({ message: 'An error occurred while creating the reservation', error: error.message });
    }
});

// GET /api/reservations - Get all reservations for the current user
router.get('/', verifyToken, async (req, res) => {
    try {
        // First update any expired reservations in the database
        await updateExpiredReservations();

        const { status, startDate, endDate, showPastOnly } = req.query;

        // Build query
        const query = { user: req.user.userId }; // Only show user's own reservations

        // Filter by status if provided
        if (status && status !== 'all') {
            query.status = status;
        }

        // Filter past reservations (completed or cancelled) if showPastOnly is true
        if (showPastOnly === 'true') {
            query.status = { $in: ['cancelled', 'completed'] };
        }

        // Filter by date range if provided
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                query.startTime.$lte = new Date(endDate);
            }
        }

        // Get reservations with lot and vehicle details
        const reservations = await Reservation.find(query)
            .populate('lotId', 'name address location permitTypes')
            .populate('vehicleInfo', 'plateNumber stateProv make model color bodyType')
            .sort({ startTime: -1 });

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

// GET /api/reservations/:id - Get a specific reservation
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

// POST /api/reservations/:id/cancel - Cancel a reservation
router.post('/:id/cancel', verifyToken, async (req, res) => {
    try {
        const reservationId = req.params.id;

        // Find the reservation
        const reservation = await Reservation.findOne({
            reservationId: reservationId,
            user: req.user.userId
        })
            .populate('lotId')
            .populate('vehicleInfo');

        if (!reservation) {
            return res.status(404).json({
                success: false,
                message: 'Reservation not found'
            });
        }

        // Check if reservation already cancelled
        if (reservation.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Reservation is already cancelled'
            });
        }

        // Check if reservation already completed
        if (reservation.status === 'completed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel a completed reservation'
            });
        }

        // Store original payment information for the refund
        const amountToRefund = reservation.totalPrice;
        const paymentIntentId = reservation.stripePaymentIntentId;

        // If payment was made, process refund
        let refundResult = null;
        if (paymentIntentId && reservation.paymentStatus === 'completed' && amountToRefund > 0) {
            try {
                // Process refund via Stripe
                const refund = await stripe.refunds.create({
                    payment_intent: paymentIntentId,
                    amount: Math.round(amountToRefund * 100) // Convert to cents for Stripe
                });

                console.log('Refund processed successfully:', refund);

                // Update payment status
                reservation.paymentStatus = 'refunded';

                // Add refund information to the reservation
                reservation.refundInfo = {
                    refundId: refund.id,
                    amount: refund.amount / 100, // Convert from cents
                    status: refund.status,
                    refundedAt: new Date()
                };

                refundResult = {
                    success: true,
                    refundId: refund.id,
                    amount: refund.amount / 100,
                    status: refund.status
                };

                // If this reservation contributed to revenue statistics, update those as well
                try {
                    // Update revenue statistics to reflect the refund
                    await RevenueStatistics.recordRefund(amountToRefund);
                    console.log(`Recorded refund of $${amountToRefund} in revenue statistics`);
                } catch (statsError) {
                    console.error('Failed to update revenue statistics for refund:', statsError);
                    // Continue even if revenue statistics update fails
                }
            } catch (refundError) {
                console.error('Refund error:', refundError);
                // Continue with cancellation even if refund fails
                // We can handle failed refunds separately
            }
        }

        // Update reservation status
        reservation.status = 'cancelled';
        reservation.cancelledAt = new Date();
        reservation.cancelReason = req.body.reason || 'User cancelled';

        await reservation.save();

        // Increase available spaces for the lot
        if (reservation.lotId) {
            await Lot.findByIdAndUpdate(
                reservation.lotId._id,
                { $inc: { availableSpaces: 1 } }
            );
        }

        // Create notification for the user about the cancellation
        try {
            await NotificationHelper.createReservationNotification(
                req.user.userId,
                reservation,
                'cancelled',
                '/past-reservations'
            );
            console.log('Cancellation notification created for reservation:', reservationId);
        } catch (notificationError) {
            console.error('Error creating cancellation notification:', notificationError);
            // Continue even if notification creation fails
        }

        res.status(200).json({
            success: true,
            message: refundResult ? 'Reservation cancelled successfully and refund processed' : 'Reservation cancelled successfully',
            data: {
                reservation,
                refund: refundResult
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

// POST /api/reservations/:id/extend - Extend a reservation's end time
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

        // Calculate additional price based on lot type
        let additionalPrice = 0;
        let isSemesterRate = false;
        // Metered lot extension fee
        const METERED_EXTENSION_FEE = 2.50;
        let hasExtensionFee = false;

        // Check if the extension goes beyond 7PM (19:00)
        const isAfter7PM = () => {
            // Get the new end time's hours in local time
            const newEndHour = newEndTime.getHours();
            return newEndHour >= 19; // 7PM or later
        };

        // Check if the extension starts after 4PM for permit holders
        const isAfter4PM = async () => {
            // Get the new end time's hours in local time
            const currentTime = new Date();

            // If the current time is after 4PM
            if (currentTime.getHours() >= 16) {
                // Check if the user has any valid permits
                const userPermits = await Permit.find({
                    userId: req.user.userId,
                    status: 'active',
                    paymentStatus: { $in: ['paid', 'completed'] }
                });

                // Filter valid permits
                const validUserPermits = userPermits.filter(permit => Permit.isValidPermit(permit));

                // If user has a valid permit and the lot has permit types
                if (validUserPermits.length > 0 &&
                    reservation.lotId &&
                    reservation.lotId.permitTypes &&
                    reservation.lotId.permitTypes.length > 0) {
                    return true;
                }
            }
            return false;
        };

        // Check if user has a permit and it's after 4PM
        const freeAfter4PMExtension = await isAfter4PM();

        if (reservation.lotId && reservation.lotId.rateType === 'Hourly') {
            // For hourly rates, charge based on additional hours
            additionalPrice = additionalHours * reservation.lotId.hourlyRate;

            // Add extension fee for metered lots only if extension is not after 7PM
            if ((isMetered || (reservation.lotId.features && reservation.lotId.features.isMetered)) && !isAfter7PM()) {
                additionalPrice += METERED_EXTENSION_FEE;
                hasExtensionFee = true;
            }

            // If user has a permit and it's after 4PM, make the extension free
            if (freeAfter4PMExtension) {
                console.log('Extension after 4PM with valid permit - free access granted');
                additionalPrice = 0;
                hasExtensionFee = false;
            }
        } else if (reservation.lotId && reservation.lotId.rateType === 'Permit-based') {
            // For semester/permit-based rates, no additional charge for time extensions
            isSemesterRate = true;
            additionalPrice = 0;
        }

        // Process additional payment if needed (only for hourly rates with a price > 0)
        let paymentResult = null;
        if (additionalPrice > 0 && req.body.paymentMethodId) {
            try {
                // Get user to check for customer ID
                const user = await User.findById(req.user.userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }

                console.log('Processing extension payment with method:', {
                    paymentMethodId: req.body.paymentMethodId,
                    userStripeCustomerId: user.stripeCustomerId
                });

                // Set up payment options with proper customer ID handling
                let stripeCustomerId = user.stripeCustomerId;
                let paymentMethodBelongsToCustomer = false;

                if (stripeCustomerId) {
                    // Check if payment method belongs to this customer
                    try {
                        const paymentMethods = await stripe.paymentMethods.list({
                            customer: stripeCustomerId,
                            type: 'card',
                        });

                        paymentMethodBelongsToCustomer = paymentMethods.data.some(pm => pm.id === req.body.paymentMethodId);
                        console.log(`Extension: Payment method ${req.body.paymentMethodId} belongs to customer? ${paymentMethodBelongsToCustomer}`);
                    } catch (listError) {
                        console.error('Error checking payment methods for extension:', listError);
                    }

                    if (!paymentMethodBelongsToCustomer) {
                        // Attach payment method to customer
                        try {
                            await stripe.paymentMethods.attach(req.body.paymentMethodId, {
                                customer: stripeCustomerId,
                            });
                            console.log('Extension: Payment method attached to customer');
                        } catch (attachError) {
                            console.error('Error attaching payment method for extension:', attachError);
                        }
                    }
                } else {
                    // Create a customer if the user doesn't have one
                    try {
                        const customer = await stripe.customers.create({
                            email: user.email,
                            name: `${user.firstName} ${user.lastName}`,
                            metadata: {
                                userId: user._id.toString()
                            }
                        });

                        stripeCustomerId = customer.id;
                        // Update user with customer ID
                        user.stripeCustomerId = stripeCustomerId;
                        await user.save();
                        console.log('Extension: Created new Stripe customer:', stripeCustomerId);

                        // Attach payment method to new customer
                        await stripe.paymentMethods.attach(req.body.paymentMethodId, {
                            customer: stripeCustomerId,
                        });
                        console.log('Extension: Payment method attached to new customer');
                    } catch (customerError) {
                        console.error('Error creating customer for extension:', customerError);
                        return res.status(400).json({
                            success: false,
                            message: 'Payment processing failed - unable to create customer',
                            error: customerError.message
                        });
                    }
                }

                // Create payment intent with Stripe - now including customer ID
                const paymentOptions = {
                    amount: Math.round(additionalPrice * 100), // Stripe uses cents
                    currency: 'usd',
                    customer: stripeCustomerId, // Include the customer ID
                    payment_method: req.body.paymentMethodId,
                    confirm: true,
                    description: `Extending reservation at ${reservation.lotId.name}`,
                    metadata: {
                        reservationId: reservation.reservationId,
                        additionalHours: additionalHours.toString(),
                        hasExtensionFee: hasExtensionFee.toString()
                    }
                };

                console.log('Creating extension payment intent with options:', JSON.stringify(paymentOptions));
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

        // If payment was successful or it's a semester rate (free extension), update extension history
        reservation.extensionHistory = reservation.extensionHistory || [];
        reservation.extensionHistory.push({
            extendedAt: new Date(),
            additionalHours,
            additionalPrice,
            extensionFee: hasExtensionFee ? METERED_EXTENSION_FEE : 0,
            paymentIntentId: paymentResult?.paymentIntentId || null,
            isSemesterRate
        });

        await reservation.save();

        const successMessage = isSemesterRate
            ? 'Reservation extended successfully at no additional cost (semester rate)'
            : hasExtensionFee
                ? `Reservation extended successfully with a $${METERED_EXTENSION_FEE.toFixed(2)} extension fee`
                : isMetered || (reservation.lotId.features && reservation.lotId.features.isMetered)
                    ? 'Reservation extended successfully at no additional cost (after 7PM extension)'
                    : freeAfter4PMExtension
                        ? 'Reservation extended successfully at no additional cost (free after 4PM with permit)'
                        : 'Reservation extended successfully';

        res.status(200).json({
            success: true,
            message: successMessage,
            data: {
                reservation,
                extension: {
                    previousEndTime: currentEndTime,
                    newEndTime,
                    additionalHours,
                    additionalPrice,
                    extensionFee: hasExtensionFee ? METERED_EXTENSION_FEE : 0,
                    isSemesterRate,
                    isAfter7PMFree: isMetered && isAfter7PM(),
                    isFreeAfter4PMWithPermit: freeAfter4PMExtension,
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

// PUT /api/reservations/check-expired - Admin endpoint to manually check and update expired reservations
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

module.exports = router; 