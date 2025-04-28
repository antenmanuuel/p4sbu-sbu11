import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaUserEdit, FaTrash, FaLock, FaLockOpen, FaUserPlus, FaArrowLeft, FaCheck, FaExclamationCircle, FaUserShield, FaUser } from 'react-icons/fa';
import { AdminService, AuthService } from '../../utils/api';
import RoleChangeSelfConfirmModal from '../../components/RoleChangeSelfConfirmModal';

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

    // State for admin role management
    const [roleChangeLoading, setRoleChangeLoading] = useState(false);
    const [showRoleChangeModal, setShowRoleChangeModal] = useState(false);
    const [userToToggleRole, setUserToToggleRole] = useState(null);
    const [roleChangeError, setRoleChangeError] = useState('');
    const [adminCount, setAdminCount] = useState(0);
    const [adminUsers, setAdminUsers] = useState([]);

    // State for user type management
    const [userTypeLoading, setUserTypeLoading] = useState(false);
    const [showUserTypeModal, setShowUserTypeModal] = useState(false);
    const [userToChangeType, setUserToChangeType] = useState(null);
    const [selectedUserType, setSelectedUserType] = useState('');
    const [userTypeError, setUserTypeError] = useState('');

    // Combined state for role management
    const [roleManagementLoading, setRoleManagementLoading] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [userToManage, setUserToManage] = useState(null);
    const [selectedRole, setSelectedRole] = useState('');
    const [isAdminSelected, setIsAdminSelected] = useState(false);
    const [roleError, setRoleError] = useState('');

    // Add state for the self role change confirmation modal
    const [showSelfRoleConfirmModal, setShowSelfRoleConfirmModal] = useState(false);
    const [selfRoleChangeCallback, setSelfRoleChangeCallback] = useState(null);

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

                    // Update admin count from all users (not just the current page)
                    try {
                        // This gets all admin users without pagination limits
                        const adminResult = await AdminService.getUsers(
                            { userType: 'admin' },
                            1,
                            100 // High limit to get all admins
                        );

                        if (adminResult.success && adminResult.data.users) {
                            // Filter users with userType exactly matching 'admin'
                            const exactAdmins = adminResult.data.users.filter(
                                user => user.userType === 'admin'
                            );

                            console.log('Exact admin count:', exactAdmins.length);
                            setAdminCount(exactAdmins.length);
                            setAdminUsers(exactAdmins);
                        }
                    } catch (err) {
                        console.error('Error counting admins:', err);
                    }
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
    const handleToggleStatus = async (userId, newStatus) => {
        try {
            // Show loading state
            setIsLoading(true);
            setError('');

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
            console.error('Error updating user status:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Old toggle status function, let's rename it to ensure clarity
    const toggleUserStatus = async (userId, status) => {
        handleToggleStatus(userId, status);
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

    // Handle admin role toggle modal
    const openAdminRoleModal = (user) => {
        setUserToToggleRole(user);
        setShowRoleChangeModal(true);
        setRoleChangeError('');
    };

    const closeAdminRoleModal = () => {
        setShowRoleChangeModal(false);
        setUserToToggleRole(null);
        setRoleChangeError('');
    };

    const confirmToggleAdminRole = async () => {
        if (!userToToggleRole) return;

        setRoleChangeLoading(true);
        setRoleChangeError('');

        // Determine if we're promoting or demoting
        const isPromotingToAdmin = userToToggleRole.userType !== 'admin';

        // Check admin limit when promoting
        if (isPromotingToAdmin && adminCount >= 5) {
            setRoleChangeError('Maximum limit of 5 admins has been reached');
            setRoleChangeLoading(false);
            return;
        }

        // Special warning if admin is demoting themselves
        const currentUser = AuthService.getCurrentUser();
        const isSelfDemotion = currentUser && currentUser._id === userToToggleRole._id && !isPromotingToAdmin;

        if (isSelfDemotion) {
            const confirmed = window.confirm(
                "Warning: You are about to remove your own admin privileges. " +
                "This will log you out of the admin dashboard. Continue?"
            );
            if (!confirmed) {
                setRoleChangeLoading(false);
                return;
            }
        }

        try {
            // Use the unified method with toggleAdmin mode
            const result = await AdminService.changeUserRole(
                userToToggleRole._id,
                isPromotingToAdmin,
                'toggleAdmin'
            );

            if (result.success) {
                // For self role changes, the alert and redirect is handled in the API
                if (!isSelfDemotion) {
                    // Close modal
                    closeAdminRoleModal();

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

                        // Update admin count
                        const adminResult = await AdminService.getUsers(
                            { userType: 'admin' },
                            1,
                            100
                        );
                        if (adminResult.success) {
                            setAdminCount(adminResult.success ? adminResult.data.pagination.total : 0);
                        }
                    }
                }
            } else {
                setRoleChangeError(result.error || 'Failed to change user role');
            }
        } catch (error) {
            console.error('Error changing admin role:', error);
            setRoleChangeError('An unexpected error occurred');
        } finally {
            setRoleChangeLoading(false);
        }
    };

    // Handler functions for user type modal
    const openUserTypeModal = (user) => {
        setUserToChangeType(user);
        setSelectedUserType(user.userType); // Set current type as default
        setShowUserTypeModal(true);
        setUserTypeError('');
    };

    const closeUserTypeModal = () => {
        setShowUserTypeModal(false);
        setUserToChangeType(null);
        setSelectedUserType('');
        setUserTypeError('');
    };

    const confirmChangeUserType = async () => {
        if (!userToChangeType || !selectedUserType) return;

        // If same type is selected, just close the modal
        if (userToChangeType.userType === selectedUserType) {
            closeUserTypeModal();
            return;
        }

        setUserTypeLoading(true);
        setUserTypeError('');

        // Check if admin is changing their own role
        const currentUser = AuthService.getCurrentUser();
        const isSelfRoleChange = currentUser && currentUser._id === userToChangeType._id;

        if (isSelfRoleChange) {
            const confirmed = window.confirm(
                "Warning: You are about to change your own user type. " +
                "This will update your permissions and may redirect you. Continue?"
            );
            if (!confirmed) {
                setUserTypeLoading(false);
                return;
            }
        }

        try {
            // Use the new combined method
            const result = await AdminService.changeUserRole(userToChangeType._id, selectedUserType);

            if (result.success) {
                // For self role changes, the alert and redirect is handled in the API
                if (!isSelfRoleChange) {
                    // Close modal
                    closeUserTypeModal();

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

                        // Update admin count if needed
                        if (selectedUserType === 'admin' || userToChangeType.userType === 'admin') {
                            const adminResult = await AdminService.getUsers(
                                { userType: 'admin' },
                                1,
                                100
                            );
                            if (adminResult.success) {
                                setAdminCount(adminResult.success ? adminResult.data.pagination.total : 0);
                            }
                        }
                    }
                }
            } else {
                setUserTypeError(result.error || 'Failed to change user type');
            }
        } catch (error) {
            console.error('Error changing user type:', error);
            setUserTypeError('An unexpected error occurred');
        } finally {
            setUserTypeLoading(false);
        }
    };

    // Combined role management handlers
    const openRoleModal = (user) => {
        setUserToManage(user);
        setSelectedRole(user.userType); // Set current role as default
        setShowRoleModal(true);
        setRoleError('');
    };

    const closeRoleModal = () => {
        setShowRoleModal(false);
        setUserToManage(null);
        setSelectedRole('');
        setRoleError('');
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const confirmRoleChange = async () => {
        if (!userToManage || !selectedRole) return;

        // Check if anything changed
        if (selectedRole === userToManage.userType) {
            closeRoleModal();
            return;
        }

        setRoleManagementLoading(true);
        setRoleError('');

        try {
            // Check if we're promoting to admin (need to check the limit)
            if (selectedRole === 'admin' && userToManage.userType !== 'admin') {
                // Check admin limit
                if (adminCount >= 5) {
                    setRoleError('Maximum limit of 5 admins has been reached');
                    setRoleManagementLoading(false);
                    return;
                }
            }

            // Check if admin is changing their own role
            const currentUser = AuthService.getCurrentUser();
            const isSelfRoleChange = currentUser && currentUser._id === userToManage._id;

            if (isSelfRoleChange) {
                // Show the custom modal instead of window.confirm
                const continueWithRoleChange = () => {
                    // This function will be called if the user confirms
                    performRoleChange(userToManage._id, selectedRole, isSelfRoleChange);
                };

                // Store the callback and show the modal
                setSelfRoleChangeCallback(() => continueWithRoleChange);
                setShowSelfRoleConfirmModal(true);
                setRoleManagementLoading(false);
                return;
            }

            // If not self change, proceed directly
            await performRoleChange(userToManage._id, selectedRole, isSelfRoleChange);

        } catch (error) {
            console.error('Error updating user role:', error);
            setRoleError('An unexpected error occurred');
            setRoleManagementLoading(false);
        }
    };

    // Extract the role change logic to a separate function
    const performRoleChange = async (userId, newRole, isSelfChange) => {
        try {
            setRoleManagementLoading(true);

            // Use the new combined method
            const result = await AdminService.changeUserRole(userId, newRole);

            if (!result.success) {
                setRoleError(result.error || 'Failed to change user role');
                setRoleManagementLoading(false);
                return;
            }

            // For self role changes, the alert and redirect is handled in the API
            if (!isSelfChange) {
                // Close modal
                closeRoleModal();

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

                    // Update admin count
                    const adminResult = await AdminService.getUsers(
                        { userType: 'admin' },
                        1,
                        100
                    );
                    if (adminResult.success) {
                        setAdminCount(adminResult.success ? adminResult.data.pagination.total : 0);
                    }
                }
            }
        } catch (error) {
            console.error('Error in performRoleChange:', error);
            setRoleError('An unexpected error occurred');
        } finally {
            setRoleManagementLoading(false);
        }
    };

    // Handle cancel of self role change
    const handleCancelSelfRoleChange = () => {
        setShowSelfRoleConfirmModal(false);
        setSelfRoleChangeCallback(null);
    };

    // Handle confirm of self role change
    const handleConfirmSelfRoleChange = () => {
        setShowSelfRoleConfirmModal(false);
        if (selfRoleChangeCallback) {
            selfRoleChangeCallback();
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

            {/* Admin Management Section */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Admin Management</h2>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                        <FaUserShield className="mr-2" /> {adminCount} / 5 Admins
                    </div>
                </div>

                {/* Admin Users Table */}
                {isLoading ? (
                    <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : !userData.users || userData.users.length === 0 ? (
                    <div className={`text-center py-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <p>No users found.</p>
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
                                        Status
                                    </th>
                                    <th scope="col" className={`px-4 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {adminUsers.map((user) => (
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
                                        <td className={`px-4 py-4 whitespace-nowrap text-sm`}>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeStyles(user.status)}`}>
                                                {user.status === 'active' ? 'Active' : user.status === 'pending' ? 'Pending' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                            <div className="flex justify-end gap-2">
                                                {user.email !== 'admin@stonybrook.edu' && (
                                                    <>
                                                        {user.status !== 'pending' && (
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
                                                        {user.userType !== 'admin' ? (
                                                            <button
                                                                onClick={() => openAdminRoleModal(user)}
                                                                className={`p-1.5 rounded-md ${adminCount >= 5
                                                                    ? (darkMode ? 'bg-gray-800 cursor-not-allowed' : 'bg-gray-200 cursor-not-allowed')
                                                                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
                                                                    }`}
                                                                title={adminCount >= 5 ? "Admin limit reached (5 max)" : "Promote to Admin"}
                                                                disabled={adminCount >= 5}
                                                            >
                                                                <FaUserShield className={adminCount >= 5 ? "text-gray-500" : "text-blue-500"} />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-800' : 'bg-gray-200'} cursor-not-allowed`}
                                                                title="Already an admin"
                                                                disabled
                                                            >
                                                                <FaUserShield className="text-gray-400" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => openDeleteModal(user)}
                                                            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                            title="Delete User"
                                                        >
                                                            <FaTrash className="text-red-500" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {adminUsers.length === 0 && (
                                    <tr className={darkMode ? 'bg-gray-800' : 'bg-white'}>
                                        <td colSpan="5" className={`px-4 py-6 text-center text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            No admin users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

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
                                                <div className="flex space-x-1">
                                                    {/* Toggle status button */}
                                                    {user.status === 'active' ? (
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id, 'inactive')}
                                                            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                            title="Deactivate user"
                                                        >
                                                            <FaLockOpen className="text-green-500" />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id, 'active')}
                                                            className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                            title="Activate user"
                                                        >
                                                            <FaLock className="text-red-500" />
                                                        </button>
                                                    )}

                                                    {/* Combined role management button */}
                                                    <button
                                                        onClick={() => openRoleModal(user)}
                                                        className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                        title="Manage user role"
                                                    >
                                                        {user.userType === 'admin' ? (
                                                            <FaUserShield className="text-blue-500" />
                                                        ) : (
                                                            <FaUserEdit className="text-purple-500" />
                                                        )}
                                                    </button>

                                                    {/* Delete user button */}
                                                    <button
                                                        onClick={() => openDeleteModal(user)}
                                                        className={`p-1.5 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                        title="Delete user"
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

            {/* Admin Role Toggle Modal */}
            {showRoleChangeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`relative w-full max-w-md p-6 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow-lg`}>
                        <h3 className="text-xl font-bold mb-4">
                            {userToToggleRole?.userType === 'admin' ? 'Remove Admin Role' : 'Promote to Admin'}
                        </h3>

                        <p className="mb-4">
                            {userToToggleRole?.userType === 'admin'
                                ? `Are you sure you want to remove admin privileges from ${userToToggleRole?.firstName} ${userToToggleRole?.lastName}?`
                                : `Are you sure you want to promote ${userToToggleRole?.firstName} ${userToToggleRole?.lastName} to an admin role?`
                            }
                        </p>

                        {userToToggleRole?.userType === 'admin' && adminCount <= 1 && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
                                You cannot remove the only admin in the system.
                            </div>
                        )}

                        {userToToggleRole?.userType !== 'admin' && adminCount >= 5 && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded mb-4">
                                Maximum limit of 5 admins has been reached.
                            </div>
                        )}

                        {roleChangeError && (
                            <div className="bg-red-100 text-red-800 p-3 rounded mb-4">
                                {roleChangeError}
                            </div>
                        )}

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={closeAdminRoleModal}
                                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmToggleAdminRole}
                                disabled={(userToToggleRole?.userType === 'admin' && adminCount <= 1) ||
                                    (userToToggleRole?.userType !== 'admin' && adminCount >= 5) ||
                                    roleChangeLoading}
                                className={`px-4 py-2 rounded text-white 
                                    ${userToToggleRole?.userType === 'admin'
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'} 
                                    ${((userToToggleRole?.userType === 'admin' && adminCount <= 1) ||
                                        (userToToggleRole?.userType !== 'admin' && adminCount >= 5) ||
                                        roleChangeLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {roleChangeLoading ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    userToToggleRole?.userType === 'admin' ? 'Remove Admin Role' : 'Promote to Admin'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Type Change Modal */}
            {showUserTypeModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}>
                        <div className={`p-6 ${darkMode ? 'border-b border-gray-700' : 'border-b'}`}>
                            <h3 className="text-lg font-medium">Change User Type</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-full mr-3 ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-800'}`}>
                                    <FaUserEdit />
                                </div>
                                <div>
                                    <p className="font-medium">{userToChangeType?.firstName} {userToChangeType?.lastName}</p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userToChangeType?.email}</p>
                                </div>
                            </div>

                            <p className="mb-4">Select the new user type for this account:</p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">User Type</label>
                                <select
                                    value={selectedUserType}
                                    onChange={(e) => setSelectedUserType(e.target.value)}
                                    className={`w-full p-2 border rounded-md ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'}`}
                                >
                                    <option value="">Select a user type</option>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="visitor">Visitor</option>
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    {selectedUserType === 'visitor' && 'Note: Visitor accounts will be assigned a special visitor ID.'}
                                </p>
                            </div>

                            {userTypeError && (
                                <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                    <FaExclamationCircle className="mr-2 flex-shrink-0" />
                                    <span>{userTypeError}</span>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeUserTypeModal}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    disabled={userTypeLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmChangeUserType}
                                    className={`px-4 py-2 text-sm font-medium rounded-md bg-purple-600 hover:bg-purple-700 text-white ${userTypeLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={userTypeLoading || !selectedUserType || selectedUserType === userToChangeType?.userType}
                                >
                                    {userTypeLoading ? (
                                        <span className="flex items-center">
                                            <span className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Change User Type'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Combined Role Management Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`max-w-md w-full ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl overflow-hidden`}>
                        <div className={`p-6 ${darkMode ? 'border-b border-gray-700' : 'border-b'}`}>
                            <h3 className="text-lg font-medium">Manage User Role</h3>
                        </div>
                        <div className="p-6">
                            <div className="flex items-center mb-4">
                                <div className={`p-3 rounded-full mr-3 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
                                    {userToManage?.userType === 'admin' ? <FaUserShield /> : <FaUserEdit />}
                                </div>
                                <div>
                                    <p className="font-medium">{userToManage?.firstName} {userToManage?.lastName}</p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{userToManage?.email}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">User Type</label>
                                <select
                                    value={selectedRole}
                                    onChange={handleRoleChange}
                                    className={`w-full p-2 border rounded-md ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'}`}
                                    disabled={roleManagementLoading}
                                >
                                    <option value="">Select a user type</option>
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="visitor">Visitor</option>
                                    <option value="admin">Administrator</option>
                                </select>

                                {selectedRole === 'visitor' && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        Note: Visitor accounts will be assigned a special visitor ID.
                                    </p>
                                )}

                                {selectedRole === 'admin' && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        Note: Admin accounts have full system access. Currently {adminCount}/5 admin slots used.
                                    </p>
                                )}
                            </div>

                            {roleError && (
                                <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                    <FaExclamationCircle className="mr-2 flex-shrink-0" />
                                    <span>{roleError}</span>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={closeRoleModal}
                                    className={`px-4 py-2 text-sm font-medium rounded-md ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                        }`}
                                    disabled={roleManagementLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmRoleChange}
                                    className={`px-4 py-2 text-sm font-medium rounded-md 
                                        ${selectedRole === 'admin'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-purple-600 hover:bg-purple-700'} 
                                        text-white ${roleManagementLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={roleManagementLoading ||
                                        !selectedRole ||
                                        selectedRole === userToManage?.userType ||
                                        (selectedRole === 'admin' && adminCount >= 5 && userToManage?.userType !== 'admin')}
                                >
                                    {roleManagementLoading ? (
                                        <span className="flex items-center">
                                            <span className="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Save Changes'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Self Role Change Confirmation Modal */}
            <RoleChangeSelfConfirmModal
                isOpen={showSelfRoleConfirmModal}
                onClose={handleCancelSelfRoleChange}
                onConfirm={handleConfirmSelfRoleChange}
                darkMode={darkMode}
                selectedRole={selectedRole}
            />
        </div>
    );
};

export default ManageUsers; 