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
    }
});

TicketSchema.virtual('url').get(function () {
    return `/car/${this._id}`;
});

//hash license number before saving car
UserSchema.pre('save', async function (next) {
    if (this.isModified('plateNumber')) {
        this.plateNumber = await bcrypt.hash(this.plateNumber, 10);
    }
    next();
});


const CarModel = mongoose.model('Car', CarSchema);

module.exports = CarModel;