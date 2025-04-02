const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['fine', 'permit', 'reservation', 'system'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedDocumentId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false
    },
    relatedDocumentType: {
        type: String,
        enum: ['ticket', 'permit', 'reservation'],
        required: false
    },
    isRead: {
        type: Boolean,
        default: false
    },
    actionUrl: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('Notification', NotificationSchema); 