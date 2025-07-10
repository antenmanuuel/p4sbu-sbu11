import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaSearch } from "react-icons/fa";
import { TicketService, AuthService } from "../utils/api";

const PastCitations = ({ darkMode }) => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState("all");
    const [sortBy, setSortBy] = useState("date");
    const [sortOrder, setSortOrder] = useState("desc");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tickets, setTickets] = useState([]);

    // Check authentication and fetch tickets on component mount
    useEffect(() => {
        const fetchTickets = async () => {
            if (!AuthService.isAuthenticated()) {
                navigate('/login', { state: { from: '/past-citations' } });
                return;
            }

            try {
                setLoading(true);
                const response = await TicketService.getUserTickets();
                if (response.success) {
                    setTickets(response.data);
                } else {
                    setError(response.error);
                }
            } catch {
                setError('Failed to fetch tickets');
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [navigate]);

    // Function to format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to get status class for styling
    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case "paid":
                return "bg-green-100 text-green-800 border border-green-200";
            case "unpaid":
                return "bg-red-100 text-red-800 border border-red-200";
            case "appealed":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            case "dismissed":
                return "bg-blue-100 text-blue-800 border border-blue-200";
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    // Format amount as currency
    const formatAmount = (amount) => {
        return `$${amount}`;
    };

    // Filter and sort tickets
    const filteredTickets = tickets
        .filter(ticket => {
            // Filter by status
            if (filter !== "all") {
                const isPaid = ticket.isPaid;
                if (
                    (filter === "paid" && !isPaid) ||
                    (filter === "unpaid" && isPaid)
                ) {
                    return false;
                }
            }

            // Filter by search term
            if (searchTerm) {
                const searchLower = searchTerm.toLowerCase();
                return (
                    ticket.name.toLowerCase().includes(searchLower) ||
                    ticket._id.toLowerCase().includes(searchLower)
                );
            }

            return true;
        })
        .sort((a, b) => {
            // Sort by selected field
            let valueA, valueB;

            switch (sortBy) {
                case "date":
                    valueA = new Date(a.date_posted);
                    valueB = new Date(b.date_posted);
                    break;
                case "amount":
                    valueA = a.amount;
                    valueB = b.amount;
                    break;
                default:
                    valueA = a[sortBy] || "";
                    valueB = b[sortBy] || "";
            }

            // Apply sort order
            if (sortOrder === "asc") {
                return valueA > valueB ? 1 : -1;
            } else {
                return valueA < valueB ? 1 : -1;
            }
        });

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`mr-4 p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                    <FaArrowLeft />
                </button>
                <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Past Citations</h1>
            </div>

            {/* Search and Filter Controls */}
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Box */}
                    <div className="md:w-1/3">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by violation or ID"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${darkMode
                                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                            />
                        </div>
                    </div>

                    {/* Filter By Status */}
                    <div className="md:w-1/5">
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="all">All Statuses</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>

                    {/* Sort By */}
                    <div className="md:w-1/5">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="date">Date</option>
                            <option value="amount">Amount</option>
                            <option value="name">Violation Type</option>
                        </select>
                    </div>

                    {/* Sort Order */}
                    <div className="md:w-1/5">
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border appearance-none ${darkMode
                                ? 'bg-gray-700 border-gray-600 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                                }`}
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Citations List */}
            <div className={`rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                {loading ? (
                    <div className="p-6 text-center">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading citations...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="p-6 text-center">
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No citations found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-50 text-gray-700'}>
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium">ID</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Violation</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Amount</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredTickets.map((ticket) => (
                                    <tr key={ticket._id} className={darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}>
                                        <td className="px-4 py-4 text-sm">{ticket._id.substring(0, 8)}...</td>
                                        <td className="px-4 py-4 text-sm">{formatDate(ticket.date_posted)}</td>
                                        <td className="px-4 py-4 text-sm font-medium">{ticket.name}</td>
                                        <td className="px-4 py-4 text-sm font-medium">{formatAmount(ticket.amount)}</td>
                                        <td className="px-4 py-4 text-sm">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(ticket.isPaid ? 'paid' : 'unpaid')}`}>
                                                {ticket.isPaid ? 'Paid' : 'Unpaid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PastCitations; 