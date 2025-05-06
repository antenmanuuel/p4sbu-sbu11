const mongoose = require('mongoose');

const NotificationPreferencesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    enableEmail: {
        type: Boolean,
        default: true
    },
    enablePush: {
        type: Boolean,
        default: true
    },
    emailForReservation: {
        type: Boolean,
        default: true
    },
    emailForPermit: {
        type: Boolean,
        default: true
    },
    emailForFine: {
        type: Boolean,
        default: true
    },
    emailForSystem: {
        type: Boolean,
        default: true
    },
    pushForReservation: {
        type: Boolean,
        default: true
    },
    pushForPermit: {
        type: Boolean,
        default: true
    },
    pushForFine: {
        type: Boolean,
        default: true
    },
    pushForSystem: {
        type: Boolean,
        default: true
    },
    emailForUserActivity: {
        type: Boolean,
        default: true
    },
    emailForSystemAlerts: {
        type: Boolean,
        default: true
    },
    pushForUserActivity: {
        type: Boolean,
        default: true
    },
    pushForSystemAlerts: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update the updatedAt field
NotificationPreferencesSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('NotificationPreferences', NotificationPreferencesSchema); 