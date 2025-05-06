import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaEye, FaCalendarAlt, FaClock, FaSearch, FaFilter } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationModal from '../../components/NotificationModal';
import { EventParkingService } from '../../utils/api';

const ManageEventRequests = ({ darkMode, user, isAuthenticated }) => {
    const [loading, setLoading] = useState(true);
    const [eventRequests, setEventRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        pages: 1
    });

    // Notification modal state
    const [notification, setNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

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

    // Fetch event requests from the API
    const fetchEventRequests = async (page = 1, status = filter) => {
        setLoading(true);
        try {
            // Check if user is admin before making the request
            if (!user || user.userType !== 'admin') {
                console.error('Unauthorized: User is not an admin', user);
                showNotification('Access Denied', 'You must be an administrator to view event requests', 'error');
                setLoading(false);
                return;
            }

            console.log('Fetching event requests for admin user', user.userType);

            const result = await EventParkingService.getEventRequests({
                page: page,
                limit: pagination.limit,
                status: status !== 'all' ? status : undefined
            });

            if (result.success) {
                console.log('Event requests fetched successfully:', result.data);
                setEventRequests(result.data.requests);
                setPagination({
                    page: result.data.pagination.page,
                    limit: pagination.limit,
                    total: result.data.pagination.total,
                    pages: result.data.pagination.pages
                });
            } else {
                console.error('Failed to fetch event requests:', result.error);
                showNotification('Error', `Failed to load event requests: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error in fetchEventRequests:', error);
            showNotification('Error', `Error fetching event requests: ${error.message}`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch request details
    const fetchRequestDetails = async (requestId) => {
        try {
            const result = await EventParkingService.getEventRequest(requestId);

            if (result.success) {
                setSelectedRequest(result.data);
                setAdminNotes(result.data.adminNotes || '');
                setShowDetailsModal(true);
            } else {
                showNotification('Error', `Failed to load request details: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error in fetchRequestDetails:', error);
            showNotification('Error', `Error fetching request details: ${error.message}`, 'error');
        }
    };

    // Update request status
    const updateRequestStatus = async (requestId, status) => {
        try {
            const result = await EventParkingService.updateEventRequestStatus(
                requestId,
                status,
                adminNotes
            );

            if (result.success) {
                showNotification('Success', `Request ${status} successfully`, 'success');
                setShowDetailsModal(false);
                // Refresh the request list
                fetchEventRequests(pagination.page, filter);
            } else {
                showNotification('Error', `Failed to ${status} request: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error(`Error ${status} request:`, error);
            showNotification('Error', `Error updating request: ${error.message}`, 'error');
        }
    };

    // Load requests on component mount and when filter changes
    useEffect(() => {
        fetchEventRequests(1, filter);
    }, [filter]);

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        // In a real implementation, you would send the search query to the server
        // For now, we just filter the existing data on the client
        fetchEventRequests(1, filter);
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

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            pending: {
                icon: <FaClock className="mr-1" />,
                text: 'Pending',
                className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
            },
            approved: {
                icon: <FaCheckCircle className="mr-1" />,
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
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
                {config.icon}
                {config.text}
            </span>
        );
    };

    // Pagination UI
    const renderPagination = () => {
        return (
            <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                    Showing {eventRequests.length} of {pagination.total} requests
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => fetchEventRequests(pagination.page - 1, filter)}
                        disabled={pagination.page === 1}
                        className={`px-3 py-1 rounded ${pagination.page === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                    >
                        Previous
                    </button>
                    <div className="flex items-center px-3 bg-gray-50 rounded">
                        Page {pagination.page} of {pagination.pages}
                    </div>
                    <button
                        onClick={() => fetchEventRequests(pagination.page + 1, filter)}
                        disabled={pagination.page === pagination.pages}
                        className={`px-3 py-1 rounded ${pagination.page === pagination.pages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            }`}
                    >
                        Next
                    </button>
                </div>
            </div>
        );
    };

    // Details Modal
    const renderDetailsModal = () => {
        if (!selectedRequest) return null;

        return (
            <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-center border-b p-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Event Parking Request
                        </h2>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <span className="text-sm text-gray-500">Request ID:</span>
                                <span className="ml-2 font-medium">{selectedRequest.requestId}</span>
                            </div>
                            <StatusBadge status={selectedRequest.status} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Event Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Event Name</p>
                                        <p className="font-medium">{selectedRequest.eventName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Date</p>
                                        <p className="font-medium">{formatDate(selectedRequest.eventDate)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Time</p>
                                        <p className="font-medium">
                                            {formatTime(selectedRequest.startTime)} - {formatTime(selectedRequest.endTime)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Location</p>
                                        <p className="font-medium">{selectedRequest.location}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Description</p>
                                        <p className="text-sm">{selectedRequest.eventDescription}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Organizer Information</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Name</p>
                                        <p className="font-medium">{selectedRequest.organizerName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Department</p>
                                        <p className="font-medium">{selectedRequest.departmentName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{selectedRequest.organizerEmail}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Phone</p>
                                        <p className="font-medium">{selectedRequest.organizerPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Parking Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Expected Attendees</p>
                                    <p className="font-medium">{selectedRequest.expectedAttendees}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Preferred Parking Lot</p>
                                    <p className="font-medium">
                                        {selectedRequest.parkingLotPreference ?
                                            (typeof selectedRequest.parkingLotPreference === 'object' && selectedRequest.parkingLotPreference.name ?
                                                selectedRequest.parkingLotPreference.name :
                                                selectedRequest.parkingLotPreference) :
                                            'No preference'}
                                    </p>
                                </div>
                                {selectedRequest.specialRequirements && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-500">Special Requirements</p>
                                        <p className="text-sm">{selectedRequest.specialRequirements}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Administrative Notes</h3>
                            <textarea
                                className="w-full border rounded-md p-2 h-24"
                                placeholder="Add notes about this request (will be visible to faculty)"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                disabled={selectedRequest.status !== 'pending'}
                            />
                        </div>

                        {selectedRequest.status === 'pending' && (
                            <div className="flex gap-3 justify-end mt-6">
                                <button
                                    onClick={() => updateRequestStatus(selectedRequest.requestId, 'denied')}
                                    className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                                >
                                    <FaTimesCircle className="mr-2" />
                                    Deny Request
                                </button>
                                <button
                                    onClick={() => updateRequestStatus(selectedRequest.requestId, 'approved')}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                                >
                                    <FaCheckCircle className="mr-2" />
                                    Approve Request
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Manage Event <span className="text-red-600">Parking Requests</span></h1>

                <div className="flex items-center space-x-2">
                    <select
                        className="border rounded-md px-3 py-2 text-sm"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                        <option value="cancelled">Cancelled</option>
                    </select>

                    <form onSubmit={handleSearch} className="flex">
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="border rounded-l-md px-3 py-2 text-sm w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="bg-red-600 text-white px-3 py-2 rounded-r-md"
                        >
                            <FaSearch />
                        </button>
                    </form>
                </div>
            </div>

            {loading ? (
                <LoadingSpinner />
            ) : eventRequests.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                    <FaCalendarAlt className="mx-auto text-gray-400 text-5xl mb-4" />
                    <h2 className="text-xl font-medium text-gray-700 mb-2">No Event Parking Requests Found</h2>
                    <p className="text-gray-500">
                        {filter !== 'all'
                            ? `There are no ${filter} event parking requests at this time.`
                            : 'There are no event parking requests in the system yet.'}
                    </p>
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Request ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Event Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Organizer
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Attendees
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Requested On
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {eventRequests.map((request) => (
                                        <tr key={request._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {request.requestId}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {request.eventName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatDate(request.eventDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {request.organizerName}
                                                <div className="text-xs text-gray-500">{request.departmentName}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {request.expectedAttendees}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <StatusBadge status={request.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {formatDate(request.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => fetchRequestDetails(request.requestId)}
                                                    className="text-red-600 hover:text-red-800 flex items-center"
                                                >
                                                    <FaEye className="mr-1" /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {renderPagination()}
                </>
            )}

            {showDetailsModal && renderDetailsModal()}

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

export default ManageEventRequests; 