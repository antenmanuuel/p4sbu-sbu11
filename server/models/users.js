const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    sbuId: {
        type: String,
        required: function () {
            return this.userType !== 'visitor'; // Only required for non-visitors
        },
        unique: true,
        sparse: true, // Allows multiple null values (for visitors)
        validate: {
            validator: function (v) {
                // Skip validation if it's a visitor with a special ID format
                if (this.userType === 'visitor' && v && v.startsWith('V')) {
                    return /^V\d{10}$/.test(v); // Validates V + 10 digits for visitors
                }

                // For non-visitors, require 8 digits
                return /^\d{8}$/.test(v);
            },
            message: props => {
                if (props.value && props.value.startsWith('V')) {
                    return `${props.value} is not a valid visitor ID. Must start with 'V' followed by 10 digits.`;
                }
                return `${props.value} is not a valid SBU ID. Must be exactly 8 digits.`;
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    userType: {
        type: String,
        enum: ['student', 'faculty', 'admin', 'visitor'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'inactive'],
        default: 'pending'
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        required: false,
        default: ''
    },
    address: {
        type: String,
        required: false,
        default: ''
    },
    emergencyContact: {
        type: String,
        required: false,
        default: ''
    },
    car: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    },
    studentId: {
        type: String,
        unique: true,
        sparse: true
    },
    department: {
        type: String,
    },
    // Stripe-related fields
    stripeCustomerId: {
        type: String
    },
    defaultPaymentMethodId: {
        type: String
    }
});

UserSchema.virtual('url').get(function () {
    return `/users/${this._id}`;
});

UserSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

//hash password before saving user
UserSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

const UserModel = mongoose.model('User', UserSchema);

module.exports = UserModel;