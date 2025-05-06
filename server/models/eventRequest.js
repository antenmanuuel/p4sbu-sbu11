const mongoose = require('mongoose');

/**
 * Special Event Parking Request Schema
 * For faculty to request parking services for campus events
 */
const EventRequestSchema = new mongoose.Schema({
    // Basic event information
    eventName: {
        type: String,
        required: true,
        trim: true
    },
    eventDescription: {
        type: String,
        required: true
    },
    eventDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },

    // Parking needs
    expectedAttendees: {
        type: Number,
        required: true,
        min: 1
    },
    parkingLotPreference: {
        type: String,
        ref: 'Lot',
        required: false
    },
    specialRequirements: {
        type: String,
        required: false
    },

    // Contact information
    organizerName: {
        type: String,
        required: true
    },
    organizerEmail: {
        type: String,
        required: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    organizerPhone: {
        type: String,
        required: true
    },
    departmentName: {
        type: String,
        required: true
    },

    // Request metadata
    requestId: {
        type: String,
        unique: true
    },
    requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'denied', 'cancelled'],
        default: 'pending'
    },
    adminNotes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvalDate: {
        type: Date
    }
});

// Generate a unique event request ID before saving
EventRequestSchema.pre('save', function (next) {
    if (!this.requestId) {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        this.requestId = `EPR-${dateStr}-${randomStr}`;
    }
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('EventRequest', EventRequestSchema); 