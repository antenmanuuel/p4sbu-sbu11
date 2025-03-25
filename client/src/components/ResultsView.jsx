import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaParking, FaFilter, FaChevronDown, FaChevronUp, FaWalking, FaCar, FaBus, FaMapMarkerAlt, FaClock, FaRoute } from 'react-icons/fa';

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

    // CSS for dashed line
    const dashedLineStyle = {
        backgroundImage: `linear-gradient(${darkMode ? '#6B7280' : '#9CA3AF'} 50%, transparent 50%)`,
        backgroundSize: '1px 4px',
        backgroundRepeat: 'repeat-y'
    };

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

    // Helper to get selected spot
    const getSelectedSpot = () => {
        return nearbyParking.find(lot => lot.id === selectedParkingSpot);
    };

    return (
        <div className={`w-full animate-fadeIn ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Header section with back button */}
            <div className="flex items-center mb-4">
                <button
                    onClick={onBackClick}
                    className={`text-red-600 hover:text-red-800 mr-4 flex items-center justify-center h-10 w-10 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} transition-colors shadow-sm`}
                    aria-label="Go back"
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Results
                </h1>
                <div className="ml-auto">
                    <button
                        onClick={toggleFilters}
                        className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${darkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                        aria-expanded={showFilters}
                        aria-controls="filter-panel"
                    >
                        <FaFilter className="mr-2 text-red-600" />
                        <span className="text-sm font-medium">Filter</span>
                        {showFilters ? <FaChevronUp className="ml-1 text-sm" /> : <FaChevronDown className="ml-1 text-sm" />}
                    </button>
                </div>
            </div>

            {/* Search parameters summary */}
            <div className={`mb-4 rounded-lg shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
                {/* Info header */}
                <div className="p-3">
                    {/* Destination information */}
                    <div className="flex items-center mb-2">
                        <div className="p-1.5 bg-green-100 rounded-full mr-2 flex-shrink-0">
                            <FaMapMarkerAlt className="text-green-600 text-sm" />
                        </div>
                        <div className="w-full">
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Destination</p>
                            <p className="font-medium truncate text-sm">{locationName}</p>
                </div>
                    </div>

                    {/* Selected parking lot information - only shown when a lot is selected */}
                    {selectedParkingSpot && (
                        <div className="flex items-center mb-2">
                            <div className="p-1.5 bg-red-100 rounded-full mr-2 flex-shrink-0">
                                <FaParking className="text-red-600 text-sm" />
                            </div>
                            <div className="w-full">
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>From Parking Lot</p>
                                <p className="font-medium truncate text-sm">
                                    {getSelectedSpot()?.name || 'Selected Lot'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Time information */}
                    <div className="flex items-center">
                        <div className="p-1.5 bg-blue-100 rounded-full mr-2 flex-shrink-0">
                            <FaClock className="text-blue-600 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-2 w-full">
                            <div>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>From</p>
                                <p className="font-medium text-sm truncate">{formattedStartDateTime || '-'}</p>
                    </div>
                    <div>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>To</p>
                                <p className="font-medium text-sm truncate">{formattedEndDateTime || '-'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add journey summary when a lot is selected */}
                {selectedParkingSpot && (
                    <div className={`p-3 mt-1 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center mb-2">
                            <div className="p-1 bg-gray-200 rounded-full mr-2 flex-shrink-0">
                                <FaRoute className="text-gray-700 text-xs" />
                            </div>
                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Route Preview</p>

                            {/* Distance badge */}
                            {getSelectedSpot()?.distance && (
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                    {getSelectedSpot().distance}
                                </span>
                            )}
                        </div>

                        {/* Visual path representation */}
                        <div className="flex items-start mb-3">
                            {/* Path visualization */}
                            <div className="flex flex-col items-center mr-3">
                                <div className="w-3 h-3 rounded-full bg-red-600"></div>
                                <div className="w-0.5 h-12 bg-gray-500 my-1" style={dashedLineStyle}></div>
                                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                            </div>

                            {/* Path details */}
                            <div className="flex-1">
                                <div className="mb-2">
                                    <p className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                        {getSelectedSpot()?.name || 'Parking Lot'}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {getSelectedSpot()?.address || 'Starting point'}
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-xs font-medium ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        {locationName}
                                    </p>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Destination
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Transportation options and travel time */}
                        <div className="flex flex-wrap gap-2">
                            {(() => {
                                const selectedSpot = getSelectedSpot();
                                if (!selectedSpot) return null;

                                return (
                                    <>
                                        {/* Walking option */}
                                        {(typeof selectedSpot.distanceInFeet === 'number' && selectedSpot.distanceInFeet < 3000) && (
                                            <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                                                }`}>
                                                <FaWalking className="mr-1" />
                                                <span>{Math.ceil(selectedSpot.distanceInFeet / 275)} min walk</span>
                                            </div>
                                        )}

                                        {/* Bus option */}
                                        {(typeof selectedSpot.distanceInFeet === 'number' && selectedSpot.distanceInFeet >= 1500) && (
                                            <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'
                                                }`}>
                                                <FaBus className="mr-1" />
                                                <span>{Math.ceil(selectedSpot.distanceInFeet / 900)} min bus</span>
                                            </div>
                                        )}

                                        {/* Car option */}
                                        {(typeof selectedSpot.distanceInFeet === 'number' && selectedSpot.distanceInFeet >= 5280) && (
                                            <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'
                                                }`}>
                                                <FaCar className="mr-1" />
                                                <span>{selectedSpot.calculatedDistance ? Math.ceil(selectedSpot.calculatedDistance * 5280 / 4400) : '?'} min drive</span>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>

            {/* Filter Section */}
                {showFilters && (
                <div id="filter-panel" className={`mb-4 p-4 rounded-lg shadow-sm transition-all ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="space-y-4">
                        {/* Price Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Price
                            </label>
                            <select
                                value={priceFilter}
                                onChange={(e) => setPriceFilter(e.target.value)}
                                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-red-500 ${darkMode
                                    ? 'bg-gray-700 text-white border-gray-600'
                                    : 'bg-gray-50 text-gray-900 border-gray-200'
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
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
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
                            <div className="text-right">
                            <button
                                onClick={() => {
                                    setPriceFilter('all');
                                    setPermitFilter([]);
                                }}
                                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                            >
                                Reset Filters
                            </button>
                            </div>
                        )}
                    </div>
                    </div>
                )}

            {/* Available Spots */}
            <div className="mb-3 flex justify-between items-center">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Available Parking
                </h2>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    {filteredParking.length} {filteredParking.length === 1 ? 'spot' : 'spots'}
                </span>
            </div>

                {filteredParking.length === 0 ? (
                <div className={`p-4 text-center rounded-lg ${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-600'} shadow-sm`}>
                    <p>No parking spots match your filters.</p>
                    <button
                        onClick={() => {
                            setPriceFilter('all');
                            setPermitFilter([]);
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Reset Filters
                    </button>
                    </div>
                ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 pb-1">
                        {filteredParking.map((spot) => (
                            <div
                                key={spot.id}
                            className={`rounded-lg transition-all duration-200 cursor-pointer overflow-hidden ${selectedParkingSpot === spot.id
                                ? `${darkMode ? 'ring-2 ring-red-500' : 'ring-2 ring-red-500'} shadow-md`
                                : `shadow-sm`
                                }`}
                        >
                            {/* Card header with spots availability */}
                            <div
                                className={`p-3 ${selectedParkingSpot === spot.id
                                    ? darkMode ? 'bg-gray-700' : 'bg-white'
                                    : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'
                                    }`}
                                onClick={() => setSelectedParkingSpot(spot.id)}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <div className="flex items-start">
                                        <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{spot.name}</h3>
                                            {selectedParkingSpot === spot.id && (
                                                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-sm ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'}`}>
                                                    Selected
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>{spot.address}</p>

                                        {/* Transportation recommendation */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            {typeof spot.distanceInFeet === 'number' && spot.distanceInFeet < 1500 ? (
                                                <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    <FaWalking className="mr-1" />
                                                    <span>{Math.ceil(spot.distanceInFeet / 275)} min walk</span>
                                                </div>
                                            ) : typeof spot.distanceInFeet === 'number' && spot.distanceInFeet < 5280 ? (
                                                <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                    <FaBus className="mr-1" />
                                                    <span>{Math.ceil(spot.distanceInFeet / 900)} min bus</span>
                                                </div>
                                            ) : (
                                                <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-50 text-purple-700'
                                                    }`}>
                                                    <FaCar className="mr-1" />
                                                    <span>{spot.calculatedDistance ? Math.ceil(spot.calculatedDistance * 5280 / 4400) : '?'} min drive</span>
                                                </div>
                                            )}

                                            {/* Show bus option for longer distances */}
                                            {typeof spot.distanceInFeet === 'number' && spot.distanceInFeet >= 5280 && (
                                                <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${darkMode ? 'bg-orange-900/30 text-orange-300' : 'bg-orange-50 text-orange-700'
                                                    }`}>
                                                    <FaBus className="mr-1" />
                                                    <span>{Math.ceil(spot.distanceInFeet / 900)} min bus</span>
                                                </div>
                                            )}

                                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {spot.distance}
                                            </div>
                                        </div>

                                        {/* Permit types and features */}
                                        {spot.permitTypes && spot.permitTypes.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {spot.permitTypes.map(permit => (
                                                    <span
                                                        key={`${spot.id}-${permit}`}
                                                        className={`inline-block px-2 py-0.5 text-xs rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {permit}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Price and availability */}
                                    <div className="text-center ml-4 flex-shrink-0">
                                        <div className="w-16 h-16 rounded-full bg-red-600 text-white flex flex-col items-center justify-center shadow-md">
                                            <span className="font-bold text-lg">{spot.availableSpots}</span>
                                            <span className="text-xs">spots</span>
                                        </div>
                                        <p className="text-sm font-semibold mt-1">{spot.price}</p>
                                    </div>
                                </div>
                            </div>

                            {/* View details button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onViewDetails(spot.id);
                                    }}
                                className={`w-full py-2 text-white font-medium text-sm flex items-center justify-center transition-colors shadow-sm ${selectedParkingSpot === spot.id
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
    );
};

export default ResultsView; 