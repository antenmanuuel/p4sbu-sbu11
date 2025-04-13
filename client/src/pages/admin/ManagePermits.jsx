import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaLock, FaLockOpen, FaArrowLeft, FaCheckCircle, FaTimesCircle, FaExchangeAlt } from 'react-icons/fa';
import { PermitService, PermitTypeService, UserService, LotService, AdminService } from '../../utils/api';

// Format date for input fields (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toISOString().split('T')[0];
};

// Format date for display
const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// New Permit Form Component
const PermitForm = ({ permit = null, onSubmit, onCancel, darkMode }) => {
    // Note: In a real application, this form would be connected to a payment system
    // and the payment/user data would be passed from the payment form
    // The fields are disabled here to indicate they should be managed elsewhere

    const [formData, setFormData] = useState({
        permitType: permit?.permitType || 'Student',
        permitName: permit?.permitName || '',
        userId: permit?.userId || '',
        lots: permit?.lots || [{ lotId: 'L001', lotName: 'South P Lot' }],
        startDate: permit ? formatDateForInput(permit.startDate) : formatDateForInput(new Date()),
        endDate: permit ? formatDateForInput(permit.endDate) : formatDateForInput(new Date(new Date().setMonth(new Date().getMonth() + 4))),
        status: permit?.status || 'active',
        price: permit?.price || 125.00,
        paymentStatus: permit?.paymentStatus || 'unpaid',
        userFullName: permit?.userFullName || '',
        userEmail: permit?.userEmail || '',
        paymentId: permit?.paymentId || '',
    });

    const [permitTypes, setPermitTypes] = useState([]);
    const [parkingLots, setParkingLots] = useState([]);

    // Load permit types when the form loads
    useEffect(() => {
        const fetchPermitTypes = async () => {
            const result = await PermitTypeService.getPermitTypes();
            if (result.success) {
                setPermitTypes(result.data.permitTypes || []);
            }
        };

        const fetchLots = async () => {
            const result = await LotService.getLots();
            if (result.success) {
                setParkingLots(result.data.lots || []);
            }
        };

        fetchPermitTypes();
        fetchLots();
    }, []);

    // If editing and userId exists, fetch user details
    useEffect(() => {
        if (permit?.userId) {
            const fetchUserDetails = async () => {
                const result = await AdminService.getUserById(permit.userId);
                if (result.success && result.data && result.data.user) {
                    const user = result.data.user;
                    setFormData(prev => ({
                        ...prev,
                        userFullName: user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Unknown',
                        userEmail: user.email || ''
                    }));
                }
            };
            fetchUserDetails();
        }
    }, [permit]);

    // Set default price based on permit type
    useEffect(() => {
        const selectedType = permitTypes.find(type => type.category === formData.permitType);
        if (selectedType) {
            setFormData(prev => ({ ...prev, price: selectedType.price }));
        }
    }, [formData.permitType, permitTypes]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Add handler for removing a lot
    const handleRemoveLot = (index) => {
        if (formData.lots.length > 1) {
            setFormData(prev => ({
                ...prev,
                lots: prev.lots.filter((_, i) => i !== index)
            }));
        }
    };

    // Update handler for changing lot info
    const handleLotChange = (index, lotId, lotName) => {
        const updatedLots = [...formData.lots];
        updatedLots[index] = { lotId, lotName };
        setFormData(prev => ({
            ...prev,
            lots: updatedLots
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Only submit the endDate field to prevent other fields from being updated
        onSubmit({ endDate: formData.endDate });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Permit Type */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Type
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    <select
                        name="permitType"
                        value={formData.permitType}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    >
                        {permitTypes.map(type => (
                            <option key={type._id || type.id} value={type.category}>
                                {type.name} ({type.category})
                            </option>
                        ))}
                    </select>
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
                </div>

                {/* Permit Name */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Name
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    <input
                        type="text"
                        name="permitName"
                        value={formData.permitName}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
                </div>

                {/* User Information - View Only */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        User Full Name
                    </label>
                    <input
                        type="text"
                        name="userFullName"
                        value={formData.userFullName}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                </div>

                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        User Email
                    </label>
                    <input
                        type="email"
                        name="userEmail"
                        value={formData.userEmail}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                </div>

                {/* Start Date */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Start Date
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                </div>

                {/* End Date - Only field that's enabled */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        End Date
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        min={formData.startDate} // Ensure end date is after start date
                    />
                </div>

                {/* Permit Status */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Status
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(automatically managed)</span>
                    </label>
                    <input
                        type="text"
                        name="status"
                        value={formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                </div>

                {/* Payment Status */}
                <div className="mb-4">
                    <label htmlFor="paymentStatus" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Payment Status
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by Stripe)</span>
                    </label>
                    <input
                        type="text"
                        name="paymentStatus"
                        value={formData.paymentStatus.charAt(0).toUpperCase() + formData.paymentStatus.slice(1)}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                </div>

                {/* Price */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Price (USD)
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        step="0.01"
                        min="0"
                        disabled
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                    Update End Date
                </button>
            </div>
        </form>
    );
};

const ManagePermits = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();
    const [permitData, setPermitData] = useState({ permits: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        permitType: '',
        paymentStatus: ''
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPermit, setCurrentPermit] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
    const [permitTypes, setPermitTypes] = useState([]);

    // Function to show toast messages
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'info' });
        }, 3000);
    };

    // Fetch permit types
    useEffect(() => {
        const fetchPermitTypes = async () => {
            const result = await PermitTypeService.getPermitTypes();
            if (result.success) {
                setPermitTypes(result.data.permitTypes || []);
            } else {
                showToast('Failed to load permit types', 'error');
            }
        };
        fetchPermitTypes();
    }, []);

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // Fetch permits based on current filters and pagination
    useEffect(() => {
        const fetchPermits = async () => {
            setIsLoading(true);
            try {
                // Handle special case for expired filter
                let apiFilters = { ...filters, search: searchTerm };
                let clientSideExpiredFilter = false;

                // If filtering for expired permits, we need to:
                // 1. Remove it from the API filters (server doesn't have this status)
                // 2. Remember to filter the results client-side after fetching
                if (apiFilters.status === 'expired') {
                    apiFilters.status = 'active'; // Request active permits from the server
                    clientSideExpiredFilter = true; // But filter for expired ones client-side
                }

                const result = await PermitService.getAll(
                    apiFilters,
                    currentPage,
                    10
                );

                if (result.success) {
                    let filteredPermits = result.permits;

                    // If we're looking for expired permits, filter the active ones by end date
                    if (clientSideExpiredFilter) {
                        const now = new Date();
                        filteredPermits = filteredPermits.filter(permit =>
                            new Date(permit.endDate) < now
                        );

                        // Update pagination for the filtered results
                        result.pagination.total = filteredPermits.length;
                        result.pagination.totalPages = Math.ceil(filteredPermits.length / 10);
                    }

                    setPermitData({
                        permits: filteredPermits,
                        pagination: result.pagination
                    });
                } else {
                    showToast('Failed to fetch permits', 'error');
                }
            } catch (error) {
                console.error('Error fetching permits:', error);
                showToast('An error occurred while fetching permits', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPermits();
    }, [filters, searchTerm, currentPage]);

    // Handle editing a permit
    const handleEditPermit = async (formData) => {
        if (!currentPermit) return;

        try {
            // Format the data for the API - only include the endDate
            const updatedPermitData = {
                endDate: formData.endDate
            };

            const result = await PermitService.update(currentPermit._id || currentPermit.id, updatedPermitData);

            if (result.success) {
                // Update the permit in the UI - only update the endDate
                setPermitData(prevPermitData => ({
                    permits: prevPermitData.permits.map(permit =>
                        permit._id === currentPermit._id || permit.id === currentPermit.id
                            ? { ...permit, endDate: formData.endDate }
                            : permit
                    ),
                    pagination: prevPermitData.pagination
                }));

                setShowEditModal(false);
                setCurrentPermit(null);
                showToast('Permit end date updated successfully', 'success');
            } else {
                throw new Error(result.error || 'Failed to update permit');
            }
        } catch (error) {
            console.error('Error updating permit:', error);
            showToast(error.message || 'Failed to update permit', 'error');
        }
    };

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

    // Handle deleting a permit
    const handleDelete = async (permitId) => {
        if (!permitId) {
            console.error('Cannot delete permit: Missing permit ID');
            showToast('Failed to delete permit: Missing ID', 'error');
            setConfirmDeleteId(null);
            return;
        }

        try {
            const result = await PermitService.delete(permitId);
            // Remove the permit from the UI
            setPermitData(prevData => ({
                ...prevData,
                permits: prevData.permits.filter(permit => permit.id !== permitId && permit._id !== permitId),
                pagination: {
                    ...prevData.pagination,
                    total: prevData.pagination.total - 1
                }
            }));
            setConfirmDeleteId(null); // Close the confirmation dialog
            showToast('Permit deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting permit:', error);
            showToast(error.message || 'Failed to delete permit', 'error');
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
            case 'expired':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'paid':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'refunded':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    };

    // Generate pagination controls
    const renderPagination = () => {
        const { totalPages, currentPage: currPage, total } = permitData.pagination;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                    Showing {(currPage - 1) * 10 + 1}-{Math.min(currPage * 10, total)} of {total} permits
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
                    {Array.from({ length: totalPages }, (_, i) => (
                        <li key={`page-${i + 1}`}>
                            <button
                                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${currentPage === i + 1
                                    ? `${darkMode ? 'bg-gray-700 text-white' : 'bg-blue-50 text-blue-600'}`
                                    : `${darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`
                                    } border ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        </li>
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
        <div className="flex flex-col min-h-screen">
            {/* Manage Nav Header */}
            <div className={`flex justify-between items-center px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={`text-lg p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                        aria-label="Back to Dashboard"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold">Manage Permits</h1>
                </div>
                <button
                    onClick={() => navigate('/admin/permit-types')}
                    className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors`}
                >
                    Manage Permit Types
                </button>
            </div>

            {/* Toast Message */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg ${toast.type === 'success'
                    ? 'bg-green-500 text-white'
                    : toast.type === 'error'
                        ? 'bg-red-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {confirmDeleteId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-md mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                        <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Are you sure you want to delete this permit? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setConfirmDeleteId(null)}
                                className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(confirmDeleteId)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className={`flex-grow p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
                {/* Search and Filter Bar */}
                <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex flex-col md:flex-row md:items-center mb-4">
                        {/* Search Input */}
                        <div className="relative flex-grow mb-4 md:mb-0">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search permits by number, user name, email, or lot..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                    ? 'bg-gray-700 text-white border-gray-600 focus:border-red-500'
                                    : 'bg-white text-gray-900 border-gray-300 focus:border-red-500'
                                    } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex space-x-2 md:ml-2">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`px-4 py-2 rounded-lg border ${darkMode
                                    ? 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                                    : 'bg-white border-gray-300 hover:bg-gray-100'
                                    } flex items-center`}
                            >
                                <FaFilter className="mr-2" />
                                <span>Filter</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Options */}
                    {isFilterOpen && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            {/* Permit Status Filter */}
                            <div>
                                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Permit Status
                                    <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(automatically managed)</span>
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
                                    <option key="active" value="active">Active</option>
                                    <option key="inactive" value="inactive">Inactive</option>
                                    <option key="pending" value="pending">Pending</option>
                                    <option key="expired" value="expired">Expired</option>
                                </select>
                            </div>

                            {/* Payment Status Filter */}
                            <div>
                                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Payment Status
                                    <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by Stripe)</span>
                                </label>
                                <select
                                    value={filters.paymentStatus}
                                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                                >
                                    <option value="">All Payment Statuses</option>
                                    <option key="paid" value="paid">Paid</option>
                                    <option key="refunded" value="refunded">Refunded</option>
                                </select>
                            </div>

                            {/* Permit Type Filter */}
                            <div>
                                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Permit Type
                                </label>
                                <select
                                    value={filters.permitType}
                                    onChange={(e) => handleFilterChange('permitType', e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                                >
                                    <option value="">All Types</option>
                                    {permitTypes.map(type => (
                                        <option key={type.id} value={type.category}>
                                            {type.name} ({type.category})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Permits Table */}
                <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                        </div>
                    ) : permitData.permits.length === 0 ? (
                        <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No permits found matching your criteria
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'}`}>
                                    <tr>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Permit Number
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Permit Name
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            User
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Parking Lots
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Dates
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Payment
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                    {permitData.permits.map((permit, index) => (
                                        <tr key={permit._id || permit.id || index} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                            {/* Permit number */}
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{permit.permitNumber}</div>
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    ID: {permit.id}
                                                </div>
                                            </td>

                                            {/* Permit Name */}
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{permit.permitName}</div>
                                            </td>

                                            {/* Type */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${permit.permitType === 'Faculty'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : permit.permitType === 'Commuter Student'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : permit.permitType === 'Resident Student'
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                    }`}>
                                                    {permit.permitType}
                                                </span>
                                            </td>

                                            {/* User */}
                                            <td className="px-4 py-3">
                                                <div className="font-medium">{permit.userFullName}</div>
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {permit.userEmail}
                                                </div>
                                            </td>

                                            {/* Parking Lot */}
                                            <td className="px-4 py-3">
                                                {permit.lots.map((lot, index) => (
                                                    <div key={index}>
                                                        <div className="font-medium">{lot.lotName}</div>
                                                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            ID: {lot.lotId}
                                                        </div>
                                                        {index < permit.lots.length - 1 && <hr className={`my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />}
                                                    </div>
                                                ))}
                                            </td>

                                            {/* Dates */}
                                            <td className="px-4 py-3">
                                                <div className="text-sm">
                                                    <span className="font-medium">From:</span> {formatDate(permit.startDate)}
                                                </div>
                                                <div className="text-sm">
                                                    <span className="font-medium">To:</span> {formatDate(permit.endDate)}
                                                </div>
                                            </td>

                                            {/* Price */}
                                            <td className="px-4 py-3 font-medium">
                                                {formatCurrency(permit.price)}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3">
                                                {(() => {
                                                    // Check if permit is expired based on end date
                                                    const isExpired = new Date(permit.endDate) < new Date();
                                                    let displayStatus = permit.status;
                                                    let statusStyle = getStatusBadgeStyles(permit.status);

                                                    // If permit is marked as active but has expired, override the display
                                                    if (permit.status === 'active' && isExpired) {
                                                        displayStatus = 'expired';
                                                        statusStyle = 'bg-red-100 text-red-800 border border-red-200';
                                                    }

                                                    return (
                                                        <span className={statusStyle}>
                                                            {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            {/* Payment Status */}
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${permit.paymentStatus === 'paid'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : permit.paymentStatus === 'refunded'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                    {permit.paymentStatus.charAt(0).toUpperCase() + permit.paymentStatus.slice(1)}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3">
                                                <div className="flex space-x-2">
                                                    {/* Edit button */}
                                                    <button
                                                        onClick={() => { setCurrentPermit(permit); setShowEditModal(true); }}
                                                        className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                        title="Edit permit"
                                                    >
                                                        <FaEdit />
                                                    </button>

                                                    {/* Delete button */}
                                                    <button
                                                        onClick={() => setConfirmDeleteId(permit._id || permit.id)}
                                                        className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                        title="Delete permit"
                                                    >
                                                        <FaTrash />
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
                    {permitData.permits.length > 0 && renderPagination()}
                </div>
            </div>

            {/* Edit Permit Modal */}
            {showEditModal && currentPermit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-2xl mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Edit Permit</h3>
                        <PermitForm
                            permit={currentPermit}
                            onSubmit={handleEditPermit}
                            onCancel={() => {
                                setShowEditModal(false);
                                setCurrentPermit(null);
                            }}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePermits; 