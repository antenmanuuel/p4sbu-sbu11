import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminService } from '../../utils/api';
import { FaEnvelope, FaArrowLeft, FaCheckCircle, FaHourglassHalf, FaSync, FaFilter, FaSearch, FaSpinner, FaChevronDown, FaChevronUp, FaCircle, FaClock, FaCheck, FaTimes, FaReply, FaLock } from 'react-icons/fa';

const ContactSubmissions = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSubmissions, setTotalSubmissions] = useState(0);
    const [filter, setFilter] = useState('all'); // all, new, in-progress, resolved
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(false);
    const [counts, setCounts] = useState({ total: 0, new: 0, inProgress: 0, resolved: 0 });
    const [followupMessage, setFollowupMessage] = useState('');
    const [isInternalNote, setIsInternalNote] = useState(false);
    const [addingFollowup, setAddingFollowup] = useState(false);
    const [followupSuccess, setFollowupSuccess] = useState(false);

    // Fetch submissions and counts on initial load and when filter or page changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchSubmissions();
            fetchCounts();
        } else {
            navigate('/login');
        }
    }, [isAuthenticated, filter, currentPage]);

    const fetchSubmissions = async () => {
        setLoading(true);
        setError('');

        // Trim the search query to avoid empty space issues
        const trimmedSearchQuery = searchQuery.trim();
        console.log('Search query:', trimmedSearchQuery);

        try {
            const filters = {};
            if (filter !== 'all') {
                filters.status = filter;
            }

            // Add search query to filters if present
            if (trimmedSearchQuery) {
                filters.search = trimmedSearchQuery;
            }

            console.log('Sending filters to API:', filters);
            const result = await AdminService.getContactSubmissions(filters, currentPage, 10);
            console.log('API response:', result); // Debug log

            if (result.success) {
                // Match the server response structure exactly - server returns nested data object
                const submissionsData = result.data?.data?.data || [];
                console.log('Extracted submissions data:', submissionsData);

                if (Array.isArray(submissionsData)) {
                    setSubmissions(submissionsData);

                    // Log the names found for debugging search issues
                    if (trimmedSearchQuery) {
                        console.log('Names in search results:');
                        submissionsData.forEach(sub => {
                            console.log(`- ${sub.firstName} ${sub.lastName} (${sub.email})`);
                        });
                    }
                } else {
                    console.warn('Submissions data is not an array:', submissionsData);
                    setSubmissions([]);
                }

                // Get pagination data from the correct location in the response
                const pagination = result.data?.data?.pagination || {};
                setTotalPages(pagination.pages || 1);
                setTotalSubmissions(pagination.total || 0);
                setIsSearching(false);
            } else {
                console.error('API reported error:', result.error);
                setError(result.error || 'Failed to load submissions');
                setSubmissions([]);
                setIsSearching(false);
            }
        } catch (err) {
            console.error('Error fetching submissions:', err);
            setError('An unexpected error occurred');
            setSubmissions([]);
            setIsSearching(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchCounts = async () => {
        try {
            const result = await AdminService.getContactSubmissionCounts();

            if (result.success) {
                setCounts(result.data.counts);
            }
        } catch (err) {
            console.error('Error fetching counts:', err);
        }
    };

    const handleViewSubmission = (submission) => {
        setSelectedSubmission(submission);
        setFollowupMessage('');
        setIsInternalNote(false);
        setFollowupSuccess(false);
        setShowDetailModal(true);
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedSubmission) return;

        setUpdatingStatus(true);
        setStatusUpdateSuccess(false);

        try {
            const result = await AdminService.updateContactSubmission(selectedSubmission._id, { status });

            if (result.success) {
                // Extract the updated submission data from the response
                const updatedSubmission = result.data.data.data || result.data.data;

                // Update the submission in the list with the correct path in the response
                const updatedSubmissions = submissions.map((sub) =>
                    sub._id === selectedSubmission._id ? updatedSubmission : sub
                );

                // Update both states with the correct data
                setSubmissions(updatedSubmissions);
                setSelectedSubmission(updatedSubmission);
                setStatusUpdateSuccess(true);

                // Refresh counts
                fetchCounts();

                // Force rerender of the current view
                if (filter !== 'all' && status !== filter) {
                    // If filtered view and status changed to something not in filter,
                    // fetch submissions to update the list correctly
                    fetchSubmissions();
                }
            } else {
                setError(result.error || 'Failed to update status');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setUpdatingStatus(false);

            // Clear success message after 3 seconds
            if (statusUpdateSuccess) {
                setTimeout(() => setStatusUpdateSuccess(false), 3000);
            }
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
        setIsSearching(true);
        fetchSubmissions();
    };

    const clearSearch = () => {
        setSearchQuery('');
        setCurrentPage(1);
        // We'll fetch submissions automatically in the useEffect when searchQuery changes
    };

    const handleAddFollowup = async (e) => {
        e.preventDefault();

        if (!followupMessage.trim()) {
            return;
        }

        setAddingFollowup(true);
        setFollowupSuccess(false);

        try {
            const result = await AdminService.addContactFollowup(selectedSubmission._id, {
                message: followupMessage,
                isInternal: isInternalNote
            });

            if (result.success) {
                // Extract the updated submission from the response
                const updatedSubmission = result.data.data.submission;

                // Update the selected submission with the new data
                setSelectedSubmission(updatedSubmission);
                setFollowupMessage('');
                setFollowupSuccess(true);

                // Also update the submission in the list
                const updatedSubmissions = submissions.map((sub) =>
                    sub._id === selectedSubmission._id ? updatedSubmission : sub
                );

                setSubmissions(updatedSubmissions);

                // If follow-up changed status (e.g., from new to in-progress)
                // and we're in a filtered view, we may need to refresh the list
                if (filter !== 'all' && updatedSubmission.status !== selectedSubmission.status) {
                    fetchSubmissions();
                }

                // Refresh counts in case status changed
                fetchCounts();
            } else {
                setError(result.error || 'Failed to add follow-up');
            }
        } catch (err) {
            setError('An unexpected error occurred');
            console.error(err);
        } finally {
            setAddingFollowup(false);

            // Clear success message after 3 seconds
            if (followupSuccess) {
                setTimeout(() => setFollowupSuccess(false), 3000);
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'new':
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                        <FaCircle className="mr-1 h-2 w-2" /> New
                    </span>
                );
            case 'in-progress':
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                        <FaClock className="mr-1 h-2 w-2" /> In Progress
                    </span>
                );
            case 'resolved':
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                        <FaCheck className="mr-1 h-2 w-2" /> Resolved
                    </span>
                );
            default:
                return null;
        }
    };

    // Generate pagination buttons
    const renderPaginationButtons = () => {
        const buttons = [];

        // Always show first page
        buttons.push(
            <button
                key="first"
                onClick={() => setCurrentPage(1)}
                className={`px-3 py-1 rounded ${currentPage === 1
                    ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                    : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                    }`}
            >
                1
            </button>
        );

        // Show ellipsis if needed
        if (currentPage > 3) {
            buttons.push(<span key="ellipsis1" className="px-1">...</span>);
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (i === 1 || i === totalPages) continue; // Skip first and last as they're always shown

            buttons.push(
                <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`px-3 py-1 rounded ${currentPage === i
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                        }`}
                >
                    {i}
                </button>
            );
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
            buttons.push(<span key="ellipsis2" className="px-1">...</span>);
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            buttons.push(
                <button
                    key="last"
                    onClick={() => setCurrentPage(totalPages)}
                    className={`px-3 py-1 rounded ${currentPage === totalPages
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                        : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                        }`}
                >
                    {totalPages}
                </button>
            );
        }

        return buttons;
    };

    return (
        <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/admin-dashboard')}
                            className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                            aria-label="Back to dashboard"
                        >
                            <FaArrowLeft />
                        </button>
                        <h1 className="text-2xl font-bold">Contact Form Submissions</h1>
                    </div>

                    <button
                        onClick={fetchSubmissions}
                        className={`p-2 rounded ${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'} text-white flex items-center`}
                    >
                        <FaSync className="mr-2" /> Refresh
                    </button>
                </div>

                {/* Search Box */}
                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-grow relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name, email, or subject..."
                                className={`block w-full pl-10 pr-10 py-2 rounded-md ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500'
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                    }`}
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    <FaTimes className={`${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`} />
                                </button>
                            )}
                        </div>
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded ${darkMode
                                ? 'bg-blue-700 hover:bg-blue-800 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                } flex items-center justify-center`}
                            disabled={isSearching}
                        >
                            {isSearching ? <FaSpinner className="animate-spin mr-2" /> : <FaSearch className="mr-2" />}
                            Search
                        </button>
                    </form>
                </div>

                {/* Filters and Stats */}
                <div className={`mb-6 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow`}>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div
                            onClick={() => setFilter('all')}
                            className={`p-4 rounded-lg cursor-pointer border-2 ${filter === 'all'
                                ? (darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-25' : 'border-blue-500 bg-blue-50')
                                : (darkMode ? 'border-gray-700' : 'border-gray-200')
                                }`}
                        >
                            <p className="text-sm font-medium">All Submissions</p>
                            <p className="text-2xl font-bold">{counts.total}</p>
                        </div>

                        <div
                            onClick={() => setFilter('new')}
                            className={`p-4 rounded-lg cursor-pointer border-2 ${filter === 'new'
                                ? (darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-25' : 'border-blue-500 bg-blue-50')
                                : (darkMode ? 'border-gray-700' : 'border-gray-200')
                                }`}
                        >
                            <p className="text-sm font-medium">New</p>
                            <p className="text-2xl font-bold">{counts.new}</p>
                        </div>

                        <div
                            onClick={() => setFilter('in-progress')}
                            className={`p-4 rounded-lg cursor-pointer border-2 ${filter === 'in-progress'
                                ? (darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-25' : 'border-blue-500 bg-blue-50')
                                : (darkMode ? 'border-gray-700' : 'border-gray-200')
                                }`}
                        >
                            <p className="text-sm font-medium">In Progress</p>
                            <p className="text-2xl font-bold">{counts.inProgress}</p>
                        </div>

                        <div
                            onClick={() => setFilter('resolved')}
                            className={`p-4 rounded-lg cursor-pointer border-2 ${filter === 'resolved'
                                ? (darkMode ? 'border-blue-500 bg-blue-900 bg-opacity-25' : 'border-blue-500 bg-blue-50')
                                : (darkMode ? 'border-gray-700' : 'border-gray-200')
                                }`}
                        >
                            <p className="text-sm font-medium">Resolved</p>
                            <p className="text-2xl font-bold">{counts.resolved}</p>
                        </div>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className={`p-4 mb-6 rounded-md ${darkMode ? 'bg-red-800 text-red-100' : 'bg-red-50 text-red-800'}`}>
                        {error}
                    </div>
                )}

                {/* Submissions Table */}
                <div className={`overflow-hidden rounded-lg shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    {loading ? (
                        <div className="p-8 text-center">
                            <FaSpinner className="animate-spin h-8 w-8 mx-auto mb-4" />
                            <p>Loading submissions...</p>
                        </div>
                    ) : Array.isArray(submissions) && submissions.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Subject
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th scope="col" className="relative px-6 py-3">
                                                <span className="sr-only">Actions</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y divide-gray-200 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                        {submissions.map((submission) => (
                                            <tr
                                                key={submission._id}
                                                className={`cursor-pointer hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                                                onClick={() => handleViewSubmission(submission)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <div className="font-medium">{submission.firstName} {submission.lastName}</div>
                                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{submission.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm truncate max-w-xs">
                                                        {submission.subject}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {getStatusBadge(submission.status)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {formatDate(submission.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                                    <button
                                                        className={`font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewSubmission(submission);
                                                        }}
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Enhanced Pagination */}
                            {totalPages > 1 && (
                                <div className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-sm">
                                            Showing <span className="font-medium">{submissions.length}</span> of{' '}
                                            <span className="font-medium">{totalSubmissions}</span> submissions
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className={`px-3 py-1 rounded ${currentPage === 1
                                                ? (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                                                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                                                }`}
                                        >
                                            Previous
                                        </button>

                                        <div className="flex gap-1">
                                            {renderPaginationButtons()}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className={`px-3 py-1 rounded ${currentPage === totalPages
                                                ? (darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                                                : (darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                                                }`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="p-8 text-center">
                            <FaEnvelope className="h-10 w-10 mx-auto mb-4 opacity-40" />
                            <p className="text-lg">No submissions found</p>
                            <p className="mt-2 text-sm opacity-70">
                                {searchQuery
                                    ? `No results found for "${searchQuery}"`
                                    : filter !== 'all'
                                        ? `Try selecting a different status filter`
                                        : `There are no contact form submissions yet`
                                }
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Details Modal with Follow-ups */}
            {showDetailModal && selectedSubmission && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-black opacity-75"></div>
                        </div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div
                            className={`inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}
                        >
                            <div className={`px-4 pt-5 pb-4 sm:p-6 sm:pb-4 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-medium">
                                            Contact Form Details
                                        </h3>

                                        {statusUpdateSuccess && (
                                            <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-green-800 text-green-100' : 'bg-green-50 text-green-800'}`}>
                                                <div className="flex items-center">
                                                    <FaCheckCircle className="mr-2" />
                                                    <span>Status updated successfully</span>
                                                </div>
                                            </div>
                                        )}

                                        {followupSuccess && (
                                            <div className={`mt-2 p-2 rounded ${darkMode ? 'bg-green-800 text-green-100' : 'bg-green-50 text-green-800'}`}>
                                                <div className="flex items-center">
                                                    <FaCheckCircle className="mr-2" />
                                                    <span>Follow-up added successfully</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 space-y-4">
                                            <div>
                                                <h4 className="text-sm font-medium opacity-70">From</h4>
                                                <p className="mt-1">{selectedSubmission.firstName} {selectedSubmission.lastName}</p>
                                                <p className="text-sm mt-1">{selectedSubmission.email}</p>
                                                {selectedSubmission.phone && (
                                                    <p className="text-sm mt-1">{selectedSubmission.phone}</p>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium opacity-70">Subject</h4>
                                                <p className="mt-1 font-medium">{selectedSubmission.subject}</p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium opacity-70">Message</h4>
                                                <div className={`mt-1 p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} max-h-40 overflow-y-auto`}>
                                                    <p className="whitespace-pre-wrap">{selectedSubmission.message}</p>
                                                </div>
                                            </div>

                                            {/* Follow-ups Section */}
                                            {selectedSubmission.followups && selectedSubmission.followups.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-medium opacity-70">Follow-ups</h4>
                                                    <div className={`mt-1 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} max-h-60 overflow-y-auto`}>
                                                        {selectedSubmission.followups.map((followup, index) => (
                                                            <div
                                                                key={index}
                                                                className={`p-3 mb-2 ${followup.isInternal ?
                                                                    (darkMode ? 'bg-gray-800 border-l-4 border-yellow-500' : 'bg-gray-100 border-l-4 border-yellow-500') :
                                                                    (darkMode ? 'bg-blue-900 bg-opacity-30' : 'bg-blue-50')}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex items-center">
                                                                        {followup.isInternal && (
                                                                            <FaLock className="text-yellow-500 mr-2" title="Internal note" />
                                                                        )}
                                                                        <span className="font-medium">{followup.addedByName || 'Admin'}</span>
                                                                    </div>
                                                                    <span className="text-xs opacity-70">
                                                                        {formatDate(followup.createdAt)}
                                                                    </span>
                                                                </div>
                                                                <p className="whitespace-pre-wrap">{followup.message}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Add follow-up form */}
                                            <div>
                                                <h4 className="text-sm font-medium opacity-70">Add Follow-up</h4>
                                                <form onSubmit={handleAddFollowup}>
                                                    <textarea
                                                        value={followupMessage}
                                                        onChange={(e) => setFollowupMessage(e.target.value)}
                                                        className={`mt-1 w-full p-2 rounded ${darkMode ? 'bg-gray-700 text-white' : 'border border-gray-300'} focus:ring-blue-500 focus:border-blue-500`}
                                                        rows="3"
                                                        placeholder="Type your follow-up message here..."
                                                    ></textarea>

                                                    <div className="flex items-center mt-2">
                                                        <input
                                                            type="checkbox"
                                                            id="internalNote"
                                                            checked={isInternalNote}
                                                            onChange={() => setIsInternalNote(!isInternalNote)}
                                                            className="mr-2"
                                                        />
                                                        <label htmlFor="internalNote" className="text-sm">
                                                            Mark as internal note (not visible to user)
                                                        </label>
                                                    </div>

                                                    <div className="mt-3">
                                                        <button
                                                            type="submit"
                                                            disabled={!followupMessage.trim() || addingFollowup}
                                                            className={`inline-flex items-center px-4 py-2 rounded-md ${followupMessage.trim() && !addingFollowup
                                                                ? (darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700')
                                                                : (darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                                                                } text-white focus:outline-none`}
                                                        >
                                                            {addingFollowup ? (
                                                                <>
                                                                    <FaSpinner className="animate-spin mr-2" />
                                                                    Sending...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FaReply className="mr-2" />
                                                                    {isInternalNote ? 'Add Internal Note' : 'Send Follow-up'}
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>

                                            <div className="flex justify-between">
                                                <div>
                                                    <h4 className="text-sm font-medium opacity-70">Status</h4>
                                                    <div className="mt-1">
                                                        {getStatusBadge(selectedSubmission.status)}
                                                    </div>
                                                </div>

                                                <div>
                                                    <h4 className="text-sm font-medium opacity-70">Received</h4>
                                                    <p className="mt-1 text-sm">{formatDate(selectedSubmission.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium opacity-70">Update Status</h4>
                                                <div className="mt-2 flex space-x-2">
                                                    <button
                                                        onClick={() => handleUpdateStatus('new')}
                                                        disabled={selectedSubmission.status === 'new' || updatingStatus}
                                                        className={`px-3 py-1 text-sm rounded-md ${selectedSubmission.status === 'new'
                                                            ? (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400')
                                                            : (darkMode ? 'bg-blue-700 hover:bg-blue-600' : 'bg-blue-100 text-blue-800 hover:bg-blue-200')
                                                            }`}
                                                    >
                                                        New
                                                    </button>

                                                    <button
                                                        onClick={() => handleUpdateStatus('in-progress')}
                                                        disabled={selectedSubmission.status === 'in-progress' || updatingStatus}
                                                        className={`px-3 py-1 text-sm rounded-md ${selectedSubmission.status === 'in-progress'
                                                            ? (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400')
                                                            : (darkMode ? 'bg-yellow-700 hover:bg-yellow-600' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200')
                                                            }`}
                                                    >
                                                        In Progress
                                                    </button>

                                                    <button
                                                        onClick={() => handleUpdateStatus('resolved')}
                                                        disabled={selectedSubmission.status === 'resolved' || updatingStatus}
                                                        className={`px-3 py-1 text-sm rounded-md ${selectedSubmission.status === 'resolved'
                                                            ? (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-400')
                                                            : (darkMode ? 'bg-green-700 hover:bg-green-600' : 'bg-green-100 text-green-800 hover:bg-green-200')
                                                            }`}
                                                    >
                                                        Resolved
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse ${darkMode ? 'bg-gray-800 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'}`}>
                                <button
                                    type="button"
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${darkMode ? 'bg-blue-700 hover:bg-blue-800' : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContactSubmissions;
