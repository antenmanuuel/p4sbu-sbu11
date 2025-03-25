import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCreditCard, FaUniversity, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const PaymentPage = ({ darkMode, lotName, price, vehicleInfo, onBackClick, onCompletePayment }) => {
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [cvv, setCvv] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);

    const formatCardNumber = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Add space after every 4 digits
        let formatted = '';
        for (let i = 0; i < digits.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += digits[i];
        }

        // Limit to 19 characters (16 digits + 3 spaces)
        return formatted.substring(0, 19);
    };

    const formatExpiryDate = (value) => {
        // Remove all non-digits
        const digits = value.replace(/\D/g, '');

        // Format as MM/YY
        if (digits.length > 2) {
            return `${digits.substring(0, 2)}/${digits.substring(2, 4)}`;
        } else {
            return digits;
        }
    };

    // Validate a single field
    const validateField = (name, value) => {
        if (paymentMethod !== 'card') return '';

        let error = '';
        let month, year, currentYear, currentMonth;

        switch (name) {
            case 'cardNumber':
                if (!value.trim()) {
                    error = 'Card number is required';
                } else if (value.replace(/\s/g, '').length !== 16) {
                    error = 'Card number must be 16 digits';
                }
                // Check if all characters are digits or spaces
                else if (!/^[\d\s]+$/.test(value)) {
                    error = 'Card number can only contain digits';
                }
                break;
            case 'cardName':
                if (!value.trim()) {
                    error = 'Name on card is required';
                } else if (value.trim().length < 3) {
                    error = 'Name must be at least 3 characters';
                }
                break;
            case 'expiryDate':
                if (!value.trim()) {
                    error = 'Expiry date is required';
                } else if (value.length !== 5 || !/^\d\d\/\d\d$/.test(value)) {
                    error = 'Expiry date must be in MM/YY format';
                } else {
                    // Validate month is between 01-12
                    month = parseInt(value.substring(0, 2), 10);
                    if (month < 1 || month > 12) {
                        error = 'Month must be between 01-12';
                    } else {
                        // Check if date is in the future
                        year = parseInt('20' + value.substring(3, 5), 10);
                        currentYear = new Date().getFullYear();
                        currentMonth = new Date().getMonth() + 1;

                        if (year < currentYear || (year === currentYear && month < currentMonth)) {
                            error = 'Card has expired';
                        }
                    }
                }
                break;
            case 'cvv':
                if (!value.trim()) {
                    error = 'CVV is required';
                } else if (!/^\d{3,4}$/.test(value)) {
                    error = 'CVV must be 3-4 digits';
                }
                break;
            default:
                break;
        }

        return error;
    };

    const validateForm = () => {
        if (paymentMethod === 'solar') return true;

        const newErrors = {};

        newErrors.cardNumber = validateField('cardNumber', cardNumber);
        newErrors.cardName = validateField('cardName', cardName);
        newErrors.expiryDate = validateField('expiryDate', expiryDate);
        newErrors.cvv = validateField('cvv', cvv);

        // Remove empty error messages
        Object.keys(newErrors).forEach(key => {
            if (!newErrors[key]) {
                delete newErrors[key];
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle field change with validation
    const handleFieldChange = (name, value) => {
        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));

        // Update field value
        switch (name) {
            case 'cardNumber':
                setCardNumber(formatCardNumber(value));
                break;
            case 'cardName':
                setCardName(value);
                break;
            case 'expiryDate':
                setExpiryDate(formatExpiryDate(value));
                break;
            case 'cvv':
                setCvv(value.replace(/\D/g, '').substring(0, 4));
                break;
            default:
                break;
        }

        // If form was already submitted once, validate the field immediately
        if (formSubmitted) {
            setErrors(prev => ({
                ...prev,
                [name]: validateField(name, value)
            }));
        }
    };

    // Effect to validate touched fields
    useEffect(() => {
        if (paymentMethod === 'card' && Object.keys(touched).length > 0) {
            const fieldsToValidate = Object.keys(touched).filter(field => touched[field]);

            const newErrors = { ...errors };
            fieldsToValidate.forEach(field => {
                let value;
                switch (field) {
                    case 'cardNumber': value = cardNumber; break;
                    case 'cardName': value = cardName; break;
                    case 'expiryDate': value = expiryDate; break;
                    case 'cvv': value = cvv; break;
                    default: value = '';
                }

                const error = validateField(field, value);
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
            });

            setErrors(newErrors);
        }
    }, [cardNumber, cardName, expiryDate, cvv, touched, paymentMethod]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        if (paymentMethod === 'card') {
            // Set all credit card fields as touched
            setTouched({
                cardNumber: true,
                cardName: true,
                expiryDate: true,
                cvv: true
            });
        }

        if (!validateForm()) {
            // Scroll to first error and focus it
            const firstErrorField = document.querySelector('.error-border');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
            return;
        }

        setIsProcessing(true);

        // Simulate payment processing
        setTimeout(() => {
            setIsProcessing(false);
            // For demo purposes, simulate successful payment
            setPaymentStatus('success');

            // After showing success message, proceed
            setTimeout(() => {
                onCompletePayment({
                    paymentMethod,
                    transactionId: 'TRX' + Math.floor(Math.random() * 1000000000),
                    timestamp: new Date().toISOString()
                });
            }, 1500);
        }, 2000);
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field];

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
                        {vehicleInfo.plateNumber} • {vehicleInfo.state}
                    </p>
                </div>

                <div className="pt-3 border-t border-gray-600">
                    <div className="flex justify-between">
                        <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Total:</p>
                        <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{price}</p>
                    </div>
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
                        <button
                            type="button"
                            onClick={() => {
                                setPaymentMethod('card');
                                // Clear errors when switching payment methods
                                setErrors({});
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
                                // Clear errors when switching payment methods
                                setErrors({});
                            }}
                            className={`flex-1 p-4 rounded-lg border-2 transition-colors flex flex-col items-center ${paymentMethod === 'solar'
                                ? 'border-red-500 bg-red-50 dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-700'
                                }`}
                        >
                            <FaUniversity className={`text-2xl mb-2 ${paymentMethod === 'solar' ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`} />
                            <span className={`font-medium ${paymentMethod === 'solar' ? 'text-red-500' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                SOLAR
                            </span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {paymentMethod === 'card' ? (
                            <div className="space-y-5">
                                <div>
                                    <label
                                        htmlFor="cardNumber"
                                        className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        Card Number
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="cardNumber"
                                            placeholder="•••• •••• •••• ••••"
                                            value={cardNumber}
                                            onChange={(e) => handleFieldChange('cardNumber', e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, cardNumber: true }))}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                                : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                                } border focus:outline-none focus:ring-2 ${errors.cardNumber && touched.cardNumber ? 'border-red-500 error-border' :
                                                    isFieldValid('cardNumber') ? 'border-green-500' : ''
                                                }`}
                                            maxLength={19}
                                            aria-invalid={errors.cardNumber && touched.cardNumber ? "true" : "false"}
                                            aria-describedby={errors.cardNumber ? "cardNumber-error" : undefined}
                                        />
                                        {isFieldValid('cardNumber') && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <FaCheckCircle className="text-green-500" />
                                            </div>
                                        )}
                                        {errors.cardNumber && touched.cardNumber && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <FaExclamationCircle className="text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.cardNumber && touched.cardNumber && (
                                        <p id="cardNumber-error" className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.cardNumber}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="cardName"
                                        className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                    >
                                        Name on Card
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            id="cardName"
                                            placeholder="John Doe"
                                            value={cardName}
                                            onChange={(e) => handleFieldChange('cardName', e.target.value)}
                                            onBlur={() => setTouched(prev => ({ ...prev, cardName: true }))}
                                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                                : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                                } border focus:outline-none focus:ring-2 ${errors.cardName && touched.cardName ? 'border-red-500 error-border' :
                                                    isFieldValid('cardName') ? 'border-green-500' : ''
                                                }`}
                                            aria-invalid={errors.cardName && touched.cardName ? "true" : "false"}
                                            aria-describedby={errors.cardName ? "cardName-error" : undefined}
                                        />
                                        {isFieldValid('cardName') && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <FaCheckCircle className="text-green-500" />
                                            </div>
                                        )}
                                        {errors.cardName && touched.cardName && (
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                <FaExclamationCircle className="text-red-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.cardName && touched.cardName && (
                                        <p id="cardName-error" className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.cardName}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label
                                            htmlFor="expiryDate"
                                            className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            Expiry Date
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="expiryDate"
                                                placeholder="MM/YY"
                                                value={expiryDate}
                                                onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, expiryDate: true }))}
                                                className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                    ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                                    : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                                    } border focus:outline-none focus:ring-2 ${errors.expiryDate && touched.expiryDate ? 'border-red-500 error-border' :
                                                        isFieldValid('expiryDate') ? 'border-green-500' : ''
                                                    }`}
                                                maxLength={5}
                                                aria-invalid={errors.expiryDate && touched.expiryDate ? "true" : "false"}
                                                aria-describedby={errors.expiryDate ? "expiryDate-error" : undefined}
                                            />
                                            {isFieldValid('expiryDate') && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FaCheckCircle className="text-green-500" />
                                                </div>
                                            )}
                                            {errors.expiryDate && touched.expiryDate && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FaExclamationCircle className="text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                        {errors.expiryDate && touched.expiryDate && (
                                            <p id="expiryDate-error" className="mt-1 text-sm text-red-500 flex items-center">
                                                <FaExclamationCircle className="mr-1" /> {errors.expiryDate}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="cvv"
                                            className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                        >
                                            CVV
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                id="cvv"
                                                placeholder="•••"
                                                value={cvv}
                                                onChange={(e) => handleFieldChange('cvv', e.target.value)}
                                                onBlur={() => setTouched(prev => ({ ...prev, cvv: true }))}
                                                className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                                    ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                                    : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                                    } border focus:outline-none focus:ring-2 ${errors.cvv && touched.cvv ? 'border-red-500 error-border' :
                                                        isFieldValid('cvv') ? 'border-green-500' : ''
                                                    }`}
                                                maxLength={4}
                                                aria-invalid={errors.cvv && touched.cvv ? "true" : "false"}
                                                aria-describedby={errors.cvv ? "cvv-error" : undefined}
                                            />
                                            {isFieldValid('cvv') && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FaCheckCircle className="text-green-500" />
                                                </div>
                                            )}
                                            {errors.cvv && touched.cvv && (
                                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                                    <FaExclamationCircle className="text-red-500" />
                                                </div>
                                            )}
                                        </div>
                                        {errors.cvv && touched.cvv && (
                                            <p id="cvv-error" className="mt-1 text-sm text-red-500 flex items-center">
                                                <FaExclamationCircle className="mr-1" /> {errors.cvv}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Form validation summary */}
                                {formSubmitted && Object.keys(errors).length > 0 && (
                                    <div className={`p-3 rounded-md ${darkMode ? 'bg-red-900/50' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                                        <div className="flex">
                                            <FaExclamationCircle className={`flex-shrink-0 h-5 w-5 text-red-500 mt-0.5`} />
                                            <div className="ml-3">
                                                <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                                                    Please correct the following errors:
                                                </h3>
                                                <div className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                                                    <ul className="list-disc pl-5 space-y-1">
                                                        {Object.keys(errors).map(key => (
                                                            <li key={key}>{errors[key]}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <p className={`mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        About SOLAR Payment
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        SOLAR is Stony Brook University's student information system. By selecting this option, the parking fee will be charged to your student account.
                                    </p>
                                </div>

                                <div className={`flex items-start p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                                    <FaExclamationCircle className={`text-yellow-500 mt-0.5 mr-2 flex-shrink-0`} />
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        You will be redirected to SOLAR after clicking "Complete Payment". The charge will appear on your student account within 24 hours.
                                    </p>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className={`w-full py-3 px-4 mt-6 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors shadow-md flex items-center justify-center ${isProcessing ? 'opacity-70 cursor-not-allowed' : ''
                                }`}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                `Complete Payment`
                            )}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PaymentPage; 