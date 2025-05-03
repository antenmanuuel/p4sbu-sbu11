/**
 * This module defines API routes for contact form submissions management, including:
 * - Public submission of contact forms by users
 * - Admin retrieval of submissions with filtering and pagination
 * - Status updates and admin responses to submissions
 * - Email notifications for status changes and follow-ups
 * 
 * The module handles both public access for submissions and restricted
 * admin-only routes for managing the contact form workflow.
 */

const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const Contact = require('../models/contact');
const { verifyToken, isAdmin } = require('../middleware/auth');
const mongoose = require('mongoose');
const User = require('../models/users');

/**
 * POST /api/contact
 * 
 * Submits a new contact form from a user
 * Creates a database record and sends notification emails to admin and confirmation to user
 * This is a public endpoint - no authentication required
 * 
 * @access Public
 * @body {string} firstName - User's first name
 * @body {string} lastName - User's last name
 * @body {string} email - User's email address for response
 * @body {string} [phone] - Optional phone number
 * @body {string} subject - Subject/topic of inquiry
 * @body {string} message - Detailed message from user
 * @returns {Object} - Success status and contact submission ID
 */
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subject, message } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        // Validate email format
        const emailRegex = /\S+@\S+\.\S+/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Create contact data object
        const contactData = {
            firstName,
            lastName,
            email,
            phone,
            subject,
            message
        };

        // Save to database
        const newContact = new Contact(contactData);
        await newContact.save();

        // Send contact form notification email
        const result = await emailService.sendContactFormNotification(contactData);

        if (result.success) {
            return res.json({
                success: true,
                message: 'Contact form submitted successfully',
                data: {
                    contactId: newContact._id,
                    adminMessageId: result.adminMessageId,
                    userMessageId: result.userMessageId
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to send contact form',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Contact form submission error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * GET /api/contact
 * 
 * Retrieves a paginated and filtered list of all contact form submissions
 * Supports complex searching by name, email, subject, or message content
 * Includes robust name search handling both first+last and last+first patterns
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @query {string} [status] - Filter by submission status ('new', 'in-progress', 'resolved')
 * @query {string} [search] - Search term for filtering submissions
 * @query {number} [page=1] - Page number for pagination
 * @query {number} [limit=10] - Number of results per page
 * @returns {Object} - Submissions array and pagination metadata
 */
router.get('/', verifyToken, isAdmin, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};

        // Filter by status if provided
        if (req.query.status && ['new', 'in-progress', 'resolved'].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        // Add search functionality
        if (req.query.search) {
            const searchQuery = req.query.search.trim();
            // Split search terms to search across names more effectively
            const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 0);

            if (searchTerms.length > 1) {
                // For multiple terms, try to match them against first and last names
                filter.$or = [
                    // Match exact full name search (first + last)
                    {
                        $and: [
                            { firstName: { $regex: searchTerms[0], $options: 'i' } },
                            { lastName: { $regex: searchTerms[1], $options: 'i' } }
                        ]
                    },
                    // Match reverse order (last + first)
                    {
                        $and: [
                            { firstName: { $regex: searchTerms[1], $options: 'i' } },
                            { lastName: { $regex: searchTerms[0], $options: 'i' } }
                        ]
                    },
                    // Match any term in any field
                    ...searchTerms.map(term => ({
                        $or: [
                            { firstName: { $regex: term, $options: 'i' } },
                            { lastName: { $regex: term, $options: 'i' } },
                            { email: { $regex: term, $options: 'i' } },
                            { subject: { $regex: term, $options: 'i' } },
                            { message: { $regex: term, $options: 'i' } }
                        ]
                    }))
                ];
            } else {
                // For single term, search across all fields
                filter.$or = [
                    { firstName: { $regex: searchQuery, $options: 'i' } },
                    { lastName: { $regex: searchQuery, $options: 'i' } },
                    { email: { $regex: searchQuery, $options: 'i' } },
                    { subject: { $regex: searchQuery, $options: 'i' } },
                    { message: { $regex: searchQuery, $options: 'i' } }
                ];
            }

            // Log the search query and filter for debugging
            console.log('Search query:', searchQuery);
            console.log('Search filter:', JSON.stringify(filter, null, 2));
        }

        // Get submissions with pagination
        const submissions = await Contact.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Get total count for pagination
        const total = await Contact.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                data: submissions,
                pagination: {
                    total,
                    page,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching contact submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /api/contact/count
 * 
 * Retrieves count statistics of contact submissions by status
 * Used for dashboard metrics and monitoring workload
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @returns {Object} - Counts for total, new, in-progress, and resolved submissions
 */
router.get('/count', verifyToken, isAdmin, async (req, res) => {
    try {
        // Count by status
        const total = await Contact.countDocuments();
        const newCount = await Contact.countDocuments({ status: 'new' });
        const inProgressCount = await Contact.countDocuments({ status: 'in-progress' });
        const resolvedCount = await Contact.countDocuments({ status: 'resolved' });

        res.status(200).json({
            success: true,
            counts: {
                total,
                new: newCount,
                inProgress: inProgressCount,
                resolved: resolvedCount
            }
        });
    } catch (error) {
        console.error('Error fetching contact counts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

/**
 * GET /api/contact/:id
 * 
 * Retrieves a single contact submission by ID
 * Includes all details and follow-up message history
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the submission to retrieve
 * @returns {Object} - Complete contact submission data
 */
router.get('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid submission ID'
            });
        }

        const submission = await Contact.findById(submissionId);

        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        res.status(200).json({
            success: true,
            data: submission
        });
    } catch (error) {
        console.error('Error fetching contact submission:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while fetching the contact submission'
        });
    }
});

/**
 * PUT /api/contact/:id
 * 
 * Updates the status and notes for a contact submission
 * Sends email notifications to users when status changes
 * Status transitions trigger different email templates
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the submission to update
 * @body {string} status - New status ('new', 'in-progress', 'resolved')
 * @body {string} [notes] - Admin notes about the submission
 * @returns {Object} - Updated contact submission data
 */
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;
        const { status, notes } = req.body;

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid submission ID'
            });
        }

        // Validate status
        if (status && !['new', 'in-progress', 'resolved'].includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Status must be one of: new, in-progress, resolved'
            });
        }

        // Find the current submission to check if status is changing
        const currentSubmission = await Contact.findById(submissionId);

        if (!currentSubmission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        const updatedSubmission = await Contact.findByIdAndUpdate(
            submissionId,
            { status, notes },
            { new: true, runValidators: true }
        );

        // Check if status has changed and send appropriate notifications
        if (status && status !== currentSubmission.status) {
            try {
                // Send status update notification
                const result = await emailService.sendContactStatusNotification({
                    firstName: updatedSubmission.firstName,
                    lastName: updatedSubmission.lastName,
                    email: updatedSubmission.email,
                    subject: updatedSubmission.subject,
                    status: status,
                    message: updatedSubmission.message,
                    notes: notes || ''
                });

                console.log(`Status notification email sent to ${updatedSubmission.email}: ${result.success ? 'Success' : 'Failed'}`);
            } catch (emailError) {
                // Log the error but don't fail the request
                console.error('Error sending status notification email:', emailError);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                data: updatedSubmission,
                message: 'Submission updated successfully'
            }
        });
    } catch (error) {
        console.error('Error updating contact submission:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while updating the contact submission'
        });
    }
});

/**
 * POST /api/contact/:id/followup
 * 
 * Adds a follow-up message to an existing contact submission
 * Supports both internal notes (admin-only) and external follow-ups (emailed to user)
 * Automatically updates status to 'in-progress' if previously 'new'
 * 
 * @access Admin only
 * @middleware verifyToken - Ensures request has valid authentication
 * @middleware isAdmin - Verifies the user has admin privileges
 * @param {string} id - MongoDB ID of the submission
 * @body {string} message - Follow-up message content
 * @body {boolean} [isInternal=false] - Whether this is an internal note (not sent to user)
 * @returns {Object} - Updated submission with new follow-up added
 */
router.post('/:id/followup', verifyToken, isAdmin, async (req, res) => {
    try {
        const submissionId = req.params.id;
        const { message, isInternal = false } = req.body;

        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid submission ID'
            });
        }

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Follow-up message is required'
            });
        }

        // Find the submission
        const submission = await Contact.findById(submissionId);
        if (!submission) {
            return res.status(404).json({
                success: false,
                error: 'Submission not found'
            });
        }

        // Get admin user info
        const admin = await User.findById(req.user.userId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                error: 'Admin user not found'
            });
        }

        // Create the follow-up
        const followup = {
            message,
            addedBy: req.user.userId,
            addedByName: `${admin.firstName} ${admin.lastName}`,
            createdAt: new Date(),
            isInternal
        };

        // Add follow-up to the submission
        submission.followups = submission.followups || [];
        submission.followups.push(followup);

        // If not marked as in-progress, update status
        if (submission.status === 'new') {
            submission.status = 'in-progress';
        }

        // Save the updated submission
        await submission.save();

        // If this is not an internal note, send notification email to the user
        if (!isInternal) {
            try {
                // Send follow-up notification to user
                await emailService.sendContactFollowupNotification({
                    firstName: submission.firstName,
                    lastName: submission.lastName,
                    email: submission.email,
                    subject: submission.subject,
                    followupMessage: message,
                    adminName: `${admin.firstName} ${admin.lastName}`
                });

                console.log(`Follow-up notification email sent to ${submission.email}`);
            } catch (emailError) {
                // Log the error but don't fail the request
                console.error('Error sending follow-up notification email:', emailError);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                submission,
                message: 'Follow-up added successfully'
            }
        });
    } catch (error) {
        console.error('Error adding follow-up:', error);
        res.status(500).json({
            success: false,
            error: 'An error occurred while adding the follow-up'
        });
    }
});

module.exports = router;
