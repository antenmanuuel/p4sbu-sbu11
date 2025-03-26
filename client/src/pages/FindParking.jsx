import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ResultsView from '../components/ResultsView';
import LotDetailsView from '../components/LotDetailsView';
import CarInfoForm from '../components/CarInfoForm';
import PaymentPage from '../components/PaymentPage';
import { mockParkingLots } from '../utils/fakeData';
import { LotService } from '../utils/api';
// Import Mapbox components
import ReactMapGL, { Marker, NavigationControl, GeolocateControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Import environment variables from our utility
import { MAPBOX_TOKEN } from '../utils/env';
import { calculatePathDistances } from '../utils/pathFinding';
// Import SBU locations data
import { sbuLocations, searchSbuLocations } from '../utils/sbuLocations';

// Verify token is available - developers will see this error in console
if (!MAPBOX_TOKEN) {
    console.error(
        "Mapbox token not found! Please add your token to the .env file as REACT_APP_MAPBOX_TOKEN"
    );
}

const FindParking = ({ darkMode, isAuthenticated }) => {
    // Add useNavigate hook
    const navigate = useNavigate();

    // View states: 'search', 'results', 'details', 'car-info', 'payment', 'confirmation'
    const [currentView, setCurrentView] = useState('search');

    // Search states
    const [searching, setSearching] = useState(false);

    // Form states
    const [address, setAddress] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState('');

    // Location states - Default to Stony Brook University
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState({
        longitude: -73.1259,
        latitude: 40.9148,
        zoom: 14
    });

    // Parking spots
    const [nearbyParking, setNearbyParking] = useState([]);
    const [selectedLot, setSelectedLot] = useState(null);

    // Reservation states
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [reservationId, setReservationId] = useState(null);

    // Add error state
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Add error states
    const [formErrors, setFormErrors] = useState({
        address: '',
        date: '',
        startTime: '',
        endTime: '',
        duration: ''
    });

    // Add state for custom SBU location suggestions
    const [sbuSuggestions, setSbuSuggestions] = useState([]);
    const [showSbuSuggestions, setShowSbuSuggestions] = useState(false);

    // State for storing walking routes
    const [selectedLotRoute, setSelectedLotRoute] = useState(null);

    // Effect to restore reservation data from sessionStorage if present
    useEffect(() => {
        const pendingReservation = sessionStorage.getItem('pendingReservation');

        if (pendingReservation && isAuthenticated) {
            try {
                const reservationData = JSON.parse(pendingReservation);

                // Restore state from saved reservation data
                setSelectedLot(reservationData.selectedLot);
                setAddress(reservationData.address || '');
                setDate(reservationData.date || '');
                setStartTime(reservationData.startTime || '');
                setEndTime(reservationData.endTime || '');
                setDuration(reservationData.duration || '');
                setSelectedLocation(reservationData.selectedLocation);
                setCurrentView(reservationData.currentView);

                // If we have a selected lot, also get the nearby parking
                if (reservationData.selectedLocation) {
                    fetchParkingLots(
                        reservationData.selectedLocation.coordinates[0],
                        reservationData.selectedLocation.coordinates[1]
                    );
                }

                // Clear the pending reservation from session storage
                sessionStorage.removeItem('pendingReservation');

                console.log('Restored reservation data from session storage');
            } catch (error) {
                console.error('Failed to restore reservation data:', error);
                // Clear invalid reservation data
                sessionStorage.removeItem('pendingReservation');
            }
        }
    }, [isAuthenticated]);

    // Fetch walking route when a lot is selected
    useEffect(() => {
        const fetchWalkingRoute = async () => {
            if (!selectedLot || !selectedLocation) {
                setSelectedLotRoute(null);
                return;
            }

            // Skip the API call if the token is missing or empty
            if (!MAPBOX_TOKEN) {
                console.warn("Mapbox token is missing - using fallback straight line");
                // Fallback to simple line
                const fallbackRoute = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [selectedLot.coordinates[1], selectedLot.coordinates[0]],
                            [selectedLocation.coordinates[1], selectedLocation.coordinates[0]]
                        ]
                    }
                };
                setSelectedLotRoute(fallbackRoute);
                return;
            }

            try {
                // Format coordinates as "lng,lat" strings
                const start = `${selectedLot.coordinates[1]},${selectedLot.coordinates[0]}`;
                const end = `${selectedLocation.coordinates[1]},${selectedLocation.coordinates[0]}`;

                // Call the MapBox Directions API
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/walking/${start};${end}?` +
                    `alternatives=false&geometries=geojson&overview=full&steps=false&` +
                    `access_token=${MAPBOX_TOKEN}`
                );

                // Check if the response is ok
                if (!response.ok) {
                    throw new Error(`Mapbox API error: ${response.status} - ${response.statusText}`);
                }

                const data = await response.json();

                if (data.routes && data.routes.length > 0) {
                    const route = data.routes[0];

                    // Create GeoJSON from the route geometry
                    const routeGeoJson = {
                        type: 'Feature',
                        properties: {},
                        geometry: route.geometry
                    };

                    setSelectedLotRoute(routeGeoJson);
                } else {
                    throw new Error("No routes returned from Mapbox API");
                }
            } catch (error) {
                console.error("Error fetching walking route:", error);
                // Fallback to simple line
                const fallbackRoute = {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: [
                            [selectedLot.coordinates[1], selectedLot.coordinates[0]],
                            [selectedLocation.coordinates[1], selectedLocation.coordinates[0]]
                        ]
                    }
                };
                setSelectedLotRoute(fallbackRoute);
            }
        };

        fetchWalkingRoute();
    }, [selectedLot, selectedLocation, MAPBOX_TOKEN]);

    // Handle custom SBU location search
    const handleAddressChange = (e) => {
        const query = e.target.value;
        setAddress(query);

        if (query.trim()) {
            // Clear address errors
            setFormErrors(prev => ({ ...prev, address: '' }));

            // Search for SBU locations matching the query
            const matches = searchSbuLocations(query);
            setSbuSuggestions(matches);
            setShowSbuSuggestions(matches.length > 0);
        } else {
            setSbuSuggestions([]);
            setShowSbuSuggestions(false);
        }
    };

    // Handle selection of an SBU location from suggestions
    const handleSbuLocationSelect = (location) => {
        setSelectedLocation({
            name: location.name,
            address: location.name,
            coordinates: [location.coordinates[1], location.coordinates[0]]
        });

            setMapCenter({
            longitude: location.coordinates[0],
            latitude: location.coordinates[1],
            zoom: 16
        });

        setAddress(location.name);
        setShowSbuSuggestions(false);
    };

    // Format date for display
    const formatDateTime = (date, time) => {
        if (!date || !time) return "";

        const [year, month, day] = date.split('-');
        const [hours, minutes] = time.split(':');

        return new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        }).format(new Date(year, month - 1, day, hours, minutes));
    };

    // Calculate duration when start and end times change
    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);
            if (end > start) {
                const diff = (end - start) / (1000 * 60 * 60); // Duration in hours
                setDuration(`${diff.toFixed(1)} hours`);
                // Clear any duration errors when valid
                setFormErrors(prev => ({ ...prev, duration: '', endTime: '' }));
            } else {
                // Handle case where end time is before start time
                setDuration('');
                setFormErrors(prev => ({
                    ...prev,
                    endTime: 'End time must be after start time',
                    duration: 'Invalid time range'
                }));
            }
        } else {
            setDuration('');
        }
    }, [startTime, endTime]);

    // Fetch parking lots based on center coordinates
    const fetchParkingLots = async (lat, lng) => {
        setIsLoading(true);
        setError('');

        try {
            const result = await LotService.getAll({ status: 'Active' });

            if (result.success) {
                const activeLots = result.data.lots.filter(lot => lot.status === 'Active');

                // Transform the data to match the expected format
                const lots = activeLots.map(lot => {
                    // Transform features to array for compatibility with UI
                    const featuresArray = [];
                    if (lot.features) {
                        if (lot.features.isEV) featuresArray.push('EV Charging');
                        if (lot.features.isMetered) featuresArray.push('Metered Parking');
                        if (lot.features.isAccessible) featuresArray.push('Accessible Parking');
                    }

                    return {
                        id: lot._id,
                        name: lot.name,
                        address: lot.address,
                        description: lot.description || '',
                        coordinates: [lot.location.latitude, lot.location.longitude],
                        availableSpaces: lot.availableSpaces,
                        totalSpaces: lot.totalSpaces,
                        availableSpots: lot.availableSpaces, // For compatibility with ResultsView
                        permitTypes: lot.permitTypes,
                        features: featuresArray, // Use the array of features instead of the object
                        rateType: lot.rateType,
                        hourlyRate: lot.hourlyRate || 0,
                        semesterRate: lot.semesterRate || 0,
                        price: lot.rateType === 'Hourly'
                            ? `$${lot.hourlyRate}/hr`
                            : `$${lot.semesterRate}/semester with permit`,
                        status: lot.status
                    };
                });

                // Use Dijkstra's algorithm to calculate path distances
                const lotsWithDistances = calculatePathDistances([lat, lng], lots);

                // Sort by calculated distance
                const sortedLots = lotsWithDistances.sort((a, b) =>
                    a.calculatedDistance - b.calculatedDistance
                );

                setNearbyParking(sortedLots);
            } else {
                setError(result.error || 'Failed to fetch parking lots');
                // Fall back to mock data
                setNearbyParking(mockParkingLots);
            }
        } catch (err) {
            console.error('Error fetching parking lots:', err);
            setError('An unexpected error occurred while fetching parking lots');
            // Fall back to mock data
            setNearbyParking(mockParkingLots);
        } finally {
            setIsLoading(false);
        }
    };

    // Validate form before submission
    const validateForm = () => {
        let isValid = true;
        const errors = {
            address: '',
            date: '',
            startTime: '',
            endTime: '',
            duration: ''
        };

        // Check for required fields
        if (!address.trim()) {
            errors.address = 'Address is required';
            isValid = false;
        }

        if (!date) {
            errors.date = 'Date is required';
            isValid = false;
        } else {
            // Validate date is not in the past
            const selectedDate = new Date(date);
            selectedDate.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate < today) {
                errors.date = 'Date cannot be in the past';
                isValid = false;
            }
        }

        if (!startTime) {
            errors.startTime = 'Start time is required';
            isValid = false;
        }

        if (!endTime) {
            errors.endTime = 'End time is required';
            isValid = false;
        }

        // Check time range validity
        if (startTime && endTime) {
            const start = new Date(`2000-01-01T${startTime}`);
            const end = new Date(`2000-01-01T${endTime}`);

            if (end <= start) {
                errors.endTime = 'End time must be after start time';
                isValid = false;
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    // Handle search submission
    const handleSearch = async (e) => {
        e.preventDefault();

        // Validate form first
        if (!validateForm()) {
            return;
        }

        // Check if we have a matching SBU location
        const matchingSBULocation = sbuSuggestions.find(loc =>
            loc.name.toLowerCase() === address.toLowerCase() ||
            address.toLowerCase().includes(loc.name.toLowerCase())
        );

        let locationToUse = selectedLocation;

        // If we found a matching SBU location, use it directly
        if (matchingSBULocation) {
            locationToUse = {
                name: matchingSBULocation.name,
                address: matchingSBULocation.name,
                coordinates: [matchingSBULocation.coordinates[1], matchingSBULocation.coordinates[0]]
            };
                    setSelectedLocation(locationToUse);
        }
        // If no valid location has been set yet, use the entered address with map center
        else if (!locationToUse) {
            locationToUse = {
                name: address || "Selected Location",
                address: address || "Stony Brook University",
            coordinates: [mapCenter.latitude, mapCenter.longitude]
        };
        setSelectedLocation(locationToUse);
        }

        setSearching(true);
        setCurrentView('results');

        // Fetch real parking lot data from the API
        await fetchParkingLots(locationToUse.coordinates[0], locationToUse.coordinates[1]);
        setSearching(false);
    };

    // Handle clicking back button
    const handleBackClick = () => {
        if (currentView === 'results') {
            setCurrentView('search');
        } else if (currentView === 'details') {
            setCurrentView('results');
            setSelectedLot(null);
        }
    };

    // Handle clicking on a map marker
    const handleMarkerClick = (lot) => {
        // If we receive an ID instead of a lot object, find the corresponding lot
        if (typeof lot === 'string' || typeof lot === 'number') {
            const foundLot = nearbyParking.find(item => item.id === lot);
            if (foundLot) {
                setSelectedLot(foundLot);
            }
        } else {
        setSelectedLot(lot);
        }
    };

    // Handle clicking "View Details" on a lot
    const handleViewDetails = async (lotId) => {
        setIsLoading(true);
        setError('');

        try {
            console.log(`Fetching details for lot ID: ${lotId}`);
            const result = await LotService.getById(lotId);

            if (result.success) {
                const lot = result.data.lot;
                console.log("Lot data from backend:", lot);

                // Convert features object to array for compatibility with the UI
                const featuresArray = [];
                if (lot.features) {
                    if (lot.features.isEV) featuresArray.push('EV Charging');
                    if (lot.features.isMetered) featuresArray.push('Metered Parking');
                    if (lot.features.isAccessible) featuresArray.push('Accessible Parking');
                }

                // Transform the data to match the expected format in the component
                const formattedLot = {
                    id: lot._id,
                    name: lot.name,
                    address: lot.address,
                    description: lot.description || '',
                    coordinates: [lot.location.latitude, lot.location.longitude],
                    availableSpaces: lot.availableSpaces,
                    totalSpaces: lot.totalSpaces,
                    availableSpots: lot.availableSpaces, // For compatibility
                    permitTypes: lot.permitTypes || [],
                    features: featuresArray, // Use the array version of features
                    rateType: lot.rateType,
                    hourlyRate: lot.hourlyRate || 0,
                    semesterRate: lot.semesterRate || 0,
                    price: lot.rateType === 'Hourly'
                        ? `$${lot.hourlyRate}/hr`
                        : `$${lot.semesterRate}/semester with permit`,
                    status: lot.status,
                    // Include any additional fields from the backend that might be useful
                    lastUpdated: new Date(lot.updatedAt || Date.now()).toLocaleString() // Use real update date
                };

                setSelectedLot(formattedLot);
                setMapCenter({
                    longitude: formattedLot.coordinates[1],
                    latitude: formattedLot.coordinates[0],
                    zoom: 16
                });
                setCurrentView('details');
            } else {
                setError(result.error || 'Failed to fetch lot details');
                console.error('Error fetching lot details:', result.error);
            }
        } catch (err) {
            console.error('Error fetching lot details:', err);
            setError('An unexpected error occurred while fetching lot details');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle map click for location selection
    const handleMapClick = (event) => {
        if (currentView !== 'search') return;

        const { lngLat } = event;

        // In a real app, you would use reverse geocoding here
        const clickedLocation = {
            name: "Selected Location",
            address: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
            coordinates: [lngLat.lat, lngLat.lng]
        };

        setSelectedLocation(clickedLocation);
        setMapCenter({
            longitude: lngLat.lng,
            latitude: lngLat.lat,
            zoom: 14
        });
        setAddress(clickedLocation.address);
    };

    // Handle reservation request
    const handleReserve = (lotId) => {
        if (!isAuthenticated) {
            // Save reservation data to sessionStorage before redirecting
            const reservationData = {
                selectedLot: selectedLot,
                address: address,
                date: date,
                startTime: startTime,
                endTime: endTime,
                duration: duration,
                selectedLocation: selectedLocation,
                currentView: 'details'
            };
            sessionStorage.setItem('pendingReservation', JSON.stringify(reservationData));

            // Redirect to login page
            navigate('/login', { state: { from: '/find-parking', reservationPending: true } });
        } else {
            // If authenticated, proceed to car information form
            console.log('Proceeding to car info for lot:', lotId);
            setCurrentView('car-info');
        }
    };

    // Handle car information submission
    const handleCarInfoSubmit = (carData) => {
        setVehicleInfo(carData);
        setCurrentView('payment');
    };

    // Handle payment completion
    const handlePaymentComplete = (paymentData) => {
        setPaymentInfo(paymentData);

        // Generate a fake reservation ID
        setReservationId('RES' + Math.floor(Math.random() * 1000000));

        // Show confirmation
        setCurrentView('confirmation');
    };

    // Handle back button from car-info or payment views
    const handlePaymentBackClick = () => {
        if (currentView === 'payment') {
            setCurrentView('car-info');
        } else if (currentView === 'car-info') {
            setCurrentView('details');
        } else if (currentView === 'confirmation') {
            // Reset the entire flow
            setCurrentView('search');
            setSelectedLocation(null);
            setSelectedLot(null);
            setVehicleInfo(null);
            setPaymentInfo(null);
            setReservationId(null);
        }
    };

    // Add a function to render the error message
    const renderError = () => {
        if (!error) return null;

        return (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'} mb-4`}>
                <p>{error}</p>
            </div>
        );
    };

    // Add a function to render the loading indicator
    const renderLoadingIndicator = () => {
        if (!isLoading) return null;

        return (
            <div className="flex justify-center items-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
        );
    };

    // Render appropriate view based on state
    const renderContent = () => {
        switch (currentView) {
            case 'search':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4 py-8">
                        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Find Parking
                        </h1>

                        <p className="mb-4 text-gray-900 dark:text-gray-300">
                            Search for parking spots near your location or a specific address
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Search Form */}
                            <div className={`p-6 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                                <form onSubmit={handleSearch} className="space-y-5">
                                    <div>
                                        <label htmlFor="address" className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Address
                                        </label>
                                        <div className="relative">
                                            {/* Replace Mapbox AddressAutofill with a simple input for SBU locations */}
                                            <input
                                                type="text"
                                                id="address"
                                                name="address"
                                                placeholder="Enter Stony Brook location"
                                                value={address}
                                                onChange={handleAddressChange}
                                                className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                    ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600'
                                                    : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500'
                                                    } border focus:outline-none focus:ring-2 ${formErrors.address ? 'border-red-500' : ''}`}
                                                autoComplete="off"
                                            />

                                            {/* SBU Location Suggestions */}
                                            {showSbuSuggestions && sbuSuggestions.length > 0 && (
                                                <div className={`mt-1 absolute z-50 w-full max-h-40 overflow-y-auto rounded-md shadow-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                                                    }`}>
                                                    <ul className="text-sm">
                                                        {sbuSuggestions.slice(0, 5).map((location, index) => (
                                                            <li
                                                                key={`sbu-${index}`}
                                                                className={`px-2 py-1 cursor-pointer hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'
                                                                    } transition-colors border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'
                                                                    }`}
                                                                onClick={() => handleSbuLocationSelect(location)}
                                                            >
                                                                <div className="font-medium">{location.name}</div>
                                                            </li>
                                                        ))}
                                                        {sbuSuggestions.length > 5 && (
                                                            <li className="px-2 py-1 text-xs text-gray-500 italic">
                                                                {sbuSuggestions.length - 5} more results...
                                                            </li>
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        {formErrors.address && (
                                            <p className={`mt-1 text-sm text-red-500`}>{formErrors.address}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="date" className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            id="date"
                                            placeholder="Select date"
                                            value={date}
                                            onChange={(e) => {
                                                setDate(e.target.value);
                                                if (e.target.value) {
                                                    setFormErrors(prev => ({ ...prev, date: '' }));
                                                }
                                            }}
                                            min={new Date().toISOString().split('T')[0]} // Set min date to today
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark]'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2 ${formErrors.date ? 'border-red-500' : ''}`}
                                        />
                                        {formErrors.date && (
                                            <p className={`mt-1 text-sm text-red-500`}>{formErrors.date}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="startTime" className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Start Time
                                        </label>
                                        <input
                                            type="time"
                                            id="startTime"
                                            placeholder="Select start time"
                                            value={startTime}
                                            onChange={(e) => {
                                                setStartTime(e.target.value);
                                                if (e.target.value) {
                                                    setFormErrors(prev => ({ ...prev, startTime: '' }));
                                                }
                                            }}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2 ${formErrors.startTime ? 'border-red-500' : ''}`}
                                        />
                                        {formErrors.startTime && (
                                            <p className={`mt-1 text-sm text-red-500`}>{formErrors.startTime}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="endTime" className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            End Time
                                        </label>
                                        <input
                                            type="time"
                                            id="endTime"
                                            placeholder="Select end time"
                                            value={endTime}
                                            onChange={(e) => {
                                                setEndTime(e.target.value);
                                                if (e.target.value) {
                                                    setFormErrors(prev => ({ ...prev, endTime: '' }));
                                                }
                                            }}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2 ${formErrors.endTime ? 'border-red-500' : ''}`}
                                        />
                                        {formErrors.endTime && (
                                            <p className={`mt-1 text-sm text-red-500`}>{formErrors.endTime}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="duration" className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            Duration
                                        </label>
                                        <input
                                            type="text"
                                            id="duration"
                                            placeholder=""
                                            value={duration}
                                            readOnly
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700'
                                                : 'bg-gray-100 text-gray-900 border-gray-300'
                                                } border ${formErrors.duration ? 'border-red-500' : ''}`}
                                        />
                                        {formErrors.duration && (
                                            <p className={`mt-1 text-sm text-red-500`}>{formErrors.duration}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={searching}
                                        className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-md transition-colors shadow-md"
                                    >
                                        {searching ? 'Searching...' : 'Search for Parking'}
                                    </button>
                                </form>
                            </div>

                            {/* Map Section */}
                            <div className="h-[500px] rounded-lg overflow-hidden shadow-lg relative">
                                <div className={`absolute top-2 left-2 z-10 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-md shadow-md p-2 text-sm`}>
                                    <p className="font-medium">Click on the map to select a location</p>
                                </div>
                                <ReactMapGL
                                    mapboxAccessToken={MAPBOX_TOKEN}
                                    initialViewState={mapCenter}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/outdoors-v12" // Terrain view
                                    onClick={handleMapClick}
                                >
                                    <GeolocateControl position="top-right" />
                                    <NavigationControl position="top-right" />

                                    {/* Add SBU location markers - show all locations */}
                                    {sbuLocations.map((location, index) => (
                                        <Marker
                                            key={`marker-${index}`}
                                            longitude={location.coordinates[0]}
                                            latitude={location.coordinates[1]}
                                            color="#dc2626"
                                            scale={0.7}
                                            onClick={(e) => {
                                                e.originalEvent.stopPropagation();
                                                handleSbuLocationSelect(location);
                                            }}
                                        />
                                    ))}

                                    {selectedLocation && (
                                        <Marker
                                            longitude={selectedLocation.coordinates[1]}
                                            latitude={selectedLocation.coordinates[0]}
                                            color="#dc2626" // Red color to match theme
                                        />
                                    )}
                                </ReactMapGL>
                            </div>
                        </div>
                    </div>
                );

            case 'results':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4 py-8">
                        {renderError()}
                        {renderLoadingIndicator()}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left sidebar with results list */}
                            <div className="md:col-span-1">
                                <ResultsView
                                    darkMode={darkMode}
                                    locationName={selectedLocation ? selectedLocation.name : 'Selected Location'}
                                    formattedStartDateTime={formatDateTime(date, startTime)}
                                    formattedEndDateTime={formatDateTime(date, endTime)}
                                    nearbyParking={nearbyParking}
                                    selectedParkingSpot={selectedLot ? selectedLot.id : null}
                                    setSelectedParkingSpot={handleMarkerClick}
                                    onViewDetails={handleViewDetails}
                                    onBackClick={handleBackClick}
                                />
                            </div>

                            {/* Map view */}
                            <div className="md:col-span-2 h-[700px] rounded-lg overflow-hidden shadow-lg">
                                <ReactMapGL
                                    mapboxAccessToken={MAPBOX_TOKEN}
                                    initialViewState={{
                                        longitude: selectedLot ? selectedLot.coordinates[1] : (selectedLocation?.coordinates[1] || mapCenter.longitude),
                                        latitude: selectedLot ? selectedLot.coordinates[0] : (selectedLocation?.coordinates[0] || mapCenter.latitude),
                                        zoom: 14
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/outdoors-v12" // Terrain view
                                >
                                    <GeolocateControl position="top-right" />
                                    <NavigationControl position="top-right" />

                                    {/* Create path from selected lot to destination */}
                                    {selectedLot && selectedLocation && (
                                        <Source
                                            id="route"
                                            type="geojson"
                                            data={selectedLotRoute || {
                                                type: 'Feature',
                                                properties: {},
                                                geometry: {
                                                    type: 'LineString',
                                                    coordinates: [
                                                        [selectedLot.coordinates[1], selectedLot.coordinates[0]],
                                                        [selectedLocation.coordinates[1], selectedLocation.coordinates[0]]
                                                    ]
                                                }
                                            }}
                                        >
                                            <Layer
                                                id="route-line"
                                                type="line"
                                                paint={{
                                                    'line-color': '#3b82f6',
                                                    'line-width': 3,
                                                    'line-opacity': 0.8
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {nearbyParking.map(lot => (
                                        <Marker
                                            key={lot.id}
                                            longitude={parseFloat(lot.coordinates[1])}
                                            latitude={parseFloat(lot.coordinates[0])}
                                            color={selectedLot?.id === lot.id ? "#dc2626" : "#3b82f6"} // Red for selected, blue for others
                                            onClick={() => handleMarkerClick(lot)}
                                        />
                                    ))}

                                    {selectedLocation && (
                                        <Marker
                                            longitude={selectedLocation.coordinates[1]}
                                            latitude={selectedLocation.coordinates[0]}
                                            color="#16a34a" // Green for destination
                                        />
                                    )}
                                </ReactMapGL>
                            </div>
                        </div>
                    </div>
                );

            case 'details':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4 py-8">
                        {renderError()}
                        {renderLoadingIndicator()}

                        {selectedLot && (
                            <LotDetailsView
                                darkMode={darkMode}
                                lot={selectedLot}
                                onBackClick={handleBackClick}
                                onReserve={() => handleReserve(selectedLot.id)}
                                startDateTime={formatDateTime(date, startTime)}
                                endDateTime={formatDateTime(date, endTime)}
                                duration={duration}
                                destination={selectedLocation}
                            />
                        )}
                    </div>
                );

            case 'car-info':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        <CarInfoForm
                            darkMode={darkMode}
                            lotName={selectedLot?.name}
                            onBackClick={handlePaymentBackClick}
                            onContinue={handleCarInfoSubmit}
                        />
                    </div>
                );

            case 'payment':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        <PaymentPage
                            darkMode={darkMode}
                            lotName={selectedLot?.name}
                            price={selectedLot?.hourlyRate}
                            vehicleInfo={vehicleInfo}
                            onBackClick={handlePaymentBackClick}
                            onCompletePayment={handlePaymentComplete}
                        />
                    </div>
                );

            case 'confirmation':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
                        <div className={`p-8 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="text-center mb-6">
                                <div className="size-20 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="size-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Reservation Confirmed!
                                </h1>
                                <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Your parking spot has been successfully reserved.
                                </p>
                            </div>

                            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="mb-4">
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Reservation ID
                                    </p>
                                    <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {reservationId}
                                    </p>
                                </div>

                                <div className="border-t border-gray-600 pt-4 mb-4">
                                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Parking Lot
                                    </p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedLot?.name}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {selectedLot?.address}
                                    </p>
                                </div>

                                <div className="border-t border-gray-600 pt-4 mb-4">
                                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Time
                                    </p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatDateTime(date, startTime)} - {formatDateTime(date, endTime)}
                                    </p>
                                </div>

                                <div className="border-t border-gray-600 pt-4 mb-4">
                                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Vehicle
                                    </p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {vehicleInfo?.make} {vehicleInfo?.model} ({vehicleInfo?.color})
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {vehicleInfo?.plateNumber} • {vehicleInfo?.state}
                                    </p>
                                </div>

                                <div className="border-t border-gray-600 pt-4">
                                    <p className={`text-sm mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Payment
                                    </p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {paymentInfo?.paymentMethod === 'card' ? 'Credit Card' : 'SOLAR Account'}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {selectedLot?.hourlyRate} • Transaction #{paymentInfo?.transactionId}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    onClick={handlePaymentBackClick}
                                    className="py-3 px-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-md transition-colors"
                                >
                                    Back to Home
                                </button>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={`min-h-screen py-8 ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
            {renderContent()}
        </div>
    );
};

export default FindParking; 