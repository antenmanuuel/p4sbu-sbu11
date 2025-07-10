// TP: this .jsx file's code was heavily manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Students via Pair Programming) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was given context for stripe docs and prompted to take the initial student iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

// Additional Reference: Stripe API Docs

import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaLock, FaSave } from 'react-icons/fa';

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
                color: '#aab7c4',
            },
        },
        invalid: {
            color: '#9e2146',
        },
    },
};

const StripeCardElement = ({ darkMode, onPaymentMethodCreated, buttonText = 'Save Card' }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [cardComplete, setCardComplete] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [saveCard, setSaveCard] = useState(true);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            // This is basically that Stripe.js has not loaded yet. Disable form submission until it's loaded
            return;
        }

        if (error) {
            elements.getElement('card').focus();
            return;
        }

        if (cardComplete) {
            setProcessing(true);
        }

        const cardElement = elements.getElement(CardElement);

        try {
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                setError(error.message);
                setProcessing(false);
                return;
            }

            // Pass the payment method to the parent component along with save preference
            onPaymentMethodCreated(paymentMethod, saveCard);
        } catch (err) {
            console.error('Error creating payment method:', err);
            setError('An unexpected error occurred. Please try again later.');
            setProcessing(false);
        }
    };

    const handleCardChange = (event) => {
        setError(event.error ? event.error.message : '');
        setCardComplete(event.complete);
    };

    return (
        <div className={`w-full ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            <form onSubmit={handleSubmit}>
                <div className={`p-4 rounded-md mb-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <p className="text-sm mb-2 flex items-center">
                        <FaLock className="inline-block mr-1 text-green-500" />
                        Secure credit card payment
                    </p>
                    <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-800 border border-gray-600' : 'bg-white border border-gray-300'}`}>
                        <CardElement
                            options={CARD_ELEMENT_OPTIONS}
                            onChange={handleCardChange}
                            className="py-2"
                        />
                    </div>
                    {error && (
                        <div className="mt-2 text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Save card option */}
                    <label className={`flex items-center mt-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <input
                            type="checkbox"
                            checked={saveCard}
                            onChange={() => setSaveCard(!saveCard)}
                            className="mr-2"
                        />
                        <span className="flex items-center text-sm">
                            <FaSave className="mr-1" /> Save card for future payments
                        </span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={processing || !stripe}
                    className={`w-full py-2 px-4 rounded-md font-medium
                        ${processing || !stripe || !cardComplete
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 hover:bg-blue-700'
                        } text-white`}
                >
                    {processing ? 'Processing...' : buttonText}
                </button>
            </form>
        </div>
    );
};

export default StripeCardElement;