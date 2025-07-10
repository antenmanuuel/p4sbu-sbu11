import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaParking, FaFilter, FaChevronDown, FaChevronUp, FaWalking, FaCar, FaBus, FaMapMarkerAlt, FaClock, FaRoute, FaArrowUp, FaArrowDown, FaPlug } from 'react-icons/fa';
import { AuthService } from '../utils/api';

const ResultsView = ({
    darkMode,
    locationName,
    formattedStartDateTime,
    formattedEndDateTime,
    nearbyParking,
    selectedParkingSpot,
    setSelectedParkingSpot,
    onViewDetails,
    onBackClick,
    transportMode = 'driving'
}) => {
    // Add state for filters
    const [priceFilter, setPriceFilter] = useState('all');
    const [distanceFilter, setDistanceFilter] = useState('all');
    const [permitFilter, setPermitFilter] = useState([]);
    const [filteredParking, setFilteredParking] = useState([]);
    const [showFilters, setShowFilters] = useState(false);
    const [userType, setUserType] = useState(null);

    // Get current user type on component mount
    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUserType(currentUser.userType);
        }
    }, []);

    // CSS for dashed line
    const dashedLineStyle = {
        backgroundImage: `linear-gradient(${darkMode ? '#6B7280' : '#9CA3AF'} 50%, transparent 50%)`,
        backgroundSize: '1px 4px',
        backgroundRepeat: 'repeat-y'
    };

    // Get transport icon based on mode
    const getTransportIcon = () => {
        switch (transportMode) {
            case 'walking':
                return <FaWalking className="mr-1" />;
            case 'driving-traffic':
                return <FaBus className="mr-1" />;
            case 'driving':
            default:
                return <FaCar className="mr-1" />;
        }
    };

    // Get transport text based on mode
    const getTransportText = () => {
        switch (transportMode) {
            case 'walking':
                return 'walk';
            case 'driving-traffic':
                return 'bus';
            case 'driving':
            default:
                return 'drive';
        }
    };

    // Get transport color class based on mode
    const getTransportColorClass = () => {
        switch (transportMode) {
            case 'walking':
                return darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-700';
            case 'driving-traffic':
                return darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-700';
            case 'driving':
            default:
                return darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700';
        }
    };

    // Extract unique permit types from all parking lots
    const uniquePermitTypes = [...new Set(nearbyParking.flatMap(spot => spot.permitTypes || []))];

    // Apply filters whenever they change or nearbyParking changes
    useEffect(() => {
        let filtered = [...nearbyParking];

        // Apply price filter
        if (priceFilter === 'hourly') {
            filtered = filtered.filter(spot => spot.rateType === 'Hourly');
            // Reset permit filter when hourly is selected
            if (permitFilter.length > 0) {
                setPermitFilter([]);
            }
        } else if (priceFilter === 'semester') {
            filtered = filtered.filter(spot => spot.rateType === 'Permit-based');
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

        // Apply distance filter
        if (distanceFilter === 'closest-first') {
            filtered.sort((a, b) => a.distanceInFeet - b.distanceInFeet);
        } else if (distanceFilter === 'farthest-first') {
            filtered.sort((a, b) => b.distanceInFeet - a.distanceInFeet);
        }

        // Apply permit filter (if any permits are selected)
        if (permitFilter.length > 0) {
            filtered = filtered.filter(spot =>
                spot.permitTypes && spot.permitTypes.some(permit => permitFilter.includes(permit))
            );
        }

        setFilteredParking(filtered);
    }, [nearbyParking, priceFilter, distanceFilter, permitFilter]);

    // Price filter dropdown section
    const renderPriceFilterOptions = () => {
        return (
            <>
                <option value="all">All Prices</option>
                <option value="hourly">Hourly Rates Only</option>
                {userType !== 'visitor' && (
                    <option value="semester">Semester Rates Only</option>
                )}
                <option value="low-to-high">Price: Low to High</option>
                <option value="high-to-low">Price: High to Low</option>
            </>
        );
    };

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

                                // Calculate travel time based on transport mode and distance
                                let travelTime;
                                if (typeof selectedSpot.distanceInFeet === 'number') {
                                    if (transportMode === 'walking') {
                                        travelTime = Math.ceil(selectedSpot.distanceInFeet / 275); // walking pace
                                    } else if (transportMode === 'driving-traffic') {
                                        travelTime = Math.ceil(selectedSpot.distanceInFeet / 900); // bus pace
                                    } else {
                                        travelTime = Math.ceil(selectedSpot.distanceInFeet / 4400); // driving pace
                                    }
                                }

                                return (
                                    <div className={`flex items-center px-2 py-1 rounded-md text-xs font-medium ${getTransportColorClass()}`}>
                                        {getTransportIcon()}
                                        <span>{travelTime || '?'} min {getTransportText()}</span>
                                    </div>
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
                                {renderPriceFilterOptions()}
                            </select>
                        </div>

                        {/* Distance Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Sort by Distance
                            </label>
                            <select
                                value={distanceFilter}
                                onChange={(e) => setDistanceFilter(e.target.value)}
                                className={`w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-red-500 ${darkMode
                                    ? 'bg-gray-700 text-white border-gray-600'
                                    : 'bg-gray-50 text-gray-900 border-gray-200'
                                    }`}
                            >
                                <option value="all">No Distance Sorting</option>
                                <option value="closest-first">Nearest Parking First</option>
                                <option value="farthest-first">Farthest Parking First</option>
                            </select>
                        </div>

                        {/* Permit Types Filter */}
                        {uniquePermitTypes.length > 0 && (
                            <div>
                                <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center justify-between`}>
                                    <span>Permit Types</span>
                                    {priceFilter === 'hourly' && (
                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            (Disabled for hourly lots)
                                        </span>
                                    )}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {uniquePermitTypes.map((permit) => (
                                        <div
                                            key={permit}
                                            onClick={() => priceFilter !== 'hourly' && handlePermitFilterChange(permit)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${priceFilter === 'hourly'
                                                ? (darkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                                                : permitFilter.includes(permit)
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
                        {(priceFilter !== 'all' || distanceFilter !== 'all' || permitFilter.length > 0) && (
                            <div className="text-right">
                                <button
                                    onClick={() => {
                                        setPriceFilter('all');
                                        setDistanceFilter('all');
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
                            setDistanceFilter('all');
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
                            className={`rounded-lg transition-all duration-200 ${spot.availableSpots > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'} overflow-hidden ${selectedParkingSpot === spot.id
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
                                onClick={() => spot.availableSpots > 0 && setSelectedParkingSpot(spot.id)}
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
                                            {spot.isEV && (
                                                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-sm ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-50 text-green-700'} flex items-center`}>
                                                    <FaPlug className="mr-1" /> EV
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-0.5`}>{spot.address}</p>

                                        {/* Transportation recommendation */}
                                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                            <div className={`flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getTransportColorClass()}`}>
                                                {getTransportIcon()}
                                                <span>
                                                    {(() => {
                                                        // Calculate travel time based on transport mode and spot's distance
                                                        if (typeof spot.distanceInFeet === 'number') {
                                                            if (transportMode === 'walking') {
                                                                return `${Math.ceil(spot.distanceInFeet / 275)} min ${getTransportText()}`;
                                                            } else if (transportMode === 'driving-traffic') {
                                                                return `${Math.ceil(spot.distanceInFeet / 900)} min ${getTransportText()}`;
                                                            } else {
                                                                return `${Math.ceil(spot.distanceInFeet / 4400)} min ${getTransportText()}`;
                                                            }
                                                        } else {
                                                            return `? min ${getTransportText()}`;
                                                        }
                                                    })()}
                                                </span>
                                            </div>

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
                                        <div className={`w-16 h-16 rounded-full ${spot.availableSpots > 0 ? 'bg-red-600' : 'bg-gray-500'} text-white flex flex-col items-center justify-center shadow-md`}>
                                            <span className="font-bold text-lg">{spot.availableSpots}</span>
                                            <span className="text-xs">spots</span>
                                        </div>
                                        <p className="text-sm font-semibold mt-1">{spot.price}</p>
                                        {spot.availableSpots === 0 && (
                                            <p className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Currently Full</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* View details button */}
                            <button
                                onClick={(e) => {
                                    if (spot.availableSpots > 0) {
                                        e.stopPropagation();
                                        onViewDetails(spot.id);
                                    }
                                }}
                                disabled={spot.availableSpots === 0}
                                className={`w-full py-2 text-white font-medium text-sm flex items-center justify-center transition-colors shadow-sm ${spot.availableSpots === 0
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : selectedParkingSpot === spot.id
                                        ? 'bg-red-700 hover:bg-red-800'
                                        : 'bg-red-600 hover:bg-red-700'
                                    }`}
                            >
                                <FaParking className="mr-2" /> {spot.availableSpots > 0 ? 'View Details' : 'No Spots Available'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ResultsView; 