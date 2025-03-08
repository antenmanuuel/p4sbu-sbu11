import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaPlus, FaArrowLeft, FaMapMarkerAlt } from 'react-icons/fa';
import { getLots, toggleLotStatus, updateLot, createLot, deleteLot } from '../../utils/mockLotsData';

const ManageLots = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // State for lots data and pagination
    const [lotsData, setLotsData] = useState({ lots: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', permitType: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // State for editing and creating lots
    const [editingLot, setEditingLot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'create'

    // Form state for creating/editing
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        coordinates: [40.9148, -73.1259],
        totalSpaces: 0,
        availableSpaces: 0,
        permitTypes: [],
        hourlyRate: '$0.00',
        status: 'active'
    });

    // Validation state
    const [formErrors, setFormErrors] = useState({});

    // Fetch lots based on current filters and pagination
    useEffect(() => {
        setIsLoading(true);
        const result = getLots(
            { ...filters, search: searchTerm },
            currentPage,
            10
        );
        setLotsData(result);
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

    // Handle lot status toggle
    const handleToggleStatus = (lotId, currentStatus) => {
        let newStatus;
        if (currentStatus === 'active') {
            newStatus = 'inactive';
        } else if (currentStatus === 'inactive') {
            newStatus = 'active';
        } else if (currentStatus === 'maintenance') {
            newStatus = 'active';
        }

        if (newStatus) {
            const success = toggleLotStatus(lotId, newStatus);
            if (success) {
                // Refresh lot data
                const result = getLots(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setLotsData(result);
            }
        }
    };

    // Open edit modal
    const handleEditLot = (lot) => {
        setEditingLot(lot);
        setFormData({
            name: lot.name,
            address: lot.address,
            coordinates: lot.coordinates,
            totalSpaces: lot.totalSpaces,
            availableSpaces: lot.availableSpaces,
            permitTypes: lot.permitTypes,
            hourlyRate: lot.hourlyRate,
            status: lot.status
        });
        setModalMode('edit');
        setIsModalOpen(true);
    };

    // Open create modal
    const handleCreateLot = () => {
        setEditingLot(null);
        setFormData({
            name: '',
            address: '',
            coordinates: [40.9148, -73.1259],
            totalSpaces: 0,
            availableSpaces: 0,
            permitTypes: ['Student', 'Faculty', 'Staff'],
            hourlyRate: '$0.00',
            status: 'active'
        });
        setModalMode('create');
        setIsModalOpen(true);
    };

    // Handle deleting a lot
    const handleDeleteLot = (lotId) => {
        if (window.confirm('Are you sure you want to delete this parking lot? This action cannot be undone.')) {
            const success = deleteLot(lotId);
            if (success) {
                // Refresh lot data
                const result = getLots(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );
                setLotsData(result);
            }
        }
    };

    // Handle form input changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle permit type checkbox changes
    const handlePermitTypeChange = (type) => {
        setFormData(prev => {
            const currentTypes = [...prev.permitTypes];
            if (currentTypes.includes(type)) {
                return { ...prev, permitTypes: currentTypes.filter(t => t !== type) };
            } else {
                return { ...prev, permitTypes: [...currentTypes, type] };
            }
        });
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }

        if (!formData.address.trim()) {
            errors.address = "Address is required";
        }

        if (!formData.totalSpaces || formData.totalSpaces <= 0) {
            errors.totalSpaces = "Total spaces must be greater than 0";
        }

        if (formData.availableSpaces < 0 || formData.availableSpaces > formData.totalSpaces) {
            errors.availableSpaces = "Available spaces must be between 0 and total spaces";
        }

        if (formData.permitTypes.length === 0) {
            errors.permitTypes = "At least one permit type is required";
        }

        if (!formData.hourlyRate.trim() || !formData.hourlyRate.includes('$')) {
            errors.hourlyRate = "Hourly rate must be in format $X.XX";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmitForm = () => {
        if (!validateForm()) return;

        let success;
        if (modalMode === 'edit') {
            success = updateLot(editingLot.id, formData);
        } else {
            success = createLot(formData);
        }

        if (success) {
            setIsModalOpen(false);
            // Refresh lot data
            const result = getLots(
                { ...filters, search: searchTerm },
                currentPage,
                10
            );
            setLotsData(result);
        }
    };

    // Get status badge style
    const getStatusBadgeStyles = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'inactive':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // Generate pagination controls
    const renderPagination = () => {
        const { totalPages, currentPage: currPage, total } = lotsData.pagination;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                    Showing {(currPage - 1) * 10 + 1}-{Math.min(currPage * 10, total)} of {total} lots
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

    // Render the form modal
    const renderFormModal = () => {
        if (!isModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {modalMode === 'edit' ? 'Edit Parking Lot' : 'Create New Parking Lot'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-black'}`}
                            >
                                <FaTimesCircle className="text-xl" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Lot Name*
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${formErrors.name ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                />
                                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
                            </div>

                            {/* Address */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Address*
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${formErrors.address ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                />
                                {formErrors.address && <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>}
                            </div>

                            {/* Coordinates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Latitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.coordinates[0]}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            coordinates: [parseFloat(e.target.value), prev.coordinates[1]]
                                        }))}
                                        className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Longitude
                                    </label>
                                    <input
                                        type="number"
                                        step="0.0001"
                                        value={formData.coordinates[1]}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            coordinates: [prev.coordinates[0], parseFloat(e.target.value)]
                                        }))}
                                        className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    />
                                </div>
                            </div>

                            {/* Capacity */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Total Spaces*
                                    </label>
                                    <input
                                        type="number"
                                        name="totalSpaces"
                                        value={formData.totalSpaces}
                                        onChange={handleFormChange}
                                        className={`w-full px-3 py-2 border ${formErrors.totalSpaces ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    />
                                    {formErrors.totalSpaces && <p className="text-red-500 text-xs mt-1">{formErrors.totalSpaces}</p>}
                                </div>
                                <div>
                                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Available Spaces
                                    </label>
                                    <input
                                        type="number"
                                        name="availableSpaces"
                                        value={formData.availableSpaces}
                                        onChange={handleFormChange}
                                        className={`w-full px-3 py-2 border ${formErrors.availableSpaces ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    />
                                    {formErrors.availableSpaces && <p className="text-red-500 text-xs mt-1">{formErrors.availableSpaces}</p>}
                                </div>
                            </div>

                            {/* Hourly Rate */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Hourly Rate*
                                </label>
                                <input
                                    type="text"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${formErrors.hourlyRate ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    placeholder="$0.00"
                                />
                                {formErrors.hourlyRate && <p className="text-red-500 text-xs mt-1">{formErrors.hourlyRate}</p>}
                            </div>

                            {/* Status */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Status
                                </label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>

                            {/* Permit Types */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Permit Types*
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['Student', 'Faculty', 'Staff', 'Visitor', 'Medical', 'Resident', 'Event', 'Admin'].map(type => (
                                        <div key={type} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={`type-${type}`}
                                                checked={formData.permitTypes.includes(type)}
                                                onChange={() => handlePermitTypeChange(type)}
                                                className="mr-2"
                                            />
                                            <label htmlFor={`type-${type}`} className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                                {type}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                                {formErrors.permitTypes && <p className="text-red-500 text-xs mt-1">{formErrors.permitTypes}</p>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitForm}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                                >
                                    {modalMode === 'edit' ? 'Save Changes' : 'Create Lot'}
                                </button>
                            </div>
                        </div>
                    </div>
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
                <h1 className="text-2xl font-bold">Manage Parking Lots</h1>
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
                                placeholder="Search lots by name, address, or ID..."
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

                    {/* Add Lot Button */}
                    <button
                        onClick={handleCreateLot}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Add Lot
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
                                <option value="maintenance">Maintenance</option>
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
                                <option value="">All Permit Types</option>
                                <option value="student">Student</option>
                                <option value="faculty">Faculty</option>
                                <option value="staff">Staff</option>
                                <option value="visitor">Visitor</option>
                                <option value="resident">Resident</option>
                                <option value="medical">Medical</option>
                                <option value="event">Event</option>
                            </select>
                        </div>

                        {/* Reset Filters Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: '', permitType: '' });
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

            {/* Lots Table */}
            <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : lotsData.lots.length === 0 ? (
                    <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No lots found matching your criteria
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Lot Name
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Address
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Capacity
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Rate
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Status
                                    </th>
                                    <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                {lotsData.lots.map((lot) => (
                                    <tr key={lot.id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FaMapMarkerAlt className="text-red-500 mr-2" />
                                                <div>
                                                    <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                        {lot.name}
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        ID: {lot.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {lot.address}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {lot.availableSpaces} / {lot.totalSpaces}
                                            </div>
                                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                                                <div
                                                    className="bg-blue-600 h-2 rounded-full"
                                                    style={{ width: `${(lot.availableSpaces / lot.totalSpaces) * 100}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                {lot.hourlyRate}/hour
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(lot.status)}`}>
                                                {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditLot(lot)}
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Edit Lot"
                                                >
                                                    <FaEdit className="text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(lot.id, lot.status)}
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title={lot.status === 'active' ? 'Set Inactive' : 'Set Active'}
                                                >
                                                    {lot.status === 'active' ? (
                                                        <FaTimesCircle className="text-yellow-500" />
                                                    ) : (
                                                        <FaCheckCircle className="text-green-500" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLot(lot.id)}
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Delete Lot"
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
                {lotsData.lots.length > 0 && renderPagination()}
            </div>

            {/* Modal for editing/creating lots */}
            {renderFormModal()}
        </div>
    );
};

export default ManageLots; 