const mongoose = require('mongoose');

const PermitSchema = new mongoose.Schema(
  {
    permitNumber: {
      type: String,
      required: true,
      unique: true
    },
    permitName: {
      type: String,
      required: true
    },
    permitType: {
      type: String,
      required: true,
      enum: ['Student', 'Faculty', 'Staff', 'Visitor']
    },
    // Reference to the user (if available), stored as ObjectId to relate to our User model
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    // duplicate user info (for display in the permit) as seen in the mock data
    userFullName: {
      type: String
    },
    userEmail: {
      type: String
    },
    // Array of parking lot information for this permit
    lots: [
      {
        lotId: {
          type: String,
          required: true
        },
        lotName: {
          type: String,
          required: true
        }
      }
    ],
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    // Permit status (active, inactive, pending)
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive', 'pending']
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    // Payment status as seen in ManagePermits.jsx (paid or refunded)
    paymentStatus: {
      type: String,
      enum: ['paid', 'refunded'],
      default: 'paid'
    },
    // Payment ID (could be a reference to an external payment system)
    paymentId: {
      type: String
    },
    // Reference to the permit type model
    permitTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PermitType',
      required: false
    }
  },
  { timestamps: true }
);

// Static method to check if a permit is valid (active, paid, and not expired)
PermitSchema.statics.isValidPermit = function (permit) {
  if (!permit) return false;

  // Check active status
  const isActive = permit.status === 'active';

  // Check payment status
  const isPaid = permit.paymentStatus === 'paid' || permit.paymentStatus === 'completed';

  // Check expiration - compare only the date part, ignoring time
  // This makes permits valid until the end of their expiration day
  const permitEndDate = new Date(permit.endDate);
  const today = new Date();

  // Reset time to compare only the date parts
  permitEndDate.setHours(23, 59, 59, 999); // End of permit's expiration day
  today.setHours(0, 0, 0, 0); // Start of today

  const isNotExpired = permitEndDate >= today;

  return isActive && isPaid && isNotExpired;
};

module.exports = mongoose.model('Permit', PermitSchema);