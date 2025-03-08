import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaLock, FaLockOpen, FaPlusCircle, FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getPermits, togglePermitStatus, deletePermit, updatePermitPaymentStatus, createPermit, updatePermit } from '../../utils/mockPermitData';
import { mockUsers } from '../../utils/mockUserData';

// New Permit Form Component
const PermitForm = ({ permit = null, onSubmit, onCancel, darkMode }) => {
    const [formData, setFormData] = useState({
        permitType: permit?.permitType || 'Student',
        userId: permit?.userId || '',
        lotId: permit?.lotId || 'L001',
        lotName: permit?.lotName || 'South P Lot',
        startDate: permit?.startDate || new Date().toISOString().split('T')[0],
        endDate: permit?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
        status: permit?.status || 'active',
        price: permit?.price || 125.00,
        paymentStatus: permit?.paymentStatus || 'unpaid',
        userFullName: permit?.userFullName || '',
        userEmail: permit?.userEmail || ''
    });

    // Load user information when userId changes
    useEffect(() => {
        if (formData.userId) {
            const user = mockUsers.find(u => u.id === formData.userId);
            if (user) {
                setFormData(prev => ({
                    ...prev,
                    userFullName: `${user.firstName} ${user.lastName}`,
                    userEmail: user.email
                }));
            }
        }
    }, [formData.userId]);

    // Set default price based on permit type
    useEffect(() => {
        if (formData.permitType === 'Student') {
            setFormData(prev => ({ ...prev, price: 125.00 }));
        } else if (formData.permitType === 'Faculty') {
            setFormData(prev => ({ ...prev, price: 275.00 }));
        } else if (formData.permitType === 'Staff') {
            setFormData(prev => ({ ...prev, price: 250.00 }));
        } else if (formData.permitType === 'Visitor') {
            setFormData(prev => ({ ...prev, price: 30.00 }));
        }
    }, [formData.permitType]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Available parking lots
    const parkingLots = [
        { id: 'L001', name: 'South P Lot' },
        { id: 'L002', name: 'Faculty Lot 1' },
        { id: 'L003', name: 'Stadium Lot' },
        { id: 'L004', name: 'Faculty Lot 2' },
        { id: 'L005', name: 'Visitor Lot' },
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Permit Type */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Type
                    </label>
                    <select
                        name="permitType"
                        value={formData.permitType}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    >
                        <option value="Student">Student</option>
                        <option value="Faculty">Faculty</option>
                        <option value="Staff">Staff</option>
                        <option value="Visitor">Visitor</option>
                    </select>
                </div>

                {/* User Selection */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        User
                    </label>
                    <select
                        name="userId"
                        value={formData.userId}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                    >
                        <option value="">Select User</option>
                        {mockUsers.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.firstName} {user.lastName} ({user.email})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Lot Selection */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Parking Lot
                    </label>
                    <select
                        name="lotId"
                        value={formData.lotId}
                        onChange={(e) => {
                            const selectedLot = parkingLots.find(lot => lot.id === e.target.value);
                            setFormData(prev => ({
                                ...prev,
                                lotId: e.target.value,
                                lotName: selectedLot ? selectedLot.name : ''
                            }));
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    >
                        {parkingLots.map(lot => (
                            <option key={lot.id} value={lot.id}>
                                {lot.name} ({lot.id})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Price */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Price
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        step="0.01"
                        min="0"
                        required
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
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    />
                </div>

                {/* End Date */}
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
                        required
                    />
                </div>

                {/* Status */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Status
                    </label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="pending">Pending</option>
                    </select>
                </div>

                {/* Payment Status */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Payment Status
                    </label>
                    <select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="refunded">Refunded</option>
                    </select>
                </div>
            </div>

            {/* Manual User Info for Visitor Permits */}
            {formData.permitType === 'Visitor' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div>
                        <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="userFullName"
                            value={formData.userFullName}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                            required={formData.permitType === 'Visitor'}
                        />
                    </div>
                    <div>
                        <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="userEmail"
                            value={formData.userEmail}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                            required={formData.permitType === 'Visitor'}
                        />
                    </div>
                </div>
            )}

            {/* Form Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                    {permit ? 'Update Permit' : 'Create Permit'}
                </button>
            </div>
        </form>
    );
};

const ManagePermits = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // State for permit data and pagination
    const [permitData, setPermitData] = useState({ permits: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', permitType: '', paymentStatus: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPermit, setCurrentPermit] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Fetch permits based on current filters and pagination
    useEffect(() => {
        setIsLoading(true);
        const result = getPermits(
            { ...filters, search: searchTerm },
            currentPage,
            10
        );
        setPermitData(result);
        setIsLoading(false);
    }, [filters, searchTerm, currentPage]);

    // Handle adding a new permit
    const handleAddPermit = (formData) => {
        const newPermit = createPermit(formData);
        if (newPermit) {
            setShowAddModal(false);
            // Refresh permit data
            const result = getPermits(
                { ...filters, search: searchTerm },
                currentPage,
                10
            );
            setPermitData(result);
        }
    };

    // Handle editing a permit
    const handleEditPermit = (formData) => {
        if (currentPermit) {
            const updatedPermit = updatePermit(currentPermit.id, formData);
            if (updatedPermit) {
                setShowEditModal(false);
                setCurrentPermit(null);
                // Refresh permit data
                const result = getPermits(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setPermitData(result);
            }
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

    // Handle permit status toggle
    const handleToggleStatus = (permitId, currentStatus) => {
        let newStatus;
        if (currentStatus === 'active') {
            newStatus = 'inactive';
        } else if (currentStatus === 'inactive') {
            newStatus = 'active';
        } else if (currentStatus === 'pending') {
            newStatus = 'active';
        }

        if (newStatus) {
            const success = togglePermitStatus(permitId, newStatus);
            if (success) {
                // Refresh permit data
                const result = getPermits(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setPermitData(result);
            }
        }
    };

    // Handle permit payment status update
    const handleUpdatePaymentStatus = (permitId, currentPaymentStatus) => {
        let newPaymentStatus;
        if (currentPaymentStatus === 'unpaid') {
            newPaymentStatus = 'paid';
        } else if (currentPaymentStatus === 'paid') {
            newPaymentStatus = 'refunded';
        } else if (currentPaymentStatus === 'refunded') {
            newPaymentStatus = 'unpaid';
        }

        if (newPaymentStatus) {
            const success = updatePermitPaymentStatus(permitId, newPaymentStatus);
            if (success) {
                // Refresh permit data
                const result = getPermits(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setPermitData(result);
            }
        }
    };

    // Handle permit delete
    const handleDelete = (permitId) => {
        if (permitId) {
            const success = deletePermit(permitId);
            if (success) {
                setConfirmDeleteId(null);
                // Refresh permit data
                const result = getPermits(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setPermitData(result);
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
            case 'paid':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'unpaid':
                return 'bg-red-100 text-red-800 border border-red-200';
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
                <h1 className="text-2xl font-bold">Manage Permits</h1>
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
                                placeholder="Search permits by number, user name, email, or lot..."
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

                    {/* Add New Permit Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        <FaPlusCircle className="mr-2" />
                        Add Permit
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
                                <option value="Student">Student</option>
                                <option value="Faculty">Faculty</option>
                                <option value="Staff">Staff</option>
                                <option value="Visitor">Visitor</option>
                            </select>
                        </div>

                        {/* Payment Status Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Payment Status
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
                                <option value="paid">Paid</option>
                                <option value="unpaid">Unpaid</option>
                                <option value="refunded">Refunded</option>
                            </select>
                        </div>

                        {/* Reset Filters Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: '', permitType: '', paymentStatus: '' });
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
                            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Permit
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        User
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Type
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Lot
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Dates
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Status
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Payment
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                {permitData.permits.map((permit) => (
                                    <tr key={permit.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                        {permit.permitNumber}
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        ID: {permit.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {permit.userFullName}
                                            </div>
                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {permit.userEmail}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                                          ${permit.permitType === 'Student'
                                                    ? 'bg-green-100 text-green-800'
                                                    : permit.permitType === 'Faculty'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : permit.permitType === 'Staff'
                                                            ? 'bg-purple-100 text-purple-800'
                                                            : 'bg-yellow-100 text-yellow-800'}`}>
                                                {permit.permitType}
                                            </span>
                                            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {formatCurrency(permit.price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {permit.lotName}
                                            </div>
                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Lot ID: {permit.lotId}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {permit.startDate} - {permit.endDate}
                                            </div>
                                            <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Created: {permit.createdAt}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(permit.status)}`}>
                                                {permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(permit.paymentStatus)}`}>
                                                {permit.paymentStatus.charAt(0).toUpperCase() + permit.paymentStatus.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Edit Permit"
                                                    onClick={() => {
                                                        setCurrentPermit(permit);
                                                        setShowEditModal(true);
                                                    }}
                                                >
                                                    <FaEdit className="text-blue-500" />
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title={permit.status === 'active' ? 'Deactivate Permit' : 'Activate Permit'}
                                                    onClick={() => handleToggleStatus(permit.id, permit.status)}
                                                >
                                                    {permit.status === 'active' ? (
                                                        <FaLock className="text-yellow-500" />
                                                    ) : (
                                                        <FaLockOpen className="text-green-500" />
                                                    )}
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Toggle Payment Status"
                                                    onClick={() => handleUpdatePaymentStatus(permit.id, permit.paymentStatus)}
                                                >
                                                    {permit.paymentStatus === 'paid' ? (
                                                        <FaCheckCircle className="text-green-500" />
                                                    ) : permit.paymentStatus === 'unpaid' ? (
                                                        <FaTimesCircle className="text-red-500" />
                                                    ) : (
                                                        <FaCheckCircle className="text-blue-500" />
                                                    )}
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Delete Permit"
                                                    onClick={() => setConfirmDeleteId(permit.id)}
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
                {permitData.permits.length > 0 && renderPagination()}
            </div>

            {/* Confirmation Dialog for Delete */}
            {confirmDeleteId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-sm mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                        <p className="mb-6">Are you sure you want to delete this permit? This action cannot be undone.</p>
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

            {/* Add Permit Modal */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-2xl mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Add New Permit</h3>
                        <PermitForm
                            onSubmit={handleAddPermit}
                            onCancel={() => setShowAddModal(false)}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}

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