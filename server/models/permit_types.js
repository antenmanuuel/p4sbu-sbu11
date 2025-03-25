const mongoose = require('mongoose');

const PermitTypeSchema = new mongoose.Schema({
  id: {
    type: String,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['Faculty', 'Student', 'Staff', 'Visitor'],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 100,
    min: 0,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0.00,
  },
  // Store an array of lot IDs (strings)
  lots: [{
    type: String,
    required: true,
  }],
  duration: {
    type: String,
    //required: true,
    default: 'Semester',
  }
}, { timestamps: true });


module.exports = mongoose.model('PermitType', PermitTypeSchema);
