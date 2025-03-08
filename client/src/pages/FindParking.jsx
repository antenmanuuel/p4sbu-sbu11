import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ParkingMap from '../components/ParkingMap';
import ResultsView from '../components/ResultsView';
import LotDetailsView from '../components/LotDetailsView';
import CarInfoForm from '../components/CarInfoForm';
import PaymentPage from '../components/PaymentPage';
import { getMockSuggestions, getNearbyParkingLots, getLotById, mockParkingLots } from '../utils/fakeData';


const FindParking = ({ darkMode, isAuthenticated }) => {
    // Add useNavigate hook
    const navigate = useNavigate();

    // View states: 'search', 'results', 'details', 'car-info', 'payment', 'confirmation'
    const [currentView, setCurrentView] = useState('search');

    // Search states
    const [suggestions, setSuggestions] = useState([]);
    const [searching, setSearching] = useState(false);

    // Form states
    const [address, setAddress] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState('');

    // Location states
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [mapCenter, setMapCenter] = useState([40.9148, -73.1259]); // Default to SBU

    // Parking spots
    const [nearbyParking, setNearbyParking] = useState([]);
    const [selectedLot, setSelectedLot] = useState(null);

    // Reservation states
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [reservationId, setReservationId] = useState(null);

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
                    const lots = getNearbyParkingLots(
                        reservationData.selectedLocation.coordinates[0],
                        reservationData.selectedLocation.coordinates[1]
                    );
                    setNearbyParking(lots);
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

    // Custom hook to handle search suggestions
    const fetchSuggestions = useCallback((searchValue) => {
        if (searchValue.trim().length < 1) {
            setSuggestions([]);
            return;
        }

        setSearching(true);
        try {
            // Get suggestions from mock data
            const results = getMockSuggestions(searchValue);
            setSuggestions(results);
        } catch {
            setSuggestions([]);
        } finally {
            setSearching(false);
        }
    }, []);

    // Handle search input changes
    useEffect(() => {
        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(() => fetchSuggestions(address), 300);
        return () => clearTimeout(timeoutId);
    }, [address, fetchSuggestions]);

    // Handle suggestion selection
    const handleSuggestionSelect = (suggestion) => {
        try {
            // Set selected location from the suggestion
            const location = {
                name: suggestion.place_name.split(',')[0],
                address: suggestion.place_name,
                coordinates: suggestion.center
            };

            // Update state
            setSelectedLocation(location);
            setMapCenter(location.coordinates);
            setAddress(suggestion.place_name);

            // Clear suggestions after selection
            setTimeout(() => {
                setSuggestions([]);
            }, 100);
        } catch {
            // Silent error handling
        }
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
            } else {
                // Handle case where end time is before start time (next day)
                setDuration('');
            }
        }
    }, [startTime, endTime]);

    // Handle search submission
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!address) return;

        const locationToUse = selectedLocation || {
            name: address,
            address: address,
            coordinates: mapCenter
        };

        setSearching(true);
        try {
            // In a real app, this would be an API call to fetch nearby parking
            const results = getNearbyParkingLots(locationToUse.coordinates);

            // Ensure all results have the correct coordinate format
            const processedResults = results.map(lot => ({
                ...lot,
                // Make sure coordinates are always in [lat, lng] format for map display
                coordinates: [
                    parseFloat(lot.coordinates[0]),
                    parseFloat(lot.coordinates[1])
                ]
            }));

            setNearbyParking(processedResults);
            setSelectedLocation(locationToUse);
            setCurrentView('results');
        } catch (error) {
            console.error("Error fetching parking lots:", error);
            // Fallback to showing all lots if there's an error
            try {
                const allLots = mockParkingLots.map(lot => ({
                    ...lot,
                    coordinates: [
                        parseFloat(lot.coordinates[0]),
                        parseFloat(lot.coordinates[1])
                    ],
                    distance: "Unknown",
                    walkingDistance: "Unknown"
                }));
                setNearbyParking(allLots);
                setSelectedLocation(locationToUse);
                setCurrentView('results');
            } catch {
                // Silent error handling
            }
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
        }
    };

    // Handle clicking on a map marker
    const handleMarkerClick = (lot) => {
        setSelectedLot(lot);
    };

    // Handle clicking "View Details" on a lot
    const handleViewDetails = (lotId) => {
        const lot = getLotById(lotId);
        if (lot) {
            setSelectedLot(lot);
            setMapCenter(lot.coordinates);
            setCurrentView('details');
        }
    };

    // Handle map click for location selection
    const handleMapClick = (latlng) => {
        if (currentView !== 'search') return;

        // In a real app, you would use reverse geocoding here
        const mockLocation = {
            name: "Selected Location",
            address: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
            coordinates: [latlng.lat, latlng.lng]
        };

        setSelectedLocation(mockLocation);
        setMapCenter([latlng.lat, latlng.lng]);
        setAddress(mockLocation.address);
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

    // Render appropriate view based on state
    const renderContent = () => {
        switch (currentView) {
            case 'search':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4 py-8">
                        <h1 className={`text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Find Parking
                        </h1>

                        <p className="mb-4 text-gray-600 dark:text-gray-300">
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
                                            <input
                                                type="text"
                                                id="address"
                                                placeholder="Enter your address"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                    ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600'
                                                    : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500'
                                                    } border focus:outline-none focus:ring-2`}
                                                autoComplete="off"
                                            />

                                            {/* Suggestions dropdown - Update with Tailwind classes */}
                                            {suggestions.length > 0 && (
                                                <div
                                                    className={`absolute left-0 right-0 mt-1 shadow-lg overflow-hidden z-50 w-full rounded-md border ${darkMode
                                                        ? 'bg-gray-800 border-gray-700'
                                                        : 'bg-white border-gray-300'
                                                        }`}
                                                >
                                                    <ul className="list-none p-0 m-0">
                                                        {suggestions.map((suggestion, index) => (
                                                            <li
                                                                key={index}
                                                                onClick={() => handleSuggestionSelect(suggestion)}
                                                                className={`px-3 py-2.5 cursor-pointer transition-all duration-200 ${darkMode
                                                                    ? 'text-gray-100 hover:bg-gray-700 hover:font-medium'
                                                                    : 'text-gray-900 hover:bg-gray-100 hover:font-medium'
                                                                    }`}
                                                                dangerouslySetInnerHTML={{
                                                                    __html: suggestion.highlighted_name
                                                                        ? suggestion.highlighted_name.replace(/<strong>/g, `<strong class="${darkMode ? 'text-red-400' : 'text-red-500'} font-semibold">`)
                                                                        : suggestion.place_name
                                                                }}
                                                            />
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
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
                                            onChange={(e) => setDate(e.target.value)}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark]'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2`}
                                        />
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
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2`}
                                        />
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
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-800 text-white border-gray-700 focus:ring-red-600 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert'
                                                : 'bg-gray-100 text-gray-900 border-gray-300 focus:ring-red-500 [color-scheme:light]'
                                                } border focus:outline-none focus:ring-2`}
                                        />
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
                                                } border`}
                                        />
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
                                <ParkingMap
                                    darkMode={darkMode}
                                    mapCenter={mapCenter}
                                    markers={selectedLocation ? [{
                                        id: 'selected',
                                        name: selectedLocation.name,
                                        coordinates: selectedLocation.coordinates,
                                        availableSpaces: 0,
                                        totalSpaces: 0
                                    }] : []}
                                    onMapClick={handleMapClick}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'results':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left sidebar with results list */}
                            <div className="md:col-span-1">
                                <ResultsView
                                    darkMode={darkMode}
                                    locationName={selectedLocation?.name || 'Selected Location'}
                                    formattedStartDateTime={formatDateTime(date, startTime)}
                                    formattedEndDateTime={formatDateTime(date, endTime)}
                                    nearbyParking={nearbyParking.map(lot => ({
                                        id: lot.id,
                                        name: lot.name,
                                        address: lot.address,
                                        availableSpots: lot.availableSpaces,
                                        price: lot.hourlyRate,
                                        distance: lot.distance
                                    }))}
                                    selectedParkingSpot={selectedLot?.id}
                                    setSelectedParkingSpot={lotId => setSelectedLot(getLotById(lotId))}
                                    onViewDetails={handleViewDetails}
                                    onBackClick={handleBackClick}
                                />
                            </div>

                            {/* Map view */}
                            <div className="md:col-span-2 h-[700px] rounded-lg overflow-hidden shadow-lg">
                                <ParkingMap
                                    darkMode={darkMode}
                                    mapCenter={selectedLot ? selectedLot.coordinates : (selectedLocation?.coordinates || mapCenter)}
                                    markers={nearbyParking.map(lot => ({
                                        id: lot.id,
                                        name: lot.name,
                                        coordinates: [
                                            parseFloat(lot.coordinates[0]),
                                            parseFloat(lot.coordinates[1])
                                        ],
                                        availableSpaces: lot.availableSpaces,
                                        totalSpaces: lot.totalSpaces
                                    }))}
                                    selectedLot={selectedLot}
                                    onMarkerClick={handleMarkerClick}
                                />
                            </div>
                        </div>
                    </div>
                );

            case 'details':
                return (
                    <div className="w-full max-w-6xl mx-auto px-4">
                        <LotDetailsView
                            darkMode={darkMode}
                            lot={{
                                ...selectedLot,
                                // Ensure coordinates are properly formatted
                                coordinates: selectedLot ? [
                                    parseFloat(selectedLot.coordinates[0]),
                                    parseFloat(selectedLot.coordinates[1])
                                ] : mapCenter
                            }}
                            onBackClick={handleBackClick}
                            formattedStartDateTime={formatDateTime(date, startTime)}
                            formattedEndDateTime={formatDateTime(date, endTime)}
                            handleReserve={handleReserve}
                        />
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