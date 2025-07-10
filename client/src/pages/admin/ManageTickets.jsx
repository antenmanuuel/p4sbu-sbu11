/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUser, FaFilter, FaTimes, FaCheck, FaDollarSign, FaArrowLeft } from 'react-icons/fa';
import { AdminService, TicketService } from '../../utils/api';

const ManageTickets = ({ isAuthenticated, darkMode }) => {
    const navigate = useNavigate();
    const [tickets, setTickets] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
    const [formData, setFormData] = useState({
        name: '',
        amount: '',
        userId: '',
        isPaid: false
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        isPaid: undefined,
        userId: ''
    });
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0
    });
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/');
            return;
        }
        fetchTickets();
        fetchUsers();
    }, [isAuthenticated, navigate, pagination.currentPage, filters]);

    const fetchTickets = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await TicketService.getTickets(
                filters,
                pagination.currentPage,
                10
            );

            if (result.success) {
                setTickets(result.data.tickets);
                setPagination(result.data.pagination);
            } else {
                setError(result.error || 'Failed to fetch tickets');
            }
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setError('An unexpected error occurred while fetching tickets');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            // Get all users and filter for faculty and students only
            const result = await AdminService.getUsers({}, 1, 100);
            if (result.success) {
                // Filter users to only include faculty and students
                const filteredUsers = result.data.users.filter(user =>
                    user.userType === 'faculty' || user.userType === 'student'
                );
                setUsers(filteredUsers);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        }
    };

    const handleCreateTicket = () => {
        setFormData({
            name: '',
            amount: '',
            userId: '',
            isPaid: false
        });
        setModalMode('create');
        setShowModal(true);
    };

    const handleEditTicket = (ticket) => {
        setFormData({
            name: ticket.name,
            amount: ticket.amount,
            userId: ticket.user._id,
            isPaid: ticket.isPaid
        });
        setSelectedTicket(ticket);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleDeleteTicket = async (ticketId) => {
        if (!window.confirm('Are you sure you want to delete this ticket?')) {
            return;
        }

        try {
            const result = await TicketService.deleteTicket(ticketId);
            if (result.success) {
                showNotificationMessage('Ticket deleted successfully', 'success');
                fetchTickets();
            } else {
                showNotificationMessage(result.error, 'error');
            }
        } catch (err) {
            console.error('Error deleting ticket:', err);
            showNotificationMessage('An error occurred while deleting the ticket', 'error');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.amount || !formData.userId) {
            showNotificationMessage('All fields are required', 'error');
            return;
        }

        try {
            let result;
            if (modalMode === 'create') {
                result = await TicketService.createTicket(formData);
                if (result.success) {
                    showNotificationMessage('Ticket created successfully', 'success');
                }
            } else {
                result = await TicketService.updateTicket(selectedTicket._id, formData);
                if (result.success) {
                    showNotificationMessage('Ticket updated successfully', 'success');
                }
            }

            if (result.success) {
                setShowModal(false);
                fetchTickets();
            } else {
                showNotificationMessage(result.error, 'error');
            }
        } catch (err) {
            console.error('Error submitting ticket:', err);
            showNotificationMessage('An error occurred while submitting the ticket', 'error');
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters({
            ...filters,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = searchTerm === '' ||
            ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.user && ticket.user.firstName && ticket.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ticket.user && ticket.user.lastName && ticket.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (ticket.user && ticket.user.email && ticket.user.email.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch;
    });

    const showNotificationMessage = (message, type) => {
        setNotificationMessage(message);
        setNotificationType(type);
        setShowNotification(true);
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination({
                ...pagination,
                currentPage: newPage
            });
        }
    };

    const clearFilters = () => {
        setFilters({
            isPaid: undefined,
            userId: ''
        });
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} p-4 md:p-8`}>
            {/* Header with back button */}
            <div className="flex items-center mb-8">
                <button
                    onClick={() => navigate('/admin-dashboard')}
                    className={`mr-4 flex items-center justify-center p-2 rounded-full 
                             ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                    <FaArrowLeft className="text-red-600" />
                </button>
                <h1 className="text-2xl font-bold">Manage Fines</h1>
                <div className="flex-grow"></div>
                <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex items-center"
                    onClick={handleCreateTicket}
                >
                    <FaPlus className="mr-2" /> Issue New Fine
                </button>
            </div>

            {/* Notification */}
            {showNotification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded shadow-lg ${notificationType === 'success' ? 'bg-green-500' : 'bg-red-500'
                    } text-white`}>
                    {notificationMessage}
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
                    <p>{error}</p>
                </div>
            )}

            {/* Search and Filter Controls */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-grow">
                        <div className={`flex items-center px-3 py-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                            <FaSearch className={`mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                                type="text"
                                placeholder="Search by name, user details..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className={`w-full bg-transparent focus:outline-none ${darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-500'}`}
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="flex items-center">
                            <select
                                name="isPaid"
                                value={filters.isPaid === undefined ? '' : filters.isPaid.toString()}
                                onChange={handleFilterChange}
                                className={`px-3 py-2 rounded-lg 
                                         ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Statuses</option>
                                <option value="false">Unpaid</option>
                                <option value="true">Paid</option>
                            </select>
                        </div>

                        <div className="flex items-center">
                            <select
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                className={`px-3 py-2 rounded-lg 
                                         ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                         border focus:outline-none`}
                            >
                                <option value="">All Users</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.firstName} {user.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            onClick={clearFilters}
                            className={`px-3 py-2 rounded-lg flex items-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                }`}
                        >
                            <FaTimes className="mr-1" /> Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Tickets Table */}
            <div className={`overflow-x-auto rounded-lg shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                        <tr>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                Fine Name
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                User
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                Amount
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                Date Issued
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                Status
                            </th>
                            <th scope="col" className={`px-4 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase' : 'text-gray-500 uppercase'}`}>
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                        {isLoading ? (
                            <tr>
                                <td colSpan="6" className="px-4 py-4 text-center">
                                    <div className="flex justify-center items-center py-6">
                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-600"></div>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTickets.length === 0 ? (
                            <tr>
                                <td colSpan="6" className={`px-4 py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    No fines found
                                </td>
                            </tr>
                        ) : (
                            filteredTickets.map(ticket => (
                                <tr key={ticket._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                    <td className="px-4 py-4">
                                        {ticket.name}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center">
                                            <FaUser className="mr-2 text-gray-400" />
                                            <div>
                                                {ticket.user ? (
                                                    <>
                                                        <div>{ticket.user.firstName} {ticket.user.lastName}</div>
                                                        <div className="text-sm text-gray-500">{ticket.user.email}</div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-gray-500">User not found</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        {formatCurrency(ticket.amount)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {formatDate(ticket.date_posted)}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.isPaid
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                            }`}>
                                            {ticket.isPaid ? 'Paid' : 'Unpaid'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleEditTicket(ticket)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <FaEdit />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTicket(ticket._id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex flex-col md:flex-row justify-between items-center mt-4 px-4">
                    <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'} mb-2 md:mb-0`}>
                        Showing {(pagination.currentPage - 1) * 10 + 1}-{Math.min(pagination.currentPage * 10, pagination.total)} of {pagination.total} fines
                    </div>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className={`px-3 py-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded 
                                   ${pagination.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Previous
                        </button>
                        {[...Array(pagination.totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => handlePageChange(i + 1)}
                                className={`px-3 py-1 rounded
                                      ${i + 1 === pagination.currentPage
                                        ? (darkMode ? 'bg-red-600 text-white' : 'bg-red-600 text-white')
                                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className={`px-3 py-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded
                                  ${pagination.currentPage === pagination.totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

                        <div className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
                            }`}>
                            <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg font-medium mb-4">
                                    {modalMode === 'create' ? 'Issue New Fine' : 'Edit Fine'}
                                </h3>

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">
                                            Fine Name
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                }`}
                                            placeholder="e.g. Parking Violation"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">
                                            Amount
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaDollarSign className="text-gray-400" />
                                            </div>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                className={`w-full p-2 pl-8 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                    }`}
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">
                                            User
                                        </label>
                                        <select
                                            name="userId"
                                            value={formData.userId}
                                            onChange={handleChange}
                                            className={`w-full p-2 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                                }`}
                                        >
                                            <option value="">Select User</option>
                                            {users.map(user => (
                                                <option key={user._id} value={user._id}>
                                                    {user.firstName} {user.lastName} - {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                name="isPaid"
                                                checked={formData.isPaid}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-sm">Mark as Paid</span>
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className={`mr-2 px-4 py-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                                                }`}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                        >
                                            {modalMode === 'create' ? 'Create' : 'Update'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageTickets; 