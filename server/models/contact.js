const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: false,
        trim: true,
        default: ''
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['new', 'in-progress', 'resolved'],
        default: 'new'
    },
    notes: {
        type: String,
        default: ''
    },
    followups: [{
        message: {
            type: String,
            required: true,
            trim: true
        },
        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        addedByName: String,
        createdAt: {
            type: Date,
            default: Date.now
        },
        isInternal: {
            type: Boolean,
            default: false
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
ContactSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Contact', ContactSchema); 