// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Students via Pair Programming) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was given context and prompted to take the initial student iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the same desired changes/new functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LotService, ReservationService, PermitService, CarService, AuthService } from '../utils/api';
import ResultsView from '../components/ResultsView';
import LotDetailsView from '../components/LotDetailsView';
import CarInfoForm from '../components/CarInfoForm';
import PaymentPage from '../components/PaymentPage';
import ParkingForecast from '../components/ParkingForecast';
import ParkingMap from '../components/ParkingMap';
// Import Mapbox components
import ReactMapGL, { Marker, NavigationControl, GeolocateControl, Source, Layer, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
// Import environment variables from our utility
import { MAPBOX_TOKEN } from '../utils/env';
import { calculatePathDistances } from '../utils/pathFinding';
// Import SBU locations data
import { sbuLocations, searchSbuLocations } from '../utils/sbuLocations';
import { FaCar, FaWalking, FaBus, FaParking, FaDollarSign, FaCheckCircle } from 'react-icons/fa';

// Verify token is available - developers will see this error in console
if (!MAPBOX_TOKEN) {
    console.error(
        "Mapbox token not found! Please add your token to the .env file as REACT_APP_MAPBOX_TOKEN"
    );
}

const FindParking = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();
    // View states: 'search', 'results', 'details', 'car-info', 'payment', 'confirmation'
    const [currentView, setCurrentView] = useState('search');

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

    // Add state for transportation mode with 'driving' as default
    const [transportMode, setTransportMode] = useState('driving');

    // Add state for selected permit type
    const [selectedPermitType, setSelectedPermitType] = useState('');

    // Add state for existing permits
    const [existingPermits, setExistingPermits] = useState([]);
    const [hasValidPermit, setHasValidPermit] = useState(false);
    const [validPermitDetails, setValidPermitDetails] = useState(null);

    // Add state for checking if user has saved car info
    const [hasSavedCarInfo, setHasSavedCarInfo] = useState(false);
    const [savedCarInfo, setSavedCarInfo] = useState(null);
    const [userCars, setUserCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(false);
    const [carError, setCarError] = useState(null);

    // Add state for search in progress
    const [searching, setSearching] = useState(false);

    // State for managing form submission
    const [isSubmittingCarInfo, setIsSubmittingCarInfo] = useState(false);

    // Add these hooks at the top level, where other state is defined (near line ~80)
    // State for permit switching
    const [checkingForPermits, setCheckingForPermits] = useState(false);
    const [isSwitchingPermit, setIsSwitchingPermit] = useState(false);
    const [permitToReplace, setPermitToReplace] = useState(null);
    const [reservationResponse, setReservationResponse] = useState(null);

    // Add state for existing reservations
    const [existingReservations, setExistingReservations] = useState([]);
    const [checkingExistingReservations, setCheckingExistingReservations] = useState(false);

    // Add a useEffect to check for existing reservations when component loads
    useEffect(() => {
        if (isAuthenticated) {
            checkExistingReservations();
        }
    }, [isAuthenticated]);

    // Add a useEffect for permit checking at the top level
    useEffect(() => {
        const checkForPermitSwitching = async () => {
            if (!isAuthenticated || !selectedLot || currentView !== 'payment') return;

            // Only check for permit switching if this is a permit-based lot
            if (!selectedLot.rateType || selectedLot.rateType !== 'Permit-based' || hasValidPermit) return;

            // Check if reservation is free due to time-based rules (after 4pm or weekend)
            const startDateTime = new Date(`${date}T${startTime}:00`);
            const isWeekend = startDateTime.getDay() === 0 || startDateTime.getDay() === 6;
            const isAfter4PM = startDateTime.getHours() >= 16; // 4pm = 16 in 24-hour time
            const isBefore7AM = startDateTime.getHours() < 7;  // Before 7am

            // If parking would be free due to time rules, don't initiate permit switching
            if (isWeekend || isAfter4PM || isBefore7AM) {
                console.log("Skipping permit switch check - parking is free due to time rules");
                setIsSwitchingPermit(false);
                return;
            }

            setCheckingForPermits(true);
            try {
                // Get all active user permits
                const activePermitsResult = await PermitService.getUserPermits('active');

                if (activePermitsResult.success && activePermitsResult.permits?.length > 0) {
                    // Filter permits to only include those that are different from the one being purchased
                    const otherActivePermits = activePermitsResult.permits.filter(permit =>
                        permit.permitType.trim() !== selectedPermitType.trim() &&
                        permit.status === 'active' &&
                        permit.paymentStatus === 'paid'
                    );

                    if (otherActivePermits.length > 0) {
                        // User has permits of different types - they're switching
                        setIsSwitchingPermit(true);
                        // Use the first different permit as the one to replace
                        setPermitToReplace(otherActivePermits[0]);
                        console.log("User is switching from permit:", otherActivePermits[0].permitType, "to", selectedPermitType);
                    }
                }
            } catch (error) {
                console.error("Error checking for permit switching:", error);
            } finally {
                setCheckingForPermits(false);
            }
        };

        checkForPermitSwitching();
    }, [isAuthenticated, selectedLot, currentView, selectedPermitType, hasValidPermit, date, startTime]);

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

    // Fetch route when a lot is selected
    useEffect(() => {
        const fetchRoute = async () => {
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

                // Get the appropriate routing profile based on transport mode
                // Options: driving, walking, cycling, driving-traffic
                const routingProfile = transportMode || 'driving';
                console.log(`Using routing profile: mapbox/${routingProfile}`);

                // Call the MapBox Directions API
                const response = await fetch(
                    `https://api.mapbox.com/directions/v5/mapbox/${routingProfile}/${start};${end}?` +
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
                console.error("Error fetching route:", error);
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

        fetchRoute();
    }, [selectedLot, selectedLocation, MAPBOX_TOKEN, transportMode]);

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
            // Get the current user to include user type in the request
            const currentUser = AuthService.getCurrentUser();
            const userType = currentUser ? currentUser.userType : null;

            // Add user type to filters if available
            const filters = {
                status: 'Active',
                userType: userType
            };

            const result = await LotService.getAll(filters);

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
                        evChargingRate: lot.evChargingRate || 0,
                        idleChargingFee: lot.idleChargingFee || 0,
                        isEV: lot.features?.isEV || false,
                        price: lot.features?.isEV
                            ? `$${lot.evChargingRate}/hr (EV)`
                            : lot.rateType === 'Hourly'
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
                setError('Failed to retrieve parking lots. Please try again.');
            }
        } catch (error) {
            console.error('Error fetching parking lots:', error);
            setError('An error occurred while fetching parking lots. Please try again.');
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
            // Validate date is not in the past - using date string comparison rather than Date objects
            const selectedDateStr = date; // YYYY-MM-DD format
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone

            if (selectedDateStr < todayStr) {
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

        try {
            // Fetch real parking lot data from the API
            await fetchParkingLots(locationToUse.coordinates[0], locationToUse.coordinates[1]);
        } catch (error) {
            console.error('Error during search:', error);
        } finally {
            setSearching(false);
        }
    };

    // Handle clicking back button
    const handleBackClick = () => {
        if (currentView === 'results') {
            setCurrentView('search');
        } else if (currentView === 'details') {
            setCurrentView('results');
            setSelectedLot(null);
        } else if (currentView === 'car-info') {
            setCurrentView('details');
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
                    evChargingRate: lot.evChargingRate || 0,
                    idleChargingFee: lot.idleChargingFee || 0,
                    isEV: lot.features?.isEV || false,
                    price: lot.features?.isEV
                        ? `$${lot.evChargingRate}/hr (EV)`
                        : lot.rateType === 'Hourly'
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

    // Function to fetch user's cars from backend
    const fetchUserCars = async () => {
        if (!isAuthenticated) return null;

        try {
            setLoadingCars(true);
            const response = await CarService.getUserCars();

            if (response.success && response.cars && response.cars.length > 0) {
                setUserCars(response.cars);

                // Just use the first car instead of looking for a primary car
                const firstCar = response.cars[0];

                // Format car data for our application
                const formattedCar = {
                    plateNumber: firstCar.plateNumber,
                    state: firstCar.stateProv,
                    make: firstCar.make,
                    model: firstCar.model,
                    color: firstCar.color,
                    bodyType: firstCar.bodyType,
                    year: firstCar.year,
                    carId: firstCar._id
                };

                return formattedCar;
            }
            return null;
        } catch (error) {
            console.error('Error fetching user cars:', error);
            setCarError('Failed to load your vehicles');
            return null;
        } finally {
            setLoadingCars(false);
        }
    };

    // New function to check for existing reservations
    const checkExistingReservations = async () => {
        if (!isAuthenticated) return false;

        setCheckingExistingReservations(true);
        try {
            const result = await ReservationService.getUserReservations({ status: 'active,pending' });

            if (result.success && result.data?.data?.reservations) {
                const activeReservations = result.data.data.reservations.filter(
                    res => ['active', 'pending'].includes(res.status) && new Date(res.endTime) > new Date()
                );

                setExistingReservations(activeReservations);
                return activeReservations.length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking existing reservations:', error);
            return false;
        } finally {
            setCheckingExistingReservations(false);
        }
    };

    // Handle reservation request
    const handleReserve = async (lotId, permitType) => {
        // Save selected permit type
        setSelectedPermitType(permitType);
        setError(''); // Clear any previous errors

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
                currentView: 'details',
                selectedPermitType: permitType
            };
            sessionStorage.setItem('pendingReservation', JSON.stringify(reservationData));
            console.log('FindParking: Saved reservation data to sessionStorage');
            console.log('FindParking: Redirecting to login with state');

            // Redirect to login page - Make sure the path is consistently "/find-parking" with the leading slash
            navigate('/login', {
                state: {
                    from: '/find-parking',
                    reservationPending: true
                },
                replace: false
            });
        } else {
            // Check for existing reservations first
            const hasExistingReservations = await checkExistingReservations();

            if (hasExistingReservations) {
                setError('You already have an active reservation. Please complete or cancel your existing reservation before creating a new one.');
                return;
            }

            // Always check for permit validation, regardless of the next step
            await fetchUserPermits();

            // Check if user has saved car info in backend
            const userCar = await fetchUserCars();

            if (userCar) {
                // If they have car info, use it and skip to payment
                setVehicleInfo(userCar);
                setCurrentView('payment');
            } else {
                // If authenticated but no car info, proceed to car information form
                setCurrentView('car-info');
            }
        }
    };

    // Handle car information submission and move to payment step
    const handleCarInfoSubmit = async (carData) => {
        // Prevent duplicate submissions
        if (isSubmittingCarInfo) return;

        try {
            setIsSubmittingCarInfo(true);
            console.log('Car information submitted:', carData);

            // Normalize the vehicle info to ensure consistency with backend model
            const normalizedCarData = {
                ...carData,
                // Handle state/stateProv conversion for consistency
                stateProv: carData.stateProv || carData.state,
                // Ensure license plate is uppercase for consistent matching with existing cars
                plateNumber: carData.plateNumber ? carData.plateNumber.toUpperCase() : carData.plateNumber
            };

            // If state was used instead of stateProv, remove it to avoid confusion
            if (normalizedCarData.state && normalizedCarData.stateProv) {
                delete normalizedCarData.state;
            }

            // For new users, save the car to their profile first
            if (isAuthenticated && !carData.carId) {
                try {
                    // Check first if car already exists
                    const existingCars = await CarService.getUserCars();
                    const carExists = existingCars.success && existingCars.cars &&
                        existingCars.cars.some(car =>
                            car.plateNumber === normalizedCarData.plateNumber &&
                            car.stateProv === normalizedCarData.stateProv);

                    if (!carExists) {
                        // Only save if the car doesn't already exist
                        const saveResponse = await CarService.saveCar(normalizedCarData);
                        if (saveResponse.success && saveResponse.car) {
                            // Update normalizedCarData with the saved car's ID
                            normalizedCarData.carId = saveResponse.car._id;
                            console.log('Car saved to user profile:', saveResponse.car._id);
                        }
                    } else {
                        console.log('Car already exists in user profile, not saving duplicate');
                    }
                } catch (err) {
                    console.error('Error saving car to profile:', err);
                    // Continue even if car save fails - the reservation endpoint will handle it
                }
            }

            setVehicleInfo(normalizedCarData);
            setCurrentView('payment');

            // If we've already fetched permits, use them for the payment view
            if (!hasValidPermit && !validPermitDetails && isAuthenticated) {
                fetchUserPermits();
            }
        } catch (error) {
            console.error('Error in car info submission:', error);
            setError('Failed to process car information. Please try again.');
        } finally {
            setIsSubmittingCarInfo(false);
        }
    };

    // Function to check if permit type is compatible
    const checkPermitTypeCompatibility = (permit, selectedType) => {
        console.log("Checking permit compatibility:", {
            permit: permit.permitType,
            permitName: permit.permitName,
            selectedType: typeof selectedType === 'string' ? selectedType : selectedType.name || ''
        });

        // First check if we have permit type IDs to compare
        if (permit.permitTypeId && selectedType.id) {
            // If we have IDs, use them for exact matching
            if (permit.permitTypeId === selectedType.id) {
                console.log("Match found by ID comparison");
                return true;
            }
        }

        // Fall back to name-based matching
        const permitType = permit.permitType || '';
        // Normalize both types to lowercase for case-insensitive comparison and trim spaces
        const normalizedPermitType = permitType.toLowerCase().trim();
        const normalizedSelectedType = (typeof selectedType === 'string' ?
            selectedType : selectedType.name || '').toLowerCase().trim();

        // Direct exact match - strict equality for specific permit types
        if (normalizedPermitType === normalizedSelectedType) {
            console.log("Direct match found");
            return true;
        }

        // Also check permit name if available for a direct match
        if (permit.permitName && permit.permitName.toLowerCase().trim() === normalizedSelectedType) {
            console.log("Exact match found in permit name");
            return true;
        }

        // No match found - only exact matching is supported
        console.log("No match found - permit types are not compatible");
        return false;
    };

    // Function to fetch user permits and check if any match the selected lot
    const fetchUserPermits = async () => {
        if (!isAuthenticated || !selectedLot) return;

        console.log("Fetching user permits for lot compatibility check");
        console.log("Selected lot permitTypes:", selectedLot.permitTypes);
        try {
            const result = await PermitService.getUserPermits('active');

            if (result.success) {
                console.log("User permits fetched successfully:", result.permits);
                setExistingPermits(result.permits || []);

                // Log the selected permit type for debugging
                console.log("Selected permit type:", selectedPermitType);

                // Check if user has a valid permit for this lot type
                const validPermit = result.permits.find(permit => {
                    // Basic permit validity checks
                    // Check if permit types are compatible - flexibly match common variations
                    const trimmedPermitType = permit.permitType ? permit.permitType.trim() : '';
                    const trimmedSelectedType = selectedPermitType ? selectedPermitType.trim() : '';

                    const isPermitTypeCompatible = checkPermitTypeCompatibility(
                        { ...permit, permitType: trimmedPermitType },
                        trimmedSelectedType
                    );
                    const isActive = permit.status === 'active';
                    const isPaid = permit.paymentStatus === 'paid' || permit.paymentStatus === 'completed';

                    // Log the permit validity checks
                    console.log(`Permit ${permit.permitNumber} (${permit.permitType}) valid checks:`, {
                        isPermitTypeCompatible,
                        isActive,
                        isPaid,
                        endDate: permit.endDate
                    });

                    // Check if permit is expired - compare only the date part (ignore time)
                    // This makes the permit valid until the end of its expiration day
                    const permitEndDate = new Date(permit.endDate);
                    const today = new Date();

                    // Reset time to midnight to compare only the date part
                    permitEndDate.setHours(0, 0, 0, 0);
                    today.setHours(0, 0, 0, 0);

                    const isNotExpired = permitEndDate >= today;

                    // Check lot compatibility, if applicable
                    const lotCompatibilityCheck = selectedLot.permitTypes && selectedLot.permitTypes.length > 0
                        ? selectedLot.permitTypes.includes(permit.permitType)
                        : true;

                    console.log(`Lot direct compatibility check: ${lotCompatibilityCheck} - Lot accepts: ${selectedLot.permitTypes?.join(', ')}`);

                    // No match found - only exact matching is supported
                    return isPermitTypeCompatible && isActive && isPaid && isNotExpired;
                });

                if (validPermit) {
                    console.log("Valid permit found:", validPermit);
                    setHasValidPermit(true);
                    setValidPermitDetails(validPermit);
                } else {
                    console.log("No valid permit found");
                    setHasValidPermit(false);
                    setValidPermitDetails(null);
                }
            } else {
                console.error("Failed to fetch user permits:", result.error);
            }
        } catch (error) {
            console.error('Error fetching permits:', error);
        }
    };

    // Handle payment completion
    const handlePaymentComplete = async (paymentData) => {
        setIsLoading(true);
        setPaymentInfo(paymentData);

        try {
            // Check for existing reservations again right before creating a new one
            const hasExistingReservations = await checkExistingReservations();

            if (hasExistingReservations) {
                setError('You already have an active reservation. Please complete or cancel your existing reservation before creating a new one.');
                setIsLoading(false);
                return;
            }

            // Ensure user permits are fetched before calculating price
            if (isAuthenticated) {
                await fetchUserPermits();
            }

            // Calculate total price based on lot rate type and features
            let totalPrice = 0;
            let isFreeReservation = false;
            let freeReason = '';

            // Convert string times to Date objects for time-based pricing
            const startDateTime = new Date(`${date}T${startTime}:00`);
            const endDateTime = new Date(`${date}T${endTime}:00`);

            // Check if it's a weekend (Saturday or Sunday)
            const isWeekend = startDateTime.getDay() === 0 || startDateTime.getDay() === 6;

            if (isWeekend) {
                // Free parking on weekends for all lot types
                isFreeReservation = true;
                freeReason = 'Weekend parking is free';
                totalPrice = 0;
                console.log("Weekend parking - parking is free");
            } else if (hasValidPermit && validPermitDetails) {
                // User has a valid permit
                console.log("User has valid permit - setting price to 0");
                isFreeReservation = true;
                freeReason = 'Valid permit';
                totalPrice = 0;
            } else if (selectedLot.rateType === 'Hourly') {
                // For metered lots, check if it's after 7PM or before 7AM
                const isAfter7PM = startDateTime.getHours() >= 19; // 7pm = 19 in 24-hour time
                const isBefore7AM = startDateTime.getHours() < 7;  // Before 7am

                if (isAfter7PM || isBefore7AM) {
                    // Free parking before 7AM or after 7PM for metered lots
                    isFreeReservation = true;
                    freeReason = isAfter7PM ? 'After 7PM (Free)' : 'Before 7AM (Free)';
                    totalPrice = 0;
                    console.log(`Metered lot - ${isAfter7PM ? 'after 7PM' : 'before 7AM'} - parking is free`);
                } else {
                    // Calculate billable duration respecting the 7PM cutoff
                    const sevenPM = new Date(`${date}T19:00:00`);
                    let billableDurationHours;

                    if (endDateTime > sevenPM) {
                        // If ending after 7PM, only charge until 7PM
                        billableDurationHours = (sevenPM - startDateTime) / (1000 * 60 * 60);
                    } else {
                        // If entirely before 7PM, charge the full duration
                        billableDurationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
                    }

                    // Calculate price based on rate type and EV status
                    totalPrice = selectedLot.isEV
                        ? billableDurationHours * selectedLot.evChargingRate
                        : billableDurationHours * selectedLot.hourlyRate;
                }
            } else if (selectedLot.rateType === 'Permit-based') {
                // For permit-based lots, check if it's after 4PM (16:00) or before 7AM
                const isAfter4PM = startDateTime.getHours() >= 16; // 4pm = 16 in 24-hour time
                const isBefore7AM = startDateTime.getHours() < 7;  // Before 7am

                if (isAfter4PM || isBefore7AM) {
                    // If starting after 4PM or before 7AM, permit-based lots are free
                    isFreeReservation = true;
                    freeReason = isAfter4PM ? 'After 4PM (Free)' : 'Before 7AM (Free)';
                    totalPrice = 0;
                    console.log(`Permit-based lot - ${isAfter4PM ? 'after 4PM' : 'before 7AM'} - parking is free`);
                } else {
                    // Otherwise, use the semester rate
                    totalPrice = selectedLot.semesterRate || 0;
                }
            } else {
                // For other rate types, use the semester rate
                totalPrice = selectedLot.semesterRate || 0;
            }

            // Log the final price calculation
            console.log("Final price calculation:", {
                hasValidPermit,
                permitDetails: validPermitDetails ?
                    { permitType: validPermitDetails.permitType, permitNumber: validPermitDetails.permitNumber } : null,
                isWeekend,
                isFreeReservation,
                freeReason,
                totalPrice
            });

            // Check if user is switching permit types by looking at existing permits
            let isSwitchingPermitType = isSwitchingPermit;
            let permitToReplaceId = permitToReplace ? permitToReplace._id : null;

            // Prepare reservation data
            const reservationData = {
                lotId: selectedLot.id,
                startTime: `${date}T${startTime}:00`,
                endTime: `${date}T${endTime}:00`,
                permitType: selectedPermitType ? selectedPermitType.trim() : selectedPermitType,
                vehicleInfo: {
                    ...vehicleInfo,
                    // Ensure license plate is uppercase for consistent matching with existing cars
                    plateNumber: vehicleInfo.plateNumber ? vehicleInfo.plateNumber.toUpperCase() : vehicleInfo.plateNumber
                },
                paymentInfo: totalPrice > 0 ? {
                    ...paymentData,
                    amount: totalPrice,
                    // Make sure to include the customer ID if provided with the payment data
                    customerId: paymentData.customerId || null
                } : null,
                // Add flag to indicate if user has valid permit
                useExistingPermit: hasValidPermit,
                existingPermitId: validPermitDetails ? validPermitDetails._id : null,
                // Add permit switching information
                isSwitchingPermitType: isSwitchingPermitType,
                permitToReplaceId: permitToReplaceId,
                // Add information about free reservation
                isFreeReservation: isFreeReservation,
                freeReason: freeReason
            };

            console.log("Sending reservation data to backend:", reservationData);

            // Send reservation to backend
            const result = await ReservationService.createReservation(reservationData);
            console.log("Reservation creation response:", result);

            if (result.success) {
                // Store the full reservation response for the confirmation screen
                setReservationResponse(result.data);

                // Use real reservation ID from backend if available
                setReservationId(result.data.reservationId || 'RES' + Math.floor(Math.random() * 1000000));
                setError('');
                // Only show confirmation on success
                setCurrentView('confirmation');
            } else {
                setError(result.error || 'Failed to create reservation');
                // Stay on payment page when there's an error
                setCurrentView('payment');
                // Clear the payment info so success message doesn't show
                setPaymentInfo(null);
            }
        } catch (err) {
            console.error('Error creating reservation:', err);
            setError('An unexpected error occurred while creating your reservation');
            // Stay on payment page when there's an error
            setCurrentView('payment');
            // Clear the payment info so success message doesn't show
            setPaymentInfo(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle back button from car-info or payment views
    const handlePaymentBackClick = () => {
        if (currentView === 'payment') {
            // Reset permit switching state when going back
            setIsSwitchingPermit(false);
            setPermitToReplace(null);
            setCheckingForPermits(false);

            // Move back to car-info view
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
            setReservationResponse(null);
            setIsSwitchingPermit(false);
            setPermitToReplace(null);
            setCheckingForPermits(false);
        }
    };

    // Restore selected permit type from session storage when component loads
    useEffect(() => {
        const pendingReservation = sessionStorage.getItem('pendingReservation');
        if (pendingReservation) {
            try {
                const reservationData = JSON.parse(pendingReservation);
                if (reservationData.selectedPermitType) {
                    setSelectedPermitType(reservationData.selectedPermitType);
                }
            } catch (error) {
                console.error('Error parsing selected permit type from session storage:', error);
            }
        }
    }, []);

    // Fetch user's permits when directly entering the car-info or payment step without going through handleReserve
    // This handles cases like browser refresh or direct navigation
    useEffect(() => {
        if (isAuthenticated &&
            (currentView === 'car-info' || currentView === 'payment') &&
            selectedLot &&
            !hasValidPermit &&
            !validPermitDetails) {
            fetchUserPermits();
        }
    }, [isAuthenticated, currentView, selectedLot, hasValidPermit, validPermitDetails]);

    // Add a function to render the error message
    const renderError = () => {
        if (!error) return null;

        // Check if it's the already has active reservation error
        const hasActiveReservationError = error.includes('already have an active reservation');

        if (hasActiveReservationError) {
            return (
                <div className={`p-6 rounded-lg ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'} mb-4`}>
                    <div className="flex flex-col items-center text-center space-y-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-lg font-medium">You Already Have an Active Reservation</h3>
                        <p>{error}</p>
                        <div className="flex space-x-4 mt-2">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
                            >
                                View My Reservations
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

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
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                        {/* Show banner if user has existing reservations */}
                        {existingReservations.length > 0 && (
                            <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-red-900/50 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                <div className="flex flex-col md:flex-row items-center justify-between">
                                    <div className="flex items-center mb-4 md:mb-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <h3 className="text-lg font-bold">You Already Have an Active Reservation</h3>
                                            <p className="mt-1">You must complete or cancel your existing reservation before creating a new one.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
                                    >
                                        View My Reservations
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Hero Section */}
                        <div className="relative mb-10">
                            {/* Decorative elements */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-2xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

                            <div className="text-center relative z-10">
                                <div className="inline-block mb-4">
                                    <span className={`inline-flex items-center justify-center p-3 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'} rounded-xl`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" />
                                        </svg>
                                    </span>
                                </div>
                                <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Find Parking
                                </h1>
                                <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Search for parking spots near your location or a specific address
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Search Form */}
                            <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                                <div className="p-8 relative">
                                    {/* Decorative accent */}
                                    <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                                    <form onSubmit={handleSearch} className="space-y-6">
                                        <div>
                                            <label htmlFor="address" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                Address
                                            </label>
                                            <div className="relative">
                                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                        <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    id="address"
                                                    name="address"
                                                    placeholder="Enter Stony Brook location"
                                                    value={address}
                                                    onChange={handleAddressChange}
                                                    className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                                    border ${formErrors.address ? 'border-red-500' : ''} 
                                                    focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                                    autoComplete="off"
                                                />
                                                {/* SBU Location Suggestions */}
                                                {showSbuSuggestions && sbuSuggestions.length > 0 && (
                                                    <div className={`mt-1 absolute z-50 w-full rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}>
                                                        <ul className="max-h-40 overflow-y-auto">
                                                            {sbuSuggestions.slice(0, 5).map((location, index) => (
                                                                <li
                                                                    key={`sbu-${index}`}
                                                                    className={`px-4 py-2 cursor-pointer hover:${darkMode ? 'bg-gray-600' : 'bg-gray-100'} transition-colors border-b ${darkMode ? 'border-gray-600' : 'border-gray-100'}`}
                                                                    onClick={() => handleSbuLocationSelect(location)}
                                                                >
                                                                    <div className="font-medium">{location.name}</div>
                                                                </li>
                                                            ))}
                                                            {sbuSuggestions.length > 5 && (
                                                                <li className="px-4 py-2 text-xs text-gray-500 italic">
                                                                    {sbuSuggestions.length - 5} more results...
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                            {formErrors.address && (
                                                <p className="mt-1 text-sm text-red-500 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                    </svg>
                                                    {formErrors.address}
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="date" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Date
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
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
                                                        min={new Date().toLocaleDateString('en-CA')}
                                                        className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode
                                                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-400 [color-scheme:dark]'
                                                            : 'bg-white text-gray-900 border-gray-300 focus:ring-red-600 [color-scheme:light]'
                                                            } border focus:outline-none focus:ring-2 ${formErrors.date ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {formErrors.date && (
                                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                        </svg>
                                                        {formErrors.date}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="startTime" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Start Time
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
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
                                                        className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode
                                                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-400 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                            : 'bg-white text-gray-900 border-gray-300 focus:ring-red-600 [color-scheme:light]'
                                                            } border focus:outline-none focus:ring-2 ${formErrors.startTime ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {formErrors.startTime && (
                                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                        </svg>
                                                        {formErrors.startTime}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="endTime" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    End Time
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
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
                                                        className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode
                                                            ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-400 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                            : 'bg-white text-gray-900 border-gray-300 focus:ring-red-600 [color-scheme:light]'
                                                            } border focus:outline-none focus:ring-2 ${formErrors.endTime ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {formErrors.endTime && (
                                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                        </svg>
                                                        {formErrors.endTime}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="duration" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Duration
                                                </label>
                                                <div className="relative">
                                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="duration"
                                                        placeholder=""
                                                        value={duration}
                                                        readOnly
                                                        className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode
                                                            ? 'bg-gray-700 text-white border-gray-600'
                                                            : 'bg-white text-gray-900 border-gray-300'
                                                            } border ${formErrors.duration ? 'border-red-500' : ''}`}
                                                    />
                                                </div>
                                                {formErrors.duration && (
                                                    <p className="mt-1 text-sm text-red-500 flex items-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1">
                                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                        </svg>
                                                        {formErrors.duration}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={searching}
                                            className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg
                                            ${searching
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700'}`}
                                        >
                                            {searching ? (
                                                <div className="flex items-center justify-center">
                                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Searching...
                                                </div>
                                            ) : 'Search for Parking'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Map Section */}
                            <div className="h-[600px] rounded-lg overflow-hidden shadow-md">
                                <ReactMapGL
                                    key={`map-${currentView}-${transportMode}-${Date.now()}`}
                                    mapboxAccessToken={MAPBOX_TOKEN}
                                    initialViewState={mapCenter}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/outdoors-v12"
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
                    <div className="max-w-7xl mx-auto px-4 py-8">
                        {/* Show banner if user has existing reservations */}
                        {existingReservations.length > 0 && (
                            <div className={`mb-8 p-6 rounded-lg ${darkMode ? 'bg-red-900/50 border border-red-800 text-red-200' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                                <div className="flex flex-col md:flex-row items-center justify-between">
                                    <div className="flex items-center mb-4 md:mb-0">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <h3 className="text-lg font-bold">You Already Have an Active Reservation</h3>
                                            <p className="mt-1">You must complete or cancel your existing reservation before creating a new one.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className={`px-4 py-2 rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white font-medium transition-colors`}
                                    >
                                        View My Reservations
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-6">
                            {/* Hero Section with context */}
                            <div className="relative mb-10">
                                {/* Decorative elements */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-2xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

                                <div className="text-center relative z-10">
                                    <div className="inline-block mb-4">
                                        <span className={`inline-flex items-center justify-center p-3 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'} rounded-xl`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                            </svg>
                                        </span>
                                    </div>
                                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Available Parking
                                    </h1>
                                    <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        {nearbyParking.length} spots near {selectedLocation ? selectedLocation.name : 'your location'}
                                    </p>
                                </div>
                            </div>

                            {renderError()}
                            {renderLoadingIndicator()}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left sidebar with results list */}
                            <div className="lg:col-span-1">
                                <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                                    <div className="relative">
                                        {/* Decorative accent */}
                                        <div className="absolute top-0 left-0 h-1 w-24 bg-gradient-to-r from-red-600 to-red-400"></div>

                                        {/* Transport mode selector */}
                                        <div className="flex justify-center pt-4 px-4 mb-4">
                                            <div className={`flex border rounded-lg overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                                <button
                                                    type="button"
                                                    onClick={() => setTransportMode('driving')}
                                                    className={`flex items-center px-4 py-2 text-sm font-medium ${transportMode === 'driving'
                                                        ? `${darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`
                                                        : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                                                        <path d="M12 1.5a.75.75 0 01.75.75V7.5h-1.5V2.25A.75.75 0 0112 1.5zM11.25 7.5v5.69l-1.72-1.72a.75.75 0 00-1.06 1.06l3 3a.75.75 0 001.06 0l3-3a.75.75 0 10-1.06-1.06l-1.72 1.72V7.5h3.75a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9a3 3 0 013-3h3.75z" />
                                                    </svg>
                                                    Car
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTransportMode('walking')}
                                                    className={`flex items-center px-4 py-2 text-sm font-medium ${transportMode === 'walking'
                                                        ? `${darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`
                                                        : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                                                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                                    </svg>
                                                    Walk
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setTransportMode('driving-traffic')}
                                                    className={`flex items-center px-4 py-2 text-sm font-medium ${transportMode === 'driving-traffic'
                                                        ? `${darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white'}`
                                                        : `${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100'}`
                                                        }`}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mr-2">
                                                        <path fillRule="evenodd" d="M8.25 6.75a3.75 3.75 0 117.5 0 3.75 3.75 0 01-7.5 0zM15.75 9.75a3 3 0 116 0 3 3 0 01-6 0zM2.25 9.75a3 3 0 116 0 3 3 0 01-6 0zM6.31 15.117A6.745 6.745 0 0112 12a6.745 6.745 0 016.709 7.498.75.75 0 01-.372.568A12.696 12.696 0 0112 21.75c-2.305 0-4.47-.612-6.337-1.684a.75.75 0 01-.372-.568 6.787 6.787 0 011.019-4.38z" clipRule="evenodd" />
                                                        <path d="M5.082 14.254a8.287 8.287 0 00-1.308 5.135 9.687 9.687 0 01-1.764-.44l-.115-.04a.563.563 0 01-.373-.487l-.01-.121a3.75 3.75 0 013.57-4.047zM20.226 19.389a8.287 8.287 0 00-1.308-5.135 3.75 3.75 0 013.57 4.047l-.01.121a.563.563 0 01-.373.486l-.115.04c-.567.2-1.156.349-1.764.441z" />
                                                    </svg>
                                                    Bus
                                                </button>
                                            </div>
                                        </div>

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
                                            transportMode={transportMode}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Map view */}
                            <div className="lg:col-span-2 h-[700px] rounded-2xl overflow-hidden shadow-lg relative">
                                {/* Remove the redundant overlay info box that was here */}

                                <ReactMapGL
                                    key={`map-${currentView}-${transportMode}-${Date.now()}`}
                                    mapboxAccessToken={MAPBOX_TOKEN}
                                    initialViewState={{
                                        longitude: selectedLot ? selectedLot.coordinates[1] : (selectedLocation?.coordinates[1] || mapCenter.longitude),
                                        latitude: selectedLot ? selectedLot.coordinates[0] : (selectedLocation?.coordinates[0] || mapCenter.latitude),
                                        zoom: 14
                                    }}
                                    style={{ width: '100%', height: '100%' }}
                                    mapStyle="mapbox://styles/mapbox/outdoors-v12"
                                >
                                    <GeolocateControl position="top-right" />
                                    <NavigationControl position="top-right" />

                                    {/* Create path from selected lot to destination */}
                                    {selectedLot && selectedLocation && (
                                        <Source
                                            key={`main-route-${transportMode}`}
                                            id="main-route"
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
                                                id="main-route-line"
                                                type="line"
                                                paint={{
                                                    'line-color': transportMode === 'walking'
                                                        ? '#10b981' // green for walking
                                                        : transportMode === 'driving-traffic'
                                                            ? '#ef4444' // red for bus
                                                            : '#3b82f6', // blue for car (driving)
                                                    'line-width': 4,
                                                    'line-opacity': 0.8,
                                                    'line-dasharray': transportMode === 'walking' ? [0.5, 1.5] : [1, 0]
                                                }}
                                            />
                                        </Source>
                                    )}

                                    {nearbyParking.map(lot => (
                                        <Marker
                                            key={lot.id}
                                            longitude={parseFloat(lot.coordinates[1])}
                                            latitude={parseFloat(lot.coordinates[0])}
                                            color={selectedLot?.id === lot.id ? "#dc2626" : "#3b82f6"}
                                            onClick={() => handleMarkerClick(lot)}
                                        />
                                    ))}

                                    {/* Add popup for selected parking lot */}
                                    {selectedLot && (
                                        <Popup
                                            longitude={parseFloat(selectedLot.coordinates[1])}
                                            latitude={parseFloat(selectedLot.coordinates[0])}
                                            anchor="bottom"
                                            closeButton={false}
                                            closeOnClick={false}
                                            offset={25}
                                        >
                                            <div className={`p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-md border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <p className="font-bold text-base mb-3 flex items-center">
                                                    <div className="bg-red-100 dark:bg-red-900/30 p-1.5 rounded-full mr-2.5">
                                                        <FaParking className="text-red-600 dark:text-red-400" />
                                                    </div>
                                                    {selectedLot.name}
                                                </p>
                                                <div className="flex justify-between items-center gap-3">
                                                    <div className="flex items-center">
                                                        <span className={`${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'} text-xs font-medium px-2.5 py-1.5 rounded-full`}>
                                                            {selectedLot.availableSpaces} spaces
                                                        </span>
                                                    </div>
                                                    <div className={`${darkMode ? 'bg-blue-900 text-blue-100 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-200'} px-3 py-1.5 rounded-md text-xs font-bold border flex items-center`}>
                                                        <FaDollarSign className="mr-1" />
                                                        {selectedLot.price.replace("$", "")}
                                                    </div>
                                                </div>
                                            </div>
                                        </Popup>
                                    )}

                                    {selectedLocation && (
                                        <Marker
                                            longitude={selectedLocation.coordinates[1]}
                                            latitude={selectedLocation.coordinates[0]}
                                            color="#16a34a"
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
                                onReserve={handleReserve}
                                startDateTime={formatDateTime(date, startTime)}
                                endDateTime={formatDateTime(date, endTime)}
                                duration={duration}
                                destination={selectedLocation}
                                transportMode={transportMode}
                            />
                        )}
                    </div>
                );

            case 'car-info':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        {renderError()}
                        {renderLoadingIndicator()}

                        <CarInfoForm
                            darkMode={darkMode}
                            lotName={selectedLot?.name}
                            permitType={selectedPermitType}
                            onBackClick={handleBackClick}
                            onContinue={handleCarInfoSubmit}
                            isAuthenticated={isAuthenticated}
                            isSubmitting={isSubmittingCarInfo}
                        />
                    </div>
                );

            case 'payment':
                // Calculate price with time cutoffs for display
                let displayPrice;

                // Convert string times to Date objects
                const startDateTime = new Date(`${date}T${startTime}:00`);
                const endDateTime = new Date(`${date}T${endTime}:00`);

                // Check if it's a weekend (Saturday or Sunday)
                const isWeekend = startDateTime.getDay() === 0 || startDateTime.getDay() === 6;

                if (isWeekend) {
                    // Free parking on weekends for all lot types
                    displayPrice = '$0.00';
                } else if (selectedLot?.rateType === 'Hourly') {
                    // Special handling for metered lots
                    const isMeteredLot = selectedLot.features?.isMetered ||
                        selectedLot.features?.includes('Metered Parking') ||
                        selectedLot.name?.toLowerCase().includes('metered');

                    // Get hours for calculation
                    const startHour = startDateTime.getHours();
                    const startMinute = startDateTime.getMinutes();
                    const endHour = endDateTime.getHours();
                    const endMinute = endDateTime.getMinutes();

                    // Convert to decimal time for easier calculation
                    const startTimeInDecimal = startHour + (startMinute / 60);
                    const endTimeInDecimal = endHour + (endMinute / 60);

                    // Early exit conditions for metered lots
                    if (isMeteredLot && ((startHour >= 19 || startHour < 7) && (endHour < 7 || endHour >= 19))) {
                        // If entirely outside 7am-7pm, metered lots are free
                        displayPrice = '$0.00';
                        console.log('Metered lot time is entirely during free hours (before 7AM or after 7PM)');
                    } else if (isMeteredLot) {
                        // Calculate billable hours (only between 7am and 7pm)
                        // Clamp the billable period to 7AM-7PM (7.0 to 19.0 in decimal hours)
                        const billableStart = Math.max(startTimeInDecimal, 7.0);
                        const billableEnd = Math.min(endTimeInDecimal, 19.0);

                        let billableDurationHours = 0;
                        if (billableEnd > billableStart) {
                            billableDurationHours = billableEnd - billableStart;
                        }

                        console.log(`Metered lot: ${billableDurationHours.toFixed(2)} billable hours (7am-7pm only) at $${selectedLot.hourlyRate}/hour`);

                        // Calculate price based on rate type and EV status
                        const calculatedPrice = selectedLot.isEV
                            ? billableDurationHours * selectedLot.evChargingRate
                            : billableDurationHours * selectedLot.hourlyRate;

                        displayPrice = `$${calculatedPrice.toFixed(2)}`;

                        // If price is 0, it's free - make that clear
                        if (calculatedPrice === 0) {
                            displayPrice = '$0.00';
                        }
                    } else {
                        // Non-metered hourly lot, charge for full duration
                        const durationHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
                        displayPrice = `$${(durationHours * selectedLot.hourlyRate).toFixed(2)}`;
                    }
                } else if (selectedLot?.rateType === 'Permit-based') {
                    // For permit-based lots, check if it's after 4PM (16:00)
                    const startHour = startDateTime.getHours();
                    const isAfter4PM = startHour >= 16;  // After 4PM = 16 in 24-hour time
                    const isBefore7AM = startHour < 7;  // Before 7AM

                    if (isAfter4PM || isBefore7AM) {
                        // If starting after 4PM or before 7AM, permit-based lots are free
                        displayPrice = '$0.00';
                    } else {
                        // Otherwise, use the semester rate
                        displayPrice = `$${selectedLot?.semesterRate || 0}`;
                    }
                } else {
                    // For other rate types, use the semester rate
                    displayPrice = `$${selectedLot?.semesterRate || 0}`;
                }

                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        {renderError()}
                        {renderLoadingIndicator()}

                        <PaymentPage
                            darkMode={darkMode}
                            lotName={selectedLot?.name}
                            price={displayPrice}
                            vehicleInfo={vehicleInfo}
                            onBackClick={handlePaymentBackClick}
                            onCompletePayment={handlePaymentComplete}
                            hasValidPermit={hasValidPermit}
                            validPermitDetails={validPermitDetails}
                            hasReservationError={!!error}
                            checkingForExistingPermits={checkingForPermits}
                            isSwitchingPermitType={isSwitchingPermit}
                            permitToReplace={permitToReplace}
                            startDateTime={startDateTime}
                            endDateTime={endDateTime}
                            lotType={selectedLot?.rateType}
                            isMeteredLot={selectedLot?.features?.isMetered ||
                                selectedLot?.features?.includes('Metered Parking') ||
                                selectedLot?.name?.toLowerCase().includes('metered')}
                        />
                    </div>
                );

            case 'confirmation':
                // Calculate the final price with time cutoffs for display
                let confirmationPrice;

                // Convert string times to Date objects
                const confirmStartDateTime = new Date(`${date}T${startTime}:00`);
                const confirmEndDateTime = new Date(`${date}T${endTime}:00`);

                if (selectedLot?.rateType === 'Hourly') {
                    // Check if the reservation extends past 7PM (19:00)
                    const sevenPM = new Date(`${date}T19:00:00`);

                    // Calculate billable duration respecting the 7PM cutoff
                    let billableDurationHours;

                    if (confirmStartDateTime >= sevenPM) {
                        // If starting after 7PM, no charge for metered parking
                        billableDurationHours = 0;
                    } else if (confirmEndDateTime > sevenPM) {
                        // If ending after 7PM, only charge until 7PM
                        billableDurationHours = (sevenPM - confirmStartDateTime) / (1000 * 60 * 60);
                    } else {
                        // If entirely before 7PM, charge the full duration
                        billableDurationHours = (confirmEndDateTime - confirmStartDateTime) / (1000 * 60 * 60);
                    }

                    // Calculate price based on rate type and EV status
                    confirmationPrice = selectedLot.isEV
                        ? (billableDurationHours * selectedLot.evChargingRate).toFixed(2)
                        : (billableDurationHours * selectedLot.hourlyRate).toFixed(2);
                } else if (selectedLot?.rateType === 'Permit-based') {
                    // For permit-based lots, check if it's after 4PM (16:00)
                    const fourPM = new Date(`${date}T16:00:00`);

                    if (confirmStartDateTime >= fourPM) {
                        // If starting after 4PM, permit-based lots are free
                        confirmationPrice = '0.00';
                    } else {
                        // Otherwise, use the semester rate
                        confirmationPrice = selectedLot.semesterRate.toFixed(2);
                    }
                } else {
                    // For other rate types, use the semester rate
                    confirmationPrice = selectedLot.semesterRate.toFixed(2);
                }

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

                            {/* Show permit switching success message if applicable */}
                            {reservationResponse?.permitSwitched && (
                                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-800'}`}>
                                    <h3 className="font-bold mb-2">Permit Updated Successfully</h3>
                                    <p>
                                        Your {reservationResponse.permitSwitched.oldPermitType} permit has been replaced with a new {reservationResponse.permitSwitched.newPermitType} permit.
                                    </p>
                                    {reservationResponse.permitSwitched.refundProcessed && (
                                        <p className="mt-2">
                                            A refund of ${reservationResponse.permitSwitched.refundAmount.toFixed(2)} has been processed for your previous permit.
                                        </p>
                                    )}
                                </div>
                            )}

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
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {paymentInfo?.paymentMethod === 'card' ? 'Credit Card' :
                                            paymentInfo?.paymentMethod === 'solar' ? 'SOLAR Account' : 'Existing Permit'}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        ${confirmationPrice} • Transaction #{paymentInfo?.transactionId}
                                    </p>
                                </div>
                            </div>

                            <div className="text-center">
                                <button
                                    onClick={() => {
                                        // Reset the form and go back to the home
                                        handlePaymentBackClick();
                                        // Also reset permit switching state
                                        setReservationResponse(null);
                                        setIsSwitchingPermit(false);
                                        setPermitToReplace(null);
                                        setCheckingForPermits(false);
                                    }}
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