const mongoose = require('mongoose');

const LotSchema = new mongoose.Schema({
    lotId: {
        type: String,
        unique: true,
        sparse: true  // This allows null values but ensures uniqueness for non-null values
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    location: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    totalSpaces: {
        type: Number,
        required: true,
        min: 1
    },
    availableSpaces: {
        type: Number,
        required: true,
        min: 0
    },
    permitTypes: {
        type: [String],
        required: true,
        default: []
    },
    hourlyRate: {
        type: Number,
        default: 0,
        min: 0
    },
    semesterRate: {
        type: Number,
        default: 0,
        min: 0
    },
    rateType: {
        type: String,
        enum: ['Hourly', 'Permit-based'],
        default: 'Permit-based'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Maintenance'],
        default: 'Active'
    },
    features: {
        isEV: {
            type: Boolean,
            default: false
        },
        isMetered: {
            type: Boolean,
            default: false
        },
        isAccessible: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

// Virtual for formatted creation date
LotSchema.virtual('createdAtFormatted').get(function () {
    return this.createdAt ? this.createdAt.toLocaleDateString() : '';
});

// Virtual for lot URL (for API references)
LotSchema.virtual('url').get(function () {
    return `/api/lots/${this._id}`;
});

// Set virtuals to be included in JSON responses
LotSchema.set('toJSON', { virtuals: true });
LotSchema.set('toObject', { virtuals: true });

const Lot = mongoose.model('Lot', LotSchema);

module.exports = Lot;