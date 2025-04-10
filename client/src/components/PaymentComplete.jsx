// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 
// Thus, We can properly credit ChatGPT with the final version for this code file. 

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Component to handle payment redirects and display payment status
 * Used for handling payment completion redirects from Stripe
 * 
 * This component:
 * 1. Extracts query parameters from URL (payment_intent, redirect_status)
 * 2. Displays appropriate success or processing message
 * 3. Provides navigation back to the dashboard
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.darkMode - Whether dark mode is enabled
 */
const PaymentComplete = ({ darkMode }) => {
    const navigate = useNavigate();

    // Extract query parameters from URL
    const params = new URLSearchParams(window.location.search);
    const paymentIntentId = params.get('payment_intent');
    const redirectStatus = params.get('redirect_status');

    // Log payment status for debugging
    useEffect(() => {
        console.log('Payment Complete - Status:', redirectStatus);
        console.log('Payment Intent ID:', paymentIntentId);
    }, [paymentIntentId, redirectStatus]);

    const handleDashboardClick = () => {
        navigate('/dashboard');
    };

    return (
        <div className="w-full max-w-6xl mx-auto px-4 py-8">
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h1 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {redirectStatus === 'succeeded' ? 'Payment Successful!' : 'Payment Processing'}
                </h1>
                <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {redirectStatus === 'succeeded'
                        ? 'Your payment has been processed successfully. Your reservation is confirmed.'
                        : 'Your payment is being processed. You will receive a confirmation soon.'}
                </p>
                {paymentIntentId && (
                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Payment reference: {paymentIntentId}
                    </p>
                )}
                <div className="mt-6">
                    <button
                        onClick={handleDashboardClick}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentComplete; 