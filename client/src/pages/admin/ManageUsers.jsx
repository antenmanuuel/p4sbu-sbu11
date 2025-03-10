import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaUserEdit, FaTrash, FaLock, FaLockOpen, FaUserPlus, FaArrowLeft } from 'react-icons/fa';
import { getUsers, toggleUserStatus } from '../../utils/mockUserData';

const ManageUsers = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // State for users data and pagination
    const [userData, setUserData] = useState({ users: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', userType: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch users based on current filters and pagination
    useEffect(() => {
        setIsLoading(true);
        const result = getUsers(
            { ...filters, search: searchTerm },
            currentPage,
            10
        );
        setUserData(result);
        setIsLoading(false);
    }, [filters, searchTerm, currentPage]);

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
    const handleToggleStatus = (userId, currentStatus) => {
        let newStatus;
        if (currentStatus === 'active') {
            newStatus = 'inactive';
        } else if (currentStatus === 'inactive') {
            newStatus = 'active';
        } else if (currentStatus === 'pending') {
            newStatus = 'active';
        }

        if (newStatus) {
            const success = toggleUserStatus(userId, newStatus);
            if (success) {
                // Refresh user data
                const result = getUsers(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setUserData(result);
            }
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
                        No users found matching your criteria
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Name
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Email
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        SBU ID
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Type
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Status
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Created
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                {userData.users.map((user) => (
                                    <tr key={user.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                        {user.firstName} {user.lastName}
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        ID: {user.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {user.sbuid}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                          ${user.userType === 'admin'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : user.userType === 'faculty'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'}`}>
                                                {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(user.status)}`}>
                                                {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {user.createdAt}
                                            </div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                Last login: {user.lastLogin || 'Never'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Edit User"
                                                >
                                                    <FaUserEdit className="text-blue-500" />
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                                                    onClick={() => handleToggleStatus(user.id, user.status)}
                                                >
                                                    {user.status === 'active' ? (
                                                        <FaLock className="text-yellow-500" />
                                                    ) : (
                                                        <FaLockOpen className="text-green-500" />
                                                    )}
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Delete User"
                                                >
                                                    <FaTrash className="text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {userData.users.length > 0 && renderPagination()}
            </div>
        </div>
    );
};

export default ManageUsers; 