import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserService, AuthService } from '../utils/api';

const Profile = ({ darkMode }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [profileData, setProfileData] = useState({
        user: null,
        permits: [],
        adminStats: null
    });
    const [activityHistory, setActivityHistory] = useState([]);
    const [activityLoading, setActivityLoading] = useState(true);
    const [activityError, setActivityError] = useState('');
    const [editingPhone, setEditingPhone] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneUpdateLoading, setPhoneUpdateLoading] = useState(false);
    const [phoneUpdateSuccess, setPhoneUpdateSuccess] = useState(false);
    const [phoneUpdateError, setPhoneUpdateError] = useState('');

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
                const result = await UserService.getProfile();

                if (result.success) {
                    setProfileData({
                        user: result.data.user,
                        permits: result.data.permits || [],
                        adminStats: result.data.adminStats
                    });
                } else {
                    setError(result.error || 'Failed to load profile data');
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

    // Handle starting and canceling phone editing
    const startEditingPhone = () => {
        setPhoneNumber(profileData.user?.phone || '');
        setEditingPhone(true);
        setPhoneUpdateError('');
    };

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
                                                {!editingPhone && (
                                                    <button
                                                        onClick={startEditingPhone}
                                                        className={`text-xs font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
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
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SBU ID</dt>
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
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                                    <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Users Managed</p>
                                        <p className="text-xl font-bold">{adminStats.totalUsersManaged}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Permits Managed</p>
                                        <p className="text-xl font-bold">{adminStats.totalPermitsManaged}</p>
                                    </div>
                                    <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Actions This Month</p>
                                        <p className="text-xl font-bold">{adminStats.actionsThisMonth}</p>
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
                                    <div key={permit.id} className="p-6">
                                        <div className="flex items-start justify-between flex-wrap gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-bold">{permit.type} Permit</h3>
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${permit.status === 'Active'
                                                        ? darkMode
                                                            ? 'bg-green-900 text-green-300'
                                                            : 'bg-green-100 text-green-800'
                                                        : darkMode
                                                            ? 'bg-yellow-900 text-yellow-300'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                        }`}>
                                                        {permit.status}
                                                    </span>
                                                </div>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Permit ID: {permit.id}
                                                </p>
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    Valid from {permit.validFrom} to {permit.validUntil}
                                                </p>
                                            </div>

                                            <button
                                                className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                                    }`}
                                            >
                                                Renew Permit
                                            </button>
                                        </div>

                                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <h4 className="text-md font-medium mb-2">Registered Vehicle</h4>
                                            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-3">
                                                <div className="sm:col-span-1">
                                                    <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Make & Model</dt>
                                                    <dd className="mt-1 text-sm">{permit.vehicle.make} {permit.vehicle.model}</dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Year & Color</dt>
                                                    <dd className="mt-1 text-sm">{permit.vehicle.year}, {permit.vehicle.color}</dd>
                                                </div>
                                                <div className="sm:col-span-1">
                                                    <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>License Plate</dt>
                                                    <dd className="mt-1 text-sm">{permit.vehicle.licensePlate}</dd>
                                                </div>
                                            </dl>
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