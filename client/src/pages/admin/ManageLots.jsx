import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaPlus, FaArrowLeft, FaMapMarkerAlt, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { LotService } from '../../utils/api';
import { PermitTypeService } from '../../utils/api';

const ManageLots = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // State for lots data and pagination
    const [lotsData, setLotsData] = useState({
        lots: [],
        pagination: { totalPages: 1, currentPage: 1, total: 0 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', permitType: '', lotType: '', rateType: '' });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for editing and creating lots
    const [editingLot, setEditingLot] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'create'

    // Form state for creating/editing
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        description: '',
        location: {
            latitude: 40.9148,
            longitude: -73.1259
        },
        totalSpaces: 0,
        availableSpaces: 0,
        permitTypes: [],
        hourlyRate: 0,
        semesterRate: 0,
        rateType: 'Permit-based',
        status: 'Active',
        features: {
            isEV: false,
            isMetered: false,
            isAccessible: false
        }
    });

    // Validation state
    const [formErrors, setFormErrors] = useState({});

    // State for permit types
    const [permitTypes, setPermitTypes] = useState([]);
    const [isLoadingPermits, setIsLoadingPermits] = useState(true);

    // Fetch permit types
    useEffect(() => {
        const fetchPermitTypes = async () => {
            setIsLoadingPermits(true);
            try {
                console.log('Fetching permit types...');
                const result = await PermitTypeService.getAllPublicPermitTypes();
                console.log('Permit types API response:', result);

                if (result.success && result.data && result.data.permitTypes) {
                    console.log('Successfully loaded permit types:', result.data.permitTypes);

                    // Debug the price values to make sure they're proper numbers
                    const normalizedPermitTypes = result.data.permitTypes.map(pt => {
                        // Ensure all permit types have a numeric price 
                        const normalizedType = { ...pt };
                        if (pt.price !== undefined) {
                            normalizedType.price = typeof pt.price === 'number' ? pt.price : Number(pt.price);
                            console.log(`Normalized permit type ${pt.name} price:`, pt.price, '->', normalizedType.price);
                        }
                        return normalizedType;
                    });

                    setPermitTypes(normalizedPermitTypes);
                } else {
                    console.error('Failed to load permit types. API returned:', result);
                    setError('Failed to load permit types. Please try again.');
                }
            } catch (err) {
                console.error('Error in fetchPermitTypes:', err);
                setError('An unexpected error occurred while fetching permit types. Please try again.');
            } finally {
                setIsLoadingPermits(false);
            }
        };

        fetchPermitTypes();
    }, []);

    // Fetch lots based on current filters and pagination
    useEffect(() => {
        const fetchLots = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const apiFilters = {
                    search: searchTerm,
                    status: filters.status || undefined
                };

                // Handle permit type filter
                if (filters.permitType) {
                    apiFilters.permitType = filters.permitType;
                }

                // Handle lot type filter
                if (filters.lotType) {
                    if (filters.lotType === 'ev') {
                        apiFilters.features = 'isEV';
                    } else if (filters.lotType === 'metered') {
                        apiFilters.features = 'isMetered';
                    } else if (filters.lotType === 'standard') {
                        apiFilters.features = 'standard';
                    }
                }

                // Handle rate type filter
                if (filters.rateType) {
                    apiFilters.rateType = filters.rateType;
                }

                const result = await LotService.getAll(apiFilters, currentPage, 10);

                if (result.success && result.data && result.data.lots) {
                    setLotsData(result.data);
                } else {
                    setError('Failed to load parking lots. Please try again.');
                    console.error('Error fetching lots:', result.error);
                    // Set empty lots data to prevent undefined errors
                    setLotsData({ lots: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
                }
            } catch (err) {
                setError('An unexpected error occurred. Please try again.');
                console.error('Error in fetchLots:', err);
                // Set empty lots data to prevent undefined errors
                setLotsData({ lots: [], pagination: { totalPages: 1, currentPage: 1, total: 0 } });
            } finally {
                setIsLoading(false);
            }
        };

        fetchLots();
    }, [filters, searchTerm, currentPage]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [filterName]: value };

            // Clear lotType if it's EV or metered and we're setting permitType
            if (filterName === 'permitType' && value && (prev.lotType === 'ev' || prev.lotType === 'metered')) {
                newFilters.lotType = '';
            }

            // Clear permitType if setting lotType to EV or metered
            if (filterName === 'lotType' && (value === 'ev' || value === 'metered')) {
                newFilters.permitType = '';
            }

            return newFilters;
        });
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Handle page change
    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    // Handle lot status toggle
    const handleToggleStatus = async (lotId, currentStatus) => {
        let newStatus;
        if (currentStatus === 'Active') {
            newStatus = 'Inactive';
        } else if (currentStatus === 'Inactive') {
            newStatus = 'Active';
        } else if (currentStatus === 'Maintenance') {
            newStatus = 'Active';
        }

        if (newStatus) {
            try {
                const result = await LotService.updateStatus(lotId, newStatus);

                if (result.success) {
                    // Refresh lot data
                    const lotsResult = await LotService.getAll(
                        { ...filters, search: searchTerm },
                        currentPage,
                        10
                    );

                    if (lotsResult.success) {
                        setLotsData(lotsResult.data);
                    }
                } else {
                    setError(`Failed to update lot status: ${result.error}`);
                }
            } catch (err) {
                setError('An error occurred while updating lot status');
                console.error('Error toggling status:', err);
            }
        }
    };

    // Open edit modal
    const handleEditLot = async (lotId) => {
        try {
            setIsLoading(true);
            const result = await LotService.getById(lotId);

            if (result.success) {
                const lot = result.data.lot;
                setEditingLot(lot);
                setFormData({
                    name: lot.name,
                    address: lot.address,
                    description: lot.description || '',
                    location: lot.location,
                    totalSpaces: lot.totalSpaces,
                    availableSpaces: lot.availableSpaces,
                    permitTypes: lot.permitTypes || [],
                    hourlyRate: lot.hourlyRate || 0,
                    semesterRate: lot.semesterRate || 0,
                    rateType: lot.rateType || 'Permit-based',
                    status: lot.status,
                    features: lot.features || { isEV: false, isMetered: false, isAccessible: false }
                });
                setModalMode('edit');
                setIsModalOpen(true);
            } else {
                setError(`Failed to fetch lot details: ${result.error}`);
            }
        } catch (err) {
            setError('An error occurred while fetching lot details');
            console.error('Error in handleEditLot:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Open create modal
    const handleCreateLot = () => {
        setEditingLot(null);
        setFormData({
            name: '',
            address: '',
            description: '',
            location: {
                latitude: 40.9148,
                longitude: -73.1259
            },
            totalSpaces: 0,
            availableSpaces: 0,
            permitTypes: permitTypes.length > 0 ? [permitTypes[0].name] : [],
            hourlyRate: 0,
            semesterRate: 0,
            rateType: 'Permit-based',
            status: 'Active',
            features: {
                isEV: false,
                isMetered: false,
                isAccessible: false
            }
        });
        setModalMode('create');
        setIsModalOpen(true);
    };

    // Handle deleting a lot
    const handleDeleteLot = async (lotId) => {
        if (window.confirm('Are you sure you want to delete this parking lot? This action cannot be undone.')) {
            try {
                const result = await LotService.delete(lotId);

                if (result.success) {
                    // Refresh lot data
                    const lotsResult = await LotService.getAll(
                        { ...filters, search: searchTerm },
                        currentPage,
                        10
                    );

                    if (lotsResult.success) {
                        setLotsData(lotsResult.data);
                    }
                } else {
                    setError(`Failed to delete lot: ${result.error}`);
                }
            } catch (err) {
                setError('An error occurred while deleting the lot');
                console.error('Error in handleDeleteLot:', err);
            }
        }
    };

    // Handle form input changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;

        // Special handling for totalSpaces to ensure availableSpaces never exceeds it
        if (name === 'totalSpaces') {
            const totalSpaces = Number(value) || 0;
            setFormData(prev => {
                // If availableSpaces would exceed the new totalSpaces, cap it at totalSpaces
                const prevAvailableSpaces = Number(prev.availableSpaces) || 0;
                const availableSpaces = prevAvailableSpaces > totalSpaces ? totalSpaces : prevAvailableSpaces;
                return {
                    ...prev,
                    [name]: totalSpaces,
                    availableSpaces: availableSpaces
                };
            });
        }
        // Special handling for availableSpaces to ensure it doesn't exceed totalSpaces
        else if (name === 'availableSpaces') {
            const availableSpaces = Number(value) || 0;
            setFormData(prev => {
                const totalSpaces = Number(prev.totalSpaces) || 0;
                // Cap availableSpaces at totalSpaces
                const cappedValue = availableSpaces > totalSpaces ? totalSpaces : availableSpaces;
                return {
                    ...prev,
                    [name]: cappedValue
                };
            });
        }
        // Special handling for name to suggest permit types
        else if (name === 'name' && modalMode === 'create') {
            setFormData(prev => {
                // Suggest permit types based on lot name
                let suggestedPermitTypes = prev.permitTypes;
                if (suggestedPermitTypes.length === 0 || prev.name === '') {
                    // Find permit types that match keywords in the lot name
                    const lowercaseName = value.toLowerCase();

                    // Find matching permit types from the backend data
                    const facultyTypes = permitTypes.filter(type =>
                        type.name.toLowerCase().includes('faculty') ||
                        type.name.toLowerCase().includes('staff')
                    );

                    const visitorTypes = permitTypes.filter(type =>
                        type.name.toLowerCase().includes('visitor') ||
                        type.name.toLowerCase().includes('guest')
                    );

                    const commuterTypes = permitTypes.filter(type =>
                        type.name.toLowerCase().includes('commuter')
                    );

                    const residentTypes = permitTypes.filter(type =>
                        type.name.toLowerCase().includes('resident')
                    );

                    // Suggest based on lot name keywords
                    if (lowercaseName.includes('faculty') || lowercaseName.includes('staff')) {
                        suggestedPermitTypes = facultyTypes.length > 0
                            ? facultyTypes.map(type => type.name)
                            : suggestedPermitTypes;
                    } else if (lowercaseName.includes('visitor') || lowercaseName.includes('guest')) {
                        suggestedPermitTypes = visitorTypes.length > 0
                            ? visitorTypes.map(type => type.name)
                            : suggestedPermitTypes;
                    } else if (lowercaseName.includes('commuter')) {
                        suggestedPermitTypes = commuterTypes.length > 0
                            ? commuterTypes.map(type => type.name)
                            : suggestedPermitTypes;
                    } else if (lowercaseName.includes('resident')) {
                        suggestedPermitTypes = residentTypes.length > 0
                            ? residentTypes.map(type => type.name)
                            : suggestedPermitTypes;
                    }
                }

                return {
                    ...prev,
                    [name]: value,
                    ...(suggestedPermitTypes !== prev.permitTypes ? { permitTypes: suggestedPermitTypes } : {})
                };
            });
        }
        // Special handling for rateType to update semester rate when switching to Permit-based
        else if (name === 'rateType') {
            setFormData(prev => {
                const updatedData = { ...prev, [name]: value };

                // If changing to Permit-based, update the semester rate based on selected permit types
                if (value === 'Permit-based' && prev.permitTypes.length > 0) {
                    updatedData.semesterRate = updateSemesterRate(prev.permitTypes);
                }

                return updatedData;
            });
        }
        else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    // Handle location input changes
    const handleLocationChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            location: {
                ...prev.location,
                [name === 'latitude' ? 'latitude' : 'longitude']: parseFloat(value)
            }
        }));
    };

    // Set the semester rate based on selected permit types
    const updateSemesterRate = (selectedTypes) => {
        if (selectedTypes.length === 0) {
            return 0;
        }

        console.log('Calculating semester rate for permit types:', selectedTypes);

        // Find the highest price among selected permit types
        const permitPrices = selectedTypes
            .map(type => {
                const matchingPermit = permitTypes.find(pt => pt.name === type);
                // Ensure price is a number and log for debugging
                const price = matchingPermit && matchingPermit.price ? Number(matchingPermit.price) : 0;
                console.log(`Permit type "${type}" price:`, price, typeof price);
                return price;
            })
            .filter(price => price > 0);

        console.log('Valid permit prices found:', permitPrices);

        if (permitPrices.length === 0) {
            return 0;
        }

        return Math.max(...permitPrices);
    };

    // Handle permit type checkbox changes
    const handlePermitTypeChange = (type) => {
        setFormData(prev => {
            const currentTypes = [...prev.permitTypes];
            let newTypes;
            let updatedData = { ...prev };

            if (currentTypes.includes(type)) {
                // Remove the type
                newTypes = currentTypes.filter(t => t !== type);
                updatedData.permitTypes = newTypes;
            } else {
                // Add the type
                newTypes = [...currentTypes, type];
                updatedData.permitTypes = newTypes;
            }

            // If rate type is permit-based, update semester rate based on permit types
            if (prev.rateType === 'Permit-based') {
                updatedData.semesterRate = updateSemesterRate(newTypes);
            }

            return updatedData;
        });
    };

    // Handle checkbox changes for features
    const handleFeatureChange = (e) => {
        const { name, checked } = e.target;

        // Create the updated features object
        const updatedFeatures = {
            ...formData.features,
            [name]: checked
        };

        // Start with updating just the features
        const updates = {
            ...formData,
            features: updatedFeatures
        };

        // Special handling for metered parking
        if (name === 'isMetered') {
            if (checked) {
                // If metered is being enabled, clear permitTypes and set rate type to Hourly
                updates.permitTypes = [];
                updates.rateType = 'Hourly';
            }
        }

        setFormData(updates);
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

        if (!formData.location.latitude || !formData.location.longitude) {
            errors.location = "Both latitude and longitude are required";
        }

        const totalSpaces = Number(formData.totalSpaces) || 0;
        const availableSpaces = Number(formData.availableSpaces) || 0;

        if (!totalSpaces || totalSpaces <= 0) {
            errors.totalSpaces = "Total spaces must be greater than 0";
        }

        if (availableSpaces < 0 || availableSpaces > totalSpaces) {
            errors.availableSpaces = "Available spaces must be between 0 and total spaces";
        }

        // Only require permit types for non-metered lots
        if (formData.permitTypes.length === 0 && !formData.features.isMetered) {
            errors.permitTypes = "At least one permit type is required for non-metered lots";
        }

        // Only validate hourly rate if the rate type is Hourly or has EV/metered features
        if ((formData.rateType === 'Hourly' || formData.features.isEV || formData.features.isMetered)
            && (formData.hourlyRate === undefined || formData.hourlyRate < 0)) {
            errors.hourlyRate = "Hourly rate must be provided for metered or EV lots";
        }

        // Validate semester rate if the rate type is Permit-based
        if (formData.rateType === 'Permit-based') {
            if (formData.semesterRate === undefined) {
                errors.semesterRate = "Semester rate must be provided for permit-based lots";
            }

            // Check if the selected permit types have prices defined
            const permitTypesWithoutPrice = formData.permitTypes.filter(type => {
                const matchingPermit = permitTypes.find(pt => pt.name === type);
                // Add debug log to check the actual values
                console.log(`Checking permit type "${type}":`, matchingPermit ? `Price: ${matchingPermit.price}, Type: ${typeof matchingPermit.price}` : 'Not found');

                if (!matchingPermit) return true;

                // Safely check for price property existence and value
                return typeof matchingPermit?.price === 'undefined' ||
                    matchingPermit.price === null ||
                    Number(matchingPermit.price) <= 0;
            });

            if (permitTypesWithoutPrice.length > 0) {
                // Just add a warning instead of blocking submission
                errors.permitTypeWarning = `The following selected permit types don't have prices defined: ${permitTypesWithoutPrice.join(', ')}`;
                errors.permitTypeNote = "Please note: these permit types will use a default price of $0.00 until prices are set in the Permit Type management section.";
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmitForm = async () => {
        if (!validateForm()) return;

        try {
            // Make sure to cast numeric fields to numbers
            const cleanData = {
                ...formData,
                hourlyRate: parseFloat(formData.hourlyRate) || 0,
                semesterRate: parseFloat(formData.semesterRate) || 0,
                totalSpaces: Number(formData.totalSpaces) || 0,
                availableSpaces: Number(formData.availableSpaces) || 0
            };

            // Final safety check - ensure availableSpaces doesn't exceed totalSpaces
            cleanData.availableSpaces = Math.min(cleanData.availableSpaces, cleanData.totalSpaces);

            // Ensure we have a valid array of permit types
            if (!Array.isArray(cleanData.permitTypes) || cleanData.permitTypes.length === 0) {
                cleanData.permitTypes = [];
            }

            console.log('Submitting form data:', cleanData);

            let result;
            if (modalMode === 'edit') {
                result = await LotService.update(editingLot._id, cleanData);
            } else {
                result = await LotService.create(cleanData);
            }

            if (result.success) {
                setIsModalOpen(false);

                // Immediately update the local state to reflect changes
                if (modalMode === 'edit') {
                    // Update the lot in the current state without waiting for API
                    const updatedLots = lotsData.lots.map(lot =>
                        lot._id === editingLot._id ? { ...lot, ...cleanData } : lot
                    );
                    setLotsData(prev => ({
                        ...prev,
                        lots: updatedLots
                    }));
                } else {
                    // For new lots, we need to get the full data with ID from the server
                    const newLot = result.data?.lot || result.lot;
                    if (newLot && newLot._id) {
                        setLotsData(prev => ({
                            ...prev,
                            lots: [...prev.lots, newLot],
                            pagination: {
                                ...prev.pagination,
                                total: prev.pagination.total + 1
                            }
                        }));
                    }
                }

                // Then refresh fully from the server (with a small delay to allow the server to process)
                setTimeout(async () => {
                    try {
                        const lotsResult = await LotService.getAll(
                            { ...filters, search: searchTerm },
                            currentPage,
                            10
                        );

                        if (lotsResult.success) {
                            setLotsData(lotsResult.data);
                        }
                    } catch (err) {
                        console.error('Error refreshing lot data:', err);
                    }
                }, 500);
            } else {
                setError(`Failed to ${modalMode === 'edit' ? 'update' : 'create'} lot: ${result.error}`);
            }
        } catch (err) {
            setError(`An error occurred while ${modalMode === 'edit' ? 'updating' : 'creating'} the lot`);
            console.error(`Error in ${modalMode === 'edit' ? 'update' : 'create'} lot:`, err);
        }
    };

    // Get status badge style
    const getStatusBadgeStyles = (status) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'Inactive':
                return 'bg-gray-100 text-gray-800 border border-gray-200';
            case 'Maintenance':
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

                            {/* Description */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    rows="3"
                                    placeholder="Enter a description for this parking lot"
                                />
                            </div>

                            {/* Location */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Location (Coordinates)*
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <input
                                            type="number"
                                            name="latitude"
                                            value={formData.location.latitude}
                                            onChange={handleLocationChange}
                                            step="0.0001"
                                            className={`w-full px-3 py-2 border ${formErrors.location ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                    rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                            placeholder="Latitude"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="longitude"
                                            value={formData.location.longitude}
                                            onChange={handleLocationChange}
                                            step="0.0001"
                                            className={`w-full px-3 py-2 border ${formErrors.location ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                                    rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                            placeholder="Longitude"
                                        />
                                    </div>
                                </div>
                                {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                                <div className="mt-1 flex items-center text-xs text-gray-500">
                                    <FaMapMarkerAlt className="mr-1" />
                                    <span>Default coordinates: Stony Brook University</span>
                                </div>
                            </div>

                            {/* Spaces */}
                            <div className="grid grid-cols-2 gap-3">
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

                            {/* Rate Type */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Rate Type*
                                </label>
                                <select
                                    name="rateType"
                                    value={formData.rateType}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none
                                            ${formData.features.isMetered ? 'cursor-not-allowed bg-gray-100' : ''}`}
                                    disabled={formData.features.isMetered}
                                >
                                    <option value="Permit-based">Permit-based (Semester)</option>
                                    <option value="Hourly">Hourly (Metered/EV)</option>
                                </select>
                                {formData.features.isMetered && (
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Metered parking lots automatically use hourly rates.
                                    </p>
                                )}
                            </div>

                            {/* Hourly Rate - only for metered or EV lots */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {(formData.rateType === 'Hourly' || formData.features.isEV || formData.features.isMetered) ? 'Hourly Rate*' : 'Hourly Rate'}
                                </label>
                                <input
                                    type="number"
                                    name="hourlyRate"
                                    value={formData.hourlyRate}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${formErrors.hourlyRate ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none`}
                                    placeholder="$0.00"
                                />
                                {formErrors.hourlyRate && <p className="text-red-500 text-xs mt-1">{formErrors.hourlyRate}</p>}
                                {(formData.rateType === 'Hourly' || formData.features.isEV || formData.features.isMetered) && (
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Required for metered or EV lots
                                    </p>
                                )}
                            </div>

                            {/* Semester Rate */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {formData.rateType === 'Permit-based' ? 'Semester Rate*' : 'Semester Rate'}
                                </label>
                                <input
                                    type="number"
                                    name="semesterRate"
                                    value={formData.semesterRate}
                                    onChange={handleFormChange}
                                    className={`w-full px-3 py-2 border ${formErrors.semesterRate ? 'border-red-500' : darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} focus:outline-none
                                            ${formData.rateType === 'Permit-based' && formData.semesterRate > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    placeholder="$0.00"
                                    readOnly={formData.rateType === 'Permit-based' && formData.semesterRate > 0}
                                />
                                {formErrors.semesterRate && <p className="text-red-500 text-xs mt-1">{formErrors.semesterRate}</p>}
                                {formData.rateType === 'Permit-based' && (
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {formData.permitTypes.length > 0 ? (
                                            <>
                                                Based on selected permit type{formData.permitTypes.length > 1 ? 's' : ''}: {formData.permitTypes.join(', ')}
                                                <br />
                                                {formData.semesterRate > 0 ? (
                                                    <span className="italic">The rate is automatically derived from permit type prices</span>
                                                ) : (
                                                    <span className="italic text-amber-500">
                                                        The selected permit types don't have prices defined. Please set prices in the Permit Type management section.
                                                    </span>
                                                )}
                                            </>
                                        ) : (
                                            'Required for permit-based lots. Select permit types to set the rate.'
                                        )}
                                    </p>
                                )}
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
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                            </div>

                            {/* Permit Types */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Permit Types{formData.features.isMetered ? '' : '*'}
                                </label>
                                <div className={`p-3 mb-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${formData.features.isMetered ? 'opacity-50' : ''}`}>
                                    <div className={`mb-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        <div className="font-medium">Price Information</div>
                                        <p className="text-xs mt-1">
                                            Permit prices are fetched from the database. For permit-based lots, the semester rate will automatically use
                                            the price from the selected permit type(s). If multiple permit types are selected, the highest price will be used.
                                        </p>
                                    </div>

                                    {formData.features.isMetered && (
                                        <div className="mb-3 p-2 bg-blue-100 border border-blue-300 rounded text-blue-800 text-xs">
                                            <div className="flex items-center">
                                                <FaInfoCircle className="mr-1 text-blue-500" />
                                                <span className="font-medium">Metered Parking Selected</span>
                                            </div>
                                            <p className="mt-1">
                                                Permit types are disabled for metered parking lots. Metered lots use hourly rates instead of permit-based access.
                                            </p>
                                        </div>
                                    )}

                                    {formData.rateType === 'Permit-based' && !formData.features.isMetered && (
                                        <>
                                            {permitTypes.filter(pt => !pt.price || pt.price <= 0).length > 0 && (
                                                <div className="mb-3 p-2 bg-amber-100 border border-amber-300 rounded text-amber-800 text-xs">
                                                    <div className="flex items-center">
                                                        <FaExclamationTriangle className="mr-1 text-amber-500" />
                                                        <span className="font-medium">Warning:</span>
                                                    </div>
                                                    <p className="mt-1">
                                                        Some permit types don't have prices defined. These cannot be used with permit-based lots
                                                        unless prices are set in the Permit Type management section.
                                                    </p>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div className="grid grid-cols-2 gap-2">
                                        {isLoadingPermits ? (
                                            <div className="col-span-2 text-center py-2">Loading permit types...</div>
                                        ) : permitTypes.length > 0 ? (
                                            permitTypes.map(permitType => {
                                                const hasPrice = typeof permitType.price === 'number' ?
                                                    permitType.price > 0 :
                                                    Number(permitType.price) > 0;
                                                const priceInfo = hasPrice ? `$${permitType.price.toFixed(2)}` : 'N/A';
                                                const durationInfo = permitType.duration || '';
                                                const tooltipInfo = `${permitType.name}: ${priceInfo} / ${durationInfo || 'Semester'}`;

                                                return (
                                                    <div key={permitType._id} className="flex items-center group relative mb-1">
                                                        <input
                                                            type="checkbox"
                                                            id={`type-${permitType._id}`}
                                                            checked={formData.permitTypes?.includes(permitType.name) || false}
                                                            onChange={() => handlePermitTypeChange(permitType.name)}
                                                            className="mr-2"
                                                            disabled={formData.features.isMetered}
                                                        />
                                                        <label htmlFor={`type-${permitType._id}`} className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} ${formData.features.isMetered ? 'opacity-50' : ''}`}>
                                                            {permitType.name}
                                                            <span className={`text-sm ml-1 ${hasPrice ? 'text-green-500' : 'text-red-500'}`}>
                                                                ({priceInfo})
                                                            </span>
                                                            {!hasPrice && formData.rateType === 'Permit-based' && !formData.features.isMetered && (
                                                                <FaExclamationTriangle className="inline-block ml-1 text-amber-500" title="This permit type has no price defined" />
                                                            )}
                                                        </label>
                                                        <span className={`hidden group-hover:block absolute left-full -ml-2 top-0 px-2 py-1 text-xs rounded bg-gray-800 text-white z-10 whitespace-nowrap`}>
                                                            {tooltipInfo}
                                                            {!hasPrice && formData.rateType === 'Permit-based' && !formData.features.isMetered && (
                                                                <span className="block text-amber-400 mt-1">
                                                                    Warning: No price defined
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-2 text-center py-2">No permit types available</div>
                                        )}
                                    </div>
                                </div>

                                {isLoadingPermits && (
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Loading permit type information...
                                    </p>
                                )}
                                {formData.features.isMetered ? (
                                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Metered parking lots don't use permit types. The lot will be available based on hourly payment.
                                    </p>
                                ) : (
                                    <>
                                        {formErrors.permitTypes && <p className="text-red-500 text-xs mt-1">{formErrors.permitTypes}</p>}
                                        {formErrors.permitTypeWarning && <p className="text-amber-500 text-xs mt-1">{formErrors.permitTypeWarning}</p>}
                                        {formErrors.permitTypeNote && <p className="text-amber-500 text-xs mt-1 italic">{formErrors.permitTypeNote}</p>}
                                    </>
                                )}
                            </div>

                            {/* Additional Features */}
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Additional Features
                                </label>
                                <div className="space-y-2">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isEV"
                                            name="isEV"
                                            checked={formData.features.isEV}
                                            onChange={handleFeatureChange}
                                            className="mr-2"
                                        />
                                        <label htmlFor="isEV" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                            EV Charging Available
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isMetered"
                                            name="isMetered"
                                            checked={formData.features.isMetered}
                                            onChange={handleFeatureChange}
                                            className="mr-2"
                                        />
                                        <label htmlFor="isMetered" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                            Metered Parking
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="isAccessible"
                                            name="isAccessible"
                                            checked={formData.features.isAccessible}
                                            onChange={handleFeatureChange}
                                            className="mr-2"
                                        />
                                        <label htmlFor="isAccessible" className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                            Accessible Parking
                                        </label>
                                    </div>
                                    <div className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                                        Note: Metered and EV lots use hourly rates. Other lots use permit-based semester rates.
                                    </div>
                                </div>
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
                                    id="save changes"
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
                                placeholder="Search by name, address, ID, or 'EV', 'metered', 'permit'..."
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
                    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 pt-4 
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
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Maintenance">Maintenance</option>
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
                                {permitTypes.map(type => (
                                    <option key={type._id} value={type.name.toLowerCase()}>
                                        {type.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Lot Type Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Lot Type
                            </label>
                            <select
                                value={filters.lotType}
                                onChange={(e) => handleFilterChange('lotType', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Lot Types</option>
                                <option value="ev">EV Charging</option>
                                <option value="metered">Metered</option>
                                <option value="standard">Standard</option>
                            </select>
                        </div>

                        {/* Rate Type Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Rate Type
                            </label>
                            <select
                                value={filters.rateType}
                                onChange={(e) => handleFilterChange('rateType', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Rate Types</option>
                                <option value="hourly">Hourly (Metered/EV)</option>
                                <option value="permit">Permit-based (Semester)</option>
                            </select>
                        </div>

                        {/* Reset Filters Button */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilters({ status: '', permitType: '', lotType: '', rateType: '' });
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
                ) : !lotsData?.lots || lotsData.lots.length === 0 ? (
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
                                    <tr key={lot._id} className={darkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FaMapMarkerAlt className="text-red-500 mr-2" />
                                                <div>
                                                    <div className={darkMode ? 'text-white' : 'text-gray-900'}>
                                                        {lot.name}
                                                    </div>
                                                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        ID: {lot._id}
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
                                                {lot.rateType === 'Hourly' ?
                                                    `$${lot.hourlyRate}/hour` :
                                                    `$${lot.semesterRate}/semester`}
                                            </div>
                                            {lot.rateType === 'Hourly' && (
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {lot.features.isMetered && 'Metered'}
                                                    {lot.features.isMetered && lot.features.isEV && ' & '}
                                                    {lot.features.isEV && 'EV'}
                                                </div>
                                            )}
                                            {lot.rateType === 'Permit-based' && (
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {lot.permitTypes?.join(', ')}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyles(lot.status)}`}>
                                                {lot.status.charAt(0).toUpperCase() + lot.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end space-x-2">
                                                <button
                                                    onClick={() => handleEditLot(lot._id)}
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title="Edit Lot"
                                                >
                                                    <FaEdit className="text-blue-500" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(lot._id, lot.status)}
                                                    className={`p-1.5 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                                                    title={lot.status === 'Active' ? 'Set Inactive' : 'Set Active'}
                                                    id="active button"
                                                >
                                                    {lot.status === 'Active' ? (
                                                        <FaTimesCircle className="text-yellow-500" />
                                                    ) : (
                                                        <FaCheckCircle className="text-green-500" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteLot(lot._id)}
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

            {/* Error message */}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error:</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
        </div>
    );
};

export default ManageLots; 