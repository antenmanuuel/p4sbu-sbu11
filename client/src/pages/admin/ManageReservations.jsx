import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaEye, FaTimes, FaArrowLeft, FaCalendarAlt, FaClock, FaUser, FaCar, FaMapMarkerAlt } from 'react-icons/fa';
import { AdminService } from '../../utils/api';

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

// Format time for display
const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid

    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Format date and time together
const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return `${formatDate(dateString)} at ${formatTime(dateString)}`;
};

const ManageReservations = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // State for reservations data
    const [reservationData, setReservationData] = useState({
        reservations: [],
        pagination: { totalPages: 1, currentPage: 1, total: 0 }
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        status: '',
        startDate: '',
        endDate: '',
    });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [currentReservation, setCurrentReservation] = useState(null);
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

    // Fetch reservations based on current filters and pagination
    useEffect(() => {
        const fetchReservations = async () => {
            setIsLoading(true);
            try {
                const result = await AdminService.getAllReservations(
                    { ...filters, search: searchTerm },
                    currentPage,
                    10
                );

                if (result.success) {
                    setReservationData({
                        reservations: result.data.reservations,
                        pagination: result.data.pagination
                    });
                } else {
                    showToast('Failed to fetch reservations', 'error');
                }
            } catch (error) {
                console.error('Error fetching reservations:', error);
                showToast('An error occurred while fetching reservations', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
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

    // View reservation details
    const handleViewDetails = (reservation) => {
        setCurrentReservation(reservation);
        setShowDetailsModal(true);
    };

    // Get status badge style
    const getStatusBadgeStyles = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'completed':
                return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'cancelled':
                return 'bg-red-100 text-red-800 border border-red-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
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
        const { totalPages, currentPage: currPage, total } = reservationData.pagination;

        return (
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                    Showing {(currPage - 1) * 10 + 1}-{Math.min(currPage * 10, total)} of {total} reservations
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => handlePageChange(currPage - 1)}
                        disabled={currPage === 1}
                        className={`px-3 py-1 rounded-md ${currPage === 1
                                ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                                : `${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border`
                            }`}
                    >
                        Previous
                    </button>
                    <div className={`flex space-x-1 ${totalPages > 7 ? 'hidden md:flex' : ''}`}>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-8 h-8 rounded-md ${currPage === i + 1
                                        ? `${darkMode ? 'bg-red-600 text-white' : 'bg-red-500 text-white'}`
                                        : `${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border`
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => handlePageChange(currPage + 1)}
                        disabled={currPage === totalPages}
                        className={`px-3 py-1 rounded-md ${currPage === totalPages
                                ? `${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'} cursor-not-allowed`
                                : `${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'} border`
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin-dashboard')}
                className={`flex items-center mb-4 ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                    }`}
            >
                <FaArrowLeft className="mr-2" />
                Back to Dashboard
            </button>

            <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Manage Reservations</h1>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg ${toast.type === 'success'
                        ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
                        : toast.type === 'error'
                            ? 'bg-red-100 border-l-4 border-red-500 text-red-700'
                            : 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Search & Filter Bar */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center mb-4">
                    <div className="relative flex-grow mb-4 md:mb-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className={`${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search reservations by ID, user name, email, or lot..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                ? 'bg-gray-700 text-white border-gray-600 focus:border-red-500'
                                : 'bg-white text-gray-900 border-gray-300 focus:border-red-500'
                                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
                        />
                    </div>

                    {/* Filter Button */}
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
                        {/* Reservation Status Filter */}
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
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="pending">Pending</option>
                            </select>
                        </div>

                        {/* Start Date Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                From Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                     ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                     border focus:outline-none`}
                            />
                        </div>

                        {/* End Date Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                To Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg 
                                     ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                                     border focus:outline-none`}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Reservations Table */}
            <div className={`rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-red-600"></div>
                    </div>
                ) : reservationData.reservations.length === 0 ? (
                    <div className={`text-center py-20 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No reservations found matching your criteria
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-600'}`}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Reservation ID
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        User
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Parking Lot
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Date & Time
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Price
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                {reservationData.reservations.map((reservation, index) => (
                                    <tr key={reservation._id || reservation.id || index} className={`${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                                        {/* Reservation ID */}
                                        <td className="px-4 py-3 text-sm">
                                            <div className="font-medium">{reservation.reservationId}</div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                ID: {reservation.id || reservation._id}
                                            </div>
                                        </td>

                                        {/* User */}
                                        <td className="px-4 py-3">
                                            <div className="font-medium">
                                                {(reservation.user?.firstName && reservation.user?.lastName)
                                                    ? `${reservation.user.firstName} ${reservation.user.lastName}`
                                                    : 'Unknown User'}
                                            </div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {reservation.user?.email || 'No email'}
                                            </div>
                                        </td>

                                        {/* Parking Lot */}
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{reservation.lotId?.name || 'Unknown Lot'}</div>
                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {reservation.lotId?.address || 'No address'}
                                            </div>
                                        </td>

                                        {/* Date & Time */}
                                        <td className="px-4 py-3">
                                            <div className="text-sm">
                                                <span className="font-medium">From:</span> {formatDateTime(reservation.startTime)}
                                            </div>
                                            <div className="text-sm">
                                                <span className="font-medium">To:</span> {formatDateTime(reservation.endTime)}
                                            </div>
                                        </td>

                                        {/* Price */}
                                        <td className="px-4 py-3 font-medium">
                                            {formatCurrency(reservation.totalPrice || 0)}
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3">
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeStyles(reservation.status)}`}>
                                                {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex space-x-2">
                                                {/* View Details button */}
                                                <button
                                                    onClick={() => handleViewDetails(reservation)}
                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                    title="View details"
                                                >
                                                    <FaEye />
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
                {!isLoading && reservationData.reservations.length > 0 && renderPagination()}
            </div>

            {/* Reservation Details Modal */}
            {showDetailsModal && currentReservation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`relative max-w-2xl w-full rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} p-6 max-h-[90vh] overflow-y-auto`}>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <FaTimes />
                        </button>

                        <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Reservation Details
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <FaCalendarAlt className="mr-2" /> Reservation Information
                                </h3>
                                <p><span className="font-medium">ID:</span> {currentReservation.reservationId}</p>
                                <p><span className="font-medium">Status:</span> {currentReservation.status}</p>
                                <p><span className="font-medium">Created:</span> {formatDateTime(currentReservation.createdAt)}</p>
                                <p><span className="font-medium">Price:</span> {formatCurrency(currentReservation.totalPrice || 0)}</p>
                                <p><span className="font-medium">Payment Status:</span> {currentReservation.paymentStatus}</p>
                            </div>

                            <div>
                                <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <FaClock className="mr-2" /> Time Details
                                </h3>
                                <p><span className="font-medium">Start Time:</span> {formatDateTime(currentReservation.startTime)}</p>
                                <p><span className="font-medium">End Time:</span> {formatDateTime(currentReservation.endTime)}</p>
                                <p><span className="font-medium">Duration:</span> {
                                    (() => {
                                        const start = new Date(currentReservation.startTime);
                                        const end = new Date(currentReservation.endTime);
                                        const durationHours = Math.round((end - start) / (1000 * 60 * 60) * 10) / 10;
                                        return `${durationHours} hours`;
                                    })()
                                }</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <FaUser className="mr-2" /> User Information
                                </h3>
                                <p><span className="font-medium">Name:</span> {
                                    (currentReservation.user?.firstName && currentReservation.user?.lastName)
                                        ? `${currentReservation.user.firstName} ${currentReservation.user.lastName}`
                                        : 'Unknown User'
                                }</p>
                                <p><span className="font-medium">Email:</span> {currentReservation.user?.email || 'No email'}</p>
                                <p><span className="font-medium">User ID:</span> {currentReservation.user?._id || currentReservation.userId || 'Unknown'}</p>
                            </div>

                            <div>
                                <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    <FaMapMarkerAlt className="mr-2" /> Lot Information
                                </h3>
                                <p><span className="font-medium">Lot Name:</span> {currentReservation.lotId?.name || 'Unknown Lot'}</p>
                                <p><span className="font-medium">Address:</span> {currentReservation.lotId?.address || 'No address'}</p>
                                <p><span className="font-medium">Lot ID:</span> {currentReservation.lotId?._id || currentReservation.lotId || 'Unknown'}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className={`font-semibold mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <FaCar className="mr-2" /> Vehicle Information
                            </h3>
                            {currentReservation.vehicleInfo ? (
                                <div>
                                    <p><span className="font-medium">Plate:</span> {currentReservation.vehicleInfo.plateNumber || 'N/A'} ({currentReservation.vehicleInfo.stateProv || 'N/A'})</p>
                                    <p><span className="font-medium">Make/Model:</span> {currentReservation.vehicleInfo.make || 'N/A'} {currentReservation.vehicleInfo.model || 'N/A'}</p>
                                    <p><span className="font-medium">Color:</span> {currentReservation.vehicleInfo.color || 'N/A'}</p>
                                </div>
                            ) : (
                                <p>No vehicle information available</p>
                            )}
                        </div>

                        {currentReservation.notes && (
                            <div className="mt-4">
                                <h3 className={`font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Notes</h3>
                                <p>{currentReservation.notes}</p>
                            </div>
                        )}

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className={`px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageReservations;