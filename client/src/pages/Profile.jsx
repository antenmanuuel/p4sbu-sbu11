import React, { useState } from 'react';

const Profile = ({ darkMode, user }) => {
    // Mock data for user permits
    const [userPermits] = useState([
        {
            id: 'P-2024-001',
            type: 'Commuter Core',
            validFrom: '2024-01-01',
            validUntil: '2024-12-31',
            status: 'Active',
            vehicle: {
                make: 'Toyota',
                model: 'Camry',
                year: '2020',
                color: 'Blue',
                licensePlate: 'NY-ABC-123'
            }
        }
    ]);

    // Admin statistics
    const [adminStats] = useState({
        totalUsersManaged: 2456,
        totalPermitsManaged: 1879,
        actionsThisMonth: 138,
        lastLogin: 'Today, 8:45 AM',
        accountCreated: 'January 2, 2024',
        role: 'System Administrator',
        permissions: ['User Management', 'Permit Management', 'Lot Management', 'System Configuration', 'Report Generation']
    });

    // Check if user is admin
    const isAdmin = user?.userType === 'admin';

    return (
        <div className={`flex-1 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
                <h1 className="text-3xl font-bold mb-6">My Profile</h1>

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
                                            <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</dt>
                                            <dd className="mt-1 text-sm">{user?.phone || '(555) 123-4567'}</dd>
                                        </div>
                                        {isAdmin ? (
                                            <div className="sm:col-span-1">
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Role</dt>
                                                <dd className="mt-1 text-sm">{adminStats.role}</dd>
                                            </div>
                                        ) : (
                                            <div className="sm:col-span-1">
                                                <dt className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SBU ID</dt>
                                                <dd className="mt-1 text-sm">{user?.id || '12345678'}</dd>
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
                {isAdmin ? (
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

                                <div className="mt-6">
                                    <h3 className="text-lg font-bold mb-4">Administrative Permissions</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {adminStats.permissions.map((permission, index) => (
                                            <span
                                                key={index}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {permission}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Permits Section - only show for non-admins */}
                        <h2 className="text-xl font-bold mb-4">My Parking Permits</h2>
                        {userPermits.length > 0 ? (
                            <div className={`rounded-lg shadow-md overflow-hidden mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                {userPermits.map((permit) => (
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
                    <ul>
                        <li className={`px-6 py-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Logged in from new device</p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Windows PC - Chrome Browser</p>
                                </div>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isAdmin ? adminStats.lastLogin : 'Today, 10:30 AM'}</span>
                            </div>
                        </li>
                        <li className={`px-6 py-4 ${darkMode ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Password changed</p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Security update</p>
                                </div>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>March 15, 2024</span>
                            </div>
                        </li>
                        <li className="px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Account created</p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Welcome to P4SBU</p>
                                </div>
                                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{isAdmin ? adminStats.accountCreated : 'January 5, 2024'}</span>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Profile; 