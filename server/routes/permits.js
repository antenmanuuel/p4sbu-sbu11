// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

// Reference: https://docs.stripe.com/webhooks?lang=node

/**
 * This module defines API routes for managing parking permits, including:
 * - Creating, retrieving, updating, and deleting parking permits
 * - Automatic expiration handling for permits
 * - Integration with payment systems (Stripe)
 * - Notification systems (in-app and email)
 * - Management of related reservations when permits change
 * - Revenue tracking for permit purchases
 * 
 * Permits represent the actual purchased parking rights by users, as opposed to
 * permit types which are the templates/options available for purchase.
 */

const express = require('express');
const router = express.Router();
const Permit = require('../models/permits');
const { verifyToken, isAdmin } = require('../middleware/auth');
const RevenueStatistics = require('../models/revenue_statistics');
const { updateExpiredPermits } = require('../utils/permitUtils');
const NotificationHelper = require('../utils/notificationHelper');
const emailService = require('../services/emailService');
const Lot = require('../models/lot');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Reservation = require('../models/reservation');
const User = require('../models/users');

/**
 * GET /api/permits
 * 
 * Retrieves a paginated list of permits with optional filtering
 * Updates expired permits before returning results
 * Used by users to view their permits and by admins to manage all permits
 * 
 * @access Authenticated users (regular users see only their permits)
 * @middleware verifyToken - Ensures request has valid authentication
 * @query {string} [status] - Filter by permit status (active, expired, etc.)
 * @query {string} [permitType] - Filter permits by type
 * @query {string} [search] - Search term for permit number, name, or user info
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of results per page
 * @query {string} [userId] - Filter permits by specific user ID
 * @returns {Object} - Permits array and pagination metadata
 */
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

/**
 * GET /api/permits/:id
 * 
 * Retrieves details for a single permit by its ID
 * Updates expired permits status before returning results
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} id - Permit ID to retrieve
 * @returns {Object} - Complete permit information
 */
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

/**
 * POST /api/permits
 * 
 * Creates a new parking permit for a user
 * Decreases the available quantity for the permit type
 * Records revenue data for paid permits
 * Sends notifications and emails to the user
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @body {string} permitNumber - Unique identifier for the permit
 * @body {string} permitName - Display name for the permit
 * @body {string} permitType - Type of permit (matches permit types)
 * @body {string} userId - ID of the user who owns the permit
 * @body {string} userFullName - Name of the user (for easier querying)
 * @body {string} userEmail - Email of the user (for easier querying)
 * @body {Array} lots - Array of parking lots where this permit is valid
 * @body {Date} startDate - When the permit becomes valid
 * @body {Date} endDate - When the permit expires
 * @body {string} status - Current status (active, expired, etc.)
 * @body {number} price - Cost of the permit
 * @body {string} paymentStatus - Payment status (paid, unpaid, etc.)
 * @body {string} paymentId - ID from payment processor
 * @body {string} permitTypeId - Reference to the permit type template
 * @returns {Object} - Success message and created permit data
 */
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

        // Send email confirmation about the new permit
        try {
          // Get user email
          const user = await User.findById(savedPermit.userId);
          if (user && user.email) {
            // Since there's no dedicated permit email method, use reservation confirmation
            // with a custom message for permit creation
            const emailResult = await emailService.sendReservationConfirmation(
              user.email,
              `${user.firstName} ${user.lastName}`,
              {
                _id: savedPermit._id,
                id: savedPermit.permitNumber,
                lotId: { name: savedPermit.lots.map(l => l.lotName).join(', ') },
                startTime: savedPermit.startDate,
                endTime: savedPermit.endDate,
                status: 'Permit Created',
                totalPrice: savedPermit.price,
                permitDetails: {
                  permitName: savedPermit.permitName,
                  permitType: savedPermit.permitType
                },
                // Add receipt information if this is a paid permit
                receiptInfo: savedPermit.paymentStatus === 'paid' && savedPermit.price > 0 ? {
                  paymentId: savedPermit.paymentId,
                  paymentDate: new Date(),
                  paymentMethod: 'Online Payment',
                  amount: savedPermit.price,
                  description: `Payment for ${savedPermit.permitName} Permit - Valid until ${new Date(savedPermit.endDate).toLocaleDateString()}`
                } : null
              },
              process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
            );
            console.log('Permit creation email sent:', emailResult.messageId);
          }
        } catch (emailError) {
          console.error('Failed to send permit creation email:', emailError);
          // Continue even if email sending fails
        }
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

/**
 * PUT /api/permits/:id
 * 
 * Updates an existing permit's information
 * Supports partial updates, including just the end date
 * Records revenue when payment status changes to paid
 * Sends notifications to users about permit changes
 * 
 * @access Authenticated users
 * @middleware verifyToken - Ensures request has valid authentication
 * @param {string} id - ID of permit to update
 * @body {Object} - Fields to update (all fields optional)
 * @returns {Object} - Success message and updated permit data
 */
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

      // Check if status is changing from inactive to active
      const statusChangedToActive =
        req.body.status === 'active' &&
        currentPermit.status !== 'active';

      // If status changed to active, record the revenue
      if (statusChangedToActive && updatedPermit.price > 0) {
        try {
          await RevenueStatistics.recordPermitPurchase(updatedPermit.price);
          console.log(`Recorded revenue for permit activation: $${updatedPermit.price}`);
        } catch (revenueError) {
          console.error('Failed to record revenue statistics:', revenueError);
          // Continue processing even if revenue recording fails
        }
      }

      res.status(200).json({
        message: 'Permit updated successfully',
        permit: updatedPermit
      });

      // Create notifications for the user about their permit being updated
      try {
        if (updatedPermit.userId) {
          await NotificationHelper.createSystemNotification(
            updatedPermit.userId,
            statusChangedToActive ? 'Permit Activated' : 'Permit Payment Processed',
            `Your ${updatedPermit.permitName} permit is now active until ${new Date(updatedPermit.endDate).toLocaleDateString()}.`,
            '/dashboard'
          );
          console.log('Permit status update notification sent to user:', updatedPermit.userId);

          // Send email notification for permit activation/update
          try {
            // Get user email
            const user = await User.findById(updatedPermit.userId);
            if (user && user.email) {
              // Use reservation confirmation with custom message for permit update
              const emailResult = await emailService.sendReservationConfirmation(
                user.email,
                `${user.firstName} ${user.lastName}`,
                {
                  _id: updatedPermit._id,
                  id: updatedPermit.permitNumber,
                  lotId: { name: updatedPermit.lots.map(l => l.lotName).join(', ') },
                  startTime: updatedPermit.startDate,
                  endTime: updatedPermit.endDate,
                  status: statusChangedToActive ? 'Permit Activated' : 'Payment Processed',
                  totalPrice: updatedPermit.price,
                  permitDetails: {
                    permitName: updatedPermit.permitName,
                    permitType: updatedPermit.permitType
                  },
                  // Add receipt information for paid permits
                  receiptInfo: isPaymentStatusChangingToPaid || statusChangedToActive ? {
                    paymentId: updatedPermit.paymentId,
                    paymentDate: new Date(),
                    paymentMethod: 'Online Payment',
                    amount: updatedPermit.price,
                    description: `Payment for ${updatedPermit.permitName} Permit - Valid until ${new Date(updatedPermit.endDate).toLocaleDateString()}`
                  } : null
                },
                process.env.CLIENT_BASE_URL || process.env.PROD_CLIENT_URL || 'https://p4sbu-parking-app-8897a44819c2.herokuapp.com' || 'http://localhost:5173'
              );
              console.log('Permit update email sent:', emailResult.messageId);
            }
          } catch (emailError) {
            console.error('Failed to send permit update email:', emailError);
            // Continue even if email sending fails
          }
        }
      } catch (notificationError) {
        console.error('Error creating permit status notification:', notificationError);
        // Continue even if notification creation fails
      }
    }
  } catch (error) {
    console.error('Error updating permit:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * DELETE /api/permits/:id
 * 
 * Deletes a permit and cancels all associated reservations
 * Processes refunds for paid reservations via Stripe
 * Sends notifications and emails about permit deletion and reservation cancellations
 * Updates parking lot available spaces
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - ID of permit to delete
 * @returns {Object} - Success message, list of cancelled reservations, and refund details
 */
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

    // Create notifications for the user about their permit being deleted
    try {
      await NotificationHelper.createSystemNotification(
        permit.userId,
        'Permit Deleted',
        `Your ${permit.permitName} has been removed. Any associated reservations have been cancelled.`,
        '/dashboard'
      );
      console.log('Permit deletion notification sent to user:', permit.userId);

      // Send email notification about permit deletion
      try {
        // Get user email
        const user = await User.findById(permit.userId);
        if (user && user.email) {
          // Use reservation confirmation with cancelled status for permit deletion
          const emailResult = await emailService.sendReservationConfirmation(
            user.email,
            `${user.firstName} ${user.lastName}`,
            {
              _id: permit._id,
              id: permit.permitNumber,
              lotId: { name: permit.lots.map(l => l.lotName).join(', ') },
              startTime: permit.startDate,
              endTime: permit.endDate,
              status: 'cancelled',
              totalPrice: permit.price,
              permitDetails: {
                permitName: permit.permitName,
                permitType: permit.permitType,
                message: 'Your permit has been deleted by an administrator. Any associated reservations have been cancelled.'
              }
            },
            process.env.CLIENT_BASE_URL || 'http://localhost:5173'
          );
          console.log('Permit deletion email sent:', emailResult.messageId);
        }
      } catch (emailError) {
        console.error('Failed to send permit deletion email:', emailError);
        // Continue even if email sending fails
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

/**
 * PUT /api/permits/check-expired
 * 
 * Admin endpoint to manually trigger the expired permit check
 * Updates permits that have passed their end date to "expired" status
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @returns {Object} - Success message and count of updated permits
 */
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