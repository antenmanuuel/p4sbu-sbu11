import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationModal from '../../components/NotificationModal';
import { FaPlus, FaEye, FaExclamationCircle, FaCheck, FaTimesCircle, FaClock, FaArrowLeft } from 'react-icons/fa';
import { EventParkingService } from '../../utils/api';

const EventParkingRequests = ({ darkMode, user, isAuthenticated }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState([]);

    // Notification modal state
    const [notification, setNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Handle success message if redirected from form submission - use our custom notification now
    useEffect(() => {
        if (location.state?.success) {
            showNotification(
                'Request Submitted',
                `Request submitted successfully! Request ID: ${location.state.requestId}`,
                'success'
            );
            // Clear the state to prevent showing the message again on refresh
            navigate(location.pathname, { replace: true });
        }
    }, [location, navigate]);

    // Redirect non-faculty users
    useEffect(() => {
        if (user && user.userType !== 'faculty') {
            showNotification('Access Denied', 'Only faculty members can access this page.', 'error');
            navigate('/dashboard');
        }
    }, [user, navigate]);

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

    // Fetch user's event requests
    useEffect(() => {
        const fetchRequests = async () => {
            setLoading(true);
            try {
                // Check if user is faculty before making the request
                if (!user || user.userType !== 'faculty') {
                    console.error('Unauthorized: User is not faculty', user);
                    setLoading(false);
                    return;
                }

                console.log('Fetching event requests for faculty user', user.userType);

                const result = await EventParkingService.getFacultyEventRequests();

                if (result.success) {
                    console.log('Faculty event requests fetched successfully:', result.data);
                    setRequests(result.data || []);
                } else {
                    console.error('Failed to fetch event requests:', result.error);
                    showNotification('Error', `Failed to load your event requests: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Error in fetchRequests:', error);
                showNotification('Error', `Error fetching your requests: ${error.message}`, 'error');
            } finally {
                setLoading(false);
            }
        };

        if (user?.userType === 'faculty') {
            fetchRequests();
        }
    }, [user]);

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
                icon: <FaExclamationCircle className="mr-1" />,
                text: 'Cancelled',
                className: 'bg-gray-100 text-gray-800 border-gray-300'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                {config.icon}
                {config.text}
            </span>
        );
    };

    // Format date for display
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Format time for display
    const formatTime = (timeString) => {
        const options = { hour: 'numeric', minute: 'numeric', hour12: true };
        return new Date(timeString).toLocaleTimeString(undefined, options);
    };

    // Handle view request click
    const handleViewRequest = (requestId) => {
        navigate(`/faculty/event-parking/${requestId}`);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold mb-2">My Event <span className="text-red-600">Parking Requests</span></h1>
                <Link
                    to="/faculty/event-parking-request"
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                    <FaPlus className="mr-2" />
                    New Request
                </Link>
            </div>

            {requests.length === 0 ? (
                <div className="bg-white shadow-md rounded-lg p-8 text-center">
                    <h3 className="text-xl font-medium text-gray-700 mb-4">No Requests Found</h3>
                    <p className="text-gray-600 mb-6">
                        You haven't submitted any event parking requests yet.
                    </p>
                    <Link
                        to="/faculty/event-parking-request"
                        className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                        <FaPlus className="mr-2" />
                        Create Your First Request
                    </Link>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Request ID
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Event Name
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Submitted
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((request) => (
                                <tr key={request._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {request.requestId}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {request.eventName}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <div>{formatDate(request.eventDate)}</div>
                                        <div className="text-xs text-gray-500">
                                            {formatTime(request.startTime)} - {formatTime(request.endTime)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {request.location}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        <StatusBadge status={request.status} />
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {formatDate(request.createdAt)}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleViewRequest(request.requestId)}
                                            className="flex items-center text-red-600 hover:text-red-800"
                                        >
                                            <FaEye className="mr-1" /> View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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

export default EventParkingRequests; 