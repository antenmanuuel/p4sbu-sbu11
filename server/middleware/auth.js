/**
 * This module provides middleware functions for:
 * - JWT token verification for protected routes
 * - Admin privilege validation
 * - Combined token verification and admin privilege checking
 * 
 * These middleware functions make sure secure access to API endpoints
 * based on authentication status and user roles.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware that verifies the JWT token from the request headers
 * 
 * Checks if a valid Authorization header with bearer token exists,
 * verifies the token signature, and attaches the decoded user information
 * to the request object for use in downstream route handlers.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object|void} - Returns 401 response for auth failures or calls next()
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

/**
 * Middleware that verifies if the authenticated user has admin privileges
 * 
 * Should be used after verifyToken middleware since it depends on
 * req.user being populated with the decoded token data.
 * 
 * @param {Object} req - Express request object with user property from verifyToken
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {Object|void} - Returns 403 response for non-admins or calls next()
 */
const isAdmin = (req, res, next) => {
    if (req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};

/**
 * Combined middleware array that verifies both token and admin status
 * 
 * This is a convenience export that combines verifyToken and isAdmin
 * for routes that require both authentication and admin privileges.
 * 
 * @type {Array<Function>} Array of middleware functions to be executed in sequence
 */
const verifyAdmin = [verifyToken, isAdmin];

module.exports = { verifyToken, isAdmin, verifyAdmin };