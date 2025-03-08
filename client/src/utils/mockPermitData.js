// Mock permit data for the Manage Permits page
export const mockPermits = [
    {
        id: 'P1001',
        permitNumber: 'SP2024-001',
        permitType: 'Student',
        userId: '1001',
        userFullName: 'John Doe',
        userEmail: 'john.doe@stonybrook.edu',
        lotId: 'L001',
        lotName: 'South P Lot',
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 125.00,
        paymentStatus: 'paid',
        createdAt: '2023-12-15',
        updatedAt: '2023-12-15'
    },
    {
        id: 'P1002',
        permitNumber: 'SP2024-002',
        permitType: 'Faculty',
        userId: '1003',
        userFullName: 'Robert Johnson',
        userEmail: 'robert.johnson@stonybrook.edu',
        lotId: 'L002',
        lotName: 'Faculty Lot 1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        price: 275.00,
        paymentStatus: 'paid',
        createdAt: '2023-12-10',
        updatedAt: '2023-12-10'
    },
    {
        id: 'P1003',
        permitNumber: 'SP2024-003',
        permitType: 'Student',
        userId: '1002',
        userFullName: 'Jane Smith',
        userEmail: 'jane.smith@stonybrook.edu',
        lotId: 'L001',
        lotName: 'South P Lot',
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'inactive',
        price: 125.00,
        paymentStatus: 'refunded',
        createdAt: '2023-12-12',
        updatedAt: '2024-02-15'
    },
    {
        id: 'P1004',
        permitNumber: 'SP2024-004',
        permitType: 'Faculty',
        userId: '1004',
        userFullName: 'Maria Garcia',
        userEmail: 'maria.garcia@stonybrook.edu',
        lotId: 'L002',
        lotName: 'Faculty Lot 1',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'active',
        price: 275.00,
        paymentStatus: 'paid',
        createdAt: '2023-12-11',
        updatedAt: '2023-12-11'
    },
    {
        id: 'P1005',
        permitNumber: 'SP2024-005',
        permitType: 'Student',
        userId: '1008',
        userFullName: 'Sarah Anderson',
        userEmail: 'sarah.anderson@stonybrook.edu',
        lotId: 'L003',
        lotName: 'Stadium Lot',
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 125.00,
        paymentStatus: 'paid',
        createdAt: '2023-12-14',
        updatedAt: '2023-12-14'
    },
    {
        id: 'P1006',
        permitNumber: 'SP2024-006',
        permitType: 'Faculty',
        userId: '1010',
        userFullName: 'Patricia Lee',
        userEmail: 'patricia.lee@stonybrook.edu',
        lotId: 'L004',
        lotName: 'Faculty Lot 2',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'pending',
        price: 275.00,
        paymentStatus: 'unpaid',
        createdAt: '2023-12-20',
        updatedAt: '2023-12-20'
    },
    {
        id: 'P1007',
        permitNumber: 'SP2024-007',
        permitType: 'Student',
        userId: '1009',
        userFullName: 'James Martinez',
        userEmail: 'james.martinez@stonybrook.edu',
        lotId: 'L001',
        lotName: 'South P Lot',
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 125.00,
        paymentStatus: 'paid',
        createdAt: '2023-12-16',
        updatedAt: '2023-12-16'
    },
    {
        id: 'P1008',
        permitNumber: 'SP2024-008',
        permitType: 'Visitor',
        userId: null,
        userFullName: 'Guest Access',
        userEmail: 'visitor@example.com',
        lotId: 'L005',
        lotName: 'Visitor Lot',
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        status: 'active',
        price: 30.00,
        paymentStatus: 'paid',
        createdAt: '2024-02-28',
        updatedAt: '2024-02-28'
    }
];

// Get total active permits count
export const getActivePermitsCount = () => {
    return mockPermits.filter(permit => permit.status === 'active').length;
};

// Get total lots with active permits
export const getLotsWithActivePermitsCount = () => {
    const uniqueLots = new Set(
        mockPermits
            .filter(permit => permit.status === 'active')
            .map(permit => permit.lotId)
    );
    return uniqueLots.size;
};

// Function to get permits with filtering and pagination
export const getPermits = (filters = {}, page = 1, limit = 10) => {
    let filteredPermits = [...mockPermits];

    // Apply filters
    if (filters.status) {
        filteredPermits = filteredPermits.filter(permit => permit.status === filters.status);
    }

    if (filters.permitType) {
        filteredPermits = filteredPermits.filter(permit => permit.permitType === filters.permitType);
    }

    if (filters.lotId) {
        filteredPermits = filteredPermits.filter(permit => permit.lotId === filters.lotId);
    }

    if (filters.paymentStatus) {
        filteredPermits = filteredPermits.filter(permit => permit.paymentStatus === filters.paymentStatus);
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredPermits = filteredPermits.filter(permit =>
            permit.permitNumber.toLowerCase().includes(searchLower) ||
            permit.userFullName.toLowerCase().includes(searchLower) ||
            permit.userEmail.toLowerCase().includes(searchLower) ||
            permit.lotName.toLowerCase().includes(searchLower)
        );
    }

    // Calculate pagination
    const totalPermits = filteredPermits.length;
    const totalPages = Math.ceil(totalPermits / limit);
    const offset = (page - 1) * limit;
    const paginatedPermits = filteredPermits.slice(offset, offset + limit);

    return {
        permits: paginatedPermits,
        pagination: {
            total: totalPermits,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

// Function to get a single permit by ID
export const getPermitById = (permitId) => {
    return mockPermits.find(permit => permit.id === permitId);
};

// Function to toggle permit status
export const togglePermitStatus = (permitId, newStatus) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);
    if (permitIndex !== -1) {
        mockPermits[permitIndex].status = newStatus;
        mockPermits[permitIndex].updatedAt = new Date().toISOString().split('T')[0];
        return true;
    }
    return false;
};

// Function to update permit payment status
export const updatePermitPaymentStatus = (permitId, newPaymentStatus) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);
    if (permitIndex !== -1) {
        mockPermits[permitIndex].paymentStatus = newPaymentStatus;
        mockPermits[permitIndex].updatedAt = new Date().toISOString().split('T')[0];
        return true;
    }
    return false;
};

// Function to create a new permit
export const createPermit = (permitData) => {
    const newId = `P${1000 + mockPermits.length + 1}`;
    const newPermitNumber = `SP2024-${(mockPermits.length + 1).toString().padStart(3, '0')}`;

    const newPermit = {
        id: newId,
        permitNumber: newPermitNumber,
        ...permitData,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };

    mockPermits.push(newPermit);
    return newPermit;
};

// Function to update an existing permit
export const updatePermit = (permitId, permitData) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);
    if (permitIndex !== -1) {
        mockPermits[permitIndex] = {
            ...mockPermits[permitIndex],
            ...permitData,
            updatedAt: new Date().toISOString().split('T')[0]
        };
        return mockPermits[permitIndex];
    }
    return null;
};

// Function to delete a permit
export const deletePermit = (permitId) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);
    if (permitIndex !== -1) {
        mockPermits.splice(permitIndex, 1);
        return true;
    }
    return false;
}; 