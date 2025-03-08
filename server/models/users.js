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
    netIDusername:{
        type: String,
        required: true
    },
    netIDpassword: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    userType:{
        type: String,
        enum: ['student', 'faculty', 'admin'],
        required: true
    },
    isApproved:{
        type: Boolean,
        default: false
    },
    car:{
        type:Schema.ObjectID,
        required: function (){
            return userType!=='admin';
        }
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