// Code references sample given in Stripe API Docs and TP: ChatGPT was prompted to streamline/modify initial student-written code for this file to optimize and add descriptive comments to the code (for understanding). 

import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe outside of component to avoid recreating it on re-renders
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

/**
 * A wrapper component that provides Stripe Elements context
 * This should be used to wrap any component that needs to use Stripe
 * 
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Child components
 */
const StripeProvider = ({ children }) => {
    return (
        <Elements stripe={stripePromise}>
            {children}
        </Elements>
    );
};

export default StripeProvider; 