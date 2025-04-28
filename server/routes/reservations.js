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

        // Check if user already has an active reservation
        const existingActiveReservations = await Reservation.find({
            user: req.user.userId,
            status: { $in: ['active', 'pending'] },
            endTime: { $gt: new Date() }
        });

        if (existingActiveReservations.length > 0) {
            console.log(`User ${req.user.userId} attempted to create a new reservation while having ${existingActiveReservations.length} active reservations.`);
            console.log('Active reservation details:', existingActiveReservations.map(r => ({
                id: r.reservationId,
                lot: r.lotId,
                status: r.status,
                startTime: r.startTime,
                endTime: r.endTime
            })));
            return res.status(400).json({
                message: 'You already have an active reservation. Please complete or cancel your existing reservation before creating a new one.'
            });
        }

        // Calculate total price based on duration for hourly lots
        let totalPrice = 0;
        if (lot.rateType === 'Hourly') {
            const start = new Date(startTime);
            const end = new Date(endTime);

            // Check if the reservation extends past 7PM (19:00)
            const sevenPM = new Date(startTime);
            sevenPM.setHours(19, 0, 0, 0); // Set to 7:00 PM of the same day

            let billableDurationHours;

            if (start.getHours() >= 19) {
                // If starting after 7PM, no charge for metered parking
                billableDurationHours = 0;
                console.log('Reservation starts after 7PM - free metered parking');
            } else if (end > sevenPM) {
                // If ending after 7PM, only charge until 7PM
                billableDurationHours = (sevenPM - start) / (1000 * 60 * 60);
                console.log(`Reservation extends past 7PM - charging only until 7PM: ${billableDurationHours} hours`);
            } else {
                // If entirely before 7PM, charge the full duration
                billableDurationHours = (end - start) / (1000 * 60 * 60);
                console.log(`Reservation entirely before 7PM - charging full duration: ${billableDurationHours} hours`);
            }

            totalPrice = billableDurationHours * lot.hourlyRate;
        } else if (lot.rateType === 'Permit-based') {
            // For permit-based lots, check if it's after 4PM (free after 4PM)
            const start = new Date(startTime);

            if (start.getHours() >= 16) {
                // If starting after 4PM, permit-based lots are free
                totalPrice = 0;
                console.log('Reservation starts after 4PM - free permit-based parking');
            } else {
                // Otherwise, use the semester rate
                totalPrice = lot.semesterRate || 0;
                console.log(`Reservation before 4PM - charging semester rate: $${totalPrice}`);
            }
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
        let refundIssued = false;
        let refundAmount = 0;

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
                    } else {
                        // Check if user has a permit with a different permit type
                        // In this case, we'll refund the old permit and charge for the new one
                        const differentTypePermit = validUserPermits.find(p =>
                            p.permitType !== (permitType || 'Standard')
                        );

                        if (differentTypePermit && paymentInfo && paymentInfo.paymentMethodId) {
                            console.log('User is switching to a different permit type - refunding old permit');
                            permitToCancel = differentTypePermit;

                            // Attempt to refund the old permit
                            if (differentTypePermit.paymentId && differentTypePermit.price > 0) {
                                try {
                                    // Process refund via Stripe
                                    const refund = await stripe.refunds.create({
                                        payment_intent: differentTypePermit.paymentId,
                                        amount: Math.round(differentTypePermit.price * 100) // Convert to cents for Stripe
                                    });

                                    console.log('Permit refund processed successfully:', refund);

                                    // Update old permit's payment status
                                    differentTypePermit.paymentStatus = 'refunded';
                                    differentTypePermit.refundId = refund.id;
                                    differentTypePermit.refundedAt = new Date();
                                    differentTypePermit.status = 'inactive';
                                    differentTypePermit.endDate = new Date(); // End immediately
                                    await differentTypePermit.save();

                                    console.log(`Successfully deactivated old permit ${differentTypePermit._id} of type ${differentTypePermit.permitType}`);

                                    refundIssued = true;
                                    refundAmount = differentTypePermit.price;

                                    // Update revenue statistics to reflect the permit refund
                                    try {
                                        await RevenueStatistics.recordPermitRefund(differentTypePermit.price);
                                        console.log(`Recorded permit refund of $${differentTypePermit.price} in revenue statistics`);
                                    } catch (statsError) {
                                        console.error('Failed to update revenue statistics for permit refund:', statsError);
                                    }

                                    // We still need to charge for the new permit
                                    freeReservation = false;

                                    // Add the following code for a dedicated refund email notification
                                    try {
                                        // Send a specific refund notification email to the user
                                        const emailResult = await emailService.sendReservationConfirmation(
                                            user.email,
                                            `${user.firstName} ${user.lastName}`,
                                            {
                                                _id: differentTypePermit._id,
                                                id: differentTypePermit.permitNumber,
                                                lotId: { name: differentTypePermit.lots.map(l => l.lotName).join(', ') },
                                                startTime: differentTypePermit.startDate,
                                                endTime: differentTypePermit.endDate,
                                                status: 'Permit Refunded',
                                                totalPrice: differentTypePermit.price,
                                                refundInfo: {
                                                    refundId: refund.id,
                                                    amount: differentTypePermit.price,
                                                    status: refund.status
                                                },
                                                permitDetails: {
                                                    permitName: differentTypePermit.permitName,
                                                    permitType: differentTypePermit.permitType,
                                                    message: `Your ${differentTypePermit.permitName} has been refunded for $${differentTypePermit.price.toFixed(2)} because you are switching to a new permit type.`
                                                }
                                            },
                                            process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                                        );
                                        console.log('Permit refund email sent:', emailResult.messageId);
                                    } catch (emailError) {
                                        console.error('Failed to send permit refund email:', emailError);
                                        // Continue even if email sending fails
                                    }
                                } catch (refundError) {
                                    console.error('Permit refund error:', refundError);

                                    // Even if refund fails, still deactivate the old permit
                                    try {
                                        differentTypePermit.status = 'inactive';
                                        differentTypePermit.endDate = new Date(); // End immediately

                                        // Even if refund fails, still mark as refunded for billing history
                                        differentTypePermit.paymentStatus = 'refunded';
                                        differentTypePermit.refundedAt = new Date();

                                        await differentTypePermit.save();
                                        console.log(`Successfully deactivated old permit ${differentTypePermit._id} despite refund failure`);

                                        // Still track as refunded for notification purposes
                                        refundIssued = true;
                                        refundAmount = differentTypePermit.price;
                                    } catch (deactivateError) {
                                        console.error('Error deactivating old permit after refund failure:', deactivateError);
                                    }

                                    // Continue even if refund fails, but still charge for new permit
                                    freeReservation = false;
                                }
                            } else {
                                // No payment ID or zero-price permit - just deactivate without refund
                                try {
                                    differentTypePermit.status = 'inactive';
                                    differentTypePermit.endDate = new Date(); // End immediately

                                    // Even for free permits, we need to set refund fields for billing history
                                    differentTypePermit.paymentStatus = 'refunded';
                                    differentTypePermit.refundedAt = new Date();

                                    await differentTypePermit.save();
                                    console.log(`Successfully deactivated old free permit ${differentTypePermit._id}`);

                                    // For user notification consistency
                                    refundIssued = true;
                                    refundAmount = 0;
                                } catch (deactivateError) {
                                    console.error('Error deactivating old free permit:', deactivateError);
                                }
                                freeReservation = false;
                            }
                        }
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
            // First check if a car with the same license plate already exists for this user
            let existingCar = null;
            if (vehicleInfo.plateNumber) {
                existingCar = await Car.findOne({
                    userId: req.user.userId,
                    plateNumber: vehicleInfo.plateNumber.toUpperCase(),
                    stateProv: vehicleInfo.state || vehicleInfo.stateProv
                });
            }

            if (existingCar) {
                // Use the existing car
                car = existingCar;
                console.log(`Using existing car with plate ${car.plateNumber} for reservation`);
            } else {
                // Create a new car document only if we didn't find a matching one
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
                console.log(`Created new car with plate ${car.plateNumber} for reservation`);

                // If this should be saved as primary car, update any existing primary cars
                if (vehicleInfo.saveAsPrimary) {
                    await Car.updateMany(
                        { userId: req.user.userId, _id: { $ne: car._id }, isPrimary: true },
                        { $set: { isPrimary: false } }
                    );
                }
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

                // Record revenue statistics for metered/hourly parking
                if (paymentStatus === 'completed' && totalPrice > 0) {
                    try {
                        // For hourly lots, record as metered revenue
                        if (lot.rateType === 'Hourly') {
                            await RevenueStatistics.recordMeteredPurchase(totalPrice);
                            console.log(`Recorded revenue for metered parking purchase: $${totalPrice}`);
                        }
                        // If we have a specific flag for metered parking that isn't captured by lot.rateType
                        else if (lot.isMetered || lot.meteredParking) {
                            await RevenueStatistics.recordMeteredPurchase(totalPrice);
                            console.log(`Recorded revenue for special metered parking purchase: $${totalPrice}`);
                        }
                    } catch (revenueError) {
                        console.error('Failed to record metered revenue statistics:', revenueError);
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
        }

        // Generate a unique reservation ID
        const reservationId = generateReservationId();

        // Determine the correct reservation status
        // Free reservations and zero-cost reservations should be active immediately
        const reservationStatus = (freeReservation || totalPrice === 0) ? 'active' : (paymentStatus === 'completed' ? 'active' : 'pending');

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
            status: reservationStatus,
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

                // Create a new permit with end date 4 months from now
                const fourMonthsFromNow = new Date();
                fourMonthsFromNow.setMonth(fourMonthsFromNow.getMonth() + 4);
                // Set time to end of day (23:59:59.999) to be consistent with expiration checks
                fourMonthsFromNow.setHours(23, 59, 59, 999);

                // Determine payment status - fix: 'unpaid' is not a valid enum value, using 'paid' instead
                const permitPaymentStatus = freeReservation ? 'paid' : (paymentStatus === 'completed' ? 'paid' : 'paid');

                // For free permits (price = 0), always set status to active and paymentStatus to paid
                const permitPrice = totalPrice || 0;
                const permitStatus = (permitPrice === 0 || paymentStatus === 'completed') ? 'active' : 'pending';

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
                    startDate: new Date(),
                    endDate: fourMonthsFromNow,
                    status: permitStatus, // Always active for free permits
                    price: permitPrice,
                    paymentStatus: permitPaymentStatus,
                    paymentId: stripePaymentIntentId || null,
                    permitTypeId: permitTypeDetails?._id || null,
                    replacesPermitId: cancelledPermitId
                });

                await newPermit.save();
                console.log('Permit created:', newPermit._id);

                // Deactivate all existing permits of different types 
                // This ensures old permits don't remain active when switching types
                if (newPermit && newPermit.permitType) {
                    try {
                        console.log(`Checking for permits to deactivate when creating new permit of type: ${newPermit.permitType}`);

                        // Find all active permits with different types
                        const permitsToDeactivate = await Permit.find({
                            userId: req.user.userId,
                            status: 'active',
                            _id: { $ne: newPermit._id } // Exclude the newly created permit
                        });

                        // Log what we found
                        console.log(`Found ${permitsToDeactivate.length} active permits to deactivate`);

                        if (permitsToDeactivate.length > 0) {
                            console.log('Permits to deactivate:', permitsToDeactivate.map(p => ({
                                id: p._id,
                                type: p.permitType,
                                name: p.permitName,
                                status: p.status
                            })));
                        }

                        // Deactivate each permit
                        for (const permit of permitsToDeactivate) {
                            console.log(`Deactivating permit ${permit._id} of type ${permit.permitType}`);

                            // Store reference to the new permit that's replacing this one
                            permit.replacesPermitId = newPermit._id;

                            // Mark as inactive
                            permit.status = 'inactive';
                            permit.endDate = new Date(); // End immediately

                            // Set refund fields for billing history
                            permit.paymentStatus = 'refunded';
                            permit.refundedAt = new Date();

                            await permit.save();
                            console.log(`Successfully deactivated permit ${permit._id}`);

                            // Create notification for the user about the permit change
                            try {
                                await NotificationHelper.createSystemNotification(
                                    req.user.userId,
                                    'Permit Changed',
                                    `Your ${permit.permitName} has been replaced with a ${newPermit.permitName}.`,
                                    'Your old permit has been deactivated and a new permit has been activated.',
                                    '/permits'
                                );
                                console.log(`Sent notification about permit change to user: ${req.user.userId}`);
                            } catch (notificationError) {
                                console.error('Error creating permit change notification:', notificationError);
                            }
                        }
                    } catch (deactivateError) {
                        console.error('Error deactivating old permits:', deactivateError);
                        // Continue even if deactivation fails
                    }
                }

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

        // Create a notification for the user about their new reservation
        try {
            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'New Reservation Confirmed',
                `Your reservation at ${lot.name} has been confirmed from ${new Date(startTime).toLocaleString()} to ${new Date(endTime).toLocaleString()}.`,
                '/dashboard'
            );
            console.log('Reservation creation notification sent to user:', req.user.userId);

            // If a permit refund was issued, create a notification for that too
            if (refundIssued) {
                await NotificationHelper.createSystemNotification(
                    req.user.userId,
                    'Permit Refund Issued',
                    `A refund of $${refundAmount.toFixed(2)} has been issued for your previous permit. Your new permit is now active.`,
                    '/permits'
                );
                console.log('Permit refund notification sent to user:', req.user.userId);
            }

            // Send email confirmation for the reservation
            try {
                const emailResult = await emailService.sendReservationConfirmation(
                    user.email,
                    `${user.firstName} ${user.lastName}`,
                    {
                        _id: savedReservation._id,
                        id: savedReservation.reservationId,
                        lotId: { name: lot.name },
                        startTime: startTime,
                        endTime: endTime,
                        status: savedReservation.status,
                        totalPrice: totalPrice,
                        freeReservation: freeReservation,
                        permitToCancel: permitToCancel ? true : false,
                        freeAfter4PM: freeAfter4PM
                    },
                    process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                );
                console.log('Reservation confirmation email sent:', emailResult.messageId);
            } catch (emailError) {
                console.error('Failed to send reservation confirmation email:', emailError);
                // Continue even if email sending fails
            }
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
        } else if (refundIssued) {
            successMessage = 'Reservation created successfully. Your previous permit has been refunded and replaced with the new permit type.';
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
                cancelledPermitId: cancelledPermitId,
                refundIssued: refundIssued,
                refundAmount: refundIssued ? refundAmount : 0
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

        // Determine if reservation created a new permit
        const permitCreated = await Permit.findOne({
            userId: req.user.userId,
            paymentId: reservation.stripePaymentIntentId
        });

        // Only refund if there was no permit created or if this was specifically a reservation-only payment
        let amountToRefund = 0;
        const paymentIntentId = reservation.stripePaymentIntentId;

        // If a permit was created with this payment, don't issue a refund
        // Permits are non-refundable one-time purchases
        if (!permitCreated && paymentIntentId && reservation.paymentStatus === 'completed' && reservation.totalPrice > 0) {
            amountToRefund = reservation.totalPrice;
        }

        // If payment was made, process refund (only for non-permit payments)
        let refundResult = null;
        if (paymentIntentId && amountToRefund > 0) {
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
                    if (reservation.lotId && reservation.lotId.rateType === 'Hourly') {
                        // For hourly/metered reservations, use recordMeteredRefund
                        await RevenueStatistics.recordMeteredRefund(amountToRefund);
                        console.log(`Recorded metered refund of $${amountToRefund} in revenue statistics`);
                    } else {
                        // For permit-based reservations, use recordRefund
                        await RevenueStatistics.recordRefund(amountToRefund);
                        console.log(`Recorded refund of $${amountToRefund} in revenue statistics`);
                    }
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

        // Create a notification for the user about their cancelled reservation
        try {
            const notificationMessage = permitCreated
                ? `Your reservation at ${reservation.lotId.name} has been cancelled. Your permit remains active and valid.`
                : `Your reservation at ${reservation.lotId.name} has been cancelled.`;

            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'Reservation Cancelled',
                notificationMessage,
                '/dashboard'
            );

            // Send cancellation email
            try {
                // Get user information for the email
                const user = await User.findById(req.user.userId);

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
                        refundInfo: refundResult
                    },
                    process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                );
                console.log('Reservation cancellation email sent:', emailResult.messageId);
            } catch (emailError) {
                console.error('Failed to send reservation cancellation email:', emailError);
                // Continue even if email sending fails
            }
        } catch (notificationError) {
            console.error('Error creating cancellation notification:', notificationError);
            // Continue even if notification creation fails
        }

        // Add the following code for a dedicated metered refund email notification
        if (amountToRefund > 0 && refundResult) {
            try {
                // Determine if this was a metered reservation
                const isMetered = reservation.lotId &&
                    (reservation.lotId.rateType === 'Hourly' ||
                        reservation.lotId.isMetered ||
                        reservation.lotId.meteredParking);

                // Get user information for the email
                const userForEmail = await User.findById(reservation.user);
                if (userForEmail && userForEmail.email) {
                    // Special subject and messaging for refund notifications
                    const emailResult = await emailService.sendReservationConfirmation(
                        userForEmail.email,
                        `${userForEmail.firstName} ${userForEmail.lastName}`,
                        {
                            _id: reservation._id,
                            id: reservation.reservationId,
                            lotId: reservation.lotId,
                            startTime: reservation.startTime,
                            endTime: reservation.endTime,
                            status: 'Refund Issued',
                            totalPrice: amountToRefund,
                            refundInfo: refundResult,
                            additionalInfo: {
                                isMetered: isMetered,
                                message: isMetered ?
                                    `Your metered parking reservation has been cancelled and a refund of $${amountToRefund.toFixed(2)} has been issued to your payment method.` :
                                    `Your parking reservation has been cancelled and a refund of $${amountToRefund.toFixed(2)} has been issued to your payment method.`
                            }
                        },
                        process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                    );
                    console.log(`Reservation refund email sent to ${userForEmail.email}: ${emailResult.messageId}`);
                }
            } catch (emailError) {
                console.error('Failed to send reservation refund email:', emailError);
                // Continue even if email sending fails
            }
        }

        const responseMessage = permitCreated
            ? 'Reservation cancelled successfully. Your permit remains active and valid.'
            : (refundResult ? 'Reservation cancelled successfully and refund processed' : 'Reservation cancelled successfully');

        res.status(200).json({
            success: true,
            message: responseMessage,
            data: {
                reservation,
                refund: refundResult,
                permitRetained: permitCreated ? true : false
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
            // For hourly rates, calculate billable hours considering 7PM cutoff
            let billableAdditionalHours = additionalHours;
            const currentEndDateTime = new Date(reservation.endTime);

            // Check if the current endTime is already after 7PM
            if (currentEndDateTime.getHours() >= 19) {
                // If already past 7PM, no charge for any extension
                billableAdditionalHours = 0;
                console.log('Current end time already past 7PM - extension is free');
            }
            // Check if extension crosses 7PM boundary
            else {
                // Create a 7PM timestamp for comparison
                const sevenPM = new Date(currentEndDateTime);
                sevenPM.setHours(19, 0, 0, 0);

                // If the new end time is after 7PM, only charge until 7PM
                if (newEndTime > sevenPM) {
                    // Calculate billable hours only until 7PM
                    billableAdditionalHours = (sevenPM - currentEndDateTime) / (1000 * 60 * 60);
                    console.log(`Extension crosses 7PM - charging only until 7PM: ${billableAdditionalHours.toFixed(2)} billable hours`);
                }
            }

            // For hourly rates, charge based on billable additional hours (respecting 7PM cutoff)
            additionalPrice = billableAdditionalHours * reservation.lotId.hourlyRate;

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

                // Record revenue statistics for metered/hourly parking extension
                if (additionalPrice > 0 && (isMetered || (reservation.lotId.rateType === 'Hourly'))) {
                    try {
                        await RevenueStatistics.recordMeteredPurchase(additionalPrice);
                        console.log(`Recorded revenue for metered parking extension: $${additionalPrice}`);
                    } catch (revenueError) {
                        console.error('Failed to record metered extension revenue statistics:', revenueError);
                        // Continue processing even if revenue recording fails
                    }
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

        // Create a notification for the user about their extended reservation
        try {
            const formattedOldEndTime = new Date(currentEndTime).toLocaleString();
            const formattedNewEndTime = new Date(newEndTime).toLocaleString();

            await NotificationHelper.createSystemNotification(
                req.user.userId,
                'Reservation Extended',
                `Your reservation at ${reservation.lotId.name} has been extended from ${formattedOldEndTime} to ${formattedNewEndTime}.`,
                '/past-reservations'
            );
            console.log('Reservation extension notification sent to user:', req.user.userId);

            // Send extension email
            try {
                // Get user information for the email
                const user = await User.findById(req.user.userId);

                const emailResult = await emailService.sendReservationConfirmation(
                    user.email,
                    `${user.firstName} ${user.lastName}`,
                    {
                        _id: reservation._id,
                        id: reservation.reservationId,
                        lotId: reservation.lotId,
                        startTime: reservation.startTime,
                        endTime: newEndTime,
                        status: reservation.status,
                        totalPrice: reservation.totalPrice,
                        extensionDetails: {
                            previousEndTime: currentEndTime,
                            additionalHours: additionalHours,
                            additionalCost: additionalPrice
                        }
                    },
                    process.env.CLIENT_BASE_URL || 'http://localhost:5173'
                );
                console.log('Reservation extension email sent:', emailResult.messageId);
            } catch (emailError) {
                console.error('Failed to send reservation extension email:', emailError);
                // Continue even if email sending fails
            }
        } catch (notificationError) {
            console.error('Error creating reservation extension notification:', notificationError);
            // Continue even if notification creation fails
        }

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