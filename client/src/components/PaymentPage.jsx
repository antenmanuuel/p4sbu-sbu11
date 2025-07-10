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

/* ============================================================================
      Initialize Stripe once, outside of any component, to avoid re-creating
      the Stripe instance on every render. Replace the env var with your own
      Stripe publishable key in VITE_STRIPE_PUBLISHABLE_KEY.
   ============================================================================ */
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/* ============================================================================
      PaymentPage: Top-level wrapper that injects the Stripe context into our
      app via <Elements>.  All child components (PaymentForm) can use
      useStripe() and useElements() hooks once this is present. (referenced/implemented via stripe docs example)  
   ============================================================================ */
// The wrapper component that provides Stripe context
const PaymentPage = ({
    darkMode,
    lotName,
    price,
    vehicleInfo,
    onBackClick,
    onCompletePayment,
    hasValidPermit,
    validPermitDetails,
    hasReservationError = false,
    checkingForExistingPermits = false,
    isSwitchingPermitType = false,
    permitToReplace = null,
    // New props for time-based free parking
    startDateTime,
    endDateTime,
    lotType,
    isMeteredLot
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
                hasReservationError={hasReservationError}
                checkingForExistingPermits={checkingForExistingPermits}
                isSwitchingPermitType={isSwitchingPermitType}
                permitToReplace={permitToReplace}
                startDateTime={startDateTime}
                endDateTime={endDateTime}
                lotType={lotType}
                isMeteredLot={isMeteredLot}
            />
        </Elements>
    );
};

/* ============================================================================
      PaymentForm: Contains all state, handlers, and JSX for selecting payment
      methods, displaying saved cards, new card entry, and submitting payment.
   ============================================================================ */

const PaymentForm = ({
    darkMode,
    lotName,
    price,
    vehicleInfo,
    onBackClick,
    onCompletePayment,
    hasValidPermit,
    validPermitDetails,
    hasReservationError = false,
    checkingForExistingPermits = false,
    isSwitchingPermitType = false,
    permitToReplace = null,
    // New props for time-based free parking
    startDateTime,
    endDateTime,
    lotType,
    isMeteredLot
}) => {
    const stripe = useStripe();
    const elements = useElements();

    /* ----------------------------------------------------------------------------
       Component state: 
       - paymentMethod: dedicated to hold the payment method chosen by the user: 'existingPermit', 'card', or 'solar'
       - isProcessing: whether a payment flow is in progress
       - paymentStatus: tracks 'success' or 'error' after submitting
       - cardError: validation message from Stripe CardElement
       - savedPaymentMethods: array of user's stored cards
       - loadingSavedCards: spinner while we fetch saved cards
       - selectedSavedCard: which stores the card the user clicked
       - showNewCardForm: toggles between saved-card list vs. new-card input
       - isParkingFree: whether parking is free due to time-based rules
       - freeReason: explanation of why parking is free
  ---------------------------------------------------------------------------- */

    // Determine if parking is free due to time-based rules
    const [isParkingFree, setIsParkingFree] = useState(price === '$0.00');
    const [freeReason, setFreeReason] = useState('');

    useEffect(() => {
        let isFree = price === '$0.00';
        let reason = '';

        if (isFree && startDateTime) {
            const date = new Date(startDateTime);
            const day = date.getDay();
            const hour = date.getHours();
            const isWeekend = day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
            const isAfter4PM = hour >= 16; // 4 PM = 16 in 24-hour format
            const isAfter7PM = hour >= 19; // 7 PM = 19 in 24-hour format
            const isBefore7AM = hour < 7;  // Before 7 AM

            if (isWeekend) {
                reason = 'Free parking on weekends';
            } else if (lotType === 'Permit-based') {
                if (isAfter4PM) {
                    reason = 'Free parking after 4 PM with permit';
                } else if (isBefore7AM) {
                    reason = 'Free parking before 7 AM with permit';
                } else if (hasValidPermit) {
                    reason = 'Free with valid permit';
                }
            } else if (lotType === 'Hourly' && isMeteredLot) {
                if (isAfter7PM) {
                    reason = 'Free parking after 7 PM (metered)';
                } else if (isBefore7AM) {
                    reason = 'Free parking before 7 AM (metered)';
                }
            }
        } else if (hasValidPermit) {
            reason = 'Free with valid permit';
        }

        setIsParkingFree(isFree);
        setFreeReason(reason);
    }, [price, startDateTime, lotType, lotName, hasValidPermit, isMeteredLot]);

    const [paymentMethod, setPaymentMethod] = useState(isParkingFree ? 'existingPermit' : (hasValidPermit ? 'existingPermit' : 'card'));
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [cardError, setCardError] = useState('');
    const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
    const [loadingSavedCards, setLoadingSavedCards] = useState(false);
    const [selectedSavedCard, setSelectedSavedCard] = useState(null);
    const [showNewCardForm, setShowNewCardForm] = useState(true);

    /* ----------------------------------------------------------------------------
      Sync with incoming props:
      - If the parent tells us there's a valid permit, auto-select that method.
      - If parking is free due to time-based rules, auto-select existingPermit
  ---------------------------------------------------------------------------- */

    // Update payment method when the hasValidPermit prop or isParkingFree changes
    useEffect(() => {
        if (isParkingFree || hasValidPermit) {
            setPaymentMethod('existingPermit');
        }
    }, [hasValidPermit, validPermitDetails, isParkingFree]);


    /* ----------------------------------------------------------------------------
              Reset the status if a reservation error comes from parent.
   ---------------------------------------------------------------------------- */
    // Reset payment status when reservation error appears
    useEffect(() => {
        if (hasReservationError) {
            setPaymentStatus(null);
        }
    }, [hasReservationError]);

    /* ----------------------------------------------------------------------------
          Get the saved payment methods from the backend when the user switches to the card option:
         - Show loading spinner
         - Save methods or log errors
         - Pre-select the default card
         - Retry once after 2s in case of a race condition
   ---------------------------------------------------------------------------- */
    // Fetch saved payment methods
    useEffect(() => {
        const fetchSavedPaymentMethods = async () => {
            // Skip fetching payment methods if parking is free
            if (isParkingFree) return;

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

        if (paymentMethod === 'card' && !isParkingFree) {
            fetchSavedPaymentMethods();

            // Try again after a short delay in case there was a timing issue
            const retryTimer = setTimeout(() => {
                console.log('Retrying payment method fetch...');
                fetchSavedPaymentMethods();
            }, 2000);

            return () => clearTimeout(retryTimer);
        }
    }, [paymentMethod, isParkingFree]);

    // Handle live validation errors from Stripe CardElement
    const handleCardChange = (event) => {
        if (event.error) {
            setCardError(event.error.message);
        } else {
            setCardError('');
        }
    };

    /* ----------------------------------------------------------------------------
        Form submit handler:
       - Prevent default form behavior
       - Branch by the chosen payment method:
         - existingPermit means that they should get a free reservation
         - solar means thet we should simulate a Solar payment
         - card means it should access real Stripe API and continue with the flow (new or saved card)
   ---------------------------------------------------------------------------- */
    const handleSubmit = async (e) => {
        e.preventDefault();

        // If using existing permit or parking is free, process free reservation
        if (paymentMethod === 'existingPermit' || isParkingFree) {
            setIsProcessing(true);
            try {
                // Call onCompletePayment immediately without setting success state first
                onCompletePayment({
                    paymentMethod: 'existingPermit',
                    transactionId: 'FREE-' + Math.floor(Math.random() * 1000000000),
                    timestamp: new Date().toISOString()
                });
            } finally {
                setIsProcessing(false);
            }
            return;
        }

        // For SOLAR payment method, just simulate a successful transaction
        if (paymentMethod === 'solar') {
            setIsProcessing(true);
            try {
                // Call onCompletePayment immediately without setting success state first
                onCompletePayment({
                    paymentMethod: 'solar',
                    transactionId: 'SOLAR-' + Math.floor(Math.random() * 1000000000),
                    timestamp: new Date().toISOString()
                });
            } finally {
                setIsProcessing(false);
            }
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

                // Call onCompletePayment immediately without setting success state first
                onCompletePayment({
                    paymentMethod: 'card',
                    paymentMethodId: selectedSavedCard.id,
                    customerId: selectedSavedCard.customerId,
                    transactionId: 'TRX-' + Math.floor(Math.random() * 1000000000),
                    timestamp: new Date().toISOString()
                });
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

            // Call onCompletePayment immediately without setting success state first
            onCompletePayment({
                paymentMethod: 'card',
                paymentMethodId: stripePaymentMethod.id,
                transactionId: 'TRX-' + Math.floor(Math.random() * 1000000000),
                timestamp: new Date().toISOString()
            });

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

    // Hide success message if there's a reservation error
    const showPaymentStatus = !hasReservationError && paymentStatus;

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

            {/* Free parking notification based on time rules */}
            {isParkingFree && !hasValidPermit && (
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-green-700' : 'bg-green-100'} ${darkMode ? 'text-white' : 'text-green-800'}`}>
                    <div className="flex items-start">
                        <FaCheckCircle className="mr-2 text-xl mt-1" />
                        <div>
                            <p className="font-semibold">Free Parking!</p>
                            <p className="text-sm">{freeReason || 'No payment required for this reservation.'}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Permit switching notification */}
            {isSwitchingPermitType && permitToReplace && (
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-blue-700' : 'bg-blue-100'} ${darkMode ? 'text-white' : 'text-blue-800'}`}>
                    <div className="flex items-start">
                        <FaExclamationCircle className="mr-2 text-xl mt-1" />
                        <div>
                            <p className="font-semibold">You're switching permit types</p>
                            <p className="text-sm">Your existing {permitToReplace.permitType} permit will be refunded and replaced with a new permit.</p>
                            <p className="text-sm mt-1">New permit price: {price}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading notification for permit check */}
            {checkingForExistingPermits && (
                <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                        <p>Checking for existing permits...</p>
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
                        {isParkingFree ? (
                            <p className={`font-bold text-lg text-green-500`}>
                                FREE {freeReason ? `(${freeReason})` : ''}
                            </p>
                        ) : (
                            <p className={`font-bold text-lg ${hasValidPermit ? 'line-through' : ''} ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {price}
                            </p>
                        )}
                    </div>
                    {hasValidPermit && !isParkingFree && (
                        <div className="flex justify-between mt-1">
                            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>With permit discount:</p>
                            <p className={`font-bold text-lg text-green-500`}>FREE</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Payment status notification */}
            {showPaymentStatus && (
                <div className={`mb-6 px-4 py-5 rounded-lg flex items-center ${paymentStatus === 'success'
                    ? `${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`
                    : `${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`
                    }`}>
                    <div className="flex-shrink-0 mr-3">
                        {paymentStatus === 'success' ? (
                            <FaCheckCircle className="h-6 w-6 text-green-500" />
                        ) : (
                            <FaExclamationCircle className="h-6 w-6 text-red-500" />
                        )}
                    </div>
                    <div>
                        {paymentStatus === 'success' ? (
                            <p className="font-semibold">Payment Successful!</p>
                        ) : (
                            <p className="font-semibold">Payment Failed</p>
                        )}
                        <p className="text-sm">
                            {paymentStatus === 'success'
                                ? 'Your parking reservation has been confirmed.'
                                : 'Please check your payment details and try again.'
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Payment form */}
            {!paymentStatus && (
                <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <form onSubmit={handleSubmit}>
                        {/* Only show payment method selection if parking is not free */}
                        {!isParkingFree && (
                            <>
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
                                            ? 'border-blue-500 bg-blue-50 dark:bg-gray-700'
                                            : 'border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <FaUniversity className={`text-2xl mb-2 ${paymentMethod === 'solar' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
                                        <span className={`font-medium ${paymentMethod === 'solar' ? 'text-blue-500' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            SOLAR Account
                                        </span>
                                    </button>
                                </div>

                                {/* Show the appropriate payment form based on paymentMethod */}
                                {paymentMethod === 'card' && (
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
                                )}

                                {paymentMethod === 'solar' && (
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
                                )}
                            </>
                        )}

                        <div className="mt-6">
                            <button
                                type="submit"
                                disabled={isProcessing}
                                className={`w-full py-3 px-4 rounded-md font-medium shadow-md transition-colors ${isProcessing
                                    ? 'bg-gray-500 cursor-not-allowed'
                                    : paymentMethod === 'existingPermit' || isParkingFree
                                        ? 'bg-green-600 hover:bg-green-700 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                    }`}
                            >
                                {isProcessing ? (
                                    <div className="flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Processing...
                                    </div>
                                ) : isParkingFree || paymentMethod === 'existingPermit' ? (
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
