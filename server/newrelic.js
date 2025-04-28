'use strict';

// Load environment variables
require('dotenv').config();

/**
 * New Relic configuration file.
 *
 * See node_modules/newrelic/lib/config.defaults.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
    /**
     * Application name from environment variables or fallback.
     */
    app_name: [process.env.NEW_RELIC_APP_NAME || 'SBU Parking System'],

    /**
     * Your New Relic license key from environment variables.
     */
    license_key: process.env.NEW_RELIC_LICENSE_KEY || '',

    /**
     * This setting controls distributed tracing.
     */
    distributed_tracing: {
        enabled: true
    },

    /**
     * Logging settings.
     */
    logging: {
        level: process.env.NEW_RELIC_LOG_LEVEL || 'info'
    },

    /**
     * Transaction tracer settings.
     */
    transaction_tracer: {
        enabled: true
    }
}; 