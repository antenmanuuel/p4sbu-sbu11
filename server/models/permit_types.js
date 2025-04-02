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

// Static method to check if a permit type is valid (not expired)
PermitTypeSchema.statics.isValidPermitType = function (permitType) {
  if (!permitType) return false;

  // Check expiration - compare only the date part, ignoring time
  // This makes permit types valid until the end of their expiration day
  const endDate = new Date(permitType.endDate);
  const today = new Date();

  // Reset time to compare only the date parts
  endDate.setHours(23, 59, 59, 999); // End of permit type's expiration day
  today.setHours(0, 0, 0, 0); // Start of today

  return endDate >= today;
};

module.exports = mongoose.model('PermitType', PermitTypeSchema);
