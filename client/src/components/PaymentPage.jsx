// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Students via Pair Programming) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was given context for stripe docs and prompted to take the initial student iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCreditCard, FaUniversity, FaCheckCircle, FaExclamationCircle, FaIdCard, FaTrash } from 'react-icons/fa';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { PaymentMethodService } from '../utils/api';

// Load Stripe outside of component to avoid recreating it on re-renders
// Replace with your publishable key from Stripe dashboard
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// The wrapper component that provides Stripe context
const PaymentPage = ({
    darkMode,
    lotName,
    price,
    vehicleInfo,
    onBackClick,
    onCompletePayment,
    hasValidPermit,
    validPermitDetails
}) => {
    return (
        <Elements stripe={stripePromise}>
            <PaymentForm
                darkMode={darkMode}
                lotName={lotName}
                price={price}
                vehicleInfo={vehicleInfo}
                onBackClick={onBackClick}
                onCompletePayment={onCompletePayment}
                hasValidPermit={hasValidPermit}
                validPermitDetails={validPermitDetails}
            />
        </Elements>
    );
};

// The actual payment form component
const PaymentForm = ({
    darkMode,
    lotName,
    price,
    vehicleInfo,
    onBackClick,
    onCompletePayment,
    hasValidPermit,
    validPermitDetails
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [paymentMethod, setPaymentMethod] = useState(hasValidPermit ? 'existingPermit' : 'card');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [cardError, setCardError] = useState('');
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
    const [loadingSavedCards, setLoadingSavedCards] = useState(false);
    const [selectedSavedCard, setSelectedSavedCard] = useState(null);
    const [showNewCardForm, setShowNewCardForm] = useState(true);

    // Update payment method when the hasValidPermit prop changes
    useEffect(() => {
        if (hasValidPermit && validPermitDetails) {
            setPaymentMethod('existingPermit');
        }
    }, [hasValidPermit, validPermitDetails]);

    // Fetch saved payment methods
    useEffect(() => {
        const fetchSavedPaymentMethods = async () => {
            setLoadingSavedCards(true);
            try {
                console.log('Attempting to fetch saved payment methods...');
                const response = await PaymentMethodService.getSavedPaymentMethods();
                console.log('Saved payment methods response:', response);

                if (response.success) {
                    // Check if response data is correct
                    if (!response.paymentMethods) {
                        console.error('Missing paymentMethods array in successful response');
                    }

                    setSavedPaymentMethods(response.paymentMethods || []);
                    setShowNewCardForm(response.paymentMethods.length === 0);

                    // Select the default payment method if available
                    const defaultMethod = response.paymentMethods.find(pm => pm.isDefault);
                    if (defaultMethod) {
                        setSelectedSavedCard(defaultMethod);
                    }

                    // Log all payment methods for debugging
                    if (response.paymentMethods && response.paymentMethods.length > 0) {
                        console.log(`Found ${response.paymentMethods.length} payment methods:`);
                        response.paymentMethods.forEach((method, i) => {
                            console.log(`Method ${i + 1}:`, {
                                id: method.id,
                                brand: method.brand,
                                last4: method.last4,
                                isDefault: method.isDefault
                            });
                        });
                    } else {
                        console.log('No saved payment methods found');
                    }
                } else {
                    console.error('Failed to fetch payment methods:', response.error);
                }
            } catch (error) {
                console.error('Error fetching saved payment methods:', error);
            } finally {
                setLoadingSavedCards(false);
            }
        };

        if (paymentMethod === 'card') {
            fetchSavedPaymentMethods();

            // Try again after a short delay in case there was a timing issue
            const retryTimer = setTimeout(() => {
                console.log('Retrying payment method fetch...');
                fetchSavedPaymentMethods();
            }, 2000);

            return () => clearTimeout(retryTimer);
        }
    }, [paymentMethod]);

    // Handle Stripe card element change
    const handleCardChange = (event) => {
        if (event.error) {
            setCardError(event.error.message);
        } else {
            setCardError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // If using existing permit, process free reservation
        if (paymentMethod === 'existingPermit') {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setPaymentStatus('success');
                setTimeout(() => {
                    onCompletePayment({
                        paymentMethod: 'existingPermit',
                        transactionId: 'FREE-' + Math.floor(Math.random() * 1000000000),
                        timestamp: new Date().toISOString()
                    });
                }, 1500);
            }, 1000);
            return;
        }

        // For SOLAR payment method, just simulate a successful transaction
        if (paymentMethod === 'solar') {
            setIsProcessing(true);
            setTimeout(() => {
                setIsProcessing(false);
                setPaymentStatus('success');
                setTimeout(() => {
                    onCompletePayment({
                        paymentMethod: 'solar',
                        transactionId: 'SOLAR-' + Math.floor(Math.random() * 1000000000),
                        timestamp: new Date().toISOString()
                    });
                }, 1500);
            }, 2000);
            return;
        }

        // For card payment method, use Stripe
        if (!stripe || !elements) {
            // Stripe.js has not loaded yet. Make sure to disable form submission until Stripe.js has loaded.
            return;
        }

        setIsProcessing(true);

        try {
            // If using a saved card, use its payment method ID
            if (selectedSavedCard && !showNewCardForm) {
                console.log('Using saved payment method:', selectedSavedCard.id);

                // Display success and complete payment with the saved card
                setPaymentStatus('success');
                setTimeout(() => {
                    onCompletePayment({
                        paymentMethod: 'card',
                        paymentMethodId: selectedSavedCard.id,
                        transactionId: 'TRX-' + Math.floor(Math.random() * 1000000000),
                        timestamp: new Date().toISOString()
                    });
                }, 1500);
                return;
            }

            // Create a payment method using the Card Element
            const cardElement = elements.getElement(CardElement);
            const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                console.error('Error creating payment method:', error);
                setCardError(error.message);
                setPaymentStatus('error');
                setIsProcessing(false);
                return;
            }

            // Payment method created successfully
            console.log('Payment method created:', stripePaymentMethod);

            // Display success and complete payment
            setPaymentStatus('success');
            setTimeout(() => {
                onCompletePayment({
                    paymentMethod: 'card',
                    paymentMethodId: stripePaymentMethod.id,
                    transactionId: 'TRX-' + Math.floor(Math.random() * 1000000000),
                    timestamp: new Date().toISOString()
                });
            }, 1500);

        } catch (err) {
            console.error('Payment processing error:', err);
            setCardError('An unexpected error occurred. Please try again later.');
            setPaymentStatus('error');
        } finally {
            setIsProcessing(false);
        }
    };

    // Format date to be more readable
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Handle selecting a saved card
    const handleSelectSavedCard = (card) => {
        setSelectedSavedCard(card);
        setShowNewCardForm(false);
        setCardError('');
    };

    // Handle showing the new card form
    const handleShowNewCardForm = () => {
        setSelectedSavedCard(null);
        setShowNewCardForm(true);
    };

    return (
        <div className="w-full animate-fadeIn">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={onBackClick}
                    className="text-red-600 hover:text-red-800 mr-4 flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    disabled={isProcessing}
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Payment
                </h1>
            </div>

            {/* Permit notification if applicable */}
            {hasValidPermit && validPermitDetails && (
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-green-700' : 'bg-green-100'} ${darkMode ? 'text-white' : 'text-green-800'}`}>
                    <div className="flex items-start">
                        <FaIdCard className="mr-2 text-xl mt-1" />
                        <div>
                            <p className="font-semibold">You have a valid permit!</p>
                            <p className="text-sm">Permit #{validPermitDetails.permitNumber} valid until {formatDate(validPermitDetails.endDate)}</p>
                            <p className="text-sm mt-1">No payment required for this reservation.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Order summary */}
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="mb-3">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reserving spot at:</p>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{lotName}</p>
                </div>

                <div className="mb-3">
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Vehicle:</p>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model} ({vehicleInfo.color})
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {vehicleInfo.plateNumber} • {vehicleInfo.stateProv || vehicleInfo.state}
                    </p>
                </div>

                <div className="pt-3 border-t border-gray-600">
                    <div className="flex justify-between">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</p>
                        <p className={`font-bold text-lg ${hasValidPermit ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {price}
                        </p>
                    </div>
                    {hasValidPermit && (
                        <div className="flex justify-between mt-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>With permit discount:</p>
                            <p className={`font-bold text-lg text-green-500`}>FREE</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment status messages */}
            {paymentStatus === 'success' && (
                <div className={`p-4 rounded-lg mb-6 bg-green-600 text-white flex items-center`}>
                    <FaCheckCircle className="mr-2 text-xl" />
                    <div>
                        <p className="font-semibold">Payment Successful!</p>
                        <p className="text-sm">Your parking reservation has been confirmed.</p>
                    </div>
                </div>
            )}

            {paymentStatus === 'error' && (
                <div className={`p-4 rounded-lg mb-6 bg-red-600 text-white flex items-center`}>
                    <FaExclamationCircle className="mr-2 text-xl" />
                    <div>
                        <p className="font-semibold">Payment Failed</p>
                        <p className="text-sm">There was an issue processing your payment. Please try again.</p>
                    </div>
                </div>
            )}

            {/* Payment form */}
            {!paymentStatus && (
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h2 className={`font-semibold text-lg mb-5 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Select Payment Method
                    </h2>

                    {/* Payment method selection */}
                    <div className="flex space-x-4 mb-6">
                        {hasValidPermit && (
                            <button
                                type="button"
                                onClick={() => {
                                    setPaymentMethod('existingPermit');
                                    setCardError('');
                                }}
                                className={`flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center ${paymentMethod === 'existingPermit'
                                    ? 'border-green-500 bg-green-50 dark:bg-gray-700'
                                    : 'border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                <FaIdCard className={`text-2xl mb-2 ${paymentMethod === 'existingPermit' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`} />
                                <span className={`font-medium ${paymentMethod === 'existingPermit' ? 'text-green-500' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Use Existing Permit
                                </span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => {
                                setPaymentMethod('card');
                                setCardError('');
                            }}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center ${paymentMethod === 'card'
                                ? 'border-red-500 bg-red-50 dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <FaCreditCard className={`text-2xl mb-2 ${paymentMethod === 'card' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span className={`font-medium ${paymentMethod === 'card' ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Credit Card
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setPaymentMethod('solar');
                                setCardError('');
                            }}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center ${paymentMethod === 'solar'
                                ? 'border-red-500 bg-red-50 dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <FaUniversity className={`text-2xl mb-2 ${paymentMethod === 'solar' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span className={`font-medium ${paymentMethod === 'solar' ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                SOLAR Account
                            </span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {paymentMethod === 'existingPermit' && validPermitDetails ? (
                            <div className="space-y-5">
                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Using permit:
                                    </p>
                                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {validPermitDetails.permitName || validPermitDetails.permitType}
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Permit #{validPermitDetails.permitNumber} - Valid until {formatDate(validPermitDetails.endDate)}
                                    </p>
                                    <p className={`text-sm mt-2 ${darkMode ? 'text-green-300' : 'text-green-600'}`}>
                                        This permit is valid for this parking lot.
                                    </p>
                                </div>
                            </div>
                        ) : paymentMethod === 'card' ? (
                            <div className="space-y-5">
                                {/* Saved Payment Methods */}
                                {savedPaymentMethods.length > 0 && (
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Saved Cards
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleShowNewCardForm}
                                                className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                                            >
                                                {showNewCardForm ? 'Use saved card' : 'Use new card'}
                                            </button>
                                        </div>

                                        {loadingSavedCards ? (
                                            <div className="flex items-center justify-center p-4">
                                                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${darkMode ? 'border-white' : 'border-gray-900'}`}></div>
                                                <span className="ml-2 text-sm">Loading saved cards...</span>
                                            </div>
                                        ) : (
                                            <div className={showNewCardForm ? 'hidden' : 'space-y-2'}>
                                                {savedPaymentMethods.map(card => (
                                                    <div
                                                        key={card.id}
                                                        onClick={() => handleSelectSavedCard(card)}
                                                        className={`flex items-center justify-between p-3 rounded-md cursor-pointer ${selectedSavedCard && selectedSavedCard.id === card.id
                                                            ? darkMode ? 'bg-blue-800' : 'bg-blue-100'
                                                            : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100'
                                                            }`}
                                                    >
                                                        <div className="flex items-center">
                                                            <FaCreditCard className={`text-xl mr-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                                            <div>
                                                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {card.brand.charAt(0).toUpperCase() + card.brand.slice(1)} •••• {card.last4}
                                                                </p>
                                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                    Expires {card.exp_month}/{card.exp_year}
                                                                    {card.isDefault && <span className="ml-2 text-green-500">Default</span>}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Card Details Input */}
                                {showNewCardForm && (
                                    <div>
                                        <label
                                            htmlFor="card-element"
                                            className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            Card Details
                                        </label>
                                        <div className={`p-3 rounded-md border ${darkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-gray-50 text-gray-900 border-gray-300'
                                            } ${cardError ? 'border-red-500' : ''}`}>
                                            <CardElement
                                                id="card-element"
                                                options={{
                                                    style: {
                                                        base: {
                                                            color: darkMode ? '#ffffff' : '#32325d',
                                                            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                                                            fontSmoothing: 'antialiased',
                                                            fontSize: '16px',
                                                            '::placeholder': {
                                                                color: darkMode ? '#aaaaaa' : '#aab7c4'
                                                            }
                                                        },
                                                        invalid: {
                                                            color: '#fa755a',
                                                            iconColor: '#fa755a'
                                                        }
                                                    }
                                                }}
                                                onChange={handleCardChange}
                                            />
                                        </div>
                                        {cardError && (
                                            <p className="mt-2 text-sm text-red-500">{cardError}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="solar-id"
                                        className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        SOLAR ID
                                    </label>
                                    <input
                                        type="text"
                                        id="solar-id"
                                        placeholder="Your SOLAR ID (e.g. 123456789)"
                                        className={`w-full p-3 rounded-md border ${darkMode
                                            ? 'bg-gray-700 text-white border-gray-600'
                                            : 'bg-gray-50 text-gray-900 border-gray-300'
                                            }`}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className={`w-full py-3 px-4 rounded-md font-medium shadow-md transition-colors ${isProcessing
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : paymentMethod === 'existingPermit'
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </div>
                                ) : paymentMethod === 'existingPermit' ? (
                                    'Confirm Free Reservation'
                                ) : (
                                    `Pay ${price}`
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PaymentPage; 