import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { UserService, AuthService, NotificationService } from '../utils/api';
import { FaEnvelope, FaBell, FaCheck, FaTimes, FaParking, FaExclamationTriangle, FaClock, FaInfoCircle, FaUserShield, FaUsers } from 'react-icons/fa';

const Settings = ({ darkMode, user }) => {
    const location = useLocation();

    // Get activeSection from location state if available
    const initialSection = location.state?.activeSection || 'contact';

    // State for form values
    const [formData, setFormData] = useState({
        email: '',
        phone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        address: '',
        emergencyContact: ''
    });

    // State for form sections
    const [activeSection, setActiveSection] = useState(initialSection);
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // Inactivity timeout settings
    const [inactivityTimeout, setInactivityTimeout] = useState(20); // Default 20 minutes

    // Notification preferences state
    const [notificationPreferences, setNotificationPreferences] = useState({
        enableEmail: true,
        enablePush: true,
        emailForReservation: true,
        emailForPermit: true,
        emailForFine: true,
        emailForSystem: true,
        pushForReservation: true,
        pushForPermit: true,
        pushForFine: true,
        pushForSystem: true,
        // Admin-specific notification preferences
        emailForUserActivity: true,
        emailForSystemAlerts: true,
        pushForUserActivity: true,
        pushForSystemAlerts: true
    });
    const [loadingPreferences, setLoadingPreferences] = useState(false);

    // Fetch user data on component mount
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const result = await UserService.getProfile();
                if (result.success) {
                    setFormData(prevData => ({
                        ...prevData,
                        email: result.data.user.email || '',
                        phone: result.data.user.phone || '',
                        address: result.data.user.address || '',
                        emergencyContact: result.data.user.emergencyContact || ''
                    }));
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        };

        fetchUserData();
    }, []);

    // Load notification preferences
    useEffect(() => {
        const fetchNotificationPreferences = async () => {
            try {
                setLoadingPreferences(true);
                const result = await NotificationService.getNotificationPreferences();
                if (result.success) {
                    setNotificationPreferences(result.preferences);
                }
            } catch (error) {
                console.error('Error fetching notification preferences:', error);
            } finally {
                setLoadingPreferences(false);
            }
        };

        if (activeSection === 'notifications') {
            fetchNotificationPreferences();
        }
    }, [activeSection]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));

        // Clear errors when user types
        if (errors[name]) {
            setErrors((prevErrors) => ({
                ...prevErrors,
                [name]: ''
            }));
        }
    };

    const validateContactInfo = () => {
        const newErrors = {};

        // Validate phone number format
        if (formData.phone && !/^\d{3}-\d{3}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number should be in format 123-456-7890';
        }

        // We don't need strict validation for address and emergency contact
        // But we could add length checks if desired
        if (formData.address && formData.address.length > 200) {
            newErrors.address = 'Address is too long (maximum 200 characters)';
        }

        if (formData.emergencyContact && formData.emergencyContact.length > 100) {
            newErrors.emergencyContact = 'Emergency contact is too long (maximum 100 characters)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validatePasswordChange = () => {
        const newErrors = {};

        if (!formData.currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!formData.newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (formData.newPassword.length < 8) {
            newErrors.newPassword = 'Password must be at least 8 characters';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdateContactInfo = async (e) => {
        e.preventDefault();

        if (validateContactInfo()) {
            setLoading(true);
            try {
                const result = await UserService.updateProfile({
                    phone: formData.phone,
                    address: formData.address,
                    emergencyContact: formData.emergencyContact
                });

                if (result.success) {
                    setSuccessMessage('Contact information updated successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setErrors({ form: result.error || 'Failed to update contact information' });
                }
            } catch (err) {
                console.error('Error updating contact info:', err);
                setErrors({ form: 'An unexpected error occurred' });
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (validatePasswordChange()) {
            setLoading(true);
            try {
                const result = await UserService.changePassword({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                });

                if (result.success) {
                    setFormData(prevData => ({
                        ...prevData,
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                    }));
                    setSuccessMessage('Password changed successfully!');
                    setTimeout(() => setSuccessMessage(''), 3000);
                } else {
                    setErrors({ form: result.error || 'Failed to change password' });
                }
            } catch (err) {
                console.error('Error changing password:', err);
                setErrors({ form: 'An unexpected error occurred' });
            } finally {
                setLoading(false);
            }
        }
    };

    // Handle inactivity timeout change
    const handleInactivityTimeoutChange = (value) => {
        // Save to localStorage for persistence
        localStorage.setItem('inactivityTimeout', value * 60 * 1000); // Convert minutes to ms
        setInactivityTimeout(value);

        // Show success message
        setSuccessMessage(`Inactivity timeout set to ${value} minutes`);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    // Load inactivity timeout from localStorage on component mount
    useEffect(() => {
        const savedTimeout = localStorage.getItem('inactivityTimeout');
        if (savedTimeout) {
            // Convert from ms to minutes
            setInactivityTimeout(parseInt(savedTimeout) / (60 * 1000));
        }
    }, []);

    // Handle toggle for notification preferences
    const handleTogglePreference = (preference) => {
        setNotificationPreferences(prev => ({
            ...prev,
            [preference]: !prev[preference]
        }));
    };

    // Handle save notification preferences
    const handleSaveNotificationPreferences = async () => {
        try {
            setLoading(true);
            const result = await NotificationService.updateNotificationPreferences(notificationPreferences);

            if (result.success) {
                setSuccessMessage('Notification preferences updated successfully!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrors({ form: result.error || 'Failed to update notification preferences' });
            }
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            setErrors({ form: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex-1 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

                {/* Settings Navigation */}
                <div className="flex flex-wrap gap-4 mb-6">
                    <button
                        onClick={() => setActiveSection('contact')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'contact'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        Contact Information
                    </button>
                    <button
                        onClick={() => setActiveSection('password')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'password'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => setActiveSection('security')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'security'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        Security Settings
                    </button>
                    <button
                        onClick={() => setActiveSection('notifications')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'notifications'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                            }`}
                    >
                        Notification Settings
                    </button>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className={`p-4 mb-6 rounded-md ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {errors.form && (
                    <div className={`p-4 mb-6 rounded-md ${darkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                        {errors.form}
                    </div>
                )}

                {/* Active Section Content */}
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="p-6">
                        {/* Contact Information Form */}
                        {activeSection === 'contact' && (
                            <form onSubmit={handleUpdateContactInfo}>
                                <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Update your contact information. This information will be used for notifications and account recovery.
                                </p>

                                <div className="space-y-6 max-w-lg">
                                    <div>
                                        <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={formData.email}
                                            readOnly
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            id="phone"
                                            placeholder="123-456-7890"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.phone ? 'border-red-500' : ''}`}
                                        />
                                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="address" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Address
                                        </label>
                                        <input
                                            type="text"
                                            name="address"
                                            id="address"
                                            placeholder="123 Main St, Stony Brook, NY 11790"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.address ? 'border-red-500' : ''}`}
                                        />
                                        {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="emergencyContact" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Emergency Contact
                                        </label>
                                        <input
                                            type="text"
                                            name="emergencyContact"
                                            id="emergencyContact"
                                            placeholder="John Doe: 123-456-7890"
                                            value={formData.emergencyContact}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.emergencyContact ? 'border-red-500' : ''}`}
                                        />
                                        {errors.emergencyContact && <p className="mt-1 text-sm text-red-500">{errors.emergencyContact}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Updating...' : 'Update Contact Information'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Password Change Form */}
                        {activeSection === 'password' && (
                            <form onSubmit={handleChangePassword}>
                                <h2 className="text-xl font-bold mb-4">Change Password</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Update your password to maintain account security. Choose a strong password that you don't use elsewhere.
                                </p>

                                <div className="space-y-6 max-w-lg">
                                    <div>
                                        <label htmlFor="currentPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            name="currentPassword"
                                            id="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.currentPassword ? 'border-red-500' : ''}`}
                                        />
                                        {errors.currentPassword && <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="newPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            id="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.newPassword ? 'border-red-500' : ''}`}
                                        />
                                        {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="confirmPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            id="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                        />
                                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                        >
                                            {loading ? 'Updating...' : 'Change Password'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Security Settings Form */}
                        {activeSection === 'security' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Security Settings</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Configure security settings for your account.
                                </p>

                                <div className="space-y-6 max-w-lg">
                                    <div>
                                        <label htmlFor="inactivityTimeout" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Session Timeout (in minutes)
                                        </label>
                                        <p className={`text-sm mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Your account will be automatically logged out after this period of inactivity.
                                        </p>
                                        <select
                                            id="inactivityTimeout"
                                            value={inactivityTimeout}
                                            onChange={(e) => handleInactivityTimeoutChange(parseInt(e.target.value))}
                                            className={`block w-full rounded-md border px-3 py-2 shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300 text-gray-900'}`}
                                        >
                                            <option value="5">5 minutes</option>
                                            <option value="10">10 minutes</option>
                                            <option value="15">15 minutes</option>
                                            <option value="20">20 minutes (recommended)</option>
                                            <option value="30">30 minutes</option>
                                            <option value="45">45 minutes</option>
                                            <option value="60">60 minutes</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notification Settings */}
                        {activeSection === 'notifications' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {user?.userType === 'admin'
                                        ? 'Manage how you receive administrative notifications from P4SBU.'
                                        : 'Manage how you receive notifications from P4SBU.'}
                                </p>

                                {loadingPreferences ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Global Settings */}
                                        <div className="space-y-4">
                                            <h3 className={`font-medium text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                Global Settings
                                            </h3>

                                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center">
                                                        <FaEnvelope className={`text-lg mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>Email Notifications</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTogglePreference('enableEmail')}
                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.enableEmail
                                                            ? 'bg-green-500 text-white'
                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                    >
                                                        {notificationPreferences.enableEmail ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                        {notificationPreferences.enableEmail ? 'Enabled' : 'Disabled'}
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center">
                                                        <FaBell className={`text-lg mr-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>Push Notifications</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleTogglePreference('enablePush')}
                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.enablePush
                                                            ? 'bg-green-500 text-white'
                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                            }`}
                                                    >
                                                        {notificationPreferences.enablePush ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                        {notificationPreferences.enablePush ? 'Enabled' : 'Disabled'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Admin-specific notification settings */}
                                        {user?.userType === 'admin' && (
                                            <>
                                                {/* Admin Email Notification Settings */}
                                                {notificationPreferences.enableEmail && (
                                                    <div className="space-y-4">
                                                        <h3 className={`font-medium text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                            Administrative Email Notifications
                                                        </h3>

                                                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaUsers className="text-blue-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>User Activity</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('emailForUserActivity')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForUserActivity
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.emailForUserActivity ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.emailForUserActivity ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaUserShield className="text-red-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Alerts</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('emailForSystemAlerts')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForSystemAlerts
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.emailForSystemAlerts ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.emailForSystemAlerts ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaInfoCircle className="text-gray-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Notifications</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('emailForSystem')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForSystem
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.emailForSystem ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.emailForSystem ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Admin Push Notification Settings */}
                                                {notificationPreferences.enablePush && (
                                                    <div className="space-y-4">
                                                        <h3 className={`font-medium text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                            Administrative Push Notifications
                                                        </h3>

                                                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                            <div className="space-y-3">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaUsers className="text-blue-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>User Activity</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('pushForUserActivity')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForUserActivity
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.pushForUserActivity ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.pushForUserActivity ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaUserShield className="text-red-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Alerts</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('pushForSystemAlerts')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForSystemAlerts
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.pushForSystemAlerts ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.pushForSystemAlerts ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>

                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center">
                                                                        <FaInfoCircle className="text-gray-500 mr-2" />
                                                                        <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Notifications</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleTogglePreference('pushForSystem')}
                                                                        className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForSystem
                                                                            ? 'bg-green-500 text-white'
                                                                            : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                            }`}
                                                                    >
                                                                        {notificationPreferences.pushForSystem ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                        {notificationPreferences.pushForSystem ? 'On' : 'Off'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Regular User Email Notification Type Settings */}
                                        {user?.userType !== 'admin' && notificationPreferences.enableEmail && (
                                            <div className="space-y-4">
                                                <h3 className={`font-medium text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                    Email Notification Types
                                                </h3>

                                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaParking className="text-yellow-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Permit Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('emailForPermit')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForPermit
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.emailForPermit ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.emailForPermit ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaExclamationTriangle className="text-red-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Fine Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('emailForFine')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForFine
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.emailForFine ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.emailForFine ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaClock className="text-blue-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Reservation Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('emailForReservation')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForReservation
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.emailForReservation ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.emailForReservation ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaInfoCircle className="text-gray-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('emailForSystem')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.emailForSystem
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.emailForSystem ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.emailForSystem ? 'On' : 'Off'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Regular User Push Notification Type Settings */}
                                        {user?.userType !== 'admin' && notificationPreferences.enablePush && (
                                            <div className="space-y-4">
                                                <h3 className={`font-medium text-lg ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                    Push Notification Types
                                                </h3>

                                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaParking className="text-yellow-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Permit Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('pushForPermit')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForPermit
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.pushForPermit ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.pushForPermit ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaExclamationTriangle className="text-red-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Fine Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('pushForFine')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForFine
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.pushForFine ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.pushForFine ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaClock className="text-blue-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>Reservation Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('pushForReservation')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForReservation
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.pushForReservation ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.pushForReservation ? 'On' : 'Off'}
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center">
                                                                <FaInfoCircle className="text-gray-500 mr-2" />
                                                                <span className={darkMode ? 'text-white' : 'text-gray-900'}>System Notifications</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleTogglePreference('pushForSystem')}
                                                                className={`px-3 py-1 rounded-full flex items-center ${notificationPreferences.pushForSystem
                                                                    ? 'bg-green-500 text-white'
                                                                    : darkMode ? 'bg-gray-600 text-white' : 'bg-gray-300 text-gray-700'
                                                                    }`}
                                                            >
                                                                {notificationPreferences.pushForSystem ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                                                {notificationPreferences.pushForSystem ? 'On' : 'Off'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4">
                                            <button
                                                onClick={handleSaveNotificationPreferences}
                                                disabled={loading}
                                                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                                            >
                                                {loading ? 'Saving...' : 'Save Preferences'}
                                            </button>
                                        </div>
                                </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 