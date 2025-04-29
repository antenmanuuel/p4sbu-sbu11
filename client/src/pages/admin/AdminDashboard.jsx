/* eslint-disable no-undef */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { FaUsers, FaUserCog, FaParking, FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaExclamationCircle, FaTicketAlt, FaCar, FaFileAlt, FaSync, FaFileDownload, FaEnvelope } from 'react-icons/fa';
import { AdminService, PermitService } from '../../utils/api';

const AdminDashboard = ({ isAuthenticated, darkMode }) => {
    const navigate = useNavigate();

    // State for pending users
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // State for user count
    const [usersCount, setUsersCount] = useState(0);
    const [isCountLoading, setIsCountLoading] = useState(true);
    const [countError, setCountError] = useState('');

    // State for active permits count
    const [activePermitsCount, setActivePermitsCount] = useState(0);
    const [isPermitsCountLoading, setIsPermitsCountLoading] = useState(true);
    const [permitsCountError, setPermitsCountError] = useState('');

    // State for active reservations count
    const [activeReservationsCount, setActiveReservationsCount] = useState(0);
    const [isReservationsCountLoading, setIsReservationsCountLoading] = useState(true);
    const [reservationsCountError, setReservationsCountError] = useState('');

    // State for lots count
    const [lotsCount, setLotsCount] = useState(0);
    const [isLotsCountLoading, setIsLotsCountLoading] = useState(true);
    const [lotsCountError, setLotsCountError] = useState('');

    // State for revenue data
    const [revenueData, setRevenueData] = useState([]);
    const [isRevenueLoading, setIsRevenueLoading] = useState(true);
    const [revenueError, setRevenueError] = useState('');

    // State for current month and pie data
    const [currentMonth, setCurrentMonth] = useState({ month: '', value: 0, permits: 0, citations: 0, metered: 0 });
    const [pieData, setPieData] = useState([
        { name: 'Permits', value: 0 },
        { name: 'Citations', value: 0 },
        { name: 'Metered', value: 0 },
    ]);

    // State for growth data
    const [growthData, setGrowthData] = useState([]);

    // State for report generation
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);
    const [isCsvGenerating, setIsCsvGenerating] = useState(false);
    const [reportError, setReportError] = useState('');

    // State for notifications
    const [showNotification, setShowNotification] = useState(false);
    const [notificationMessage, setNotificationMessage] = useState('');
    const [notificationType, setNotificationType] = useState('success'); // success, error, warning

    // Add useRef to imports
    const isInitialLoad = useRef(true);

    // Add state for contact submissions count
    const [contactSubmissionsCount, setContactSubmissionsCount] = useState(0);
    const [isContactSubmissionsCountLoading, setIsContactSubmissionsCountLoading] = useState(true);
    const [contactSubmissionsCountError, setContactSubmissionsCountError] = useState('');

    // Update the loadDashboardData function to mark initial load as complete after first fetch
    const loadDashboardData = useCallback(() => {
        // Load all dashboard data without setting up any automatic refresh
        fetchPendingUsers();
        fetchUsersCount();
        fetchLotsCount();
        fetchRevenueStats();
        fetchActivePermitsCount();
        fetchActiveReservationsCount();
        fetchContactSubmissionsCount();

        // Mark initial load as complete after a short delay
        setTimeout(() => {
            isInitialLoad.current = false;
        }, 2000);
    }, []);

    // Replace the existing useEffect for initial data loading with this improved version
    useEffect(() => {
        if (isAuthenticated) {
            console.log('Admin Dashboard: Loading initial data on startup');

            // Show the "refreshing" notification on startup
            setNotificationMessage('Refreshing data...');
            setNotificationType('success');
            setShowNotification(true);

            // Load all data on startup
            const loadStartupData = async () => {
                try {
                    // Load all data sources
                    await fetchPendingUsers();
                    await fetchUsersCount();
                    await fetchLotsCount();
                    await fetchRevenueStats();
                    await fetchActivePermitsCount();
                    await fetchActiveReservationsCount();
                    await fetchContactSubmissionsCount();

                    // Show success notification after loading
                    setNotificationMessage('Data refreshed successfully');
                    setNotificationType('success');

                    // Mark initial load as complete
                    isInitialLoad.current = false;
                } catch (error) {
                    console.error('Error loading initial data:', error);
                    setNotificationMessage('Failed to refresh data');
                    setNotificationType('error');
                }

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);
            };

            loadStartupData();
        }
    }, [isAuthenticated]);

    // Fetch pending users from backend
    const fetchPendingUsers = async () => {
        setIsLoading(true);
        setError('');

        try {
            const result = await AdminService.getPendingUsers();

            if (result.success) {
                setPendingUsers(result.data);
            } else {
                setError(result.error || 'Failed to fetch pending users');
            }
        } catch (err) {
            console.error('Error fetching pending users:', err);
            setError('An unexpected error occurred while fetching pending users');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch total users count from backend
    const fetchUsersCount = async () => {
        setIsCountLoading(true);
        setCountError('');

        try {
            // Use the existing getUsers API which includes total count in pagination
            const result = await AdminService.getUsers({}, 1, 1);

            if (result.success) {
                setUsersCount(result.data.pagination.total);
            } else {
                setCountError(result.error || 'Failed to fetch users count');
            }
        } catch (err) {
            console.error('Error fetching users count:', err);
            setCountError('An unexpected error occurred while fetching users count');
        } finally {
            setIsCountLoading(false);
        }
    };

    // Fetch total lots count from backend
    const fetchLotsCount = async () => {
        setIsLotsCountLoading(true);
        setLotsCountError('');

        try {
            // Call the LotService to get the lots count
            const result = await AdminService.getLots({}, 1, 1);

            if (result.success) {
                setLotsCount(result.data.pagination?.total || 0);
            } else {
                setLotsCountError(result.error || 'Failed to fetch lots count');
                // Fall back to mock data if API fails
                setLotsCount(getLotsWithActivePermitsCount());
            }
        } catch (err) {
            console.error('Error fetching lots count:', err);
            setLotsCountError('An unexpected error occurred while fetching lots count');
            // Fall back to mock data if API fails
            setLotsCount(getLotsWithActivePermitsCount());
        } finally {
            setIsLotsCountLoading(false);
        }
    };

    // Fetch revenue statistics from backend
    const fetchRevenueStats = async () => {
        try {
            setIsRevenueLoading(true);
            const response = await AdminService.getRevenueStatistics();
            console.log('Revenue API response:', response);

            if (response.success && response.data && response.data.revenueData) {
                const receivedData = response.data.revenueData;
                console.log('Received revenue data:', receivedData);

                // Update revenue data state
                setRevenueData(receivedData);

                // Find current month data
                const now = new Date();
                const currentMonthName = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now);
                const currentYearShort = now.getFullYear().toString().slice(-2);
                const currentMonthKey = `${currentMonthName}`;

                const currentMonthData = receivedData.find(item => item.month === currentMonthKey) || {
                    month: currentMonthKey,
                    value: 0,
                    permits: 0,
                    citations: 0,
                    metered: 0,
                };

                setCurrentMonth(currentMonthData);

                // Create pie data
                const newPieData = [
                    { name: 'Permits', value: currentMonthData.permits || 0 },
                    { name: 'Citations', value: currentMonthData.citations || 0 },
                    { name: 'Metered', value: currentMonthData.metered || 0 },
                ].filter(item => item.value > 0);

                setPieData(newPieData.length > 0 ? newPieData : [
                    { name: 'No Revenue', value: 1 }
                ]);

                // Calculate growth data if we have more than 1 month
                if (receivedData.length > 1) {
                    // Sort data chronologically
                    const sortedData = [...receivedData].sort((a, b) => {
                        // Parse month strings like "Jan '23"
                        const [aMonth, aYear] = (a.month.split(" ") || ['', '']);
                        const [bMonth, bYear] = (b.month.split(" ") || ['', '']);

                        const aYearNum = aYear ? parseInt(aYear.replace("'", "")) + 2000 : new Date().getFullYear();
                        const bYearNum = bYear ? parseInt(bYear.replace("'", "")) + 2000 : new Date().getFullYear();

                        if (aYearNum !== bYearNum) return aYearNum - bYearNum;

                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return months.indexOf(aMonth) - months.indexOf(bMonth);
                    });

                    const growthStats = sortedData.map((item, index) => {
                        if (index === 0) return { month: item.month, growth: 0 };

                        const prevValue = sortedData[index - 1].value;
                        const currentValue = item.value;

                        let growthRate = 0;
                        if (prevValue > 0) {
                            growthRate = ((currentValue - prevValue) / prevValue) * 100;
                        } else if (currentValue > 0) {
                            // When previous value is 0 and current is positive,
                            // we can't calculate a percentage (would be infinity)
                            // So we set it to a high but meaningful value (e.g., 100%)
                            growthRate = 100; // New revenue (100% growth)
                        }

                        return {
                            month: item.month,
                            growth: parseFloat(growthRate.toFixed(2))
                        };
                    });

                    setGrowthData(growthStats);
                } else {
                    setGrowthData([]);
                }
            } else {
                // Handle empty or error response
                console.error('Empty or error response from revenue statistics:', response);
                setRevenueData([]);
                setCurrentMonth({ month: getCurrentMonthString(), value: 0, permits: 0, citations: 0, metered: 0 });
                setPieData([{ name: 'No Revenue', value: 1 }]);
                setGrowthData([]);
            }
        } catch (error) {
            console.error('Error fetching revenue statistics:', error);
            // Handle error state
            setRevenueData([]);
            setCurrentMonth({ month: getCurrentMonthString(), value: 0, permits: 0, citations: 0, metered: 0 });
            setPieData([{ name: 'No Revenue', value: 1 }]);
            setGrowthData([]);
        } finally {
            setIsRevenueLoading(false);
        }
    };

    // Helper function to get current month string format
    const getCurrentMonthString = () => {
        const now = new Date();
        const month = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(now);
        const year = now.getFullYear().toString().slice(-2);
        return `${month} '${year}`;
    };

    // Fetch active permits count
    const fetchActivePermitsCount = async () => {
        setIsPermitsCountLoading(true);
        setPermitsCountError('');

        try {
            const result = await PermitService.getActiveCount();

            if (result.success) {
                setActivePermitsCount(result.count);
            } else {
                setPermitsCountError(result.error || 'Failed to fetch active permits count');
            }
        } catch (err) {
            console.error('Error fetching active permits count:', err);
            setPermitsCountError('An unexpected error occurred while fetching active permits count');
        } finally {
            setIsPermitsCountLoading(false);
        }
    };

    // Fetch active reservations count
    const fetchActiveReservationsCount = async () => {
        setIsReservationsCountLoading(true);
        setReservationsCountError('');

        try {
            const result = await AdminService.getActiveReservationsCount();

            if (result.success) {
                setActiveReservationsCount(result.count);
            } else {
                setReservationsCountError(result.error || 'Failed to fetch active reservations count');
            }
        } catch (err) {
            console.error('Error fetching active reservations count:', err);
            setReservationsCountError('An unexpected error occurred while fetching active reservations count');
        } finally {
            setIsReservationsCountLoading(false);
        }
    };

    // Add function to fetch contact submissions count
    const fetchContactSubmissionsCount = async () => {
        setIsContactSubmissionsCountLoading(true);
        setContactSubmissionsCountError('');

        try {
            const result = await AdminService.getContactSubmissionCounts();
            if (result.success) {
                setContactSubmissionsCount(result.data.counts.total || 0);
            } else {
                setContactSubmissionsCountError(result.error || 'Failed to fetch contact submissions count');
                console.error('Error fetching contact submissions count:', result.error);
            }
        } catch (error) {
            setContactSubmissionsCountError('An unexpected error occurred');
            console.error('Unexpected error fetching contact submissions count:', error);
        } finally {
            setIsContactSubmissionsCountLoading(false);
        }
    };

    if (!isAuthenticated) {
        navigate('/');
    }

    const COLORS = ['#4CAF50', '#F44336', '#2196F3', '#FF9800'];

    const revenue = revenueData.length > 0 ? revenueData[revenueData.length - 1].value : 0;
    const prevRevenue = revenueData.length > 1 ? revenueData[revenueData.length - 2].value : 0;

    // Fix for Infinity% issue - handle the case when previous revenue is 0
    let revenueChange;
    if (prevRevenue === 0) {
        revenueChange = revenue > 0 ? 'N/A' : '0.0';
    } else {
        revenueChange = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
    }

    const revenueIncreased = revenue > prevRevenue;

    // Calculate total revenue for the year
    const yearlyTotal = revenueData.reduce((sum, month) => sum + month.value, 0);

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Handle approving a user
    const handleApproveUser = async (userId) => {
        setIsLoading(true);

        try {
            const result = await AdminService.approveUser(userId);

            if (result.success) {
                // Remove the approved user from the pending list
                setPendingUsers(pendingUsers.filter(user => user._id !== userId));

                // Show a success notification
                setNotificationMessage(`User approved successfully: ${result.data.user.firstName} ${result.data.user.lastName}`);
                setNotificationType('success');
                setShowNotification(true);

                // Hide notification after 3 seconds
                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);
            } else {
                // Show error notification
                setNotificationMessage(result.error || 'Failed to approve user');
                setNotificationType('error');
                setShowNotification(true);

                setTimeout(() => {
                    setShowNotification(false);
                }, 3000);
            }
        } catch (err) {
            console.error('Error approving user:', err);
            setNotificationMessage('An unexpected error occurred');
            setNotificationType('error');
            setShowNotification(true);

            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle denying a user
    const handleDenyUser = async (userId) => {
        // For now, we'll just update our local state since the API endpoint
        // for denying users isn't implemented yet

        // Find the user to deny
        const userToDeny = pendingUsers.find(user => user._id === userId);

        if (userToDeny) {
            // Remove the user from the pending list
            setPendingUsers(pendingUsers.filter(user => user._id !== userId));

            // Show an error notification
            setNotificationMessage(`Denied ${userToDeny.firstName} ${userToDeny.lastName} (${userToDeny.email})`);
            setNotificationType('error');
            setShowNotification(true);

            // Hide notification after 3 seconds
            setTimeout(() => {
                setShowNotification(false);
            }, 3000);
        }
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label, darkMode }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'} p-3 shadow-md rounded border`}>
                    <p className="font-medium text-sm">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Add function to navigate to Manage Users page
    const goToManageUsers = () => {
        navigate('/manage-users');
    };

    // Add function to navigate to Manage Permits page
    const goToManagePermits = () => {
        navigate('/manage-permits');
    };

    // Add function to navigate to Manage Lots page
    const goToManageLots = () => {
        navigate('/manage-lots');
    };

    // Add function to navigate to Manage Reservations page
    const goToManageReservations = () => {
        navigate('/admin/reservations');
    };

    // Add function to navigate to Manage Tickets page
    const goToManageTickets = () => {
        navigate('/admin/tickets');
    };

    // Add function to navigate to Manage Contact Submissions page
    const goToManageContactSubmissions = () => {
        navigate('/contact-submissions');
    };

    // Add function to handle manual refresh
    const handleManualRefresh = async () => {
        setNotificationMessage('Refreshing data...');
        setNotificationType('success');
        setShowNotification(true);

        try {
            // This is now the only way revenue statistics are updated
            await fetchRevenueStats();
            await fetchActivePermitsCount();
            await fetchActiveReservationsCount();

            setNotificationMessage('Data refreshed successfully');
            setNotificationType('success');
        } catch (error) {
            console.error('Error refreshing data:', error);
            setNotificationMessage('Failed to refresh data');
            setNotificationType('error');
        }

        // Hide notification after 3 seconds
        setTimeout(() => {
            setShowNotification(false);
        }, 3000);
    };

    // Handle PDF report generation
    const handleGeneratePdfReport = async () => {
        try {
            setIsPdfGenerating(true);
            setReportError('');
            const months = document.getElementById('pdfMonths')?.value || 12;
            const result = await AdminService.downloadRevenueReportPDF(months);

            if (!result.success) {
                setReportError(result.error || 'Failed to generate PDF report');
                setShowNotification(true);
                setNotificationMessage(result.error || 'Failed to generate PDF report');
                setNotificationType('error');
            }
        } catch (error) {
            console.error('Error generating PDF report:', error);
            setReportError('Error generating PDF report');
            setShowNotification(true);
            setNotificationMessage('Error generating PDF report');
            setNotificationType('error');
        } finally {
            setIsPdfGenerating(false);
        }
    };

    // Handle CSV report generation
    const handleGenerateCsvReport = async () => {
        try {
            setIsCsvGenerating(true);
            setReportError('');
            const months = document.getElementById('csvMonths')?.value || 12;
            const result = await AdminService.downloadRevenueReportCSV(months);

            if (!result.success) {
                setReportError(result.error || 'Failed to generate CSV report');
                setShowNotification(true);
                setNotificationMessage(result.error || 'Failed to generate CSV report');
                setNotificationType('error');
            }
        } catch (error) {
            console.error('Error generating CSV report:', error);
            setReportError('Error generating CSV report');
            setShowNotification(true);
            setNotificationMessage('Error generating CSV report');
            setNotificationType('error');
        } finally {
            setIsCsvGenerating(false);
        }
    };

    // Display the users count card with loading and error states
    const UserCountCard = ({ count, isLoading, error, darkMode, onClick }) => {
        return (
            <div
                onClick={onClick}
                className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer 
                          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Users</p>
                        {isLoading ? (
                            <p className="text-2xl font-bold mt-1">
                                <span className="inline-block animate-pulse">...</span>
                            </p>
                        ) : error ? (
                            <p className="text-sm text-red-500 mt-1">Error loading count</p>
                        ) : (
                            <p className="text-2xl font-bold mt-1">{count}</p>
                        )}
                        <p className="text-xs text-blue-600 mt-1">Click to view all users</p>
                    </div>
                    <div className={`rounded-full p-2 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                        <FaUsers className="h-5 w-5 text-blue-500" />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Admin Dashboard</h1>

            {/* Notification Toast */}
            {showNotification && (
                <div className={`fixed top-20 right-4 px-4 py-3 rounded z-50 shadow-md flex items-center ${notificationType === 'success'
                    ? 'bg-green-100 border border-green-400 text-green-700'
                    : notificationType === 'info'
                        ? 'bg-blue-100 border border-blue-400 text-blue-700'
                        : 'bg-red-100 border border-red-400 text-red-700'
                    }`}>
                    {notificationType === 'success' ? (
                        <FaCheckCircle className="mr-2" />
                    ) : notificationType === 'info' ? (
                        <FaInfoCircle className="mr-2" />
                    ) : (
                        <FaTimesCircle className="mr-2" />
                    )}
                    <span>{notificationMessage}</span>
                    <button className="ml-4" onClick={() => setShowNotification(false)}>
                        <FaTimesCircle />
                    </button>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <UserCountCard count={usersCount} isLoading={isCountLoading} error={countError} darkMode={darkMode} onClick={goToManageUsers} />
                <div className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow
                               ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Revenue (Current Month)</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(revenue)}</p>
                            <div className={`flex items-center mt-1 text-xs font-medium ${revenueIncreased ? 'text-green-600' : 'text-red-600'}`}>
                                <span>
                                    {revenueIncreased ? '↑' : '↓'}
                                    {typeof revenueChange === 'string' && revenueChange === 'N/A'
                                        ? 'N/A'
                                        : `${revenueChange}%`}
                                </span>
                                <span className={`ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>vs last month</span>
                            </div>
                        </div>
                        <div className={`rounded-full p-2 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManagePermits}
                    className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer
                              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Permits</p>
                            {isPermitsCountLoading ? (
                                <p className="text-2xl font-bold mt-1">
                                    <span className="inline-block animate-pulse">...</span>
                                </p>
                            ) : permitsCountError ? (
                                <p className="text-sm text-red-500 mt-1">Error loading count</p>
                            ) : (
                                <p className="text-2xl font-bold mt-1">{activePermitsCount}</p>
                            )}
                            <p className="text-xs text-blue-600 mt-1">Click to manage permits</p>
                        </div>
                        <div className={`rounded-full p-2 ${darkMode ? 'bg-green-900' : 'bg-green-100'}`}>
                            <FaTicketAlt className="h-5 w-5 text-green-500" />
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManageLots}
                    className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer
                              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                    id="manage lots"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Lots</p>
                            {isLotsCountLoading ? (
                                <p className="text-2xl font-bold mt-1">
                                    <span className="inline-block animate-pulse">...</span>
                                </p>
                            ) : lotsCountError ? (
                                <p className="text-sm text-red-500 mt-1">Error loading count</p>
                            ) : (
                                <p className="text-2xl font-bold mt-1">{lotsCount}</p>
                            )}
                            <p className="text-xs text-blue-600 mt-1">Click to manage lots</p>
                        </div>
                        <div className={`rounded-full p-2 ${darkMode ? 'bg-red-900' : 'bg-red-50'}`}>
                            <FaMapMarkerAlt className="h-5 w-5 text-red-500" />
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManageReservations}
                    className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer
                              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Reservations</p>
                            {isReservationsCountLoading ? (
                                <p className="text-2xl font-bold mt-1">
                                    <span className="inline-block animate-pulse">...</span>
                                </p>
                            ) : reservationsCountError ? (
                                <p className="text-sm text-red-500 mt-1">Error loading count</p>
                            ) : (
                                <p className="text-2xl font-bold mt-1">{activeReservationsCount}</p>
                            )}
                            <p className="text-xs text-blue-600 mt-1">Click to manage reservations</p>
                        </div>
                        <div className={`rounded-full p-2 ${darkMode ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
                            <FaCar className="h-5 w-5 text-yellow-500" />
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManageTickets}
                    className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer
                              ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Manage Fines</p>
                            <p className="text-2xl font-bold mt-1">Fines</p>
                            <p className="text-xs text-blue-600 mt-1">Click to manage fines</p>
                        </div>
                        <div className={`rounded-full p-2 ${darkMode ? 'bg-yellow-900' : 'bg-yellow-50'}`}>
                            <FaTicketAlt className="h-5 w-5 text-yellow-500" />
                        </div>
                    </div>
                </div>
                <div
                    className={`p-6 shadow-sm rounded-lg border hover:shadow-md transition-shadow cursor-pointer
                               ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                    onClick={goToManageContactSubmissions}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contact Submissions</p>
                            {isContactSubmissionsCountLoading ? (
                                <div className="mt-1 h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                            ) : contactSubmissionsCountError ? (
                                <p className="text-2xl font-bold mt-1 text-red-500">Error</p>
                            ) : (
                                <p className="text-2xl font-bold mt-1">{contactSubmissionsCount}</p>
                            )}
                        </div>
                        <div className={`p-3 rounded-full ${darkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
                            <FaEnvelope className={`h-5 w-5 ${darkMode ? 'text-indigo-200' : 'text-indigo-600'}`} />
                        </div>
                    </div>
                    <div className="mt-2">
                        <p className={`text-sm ${darkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
                            Click to manage form submissions
                        </p>
                    </div>
                </div>
            </div>

            {/* Revenue Overview */}
            <div className={`mt-6 p-6 shadow-sm rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Revenue Overview</h2>
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Year Total: <span className={darkMode ? 'text-white' : 'text-gray-900'}>{formatCurrency(yearlyTotal)}</span>
                    </div>
                </div>

                {/* Revenue Dashboard */}
                <section className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Revenue Overview</h2>
                        <button
                            onClick={handleManualRefresh}
                            className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                                } transition-colors`}
                            title="Refresh revenue data"
                        >
                            <FaSync className={`${isRevenueLoading ? 'animate-spin' : ''} text-green-600`} />
                        </button>
                    </div>

                    {isRevenueLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
                        </div>
                    ) : revenueError ? (
                        <div className="text-center text-red-500 h-64 flex items-center justify-center">
                            <div>
                                <FaExclamationCircle className="mx-auto mb-2 text-3xl" />
                                <p>{revenueError}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {/* Revenue Charts and Analytics */}
                            <div>
                                {revenueData.length === 0 ? (
                                    <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaInfoCircle className="mx-auto mb-2 text-3xl" />
                                        <p>No revenue data available yet.</p>
                                        <p className="text-sm mt-2">Revenue data will appear here as permits are purchased and citations are paid.</p>
                                    </div>
                                ) : (
                                    <div>
                                        {/* Monthly Revenue Overview */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                                            <div className="lg:col-span-2">
                                                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Monthly Revenue Breakdown</h3>
                                                <div className="h-80">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#DDDDDD'} />
                                                            <XAxis dataKey="month" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                            <YAxis tickFormatter={(value) => `$${value / 1000}k`} tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                            <Tooltip
                                                                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                                                contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', borderColor: darkMode ? '#374151' : '#DDD', color: darkMode ? '#FFF' : '#000' }}
                                                            />
                                                            <Legend />
                                                            <Bar name="Total Revenue" dataKey="value" fill="#F59E0B" />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Current Month Breakdown */}
                                            <div>
                                                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Current Month Breakdown</h3>
                                                <div className="h-80 flex flex-col items-center justify-center">
                                                    <ResponsiveContainer width="100%" height="80%">
                                                        <PieChart>
                                                            <Pie
                                                                data={pieData}
                                                                cx="50%"
                                                                cy="50%"
                                                                labelLine={false}
                                                                outerRadius={80}
                                                                fill="#8884d8"
                                                                dataKey="value"
                                                                nameKey="name"
                                                                label={({ name, percent }) => {
                                                                    const percentValue = percent * 100;
                                                                    // Always use 1 decimal place for consistency with the table
                                                                    return `${name}: ${percentValue.toFixed(1)}%`;
                                                                }}
                                                            >
                                                                {pieData.map((entry, index) => (
                                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value) => `$${value.toLocaleString()}`}
                                                                contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', borderColor: darkMode ? '#374151' : '#DDD' }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className={`text-center mt-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                                        <span className="font-semibold">Total: </span>
                                                        {formatCurrency(currentMonth.value || 0)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Growth Trends and Monthly Revenue */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                            {/* Growth Trend */}
                                            <div>
                                                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Growth Trend</h3>
                                                <div className="h-72">
                                                    {growthData.length > 1 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={growthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#DDDDDD'} />
                                                                <XAxis dataKey="month" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                                <YAxis tickFormatter={(value) => `${value}%`} tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                                <Tooltip
                                                                    formatter={(value) => [`${value}%`, 'Growth']}
                                                                    contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', borderColor: darkMode ? '#374151' : '#DDD' }}
                                                                />
                                                                <Line type="monotone" dataKey="growth" stroke="#10B981" strokeWidth={2} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className={`flex items-center justify-center h-full text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            <p>Not enough data to display growth trends.<br />More data points are needed.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Total Revenue Trend */}
                                            <div>
                                                <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Total Revenue Trend</h3>
                                                <div className="h-72">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#DDDDDD'} />
                                                            <XAxis dataKey="month" tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                            <YAxis tickFormatter={(value) => `$${value / 1000}k`} tick={{ fill: darkMode ? '#D1D5DB' : '#6B7280' }} />
                                                            <Tooltip
                                                                formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                                                contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFF', borderColor: darkMode ? '#374151' : '#DDD' }}
                                                            />
                                                            <Area type="monotone" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Re-add the detailed revenue breakdown as a separate section */}
                {!isRevenueLoading && !revenueError && revenueData.length > 0 && (
                    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6 mb-6`}>
                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Detailed Revenue Breakdown</h3>

                        <div className="mb-6">
                            <div className="overflow-x-auto">
                                <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                    <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                        <tr>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                                Revenue Source
                                            </th>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                                Amount
                                            </th>
                                            <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-300 uppercase tracking-wider' : 'text-gray-500 uppercase tracking-wider'}`}>
                                                Percentage
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                        <tr>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Parking Permits
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {formatCurrency(currentMonth.permits || 0)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {currentMonth.value ? ((currentMonth.permits / currentMonth.value) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Citations
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {formatCurrency(currentMonth.citations || 0)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {currentMonth.value ? ((currentMonth.citations / currentMonth.value) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Metered Parking
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {formatCurrency(currentMonth.metered || 0)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {currentMonth.value ? ((currentMonth.metered / currentMonth.value) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Other Revenue
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {formatCurrency(currentMonth.other || 0)}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                                                {currentMonth.value ? ((currentMonth.other / currentMonth.value) * 100).toFixed(1) : 0}%
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Year-to-Date Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(yearlyTotal)}</p>
                            </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monthly Average</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(revenueData.length > 0 ? yearlyTotal / revenueData.length : 0)}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Highest Month</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {revenueData.length > 0
                                        ? formatCurrency(Math.max(...revenueData.map(item => item.value)))
                                        : '$0'}
                                </p>
                            </div>
                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Overall Growth</p>
                                <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {revenueData.length > 1 ? (
                                        revenueData[0].value === 0 ? (
                                            revenueData[revenueData.length - 1].value > 0 ? 'New Revenue' : '0.0%'
                                        ) : (
                                            `${(((revenueData[revenueData.length - 1].value - revenueData[0].value) / revenueData[0].value) * 100).toFixed(1)}%`
                                        )
                                    ) : 'N/A'}
                                </p>
                            </div>
                        </div>

                        {/* Reports section */}
                        <h3 className={`text-lg font-semibold mt-6 mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Generate Reports</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>PDF Report</h4>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Generate a detailed PDF report with revenue statistics</p>
                                    </div>
                                    <div className={`rounded-full p-2 ${darkMode ? 'bg-red-900' : 'bg-red-50'}`}>
                                        <FaFileAlt className="h-5 w-5 text-red-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center">
                                        <label htmlFor="pdfMonths" className={`mr-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Months:</label>
                                        <select
                                            id="pdfMonths"
                                            className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'} border`}
                                            defaultValue="12"
                                        >
                                            <option value="3">3 months</option>
                                            <option value="6">6 months</option>
                                            <option value="12">12 months</option>
                                            <option value="24">24 months</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleGeneratePdfReport}
                                        className={`w-full px-4 py-2 rounded-lg flex items-center justify-center
                                            ${darkMode
                                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                                : 'bg-red-600 hover:bg-red-700 text-white'}`}
                                        disabled={isPdfGenerating}
                                    >
                                        {isPdfGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                                                Generating PDF...
                                            </>
                                        ) : (
                                            <>
                                                <FaFileDownload className="mr-2" />
                                                Download PDF Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h4 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>CSV Report</h4>
                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Export revenue data as CSV for spreadsheet analysis</p>
                                    </div>
                                    <div className={`rounded-full p-2 ${darkMode ? 'bg-green-900' : 'bg-green-50'}`}>
                                        <FaFileAlt className="h-5 w-5 text-green-500" />
                                    </div>
                                </div>
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center">
                                        <label htmlFor="csvMonths" className={`mr-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Months:</label>
                                        <select
                                            id="csvMonths"
                                            className={`px-2 py-1 rounded ${darkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'} border`}
                                            defaultValue="12"
                                        >
                                            <option value="3">3 months</option>
                                            <option value="6">6 months</option>
                                            <option value="12">12 months</option>
                                            <option value="24">24 months</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={handleGenerateCsvReport}
                                        className={`w-full px-4 py-2 rounded-lg flex items-center justify-center
                                            ${darkMode
                                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                                : 'bg-green-600 hover:bg-green-700 text-white'}`}
                                        disabled={isCsvGenerating}
                                    >
                                        {isCsvGenerating ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white mr-2"></div>
                                                Generating CSV...
                                            </>
                                        ) : (
                                            <>
                                                <FaFileDownload className="mr-2" />
                                                Download CSV Report
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pending Approvals */}
            <div className={`mt-6 p-6 shadow-sm rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Pending Approvals</h2>
                </div>
                <div className="p-6">
                    {error && (
                        <div className={`p-3 mb-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
                            <p className="flex items-center">
                                <FaExclamationCircle className="mr-2 flex-shrink-0" />
                                {error}
                            </p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
                        </div>
                    ) : pendingUsers.length === 0 ? (
                        <div className={`py-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p>No pending approvals at this time</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                <thead className={darkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                                    <tr>
                                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Name</th>
                                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Email</th>
                                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Action</th>
                                    </tr>
                                </thead>
                                <tbody className={`${darkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                                    {pendingUsers.map((user) => (
                                        <tr key={user._id} className={darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.firstName} {user.lastName}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap ${darkMode ? 'text-white' : 'text-gray-900'}`}>{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex">
                                                    <button
                                                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium mr-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => handleApproveUser(user._id)}
                                                        disabled={isLoading}
                                                    >
                                                        {isLoading ? 'Processing...' : 'Approve'}
                                                    </button>
                                                    <button
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => handleDenyUser(user._id)}
                                                        disabled={isLoading}
                                                    >
                                                        Deny
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard; 