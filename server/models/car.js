const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const CarSchema = new mongoose.Schema({
    plateNumber: {
        type: String,
        required: true,
    },
    stateProv: {
        type: String,
        required: true
    },
    make: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    bodyType: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Allow null for legacy cars
    },
    year: {
        type: String,
        required: false
    }
}, { timestamps: true }); // Add timestamps to track when cars are created/updated

CarSchema.virtual('url').get(function () {
    return `/car/${this._id}`;
});

// Remove the hashing pre-save hook
// License plates don't need to be hashed as they're not sensitive data
// and we need to display them in the UI

const CarModel = mongoose.model('Car', CarSchema);

module.exports = CarModel;