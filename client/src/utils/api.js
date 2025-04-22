// TP: this .js file's code was manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Students via Pair/Trio/Quartet Programming) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student changes/written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

import axios from 'axios';
import { API_URL } from './env';

// Define potential server URLs to try (in order of preference)
const SERVER_URLS = [
    API_URL,                      // Primary URL from environment
    'http://localhost:8080/api',  // Primary port
    'http://localhost:3000/api',  // Fallback port 1
    'http://localhost:5000/api',  // Fallback port 2 (default Express port)
    'http://127.0.0.1:8080/api',  // Try with IP instead of localhost
    'http://127.0.0.1:3000/api'   // Another IP-based fallback
];

// Initialize API with first URL
const API_BASE_URL = SERVER_URLS[0];

// Helper function to handle API errors
const handleApiError = (error) => {
    console.error('API Response Error:', error.response?.data || error);
    return error.response?.data?.message || error.message || 'An unexpected error occurred';
};

// Configure Axios to use the base URL and include credentials
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Try connecting to alternative URLs if the main one fails
let currentUrlIndex = 0;

// Console log the initial URL being used
console.log('Initial API URL:', API.defaults.baseURL);

const tryNextUrl = () => {
    currentUrlIndex = (currentUrlIndex + 1) % SERVER_URLS.length;
    API.defaults.baseURL = SERVER_URLS[currentUrlIndex];
    console.log(`Switching to alternative server URL (${currentUrlIndex + 1}/${SERVER_URLS.length}): ${API.defaults.baseURL}`);
    return API;
};

// Add better error handling and logging
API.interceptors.response.use(
    response => response,
    error => {
        // Log the error details for debugging
        if (error.response) {
            // The request was made and the server responded with an error status
            console.error('API Response Error:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
        } else if (error.request) {
            // The request was made but no response was received (connection issues)
            console.error('API Connection Error:', {
                request: error.request,
                message: 'No response received. Check if server is running.'
            });

            // If we get a connection error and have more URLs to try
            if (SERVER_URLS.length > 1 && error.message.includes('Network Error')) {
                console.log(`Connection failed to ${API.defaults.baseURL}. Trying next server...`);
                return tryNextUrl().request(error.config);
            }
        } else {
            // Something happened in setting up the request
            console.error('API Request Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Add token to request headers if available
API.interceptors.request.use(config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`Making ${config.method.toUpperCase()} request to: ${config.url}`);
    return config;
});

// Authentication Service
export const AuthService = {
    // Register a new user
    register: async (userData) => {
        try {
            const response = await API.post('/register', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Registration failed'
            };
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            console.log('Attempting to login with:', credentials.email);
            const response = await API.post('/login', credentials);
            console.log('Login response received:', response.data);

            // Store token in localStorage
            if (response.data.token) {
                console.log('Auth token received, saving to localStorage');
                localStorage.setItem('auth_token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));

                // Log the user type for debugging
                console.log('User type:', response.data.user.userType);
            } else {
                console.warn('No auth token received in the response');
            }

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Login error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });

            return {
                success: false,
                error: error.response?.data?.message || 'Login failed'
            };
        }
    },

    // Request a password reset (forgot password)
    requestPasswordReset: async (email) => {
        try {
            const response = await API.post('/forgot-password', { email });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to request password reset'
            };
        }
    },

    // Reset password using token from email
    resetPassword: async (token, newPassword) => {
        try {
            const response = await API.post('/reset-password', { token, password: newPassword });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to reset password'
            };
        }
    },

    // Logout user
    logout: () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        return { success: true };
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        const token = localStorage.getItem('auth_token');
        return !!token;
    },

    // Get current user info
    getCurrentUser: () => {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};

// User Service for profile and user-related operations
export const UserService = {
    // Get user profile
    getProfile: async () => {
        try {
            const response = await API.get('/user/profile');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch profile'
            };
        }
    },

    // Update user profile - can be expanded later
    updateProfile: async (userData) => {
        try {
            const response = await API.put('/user/profile', userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update profile'
            };
        }
    },

    // Change user password
    changePassword: async (passwordData) => {
        try {
            const response = await API.put('/user/change-password', passwordData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to change password'
            };
        }
    },

    // Get user activity history
    getActivityHistory: async () => {
        try {
            const response = await API.get('/user/activity');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch activity history'
            };
        }
    },

    // Get user billing history
    getBillingHistory: async () => {
        try {
            const response = await API.get('/user/billing-history');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch billing history'
            };
        }
    }
};

// Admin Service
export const AdminService = {
    // Get all users with filtering and pagination
    getUsers: async (filters = {}, page = 1, limit = 10) => {
        try {
            const { status, userType, search } = filters;
            let queryString = `page=${page}&limit=${limit}`;

            if (status) queryString += `&status=${status}`;
            if (userType) queryString += `&userType=${userType}`;
            if (search) queryString += `&search=${encodeURIComponent(search)}`;

            const response = await API.get(`/admin/users?${queryString}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch users'
            };
        }
    },

    // Get all reservations (admin only) with filtering and pagination
    getAllReservations: async (filters = {}, page = 1, limit = 10) => {
        try {
            const { status, startDate, endDate, userId, search } = filters;
            let queryString = `page=${page}&limit=${limit}`;

            if (status) queryString += `&status=${status}`;
            if (startDate) queryString += `&startDate=${startDate}`;
            if (endDate) queryString += `&endDate=${endDate}`;
            if (userId) queryString += `&userId=${userId}`;
            if (search) queryString += `&search=${encodeURIComponent(search)}`;

            const response = await API.get(`/admin/reservations?${queryString}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch reservations'
            };
        }
    },

    // Get active reservations count
    getActiveReservationsCount: async () => {
        try {
            const response = await API.get('/admin/reservations/count?status=active');
            return {
                success: true,
                count: response.data.count || 0
            };
        } catch (error) {
            console.error('Error fetching active reservations count:', error);
            return {
                success: false,
                count: 0,
                error: error.response?.data?.message || 'Failed to fetch active reservations count'
            };
        }
    },

    // Get user by ID
    getUserById: async (userId) => {
        try {
            const response = await API.get(`/admin/users/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch user'
            };
        }
    },

    // Update user
    updateUser: async (userId, userData) => {
        try {
            const response = await API.put(`/admin/users/${userId}`, userData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update user'
            };
        }
    },

    // Toggle user status (active/inactive)
    toggleUserStatus: async (userId, status) => {
        try {
            const response = await API.put(`/admin/users/${userId}/toggle-status`, { status });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to toggle user status'
            };
        }
    },

    // Delete user
    deleteUser: async (userId) => {
        try {
            const response = await API.delete(`/admin/users/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete user'
            };
        }
    },

    // Get pending users
    getPendingUsers: async () => {
        try {
            const response = await API.get('/admin/pending-users');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch pending users'
            };
        }
    },

    // Approve a user
    approveUser: async (userId) => {
        try {
            const response = await API.put(`/admin/approve-user/${userId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to approve user'
            };
        }
    },

    // Get revenue statistics
    getRevenueStatistics: async () => {
        try {
            const response = await API.get('/statistics/revenue');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Revenue statistics endpoint failed:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch revenue statistics',
                data: []
            };
        }
    },

    // Download revenue statistics as PDF
    downloadRevenueReportPDF: async (months = 12) => {
        try {
            // Use axios directly to get the response as a blob
            const response = await API.get(`/statistics/revenue/report/pdf?months=${months}`, {
                responseType: 'blob'
            });

            // Create a download link and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().split('T')[0];
            link.href = url;
            link.setAttribute('download', `revenue_report_${timestamp}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return { success: true };
        } catch (error) {
            console.error('Failed to download PDF report:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to download PDF report'
            };
        }
    },

    // Download revenue statistics as CSV
    downloadRevenueReportCSV: async (months = 12) => {
        try {
            // Use axios directly to get the response as a blob
            const response = await API.get(`/statistics/revenue/report/csv?months=${months}`, {
                responseType: 'blob'
            });

            // Create a download link and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().split('T')[0];
            link.href = url;
            link.setAttribute('download', `revenue_report_${timestamp}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            return { success: true };
        } catch (error) {
            console.error('Failed to download CSV report:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to download CSV report'
            };
        }
    },

    // Get lots with filtering and pagination
    getLots: async (filters = {}, page = 1, limit = 10) => {
        try {
            // Reuse the LotService getAll method
            return await LotService.getAll(filters, page, limit);
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch lots'
            };
        }
    },

    // Permit Type operations
    permitTypes: {
        // Get all permit types with pagination and filtering
        getAll: async (filters = {}, page = 1, limit = 10) => {
            try {
                let queryString = `page=${page}&limit=${limit}`;
                if (filters.category) queryString += `&category=${filters.category}`;
                if (filters.duration) queryString += `&duration=${filters.duration}`;
                if (filters.search) queryString += `&search=${encodeURIComponent(filters.search)}`;

                const response = await API.get(`/admin/permit-types?${queryString}`);
                return { success: true, data: response.data };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to fetch permit types'
                };
            }
        },

        // Get a single permit type by ID
        getById: async (permitTypeId) => {
            try {
                const response = await API.get(`/admin/permit-types/${permitTypeId}`);
                return { success: true, data: response.data };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to fetch permit type'
                };
            }
        },

        // Create a new permit type
        create: async (permitTypeData) => {
            try {
                const response = await API.post('/admin/permit-types', permitTypeData);
                return { success: true, data: response.data };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to create permit type'
                };
            }
        },

        // Update an existing permit type
        update: async (permitTypeId, permitTypeData) => {
            try {
                const response = await API.put(`/admin/permit-types/${permitTypeId}`, permitTypeData);
                return { success: true, data: response.data };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to update permit type'
                };
            }
        },

        // Delete a permit type
        delete: async (permitTypeId) => {
            if (!permitTypeId) {
                console.error('Attempt to delete permit type with missing ID');
                return {
                    success: false,
                    error: 'Permit type ID is required'
                };
            }
            try {
                console.log('Deleting permit type with ID:', permitTypeId);
                await API.delete(`/admin/permit-types/${permitTypeId}`);
                return { success: true };
            } catch (error) {
                console.error('Error deleting permit type:', error.response?.data || error.message);
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to delete permit type',
                };
            }
        }
    }
};

// Ticket Service for managing fines/tickets
export const TicketService = {
    // Get all tickets with filtering and pagination (admin)
    getTickets: async (filters = {}, page = 1, limit = 10) => {
        try {
            const { userId, isPaid } = filters;
            let queryString = `page=${page}&limit=${limit}`;

            if (userId) queryString += `&userId=${userId}`;
            if (isPaid !== undefined) queryString += `&isPaid=${isPaid}`;

            const response = await API.get(`/admin/tickets?${queryString}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch tickets'
            };
        }
    },

    // Get tickets for current user (student/faculty)
    getUserTickets: async () => {
        try {
            const response = await API.get('/user/tickets');
            console.log('Raw ticket response:', response);

            // Handle different response formats
            // Server might return array directly or wrapped in data object
            let ticketsData;
            if (Array.isArray(response.data)) {
                ticketsData = response.data;
            } else if (response.data && response.data.tickets) {
                ticketsData = response.data.tickets;
            } else if (response.data) {
                ticketsData = Array.isArray(response.data) ? response.data : [];
            } else {
                ticketsData = [];
            }

            return {
                success: true,
                data: ticketsData
            };
        } catch (error) {
            console.error('Error fetching tickets:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch your tickets'
            };
        }
    },

    // Pay a ticket
    payTicket: async (ticketId, paymentData = {}) => {
        try {
            const response = await API.post(`/user/tickets/${ticketId}/pay`, paymentData);
            return response.data;
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to process payment'
            };
        }
    },

    // Get ticket by ID
    getTicketById: async (ticketId) => {
        try {
            const response = await API.get(`/admin/tickets/${ticketId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch ticket'
            };
        }
    },

    // Create a new ticket (issue fine)
    createTicket: async (ticketData) => {
        try {
            const response = await API.post('/admin/tickets', ticketData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create ticket'
            };
        }
    },

    // Update an existing ticket
    updateTicket: async (ticketId, ticketData) => {
        try {
            const response = await API.put(`/admin/tickets/${ticketId}`, ticketData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update ticket'
            };
        }
    },

    // Delete a ticket
    deleteTicket: async (ticketId) => {
        try {
            const response = await API.delete(`/admin/tickets/${ticketId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete ticket'
            };
        }
    }
};


// Standalone Permit Type Service
export const PermitTypeService = {
    // used by ManagePermitTypes
    getPermitTypes: async (queryParams = {}) => {
        try {
            const response = await API.get('/permit-types', { params: queryParams });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch permit types',
            };
        }
    },

    // Get all publicly available permit types (no admin authorization required)
    getAllPublicPermitTypes: async () => {
        try {
            const response = await API.get('/permit-types/public');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching public permit types:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch permit types',
            };
        }
    },

    createPermitType: async (permitData) => {
        try {
            const response = await API.post('/permit-types', permitData);
            return { success: true, data: response.data.permitType };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create permit type',
            };
        }
    },

    updatePermitType: async (permitId, permitData) => {
        try {
            const response = await API.put(`/permit-types/${permitId}`, permitData);
            return { success: true, data: response.data.permitType };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update permit type',
            };
        }
    },

    deletePermitType: async (permitId) => {
        if (!permitId) {
            console.error('Attempt to delete permit type with missing ID');
            return {
                success: false,
                error: 'Permit type ID is required'
            };
        }
        try {
            console.log('Deleting permit type with ID:', permitId);
            await API.delete(`/permit-types/${permitId}`);
            return { success: true };
        } catch (error) {
            console.error('Error deleting permit type:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete permit type',
            };
        }
    },
    // Get all permit types with pagination and filtering
    getAll: async (filters = {}, page = 1, limit = 10) => {
        try {
            let queryString = `page=${page}&limit=${limit}`;
            if (filters.category) queryString += `&category=${filters.category}`;
            if (filters.duration) queryString += `&duration=${filters.duration}`;
            if (filters.search) queryString += `&search=${encodeURIComponent(filters.search)}`;

            const response = await API.get(`/admin/permit-types?${queryString}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch permit types'
            };
        }
    },

    // Get a single permit type by ID
    getById: async (permitTypeId) => {
        try {
            const response = await API.get(`/admin/permit-types/${permitTypeId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch permit type'
            };
        }
    },

    // Create a new permit type
    create: async (permitTypeData) => {
        try {
            const response = await API.post('/admin/permit-types', permitTypeData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create permit type'
            };
        }
    },

    // Update an existing permit type
    update: async (permitTypeId, permitTypeData) => {
        try {
            const response = await API.put(`/admin/permit-types/${permitTypeId}`, permitTypeData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update permit type'
            };
        }
    },

    // Delete a permit
    delete: async (permitId) => {
        if (!permitId) {
            throw new Error('Permit ID is required');
        }
        try {
            const response = await API.delete(`/permits/${permitId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting permit:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to delete permit');
        }
    }
};

// Lot Service for managing parking lots
export const LotService = {
    // used by ManagePermitTypes
    getLots: async () => {
        try {
            const response = await API.get('/lot');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch lots',
            };
        }
    },

    // Get all lots with filtering and pagination
    getAll: async (filters = {}, page = 1, limit = 10) => {
        try {
            let queryString = `page=${page}&limit=${limit}`;

            if (filters.search) queryString += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.status) queryString += `&status=${filters.status}`;
            if (filters.permitType) queryString += `&permitType=${filters.permitType}`;
            if (filters.rateType) queryString += `&rateType=${filters.rateType}`;
            if (filters.userType) queryString += `&userType=${filters.userType}`;

            const response = await API.get(`/lots?${queryString}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch parking lots'
            };
        }
    },

    // Get a single lot by ID
    getById: async (lotId) => {
        try {
            const response = await API.get(`/lots/${lotId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch parking lot'
            };
        }
    },

    // Create a new parking lot
    create: async (lotData) => {
        try {
            const response = await API.post('/lots', lotData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create parking lot'
            };
        }
    },

    // Update an existing parking lot
    update: async (lotId, lotData) => {
        try {
            // Extract only the fields we want to update to avoid validation issues with other fields
            const {
                name,
                address,
                description,
                hourlyRate,
                semesterRate,
                rateType,
                permitTypes,
                features,
                status,
                totalSpaces,
                availableSpaces
            } = lotData;

            // Create an object with only the fields we want to update
            const updateData = {
                name,
                address,
                description,
                hourlyRate,
                semesterRate,
                rateType,
                permitTypes,
                features,
                status,
                totalSpaces,
                availableSpaces
            };

            // Only include location if it's being updated
            if (lotData.location) {
                updateData.location = lotData.location;
            }

            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${API.defaults.baseURL}/lots/${lotId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updateData)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error updating lot:', error);
            return { success: false, error: 'Failed to update lot' };
        }
    },

    // Update lot status
    updateStatus: async (lotId, status) => {
        try {
            const response = await API.patch(`/lots/${lotId}/status`, { status });
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update lot status'
            };
        }
    },

    // Delete a parking lot
    delete: async (lotId) => {
        try {
            const response = await API.delete(`/lots/${lotId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete parking lot'
            };
        }
    }
};

// Reservation Service for booking and managing parking spots
export const ReservationService = {
    // Create a new reservation
    createReservation: async (reservationData) => {
        try {
            const response = await API.post('/reservations', reservationData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to create reservation'
            };
        }
    },

    // Get all reservations for the current user
    getUserReservations: async (filters = {}) => {
        try {
            let queryString = '';
            if (Object.keys(filters).length > 0) {
                queryString = '?' + new URLSearchParams(filters).toString();
            }

            console.log(`Fetching reservations with URL: ${API.defaults.baseURL}/reservations${queryString}`);
            console.log('Auth token present:', !!localStorage.getItem('auth_token'));
            console.log('Using filters:', filters);

            const response = await API.get(`/reservations${queryString}`);
            console.log('Reservations response data:', response.data);

            // Additional diagnostic logging
            if (response.data && response.data.data && response.data.data.reservations) {
                console.log('Number of reservations:', response.data.data.reservations.length);
                response.data.data.reservations.forEach((res, idx) => {
                    console.log(`Reservation ${idx + 1}:`, {
                        id: res.reservationId || res._id,
                        status: res.status,
                        startTime: res.startTime,
                        endTime: res.endTime,
                        lotName: res.lotId?.name || 'Unknown'
                    });
                });
            } else {
                console.log('Reservation data missing or in unexpected format');
            }

            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching reservations:', error);
            console.error('Response details:', error.response?.data);
            console.error('Request details:', error.request);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch reservations'
            };
        }
    },

    // Get a specific reservation by ID
    getReservationById: async (reservationId) => {
        try {
            const response = await API.get(`/reservations/${reservationId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch reservation'
            };
        }
    },

    // Update a reservation (extend time, change status, etc.)
    updateReservation: async (reservationId, updateData) => {
        try {
            const response = await API.put(`/reservations/${reservationId}`, updateData);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to update reservation'
            };
        }
    },

    // Cancel a reservation
    cancelReservation: async (reservationId, reason = '') => {
        try {
            const response = await API.post(`/reservations/${reservationId}/cancel`, { reason });

            // Log refund information if available
            if (response.data.data && response.data.data.refund) {
                console.log('Refund processed:', response.data.data.refund);
            }

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to cancel reservation'
            };
        }
    },

    // Extend a reservation's time
    extendReservation: async (reservationId, additionalHours, paymentMethodId = null, isMetered = false) => {
        try {
            const payload = {
                additionalHours,
                isMetered
            };

            // Add payment method if provided
            if (paymentMethodId) {
                payload.paymentMethodId = paymentMethodId;
            }

            const response = await API.post(`/reservations/${reservationId}/extend`, payload);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to extend reservation'
            };
        }
    }
};

// Permit Service for managing permits
export const PermitService = {
    getAll: async (filters = {}, page = 1, limit = 10) => {
        try {
            // Build query parameters
            let queryString = `page=${page}&limit=${limit}`;

            if (filters.status) queryString += `&status=${filters.status}`;
            if (filters.permitType) queryString += `&permitType=${filters.permitType}`;
            if (filters.paymentStatus) queryString += `&paymentStatus=${filters.paymentStatus}`;
            if (filters.search) queryString += `&search=${encodeURIComponent(filters.search)}`;

            const response = await API.get(`/permits?${queryString}`);

            return {
                success: true,
                permits: response.data.permits,
                pagination: response.data.pagination
            };
        } catch (error) {
            console.error('Error in PermitService.getAll:', error);
            return {
                success: false,
                error: 'An unexpected error occurred while fetching permits'
            };
        }
    },

    getActiveCount: async () => {
        try {
            // We only need to know if permits exist with status=active, so limit=1 is sufficient
            const response = await API.get(`/permits?status=active&limit=1`);

            return {
                success: true,
                count: response.data.pagination.total || 0
            };
        } catch (error) {
            console.error('Error in PermitService.getActiveCount:', error);
            return {
                success: false,
                count: 0,
                error: 'An unexpected error occurred while fetching active permits count'
            };
        }
    },

    // Get a single permit by ID
    getById: async (permitId) => {
        try {
            const response = await API.get(`/permits/${permitId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch permit'
            };
        }
    },

    // Update a permit
    update: async (permitId, permitData) => {
        try {
            console.log('Updating permit with ID:', permitId);
            console.log('Update data:', permitData);
            const response = await API.put(`/permits/${permitId}`, permitData);
            return {
                success: true,
                permit: response.data.permit
            };
        } catch (error) {
            console.error('Error updating permit:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to update permit');
        }
    },

    // Delete a permit
    delete: async (permitId) => {
        if (!permitId) {
            throw new Error('Permit ID is required');
        }
        try {
            const response = await API.delete(`/permits/${permitId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting permit:', error);
            throw new Error(error.response?.data?.message || error.message || 'Failed to delete permit');
        }
    },

    // Get permits for the current user
    getUserPermits: async (status = 'active') => {
        try {
            console.log('Fetching user permits');

            // Get the current user from localStorage
            const user = AuthService.getCurrentUser();
            if (!user) {
                console.error('No user found in localStorage');
                return {
                    success: false,
                    error: 'User not authenticated'
                };
            }

            console.log('Fetching permits for user ID:', user.id || user._id);

            // Use the standard permits endpoint with a filter for the current user
            const response = await API.get(`/permits?status=${status}&userId=${user.id || user._id}`);
            console.log('User permits response:', response.data);

            return {
                success: true,
                permits: response.data.permits || [],
                pagination: response.data.pagination
            };
        } catch (error) {
            console.error('Error fetching user permits:', error);
            console.error('Response details:', error.response?.data);
            console.error('Request details:', error.request);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch user permits'
            };
        }
    },

    // Get past permits for the current user
    getUserPastPermits: async () => {
        try {
            console.log('Fetching user past permits');

            // Get the current user from localStorage
            const user = AuthService.getCurrentUser();
            if (!user) {
                console.error('No user found in localStorage');
                return {
                    success: false,
                    error: 'User not authenticated'
                };
            }

            const userId = user.id || user._id;

            // Use the standard permits endpoint but filter for inactive/expired permits
            // We're querying permits with specific statuses (inactive, expired) or those that have ended
            const response = await API.get(`/permits?userId=${userId}`);

            // Filter on client side to get past permits (inactive or endDate in the past)
            const allPermits = response.data.permits || [];
            const now = new Date();
            const pastPermits = allPermits.filter(permit => {
                const isExpired = new Date(permit.endDate) < now;
                return permit.status === 'inactive' || isExpired;
            });

            // Update status to "Expired" for permits that have passed their end date
            const updatedPastPermits = pastPermits.map(permit => {
                if (new Date(permit.endDate) < now && permit.status === 'active') {
                    return { ...permit, status: 'expired' };
                }
                return permit;
            });

            console.log('User past permits:', updatedPastPermits);

            return {
                success: true,
                permits: updatedPastPermits
            };
        } catch (error) {
            console.error('Error fetching user past permits:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch past permits'
            };
        }
    }
};

// Car Service for managing user's vehicles
export const CarService = {
    // Get all cars for the current user
    getUserCars: async () => {
        try {
            const response = await API.get('/cars');
            return {
                success: true,
                cars: response.data.cars
            };
        } catch (error) {
            console.error('Error fetching user cars:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch cars'
            };
        }
    },

    // Save a new car
    saveCar: async (carData) => {
        try {
            // Remove isPrimary if it exists in carData
            const { isPrimary: _, ...carDataWithoutPrimary } = carData;

            const response = await API.post('/cars', carDataWithoutPrimary);
            return {
                success: true,
                car: response.data.data.car
            };
        } catch (error) {
            console.error('Error saving car:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to save car'
            };
        }
    },

    // Update an existing car
    updateCar: async (carId, carData) => {
        try {
            // Remove isPrimary if it exists in carData
            const { isPrimary: _, ...carDataWithoutPrimary } = carData;

            const response = await API.put(`/cars/${carId}`, carDataWithoutPrimary);
            return {
                success: true,
                car: response.data.data.car
            };
        } catch (error) {
            console.error('Error updating car:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to update car'
            };
        }
    },

    // Delete a car
    deleteCar: async (carId) => {
        try {
            await API.delete(`/cars/${carId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('Error deleting car:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to delete car'
            };
        }
    }
};

// Payment Method Service for managing saved payment methods
export const PaymentMethodService = {
    // Get all saved payment methods for the current user
    getSavedPaymentMethods: async () => {
        try {
            const response = await API.get('/user/payment-methods');
            return {
                success: true,
                paymentMethods: response.data.paymentMethods || []
            };
        } catch (error) {
            console.error('Error fetching saved payment methods:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to fetch payment methods'
            };
        }
    },

    // Save a payment method for future use
    savePaymentMethod: async (paymentMethodId, isDefault = false) => {
        try {
            const response = await API.post('/user/payment-methods', {
                paymentMethodId,
                isDefault
            });
            return {
                success: true,
                paymentMethod: response.data.paymentMethod
            };
        } catch (error) {
            console.error('Error saving payment method:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to save payment method'
            };
        }
    },

    // Delete a saved payment method
    deletePaymentMethod: async (paymentMethodId) => {
        try {
            await API.delete(`/user/payment-methods/${paymentMethodId}`);
            return {
                success: true
            };
        } catch (error) {
            console.error('Error deleting payment method:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to delete payment method'
            };
        }
    },

    // Set a payment method as default
    setDefaultPaymentMethod: async (paymentMethodId) => {
        try {
            const response = await API.put(`/user/payment-methods/${paymentMethodId}/default`);
            return {
                success: true,
                paymentMethod: response.data.paymentMethod
            };
        } catch (error) {
            console.error('Error setting default payment method:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Failed to set default payment method'
            };
        }
    }
};

// Notification Service for user notifications
export const NotificationService = {
    // Get user notifications
    getNotifications: async (limit = 10, unreadOnly = false, skip = 0) => {
        try {
            const response = await API.get(`/user/notifications?limit=${limit}&unreadOnly=${unreadOnly}&skip=${skip}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching notifications:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch notifications'
            };
        }
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        try {
            const response = await API.put(`/user/notifications/${notificationId}/read`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to mark notification as read'
            };
        }
    },

    // Mark all notifications as read
    markAllAsRead: async () => {
        try {
            const response = await API.put('/user/notifications/read-all');
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to mark all notifications as read'
            };
        }
    },

    // Delete a notification
    deleteNotification: async (notificationId) => {
        try {
            const response = await API.delete(`/user/notifications/${notificationId}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error deleting notification:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete notification'
            };
        }
    }
};

export default API; 