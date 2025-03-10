import React from 'react';
import { FaArrowLeft, FaParking } from 'react-icons/fa';
import ParkingMap from './ParkingMap';

const LotDetailsView = ({ darkMode, lot, onBackClick, formattedStartDateTime, formattedEndDateTime, handleReserve }) => {
    if (!lot) return null;

    return (
        <div className="w-full animate-fadeIn pb-8">
            {/* Header with back button */}
            <div className="flex items-center mb-4">
                <button
                    onClick={onBackClick}
                    className="text-red-600 hover:text-red-800 mr-4 flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {lot.name}
                </h1>
            </div>

            {/* Lot overview */}
            <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                {lot.address}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                    {/* Reservation details if provided */}
                    {(formattedStartDateTime || formattedEndDateTime) && (
                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md mb-6`}>
                            <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Reservation Details
                            </h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                                    <p className="font-medium">{formattedStartDateTime || 'Not specified'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                                    <p className="font-medium">{formattedEndDateTime || 'Not specified'}</p>
                                </div>
                            </div>

                            {/* Reservation summary and button */}
                            <div className="mt-4">
                                <div className={`p-3 rounded-md mb-3 ${darkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        You're about to reserve a spot at:
                                    </p>
                                    <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {lot.name}
                                    </p>
                                    <div className="flex justify-between mt-1">
                                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {lot.availableSpaces} spots available
                                        </p>
                                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {lot.hourlyRate}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleReserve(lot.id)}
                                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors shadow-md flex items-center justify-center"
                                >
                                    <FaParking className="mr-2" />
                                    Reserve Parking Spot
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Peak Hours Section */}
                    <div className="mb-6">
                        <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Peak Hours Heatmap
                        </h2>

                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-semibold">Peak Hours</span>
                                    <span className="font-bold text-lg">{lot.peakHours[0].percentage}%</span>
                                </div>
                                <div className="text-sm text-gray-500 mb-2">4-hour intervals</div>

                                <div className="grid grid-cols-4 gap-3 mb-2">
                                    {lot.peakHours.map((hour, index) => (
                                        <div
                                            key={index}
                                            className="h-16 rounded"
                                            style={{
                                                backgroundColor: `rgba(239, 68, 68, ${hour.percentage / 100})`,
                                                opacity: darkMode ? 0.8 : 1
                                            }}
                                        ></div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-4 gap-3 text-center text-xs">
                                    {lot.peakHours.map((hour, index) => (
                                        <div key={index}>
                                            {hour.time}
                                            <br />
                                            {hour.percentage}% full
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lot Information */}
                    <div className="mb-6">
                        <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Lot Information
                        </h2>

                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Available Spaces</p>
                                    <p className="font-semibold text-lg">{lot.availableSpaces} / {lot.totalSpaces}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Rate</p>
                                    <p className="font-semibold text-lg">{lot.hourlyRate}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Distance</p>
                                    <p className="font-semibold">{lot.distance}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Walking Time</p>
                                    <p className="font-semibold">{lot.walkingDistance}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Permit Type</p>
                                    <p className="font-semibold">{lot.passType}</p>
                                </div>
                                <div className="mb-3">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Near</p>
                                    <p className="font-semibold">{lot.destinationBuilding}</p>
                                </div>
                            </div>

                            <div className="mb-3 mt-2">
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Features</p>
                                <div className="flex flex-wrap gap-2">
                                    {lot.features.map((feature, index) => (
                                        <span
                                            key={index}
                                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'
                                                }`}
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                                <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    {lot.description}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map view */}
                <div>
                    <div className="h-[500px] rounded-lg overflow-hidden shadow-lg sticky top-4">
                        <ParkingMap
                            darkMode={darkMode}
                            mapCenter={lot.coordinates}
                            markers={[{
                                id: lot.id,
                                name: lot.name,
                                coordinates: lot.coordinates,
                                availableSpaces: lot.availableSpaces,
                                totalSpaces: lot.totalSpaces
                            }]}
                            selectedLot={lot}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LotDetailsView; 