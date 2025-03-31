// Mock user data for the Manage Users page
export const mockUsers = [
    {
        id: '1001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@stonybrook.edu',
        userType: 'student',
        status: 'active',
        sbuid: '112233445',
        createdAt: '2023-09-01',
        lastLogin: '2024-03-15'
    },
    {
        id: '1002',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@stonybrook.edu',
        userType: 'student',
        status: 'active',
        sbuid: '112233446',
        createdAt: '2023-10-15',
        lastLogin: '2024-03-14'
    },
    {
        id: '1003',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'robert.johnson@stonybrook.edu',
        userType: 'faculty',
        status: 'active',
        sbuid: '112233447',
        createdAt: '2023-08-20',
        lastLogin: '2024-03-10'
    },
    {
        id: '1004',
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria.garcia@stonybrook.edu',
        userType: 'faculty',
        status: 'active',
        sbuid: '112233448',
        createdAt: '2023-07-05',
        lastLogin: '2024-03-12'
    },
    {
        id: '1005',
        firstName: 'David',
        lastName: 'Brown',
        email: 'david.brown@stonybrook.edu',
        userType: 'student',
        status: 'inactive',
        sbuid: '112233449',
        createdAt: '2023-11-10',
        lastLogin: '2024-02-01'
    },
    {
        id: '1006',
        firstName: 'Emma',
        lastName: 'Wilson',
        email: 'emma.wilson@stonybrook.edu',
        userType: 'student',
        status: 'pending',
        sbuid: '112233450',
        createdAt: '2024-03-01',
        lastLogin: null
    },
    {
        id: '1007',
        firstName: 'Michael',
        lastName: 'Taylor',
        email: 'michael.taylor@stonybrook.edu',
        userType: 'faculty',
        status: 'pending',
        sbuid: '112233451',
        createdAt: '2024-03-05',
        lastLogin: null
    },
    {
        id: '1008',
        firstName: 'Sarah',
        lastName: 'Anderson',
        email: 'sarah.anderson@stonybrook.edu',
        userType: 'student',
        status: 'active',
        sbuid: '112233452',
        createdAt: '2023-09-15',
        lastLogin: '2024-03-08'
    },
    {
        id: '1009',
        firstName: 'James',
        lastName: 'Martinez',
        email: 'james.martinez@stonybrook.edu',
        userType: 'student',
        status: 'active',
        sbuid: '112233453',
        createdAt: '2023-10-20',
        lastLogin: '2024-03-13'
    },
    {
        id: '1010',
        firstName: 'Patricia',
        lastName: 'Lee',
        email: 'patricia.lee@stonybrook.edu',
        userType: 'faculty',
        status: 'active',
        sbuid: '112233454',
        createdAt: '2023-08-10',
        lastLogin: '2024-03-09'
    },
    {
        id: '1011',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@stonybrook.edu',
        userType: 'admin',
        status: 'active',
        sbuid: '112233455',
        createdAt: '2023-01-01',
        lastLogin: '2024-03-15'
    }
];

// Function to get users with filtering and pagination
export const getUsers = (filters = {}, page = 1, limit = 10) => {
    let filteredUsers = [...mockUsers];

    // Apply filters
    if (filters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    if (filters.userType) {
        filteredUsers = filteredUsers.filter(user => user.userType === filters.userType);
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user =>
            user.firstName.toLowerCase().includes(searchLower) ||
            user.lastName.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower) ||
            user.sbuid.includes(filters.search)
        );
    }

    // Calculate pagination
    const totalUsers = filteredUsers.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = filteredUsers.slice(offset, offset + limit);

    return {
        users: paginatedUsers,
        pagination: {
            total: totalUsers,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

// Function to get a single user by ID
export const getUserById = (userId) => {
    return mockUsers.find(user => user.id === userId);
};

// Function to toggle user status
export const toggleUserStatus = (userId, newStatus) => {
    const userIndex = mockUsers.findIndex(user => user.id === userId);
    if (userIndex !== -1) {
        mockUsers[userIndex].status = newStatus;
        return true;
    }
    return false;
}; 