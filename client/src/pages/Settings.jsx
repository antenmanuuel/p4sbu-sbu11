import React, { useState, useEffect } from 'react';
import { UserService, AuthService } from '../utils/api';

const Settings = ({ darkMode }) => {
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
    const [activeSection, setActiveSection] = useState('contact');
    const [successMessage, setSuccessMessage] = useState('');
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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

                        {/* Notification Settings */}
                        {activeSection === 'notifications' && (
                            <div>
                                <h2 className="text-xl font-bold mb-4">Notification Settings</h2>
                                <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Manage how you receive notifications from P4SBU.
                                </p>

                                {/* Notification settings can be added here in the future */}
                                <div className="flex items-center justify-center h-40">
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Notification settings coming soon.
                                    </p>
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