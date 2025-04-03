import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { NotificationService, AuthService } from '../utils/api';
import { FaCheck, FaCheckDouble, FaTrash, FaClock, FaFilter, FaExclamationTriangle, FaParking, FaInfoCircle, FaArrowLeft } from 'react-icons/fa';

const Notifications = ({ darkMode }) => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [totalCount, setTotalCount] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');
    const [filter, setFilter] = useState('all'); // all, unread, type: (fine, permit, reservation, system)
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const notificationsPerPage = 10;

    // Check auth and load notifications
    useEffect(() => {
        const fetchNotifications = async () => {
            // Check if user is authenticated
            if (!AuthService.isAuthenticated()) {
                navigate('/login', { state: { from: '/notifications' } });
                return;
            }

            try {
                setLoading(true);
                setError('');

                // Build query parameters
                const unreadOnly = filter === 'unread';
                const skip = (currentPage - 1) * notificationsPerPage;
                const limit = notificationsPerPage;

                const result = await NotificationService.getNotifications(limit, unreadOnly, skip);

                if (result.success) {
                    // If we're filtering by type, do it client-side
                    let filteredNotifications = result.data.notifications;
                    if (filter === 'fine' || filter === 'permit' || filter === 'reservation' || filter === 'system') {
                        filteredNotifications = filteredNotifications.filter(note => note.type === filter);
                    }

                    setNotifications(filteredNotifications);
                    setUnreadCount(result.data.unreadCount);
                    setTotalCount(result.data.totalCount);

                    // Calculate total pages
                    const total = filter === 'unread' ? result.data.unreadCount : result.data.totalCount;
                    setTotalPages(Math.ceil(total / notificationsPerPage));
                } else {
                    setError(result.error || 'Failed to load notifications');
                }
            } catch (err) {
                console.error('Error fetching notifications:', err);
                setError('An unexpected error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [navigate, filter, currentPage]);

    // Handle marking notification as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            const result = await NotificationService.markAsRead(notificationId);
            if (result.success) {
                // Update the notification in the list
                setNotifications(notifications.map(note =>
                    note._id === notificationId ? { ...note, isRead: true } : note
                ));
                setUnreadCount(prev => Math.max(0, prev - 1));
                setSuccessMessage('Notification marked as read');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            setError('Failed to mark notification as read');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    // Handle marking all notifications as read
    const handleMarkAllAsRead = async () => {
        try {
            const result = await NotificationService.markAllAsRead();
            if (result.success) {
                // Update all notifications in the list
                setNotifications(notifications.map(note => ({ ...note, isRead: true })));
                setUnreadCount(0);
                setSuccessMessage(`${result.data.count} notifications marked as read`);

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            setError('Failed to mark all notifications as read');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    // Handle deleting a notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            const result = await NotificationService.deleteNotification(notificationId);
            if (result.success) {
                // Remove the notification from the list
                const deletedNote = notifications.find(note => note._id === notificationId);
                setNotifications(notifications.filter(note => note._id !== notificationId));

                // Update counts
                if (deletedNote && !deletedNote.isRead) {
                    setUnreadCount(prev => Math.max(0, prev - 1));
                }
                setTotalCount(prev => Math.max(0, prev - 1));

                setSuccessMessage('Notification deleted');

                // Clear success message after 3 seconds
                setTimeout(() => {
                    setSuccessMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            setError('Failed to delete notification');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setError('');
            }, 3000);
        }
    };

    // Handle clicking on a notification (navigate to action URL if available)
    const handleNotificationClick = (notification) => {
        // First mark as read if not already
        if (!notification.isRead) {
            handleMarkAsRead(notification._id);
        }

        // Navigate to action URL if available
        if (notification.actionUrl) {
            navigate(notification.actionUrl);
        }
    };

    // Get icon for notification type
    const getNotificationIcon = (type) => {
        switch (type) {
            case 'fine':
                return <FaExclamationTriangle className="text-red-500" />;
            case 'permit':
                return <FaParking className="text-yellow-500" />;
            case 'reservation':
                return <FaClock className="text-blue-500" />;
            case 'system':
            default:
                return <FaInfoCircle className="text-gray-500" />;
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/profile')}
                        className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-2xl font-bold">Notifications</h1>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <div className={`p-4 mb-4 rounded-md ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                        {successMessage}
                    </div>
                )}

                {error && (
                    <div className={`p-4 mb-4 rounded-md ${darkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`}>
                        {error}
                    </div>
                )}

                {/* Filters and Actions */}
                <div className={`mb-6 p-4 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center">
                            <FaFilter className="mr-2" />
                            <select
                                value={filter}
                                onChange={(e) => {
                                    setFilter(e.target.value);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                                className={`rounded-md p-2 ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white'
                                    : 'bg-white border-gray-300 text-gray-700'}`}
                            >
                                <option value="all">All Notifications</option>
                                <option value="unread">Unread Only</option>
                                <option value="fine">Fines</option>
                                <option value="permit">Permits</option>
                                <option value="reservation">Reservations</option>
                                <option value="system">System</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {unreadCount} unread / {totalCount} total
                            </span>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className={`flex items-center px-3 py-1.5 rounded-md text-sm ${darkMode
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        }`}
                                >
                                    <FaCheckDouble className="mr-2" />
                                    Mark All as Read
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {loading ? (
                        <div className="p-6 text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600 mx-auto"></div>
                            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-6 text-center">
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {filter === 'all'
                                    ? 'No notifications found.'
                                    : filter === 'unread'
                                        ? 'No unread notifications.'
                                        : `No ${filter} notifications found.`}
                            </p>
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((notification) => (
                                <li
                                    key={notification._id}
                                    className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'
                                        } ${!notification.isRead ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`flex-shrink-0 mt-1 rounded-full p-2 ${notification.type === 'fine'
                                                ? 'bg-red-100 text-red-600'
                                                : notification.type === 'permit'
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : notification.type === 'reservation'
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {notification.title}
                                                {!notification.isRead && (
                                                    <span className="inline-block ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                                                )}
                                            </h3>
                                            <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {notification.message}
                                            </p>
                                            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                {formatDate(notification.createdAt)}
                                            </p>
                                        </div>

                                        <div className="flex gap-1">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification._id)}
                                                    className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                                    title="Mark as read"
                                                >
                                                    <FaCheck className="text-green-500" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDeleteNotification(notification._id)}
                                                className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                                                title="Delete notification"
                                            >
                                                <FaTrash className="text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                        <nav className="flex items-center space-x-2">
                            <button
                                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md ${currentPage === 1
                                        ? darkMode
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : darkMode
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Previous
                            </button>

                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentPage(index + 1)}
                                    className={`px-3 py-1 rounded-md ${currentPage === index + 1
                                            ? 'bg-red-600 text-white'
                                            : darkMode
                                                ? 'bg-gray-700 text-white hover:bg-gray-600'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}

                            <button
                                onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                                disabled={currentPage === totalPages}
                                className={`px-3 py-1 rounded-md ${currentPage === totalPages
                                        ? darkMode
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : darkMode
                                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications; 