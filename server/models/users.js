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
        required: true,
        unique: true,
        validate: {
            validator: function (v) {
                return /^\d{8}$/.test(v);  // Validates exactly 8 digits
            },
            message: props => `${props.value} is not a valid SBU ID. Must be exactly 8 digits.`
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    userType: {
        type: String,
        enum: ['student', 'faculty', 'admin'],
        required: true
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
    }
});

UserSchema.virtual('url').get(function () {
    return `/users/${this._id}`;
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