/**
 * Special Event Parking Routes
 * 
 * Handles requests for special event parking services
 * - Faculty can submit requests
 * - Admin can review and manage requests
 */

const express = require('express');
const router = express.Router();
const EventRequest = require('../models/eventRequest');
const Lot = require('../models/lot');
const User = require('../models/users');
const { verifyToken, isAdmin } = require('../middleware/auth');
const NotificationHelper = require('../utils/notificationHelper');
const emailService = require('../services/emailService');
const mongoose = require('mongoose');

/**
 * Middleware to check if user is faculty
 * Used to restrict event parking requests to faculty only
 */
const isFaculty = (req, res, next) => {
    if (req.user.userType !== 'faculty') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Faculty privileges required.'
        });
    }
    next();
};

/**
 * @route POST /api/event-parking
 * @desc Submit a new special event parking request
 * @access Private - Faculty only
 */
router.post('/', verifyToken, isFaculty, async (req, res) => {
    try {
        const {
            eventName,
            eventDescription,
            eventDate,
            startTime,
            endTime,
            location,
            expectedAttendees,
            parkingLotPreference,
            specialRequirements,
            organizerName,
            organizerEmail,
            organizerPhone,
            departmentName
        } = req.body;

        // Validate required fields
        if (!eventName || !eventDate || !startTime || !endTime || !expectedAttendees) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required information'
            });
        }

        // If a parking lot is selected, check if it has enough capacity
        if (parkingLotPreference) {
            try {
                // First try to find by the string ID
                let lot = await Lot.findOne({ lotId: parkingLotPreference });

                // If not found, then try to find by MongoDB ObjectId
                if (!lot && mongoose.Types.ObjectId.isValid(parkingLotPreference)) {
                    lot = await Lot.findById(parkingLotPreference);
                }

                if (!lot) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected parking lot not found'
                    });
                }

                // Check if lot has enough spaces, but DO NOT deduct them yet
                // Only validate capacity is sufficient
                if (lot.availableSpaces < expectedAttendees) {
                    return res.status(400).json({
                        success: false,
                        message: `Not enough parking spaces available. The selected lot only has ${lot.availableSpaces} spaces.`
                    });
                }
            } catch (error) {
                console.error('Error finding parking lot:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing parking lot information'
                });
            }
        }

        // Create new event request
        const eventRequest = new EventRequest({
            eventName,
            eventDescription,
            eventDate,
            startTime,
            endTime,
            location,
            expectedAttendees,
            parkingLotPreference,
            specialRequirements,
            organizerName,
            organizerEmail,
            organizerPhone,
            departmentName,
            requestedBy: req.user.userId
        });

        await eventRequest.save();

        // Notify admins about the new request
        try {
            // Find admin users
            const admins = await User.find({ userType: 'admin' }).select('_id');

            // Create notifications for each admin
            for (const admin of admins) {
                await NotificationHelper.createSystemNotification(
                    admin._id,
                    'New Event Parking Request',
                    `A new special event parking request (${eventRequest.requestId}) has been submitted and requires review.`,
                    `/admin/event-parking/${eventRequest.requestId}`
                );
            }

            // Send confirmation email to faculty
            await emailService.sendGenericEmail(
                organizerEmail,
                'Special Event Parking Request Submitted',
                `<p>Dear ${organizerName},</p>
                <p>Your request for special event parking has been successfully submitted.</p>
                <p><strong>Event:</strong> ${eventName}<br>
                <strong>Date:</strong> ${new Date(eventDate).toLocaleDateString()}<br>
                <strong>Request ID:</strong> ${eventRequest.requestId}</p>
                <p>The Office of Mobility & Parking Services will review your request and contact you with further information.</p>
                <p>Thank you for using our services.</p>`
            );
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            // Continue execution even if notification fails
        }

        res.status(201).json({
            success: true,
            message: 'Event parking request submitted successfully',
            data: {
                requestId: eventRequest.requestId,
                status: eventRequest.status
            }
        });
    } catch (error) {
        console.error('Error submitting event parking request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit request',
            error: error.message
        });
    }
});

/**
 * @route GET /api/event-parking
 * @desc Get user's event parking requests (faculty) or all requests (admin)
 * @access Private
 */
router.get('/', verifyToken, async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        // Build query based on user type and filters
        let query = {};

        // Regular faculty can only see their own requests
        if (req.user.userType === 'faculty') {
            query.requestedBy = req.user.userId;
        }
        // Admins can see all requests and filter by status
        else if (req.user.userType === 'admin') {
            if (status && ['pending', 'approved', 'denied', 'cancelled'].includes(status)) {
                query.status = status;
            }
        }
        // Other user types cannot access this endpoint
        else {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get requests with pagination, but don't populate parkingLotPreference yet
        const requests = await EventRequest.find(query)
            .populate('requestedBy', 'firstName lastName email department')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        // Process the results to handle lot information manually
        const processedRequests = await Promise.all(requests.map(async (request) => {
            const requestObj = request.toObject();

            // If there's a parking lot preference, fetch the lot info
            if (request.parkingLotPreference) {
                try {
                    // Try different approaches to find the lot
                    let lot = null;

                    // Try by lotId first
                    lot = await Lot.findOne({ lotId: request.parkingLotPreference });

                    // If not found and it looks like a valid ObjectId, try by _id
                    if (!lot && mongoose.Types.ObjectId.isValid(request.parkingLotPreference)) {
                        lot = await Lot.findById(request.parkingLotPreference);
                    }

                    // If lot was found, add its info to the response
                    if (lot) {
                        requestObj.parkingLotPreference = {
                            _id: lot._id,
                            name: lot.name,
                            address: lot.address
                        };
                    }
                } catch (error) {
                    console.error('Error finding parking lot:', error);
                    // Just leave the lot ID as is if there was an error
                }
            }

            return requestObj;
        }));

        // Get total count for pagination
        const total = await EventRequest.countDocuments(query);

        res.status(200).json({
            success: true,
            data: {
                requests: processedRequests,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching event parking requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch requests',
            error: error.message
        });
    }
});

/**
 * @route GET /api/event-parking/my-requests
 * @desc Get faculty's own event parking requests
 * @access Private - Faculty only
 */
router.get('/my-requests', verifyToken, isFaculty, async (req, res) => {
    try {
        console.log('Faculty user requesting their event parking requests:', req.user.userId);

        // First get all the requests without populating
        const requests = await EventRequest.find({ requestedBy: req.user.userId })
            .sort({ createdAt: -1 });

        // Process the results to handle lot information manually
        const processedRequests = await Promise.all(requests.map(async (request) => {
            const requestObj = request.toObject();

            // If there's a parking lot preference, fetch the lot info
            if (request.parkingLotPreference) {
                try {
                    // Try different approaches to find the lot
                    let lot = null;

                    // Try by lotId first
                    lot = await Lot.findOne({ lotId: request.parkingLotPreference });

                    // If not found and it looks like a valid ObjectId, try by _id
                    if (!lot && mongoose.Types.ObjectId.isValid(request.parkingLotPreference)) {
                        lot = await Lot.findById(request.parkingLotPreference);
                    }

                    // If lot was found, add its info to the response
                    if (lot) {
                        requestObj.parkingLotPreference = {
                            _id: lot._id,
                            name: lot.name,
                            address: lot.address
                        };
                    }
                } catch (error) {
                    console.error('Error finding parking lot:', error);
                    // Just leave the lot ID as is if there was an error
                }
            }

            return requestObj;
        }));

        res.status(200).json({
            success: true,
            data: processedRequests
        });
    } catch (error) {
        console.error('Error fetching faculty event parking requests:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your event parking requests',
            error: error.message
        });
    }
});

/**
 * @route GET /api/event-parking/available-lots
 * @desc Get available parking lots for event parking
 * @access Private - Faculty only
 */
router.get('/available-lots', verifyToken, isFaculty, async (req, res) => {
    try {
        // Get lots that are available for event parking
        // You might want to filter this based on certain criteria
        const availableLots = await Lot.find({
            active: true,
            // Add any other filters as needed
        }).select('name location totalSpaces availableSpaces description');

        res.status(200).json({
            success: true,
            data: availableLots
        });
    } catch (error) {
        console.error('Error fetching available lots for event parking:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available parking lots',
            error: error.message
        });
    }
});

/**
 * @route GET /api/event-parking/:requestId
 * @desc Get a specific event parking request
 * @access Private - Faculty (own requests) or Admin (all requests)
 */
router.get('/:requestId', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.params;

        // Find the request without populating parkingLotPreference
        const request = await EventRequest.findOne({ requestId })
            .populate('requestedBy', 'firstName lastName email department')
            .populate('approvedBy', 'firstName lastName');

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Check authorization - faculty can only view their own requests
        if (req.user.userType === 'faculty' &&
            request.requestedBy._id.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Convert to a plain object for modification
        const requestObj = request.toObject();

        // If there's a parking lot preference, fetch the lot info
        if (request.parkingLotPreference) {
            try {
                // First try to find by lotId (string identifier)
                let lot = await Lot.findOne({ lotId: request.parkingLotPreference });

                // If not found and it's a valid ObjectId, try by _id as fallback
                if (!lot && mongoose.Types.ObjectId.isValid(request.parkingLotPreference)) {
                    lot = await Lot.findById(request.parkingLotPreference);
                }

                // If lot was found, add its info to the response
                if (lot) {
                    requestObj.parkingLotPreference = {
                        _id: lot._id,
                        lotId: lot.lotId,
                        name: lot.name,
                        address: lot.address,
                        totalSpaces: lot.totalSpaces,
                        availableSpaces: lot.availableSpaces
                    };
                }
            } catch (error) {
                console.error('Error finding parking lot:', error);
                // Just leave the lot ID as is if there was an error
            }
        }

        res.status(200).json({
            success: true,
            data: requestObj
        });
    } catch (error) {
        console.error('Error fetching event parking request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch request',
            error: error.message
        });
    }
});

/**
 * @route PUT /api/event-parking/:requestId/status
 * @desc Update the status of an event parking request
 * @access Private - Admin only
 */
router.put('/:requestId/status', verifyToken, isAdmin, async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, adminNotes } = req.body;

        if (!status || !['pending', 'approved', 'denied', 'cancelled'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status is required'
            });
        }

        const request = await EventRequest.findOne({ requestId });

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // Get the lot (needed for both approving and cancelling)
        let lot = null;
        if (request.parkingLotPreference) {
            try {
                // First try to find by lotId (which is a string identifier)
                lot = await Lot.findOne({ lotId: request.parkingLotPreference });

                // If not found and it's a valid ObjectId, try by _id as fallback
                if (!lot && mongoose.Types.ObjectId.isValid(request.parkingLotPreference)) {
                    lot = await Lot.findById(request.parkingLotPreference);
                }

                if (!lot) {
                    return res.status(400).json({
                        success: false,
                        message: 'Selected parking lot not found'
                    });
                }
            } catch (lotError) {
                console.error('Error finding parking lot:', lotError);
                return res.status(500).json({
                    success: false,
                    message: 'Error processing parking lot information'
                });
            }
        }

        // If changing status to approved and a parking lot is selected,
        // check and update the available spaces
        if (status === 'approved' && lot) {
            // Ensure lot has enough spaces
            if (lot.availableSpaces < request.expectedAttendees) {
                return res.status(400).json({
                    success: false,
                    message: `Not enough parking spaces available. This lot only has ${lot.availableSpaces} spaces.`
                });
            }

            // Deduct the number of spaces only on approval
            lot.availableSpaces -= request.expectedAttendees;
            await lot.save();
        }
        // If cancelling a previously approved request, restore the spaces
        else if (status === 'cancelled' && request.status === 'approved' && lot) {
            // Add the spaces back to the lot
            lot.availableSpaces += request.expectedAttendees;
            // Make sure we don't exceed total spaces
            lot.availableSpaces = Math.min(lot.availableSpaces, lot.totalSpaces);
            await lot.save();
        }

        // Update request status
        request.status = status;
        if (adminNotes) request.adminNotes = adminNotes;

        // Add approval details if approving
        if (status === 'approved') {
            request.approvedBy = req.user.userId;
            request.approvalDate = new Date();
        }

        await request.save();

        // Send notification to the faculty member
        try {
            const faculty = await User.findById(request.requestedBy);
            if (faculty) {
                // Create a notification for the faculty
                await NotificationHelper.createSystemNotification(
                    faculty._id,
                    `Event Parking Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    `Your special event parking request (${requestId}) has been ${status}.`,
                    `/faculty/event-parking/${requestId}`
                );

                // Send email notification
                await emailService.sendGenericEmail(
                    faculty.email,
                    `Special Event Parking Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                    `<p>Dear ${faculty.firstName} ${faculty.lastName},</p>
                    <p>Your special event parking request (${requestId}) has been ${status}.</p>
                    <p><strong>Event:</strong> ${request.eventName}<br>
                    <strong>Date:</strong> ${new Date(request.eventDate).toLocaleDateString()}</p>
                    ${adminNotes ? `<p><strong>Admin Notes:</strong> ${adminNotes}</p>` : ''}
                    <p>Please contact the Office of Mobility & Parking Services if you have any questions.</p>`
                );
            }
        } catch (notificationError) {
            console.error('Error sending notifications:', notificationError);
            // Continue execution even if notification fails
        }

        res.status(200).json({
            success: true,
            message: `Request ${status} successfully`,
            data: request
        });
    } catch (error) {
        console.error(`Error updating event parking request status:`, error);
        res.status(500).json({
            success: false,
            message: `Failed to update request status`,
            error: error.message
        });
    }
});

module.exports = router; 