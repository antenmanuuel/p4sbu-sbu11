import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationModal from '../../components/NotificationModal';
import { FaClock, FaCheck, FaTimesCircle, FaMapMarkerAlt, FaCalendarAlt, FaArrowLeft, FaUserAlt, FaBuilding, FaUsers, FaRegClock, FaParking } from 'react-icons/fa';
import { EventParkingService } from '../../utils/api';

const EventParkingDetail = ({ darkMode, user, isAuthenticated }) => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState(null);
    const [error, setError] = useState(null);

    // Notification modal state
    const [notification, setNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Fetch request details
    useEffect(() => {
        const fetchRequestDetails = async () => {
            setLoading(true);
            try {
                // Check if user is faculty before making the request
                if (!user || user.userType !== 'faculty') {
                    setError('Only faculty members can view event parking requests.');
                    setLoading(false);
                    return;
                }

                console.log('Fetching event parking request details:', requestId);
                const result = await EventParkingService.getEventRequest(requestId);

                if (result.success) {
                    console.log('Request details fetched successfully:', result.data);
                    setRequest(result.data);
                } else {
                    console.error('Failed to fetch request details:', result.error);
                    setError(`Failed to load request details: ${result.error}`);
                }
            } catch (error) {
                console.error('Error in fetchRequestDetails:', error);
                setError(`Error fetching request details: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (requestId) {
            fetchRequestDetails();
        }
    }, [requestId, user]);

    // Format date for display
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format time for display
    const formatTime = (timeString) => {
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(timeString).toLocaleTimeString(undefined, options);
    };

    // Show notification
    const showNotification = (title, message, type = 'info') => {
        setNotification({
            isOpen: true,
            title,
            message,
            type
        });
    };

    // Close notification
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    // Cancel request
    const handleCancelRequest = async () => {
        try {
            if (request && request.status === 'pending') {
                const result = await EventParkingService.updateEventRequestStatus(requestId, 'cancelled');

                if (result.success) {
                    showNotification('Request Cancelled', 'Your event parking request has been cancelled successfully.', 'success');
                    // Update the local state to reflect the change
                    setRequest(prev => ({ ...prev, status: 'cancelled' }));
                } else {
                    showNotification('Error', `Failed to cancel request: ${result.error}`, 'error');
                }
            }
        } catch (error) {
            console.error('Error cancelling request:', error);
            showNotification('Error', `Error cancelling request: ${error.message}`, 'error');
        }
    };

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            pending: {
                icon: <FaClock className="mr-1" />,
                text: 'Pending',
                className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
            },
            approved: {
                icon: <FaCheck className="mr-1" />,
                text: 'Approved',
                className: 'bg-green-100 text-green-800 border-green-300'
            },
            denied: {
                icon: <FaTimesCircle className="mr-1" />,
                text: 'Denied',
                className: 'bg-red-100 text-red-800 border-red-300'
            },
            cancelled: {
                icon: <FaTimesCircle className="mr-1" />,
                text: 'Cancelled',
                className: 'bg-gray-100 text-gray-800 border-gray-300'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
                {config.icon}
                {config.text}
            </span>
        );
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <FaTimesCircle className="mx-auto text-red-500 text-4xl mb-4" />
                    <h2 className="text-2xl font-bold text-red-700 mb-2">Error</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/faculty/event-parking-requests')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Back to Requests
                    </button>
                </div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <FaExclamationCircle className="mx-auto text-yellow-500 text-4xl mb-4" />
                    <h2 className="text-2xl font-bold text-yellow-700 mb-2">Request Not Found</h2>
                    <p className="text-yellow-600 mb-4">The requested event parking request could not be found.</p>
                    <button
                        onClick={() => navigate('/faculty/event-parking-requests')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Back to Requests
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/faculty/event-parking-requests')}
                    className="flex items-center text-red-600 hover:text-red-800 transition-colors mr-4"
                >
                    <FaArrowLeft className="mr-2" /> Back to Requests
                </button>
                <h1 className="text-3xl font-bold">Event <span className="text-red-600">Parking Details</span></h1>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Header section with status */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{request.eventName}</h2>
                        <p className="text-gray-600">Request ID: {request.requestId}</p>
                    </div>
                    <StatusBadge status={request.status} />
                </div>

                {/* Main content grid */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Event Information */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold border-b pb-2">Event Information</h3>

                            <div className="flex items-start">
                                <FaCalendarAlt className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Date & Time</p>
                                    <p className="text-gray-600">{formatDate(request.eventDate)}</p>
                                    <p className="text-gray-600">{formatTime(request.startTime)} - {formatTime(request.endTime)}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <FaMapMarkerAlt className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Location</p>
                                    <p className="text-gray-600">{request.location}</p>
                                </div>
                            </div>

                            <div>
                                <p className="font-medium text-gray-700">Description</p>
                                <p className="text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">{request.eventDescription}</p>
                            </div>
                        </div>

                        {/* Parking & Contact Information */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-semibold border-b pb-2">Parking Details</h3>

                            <div className="flex items-start">
                                <FaUsers className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Expected Attendees</p>
                                    <p className="text-gray-600">{request.expectedAttendees}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <FaParking className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Preferred Parking Lot</p>
                                    <p className="text-gray-600">
                                        {request.parkingLotPreference ?
                                            (typeof request.parkingLotPreference === 'object' && request.parkingLotPreference.name ?
                                                request.parkingLotPreference.name :
                                                request.parkingLotPreference
                                            ) :
                                            'No preference'
                                        }
                                    </p>
                                </div>
                            </div>

                            {request.specialRequirements && (
                                <div>
                                    <p className="font-medium text-gray-700">Special Requirements</p>
                                    <p className="text-gray-600 mt-1 p-3 bg-gray-50 rounded-md">{request.specialRequirements}</p>
                                </div>
                            )}

                            <h3 className="text-xl font-semibold border-b pb-2 mt-8">Contact Information</h3>

                            <div className="flex items-start">
                                <FaUserAlt className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Organizer</p>
                                    <p className="text-gray-600">{request.organizerName}</p>
                                    <p className="text-gray-600">{request.organizerEmail}</p>
                                    <p className="text-gray-600">{request.organizerPhone}</p>
                                </div>
                            </div>

                            <div className="flex items-start">
                                <FaBuilding className="mt-1 text-red-600 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">Department</p>
                                    <p className="text-gray-600">{request.departmentName}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin notes (if provided) */}
                    {request.adminNotes && (
                        <div className="mt-8 p-4 border border-red-100 rounded-lg bg-red-50">
                            <h3 className="text-lg font-semibold text-red-600 mb-2">Admin Notes</h3>
                            <p className="text-gray-700">{request.adminNotes}</p>
                        </div>
                    )}

                    {/* Request Timeline */}
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold border-b pb-2">Request Timeline</h3>
                        <div className="mt-4 flex items-start">
                            <FaRegClock className="mt-1 text-red-600 mr-3" />
                            <div>
                                <p className="font-medium text-gray-700">Submitted on</p>
                                <p className="text-gray-600">{formatDate(request.createdAt)} at {formatTime(request.createdAt)}</p>
                            </div>
                        </div>

                        {request.approvalDate && (
                            <div className="mt-4 flex items-start">
                                <FaCheck className="mt-1 text-green-500 mr-3" />
                                <div>
                                    <p className="font-medium text-gray-700">
                                        {request.status === 'approved' ? 'Approved on' : 'Updated on'}
                                    </p>
                                    <p className="text-gray-600">{formatDate(request.approvalDate)} at {formatTime(request.approvalDate)}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    {request.status === 'pending' && (
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleCancelRequest}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Cancel Request
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={closeNotification}
                title={notification.title}
                message={notification.message}
                type={notification.type}
            />
        </div>
    );
};

export default EventParkingDetail; 