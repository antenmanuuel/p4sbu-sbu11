import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaPlug, FaMoneyBillWave, FaCarAlt, FaSearch, FaFilter, FaCalendarAlt, FaArrowLeft, FaInfoCircle, FaTimes, FaHistory, FaFileDownload, FaExclamationTriangle } from "react-icons/fa";
import { ReservationService } from "../utils/api";

const PastReservations = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [filterDateRange, setFilterDateRange] = useState("all");
    const [sortBy, setSortBy] = useState("date-desc");
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check authentication
        if (!isAuthenticated) {
            navigate("/login", { state: { from: '/past-reservations' } });
            return;
        }

        // Fetch reservations from the backend
        const fetchReservations = async () => {
            setLoading(true);
            setError(null);
            try {
                // Pass filters to specifically get past reservations (completed or canceled)
                const response = await ReservationService.getUserReservations({
                    status: 'all',
                    showPastOnly: true
                });
                console.log('Past reservations response:', response);

                if (response.success) {
                    // Check different possible data structures
                    const reservationsData = response.data?.data?.reservations || response.data?.reservations || [];

                    if (Array.isArray(reservationsData) && reservationsData.length > 0) {
                        // Transform API data to match the component's expected format
                        const formattedReservations = reservationsData.map(reservation => ({
                            id: reservation.reservationId || reservation._id,
                            lotName: reservation.lotId?.name || 'Unknown Lot',
                            spotNumber: reservation.permitType || 'Standard',
                            startTime: reservation.startTime,
                            endTime: reservation.endTime,
                            totalCost: reservation.totalPrice || 0,
                            status: reservation.status || 'Pending',
                            paymentMethod: reservation.paymentMethod || 'Credit Card',
                            chargerType: reservation.isEV ? "Level 2" : "None",
                            createdAt: reservation.createdAt || new Date().toISOString()
                        }));

                        setReservations(formattedReservations);
                    } else {
                        setReservations([]);
                    }
                } else {
                    throw new Error(response.error || 'Failed to fetch reservations');
                }
            } catch (error) {
                console.error('Error fetching past reservations:', error);
                setError(error.message || 'An unexpected error occurred while fetching reservations');
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, [isAuthenticated, navigate]);

    // Filter reservations based on search term, status, and date range
    const filteredReservations = reservations.filter(reservation => {
        // Search term filter
        const matchesSearch =
            reservation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.lotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reservation.spotNumber.toLowerCase().includes(searchTerm.toLowerCase());

        // Status filter
        const matchesStatus =
            filterStatus === "all" ||
            reservation.status.toLowerCase() === filterStatus.toLowerCase();

        // Date range filter
        let matchesDateRange = true;

        if (dateRange.start && dateRange.end) {
            const reservationDate = new Date(reservation.startTime);
            const startDate = new Date(dateRange.start);
            const endDate = new Date(dateRange.end);
            endDate.setHours(23, 59, 59); // Include the entire end day

            matchesDateRange = reservationDate >= startDate && reservationDate <= endDate;
        } else if (filterDateRange !== "all") {
            const reservationDate = new Date(reservation.startTime);
            const today = new Date();
            const lastWeek = new Date();
            lastWeek.setDate(today.getDate() - 7);
            const lastMonth = new Date();
            lastMonth.setMonth(today.getMonth() - 1);
            const lastYear = new Date();
            lastYear.setFullYear(today.getFullYear() - 1);

            if (filterDateRange === "last-week") {
                matchesDateRange = reservationDate >= lastWeek;
            } else if (filterDateRange === "last-month") {
                matchesDateRange = reservationDate >= lastMonth;
            } else if (filterDateRange === "last-year") {
                matchesDateRange = reservationDate >= lastYear;
            }
        }

        return matchesSearch && matchesStatus && matchesDateRange;
    });

    // Sort reservations
    const sortedReservations = [...filteredReservations].sort((a, b) => {
        if (sortBy === "date-desc") {
            return new Date(b.startTime) - new Date(a.startTime);
        } else if (sortBy === "date-asc") {
            return new Date(a.startTime) - new Date(b.startTime);
        } else if (sortBy === "cost-desc") {
            return b.totalCost - a.totalCost;
        } else if (sortBy === "cost-asc") {
            return a.totalCost - b.totalCost;
        }
        return 0;
    });

    const formatDateTime = (dateString) => {
        const options = {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(dateString).toLocaleString('en-US', options);
    };

    const calculateDuration = (start, end) => {
        const startTime = new Date(start);
        const endTime = new Date(end);
        const durationMs = endTime - startTime;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const handleViewDetails = (reservation) => {
        setSelectedReservation(reservation);
        setShowDetailsModal(true);
    };

    const getStatusClass = (status) => {
        if (status === "Completed") {
            return darkMode
                ? "bg-green-600 text-green-100"
                : "bg-green-100 text-green-800 border border-green-200";
        } else if (status === "Canceled") {
            return darkMode
                ? "bg-red-600 text-red-100"
                : "bg-red-100 text-red-800 border border-red-200";
        } else {
            return darkMode
                ? "bg-gray-600 text-gray-100"
                : "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Header section with back button and title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}
                        >
                            <FaArrowLeft />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center">
                                <FaHistory className="mr-2" /> Parking Reservation History
                            </h1>
                            <p className={`mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                View and manage all your past parking reservations
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium
                            ${darkMode
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
                    >
                        <FaFileDownload className="mr-2" /> Export List
                    </button>
                </div>

                {/* Main content area */}
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'} mb-8`}>
                    {/* Search and quick filters */}
                    <div className={`p-5 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
                            {/* Search */}
                            <div className="relative w-full md:w-1/3">
                                <input
                                    type="text"
                                    placeholder="Search by ID, location, or spot..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full px-4 py-2 pl-10 rounded-lg border ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        } focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                        }`}
                                />
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaSearch className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
                                </div>
                            </div>

                            {/* Quick filters */}
                            <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-start">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className={`px-4 py-2 rounded-lg border text-sm ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                        }`}
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="completed">Completed</option>
                                    <option value="canceled">Canceled</option>
                                </select>

                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className={`px-4 py-2 rounded-lg border text-sm ${darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        } focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                        }`}
                                >
                                    <option value="date-desc">Newest First</option>
                                    <option value="date-asc">Oldest First</option>
                                    <option value="cost-desc">Highest Cost</option>
                                    <option value="cost-asc">Lowest Cost</option>
                                </select>

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium ${darkMode
                                        ? showFilters ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'
                                        : showFilters ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                        }`}
                                >
                                    <FaFilter className="mr-2" />
                                    {showFilters ? 'Hide Filters' : 'More Filters'}
                                </button>
                            </div>
                        </div>

                        {/* Advanced filters */}
                        {showFilters && (
                            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Quick Date Range
                                    </label>
                                    <select
                                        value={filterDateRange}
                                        onChange={(e) => {
                                            setFilterDateRange(e.target.value);
                                            setDateRange({ start: '', end: '' }); // Clear custom date range when using preset
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm
                                            ${darkMode
                                                ? 'bg-gray-700 text-white border-gray-600'
                                                : 'bg-white text-gray-900 border-gray-300'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                            }`}
                                    >
                                        <option value="all">All Time</option>
                                        <option value="last-week">Last Week</option>
                                        <option value="last-month">Last Month</option>
                                        <option value="last-year">Last Year</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        From Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.start}
                                        onChange={(e) => {
                                            setDateRange({ ...dateRange, start: e.target.value });
                                            if (e.target.value) setFilterDateRange('all'); // Clear preset when using custom range
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm
                                            ${darkMode
                                                ? 'bg-gray-700 text-white border-gray-600'
                                                : 'bg-white text-gray-900 border-gray-300'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                            }`}
                                    />
                                </div>

                                <div>
                                    <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        To Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.end}
                                        onChange={(e) => {
                                            setDateRange({ ...dateRange, end: e.target.value });
                                            if (e.target.value) setFilterDateRange('all'); // Clear preset when using custom range
                                        }}
                                        className={`w-full px-3 py-2 rounded-lg border text-sm
                                            ${darkMode
                                                ? 'bg-gray-700 text-white border-gray-600'
                                                : 'bg-white text-gray-900 border-gray-300'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-600'
                                            }`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-20">
                            <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${darkMode ? 'border-red-400' : 'border-red-700'}`}></div>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className={`p-10 text-center ${darkMode ? 'text-red-400' : 'text-red-500'}`}>
                            <FaExclamationTriangle className="mx-auto mb-3 text-4xl" />
                            <p className="text-lg font-medium mb-2">Error loading reservations</p>
                            <p className="mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className={`px-4 py-2 rounded ${darkMode ? 'bg-red-700 hover:bg-red-600 text-white' : 'bg-red-100 hover:bg-red-200 text-red-800'}`}
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Reservations list */}
                    {!loading && !error && sortedReservations.length === 0 ? (
                        <div className={`p-10 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <FaExclamationTriangle className="mx-auto mb-3 text-4xl" />
                            <p className="text-lg font-medium mb-2">No reservations found</p>
                            <p>Try adjusting your filters or search criteria</p>
                        </div>
                    ) : !loading && !error && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                    <tr>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            ID
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Date
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Location
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Duration
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Cost
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Status
                                        </th>
                                        <th className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    {sortedReservations.map((reservation) => (
                                        <tr key={reservation.id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {reservation.id}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {formatDateTime(reservation.startTime)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                <div className="font-medium">{reservation.lotName}</div>
                                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Spot: {reservation.spotNumber}</div>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {calculateDuration(reservation.startTime, reservation.endTime)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {formatCurrency(reservation.totalCost)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(reservation.status)}`}>
                                                    {reservation.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => handleViewDetails(reservation)}
                                                    className={`px-3 py-1 rounded text-xs font-medium ${darkMode
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                                                        }`}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Reservation Details Modal */}
            {showDetailsModal && selectedReservation && (
                <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                    <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
                        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-700">
                            <h3 className="text-xl font-bold flex items-center">
                                <FaInfoCircle className="mr-2" />
                                Reservation Details
                            </h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className="font-medium mb-3">Reservation Information</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Reservation ID</p>
                                        <p className="font-medium">{selectedReservation.id}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedReservation.status)}`}>
                                            {selectedReservation.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Created On</p>
                                        <p className="font-medium">{formatDateTime(selectedReservation.createdAt)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className="font-medium mb-3">Location Details</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Parking Lot</p>
                                        <p className="font-medium">{selectedReservation.lotName}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Permit Name</p>
                                        <p className="font-medium">{selectedReservation.spotNumber}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Charger Type</p>
                                        <p className="font-medium">{selectedReservation.chargerType}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className="font-medium mb-3">Time & Duration</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</p>
                                        <p className="font-medium">{formatDateTime(selectedReservation.startTime)}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</p>
                                        <p className="font-medium">{formatDateTime(selectedReservation.endTime)}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                        <p className="font-medium">{calculateDuration(selectedReservation.startTime, selectedReservation.endTime)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <h4 className="font-medium mb-3">Payment Information</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Cost</p>
                                        <p className="font-medium text-lg">{formatCurrency(selectedReservation.totalCost)}</p>
                                    </div>
                                    <div>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Payment Method</p>
                                        <p className="font-medium">{selectedReservation.paymentMethod}</p>
                                    </div>

                                    {selectedReservation.status === "Canceled" && (
                                        <div>
                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Refund Amount</p>
                                            <p className="font-medium text-green-500">{formatCurrency(selectedReservation.refundAmount || 0)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Cancellation reason if available */}
                        {selectedReservation.status === "Canceled" && selectedReservation.cancelReason && (
                            <div className={`rounded-lg p-4 mb-6 ${darkMode ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-100'}`}>
                                <h4 className={`font-medium mb-2 ${darkMode ? 'text-red-300' : 'text-red-800'}`}>Cancellation Reason</h4>
                                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>{selectedReservation.cancelReason}</p>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode
                                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                    }`}
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

export default PastReservations; 