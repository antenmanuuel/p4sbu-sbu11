// TP: ChatGPT was prompted to add descriptive comments to code to improve understanding and readability. 

// Don't need to import process for Vite
/**
 * Environment variable utility for the application
 * This helps handle environment variables in a safe way
 */

// Helper function to get environment variables safely
const getEnv = (key, defaultValue = '') => {
    // Check for window._env_ (runtime injected variables)
    if (window._env_ && window._env_[key]) {
        return window._env_[key];
    }

    // Check for import.meta.env (Vite's way of accessing env variables)
    const viteKey = `VITE_${key}`;
    if (import.meta.env[viteKey]) {
        return import.meta.env[viteKey];
    }

    // Return default value if not found
    return defaultValue;
};

// Export common environment variables used in the app
// Using direct access to Vite environment variables to ensure we have the token
export const MAPBOX_TOKEN = import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN || '';
// change made 4/6/2025 for API_URL 
export const API_URL = import.meta.env.VITE_REACT_APP_API_URL || 'http://localhost:8080/api';

// Log token for debugging (truncated for security)
if (MAPBOX_TOKEN) {
    console.log(`Mapbox token available: ${MAPBOX_TOKEN.substring(0, 8)}...`);
} else {
    console.warn('Mapbox token is missing or empty');
}

// Export utility function
export default getEnv; 