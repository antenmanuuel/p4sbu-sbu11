/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import { FaArrowLeft, FaParking, FaCheckCircle, FaCar, FaWheelchair, FaChargingStation, FaInfoCircle, FaClock, FaMapMarkerAlt, FaWalking, FaLocationArrow, FaCalendarAlt, FaCreditCard, FaDollarSign, FaBus } from 'react-icons/fa';
import ReactMapGL, { Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../utils/env';

const LotDetailsView = ({
    darkMode,
    lot,
    onBackClick,
    onReserve,
    startDateTime,
    endDateTime,
    duration,
    destination,
    transportMode = 'driving' // Add transport mode parameter with default
}) => {
    // Add console log to verify we're receiving data from the backend
    console.log("Rendering lot details from backend:", lot);
    console.log("Current transport mode:", transportMode);

    // Add local state for transport mode selection
    const [localTransportMode, setLocalTransportMode] = useState(transportMode);

    // State for route between parking and destination
    const [route, setRoute] = useState(null);
    const [routeDistance, setRouteDistance] = useState(null);
    const [routeDuration, setRouteDuration] = useState(null);
    const [isLoadingRoute, setIsLoadingRoute] = useState(false);

    // Handle transport mode change
    const handleTransportModeChange = (mode) => {
        console.log(`Changing transport mode to: ${mode}`);
        setLocalTransportMode(mode);
    };

    // Get route color based on transport mode
    const getRouteColor = () => {
        switch (localTransportMode) {
            case 'walking':
                return '#10b981'; // green
            case 'driving-traffic':
                return '#ef4444'; // red
            case 'driving':
            default:
                return '#3b82f6'; // blue
        }
    };

    // Fetch directions from MapBox API based on transport mode
    useEffect(() => {
        console.log(`Transport mode changed to: ${localTransportMode}, fetching new route...`);

        const fetchRoute = async () => {
            if (!destination || !lot) return;

            setIsLoadingRoute(true);
            try {
                // Format coordinates as "lng,lat" strings
                const start = `${lot.coordinates[1]},${lot.coordinates[0]}`;
                const end = `${destination.coordinates[1]},${destination.coordinates[0]}`;

                console.log(`Fetching route with transport mode: ${localTransportMode}`);

                // Call the MapBox Directions API with the current transport mode
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/${localTransportMode}/${start};${end}?` +
                    `alternatives=false&geometries=geojson&overview=full&steps=false&` +
                    `access_token=${MAPBOX_TOKEN}`
                );

                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const routeData = data.routes[0];
                    console.log(`Route received for ${localTransportMode}:`, {
                        distance: routeData.distance,
                        duration: routeData.duration,
                        points: routeData.geometry.coordinates.length
                    });

                    // Create GeoJSON from the route geometry
                    const routeGeoJson = {
                        type: 'Feature',
                        properties: {},
                        geometry: routeData.geometry
                    };

                    setRoute(routeGeoJson);

                    // Convert distance from meters to feet and duration from seconds to minutes
                    const distanceInFeet = Math.round(routeData.distance * 3.28084);
                    const durationInMinutes = Math.round(routeData.duration / 60);

                    // Format distance to use feet or miles based on length
                    let formattedDistance;
                    if (distanceInFeet > 1000) {
                        const distanceInMiles = (distanceInFeet / 5280).toFixed(2);
                        formattedDistance = `${distanceInMiles} miles`;
                    } else {
                        formattedDistance = `${distanceInFeet} ft`;
                    }

                    setRouteDistance(formattedDistance);
                    setRouteDuration(durationInMinutes);
                }
            } catch (error) {
                console.error(`Error fetching ${localTransportMode} route:`, error);
                // Fallback to simple line
                const fallbackRoute = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [lot.coordinates[1], lot.coordinates[0]],
                            [destination.coordinates[1], destination.coordinates[0]]
                        ]
                    }
                };
                setRoute(fallbackRoute);
            } finally {
                setIsLoadingRoute(false);
            }
        };

        fetchRoute();
    }, [lot, destination, MAPBOX_TOKEN, localTransportMode]); // Add localTransportMode as dependency

    // Create fallback GeoJSON line between parking lot and destination
    const simpleLine = useMemo(() => {
        if (!destination) return null;

        return {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'LineString',
                coordinates: [
                    [lot.coordinates[1], lot.coordinates[0]],  // Parking spot
                    [destination.coordinates[1], destination.coordinates[0]] // Destination
                ]
            }
        };
    }, [lot, destination]);

    // Handle the reservation with the selected permit type
    const handleReserveClick = () => {
        // Use either the first permitted type or a default one
        const defaultPermitType = lot.permitTypes && lot.permitTypes.length > 0
            ? lot.permitTypes[0]
            : "Standard";

        console.log(`Using permit type: ${defaultPermitType} for reservation`);
        onReserve(lot.id, defaultPermitType);
    };

    // Get appropriate transport icon based on mode
    const getTransportIcon = () => {
        switch (localTransportMode) {
            case 'walking':
                return <FaWalking className={`mr-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
            case 'driving-traffic':
                return <FaBus className={`mr-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
            case 'driving':
            default:
                return <FaCar className={`mr-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
        }
    };

    // Get transport mode display text
    const getTransportText = () => {
        switch (localTransportMode) {
            case 'walking':
                return 'walk';
            case 'driving-traffic':
                return 'bus';
            case 'driving':
            default:
                return 'drive';
        }
    };

    // Calculate the estimated cost
    const estimatedCost = useMemo(() => {
        if (!lot || !duration) return "$0.00";

        // For EV charging lots, use EV rate
        if (lot.isEV) {
            const evRate = lot.evChargingRate || 1.86; // Default from image if not set
            const minHours = lot.evMinimumHours || 1;
            const maxHours = lot.evMaximumHours || 24;

            // Apply minimum and maximum hour constraints
            let chargingHours = Math.max(parseFloat(duration), minHours);
            chargingHours = Math.min(chargingHours, maxHours);

            console.log(`Calculating EV cost: ${evRate}/hour × ${chargingHours} hours = $${(chargingHours * evRate).toFixed(2)}`);
            return `$${(chargingHours * evRate).toFixed(2)}`;
        }

        // For regular hourly rates with time-based cutoff
        if (lot.rateType === 'Hourly') {
            // If we don't have start/end datetime, use simple calculation
            if (!startDateTime || !endDateTime) {
                return `$${(parseFloat(duration) * lot.hourlyRate).toFixed(2)}`;
            }

            // Convert to Date objects
            const start = new Date(startDateTime);
            const end = new Date(endDateTime);

            // Check if the reservation extends past 7PM (19:00) for metered lots
            if (lot.features && lot.features.includes('Metered Parking')) {
                // Create 7PM timestamp of the same day
                const sevenPM = new Date(start);
                sevenPM.setHours(19, 0, 0, 0);

                // Calculate billable duration respecting the 7PM cutoff
                let billableDurationHours;

                if (start.getHours() >= 19) {
                    // If starting after 7PM, no charge for metered parking
                    return "$0.00";
                } else if (end > sevenPM) {
                    // If ending after 7PM, only charge until 7PM
                    billableDurationHours = (sevenPM - start) / (1000 * 60 * 60);
                    return `$${(billableDurationHours * lot.hourlyRate).toFixed(2)}`;
                }
            }

            // Normal case: charge for full duration
            return `$${(parseFloat(duration) * lot.hourlyRate).toFixed(2)}`;
        }

        // For permit-based rates with 4PM cutoff
        if (lot.rateType === 'Permit-based' && startDateTime) {
            const start = new Date(startDateTime);

            // If starting after 4PM, permit-based lots are free
            if (start.getHours() >= 16) {
                return "$0.00";
            }
        }

        // For other cases, use the price directly
        return lot.price;
    }, [lot, duration, startDateTime, endDateTime]);

    if (!lot) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 animate-fadeIn">
            {/* Hero Section */}
            <div className="relative mb-10">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

                <div className="flex items-center mb-6">
                    <button
                        onClick={onBackClick}
                        className={`flex items-center justify-center h-12 w-12 rounded-full ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-red-500' : 'bg-red-50 hover:bg-red-100 text-red-600'} transition-colors mr-3 cursor-pointer z-10 shadow-md`}
                        aria-label="Go back"
                        type="button"
                    >
                        <FaArrowLeft className="text-lg" />
                    </button>
                    <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Lot Details
                    </h1>
                </div>

                <div className="flex items-center space-x-2 text-lg md:text-xl mb-2">
                    <div className={`${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                        <FaParking />
                    </div>
                    <h2 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {lot.name}
                    </h2>
                </div>
                <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {lot.address}
                </p>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left sidebar - Lot Information */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Map Preview Card - REMOVED */}
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-6 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 left-0 h-1 w-24 bg-gradient-to-r from-red-600 to-red-400"></div>

                            {/* Distance from destination */}
                            {destination && (
                                <div className={`flex items-center mb-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'} mr-3`}>
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Distance to {destination.name || 'Destination'}
                                        </h3>
                                        <div className="flex items-center mt-1">
                                            {getTransportIcon()}
                                            <span className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} font-medium`}>
                                                {routeDistance || '...'} • {routeDuration || '...'} min {getTransportText()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Available spaces */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Available Spaces
                                    </h3>
                                    <div className={`py-1 px-3 rounded-full text-sm font-medium ${lot.availableSpaces < 10
                                        ? (darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600')
                                        : (darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600')}`}>
                                        {lot.availableSpaces} / {lot.totalSpaces}
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-1">
                                    <div
                                        className={`h-2.5 rounded-full ${lot.availableSpaces < 10 ? 'bg-red-600' : 'bg-green-500'}`}
                                        style={{ width: `${(lot.availableSpaces / lot.totalSpaces) * 100}%` }}
                                    ></div>
                                </div>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {lot.availableSpaces < 10
                                        ? 'Limited spaces available, book soon!'
                                        : 'Plenty of spaces available'}
                                </p>
                            </div>

                            {/* Pricing */}
                            <div className="mb-6">
                                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Pricing
                                </h3>
                                <div className={`flex items-center p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'} mr-4`}>
                                        <FaDollarSign className="text-xl" />
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {lot.price}
                                        </p>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {lot.rateType}
                                        </p>
                                        {/* Time-based pricing rules */}
                                        {lot.rateType === 'Hourly' && lot.features?.includes('Metered Parking') && (
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                Free after 7:00 PM
                                            </p>
                                        )}
                                        {lot.rateType === 'Permit-based' && (
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                Free after 4:00 PM with valid permit
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="mb-6">
                                <h3 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Features
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {lot.features?.includes('EV Charging') && (
                                        <div className={`flex items-center p-2 rounded-lg ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-700'}`}>
                                            <FaChargingStation className="mr-2" />
                                            <span className="text-sm">EV Charging</span>
                                        </div>
                                    )}
                                    {lot.features?.includes('Accessible Parking') && (
                                        <div className={`flex items-center p-2 rounded-lg ${darkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-700'}`}>
                                            <FaWheelchair className="mr-2" />
                                            <span className="text-sm">Accessible</span>
                                        </div>
                                    )}
                                    {lot.features?.includes('Metered Parking') && (
                                        <div className={`flex items-center p-2 rounded-lg ${darkMode ? 'bg-yellow-900/20 text-yellow-400' : 'bg-yellow-50 text-yellow-700'}`}>
                                            <FaParking className="mr-2" />
                                            <span className="text-sm">Metered</span>
                                        </div>
                                    )}
                                    {(lot.features?.length === 0 || !lot.features) && (
                                        <div className={`flex items-center p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                            <FaInfoCircle className="mr-2" />
                                            <span className="text-sm">Standard Parking</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Description - Added back if available */}
                            {lot.description && (
                                <div className="mb-6">
                                    <h3 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Description
                                    </h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {lot.description}
                                    </p>
                                </div>
                            )}

                            {/* Last updated */}
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-4">
                                <FaClock className="mr-1" />
                                <span>Last updated: {lot.lastUpdated || 'Recently'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right content - Map and Reservation */}
                <div className="lg:col-span-2">
                    {/* Transport Mode Selector */}
                    {destination && (
                        <div className={`mb-8 flex items-center justify-center`}>
                            <div className={`inline-flex rounded-lg p-1 shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <button
                                    type="button"
                                    onClick={() => handleTransportModeChange('driving')}
                                    className={`flex items-center px-4 py-2 rounded-lg ${localTransportMode === 'driving'
                                        ? `bg-red-600 text-white`
                                        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                        } transition-colors focus:outline-none`}
                                >
                                    <FaCar className="mr-2" />
                                    Car
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTransportModeChange('walking')}
                                    className={`flex items-center px-4 py-2 rounded-lg ${localTransportMode === 'walking'
                                        ? `bg-red-600 text-white`
                                        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                        } transition-colors focus:outline-none`}
                                >
                                    <FaWalking className="mr-2" />
                                    Walk
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTransportModeChange('driving-traffic')}
                                    className={`flex items-center px-4 py-2 rounded-lg ${localTransportMode === 'driving-traffic'
                                        ? `bg-red-600 text-white`
                                        : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                                        } transition-colors focus:outline-none`}
                                >
                                    <FaBus className="mr-2" />
                                    Bus
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Main Map */}
                    <div className={`rounded-2xl overflow-hidden shadow-lg mb-8 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="h-[500px] relative">
                            <ReactMapGL
                                key={`lot-map-${lot.id}-${localTransportMode}`}
                                mapboxAccessToken={MAPBOX_TOKEN}
                                initialViewState={{
                                    longitude: lot.coordinates[1],
                                    latitude: lot.coordinates[0],
                                    zoom: 15
                                }}
                                style={{ width: '100%', height: '100%' }}
                                mapStyle="mapbox://styles/mapbox/outdoors-v12"
                            >
                                <NavigationControl position="top-right" />

                                {/* Walking path between parking lot and destination */}
                                {destination && (
                                    <>
                                        {route ? (
                                            <Source
                                                key={`route-source-${localTransportMode}`}
                                                id={`${localTransportMode}-route`}
                                                type="geojson"
                                                data={route}
                                            >
                                                <Layer
                                                    id={`${localTransportMode}-route-line`}
                                                    type="line"
                                                    paint={{
                                                        'line-color': getRouteColor(),
                                                        'line-width': 4,
                                                        'line-opacity': 0.8,
                                                        'line-dasharray': localTransportMode === 'walking' ? [0.5, 1.5] : [1, 0]
                                                    }}
                                                />
                                            </Source>
                                        ) : (
                                            // Always show a simple fallback line if route is not available
                                            <Source
                                                key={`simple-source-${localTransportMode}`}
                                                id={`${localTransportMode}-simple-route`}
                                                type="geojson"
                                                data={simpleLine}
                                            >
                                                <Layer
                                                    id={`${localTransportMode}-simple-line`}
                                                    type="line"
                                                    paint={{
                                                        'line-color': getRouteColor(),
                                                        'line-width': 3,
                                                        'line-dasharray': [2, 1],
                                                        'line-opacity': 0.7
                                                    }}
                                                />
                                            </Source>
                                        )}
                                    </>
                                )}

                                {/* Parking lot marker (red) */}
                                <Marker
                                    longitude={lot.coordinates[1]}
                                    latitude={lot.coordinates[0]}
                                    color="#dc2626"
                                />

                                {/* Destination marker (green) */}
                                {destination && (
                                    <Marker
                                        longitude={destination.coordinates[1]}
                                        latitude={destination.coordinates[0]}
                                        color="#16a34a"
                                    />
                                )}
                            </ReactMapGL>

                            {/* Map overlay */}
                            {destination && routeDistance && (
                                <div className={`absolute bottom-4 left-4 z-10 ${darkMode ? 'bg-gray-800/90 text-white' : 'bg-white/90 text-gray-900'} rounded-lg shadow-lg p-3 text-sm backdrop-blur-sm max-w-xs`}>
                                    <div className="flex items-center">
                                        {getTransportIcon()}
                                        <div>
                                            <p className="font-medium">{routeDistance} {getTransportText()} distance</p>
                                            <p className="text-xs text-gray-400">Approx. {routeDuration} min {getTransportText()}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reservation Card */}
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                            <h3 className={`text-2xl font-bold mb-6 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FaCalendarAlt className={`mr-3 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                Reservation Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</p>
                                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{startDateTime || 'Not specified'}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</p>
                                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{endDateTime || 'Not specified'}</p>
                                </div>
                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                                    <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{duration || 'Not specified'}</p>
                                </div>
                            </div>

                            {/* Pricing Summary */}
                            <div className={`p-4 mb-6 rounded-xl border-2 ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Reservation Cost
                                    </h4>
                                    <span className={`text-xl font-bold ${estimatedCost === "$0.00" ? 'text-green-500' : darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {estimatedCost === "$0.00" ? "FREE" : estimatedCost}
                                    </span>
                                </div>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {estimatedCost === "$0.00" && lot.rateType === 'Hourly' && lot.features?.includes('Metered Parking') && startDateTime && new Date(startDateTime).getHours() >= 19
                                        ? "Free after 7:00 PM for metered parking"
                                        : estimatedCost === "$0.00" && lot.rateType === 'Permit-based' && startDateTime && new Date(startDateTime).getHours() >= 16
                                            ? "Free after 4:00 PM for permit-based lots"
                                            : lot.isEV
                                                ? `$${lot.evChargingRate}/hour × ${duration.replace(' hours', '')}`
                                                : lot.rateType === 'Hourly'
                                                    ? `$${lot.hourlyRate}/hour × ${duration.replace(' hours', '')}`
                                                    : 'Semester permit rate'
                                    }
                                </p>
                            </div>

                            {/* Reserve Button */}
                            <button
                                onClick={handleReserveClick}
                                className="w-full py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg flex items-center justify-center"
                            >
                                <FaCreditCard className="mr-2" />
                                <span>Proceed to Payment</span>
                            </button>
                            <p className={`text-xs mt-2 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                You'll enter vehicle information and payment details next
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature list */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {/* Price */}
                <div className="flex items-center">
                    <FaDollarSign className="text-lg mr-2 text-green-600" />
                    <div>
                        <p className="text-xs">Price</p>
                        <p className="font-medium">{lot.price}</p>
                    </div>
                </div>

                {/* Available spaces */}
                <div className="flex items-center">
                    <FaParking className="text-lg mr-2 text-blue-600" />
                    <div>
                        <p className="text-xs">Available Spots</p>
                        <p className="font-medium">{lot.availableSpots} of {lot.totalSpaces}</p>
                    </div>
                </div>

                {/* Distance */}
                <div className="flex items-center">
                    <FaLocationArrow className="text-lg mr-2 text-purple-600" />
                    <div>
                        <p className="text-xs">Distance</p>
                        <p className="font-medium">{lot.distance || routeDistance || "Unknown"}</p>
                    </div>
                </div>

                {/* Travel Time */}
                <div className="flex items-center">
                    <FaClock className="text-lg mr-2 text-orange-600" />
                    <div>
                        <p className="text-xs">Travel Time</p>
                        <p className="font-medium">
                            {routeDuration ? `${routeDuration} min ${getTransportText()}` : "Calculating..."}
                        </p>
                    </div>
                </div>
            </div>

            {/* EV Charging Information - Only show if lot has EV features */}
            {lot.features && lot.features.isEV && (
                <div className={`mb-6 p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start">
                        <FaChargingStation className={`text-xl mr-3 mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div>
                            <h3 className={`font-bold text-lg mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                EV Charging Information
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-3">
                                <div>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Charging Rate</p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        ${lot.evChargingRate || 1.86}/hour ({lot.evMinimumHours || 1}-Hour Minimum, {lot.evMaximumHours || 24}-Hour Maximum)
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Idle Charging Fee</p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        ${lot.idleChargingFee || 2.50}/hour after {lot.evGracePeriodMinutes || 30} minute grace period
                                    </p>
                                </div>
                            </div>

                            <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                <p className="mb-2">
                                    <span className="font-medium">Note: </span>
                                    Use of EV Charging Station parking spaces requires a station wand to be plugged
                                    into a vehicle at all times.
                                </p>
                                <p>
                                    EV Charging Station parking spaces located inside of metered parking lots only
                                    require EV Charging Station payment, and not payment to the metered parking lot pay station.
                                </p>
                                <p className="mt-2">
                                    <span className="font-medium">Idle Charging Fee: </span>
                                    ${lot.idleChargingFee || 2.50}/hour for vehicles that are fully charged but remain parked.
                                    This charge will begin after a grace period of {lot.evGracePeriodMinutes || 30} minutes.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LotDetailsView;