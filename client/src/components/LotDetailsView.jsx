import React from 'react';
import { FaArrowLeft, FaParking, FaCheckCircle, FaCar, FaWheelchair, FaChargingStation, FaInfoCircle, FaClock } from 'react-icons/fa';
import ReactMapGL, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN } from '../utils/env';

const LotDetailsView = ({
    darkMode,
    lot,
    onBackClick,
    onReserve,
    startDateTime,
    endDateTime,
    duration
}) => {
    // Add console log to verify we're receiving data from the backend
    console.log("Rendering lot details from backend:", lot);

    if (!lot) return null;

    return (
        <div className="w-full animate-fadeIn">
            {/* Header section with back button */}
            <div className="flex items-center mb-4">
                <button
                    onClick={onBackClick}
                    className="text-red-600 hover:text-red-800 mr-4 flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Lot Details
                </h1>
            </div>

            {/* Lot information */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Lot details */}
                <div className={`lg:col-span-1 p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {lot.name}
                    </h2>
                    <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {lot.address}
                    </p>

                    <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Available Spaces:</span>
                            <span className={`py-1 px-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {lot.availableSpaces} / {lot.totalSpaces}
                            </span>
                                </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                            <div
                                className="bg-red-600 h-2.5 rounded-full"
                                style={{ width: `${(lot.availableSpaces / lot.totalSpaces) * 100}%` }}
                            ></div>
                                </div>
                            </div>

                    <div className="mb-4">
                        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Pricing
                        </h3>
                        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {lot.price}
                        </p>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {lot.rateType}
                                        </p>
                                    </div>

                    <div className="mb-4">
                        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Allowed Permits
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {lot.permitTypes?.length > 0 ? (
                                lot.permitTypes.map((permit, index) => (
                                    <span
                                        key={index}
                                        className={`text-xs py-1 px-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {permit}
                                    </span>
                                ))
                            ) : (
                                <span className={`text-xs py-1 px-2 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                                    No specific permits required
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Features
                        </h3>
                        <div className="space-y-2">
                            {lot.features?.includes('EV Charging') && (
                                <div className="flex items-center">
                                    <FaChargingStation className={`mr-2 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>EV Charging Available</span>
                                </div>
                            )}
                            {lot.features?.includes('Accessible Parking') && (
                                <div className="flex items-center">
                                    <FaWheelchair className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Accessible Parking</span>
                                </div>
                            )}
                            {lot.features?.includes('Metered Parking') && (
                                <div className="flex items-center">
                                    <FaParking className={`mr-2 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Metered Parking</span>
                                        </div>
                            )}
                            {lot.features?.length === 0 && (
                                <div className="flex items-center">
                                    <FaInfoCircle className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>No special features</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {lot.description && (
                        <div className="mb-6">
                            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Description
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {lot.description}
                            </p>
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-6">
                            <FaClock className="mr-1" />
                            <span>Last updated: {lot.lastUpdated || 'Recently'}</span>
                        </div>
                    </div>

                    <button
                        onClick={onReserve}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-semibold transition-colors shadow-sm flex items-center justify-center"
                    >
                        <FaCar className="mr-2" /> Reserve Parking
                    </button>
                </div>

                {/* Map view */}
                <div className="lg:col-span-2">
                    <div className="h-[400px] rounded-lg overflow-hidden shadow-md mb-4">
                        <ReactMapGL
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
                            <Marker
                                longitude={lot.coordinates[1]}
                                latitude={lot.coordinates[0]}
                                color="#dc2626"
                            />
                        </ReactMapGL>
                                </div>

                    {/* Reservation details */}
                    <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Reservation Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Start Time</p>
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{startDateTime || 'Not specified'}</p>
                                </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>End Time</p>
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{endDateTime || 'Not specified'}</p>
                                </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Duration</p>
                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{duration || 'Not specified'}</p>
                                </div>
                                </div>

                        <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
                            <div className="flex">
                                <FaCheckCircle className={`mt-0.5 mr-2 flex-shrink-0 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                                <div>
                                    <p className={`font-medium ${darkMode ? 'text-green-400' : 'text-green-700'}`}>Parking Available</p>
                                    <p className={`text-sm ${darkMode ? 'text-green-500/80' : 'text-green-600'}`}>
                                        This lot currently has {lot.availableSpaces} spaces available for parking.
                                    </p>
                                </div>
                                </div>
                            </div>

                        {lot.rateType === 'Hourly' && (
                            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="flex">
                                    <FaInfoCircle className={`mt-0.5 mr-2 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                    <div>
                                        <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Hourly Rate Information</p>
                                        <p className={`text-sm ${darkMode ? 'text-blue-500/80' : 'text-blue-600'}`}>
                                            This lot charges ${lot.hourlyRate}/hour. Payment is required upon entry.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {lot.rateType === 'Permit-based' && (
                            <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'}`}>
                                <div className="flex">
                                    <FaInfoCircle className={`mt-0.5 mr-2 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                            <div>
                                        <p className={`font-medium ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>Permit Information</p>
                                        <p className={`text-sm ${darkMode ? 'text-blue-500/80' : 'text-blue-600'}`}>
                                            This lot requires a valid permit. Semester permits cost ${lot.semesterRate}.
                                </p>
                            </div>
                        </div>
                    </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LotDetailsView; 