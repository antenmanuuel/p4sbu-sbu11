import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCalendarAlt, FaCarAlt, FaMapMarkerAlt, FaExclamationTriangle, FaDollarSign, FaTag, FaSort, FaSortUp, FaSortDown, FaFilter } from "react-icons/fa";
import { PermitService } from "../utils/api";

const PastPermits = ({ darkMode }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("validUntil");
    const [sortOrder, setSortOrder] = useState("desc");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pastPermits, setPastPermits] = useState([]);

    // Fetch past permits from backend - modify to always fetch all past permits
    useEffect(() => {
        const fetchPastPermits = async () => {
            setLoading(true);
            setError(null);
            try {
                // Get all past permits without server-side filtering
                const response = await PermitService.getUserPastPermits();

                if (response.success) {
                    const formattedPermits = response.permits.map(permit => ({
                        id: permit.permitNumber || permit._id,
                        type: permit.permitName || permit.permitType || 'Unknown Type',
                        lot: Array.isArray(permit.lots) && permit.lots.length > 0
                            ? permit.lots.map(lot => lot.lotName || lot.name).join(', ')
                            : 'N/A',
                        validFrom: permit.startDate,
                        validUntil: permit.endDate,
                        // Normalize status to either "Expired" or "Inactive"
                        status: new Date(permit.endDate) < new Date()
                            ? "Expired"
                            : (permit.status?.toLowerCase() === 'inactive' ? "Inactive" : permit.status || 'Unknown'),
                        rawStatus: permit.status, // Keep original status for debugging
                        price: permit.price
                    }));
                    setPastPermits(formattedPermits);
                } else {
                    throw new Error(response.error || 'Failed to fetch past permits');
                }
            } catch (error) {
                console.error('Error fetching past permits:', error);
                setError(error.message || 'An unexpected error occurred');
                setPastPermits([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPastPermits();
    }, []);

    // Function to format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (e) {
            return 'Invalid Date';
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'N/A';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Function to get status class for styling
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case "inactive":
                return darkMode
                    ? "bg-gray-600 text-gray-200 border border-gray-700"
                    : "bg-gray-100 text-gray-700 border border-gray-200";
            case "expired":
                return darkMode
                    ? "bg-yellow-600 text-yellow-200 border border-yellow-700"
                    : "bg-yellow-100 text-yellow-700 border border-yellow-200";
            default:
                return darkMode
                    ? "bg-gray-600 text-gray-300 border border-gray-700"
                    : "bg-gray-100 text-gray-500 border border-gray-200";
        }
    };

    // Filter and sort permits
    const filteredPermits = pastPermits
        .filter(permit => {
            if (filter !== "all" && permit.status?.toLowerCase() !== filter.toLowerCase()) {
                return false;
            }
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    permit.type?.toLowerCase().includes(searchLower) ||
                    permit.lot?.toLowerCase().includes(searchLower) ||
                    permit.id?.toLowerCase().includes(searchLower)
                );
            }
            return true;
        })
        .sort((a, b) => {
            let valueA, valueB;
            switch (sortBy) {
                case "validUntil":
                case "validFrom":
                    valueA = a[sortBy] ? new Date(a[sortBy]) : new Date(0);
                    valueB = b[sortBy] ? new Date(b[sortBy]) : new Date(0);
                    break;
                case "price":
                    valueA = a.price ?? 0;
                    valueB = b.price ?? 0;
                    break;
                default:
                    valueA = a[sortBy] ?? '';
                    valueB = b[sortBy] ?? '';
            }
            if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
            if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

    // Toggle sort order for a given column
    const handleSort = (column) => {
        if (sortBy === column) {
            setSortOrder(prevOrder => prevOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc'); // Default to descending for new column
        }
    };

    // Get sort icon for a column
    const getSortIcon = (column) => {
        if (sortBy !== column) {
            return <FaSort className="text-gray-400" />;
        }
        return sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    aria-label="Go back"
                    className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                >
                    <FaArrowLeft size={18} />
                </button>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Permit History</h1>
            </div>

            {/* Search and Filter Controls */}
            <div className={`p-4 rounded-lg mb-6 shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search Box */}
                    <div className="relative">
                        <label htmlFor="searchPermit" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Search</label>
                        <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                            <FaSearch className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                        <input
                            id="searchPermit"
                            type="text"
                            placeholder="Type, lot, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                        />
                    </div>

                    {/* Filter By Status */}
                    <div className="relative">
                        <label htmlFor="filterStatus" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
                        <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                            <FaFilter className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                        </div>
                        <select
                            id="filterStatus"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                        >
                            <option value="all">All Statuses</option>
                            <option value="expired">Expired</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="relative">
                        <label htmlFor="sortBy" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sort By</label>
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => handleSort(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500'
                                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500'
                                }`}
                        >
                            <option value="validUntil">Expiry Date</option>
                            <option value="validFrom">Start Date</option>
                            <option value="type">Permit Type</option>
                            <option value="lot">Parking Lot</option>
                            <option value="price">Price</option>
                        </select>
                    </div>

                    {/* Sort Order Toggle */}
                    <div className="relative">
                        <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Order</label>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className={`w-full flex items-center justify-center px-3 py-2 rounded-lg border ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                                : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {sortOrder === 'asc' ? <FaSortUp className="mr-2" /> : <FaSortDown className="mr-2" />}
                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Permits List */}
            <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {loading ? (
                    <div className="flex flex-col justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mb-4"></div>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Loading Permits...</p>
                    </div>
                ) : error ? (
                    <div className={`p-6 rounded-md m-4 ${darkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-700'}`}>
                        <p className="flex items-center">
                            <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                            Error loading permits: {error}
                        </p>
                    </div>
                ) : filteredPermits.length === 0 ? (
                    <div className="p-10 text-center">
                        <FaTag className={`mx-auto text-5xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {searchTerm || filter !== 'all' ? 'No permits found matching your criteria.' : 'You have no past permit history.'}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}">
                        {filteredPermits.map((permit, index) => (
                            <div
                                key={permit.id}
                                className={`p-4 hover:bg-opacity-50 transition-colors duration-150 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                                    {/* Permit Type & ID */}
                                    <div className="md:col-span-2">
                                        <div className="flex items-center mb-1">
                                            <FaCarAlt className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {permit.type}
                                            </h3>
                                        </div>
                                        <p className={`text-xs ml-6 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>ID: {permit.id}</p>
                                    </div>

                                    {/* Lot */}
                                    <div>
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className={`mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{permit.lot}</span>
                                        </div>
                                    </div>

                                    {/* Dates */}
                                    <div>
                                        <div className="flex items-center text-sm mb-1">
                                            <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`}>Valid:</span>
                                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(permit.validFrom)} - {formatDate(permit.validUntil)}</span>
                                        </div>
                                        <div className="flex items-center text-sm ml-6">
                                            <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mr-1`}>Expired:</span>
                                            <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatDate(permit.validUntil)}</span>
                                        </div>
                                    </div>

                                    {/* Status & Price */}
                                    <div className="text-right">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-2 ${getStatusClass(permit.status)}`}>
                                            {permit.status}
                                        </span>
                                        <p className={`font-semibold text-lg ${darkMode ? 'text-teal-400' : 'text-teal-600'}`}>{formatCurrency(permit.price)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastPermits; 