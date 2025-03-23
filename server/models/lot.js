const mongoose = require('mongoose');

const LotSchema = new mongoose.Schema({
    lotId: {
        type: String,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    latitude: {
        type: Number,
        required: false,
        default: null
    },
    longitude: {
        type: Number,
        required: false,
        default: null
    },
    availableSpaces: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    totalSpaces: {
        type: Number,
        required: false,
        default: 0,
        min: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LotModel = mongoose.model('Lot', LotSchema);

module.exports = LotModel;