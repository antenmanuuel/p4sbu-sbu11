
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch, FaCalendarAlt, FaCarAlt, FaMapMarkerAlt, FaExclamationTriangle } from "react-icons/fa";
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

    // Fetch past permits from backend
    useEffect(() => {
        const fetchPastPermits = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await PermitService.getUserPastPermits();

                if (response.success) {
                    // Transform the permits data to match our component's format
                    const formattedPermits = response.permits.map(permit => ({
                        id: permit.permitNumber || permit._id,
                        type: permit.permitName || permit.permitType,
                        lot: Array.isArray(permit.lots) && permit.lots.length > 0
                            ? permit.lots.map(lot => lot.lotName || lot.name).join(', ')
                            : 'Unknown',
                        validFrom: permit.startDate,
                        validUntil: permit.endDate,
                        status: new Date(permit.endDate) < new Date() ? "Expired" : permit.status,
                        price: `$${permit.price.toFixed(2)}`
                    }));

                    setPastPermits(formattedPermits);
                } else {
                    throw new Error(response.error || 'Failed to fetch past permits');
                }
            } catch (error) {
                console.error('Error fetching past permits:', error);
                setError(error.message || 'An unexpected error occurred');
                // Set empty array to avoid undefined errors
                setPastPermits([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPastPermits();
    }, []);

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to get status class for styling
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 border border-green-200";
            case "expired":
                return "bg-gray-100 text-gray-800 border border-gray-200";
            case "cancelled":
                return "bg-red-100 text-red-800 border border-red-200";
            case "suspended":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    // Filter and sort permits
    const filteredPermits = pastPermits
        .filter(permit => {
            // Filter by status
            if (filter !== "all" && permit.status.toLowerCase() !== filter.toLowerCase()) {
                return false;
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    permit.type.toLowerCase().includes(searchLower) ||
                    permit.lot.toLowerCase().includes(searchLower) ||
                    permit.id.toLowerCase().includes(searchLower)
                );
            }

            return true;
        })
        .sort((a, b) => {
            // Sort by selected field
            let valueA, valueB;

            switch (sortBy) {
                case "validUntil":
                case "validFrom":
                    valueA = new Date(a[sortBy]);
                    valueB = new Date(b[sortBy]);
                    break;
                case "price":
                    valueA = parseFloat(a.price.replace(/[^0-9.-]+/g, ""));
                    valueB = parseFloat(b.price.replace(/[^0-9.-]+/g, ""));
                    break;
                default:
                    valueA = a[sortBy];
                    valueB = b[sortBy];
            }

            // Apply sort order
            if (sortOrder === "asc") {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                    <FaArrowLeft />
                </button>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Permit History</h1>
            </div>

            {/* Search and Filter Controls */}
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Box */}
                    <div className="md:w-1/3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by type, lot, or ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Filter By Status */}
                    <div className="md:w-1/5">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="all">All Statuses</option>
                            <option value="expired">Expired</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="md:w-1/5">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="validUntil">Expiry Date</option>
                            <option value="validFrom">Start Date</option>
                            <option value="type">Permit Type</option>
                            <option value="lot">Parking Lot</option>
                            <option value="price">Price</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="md:w-1/5">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Permits List */}
            <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div>
                    </div>
                ) : error ? (
                    <div className={`p-6 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
                        <p className="flex items-center">
                            <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                            {error}
                        </p>
                    </div>
                ) : filteredPermits.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No permits found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 p-6">
                        {filteredPermits.map((permit) => (
                            <div
                                key={permit.id}
                                className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                            >
                                <div className="flex flex-col md:flex-row justify-between">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-start mb-2">
                                            <FaCarAlt className={`mt-1 mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            <div>
                                                <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {permit.type}
                                                </h3>
                                                <div className="flex items-center mt-1">
                                                    <FaMapMarkerAlt className={`mr-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                        {permit.lot}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(permit.status)}`}>
                                            {permit.status}
                                        </span>
                                        <p className={`mt-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {permit.price}
                                        </p>
                                    </div>
                                </div>

                                <div className={`mt-4 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <div className="flex items-center">
                                        <FaCalendarAlt className={`mr-2 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                                        <div className="flex flex-col sm:flex-row sm:items-center">
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                <span className="font-medium">Valid From:</span> {formatDate(permit.validFrom)}
                                            </p>
                                            <span className="hidden sm:inline mx-2">•</span>
                                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                <span className="font-medium">Valid Until:</span> {formatDate(permit.validUntil)}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Permit ID: {permit.id}
                                    </p>
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