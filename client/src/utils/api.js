import axios from 'axios';

// Define potential server URLs to try (in order of preference)
const SERVER_URLS = [
    'http://localhost:8080/api',  // Primary port
    'http://localhost:3000/api',  // Fallback port 1
    'http://localhost:5000/api',  // Fallback port 2 (default Express port)
    'http://127.0.0.1:8080/api',  // Try with IP instead of localhost
    'http://127.0.0.1:3000/api'   // Another IP-based fallback
];

// Initialize API with first URL
const API = axios.create({
    baseURL: SERVER_URLS[0]
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
    getRevenueStats: async () => {
        try {
            const response = await API.get('/admin/statistics/revenue');
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch revenue statistics'
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
            try {
                const response = await API.delete(`/admin/permit-types/${permitTypeId}`);
                return { success: true, data: response.data };
            } catch (error) {
                return {
                    success: false,
                    error: error.response?.data?.message || 'Failed to delete permit type'
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
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to fetch your tickets'
            };
        }
    },

    // Pay a ticket
    payTicket: async (ticketId) => {
        try {
            const response = await API.post(`/user/tickets/${ticketId}/pay`);
            return { success: true, data: response.data };
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
        try {
            const response = await API.delete(`/admin/permit-types/${permitTypeId}`);
            return { success: true, data: response.data };
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Failed to delete permit type'
            };
        }
    }
};

// Lot Service for managing parking lots
export const LotService = {
    // Get all lots with filtering and pagination
    getAll: async (filters = {}, page = 1, limit = 10) => {
        try {
            let queryString = `page=${page}&limit=${limit}`;

            if (filters.search) queryString += `&search=${encodeURIComponent(filters.search)}`;
            if (filters.status) queryString += `&status=${filters.status}`;
            if (filters.permitType) queryString += `&permitType=${filters.permitType}`;
            if (filters.rateType) queryString += `&rateType=${filters.rateType}`;

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

export default API; 