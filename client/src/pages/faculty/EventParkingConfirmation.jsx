import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaCalendarAlt, FaArrowLeft, FaEye } from 'react-icons/fa';

const EventParkingConfirmation = ({ darkMode }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get request details from location state
    const requestData = location.state?.requestData;

    // If no request data is found, redirect to the request form
    if (!requestData) {
        navigate('/faculty/event-parking-request');
        return null;
    }

    // Function to format date as MMMM DD, YYYY
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Function to format time as HH:MM AM/PM
    const formatTime = (timeString) => {
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(timeString).toLocaleTimeString(undefined, options);
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="bg-white shadow-md rounded-lg p-8">
                <div className="text-center mb-8">
                    <div className="flex justify-center">
                        <div className="rounded-full bg-red-50 p-4 inline-block">
                            <FaCheckCircle className="text-red-600 text-4xl" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold mt-4">Request <span className="text-red-600">Submitted Successfully!</span></h1>
                    <p className="text-gray-600 mt-2">
                        Your event parking request has been submitted and is pending review.
                    </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                        <FaCalendarAlt className="mr-2 text-red-600" /> Event Details
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-gray-500 text-sm">Request ID</p>
                            <p className="font-medium">{requestData.requestId}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Status</p>
                            <p className="font-medium">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                                    Pending Review
                                </span>
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Event Name</p>
                            <p className="font-medium">{requestData.eventName}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Location</p>
                            <p className="font-medium">{requestData.location}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Date</p>
                            <p className="font-medium">{formatDate(requestData.eventDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Time</p>
                            <p className="font-medium">{formatTime(requestData.startTime)} - {formatTime(requestData.endTime)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Expected Attendees</p>
                            <p className="font-medium">{requestData.expectedAttendees}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm">Preferred Parking</p>
                            <p className="font-medium">
                                {requestData.parkingLotPreference ?
                                    (typeof requestData.parkingLotPreference === 'object' && requestData.parkingLotPreference.name ?
                                        requestData.parkingLotPreference.name :
                                        requestData.parkingLotPreference) :
                                    'No preference'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-8">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-gray-700">
                                You will receive an email notification when your request is reviewed. You can also check the status of your request at any time from your requests page.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => navigate('/faculty/event-parking-requests')}
                        className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        <FaEye className="mr-2" /> View All Requests
                    </button>
                    <button
                        onClick={() => navigate('/faculty/event-parking-request')}
                        className="flex items-center justify-center px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    >
                        <FaArrowLeft className="mr-2" /> Create Another Request
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventParkingConfirmation; 