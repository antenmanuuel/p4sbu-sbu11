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
export const MAPBOX_TOKEN = getEnv('REACT_APP_MAPBOX_TOKEN');
export const API_URL = getEnv('REACT_APP_API_URL', 'http://localhost:5000/api');

// Export utility function
export default getEnv; 