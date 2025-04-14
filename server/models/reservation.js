const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
    reservationId: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lotId: {
        type: Schema.Types.ObjectId,
        ref: 'Lot',
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
    permitType: {
        type: String,
        required: false
    },
    vehicleInfo: {
        type: Schema.Types.ObjectId,
        ref: 'Car',
        required: true
    },
    // Direct Stripe payment information
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending'
    },
    stripePaymentIntentId: {
        type: String,
        required: false
    },
    stripePaymentMethodId: {
        type: String,
        required: false
    },
    stripeReceiptUrl: {
        type: String,
        required: false
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'completed', 'cancelled'],
        default: 'pending'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    notes: String,
    cancellationReason: String,
    // Add refund information fields to the schema
    refundInfo: {
        refundId: { type: String },
        amount: { type: Number },
        status: { type: String },
        refundedAt: { type: Date }
    },

    cancelledAt: { type: Date },
    cancelReason: { type: String },
}, {
    timestamps: true
});

// Generate a unique reservation ID before saving if not already set
ReservationSchema.pre('save', async function (next) {
    // Skip if not a new document or if reservationId is already set
    if (!this.isNew || this.reservationId) {
        return next();
    }

    try {
        // Generate a reservation ID in format: RES-YYYYMMDD-XXXX
        const date = new Date();
        const dateStr = date.getFullYear().toString() +
            (date.getMonth() + 1).toString().padStart(2, '0') +
            date.getDate().toString().padStart(2, '0');

        // Generate a random 4-digit suffix
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);

        // Combine to form the reservation ID
        this.reservationId = `RES-${dateStr}-${randomSuffix}`;

        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema); 