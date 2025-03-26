import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaLock, FaLockOpen, FaArrowLeft, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { getPermits, togglePermitStatus, deletePermit, updatePermitPaymentStatus, createPermit, updatePermit, getPermitTypes } from '../../utils/mockPermitData';
import { mockUsers } from '../../utils/mockUserData';

// Mock payments for demonstration (this would come from your payment API in a real app)
const mockPayments = [
    { id: 'PAY001', userDetails: { userId: '1001', name: 'John Doe', email: 'john.doe@stonybrook.edu' }, amount: 125.00, status: 'completed' },
    { id: 'PAY002', userDetails: { userId: '1002', name: 'Jane Smith', email: 'jane.smith@stonybrook.edu' }, amount: 275.00, status: 'pending' },
    { id: 'PAY003', userDetails: { userId: '1003', name: 'Robert Johnson', email: 'robert.johnson@stonybrook.edu' }, amount: 250.00, status: 'completed' },
];

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
        startDate: permit?.startDate || new Date().toISOString().split('T')[0],
        endDate: permit?.endDate || new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0],
        status: permit?.status || 'active',
        price: permit?.price || 125.00,
        paymentStatus: permit?.paymentStatus || 'unpaid',
        userFullName: permit?.userFullName || '',
        userEmail: permit?.userEmail || '',
        paymentId: permit?.paymentId || '',
    });

    const [permitTypes, setPermitTypes] = useState([]);

    // Load permit types when the form loads
    useEffect(() => {
        const fetchPermitTypes = () => {
            const result = getPermitTypes({}, 1, 100);
            setPermitTypes(result.permitTypes);
        };
        fetchPermitTypes();
    }, []);

    // If editing, set the payment ID and related fields from the permit data
    useEffect(() => {
        if (permit?.paymentId) {
            const payment = mockPayments.find(p => p.id === permit.paymentId);
            if (payment) {
                setFormData(prev => ({
                    ...prev,
                    paymentId: permit.paymentId,
                    userId: payment.userDetails.userId,
                    userFullName: payment.userDetails.name,
                    userEmail: payment.userDetails.email,
                    paymentStatus: payment.status === 'completed' ? 'paid' : 'unpaid'
                }));
            }
        }
    }, [permit]);

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
                            <option key={type.id} value={type.category}>
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
                        onChange={handleChange}
                        placeholder="Enter permit name"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
                </div>

                {/* Payment Selection (which includes user information) */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Payment (User)
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(set in payment form)</span>
                    </label>
                    <select
                        name="paymentId"
                        value={formData.paymentId}
                        onChange={(e) => {
                            const paymentId = e.target.value;
                            const payment = mockPayments.find(p => p.id === paymentId);
                            if (payment) {
                                setFormData(prev => ({
                                    ...prev,
                                    paymentId,
                                    userId: payment.userDetails.userId,
                                    userFullName: payment.userDetails.name,
                                    userEmail: payment.userDetails.email,
                                    paymentStatus: payment.status === 'completed' ? 'paid' : 'unpaid'
                                }));
                            } else {
                                setFormData(prev => ({
                                    ...prev,
                                    paymentId: '',
                                    userId: '',
                                    userFullName: '',
                                    userEmail: '',
                                }));
                            }
                        }}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    >
                        <option value="">Select Payment</option>
                        {mockPayments.map(payment => (
                            <option key={payment.id} value={payment.id}>
                                {payment.userDetails.name} - ${payment.amount} ({payment.status})
                            </option>
                        ))}
                    </select>
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        User information and payment status should be managed in the payment form
                    </div>

                    {/* Display user info from the selected payment */}
                    {formData.userId && (
                        <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <div className="font-medium">{formData.userFullName}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {formData.userEmail}
                            </div>
                        </div>
                    )}
                </div>

                {/* Multiple Lot Selection */}
                <div className="md:col-span-2">
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Parking Lots
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    {formData.lots.map((lot, index) => (
                        <div key={index} className="flex items-center mb-2 gap-2">
                            <select
                                value={lot.lotId}
                                onChange={(e) => {
                                    const selectedLot = parkingLots.find(l => l.id === e.target.value);
                                    handleLotChange(index, e.target.value, selectedLot ? selectedLot.name : '');
                                }}
                                className={`flex-1 px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                                disabled
                            >
                                <option value="">Select Lot</option>
                                {parkingLots.map(lot => (
                                    <option key={lot.id} value={lot.id}>
                                        {lot.name} ({lot.id})
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => handleRemoveLot(index)}
                                className="p-2 text-red-500 hover:text-red-700 opacity-50 cursor-not-allowed"
                                disabled
                            >
                                <FaTrash />
                            </button>
                        </div>
                    ))}
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Parking lots are defined in Manage Permit Types
                    </div>
                </div>

                {/* Price */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Price
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        step="0.01"
                        min="0"
                        disabled
                    />
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
                </div>

                {/* Start Date */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Start Date
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
                </div>

                {/* End Date */}
                <div>
                    <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        End Date
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(managed by permit types)</span>
                    </label>
                    <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    />
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is defined in Manage Permit Types
                    </div>
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
                        <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(set by payment)</span>
                    </label>
                    <select
                        name="paymentStatus"
                        value={formData.paymentStatus}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600 opacity-75' : 'bg-gray-100 text-gray-900 border-gray-300 opacity-75'} focus:outline-none cursor-not-allowed`}
                        disabled
                    >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="refunded">Refunded</option>
                    </select>
                    <div className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        This is automatically set based on the selected payment
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
                    {permit ? 'Update Permit' : 'Create Permit'}
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
        const fetchPermitTypes = () => {
            const result = getPermitTypes({}, 1, 100);
            setPermitTypes(result.permitTypes);
        };
        fetchPermitTypes();
    }, []);

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

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

    // Handle adding a permit
    const handleAddPermit = (formData) => {
        // In a real application, you would validate that a payment was selected
        // Since payment field is disabled, we would get this data from a separate payment form
        // For demo purposes, we'll use a default payment if none is selected
        const paymentId = formData.paymentId || 'PAY001';
        const payment = mockPayments.find(p => p.id === paymentId);

        // Default values if no payment is selected
        let userId = formData.userId;
        let userFullName = formData.userFullName;
        let userEmail = formData.userEmail;
        let paymentStatus = 'unpaid';

        // If payment is found, use its data
        if (payment) {
            userId = payment.userDetails.userId;
            userFullName = payment.userDetails.name;
            userEmail = payment.userDetails.email;
            paymentStatus = payment.status === 'completed' ? 'paid' : 'unpaid';
        }

        // Prepare the data for the API
        const newPermitData = {
            permitType: formData.permitType,
            permitName: formData.permitName,
            userId: userId,
            userFullName: userFullName,
            userEmail: userEmail,
            lots: formData.lots,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            price: parseFloat(formData.price),
            paymentStatus: paymentStatus,
            paymentId: paymentId,
            permitTypeId: formData.permitTypeId // Ensure permitTypeId is included
        };

        // Create the permit using the API function
        try {
            const newPermit = createPermit(newPermitData);
            console.log('New permit created:', newPermit);

            // Update permit list with the new permit
            setPermitData(prevPermitData => ({
                permits: [newPermit, ...prevPermitData.permits],
                pagination: prevPermitData.pagination
            }));

            // Close the dialog and reset form
            setShowAddModal(false);
            showToast('Permit created successfully', 'success');
        } catch (error) {
            console.error('Error creating permit:', error);
            let errorMessage = 'Failed to create permit';
            // Check if it's a quantity error
            if (error.message && error.message.includes('No more')) {
                errorMessage = error.message;
            }
            showToast(errorMessage, 'error');
        }
    };

    // Handle editing a permit
    const handleEditPermit = (formData) => {
        // Check if we have a permit to edit
        if (!currentPermit) return;

        // In a real application, you would validate that a payment was selected
        // Since payment field is disabled, we would get this data from a separate payment form
        // For demo, we'll keep the existing payment or use a default
        const paymentId = formData.paymentId || currentPermit.paymentId || 'PAY001';
        const payment = mockPayments.find(p => p.id === paymentId);

        // Default to current values from the permit
        let userId = currentPermit.userId;
        let userFullName = currentPermit.userFullName;
        let userEmail = currentPermit.userEmail;
        let paymentStatus = currentPermit.paymentStatus;

        // If payment is found, use its data
        if (payment) {
            userId = payment.userDetails.userId;
            userFullName = payment.userDetails.name;
            userEmail = payment.userDetails.email;
            paymentStatus = payment.status === 'completed' ? 'paid' : 'unpaid';
        }

        // Prepare the data for the API
        const updatedPermitData = {
            permitType: formData.permitType,
            permitName: formData.permitName,
            userId: userId,
            userFullName: userFullName,
            userEmail: userEmail,
            lots: formData.lots,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            price: parseFloat(formData.price),
            paymentStatus: paymentStatus,
            paymentId: paymentId,
            permitTypeId: formData.permitTypeId // Ensure permitTypeId is included
        };

        // Update the permit using the API function
        try {
            const success = updatePermit(currentPermit.id, updatedPermitData);
            if (success) {
                // Update the permit in the UI
                setPermitData(prevPermitData => ({
                    permits: prevPermitData.permits.map(permit =>
                        permit.id === currentPermit.id
                            ? { ...permit, ...updatedPermitData }
                            : permit
                    ),
                    pagination: prevPermitData.pagination
                }));

                // Close the dialog
                setShowEditModal(false);
                setCurrentPermit(null);
                showToast('Permit updated successfully', 'success');
            } else {
                throw new Error('Failed to update permit');
            }
        } catch (error) {
            console.error('Error updating permit:', error);
            let errorMessage = 'Failed to update permit';
            // Check if it's a quantity error
            if (error.message && error.message.includes('No more')) {
                errorMessage = error.message;
            }
            showToast(errorMessage, 'error');
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

                    {/* Manage Permit Types Button */}
                    <button
                        onClick={() => navigate('/admin/permit-types')}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                        <FaFilter className="mr-2" />
                        Manage Permit Types
                    </button>
                </div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <div className={`mt-4 p-4 rounded-lg border ${darkMode ? 'bg-gray-750 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                    {permitTypes.map(type => (
                                        <option key={type.id} value={type.category}>
                                            {type.name} ({type.category})
                                        </option>
                                    ))}
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
                                {permitData.permits.map(permit => (
                                    <tr
                                        key={permit.id}
                                        className={`border-t ${darkMode
                                            ? 'border-gray-700 hover:bg-gray-800'
                                            : 'border-gray-200 hover:bg-gray-50'
                                            } transition-colors`}
                                    >
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
                                            <div>{permit.startDate} to</div>
                                            <div>{permit.endDate}</div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-3 font-medium">
                                            {formatCurrency(permit.price)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span className={getStatusBadgeStyles(permit.status)}>
                                                {permit.status.charAt(0).toUpperCase() + permit.status.slice(1)}
                                            </span>
                                        </td>

                                        {/* Payment Status */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${permit.paymentStatus === 'paid'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                : permit.paymentStatus === 'unpaid'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
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

                                                {/* Toggle status button */}
                                                <button
                                                    onClick={() => handleToggleStatus(permit.id, permit.status)}
                                                    className={`p-1 ${permit.status === 'active'
                                                        ? 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300'
                                                        : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'}`}
                                                    title={permit.status === 'active' ? 'Deactivate permit' : 'Activate permit'}
                                                    id="toggle status button"
                                                >
                                                    {permit.status === 'active' ? <FaLock /> : <FaLockOpen />}
                                                </button>

                                                {/* Toggle payment status button */}
                                                <button
                                                    onClick={() => handleUpdatePaymentStatus(permit.id, permit.paymentStatus)}
                                                    className={`p-1 ${permit.paymentStatus === 'paid'
                                                        ? 'text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300'
                                                        : 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'}`}
                                                    title={permit.paymentStatus === 'paid' ? 'Mark as unpaid' : 'Mark as paid'}
                                                    id="toggle payment button"
                                                >
                                                    {permit.paymentStatus === 'paid' ? <FaTimesCircle /> : <FaCheckCircle />}
                                                </button>

                                                {/* Delete button */}
                                                <button
                                                    onClick={() => setConfirmDeleteId(permit.id)}
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

export default ManagePermits; 