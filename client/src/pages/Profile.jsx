import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService, AuthService, PermitService, CarService, PaymentMethodService } from '../utils/api';
import { FaCreditCard, FaTrash, FaStar, FaPlus } from 'react-icons/fa';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import StripeCardElement from '../components/StripeCardElement';

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Profile = ({ darkMode }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState({
        user: null,
        permits: [],
        adminStats: {
            totalUsersManaged: 0,
            totalPermitsManaged: 0,
        }
    });
    const [userCars, setUserCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(false);
    const [activityHistory, setActivityHistory] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState('');
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneUpdateLoading, setPhoneUpdateLoading] = useState(false);
    const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
    const [phoneUpdateError, setPhoneUpdateError] = useState('');

    // Add state for payment methods
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
    const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
    const [paymentMethodsError, setPaymentMethodsError] = useState('');
    const [showAddCardForm, setShowAddCardForm] = useState(false);
    const [paymentActionSuccess, setPaymentActionSuccess] = useState('');

    // Check auth and load profile data
    useEffect(() => {
        const fetchProfileData = async () => {
            // Check if user is authenticated
            if (!AuthService.isAuthenticated()) {
                navigate('/login', { state: { from: '/profile' } });
                return;
            }

            try {
                setLoading(true);
                setError('');

                // Get user profile
                const profileResult = await UserService.getProfile();

                // Get user permits
                const permitsResult = await PermitService.getUserPermits();

                // Get user cars
                setLoadingCars(true);
                const carsResult = await CarService.getUserCars();
                setLoadingCars(false);

                if (carsResult.success && carsResult.cars) {
                    setUserCars(carsResult.cars);
                }

                if (profileResult.success) {
                    setProfileData({
                        user: profileResult.data.user,
                        permits: permitsResult.success ? permitsResult.permits : [],
                        adminStats: profileResult.data.adminStats || {
                            totalUsersManaged: 0,
                            totalPermitsManaged: 0,
                        }
                    });
                } else {
                    setError(profileResult.error || 'Failed to load profile data');
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [navigate]);

    // Fetch user activity history
    useEffect(() => {
        const fetchActivityHistory = async () => {
            if (!AuthService.isAuthenticated()) {
                return;
            }

            try {
                setActivityLoading(true);
                setActivityError('');
                const result = await UserService.getActivityHistory();

                if (result.success) {
                    setActivityHistory(result.data);
                } else {
                    setActivityError(result.error || 'Failed to load activity history');
                }
            } catch (err) {
                console.error('Error fetching activity history:', err);
                setActivityError('An unexpected error occurred');
            } finally {
                setActivityLoading(false);
            }
        };

        fetchActivityHistory();
    }, []);

    // Fetch saved payment methods
    useEffect(() => {
        const fetchSavedPaymentMethods = async () => {
            if (!AuthService.isAuthenticated()) {
                return;
            }

            try {
                setLoadingPaymentMethods(true);
                setPaymentMethodsError('');
                const response = await PaymentMethodService.getSavedPaymentMethods();

                if (response.success) {
                    setSavedPaymentMethods(response.paymentMethods || []);
                } else {
                    setPaymentMethodsError(response.error || 'Failed to load payment methods');
                }
            } catch (error) {
                console.error('Error fetching payment methods:', error);
                setPaymentMethodsError('An unexpected error occurred');
            } finally {
                setLoadingPaymentMethods(false);
            }
        };

        fetchSavedPaymentMethods();
    }, []);

    // Set phone number from profile data when it's loaded
    useEffect(() => {
        if (profileData.user?.phone) {
            setPhoneNumber(profileData.user.phone);
        }
    }, [profileData.user]);

    // Handle phone number update
    const handlePhoneUpdate = async () => {
        try {
            setPhoneUpdateLoading(true);
            setPhoneUpdateError('');
            setPhoneUpdateSuccess(false);

            const result = await UserService.updateProfile({ phone: phoneNumber });

            if (result.success) {
                setPhoneUpdateSuccess(true);
                setEditingPhone(false);

                // Update the profile data with the new phone number
                setProfileData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        phone: phoneNumber
                    }
                }));

                // Hide success message after 3 seconds
                setTimeout(() => {
                    setPhoneUpdateSuccess(false);
                }, 3000);
            } else {
                setPhoneUpdateError(result.error || 'Failed to update phone number');
            }
        } catch (err) {
            console.error('Error updating phone:', err);
            setPhoneUpdateError('An unexpected error occurred');
        } finally {
            setPhoneUpdateLoading(false);
        }
    };

    // Handle deleting a payment method
    const handleDeletePaymentMethod = async (methodId) => {
        try {
            const response = await PaymentMethodService.deletePaymentMethod(methodId);
            if (response.success) {
                // Remove the deleted method from the state
                setSavedPaymentMethods(savedPaymentMethods.filter(pm => pm.id !== methodId));
                setPaymentActionSuccess('Payment method deleted successfully');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setPaymentActionSuccess('');
                }, 3000);
            } else {
                setPaymentMethodsError('Failed to delete payment method');
            }
        } catch (error) {
            console.error('Error deleting payment method:', error);
            setPaymentMethodsError('An unexpected error occurred');
        }
    };

    // Handle setting a payment method as default
    const handleSetDefaultPaymentMethod = async (methodId) => {
        try {
            const response = await PaymentMethodService.setDefaultPaymentMethod(methodId);
            if (response.success) {
                // Update the saved payment methods to reflect the new default
                const updatedMethods = savedPaymentMethods.map(pm => ({
                    ...pm,
                    isDefault: pm.id === methodId
                }));
                setSavedPaymentMethods(updatedMethods);
                setPaymentActionSuccess('Default payment method updated');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setPaymentActionSuccess('');
                }, 3000);
            } else {
                setPaymentMethodsError('Failed to set default payment method');
            }
        } catch (error) {
            console.error('Error setting default payment method:', error);
            setPaymentMethodsError('An unexpected error occurred');
        }
    };

    // Handle adding a new payment method
    const handlePaymentMethodCreated = async (paymentMethod, saveCard) => {
        try {
            // Always save the payment method as we're in the payment methods section
            const response = await PaymentMethodService.savePaymentMethod(
                paymentMethod.id,
                savedPaymentMethods.length === 0 // Make it default if it's the first one
            );

            if (response.success) {
                // Refresh the list of saved payment methods
                const pmResponse = await PaymentMethodService.getSavedPaymentMethods();
                if (pmResponse.success) {
                    setSavedPaymentMethods(pmResponse.paymentMethods || []);
                    setPaymentActionSuccess('Payment method added successfully');
                    setShowAddCardForm(false);

                    // Clear success message after 3 seconds
                    setTimeout(() => {
                        setPaymentActionSuccess('');
                    }, 3000);
                }
            } else {
                setPaymentMethodsError('Failed to save payment method');
            }
        } catch (error) {
            console.error('Error handling payment method:', error);
            setPaymentMethodsError('Failed to process payment method');
        }
    };

    // Handle canceling phone editing
    const cancelEditingPhone = () => {
        setEditingPhone(false);
        setPhoneUpdateError('');
    };

    // Check if user is admin
    const isAdmin = profileData.user?.userType === 'admin';
    const { user, permits, adminStats } = profileData;

    // Format activity date
    const formatActivityDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();

        // If today, show time
        if (date.toDateString() === now.toDateString()) {
            return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        }

        // If within last week, show day of week
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
            return date.toLocaleDateString([], { weekday: 'long', hour: '2-digit', minute: '2-digit' });
        }

        // Otherwise show the date
        return date.toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' });
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className={`flex-1 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

                {error && (
                    <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                        {error}
                    </div>
                )}

                {/* User Information Card */}
                <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className={`p-6 ${darkMode ? 'border-b border-gray-700' : 'border-b'}`}>
                        <div className="flex items-start gap-6">
                            <div className={`flex-shrink-0 size-24 rounded-full flex items-center justify-center ${isAdmin ? 'bg-red-600' : 'bg-blue-600'} text-white text-4xl font-semibold`}>
                                {user?.firstName?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User Name'}</h2>
                                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {isAdmin ? 'Administrator' : user?.userType === 'student' ? 'Student' : user?.userType || 'User'}
                                </p>
                                <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 mt-2">
                                        <div className="sm:col-span-1">
                                            <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Address</dt>
                                            <dd className="mt-1 text-sm">{user?.email || 'email@example.com'}</dd>
                                        </div>

                                        <div className="sm:col-span-1">
                                            <div className="flex justify-between items-center">
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</dt>
                                            </div>

                                            {editingPhone ? (
                                                <div className="mt-1">
                                                    <div className="flex items-center">
                                                        <input
                                                            type="text"
                                                            value={phoneNumber}
                                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                                            className={`block w-full rounded-md px-3 py-1.5 text-sm ${darkMode
                                                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                                                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                                                                } border`}
                                                            placeholder="(123) 456-7890"
                                                        />
                                                        <button
                                                            onClick={handlePhoneUpdate}
                                                            disabled={phoneUpdateLoading}
                                                            className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            {phoneUpdateLoading ? 'Saving...' : 'Save'}
                                                        </button>
                                                        <button
                                                            onClick={cancelEditingPhone}
                                                            className="ml-2 inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                    {phoneUpdateError && (
                                                        <p className="mt-1 text-xs text-red-500">{phoneUpdateError}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <dd className="mt-1 text-sm">
                                                    {user?.phone || 'Not provided'}
                                                    {phoneUpdateSuccess && (
                                                        <span className="ml-2 text-xs text-green-500">Updated successfully!</span>
                                                    )}
                                                </dd>
                                            )}
                                        </div>
                                        {isAdmin ? (
                                            <div className="sm:col-span-1">
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</dt>
                                                <dd className="mt-1 text-sm">{adminStats?.role || 'System Administrator'}</dd>
                                            </div>
                                        ) : (
                                            <div className="sm:col-span-1">
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{user?.userType === 'visitor' ? 'Visitor ID' : 'SBU ID'}</dt>
                                                <dd className="mt-1 text-sm">{user?.sbuId || '12345678'}</dd>
                                            </div>
                                        )}
                                        <div className="sm:col-span-1">
                                            <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Account Status</dt>
                                            <dd className="mt-1 text-sm">
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin stats section - only show for admins */}
                {isAdmin && adminStats ? (
                    <>
                        <h2 className="text-xl font-bold mb-4">Administration Information</h2>
                        <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="p-6">
                                <h3 className="text-lg font-bold mb-4">Administration Statistics</h3>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Users Managed</p>
                                        <p className="text-xl font-bold">{adminStats.totalUsersManaged}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Permits Managed</p>
                                        <p className="text-xl font-bold">{adminStats.totalPermitsManaged}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Permits Section - only show for non-admins */}
                        <h2 className="text-xl font-bold mb-4">My Parking Permits</h2>
                        {permits.length > 0 ? (
                            <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                {permits.map((permit) => (
                                    <div key={permit._id || permit.id} className="p-6">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold">{permit.permitName || 'Commuter Core Permit'}</h3>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${(permit.status === 'active' || permit.status === 'Active')
                                                        ? darkMode
                                                            ? 'bg-green-900 text-green-300'
                                                            : 'bg-green-100 text-green-800'
                                                        : darkMode
                                                            ? 'bg-yellow-900 text-yellow-300'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Permit ID: {permit.permitNumber || permit.id}
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Valid from {formatDate(permit.startDate)} to {formatDate(permit.endDate)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <p>You don't have any active parking permits.</p>
                                <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                                    Purchase a Permit
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* My Vehicles Section */}
                {!isAdmin && (
                    <>
                        <h2 className="text-xl font-bold mb-4">My Vehicles</h2>
                        {loadingCars ? (
                            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-8`}>
                                <div className="flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600 mr-2"></div>
                                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading vehicles...</p>
                                </div>
                            </div>
                        ) : userCars && userCars.length > 0 ? (
                            <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="p-4">
                                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Registered Vehicles</h3>
                                </div>
                                {userCars.map(car => (
                                    <div key={car._id || car.id} className="border-t p-4 flex justify-between items-center">
                                        <div className="flex items-center">
                                            <div className={`p-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mr-4`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM8 11l4-4 4 4m0 4l-4 4-4-4" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{car.make} {car.model} {car.year && `(${car.year})`}</h4>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {car.color} {car.bodyType}
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    {car.plateNumber} • {car.stateProv}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-8`}>
                                <p>You don't have any registered vehicles.</p>
                            </div>
                        )}
                    </>
                )}

                {/* Payment Methods Section */}
                {!isAdmin && (
                    <>
                        <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
                        <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="p-6">
                                {paymentActionSuccess && (
                                    <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                        {paymentActionSuccess}
                                    </div>
                                )}

                                {paymentMethodsError && (
                                    <div className={`mb-4 p-3 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                        {paymentMethodsError}
                                    </div>
                                )}

                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-medium">Saved Payment Methods</h3>
                                    {!showAddCardForm && (
                                        <button
                                            onClick={() => setShowAddCardForm(true)}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium ${darkMode
                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                                }`}
                                        >
                                            <FaPlus size={14} />
                                            Add Payment Method
                                        </button>
                                    )}
                                </div>

                                {loadingPaymentMethods ? (
                                    <div className="flex items-center justify-center py-6">
                                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-red-600 mr-2"></div>
                                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading payment methods...</p>
                                    </div>
                                ) : showAddCardForm ? (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-3">Add New Payment Method</h4>
                                        <Elements stripe={stripePromise}>
                                            <StripeCardElement
                                                darkMode={darkMode}
                                                onPaymentMethodCreated={handlePaymentMethodCreated}
                                                buttonText="Save Card"
                                            />
                                        </Elements>
                                        <button
                                            onClick={() => setShowAddCardForm(false)}
                                            className={`mt-3 px-3 py-1.5 rounded-md text-sm font-medium ${darkMode
                                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                                }`}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                ) : savedPaymentMethods.length > 0 ? (
                                    <div className="space-y-3">
                                        {savedPaymentMethods.map(method => (
                                            <div
                                                key={method.id}
                                                className={`flex items-center justify-between p-3 rounded-lg ${darkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <FaCreditCard size={24} className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                                    <div>
                                                        <p className="font-medium">
                                                            {method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} ending in {method.last4}
                                                            {method.isDefault && (
                                                                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${darkMode
                                                                    ? 'bg-green-900 text-green-300'
                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}>
                                                                    Default
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            Expires {method.exp_month}/{method.exp_year}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {!method.isDefault && (
                                                        <button
                                                            onClick={() => handleSetDefaultPaymentMethod(method.id)}
                                                            className={`p-2 rounded-full ${darkMode
                                                                ? 'hover:bg-gray-500 text-gray-300'
                                                                : 'hover:bg-gray-200 text-gray-600'
                                                                }`}
                                                            title="Set as default"
                                                        >
                                                            <FaStar size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeletePaymentMethod(method.id)}
                                                        className={`p-2 rounded-full ${darkMode
                                                            ? 'hover:bg-red-900 text-gray-300'
                                                            : 'hover:bg-red-100 text-gray-600'
                                                            }`}
                                                        title="Delete payment method"
                                                    >
                                                        <FaTrash size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={`p-6 text-center rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className="mb-3">You don't have any saved payment methods.</p>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Adding a payment method makes it faster to pay for citations and parking reservations.
                                        </p>
                                        {!showAddCardForm && (
                                            <button
                                                onClick={() => setShowAddCardForm(true)}
                                                className={`mt-4 px-4 py-2 rounded-md font-medium ${darkMode
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                    }`}
                                            >
                                                Add Payment Method
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Notifications Section */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => navigate('/notifications')}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${darkMode
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        View All Notifications
                    </button>
                </div>

                {/* Account Activity */}
                <h2 className="text-xl font-bold mb-4">Recent Account Activity</h2>
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {activityLoading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading activity history...</p>
                        </div>
                    ) : activityError ? (
                        <div className="p-6 text-center">
                            <p className="text-red-500">{activityError}</p>
                        </div>
                    ) : activityHistory.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No activity history found.</p>
                        </div>
                    ) : (
                        <ul>
                            {activityHistory.map((activity, index) => (
                                <li
                                    key={activity._id}
                                    className={`px-6 py-4 ${index < activityHistory.length - 1
                                        ? darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'
                                        : ''
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{activity.description}</p>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{activity.details}</p>
                                        </div>
                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {formatActivityDate(activity.created_at)}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile; 