import React, { useState } from 'react';

const Settings = ({ darkMode, user }) => {
    // State for form values
    const [formData, setFormData] = useState({
        email: user?.email || '',
        phone: user?.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // State for form sections
    const [activeSection, setActiveSection] = useState('contact');
    const [showSuccessMessage, setShowSuccessMessage] = useState('');
    const [errors, setErrors] = useState({});

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

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (formData.phone && !/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.phone)) {
            newErrors.phone = 'Phone number should be in format (XXX) XXX-XXXX';
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

    const handleUpdateContactInfo = (e) => {
        e.preventDefault();

        if (validateContactInfo()) {
            // Simulate API call
            setTimeout(() => {
                setShowSuccessMessage('Contact information updated successfully!');
                setTimeout(() => setShowSuccessMessage(''), 3000);
            }, 1000);
        }
    };

    const handleChangePassword = (e) => {
        e.preventDefault();

        if (validatePasswordChange()) {
            // Simulate API call
            setTimeout(() => {
                setFormData({
                    ...formData,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
                setShowSuccessMessage('Password changed successfully!');
                setTimeout(() => setShowSuccessMessage(''), 3000);
            }, 1000);
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
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Contact Information
                    </button>
                    <button
                        onClick={() => setActiveSection('password')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'password'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Change Password
                    </button>
                    <button
                        onClick={() => setActiveSection('notifications')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeSection === 'notifications'
                            ? 'bg-red-600 text-white'
                            : darkMode
                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Notification Settings
                    </button>
                </div>

                {/* Success Message */}
                {showSuccessMessage && (
                    <div className={`p-4 mb-6 rounded-md ${darkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                        {showSuccessMessage}
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

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.email ? 'border-red-500' : ''}`}
                                        />
                                        {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Phone Number
                                        </label>
                                        <input
                                            type="text"
                                            name="phone"
                                            id="phone"
                                            placeholder="(555) 123-4567"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.phone ? 'border-red-500' : ''}`}
                                        />
                                        {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                        >
                                            Update Contact Information
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

                                <div className="space-y-6">
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
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
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
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
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
                                            className={`mt-1 block w-full rounded-md shadow-sm focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 sm:text-sm ${darkMode
                                                ? 'bg-gray-700 border-gray-600 text-white'
                                                : 'border-gray-300 text-gray-900'
                                                } ${errors.confirmPassword ? 'border-red-500' : ''}`}
                                        />
                                        {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                        >
                                            Change Password
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {/* Notification Settings */}
                        {activeSection === 'notifications' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Manage how and when you receive notifications from P4SBU.
                                </p>

                                <div className="space-y-4">
                                    <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-md font-medium">Email Notifications</h3>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Receive updates about your account, permits, and citations via email
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" defaultChecked />
                                                    <div className={`block w-10 h-6 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                                    <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform translate-x-full"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-md font-medium">SMS Notifications</h3>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Receive text messages for important alerts and reminders
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" />
                                                    <div className={`block w-10 h-6 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                                    <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={`p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-md font-medium">Permit Expiration Reminders</h3>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Get notified when your parking permits are about to expire
                                                </p>
                                            </div>
                                            <label className="flex items-center cursor-pointer">
                                                <div className="relative">
                                                    <input type="checkbox" className="sr-only" defaultChecked />
                                                    <div className={`block w-10 h-6 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
                                                    <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform translate-x-full"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end mt-6">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                                        >
                                            Save Notification Preferences
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings; 