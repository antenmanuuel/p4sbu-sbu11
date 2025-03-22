import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaPlusCircle, FaArrowLeft } from 'react-icons/fa';
import { getPermitTypes, createPermitType, updatePermitType, deletePermitType } from '../../utils/mockPermitData';
import { mockLots } from '../../utils/mockLotsData';

// Permit Type Form Component
const PermitTypeForm = ({ permitType = null, onSubmit, onCancel, darkMode }) => {
    const [formData, setFormData] = useState({
        name: permitType?.name || '',
        quantity: permitType?.quantity || 100,
        startDate: permitType?.startDate || new Date().toISOString().split('T')[0],
        endDate: permitType?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
        lots: permitType?.lots || [],
        price: permitType?.price || 0.00,
        category: permitType?.category || 'Student',
        duration: permitType?.duration || 'Semester',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Permit Type Name */}
                <div className="md:col-span-2">
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Type Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter permit type name"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    />
                </div>

                {/* Permit Category */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Permit Category
                    </label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    >
                        <option value="Faculty">Faculty</option>
                        <option value="Student">Student</option>
                        <option value="Staff">Staff</option>
                        <option value="Visitor">Visitor</option>
                    </select>
                </div>

                {/* Quantity */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Quantity Available
                    </label>
                    <input
                        type="number"
                        name="quantity"
                        value={formData.quantity}
                        onChange={handleChange}
                        min="1"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    />
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
                        step="0.01"
                        min="0"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    />
                </div>

                {/* Duration - Hidden field, always set to Semester */}
                <input
                    type="hidden"
                    name="duration"
                    value="Semester"
                />

                {/* Start Date */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Semester Start Date
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
                        Semester End Date
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        min={formData.startDate}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                        required
                    />
                </div>

                {/* Available Lots */}
                <div className="md:col-span-2">
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Available Parking Lots
                    </label>
                    <div className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} overflow-y-auto max-h-[250px]`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {mockLots.map(lot => (
                                <div
                                    key={lot.id}
                                    className={`flex items-center p-2 rounded ${formData.lots.includes(lot.id)
                                        ? (darkMode ? 'bg-gray-600' : 'bg-gray-100')
                                        : ''
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        id={`lot-${lot.id}`}
                                        value={lot.id}
                                        checked={formData.lots.includes(lot.id)}
                                        onChange={(e) => {
                                            const lotId = e.target.value;
                                            if (e.target.checked) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    lots: [...prev.lots, lotId]
                                                }));
                                            } else {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    lots: prev.lots.filter(id => id !== lotId)
                                                }));
                                            }
                                        }}
                                        className="mr-2"
                                    />
                                    <label
                                        htmlFor={`lot-${lot.id}`}
                                        className="flex flex-1 cursor-pointer"
                                    >
                                        <span className="font-medium">{lot.name}</span>
                                        <span className="ml-2 text-xs text-gray-500">({lot.id})</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-2 flex justify-between text-xs">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                            {formData.lots.length} lot{formData.lots.length !== 1 ? 's' : ''} selected
                        </span>
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lots: mockLots.map(lot => lot.id) }))}
                                className={`text-blue-600 hover:underline ${darkMode ? 'text-blue-400' : ''}`}
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, lots: [] }))}
                                className={`text-blue-600 hover:underline ${darkMode ? 'text-blue-400' : ''}`}
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                </div>
            </div>

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
                    {permitType ? 'Update Permit Type' : 'Create Permit Type'}
                </button>
            </div>
        </form>
    );
};

const ManagePermitTypes = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();
    const [permitTypeData, setPermitTypeData] = useState({ permitTypes: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [currentPermitType, setCurrentPermitType] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // Function to show toast messages
    const showToast = (message, type = 'info') => {
        setToast({ show: true, message, type });
        // Auto-hide toast after 3 seconds
        setTimeout(() => {
            setToast({ show: false, message: '', type: 'info' });
        }, 3000);
    };

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // Fetch permit types
    useEffect(() => {
        setIsLoading(true);
        const result = getPermitTypes(
            { search: searchTerm },
            currentPage,
            10
        );
        setPermitTypeData(result);
        setIsLoading(false);
    }, [searchTerm, currentPage]);

    // Handle add permit type
    const handleAddPermitType = (formData) => {
        try {
            const newPermitType = createPermitType(formData);
            console.log('New permit type created:', newPermitType);

            // Update list with new permit type
            setPermitTypeData(prevData => ({
                permitTypes: [newPermitType, ...prevData.permitTypes],
                pagination: prevData.pagination
            }));

            // Close dialog and show success message
            setShowAddModal(false);
            showToast('Permit type created successfully', 'success');
        } catch (error) {
            console.error('Error creating permit type:', error);
            showToast('Failed to create permit type', 'error');
        }
    };

    // Handle edit permit type
    const handleEditPermitType = (formData) => {
        if (!currentPermitType) return;

        try {
            const success = updatePermitType(currentPermitType.id, formData);
            if (success) {
                // Refetch the data to get the updated permit types
                const result = getPermitTypes(
                    { search: searchTerm },
                    currentPage,
                    10
                );
                setPermitTypeData(result);

                // Close dialog and show success message
                setShowEditModal(false);
                setCurrentPermitType(null);
                showToast('Permit type updated successfully', 'success');
            } else {
                throw new Error('Failed to update permit type');
            }
        } catch (error) {
            console.error('Error updating permit type:', error);
            showToast('Failed to update permit type', 'error');
        }
    };

    // Handle delete permit type
    const handleDelete = (typeId) => {
        if (typeId) {
            try {
                const success = deletePermitType(typeId);
                if (success) {
                    // Update UI by removing the deleted permit type
                    setPermitTypeData(prevData => ({
                        permitTypes: prevData.permitTypes.filter(type => type.id !== typeId),
                        pagination: {
                            ...prevData.pagination,
                            total: prevData.pagination.total - 1
                        }
                    }));

                    setConfirmDeleteId(null);
                    showToast('Permit type deleted successfully', 'success');
                } else {
                    throw new Error('Failed to delete permit type');
                }
            } catch (error) {
                console.error('Error deleting permit type:', error);
                showToast('Failed to delete permit type', 'error');
            }
        }
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Format date range for display
    const formatDateRange = (startDate, endDate) => {
        if (!startDate || !endDate) return 'Date range not specified';

        const formatDate = (dateString) => {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };

        return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    };

    // Generate pagination controls
    const renderPagination = () => {
        const { totalPages, currentPage: currPage, total } = permitTypeData.pagination;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                    Showing {(currPage - 1) * 10 + 1}-{Math.min(currPage * 10, total)} of {total} permit types
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
                <h1 className="text-2xl font-bold">Manage Permit Types</h1>
            </div>

            {/* Search and Add Controls */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-grow">
                        <div className={`flex items-center px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <FaSearch className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search permit types by name..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={`w-full bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
                            />
                        </div>
                    </div>

                    {/* Add New Permit Type Button */}
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        <FaPlusCircle className="mr-2" />
                        Add Permit Type
                    </button>
                </div>
            </div>

            {/* Permit Types Table */}
            <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : permitTypeData.permitTypes.length === 0 ? (
                    <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No permit types found matching your criteria
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'}`}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Quantity
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Semester Period
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Lots
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                {permitTypeData.permitTypes.map(type => (
                                    <tr
                                        key={type.id}
                                        className={`border-t ${darkMode
                                            ? 'border-gray-700 hover:bg-gray-800'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            } transition-colors`}
                                    >
                                        {/* ID */}
                                        <td className="px-4 py-3 text-sm">
                                            {type.id}
                                        </td>

                                        {/* Name */}
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{type.name}</div>
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full 
                                                ${type.category === 'Faculty'
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : type.category === 'Student'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                        : type.category === 'Staff'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                }`}
                                            >
                                                {type.category}
                                            </span>
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center">
                                                <span className={`font-medium ${type.quantity <= 0
                                                    ? 'text-red-500 dark:text-red-400'
                                                    : type.quantity < 50
                                                        ? 'text-orange-500 dark:text-orange-400'
                                                        : 'text-green-500 dark:text-green-400'
                                                    }`}>
                                                    {type.quantity}
                                                </span>
                                                {type.quantity <= 0 && (
                                                    <span className="ml-2 text-xs text-red-500 dark:text-red-400">
                                                        (Sold Out)
                                                    </span>
                                                )}
                                                {type.quantity > 0 && type.quantity < 50 && (
                                                    <span className="ml-2 text-xs text-orange-500 dark:text-orange-400">
                                                        (Low Stock)
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Semester Period */}
                                        <td className="px-4 py-3">
                                            {formatDateRange(type.startDate, type.endDate)}
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-3">
                                            ${type.price.toFixed(2)}
                                        </td>

                                        {/* Lots */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {type.lots.map(lot => {
                                                    // Check if it's an object with lotId or a string
                                                    const lotId = typeof lot === 'object' ? lot.lotId : lot;
                                                    const lotName = typeof lot === 'object' ? lot.lotName : null;

                                                    // If it's an object with lotName, use that, otherwise look it up
                                                    const displayName = lotName || (mockLots.find(l => l.id === lotId)?.name || lotId);

                                                    return (
                                                        <span
                                                            key={lotId}
                                                            className={`inline-block px-2 py-1 text-xs font-medium rounded-full 
                                                                ${darkMode
                                                                    ? 'bg-gray-700 text-gray-300'
                                                                    : 'bg-gray-200 text-gray-700'}`}
                                                        >
                                                            {displayName}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                {/* Edit button */}
                                                <button
                                                    onClick={() => { setCurrentPermitType(type); setShowEditModal(true); }}
                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="Edit permit type"
                                                >
                                                    <FaEdit />
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    onClick={() => setConfirmDeleteId(type.id)}
                                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                    title="Delete permit type"
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
                {permitTypeData.permitTypes.length > 0 && renderPagination()}
            </div>

            {/* Confirmation Dialog for Delete */}
            {confirmDeleteId && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-sm mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Confirm Delete</h3>
                        <p className="mb-6">Are you sure you want to delete this permit type? This action cannot be undone.</p>
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

            {/* Add Permit Type Modal */}
            {showAddModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-2xl mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Add New Permit Type</h3>
                        <PermitTypeForm
                            onSubmit={handleAddPermitType}
                            onCancel={() => setShowAddModal(false)}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}

            {/* Edit Permit Type Modal */}
            {showEditModal && currentPermitType && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className={`p-6 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} w-full max-w-2xl mx-auto`}>
                        <h3 className="text-lg font-bold mb-4">Edit Permit Type</h3>
                        <PermitTypeForm
                            permitType={currentPermitType}
                            onSubmit={handleEditPermitType}
                            onCancel={() => {
                                setShowEditModal(false);
                                setCurrentPermitType(null);
                            }}
                            darkMode={darkMode}
                        />
                    </div>
                </div>
            )}

            {/* Toast notification */}
            {toast.show && (
                <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-md shadow-lg ${toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                        'bg-blue-500 text-white'
                    } transition-opacity duration-300`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

export default ManagePermitTypes; 