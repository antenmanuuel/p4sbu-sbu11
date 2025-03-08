import React from 'react';
import { FaArrowLeft, FaParking } from 'react-icons/fa';

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
                    Results
                </h1>
            </div>

            {/* Search parameters summary */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="mb-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                    <p className="font-medium truncate">{locationName}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Start Time</p>
                        <p className="font-medium">{formattedStartDateTime || 'Not specified'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">End Time</p>
                        <p className="font-medium">{formattedEndDateTime || 'Not specified'}</p>
                    </div>
                </div>
            </div>

            {/* Available Spots */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'} shadow-md`}>
                <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Available Parking ({nearbyParking.length})
                </h2>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {nearbyParking.map((spot) => (
                        <div
                            key={spot.id}
                            className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} 
                                ${selectedParkingSpot === spot.id ? 'ring-2 ring-red-500' : ''}
                                shadow-sm hover:shadow transition-all duration-200 cursor-pointer`}
                            onClick={() => setSelectedParkingSpot(spot.id)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-semibold">{spot.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{spot.address}</p>
                                    <p className="text-sm font-medium mt-1">Distance: {spot.distance}</p>
                                </div>
                                <div className="text-center">
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
                                className={`w-full py-2 text-white rounded-md font-medium text-sm flex items-center justify-center 
                                    ${selectedParkingSpot === spot.id
                                        ? 'bg-red-700 hover:bg-red-800'
                                        : 'bg-red-600 hover:bg-red-700'
                                    } transition-colors shadow-sm`}
                            >
                                <FaParking className="mr-2" /> View Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResultsView; 