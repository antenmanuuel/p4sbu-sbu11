import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaParking, FaFilter, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const ResultsView = ({
    darkMode,
    locationName,
    formattedStartDateTime,
    formattedEndDateTime,
    nearbyParking,
    selectedParkingSpot,
    setSelectedParkingSpot,
    onViewDetails,
    onBackClick
}) => {
    // Add state for filters
    const [priceFilter, setPriceFilter] = useState('all');
    const [permitFilter, setPermitFilter] = useState([]);
    const [filteredParking, setFilteredParking] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Extract unique permit types from all parking lots
    const uniquePermitTypes = [...new Set(nearbyParking.flatMap(spot => spot.permitTypes || []))];

    // Apply filters whenever they change or nearbyParking changes
    useEffect(() => {
        let filtered = [...nearbyParking];

        // Apply price filter
        if (priceFilter === 'hourly') {
            filtered = filtered.filter(spot => spot.rateType === 'Hourly');
        } else if (priceFilter === 'semester') {
            filtered = filtered.filter(spot => spot.rateType === 'Semester');
        } else if (priceFilter === 'low-to-high') {
            filtered.sort((a, b) => {
                const aValue = a.rateType === 'Hourly' ? a.hourlyRate : a.semesterRate;
                const bValue = b.rateType === 'Hourly' ? b.hourlyRate : b.semesterRate;
                return aValue - bValue;
            });
        } else if (priceFilter === 'high-to-low') {
            filtered.sort((a, b) => {
                const aValue = a.rateType === 'Hourly' ? a.hourlyRate : a.semesterRate;
                const bValue = b.rateType === 'Hourly' ? b.hourlyRate : b.semesterRate;
                return bValue - aValue;
            });
        }

        // Apply permit filter (if any permits are selected)
        if (permitFilter.length > 0) {
            filtered = filtered.filter(spot =>
                spot.permitTypes && spot.permitTypes.some(permit => permitFilter.includes(permit))
            );
        }

        setFilteredParking(filtered);
    }, [nearbyParking, priceFilter, permitFilter]);

    // Handler for permit filter changes
    const handlePermitFilterChange = (permit) => {
        if (permitFilter.includes(permit)) {
            setPermitFilter(permitFilter.filter(p => p !== permit));
        } else {
            setPermitFilter([...permitFilter, permit]);
        }
    };

    // Toggle filter visibility
    const toggleFilters = () => {
        setShowFilters(!showFilters);
    };

    return (
        <div className={`w-full animate-fadeIn ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Header section with back button */}
            <div className="flex items-center mb-4">
                <button
                    onClick={onBackClick}
                    className={`text-red-600 hover:text-red-800 mr-4 flex items-center p-2 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Results
                </h1>
            </div>

            {/* Search parameters summary */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <div className="mb-2">
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Location</p>
                    <p className="font-medium truncate">{locationName}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</p>
                        <p className="font-medium">{formattedStartDateTime || 'Not specified'}</p>
                    </div>
                    <div>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</p>
                        <p className="font-medium">{formattedEndDateTime || 'Not specified'}</p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className={`mb-4 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Filters
                    </h2>
                    <button
                        onClick={toggleFilters}
                        className="flex items-center text-red-600 hover:text-red-800 transition-colors"
                    >
                        <FaFilter className="mr-1" />
                        {showFilters ? <FaChevronUp className="ml-1" /> : <FaChevronDown className="ml-1" />}
                    </button>
                </div>

                {showFilters && (
                    <div className="mt-3 space-y-4">
                        {/* Price Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Price
                            </label>
                            <select
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value)}
                                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-red-500 ${darkMode
                                    ? 'bg-gray-800 text-white border-gray-700'
                                    : 'bg-white text-gray-900 border-gray-300'
                                    }`}
                            >
                                <option value="all">All Prices</option>
                                <option value="hourly">Hourly Rates Only</option>
                                <option value="semester">Semester Rates Only</option>
                                <option value="low-to-high">Price: Low to High</option>
                                <option value="high-to-low">Price: High to Low</option>
                            </select>
                        </div>

                        {/* Permit Types Filter */}
                        {uniquePermitTypes.length > 0 && (
                            <div>
                                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Permit Types
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {uniquePermitTypes.map((permit) => (
                                        <div
                                            key={permit}
                                            onClick={() => handlePermitFilterChange(permit)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${permitFilter.includes(permit)
                                                ? 'bg-red-600 text-white'
                                                : darkMode
                                                    ? 'bg-gray-600 text-white hover:bg-gray-500'
                                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                                }`}
                                        >
                                            {permit}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Reset Filters */}
                        {(priceFilter !== 'all' || permitFilter.length > 0) && (
                            <button
                                onClick={() => {
                                    setPriceFilter('all');
                                    setPermitFilter([]);
                                }}
                                className="text-sm text-red-600 hover:text-red-800 underline"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Available Spots */}
            <div className={`p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Available Parking ({filteredParking.length})
                </h2>

                {filteredParking.length === 0 ? (
                    <div className={`p-4 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        No parking spots match your filters. Try adjusting your criteria.
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {filteredParking.map((spot) => (
                            <div
                                key={spot.id}
                                className={`p-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 cursor-pointer ${darkMode ? 'bg-gray-800' : 'bg-gray-50'
                                    } ${selectedParkingSpot === spot.id ? 'ring-2 ring-red-500' : ''
                                    }`}
                                onClick={() => setSelectedParkingSpot(spot.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-grow">
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{spot.name}</h3>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{spot.address}</p>
                                        <p className="text-sm font-medium mt-1">Distance: {spot.distance}</p>

                                        {/* Display permit types in a horizontal layout */}
                                        {spot.permitTypes && spot.permitTypes.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {spot.permitTypes.map(permit => (
                                                    <span
                                                        key={`${spot.id}-${permit}`}
                                                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-800'
                                                            }`}
                                                    >
                                                        {permit}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-center ml-4 flex-shrink-0">
                                        <div className="w-14 h-14 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-md">
                                            <span className="font-bold text-base">{spot.availableSpots}</span>
                                            <span className="text-xs">spots</span>
                                        </div>
                                        <p className="text-sm font-semibold mt-1">{spot.price}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewDetails(spot.id);
                                    }}
                                    className={`w-full py-2 text-white rounded-md font-medium text-sm flex items-center justify-center transition-colors shadow-sm ${selectedParkingSpot === spot.id
                                            ? 'bg-red-700 hover:bg-red-800'
                                            : 'bg-red-600 hover:bg-red-700'
                                        }`}
                                >
                                    <FaParking className="mr-2" /> View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResultsView; 