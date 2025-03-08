import React from "react";
import { useNavigate } from "react-router";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { FaUsers, FaUserCog, FaParking, FaMapMarkerAlt } from 'react-icons/fa';
import { mockUsers } from '../../utils/mockUserData';
import { getActivePermitsCount, getLotsWithActivePermitsCount } from '../../utils/mockPermitData';

const AdminDashboard = ({ isAuthenticated }) => {
    const navigate = useNavigate();

    if (!isAuthenticated) {
        navigate('/');
    }

    // Get counts from mock data
    const activePermitsCount = getActivePermitsCount();
    const lotsWithPermitsCount = getLotsWithActivePermitsCount();

    const revenueData = [
        { month: "Jan", value: 38186, permits: 28500, citations: 6450, other: 3236 },
        { month: "Feb", value: 40250, permits: 29250, citations: 7800, other: 3200 },
        { month: "Mar", value: 41525, permits: 30000, citations: 8125, other: 3400 },
        { month: "Apr", value: 42330, permits: 31500, citations: 7180, other: 3650 },
    ];

    // Data for line chart showing growth trend
    const growthData = revenueData.map((item, index) => {
        const prevMonth = index > 0 ? revenueData[index - 1].value : revenueData[0].value;
        const growthPercentage = ((item.value - prevMonth) / prevMonth) * 100;

        return {
            month: item.month,
            growth: index === 0 ? 0 : parseFloat(growthPercentage.toFixed(2))
        };
    });

    // Data for pie chart
    const currentMonth = revenueData[revenueData.length - 1];
    const pieData = [
        { name: 'Permits', value: currentMonth.permits },
        { name: 'Citations', value: currentMonth.citations },
        { name: 'Other', value: currentMonth.other },
    ];

    const COLORS = ['#4CAF50', '#F44336', '#2196F3'];

    const pendingUsers = [
        { name: "John Doe", email: "john@example.com", userType: "Student" },
        { name: "Jane Smith", email: "jane@example.com", userType: "Faculty" },
        { name: "Alice Johnson", email: "alice@example.com", userType: "Faculty" },
    ];

    const revenue = revenueData[revenueData.length - 1].value;
    const prevRevenue = revenueData[revenueData.length - 2].value;
    const revenueChange = ((revenue - prevRevenue) / prevRevenue * 100).toFixed(1);
    const revenueIncreased = revenue > prevRevenue;

    // Calculate percentages for text-based breakdown
    const permitPercentage = Math.round((currentMonth.permits / currentMonth.value) * 100);
    const citationPercentage = Math.round((currentMonth.citations / currentMonth.value) * 100);
    const otherPercentage = Math.round((currentMonth.other / currentMonth.value) * 100);

    // Calculate total revenue for the year
    const yearlyTotal = revenueData.reduce((sum, month) => sum + month.value, 0);

    const getStatusClass = (status) => {
        switch (status.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 border border-green-200";
            case "inactive":
                return "bg-gray-100 text-gray-800 border border-gray-200";
            case "pending":
                return "bg-yellow-100 text-yellow-800 border border-yellow-200";
            case "paid":
                return "bg-green-100 text-green-800 border border-green-200";
            case "unpaid":
                return "bg-red-100 text-red-800 border border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border border-gray-200";
        }
    };

    // Format currency
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 shadow-md rounded border border-gray-200">
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

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div
                    onClick={goToManageUsers}
                    className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Users</p>
                            <p className="text-2xl font-bold mt-1">{mockUsers.length}</p>
                            <p className="text-xs text-blue-600 mt-1">Click to view all users</p>
                        </div>
                        <div className="bg-blue-50 rounded-full p-2">
                            <FaUsers className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Revenue (Current Month)</p>
                            <p className="text-2xl font-bold mt-1">{formatCurrency(revenue)}</p>
                            <div className={`flex items-center mt-1 text-xs font-medium ${revenueIncreased ? 'text-green-600' : 'text-red-600'}`}>
                                <span>{revenueIncreased ? '↑' : '↓'} {revenueChange}%</span>
                                <span className="ml-1 text-gray-500">vs last month</span>
                            </div>
                        </div>
                        <div className="bg-blue-50 rounded-full p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManagePermits}
                    className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Active Permits</p>
                            <p className="text-2xl font-bold mt-1">{activePermitsCount}</p>
                            <p className="text-xs text-blue-600 mt-1">Click to manage permits</p>
                        </div>
                        <div className="bg-green-50 rounded-full p-2">
                            <FaParking className="h-5 w-5 text-green-500" />
                        </div>
                    </div>
                </div>
                <div
                    onClick={goToManageLots}
                    className="bg-white p-6 shadow-sm rounded-lg border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-600 text-sm font-medium">Total Lots</p>
                            <p className="text-2xl font-bold mt-1">{lotsWithPermitsCount}</p>
                            <p className="text-xs text-blue-600 mt-1">Click to manage lots</p>
                        </div>
                        <div className="bg-red-50 rounded-full p-2">
                            <FaMapMarkerAlt className="h-5 w-5 text-red-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue Overview */}
            <div className="mt-6 bg-white p-6 shadow-sm rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">Revenue Overview</h2>
                    <div className="text-sm font-medium text-gray-500">
                        Year Total: <span className="text-gray-900">{formatCurrency(yearlyTotal)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Stacked Bar Chart */}
                    <div className="p-4 border border-gray-100 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Monthly Revenue Breakdown</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={revenueData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="permits" stackId="a" fill="#4CAF50" name="Permits" />
                                    <Bar dataKey="citations" stackId="a" fill="#F44336" name="Citations" />
                                    <Bar dataKey="other" stackId="a" fill="#2196F3" name="Other" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div className="p-4 border border-gray-100 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Current Month Breakdown</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Line Chart for Growth Trend */}
                    <div className="p-4 border border-gray-100 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Month-over-Month Growth</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={growthData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `${value}%`} />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="growth"
                                        stroke="#8884d8"
                                        name="Revenue Growth"
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Area Chart for Total Revenue Trend */}
                    <div className="p-4 border border-gray-100 rounded-lg">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Revenue Trend</h3>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={revenueData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis tickFormatter={(value) => `$${value / 1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        name="Total Revenue"
                                        stroke="#8884d8"
                                        fill="#8884d8"
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Text-based Revenue Breakdown */}
                <div className="mt-4 p-4 border border-gray-100 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-600 mb-3">Detailed Revenue Breakdown (Current Month: {currentMonth.month})</h3>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue Source</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded bg-green-500 mr-2"></div>
                                            <span>Parking Permits</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(currentMonth.permits)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{permitPercentage}%</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded bg-red-500 mr-2"></div>
                                            <span>Citations</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(currentMonth.citations)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{citationPercentage}%</td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded bg-blue-500 mr-2"></div>
                                            <span>Other Revenue</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(currentMonth.other)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{otherPercentage}%</td>
                                </tr>
                                <tr className="bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-bold">Total Revenue</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold">{formatCurrency(currentMonth.value)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-bold">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Year-to-Date Summary */}
                    <div className="mt-6">
                        <h3 className="text-sm font-medium text-gray-600 mb-3">Year-to-Date Summary</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Total Revenue (YTD):</span>
                                        <span className="font-bold">{formatCurrency(yearlyTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Monthly Average:</span>
                                        <span className="font-bold">{formatCurrency(yearlyTotal / revenueData.length)}</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Highest Month:</span>
                                        <span className="font-bold">{formatCurrency(Math.max(...revenueData.map(d => d.value)))}</span>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-600">Overall Growth:</span>
                                        <span className={`font-bold ${revenueData[revenueData.length - 1].value > revenueData[0].value ? 'text-green-600' : 'text-red-600'}`}>
                                            {(((revenueData[revenueData.length - 1].value - revenueData[0].value) / revenueData[0].value) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pending Approvals */}
            <div className="mt-6 bg-white p-6 shadow-sm rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Pending Approvals</h2>
                    <button
                        onClick={goToManageUsers}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                        <FaUserCog className="mr-2" />
                        Manage Users
                    </button>
                </div>
                {pendingUsers.length === 0 ? (
                    <p className="text-gray-500">There are no pending approvals.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Type</th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pendingUsers.map((user, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass("pending")}`}>
                                                {user.userType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium mr-2">
                                                Approve
                                            </button>
                                            <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium">
                                                Deny
                                            </button>
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

export default AdminDashboard; 