import { useState, useEffect } from 'react';
import { AuthService } from '../utils/api';

const InactivityTimer = ({ darkMode, isAuthenticated, onLogout, inactivityTimeout = 1800000 }) => {
    const [showWarning, setShowWarning] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(60);
    const warningTime = 60000; // Show warning 60 seconds before logout

    useEffect(() => {
        if (!isAuthenticated) return;

        let inactivityTimer;
        let warningTimer;
        let countdownTimer;

        const resetTimers = () => {
            clearTimeout(inactivityTimer);
            clearTimeout(warningTimer);
            clearInterval(countdownTimer);
            setShowWarning(false);

            // Set timer for warning before timeout
            warningTimer = setTimeout(() => {
                setShowWarning(true);
                setSecondsRemaining(60);

                // Start countdown timer
                countdownTimer = setInterval(() => {
                    setSecondsRemaining(prev => {
                        if (prev <= 1) {
                            clearInterval(countdownTimer);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }, inactivityTimeout - warningTime);

            // Set timer for actual logout
            inactivityTimer = setTimeout(() => {
                // Handle session timeout and logout
                AuthService.sessionTimeout().then(() => {
                    if (onLogout) onLogout();
                });
            }, inactivityTimeout);
        };

        // Reset timers on initial render
        resetTimers();

        // Only detect mousedown (mouse press) events for user activity
        const handleUserActivity = () => {
            resetTimers();
        };

        // Add only mousedown event listener
        document.addEventListener('mousedown', handleUserActivity);

        // Cleanup
        return () => {
            clearTimeout(inactivityTimer);
            clearTimeout(warningTimer);
            clearInterval(countdownTimer);

            document.removeEventListener('mousedown', handleUserActivity);
        };
    }, [isAuthenticated, inactivityTimeout, onLogout]);

    // Handle stay logged in action
    const handleStayLoggedIn = () => {
        setShowWarning(false);
    };

    // Handle logout now action
    const handleLogoutNow = () => {
        AuthService.sessionTimeout().then(() => {
            if (onLogout) onLogout();
        });
    };

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
            <div className={`max-w-md w-full rounded-xl shadow-2xl p-6 backdrop-blur-sm ${darkMode
                ? 'bg-gray-900/90 text-white border border-gray-700'
                : 'bg-white/90 text-gray-900 border border-gray-200'
                }`}>
                <div className="flex flex-col">
                    <h3 className="text-xl font-bold mb-3">Session Timeout Warning</h3>
                    <div className={`w-full h-1 mb-4 rounded-full overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                            className="h-full bg-red-600 transition-all duration-1000 ease-linear"
                            style={{ width: `${(secondsRemaining / 60) * 100}%` }}
                        ></div>
                    </div>
                    <p className="mb-5">
                        Your session is about to expire due to inactivity. You will be logged out in <span className="font-bold text-red-500">{secondsRemaining}</span> seconds.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={handleLogoutNow}
                            className={`px-5 py-2.5 rounded-lg font-medium transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 ${darkMode
                                ? 'bg-transparent text-white border border-red-600 hover:bg-red-600/20'
                                : 'bg-transparent text-red-600 border border-red-600 hover:bg-red-50'
                                }`}
                        >
                            Logout Now
                        </button>
                        <button
                            onClick={handleStayLoggedIn}
                            className="px-5 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        >
                            Stay Logged In
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InactivityTimer; 