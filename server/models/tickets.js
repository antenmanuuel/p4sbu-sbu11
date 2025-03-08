const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
    amount:{
        type: Number,
        required: true
    },
    date_posted:{
        type: Date,
        required: true
    },
    isPaid:{
        type:Boolean,
        required: true
    },
    user:{
        type:Schema._id,
        required:true
    },
    canPetition:{
        type: Boolean,
        required:true,
        default:true
    }
});

TicketSchema.virtual('url').get(function () {
    return `/tickets/${this._id}`;
});


const TicketModel = mongoose.model('Ticket', TicketSchema);

module.exports = TicketModel;