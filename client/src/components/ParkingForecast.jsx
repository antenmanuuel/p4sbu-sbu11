import React, { useState, useEffect } from 'react';
import { FaChartLine, FaInfoCircle, FaCalendarAlt } from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ParkingForecast = ({ darkMode, lot }) => {
    // Sample forecast data structure (in a real app, this would come from the backend)
    const [forecastData, setForecastData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDay, setSelectedDay] = useState('Monday'); // Default to Monday

    // Helper function to convert to 12-hour format
    const format12HourTime = (hour) => {
        const hourNum = parseInt(hour, 10);
        if (isNaN(hourNum)) return "12 PM";

        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12; // Convert 0 to 12
        return `${hour12} ${period}`;
    };

    // Generate weekly forecast data based on the lot
    useEffect(() => {
        if (!lot) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // In a real application, you would fetch this data from your API
            // This is just a mock implementation to demonstrate the UI

            // Create a forecast for each weekday (Monday to Friday)
            const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
            const weeklyForecast = [];

            // The baseline availability is the current lot availability
            const baseAvailability = lot.availableSpaces / lot.totalSpaces;

            // Generate forecast for each weekday
            for (let dayIdx = 0; dayIdx < weekdays.length; dayIdx++) {
                const dayName = weekdays[dayIdx];

                // Generate hourly time slots from 7AM to 11PM
                const timeSlots = [];
                for (let hour = 7; hour <= 23; hour++) {
                    timeSlots.push(hour);
                }
                const dayForecasts = [];

                for (let i = 0; i < timeSlots.length; i++) {
                    const hour = timeSlots[i];
                    let availabilityPercentage;

                    // Apply different patterns based on day and time
                    if (dayName === 'Monday' || dayName === 'Friday') {
                        // Mondays and Fridays are typically busier
                        if (hour >= 7 && hour < 9) {
                            // Early morning - higher availability
                            availabilityPercentage = baseAvailability * 0.85;
                        } else if (hour >= 9 && hour < 11) {
                            // Morning rush - lower availability
                            availabilityPercentage = baseAvailability * 0.5;
                        } else if (hour >= 11 && hour < 13) {
                            // Lunch rush
                            availabilityPercentage = baseAvailability * 0.4;
                        } else if (hour >= 13 && hour < 15) {
                            // Early afternoon
                            availabilityPercentage = baseAvailability * 0.6;
                        } else if (hour >= 15 && hour < 18) {
                            // Afternoon rush - even lower availability
                            availabilityPercentage = baseAvailability * 0.45;
                        } else if (hour >= 18 && hour < 20) {
                            // Early evening
                            availabilityPercentage = baseAvailability * 0.7;
                        } else if (hour >= 20) {
                            // Late evening - higher availability
                            availabilityPercentage = baseAvailability * 0.9;
                        } else {
                            // Default
                            availabilityPercentage = baseAvailability * 0.7;
                        }
                    } else if (dayName === 'Wednesday') {
                        // Wednesday tends to be less busy
                        if (hour >= 7 && hour < 9) {
                            // Early morning - higher availability
                            availabilityPercentage = baseAvailability * 0.9;
                        } else if (hour >= 9 && hour < 11) {
                            // Morning classes
                            availabilityPercentage = baseAvailability * 0.7;
                        } else if (hour >= 11 && hour < 13) {
                            // Lunch time
                            availabilityPercentage = baseAvailability * 0.6;
                        } else if (hour >= 13 && hour < 15) {
                            // Early afternoon
                            availabilityPercentage = baseAvailability * 0.75;
                        } else if (hour >= 15 && hour < 18) {
                            // Late afternoon
                            availabilityPercentage = baseAvailability * 0.65;
                        } else if (hour >= 18 && hour < 20) {
                            // Early evening
                            availabilityPercentage = baseAvailability * 0.8;
                        } else if (hour >= 20) {
                            // Late evening - higher availability
                            availabilityPercentage = baseAvailability * 0.95;
                        } else {
                            // Default
                            availabilityPercentage = baseAvailability * 0.8;
                        }
                    } else {
                        // Tuesday and Thursday - normal patterns
                        if (hour >= 7 && hour < 9) {
                            // Early morning - higher availability
                            availabilityPercentage = baseAvailability * 0.88;
                        } else if (hour >= 9 && hour < 11) {
                            // Morning classes
                            availabilityPercentage = baseAvailability * 0.6;
                        } else if (hour >= 11 && hour < 13) {
                            // Lunch time
                            availabilityPercentage = baseAvailability * 0.5;
                        } else if (hour >= 13 && hour < 15) {
                            // Early afternoon
                            availabilityPercentage = baseAvailability * 0.7;
                        } else if (hour >= 15 && hour < 18) {
                            // Late afternoon
                            availabilityPercentage = baseAvailability * 0.55;
                        } else if (hour >= 18 && hour < 20) {
                            // Early evening
                            availabilityPercentage = baseAvailability * 0.75;
                        } else if (hour >= 20) {
                            // Late evening - higher availability
                            availabilityPercentage = baseAvailability * 0.92;
                        } else {
                            // Default
                            availabilityPercentage = baseAvailability * 0.75;
                        }
                    }

                    // Make sure the percentage is between 0 and 1
                    availabilityPercentage = Math.max(0, Math.min(1, availabilityPercentage));

                    // Calculate the actual number of spaces
                    const availableSpaces = Math.round(lot.totalSpaces * availabilityPercentage);

                    dayForecasts.push({
                        hour,
                        time: format12HourTime(hour),
                        availableSpaces,
                        totalSpaces: lot.totalSpaces,
                        availabilityPercentage
                    });
                }

                weeklyForecast.push({
                    day: dayName,
                    forecasts: dayForecasts,
                    // Calculate average availability for the day
                    averageAvailability: dayForecasts.reduce((sum, f) => sum + f.availabilityPercentage, 0) / dayForecasts.length
                });
            }

            setForecastData({
                lotId: lot.id,
                weeklyForecast
            });
        } catch (error) {
            console.error('Error generating forecast data:', error);
            setError('Failed to generate availability forecast');
        } finally {
            setIsLoading(false);
        }
    }, [lot]);

    // Helper function to determine the color for availability percentage
    const getAvailabilityColor = (percentage) => {
        if (percentage >= 0.5) {
            return '#22c55e'; // green-500
        } else if (percentage >= 0.25) {
            return '#eab308'; // yellow-500
        } else {
            return '#ef4444'; // red-500
        }
    };

    // Format data for bar chart
    const formatDataForBarChart = (forecastData) => {
        if (!forecastData || !forecastData.weeklyForecast) return [];

        // Convert the forecast data into a format suitable for recharts
        const chartData = [];

        forecastData.weeklyForecast.forEach(day => {
            // Only show data for the selected day
            if (day.day === selectedDay) {
                // Show all hourly data for the selected day
                day.forecasts.forEach(timeSlot => {
                    chartData.push({
                        day: day.day,
                        time: timeSlot.time,
                        availableSpaces: timeSlot.availableSpaces,
                        totalSpaces: timeSlot.totalSpaces,
                        availabilityPercentage: timeSlot.availabilityPercentage,
                        fill: getAvailabilityColor(timeSlot.availabilityPercentage)
                    });
                });
            }
        });

        return chartData;
    };

    if (isLoading) {
        return (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-4 py-1">
                        <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4`}></div>
                        <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded`}></div>
                        <div className={`h-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded w-5/6`}></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-red-900/30' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                <div className="flex items-center text-red-600">
                    <FaInfoCircle className="mr-2" />
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!forecastData) {
        return (
            <div className={`rounded-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
                <div className="flex items-center text-gray-500">
                    <FaInfoCircle className="mr-2" />
                    <p>Unable to generate parking forecast</p>
                </div>
            </div>
        );
    }

    const chartData = formatDataForBarChart(forecastData);

    return (
        <div className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className={`font-bold text-lg mb-1 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    <FaChartLine className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    Parking Forecast
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Projected daily availability based on historical patterns
                </p>
            </div>

            <div className="p-4">
                <div className="mb-6">
                    <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'} mb-4`}>
                        <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Current Availability
                        </p>
                        <p className={`font-bold text-lg ${lot.availableSpaces / lot.totalSpaces >= 0.5 ? 'text-green-500' : lot.availableSpaces / lot.totalSpaces >= 0.25 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {lot.availableSpaces} / {lot.totalSpaces} spaces
                        </p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <div className={`bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'} mr-3`}>
                                <FaCalendarAlt />
                            </div>
                            <div>
                                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedDay} Forecast
                                </p>
                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Select a day to view hourly availability
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Day selector */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {forecastData.weeklyForecast.map((day, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedDay(day.day)}
                                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${selectedDay === day.day
                                    ? `${darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`
                                    : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'} hover:bg-gray-300 dark:hover:bg-gray-600`
                                    }`}
                            >
                                {day.day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bar Chart */}
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 10, bottom: 50 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                            <XAxis
                                dataKey="time"
                                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                                tick={{ fontSize: 10 }}
                                tickLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                                axisLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                                interval={0}
                                angle={30}
                                textAnchor="start"
                                height={60}
                            />
                            <YAxis
                                stroke={darkMode ? '#9ca3af' : '#6b7280'}
                                tick={{ fontSize: 12 }}
                                tickLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                                axisLine={{ stroke: darkMode ? '#4b5563' : '#d1d5db' }}
                                label={{
                                    value: 'Available Spaces',
                                    angle: -90,
                                    position: 'insideLeft',
                                    style: { textAnchor: 'middle', fill: darkMode ? '#9ca3af' : '#6b7280' }
                                }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                                    borderColor: darkMode ? '#374151' : '#e5e7eb',
                                    color: darkMode ? '#f9fafb' : '#111827'
                                }}
                                formatter={(value, name) => {
                                    if (name === 'availableSpaces') {
                                        return [`${value} spaces`, 'Available'];
                                    }
                                    return [value, name];
                                }}
                            />
                            <Legend
                                wrapperStyle={{ bottom: 0 }}
                                formatter={(value) => {
                                    if (value === 'availableSpaces') {
                                        return 'Available Spaces';
                                    }
                                    return value;
                                }}
                            />
                            <Bar
                                dataKey="availableSpaces"
                                name="availableSpaces"
                                fill="#3b82f6"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-6 italic`}>
                    Note: This forecast is based on historical patterns and may vary due to special events, weather conditions, or academic calendar changes.
                </div>
            </div>
        </div>
    );
};

export default ParkingForecast; 