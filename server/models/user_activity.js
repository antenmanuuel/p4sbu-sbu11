const mongoose = require('mongoose');

const UserActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activity_type: {
        type: String,
        enum: ['login', 'password_change', 'account_created', 'profile_update', 'login_failed', 'password_change_failed', 'password_changed', 'session_timeout'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    ip_address: String,
    user_agent: String,
    created_at: {
        type: Date,
        default: Date.now
    }
});

UserActivitySchema.virtual('url').get(function () {
    return `/user-activity/${this._id}`;
});

// Create a static method to log user activities
UserActivitySchema.statics.logActivity = async function (data) {
    try {
        const activity = new this(data);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging user activity:', error);
        throw error;
    }
};

const UserActivity = mongoose.model('UserActivity', UserActivitySchema);

module.exports = UserActivity; 