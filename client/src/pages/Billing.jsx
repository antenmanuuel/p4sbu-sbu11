import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaFilter, FaFileDownload, FaTimes, FaInfoCircle, FaReceipt, FaExclamationTriangle } from 'react-icons/fa';
import { UserService } from '../utils/api';

const Billing = ({ darkMode, isAuthenticated }) => {
    const navigate = useNavigate();

    // Redirect if not authenticated
    if (!isAuthenticated) {
        navigate('/');
    }

    // State management
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortDirection, setSortDirection] = useState('desc'); // 'asc' or 'desc'
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [billingHistory, setBillingHistory] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    // Define fetchBillingHistory outside useEffect so it can be called elsewhere
    const fetchBillingHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await UserService.getBillingHistory();
            console.log('Billing history response:', response);

            if (response.success && response.data.billingHistory) {
                // Format the billing data with additional details
                const formattedBillingHistory = response.data.billingHistory.map(item => ({
                    id: item._id,
                    date: new Date(item.date).toISOString().split('T')[0], // Format as YYYY-MM-DD
                    description: item.description,
                    amount: item.amount,
                    status: item.status,
                    paymentMethod: 'Credit Card', // Default payment method
                    details: `${item.description} - Purchased on ${new Date(item.date).toLocaleDateString()}`,
                    receiptNumber: `REC-${new Date(item.date).getFullYear()}-${item._id.substr(-4)}`
                }));

                setBillingHistory(formattedBillingHistory);
            } else {
                throw new Error(response.error || 'Failed to fetch billing history');
            }
        } catch (error) {
            console.error('Error fetching billing history:', error);
            setError(error.message || 'An unexpected error occurred');
            // Set empty array to avoid undefined errors
            setBillingHistory([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch billing history from backend on component mount
    useEffect(() => {
        fetchBillingHistory();
    }, []);

    // Filter and sort billing history
    const filteredBillingHistory = useMemo(() => {
        return billingHistory
            .filter(bill => {
                // Apply search term filter
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    bill.description.toLowerCase().includes(searchLower) ||
                    bill.amount.toString().includes(searchLower) ||
                    bill.date.includes(searchLower) ||
                    (bill.status && bill.status.toLowerCase().includes(searchLower));

                // Apply type filter
                let matchesType = true;
                if (filterType !== 'all') {
                    if (filterType === 'permit') {
                        // Match direct permit type or description contains "Permit" but not "Refund"
                        matchesType = (bill.type === 'permit' ||
                            (bill.description.includes('Permit') && !bill.description.includes('Refund')));
                    } else if (filterType === 'refund') {
                        // Match refund type or description starts with "Refund"
                        matchesType = (bill.type === 'refund' || bill.description.includes('Refund'));
                    } else if (filterType === 'metered') {
                        // Match metered type or description contains "Metered" or "Parking"
                        matchesType = bill.type === 'metered' ||
                            bill.description.toLowerCase().includes('metered') ||
                            (bill.description.toLowerCase().includes('parking') &&
                                !bill.description.includes('Permit'));
                    } else if (filterType === 'permit-switch') {
                        // Match permit switch transactions
                        matchesType = bill.description.includes('Permit Switch') ||
                            (bill.description.includes('Permit') &&
                                billingHistory.some(b => b.description.includes('Refund') &&
                                    b.description.includes('Permit Switch')));
                    }
                }

                return matchesSearch && matchesType;
            })
            .sort((a, b) => {
                // Sort by date
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            });
    }, [billingHistory, searchTerm, filterType, sortDirection]);

    // Add function to find related permit switch transactions for grouping
    const findRelatedPermitSwitchTransactions = (bill) => {
        // Only look for related transactions if this is a permit switch transaction
        if (!bill.description.includes('Permit Switch') &&
            !(bill.description.includes('Permit') &&
                billingHistory.some(b => b.description.includes('Refund') &&
                    b.description.includes('Permit Switch')))) {
            return [];
        }

        // Check if this is a refund transaction
        const isRefund = bill.description.includes('Refund');

        // For permit switch transactions, find related transactions within a reasonable time frame (48 hours)
        const billDate = new Date(bill.date);
        const timeWindow = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

        return billingHistory.filter(transaction => {
            if (transaction.id === bill.id) return false; // Skip the current transaction

            const transactionDate = new Date(transaction.date);
            const timeDiff = Math.abs(transactionDate - billDate);

            // Check if within time window
            if (timeDiff > timeWindow) return false;

            // Check if related to permits or contains "Permit Switch"
            return transaction.description.includes('Permit') ||
                transaction.description.includes('Permit Switch');
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // View receipt details
    const handleViewReceipt = (bill) => {
        setSelectedBill(bill);
        setShowReceiptModal(true);
    };

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/dashboard')}
                    className={`mr-4 flex items-center justify-center p-2 rounded-full 
                   ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
                >
                    <FaArrowLeft className={darkMode ? 'text-white' : 'text-gray-900'} />
                </button>
                <h1 className="text-2xl font-bold">Billing History</h1>
            </div>

            {/* Search and filter controls */}
            <div className={`mb-6 p-4 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex flex-col md:flex-row justify-between mb-6">
                    <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3 mb-3 md:mb-0">
                        <input
                            type="text"
                            placeholder="Search billing history..."
                            className={`border rounded-lg py-2 px-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className={`border rounded-lg py-2 px-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Transactions</option>
                            <option value="permit">Permits Only</option>
                            <option value="metered">Metered Only</option>
                            <option value="refund">Refunds Only</option>
                            <option value="permit-switch">Permit Switches</option>
                        </select>
                        <select
                            className={`border rounded-lg py-2 px-3 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                            value={sortDirection}
                            onChange={(e) => setSortDirection(e.target.value)}
                        >
                            <option value="desc">Newest First</option>
                            <option value="asc">Oldest First</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={() => fetchBillingHistory()}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                        >
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 
                        ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
                        {/* Type Filter */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Type
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className={`w-full px-3 py-2 rounded-lg border 
                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                         focus:outline-none`}
                            >
                                <option value="all">All Transactions</option>
                                <option value="permit">Permits Only</option>
                                <option value="metered">Metered Only</option>
                                <option value="refund">Refunds Only</option>
                                <option value="permit-switch">Permit Switches</option>
                            </select>
                        </div>

                        {/* Date Range - Start */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                From Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border 
                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                         focus:outline-none`}
                            />
                        </div>

                        {/* Date Range - End */}
                        <div>
                            <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                To Date
                            </label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className={`w-full px-3 py-2 rounded-lg border 
                         ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600'
                                        : 'bg-white text-gray-900 border-gray-300'} 
                         focus:outline-none`}
                            />
                        </div>

                        {/* Reset Filters */}
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFilterType('all');
                                    setDateRange({ start: '', end: '' });
                                    setSearchTerm('');
                                }}
                                className={`px-4 py-2 rounded-lg 
                          ${darkMode
                                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Billing History Table */}
            <div className={`rounded-lg shadow-sm overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-700"></div>
                    </div>
                ) : error ? (
                    <div className={`p-6 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
                        <p className="flex items-center">
                            <FaExclamationTriangle className="mr-2 flex-shrink-0" />
                            {error}
                        </p>
                    </div>
                ) : filteredBillingHistory.length === 0 ? (
                    <div className={`p-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        <FaInfoCircle className="mx-auto mb-2 text-2xl" />
                        <p>No billing records found matching your criteria.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                <tr>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Date
                                    </th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Description
                                    </th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        ID
                                    </th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Amount
                                    </th>
                                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Status
                                    </th>
                                    <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {filteredBillingHistory.map((bill) => (
                                    <React.Fragment key={bill.id}>
                                        <tr className={darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}>
                                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {bill.date}
                                            </td>
                                            <td className={`px-6 py-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {bill.description}
                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {bill.details}
                                                </p>
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {bill.id}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap font-medium ${bill.amount < 0 || bill.description.includes('Refund')
                                                ? 'text-green-600'
                                                : darkMode ? 'text-white' : 'text-gray-900'
                                                }`}>
                                                {formatCurrency(bill.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium 
                                          ${bill.status === 'Paid'
                                                        ? 'bg-green-100 text-green-800'
                                                        : bill.status === 'Refunded'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-red-100 text-red-800'}`}
                                                >
                                                    {bill.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleViewReceipt(bill)}
                                                    className="text-blue-500 hover:text-blue-700 mr-3"
                                                >
                                                    View Receipt
                                                </button>

                                                {/* Add button to show related transactions if this is a permit switch */}
                                                {(bill.description.includes('Permit Switch') ||
                                                    (bill.description.includes('Permit') &&
                                                        billingHistory.some(b => b.description.includes('Refund') &&
                                                            b.description.includes('Permit Switch')))) && (
                                                        <button
                                                            onClick={() => setExpandedId(expandedId === bill.id ? null : bill.id)}
                                                            className={`${darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'}`}
                                                        >
                                                            {expandedId === bill.id ? 'Hide Related' : 'Show Related'}
                                                        </button>
                                                    )}
                                            </td>
                                        </tr>

                                        {/* Show related transactions if expanded */}
                                        {expandedId === bill.id && (
                                            <tr className={darkMode ? 'bg-gray-900' : 'bg-gray-50'}>
                                                <td colSpan="6" className="px-6 py-4">
                                                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                        <h4 className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Related Permit Switch Transactions</h4>
                                                        {findRelatedPermitSwitchTransactions(bill).length > 0 ? (
                                                            <ul className="space-y-2">
                                                                {findRelatedPermitSwitchTransactions(bill).map(relatedBill => (
                                                                    <li key={relatedBill.id} className={`p-2 rounded flex justify-between items-center ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                                        <div>
                                                                            <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{relatedBill.description}</p>
                                                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{relatedBill.date}</p>
                                                                        </div>
                                                                        <div className="flex items-center">
                                                                            <span className={`mr-3 font-medium ${relatedBill.amount < 0 || relatedBill.description.includes('Refund')
                                                                                ? 'text-green-500'
                                                                                : darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                                {formatCurrency(relatedBill.amount)}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => handleViewReceipt(relatedBill)}
                                                                                className="text-blue-500 hover:text-blue-700 text-sm"
                                                                            >
                                                                                View
                                                                            </button>
                                                                        </div>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>No related transactions found.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            {
                showReceiptModal && selectedBill && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                        <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                                onClick={() => setShowReceiptModal(false)}
                            >
                                <FaTimes size={20} />
                            </button>

                            <div className="flex items-center mb-4">
                                <FaReceipt className="text-green-500 mr-2" size={24} />
                                <h3 className="text-xl font-semibold">Payment Receipt</h3>
                            </div>

                            <div className={`p-4 mb-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div className="flex justify-between mb-2">
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Receipt Number:</span>
                                    <span className="font-medium">{selectedBill.receiptNumber}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Date:</span>
                                    <span className="font-medium">{selectedBill.date}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                        {selectedBill.description.includes('Refund') ? 'Refund For:' : 'Description:'}
                                    </span>
                                    <span className="font-medium">{selectedBill.description}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Payment Method:</span>
                                    <span className="font-medium">{selectedBill.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                        {selectedBill.amount < 0 ? 'Refund Amount:' : 'Amount:'}
                                    </span>
                                    <span className={`font-bold ${selectedBill.amount < 0 || selectedBill.description.includes('Refund') ? 'text-green-500' : ''}`}>
                                        {formatCurrency(selectedBill.amount)}
                                    </span>
                                </div>
                                {selectedBill.status === 'Refunded' && (
                                    <div className="mt-4 pt-4 border-t border-gray-500">
                                        <div className="text-center text-sm">
                                            <span className={`inline-block px-2 py-1 rounded-full 
                                                    ${darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                                This transaction is a refund
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Special information for permit switch transactions */}
                                {selectedBill.description && selectedBill.description.includes('Permit Switch') && (
                                    <div className="mt-4 pt-4 border-t border-gray-500">
                                        <div className="text-center text-sm">
                                            <span className={`inline-block px-2 py-1 rounded-full 
                                                    ${darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'}`}>
                                                Permit Switch Transaction
                                            </span>
                                            <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                This transaction is part of a permit switch. When switching permits,
                                                you may see multiple related transactions including the initial purchase,
                                                refund for the old permit, and purchase of the new permit.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                    onClick={() => setShowReceiptModal(false)}
                                >
                                    Close
                                </button>
                                <button
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center"
                                >
                                    <FaFileDownload className="mr-2" />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Billing; 