import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaUserEdit, FaTrash, FaLock, FaLockOpen, FaUserPlus, FaArrowLeft, FaCheck, FaExclamationCircle } from 'react-icons/fa';
import { AdminService, AuthService } from '../../utils/api';

const ManageUsers = ({ darkMode }) => {
    const navigate = useNavigate();

    // Check authentication on component mount
    useEffect(() => {
        if (!AuthService.isAuthenticated()) {
            navigate('/login', { state: { from: '/admin-dashboard/manage-users' } });
        } else {
            // Check if user type is admin
            const currentUser = AuthService.getCurrentUser();
            if (currentUser && currentUser.userType !== 'admin') {
                // Redirect to appropriate dashboard based on user type
                if (currentUser.userType === 'student') {
                    navigate('/dashboard');
                } else if (currentUser.userType === 'faculty') {
                    navigate('/faculty-dashboard');
                }
            }
        }
    }, [navigate]);

    // State for users data and pagination
    const [userData, setUserData] = useState({ users: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', userType: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isPendingLoading, setIsPendingLoading] = useState(true);
    const [pendingError, setPendingError] = useState('');

    // Modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    // Fetch users from API based on current filters and pagination
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoading(true);
            setError('');

            try {
                const result = await AdminService.getUsers(
                    {
                        status: filters.status,
                        userType: filters.userType,
                        search: searchTerm
                    },
                    currentPage,
                    10
                );

                if (result.success) {
                    setUserData(result.data);
                } else {
                    setError(result.error || 'Failed to fetch users');
                }
            } catch (err) {
                console.error('Error fetching users:', err);
                setError('An unexpected error occurred while fetching users');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUsers();
    }, [filters, searchTerm, currentPage]);

    // Fetch pending users from API
    useEffect(() => {
        const fetchPendingUsers = async () => {
            setIsPendingLoading(true);
            setPendingError('');

            try {
                const result = await AdminService.getPendingUsers();
                if (result.success) {
                    setPendingUsers(result.data);
                } else {
                    setPendingError(result.error);
                }
            } catch (error) {
                console.error('Error fetching pending users:', error);
                setPendingError('Failed to fetch pending users');
            } finally {
                setIsPendingLoading(false);
            }
        };

        fetchPendingUsers();
    }, []);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({ ...prev, [filterName]: value }));
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Handle user status toggle
    const handleToggleStatus = async (userId, currentStatus) => {
        // For pending users, use approveUser
        if (currentStatus === 'pending') {
            setIsLoading(true);
            try {
                const result = await AdminService.approveUser(userId);
                if (result.success) {
                    // Remove from pending users list
                    setPendingUsers(prev => prev.filter(user => user._id !== userId));

                    // Refresh user data
                    const updatedResult = await AdminService.getUsers(
                        {
                            status: filters.status,
                            userType: filters.userType,
                            search: searchTerm
                        },
                        currentPage,
                        10
                    );

                    if (updatedResult.success) {
                        setUserData(updatedResult.data);
                    }
                }
            } catch (error) {
                console.error('Error approving user:', error);
                setError('Failed to approve user');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // For active/inactive users, use toggleUserStatus
        let newStatus;
        if (currentStatus === 'active') {
            newStatus = 'inactive';
        } else if (currentStatus === 'inactive') {
            newStatus = 'active';
        }

        if (newStatus) {
            setIsLoading(true);
            try {
                const result = await AdminService.toggleUserStatus(userId, newStatus);
                if (result.success) {
                    // Refresh user data
                    const updatedResult = await AdminService.getUsers(
                        {
                            status: filters.status,
                            userType: filters.userType,
                            search: searchTerm
                        },
                        currentPage,
                        10
                    );

                    if (updatedResult.success) {
                        setUserData(updatedResult.data);
                    }
                } else {
                    setError(result.error || 'Failed to update user status');
                }
            } catch (error) {
                console.error('Error toggling user status:', error);
                setError('Failed to update user status');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // Handle user delete
    const openDeleteModal = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
        setDeleteError('');
    };

    const closeDeleteModal = () => {
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleteError('');
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;

        setDeleteLoading(true);
        setDeleteError('');

        try {
            const result = await AdminService.deleteUser(userToDelete._id);
            if (result.success) {
                // Close modal
                setShowDeleteModal(false);

                // Refresh user data
                const updatedResult = await AdminService.getUsers(
                    {
                        status: filters.status,
                        userType: filters.userType,
                        search: searchTerm
                    },
                    currentPage,
                    10
                );

                if (updatedResult.success) {
                    setUserData(updatedResult.data);
                }
            } else {
                setDeleteError(result.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            setDeleteError('An unexpected error occurred');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Get status badge style
    const getStatusBadgeStyles = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Generate pagination controls
    const renderPagination = () => {
        const { totalPages, currentPage: currPage, total } = userData.pagination;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                    Showing {(currPage - 1) * 10 + 1}-{Math.min(currPage * 10, total)} of {total} users
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(currPage - 1)}
                        disabled={currPage === 1}
                        className={`px-3 py-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded 
                                   ${currPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 rounded
                                      ${i + 1 === currPage
                                    ? (darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white')
                                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageChange(currPage + 1)}
                        disabled={currPage === totalPages}
                        className={`px-3 py-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded
                                  ${currPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-4 md:p-8`}>
            {/* Header with back button */}
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    className={`mr-4 flex items-center justify-center p-2 rounded-full 
                             ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                    <FaArrowLeft className="text-red-600" />
                </button>
                <h1 className="text-2xl font-bold">Manage Users</h1>
            </div>

            {/* Error message */}
            {error && (
                <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                    <p>{error}</p>
                </div>
            )}

            {/* Pending Users Section */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className="text-xl font-semibold mb-4">Pending Approvals</h2>

                {isPendingLoading ? (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : pendingError ? (
                    <div className={`p-4 mb-4 text-sm rounded-lg ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                        <p>{pendingError}</p>
                    </div>
                ) : pendingUsers.length === 0 ? (
                    <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No pending approvals at this time.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        Name
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        Email
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        SBU ID
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        User Type
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {pendingUsers.map((user) => (
                                    <tr key={user._id} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {user.firstName} {user.lastName}
                                        </td>
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {user.email}
                                        </td>
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            {user.sbuId}
                                        </td>
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                            <span className="capitalize">{user.userType}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleToggleStatus(user._id, 'pending')}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                                            >
                                                <FaCheck className="mr-1" /> Approve
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Search and Filter Controls */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-grow">
                        <div className={`flex items-center px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <FaSearch className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search users by name, email, or ID..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={`w-full bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
                            />
                        </div>
                    </div>

                    {/* Filter Toggle Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`flex items-center px-4 py-2 rounded-lg
                                   ${darkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                    >
                        <FaFilter className="mr-2" />
                        Filters
                    </button>
                </div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 
                                  ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                        {/* Status Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Status
                            </label>
                            <select
                                value={filters.status}
                                onChange={(e) => handleFilterChange('status', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* User Type Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                User Type
                            </label>
                            <select
                                value={filters.userType}
                                onChange={(e) => handleFilterChange('userType', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Types</option>
                                <option value="admin">Admin</option>
                                <option value="faculty">Faculty</option>
                                <option value="student">Student</option>
                            </select>
                        </div>

                        {/* Reset Filters Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: '', userType: '' });
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-2 rounded-lg 
                                          ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Users Table */}
            <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : userData.users.length === 0 ? (
                    <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No users found matching your criteria.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                    <tr>
                                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            Name
                                        </th>
                                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            Email
                                        </th>
                                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            SBU ID
                                        </th>
                                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            User Type
                                        </th>
                                        <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            Status
                                        </th>
                                        <th scope="col" className={`px-4 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    {userData.users.map((user) => (
                                        <tr key={user._id} className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                                            <td className={`px-4 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {user.firstName} {user.lastName}
                                            </td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {user.email}
                                            </td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                {user.sbuId}
                                            </td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                                                <span className="capitalize">{user.userType}</span>
                                            </td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-sm`}>
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeStyles(user.status)}`}>
                                                    {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                <div className="flex justify-end gap-2">
                                                    {user.email !== 'admin@stonybrook.edu' && user.status !== 'pending' && (
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id, user.status)}
                                                            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                            title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                                        >
                                                            {user.status === 'active' ? (
                                                                <FaLock className="text-yellow-500" />
                                                            ) : (
                                                                <FaLockOpen className="text-green-500" />
                                                            )}
                                                        </button>
                                                    )}
                                                    {user.email !== 'admin@stonybrook.edu' && (
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                            title="Delete User"
                                                        >
                                                            <FaTrash className="text-red-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination()}
                    </>
                )}
            </div>

            {/* Delete User Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}>
                        <div className={`p-6 ${darkMode ? 'border-b border-gray-700' : 'border-b'}`}>
                            <h3 className="text-lg font-medium">Confirm User Deletion</h3>
                        </div>
                        <div className="p-6">
                            <p className="mb-4">
                                Are you sure you want to delete the user <span className="font-semibold">{userToDelete?.firstName} {userToDelete?.lastName}</span>?
                                This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                    <FaExclamationCircle className="mr-2 flex-shrink-0" />
                                    <span>{deleteError}</span>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteUser}
                                    className={`px-4 py-2 text-sm font-medium rounded-md bg-red-600 hover:bg-red-700 text-white ${deleteLoading ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? (
                                        <span className="flex items-center">
                                            <span className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                                            Deleting...
                                        </span>
                                    ) : (
                                        'Delete User'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageUsers; 