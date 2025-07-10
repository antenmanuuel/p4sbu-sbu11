const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date_posted: {
        type: Date,
        required: true
    },
    isPaid: {
        type: Boolean,
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    canPetition: {
        type: Boolean,
        required: true,
        default: true
    },
    // Payment related fields
    paidAt: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['credit-card', 'student-account'],
    },
    stripePaymentIntentId: {
        type: String
    }
}, { timestamps: true });

TicketSchema.virtual('url').get(function () {
    return `/tickets/${this._id}`;
});


const TicketModel = mongoose.model('Ticket', TicketSchema);

module.exports = TicketModel;