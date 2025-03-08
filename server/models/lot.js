const mongoose = require('mongoose');

const LotSchema = new mongoose.Schema({
    location: {
        x: { type: Number, required: true },
        y: { type: Number, required: true },
        required: true
    },
    zone: {
        type: Schema._id,
        required: true
    },
    isReserved: {
        type: Boolean,
        required:true
    },
    reservedBy: {
        type: Schema._id,
        required: function () {
            return isReserved;
        }
    },
    reservationStart: {
        type: Date,
        required: function () {
            return isReserved;
        }
    },
    reservationEnd: {
        type: Date,
        required: function () {
            return isReserved;
        }
    },
    isMetered:{
        type: Boolean,
        required: true
    },
    isEV: {
        type: Boolean,
        required: true
    }
});

LotSchema.virtual('url').get(function () {
    return `/lot/${this._id}`;
});


const LotModel = mongoose.model('Lot', LotSchema);

module.exports = LotModel;