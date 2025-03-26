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
    // Payment status as seen in ManagePermits.jsx (paid, unpaid, refunded)
    paymentStatus: {
      type: String,
      required: true,
      enum: ['paid', 'unpaid', 'refunded']
    },
    // Payment ID (could be a reference to an external payment system)
    paymentId: {
      type: String
    },
    // optional. might want to link to a Permit Type document if we build that later
    permitTypeId: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Permit', PermitSchema);