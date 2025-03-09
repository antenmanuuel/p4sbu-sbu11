const mongoose = require('mongoose');

const PermitSchema = new mongoose.Schema({
    user: {
        type: Schema._id,
        required: true
    },
    permitType: {
        type: String,
        enum: ['student', 'faculty'],
        required: true
    },
    active:{
        type: Boolean,
        required:true,
        default:false
    },
    paid:{
        type: Boolean,
        required:true,
        default:false
    },
    dateCreated:{
        type: Date,
        required: true,
        default: Date.now
    },
    assignedLot:{
        type: Schema._id,
        required: true
    }
});

PermitSchema.virtual('url').get(function () {
    return `/permit/${this._id}`;
});

const PermitModel = mongoose.model('Permit', PermitSchema);

module.exports = PermitModel;