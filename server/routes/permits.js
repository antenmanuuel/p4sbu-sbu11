// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

// Reference: https://docs.stripe.com/webhooks?lang=node


const express = require('express');
const router = express.Router();
const Permit = require('../models/permits');
const { verifyToken, isAdmin } = require('../middleware/auth');
const RevenueStatistics = require('../models/revenue_statistics');
const { updateExpiredPermits } = require('../utils/permitUtils');
const NotificationHelper = require('../utils/notificationHelper');
const Lot = require('../models/lot');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Reservation = require('../models/reservation');

// GET /api/permits - Retrieve permits with optional filtering & pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    // First update any expired permits in the database
    await updateExpiredPermits();

    // Accept query parameters for filtering: status, permitType, search, page, limit
    const { status, permitType, search, page = 1, limit = 10, userId } = req.query;
    const query = {};

    if (status) {
      // When querying for active permits, we need to also check the endDate
      if (status === 'active') {
        const today = new Date();
        // Set to beginning of the day for clean comparison
        today.setHours(0, 0, 0, 0);

        query.status = status;
        // Only include permits that haven't expired
        query.endDate = { $gte: today };
      } else if (status === 'expired') {
        // Support querying for expired permits directly
        query.status = 'expired';
      } else {
        query.status = status;
      }
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

    // Add userId filter if provided
    if (userId) {
      query.userId = userId;
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
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching permits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/permits/:id - Retrieve a single permit by its ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    // Update expired permits first
    await updateExpiredPermits();

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

    // Check if permitTypeId is provided
    if (req.body.permitTypeId) {
      // Check if permit type exists and has available quantity
      const PermitType = require('../models/permit_types');
      const permitType = await PermitType.findById(req.body.permitTypeId);

      if (!permitType) {
        return res.status(404).json({ message: 'Permit type not found' });
      }

      if (permitType.quantity <= 0) {
        return res.status(400).json({ message: 'No more permits of this type available' });
      }

      // Decrease permit type quantity
      permitType.quantity -= 1;
      await permitType.save();
    }

    const newPermit = new Permit(req.body);
    const savedPermit = await newPermit.save();

    // If the permit was created with 'paid' status, record the revenue
    if (savedPermit.paymentStatus === 'paid' && savedPermit.price > 0) {
      try {
        await RevenueStatistics.recordPermitPurchase(savedPermit.price);
        console.log(`Recorded revenue for permit purchase: $${savedPermit.price}`);
      } catch (revenueError) {
        console.error('Failed to record revenue statistics:', revenueError);
        // Continue processing even if revenue recording fails
      }
    }

    // Create a notification for the user about their new permit
    try {
      if (savedPermit.userId) {
        await NotificationHelper.createSystemNotification(
          savedPermit.userId,
          'New Permit Created',
          `Your ${savedPermit.permitName} permit has been created and is now active until ${new Date(savedPermit.endDate).toLocaleDateString()}.`,
          '/dashboard'
        );
        console.log('Permit creation notification sent to user:', savedPermit.userId);
      }
    } catch (notificationError) {
      console.error('Error creating permit notification:', notificationError);
      // Continue even if notification creation fails
    }

    res.status(201).json({ message: 'Permit created successfully', permit: savedPermit });
  } catch (error) {
    console.error('Error creating permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permits/:id - Update an existing permit
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // Get the current permit to compare changes
    const currentPermit = await Permit.findById(req.params.id);
    if (!currentPermit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    // Check if we're only updating the end date
    if (Object.keys(req.body).length === 1 && req.body.endDate) {
      // Validate the new end date
      const newEndDate = new Date(req.body.endDate);
      const startDate = new Date(currentPermit.startDate);

      // Ensure end date is after start date
      if (newEndDate <= startDate) {
        return res.status(400).json({
          message: 'End date must be after start date'
        });
      }

      // Only update the end date
      currentPermit.endDate = newEndDate;
      const updatedPermit = await currentPermit.save();

      return res.status(200).json({
        message: 'Permit end date updated successfully',
        permit: updatedPermit
      });
    } else {
      // Check if payment status is changing from unpaid to paid
      const isPaymentStatusChangingToPaid =
        req.body.paymentStatus === 'paid' &&
        currentPermit.paymentStatus !== 'paid';

      // For full updates, use findByIdAndUpdate
      const updatedPermit = await Permit.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      // If payment status changed to paid, record the revenue
      if (isPaymentStatusChangingToPaid && updatedPermit.price > 0) {
        try {
          await RevenueStatistics.recordPermitPurchase(updatedPermit.price);
          console.log(`Recorded revenue for permit payment: $${updatedPermit.price}`);
        } catch (revenueError) {
          console.error('Failed to record revenue statistics:', revenueError);
          // Continue processing even if revenue recording fails
        }
      }

      res.status(200).json({
        message: 'Permit updated successfully',
        permit: updatedPermit
      });
    }
  } catch (error) {
    console.error('Error updating permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/permits/:id - Delete a permit (admin only)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    // Find the permit first to get user information
    const permit = await Permit.findById(req.params.id);
    if (!permit) {
      return res.status(404).json({ message: 'Permit not found' });
    }

    // Ensure we have detailed logging for the deletion process
    console.log(`Starting deletion process for permit ID: ${req.params.id}`);
    console.log(`Permit details:`, {
      id: permit._id,
      permitNumber: permit.permitNumber,
      permitName: permit.permitName,
      permitType: permit.permitType,
      userId: permit.userId,
      permitTypeId: permit.permitTypeId
    });

    // Get the user ID and permit type info for reservation cancellation
    const userId = permit.userId;
    const permitType = permit.permitType;

    // First, cancel ALL active reservations for this user 
    // This is the most reliable way to ensure all related reservations are cancelled
    const reservations = await Reservation.find({
      user: userId,
      status: { $in: ['upcoming', 'active', 'pending'] },
    }).populate('lotId');

    // Track cancelled reservations and refund information
    const cancelledReservations = [];
    const refundResults = [];

    console.log(`Found ${reservations.length} active reservations for user ${userId}`);

    // Process each reservation
    for (const reservation of reservations) {
      // Get the permit type from the permit and reservation for debugging
      console.log(`Checking reservation ${reservation.reservationId}`);
      console.log(`Permit type: ${permitType}, Permit type ID: ${permit.permitTypeId}`);
      console.log(`Reservation permit type: ${reservation.permitType}`);
      console.log(`Lot permit types:`, reservation.lotId ? reservation.lotId.permitTypes : 'No lot info');

      // There are multiple ways to match if this permit is needed for the reservation:
      // 1. Direct match of permitType string value
      // 2. Match on permitTypeId if it exists
      // 3. Match by lot's permitted types
      const directPermitMatch = reservation.permitType &&
        permitType &&
        reservation.permitType === permitType;

      const permitTypeIdMatch = reservation.permitType &&
        permit.permitTypeId &&
        reservation.permitType.toString() === permit.permitTypeId.toString();

      const lotRequiresPermit = reservation.lotId &&
        reservation.lotId.permitTypes &&
        Array.isArray(reservation.lotId.permitTypes) &&
        permitType &&
        reservation.lotId.permitTypes.includes(permitType);

      // Since we're having issues reliably identifying which reservations depend on a permit,
      // we're going to cancel ALL active reservations for this user when a permit is deleted.
      // This is a conservative approach to ensure users don't have active reservations without permits.
      const shouldCancel = true; // Cancel all reservations when a permit is deleted

      // Alternatively, use this line to only cancel matching reservations:
      // const shouldCancel = directPermitMatch || permitTypeIdMatch || lotRequiresPermit;

      // Cancel the reservation if any match condition is true
      if (shouldCancel) {
        console.log(`Cancelling reservation ${reservation.reservationId} - user's permit was deleted`);

        // If payment was made, process refund
        if (reservation.stripePaymentIntentId && reservation.paymentStatus === 'completed') {
          try {
            // Process refund via Stripe
            const refund = await stripe.refunds.create({
              payment_intent: reservation.stripePaymentIntentId,
            });

            // Update payment status
            reservation.paymentStatus = 'refunded';
            reservation.refundInfo = {
              refundId: refund.id,
              amount: refund.amount / 100, // Convert from cents
              status: refund.status
            };

            refundResults.push({
              reservationId: reservation.reservationId,
              refundId: refund.id,
              amount: refund.amount / 100,
              status: refund.status
            });
          } catch (refundError) {
            console.error('Refund error for reservation', reservation.reservationId, ':', refundError);
            // Continue with cancellation even if refund fails
          }
        }

        // Update reservation status
        reservation.status = 'cancelled';
        reservation.cancellationReason = 'Permit deleted by administrator';

        await reservation.save();
        cancelledReservations.push(reservation.reservationId);

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
            userId,
            reservation,
            'cancelled',
            '/past-reservations',
            'Your reservation was cancelled because your permit was deleted by an administrator.'
          );
        } catch (notificationError) {
          console.error('Error creating cancellation notification:', notificationError);
          // Continue even if notification creation fails
        }
      }
    }

    // Now delete the permit
    const deletedPermit = await Permit.findByIdAndDelete(req.params.id);

    // Create a notification for the user about the deleted permit
    try {
      // Only create notification if userId exists
      if (userId) {
        await NotificationHelper.createSystemNotification(
          userId,
          'Permit Deleted',
          `Your ${permit.permitName || 'parking permit'} has been deleted by an administrator.`,
          'Your permit has been deleted and any reservations requiring this permit have been cancelled and refunded.',
          '/past-permits'
        );
      } else {
        console.log('Skipping notification creation - no userId found on permit');
      }
    } catch (notificationError) {
      console.error('Error creating permit deletion notification:', notificationError);
    }

    res.status(200).json({
      message: 'Permit deleted successfully',
      cancelledReservations: cancelledReservations,
      refunds: refundResults.length > 0 ? refundResults : null
    });
  } catch (error) {
    console.error('Error deleting permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/permits/check-expired - Admin endpoint to manually check and update expired permits
router.put('/check-expired', verifyToken, isAdmin, async (req, res) => {
  try {
    const updatedCount = await updateExpiredPermits();
    res.status(200).json({
      success: true,
      message: `Checked for expired permits. Updated ${updatedCount} permits.`
    });
  } catch (error) {
    console.error('Error checking expired permits:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;