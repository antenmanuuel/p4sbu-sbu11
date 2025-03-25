// Mock permit data for the Manage Permits page
export const mockPermits = [
    {
        id: 'P1001',
        permitNumber: 'SP2024-001',
        permitName: 'Student Semester Permit',
        permitType: 'Student',
        userId: '1001',
        userFullName: 'John Doe',
        userEmail: 'john.doe@stonybrook.edu',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 125.00,
        paymentStatus: 'paid',
        paymentId: 'PAY001',
        permitTypeId: 'PT001',
        createdAt: '2023-12-15',
        updatedAt: '2023-12-15'
    },
    {
        id: 'P1002',
        permitNumber: 'SP2024-002',
        permitName: 'Faculty Semester Permit',
        permitType: 'Faculty',
        userId: '1003',
        userFullName: 'Robert Johnson',
        userEmail: 'robert.johnson@stonybrook.edu',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' },
            { lotId: 'L004', lotName: 'Faculty Lot 2' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 275.00,
        paymentStatus: 'paid',
        paymentId: 'PAY003',
        permitTypeId: 'PT003',
        createdAt: '2023-12-10',
        updatedAt: '2023-12-10'
    },
    {
        id: 'P1003',
        permitNumber: 'SP2024-003',
        permitName: 'Student Semester Permit',
        permitType: 'Student',
        userId: '1002',
        userFullName: 'Jane Smith',
        userEmail: 'jane.smith@stonybrook.edu',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'inactive',
        price: 125.00,
        paymentStatus: 'refunded',
        paymentId: 'PAY002',
        permitTypeId: 'PT001',
        createdAt: '2023-12-12',
        updatedAt: '2024-02-15'
    },
    {
        id: 'P1004',
        permitNumber: 'SP2024-004',
        permitName: 'Faculty Single Lot Semester Permit',
        permitType: 'Faculty',
        userId: '1004',
        userFullName: 'Maria Garcia',
        userEmail: 'maria.garcia@stonybrook.edu',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 275.00,
        paymentStatus: 'paid',
        paymentId: 'PAY004',
        permitTypeId: 'PT004',
        createdAt: '2023-12-11',
        updatedAt: '2023-12-11'
    },
    {
        id: 'P1005',
        permitNumber: 'SP2024-005',
        permitName: 'Student Stadium Permit',
        permitType: 'Student',
        userId: '1008',
        userFullName: 'Sarah Anderson',
        userEmail: 'sarah.anderson@stonybrook.edu',
        lots: [
            { lotId: 'L003', lotName: 'Stadium Lot' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 125.00,
        paymentStatus: 'paid',
        paymentId: 'PAY005',
        permitTypeId: 'PT002',
        createdAt: '2023-12-14',
        updatedAt: '2023-12-14'
    },
    {
        id: 'P1006',
        permitNumber: 'SP2024-006',
        permitName: 'Faculty Semester Permit',
        permitType: 'Faculty',
        userId: '1010',
        userFullName: 'Patricia Lee',
        userEmail: 'patricia.lee@stonybrook.edu',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' },
            { lotId: 'L004', lotName: 'Faculty Lot 2' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'pending',
        price: 275.00,
        paymentStatus: 'unpaid',
        paymentId: 'PAY006',
        permitTypeId: 'PT003',
        createdAt: '2023-12-20',
        updatedAt: '2023-12-20'
    },
    {
        id: 'P1007',
        permitNumber: 'SP2024-007',
        permitName: 'Staff Semester Permit',
        permitType: 'Staff',
        userId: '1009',
        userFullName: 'James Martinez',
        userEmail: 'james.martinez@stonybrook.edu',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' },
            { lotId: 'L004', lotName: 'Faculty Lot 2' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 250.00,
        paymentStatus: 'paid',
        paymentId: 'PAY007',
        permitTypeId: 'PT005',
        createdAt: '2023-12-16',
        updatedAt: '2023-12-16'
    },
    {
        id: 'P1008',
        permitNumber: 'SP2024-008',
        permitName: 'Visitor Semester Permit',
        permitType: 'Visitor',
        userId: null,
        userFullName: 'Guest Access',
        userEmail: 'visitor@example.com',
        lots: [
            { lotId: 'L005', lotName: 'Visitor Lot' }
        ],
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        status: 'active',
        price: 30.00,
        paymentStatus: 'paid',
        paymentId: 'PAY008',
        permitTypeId: 'PT006',
        createdAt: '2024-02-28',
        updatedAt: '2024-02-28'
    },
    {
        id: 'P1009',
        permitNumber: 'SP2024-009',
        permitName: 'Summer Semester Permit',
        permitType: 'Student',
        userId: '1005',
        userFullName: 'Michael Brown',
        userEmail: 'michael.brown@stonybrook.edu',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' },
            { lotId: 'L003', lotName: 'Stadium Lot' }
        ],
        startDate: '2024-06-01',
        endDate: '2024-08-15',
        status: 'active',
        price: 90.00,
        paymentStatus: 'paid',
        paymentId: 'PAY009',
        permitTypeId: 'PT007',
        createdAt: '2024-03-15',
        updatedAt: '2024-03-15'
    },
    {
        id: 'P1010',
        permitNumber: 'SP2024-010',
        permitName: 'Fall Semester Permit',
        permitType: 'Student',
        userId: '1006',
        userFullName: 'Emily Wilson',
        userEmail: 'emily.wilson@stonybrook.edu',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' }
        ],
        startDate: '2024-08-20',
        endDate: '2024-12-20',
        status: 'pending',
        price: 125.00,
        paymentStatus: 'unpaid',
        paymentId: null,
        permitTypeId: 'PT008',
        createdAt: '2024-03-20',
        updatedAt: '2024-03-20'
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
            .map(permit => permit.lots.map(lot => lot.lotId).join(','))
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
        filteredPermits = filteredPermits.filter(permit => permit.lots.some(lot => lot.lotId === filters.lotId));
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
            permit.lots.some(lot => lot.lotName.toLowerCase().includes(searchLower))
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
    // Generate a new permit ID
    const lastPermitId = parseInt(mockPermits[mockPermits.length - 1].id.substring(1));
    const newPermitId = `P${lastPermitId + 1}`;

    // Generate a permit number (in a real app, this might follow a specific pattern)
    const newPermitNumber = `SP${new Date().getFullYear()}-${String(mockPermits.length + 1).padStart(3, '0')}`;

    // Get permit type details if permitTypeId is provided
    let permitTypeDetails = null;
    if (permitData.permitTypeId) {
        permitTypeDetails = getPermitTypeById(permitData.permitTypeId);

        // Ensure there are still permits available
        if (permitTypeDetails && permitTypeDetails.quantity <= 0) {
            throw new Error(`No more ${permitTypeDetails.name} permits available`);
        }

        // Decrease the permit type quantity
        if (permitTypeDetails) {
            updatePermitType(permitTypeDetails.id, {
                ...permitTypeDetails,
                quantity: permitTypeDetails.quantity - 1
            });
        }
    }

    // Create the new permit object
    const newPermit = {
        id: newPermitId,
        permitNumber: newPermitNumber,
        permitName: permitTypeDetails ? permitTypeDetails.name : permitData.permitName,
        permitType: permitTypeDetails ? permitTypeDetails.category : permitData.permitType,
        userId: permitData.userId,
        userFullName: permitData.userFullName,
        userEmail: permitData.userEmail,
        lots: permitTypeDetails ? permitTypeDetails.lots : permitData.lots,
        startDate: permitData.startDate,
        endDate: permitData.endDate,
        status: permitData.status || 'pending',
        price: permitTypeDetails ? permitTypeDetails.price : permitData.price,
        paymentStatus: permitData.paymentStatus || 'unpaid',
        paymentId: permitData.paymentId,
        permitTypeId: permitData.permitTypeId,
        createdAt: new Date().toISOString().split('T')[0],
    };

    // Add the new permit to the mock data
    mockPermits.push(newPermit);

    return newPermit;
};

// Function to update a permit
export const updatePermit = (permitId, updateData) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);

    if (permitIndex === -1) {
        return false;
    }

    const oldPermitTypeId = mockPermits[permitIndex].permitTypeId;
    const newPermitTypeId = updateData.permitTypeId;

    // Get permit type details if permitTypeId is provided
    let permitTypeDetails = null;
    if (updateData.permitTypeId) {
        permitTypeDetails = getPermitTypeById(updateData.permitTypeId);

        // If permit type is being changed, handle quantity adjustments
        if (oldPermitTypeId !== newPermitTypeId) {
            // Ensure new permit type has available permits
            if (permitTypeDetails && permitTypeDetails.quantity <= 0) {
                throw new Error(`No more ${permitTypeDetails.name} permits available`);
            }

            // Increase quantity of old permit type (if valid)
            if (oldPermitTypeId) {
                const oldPermitType = getPermitTypeById(oldPermitTypeId);
                if (oldPermitType) {
                    updatePermitType(oldPermitTypeId, {
                        ...oldPermitType,
                        quantity: oldPermitType.quantity + 1
                    });
                }
            }

            // Decrease quantity of new permit type
            if (permitTypeDetails) {
                updatePermitType(permitTypeDetails.id, {
                    ...permitTypeDetails,
                    quantity: permitTypeDetails.quantity - 1
                });
            }
        }
    }

    // Update the permit
    mockPermits[permitIndex] = {
        ...mockPermits[permitIndex],
        permitName: permitTypeDetails ? permitTypeDetails.name : (updateData.permitName || mockPermits[permitIndex].permitName),
        permitType: permitTypeDetails ? permitTypeDetails.category : (updateData.permitType || mockPermits[permitIndex].permitType),
        userId: updateData.userId || mockPermits[permitIndex].userId,
        userFullName: updateData.userFullName || mockPermits[permitIndex].userFullName,
        userEmail: updateData.userEmail || mockPermits[permitIndex].userEmail,
        lots: permitTypeDetails ? permitTypeDetails.lots : (updateData.lots || mockPermits[permitIndex].lots),
        startDate: updateData.startDate || mockPermits[permitIndex].startDate,
        endDate: updateData.endDate || mockPermits[permitIndex].endDate,
        status: updateData.status || mockPermits[permitIndex].status,
        price: permitTypeDetails ? permitTypeDetails.price : (updateData.price || mockPermits[permitIndex].price),
        paymentStatus: updateData.paymentStatus || mockPermits[permitIndex].paymentStatus,
        paymentId: updateData.paymentId || mockPermits[permitIndex].paymentId,
        permitTypeId: updateData.permitTypeId || mockPermits[permitIndex].permitTypeId,
        updatedAt: new Date().toISOString().split('T')[0]
    };

    return true;
};

// Function to delete a permit
export const deletePermit = (permitId) => {
    const permitIndex = mockPermits.findIndex(permit => permit.id === permitId);
    if (permitIndex !== -1) {
        // If the permit has a permit type, increase its quantity
        const permitTypeId = mockPermits[permitIndex].permitTypeId;
        if (permitTypeId) {
            const permitType = getPermitTypeById(permitTypeId);
            if (permitType) {
                updatePermitType(permitTypeId, {
                    ...permitType,
                    quantity: permitType.quantity + 1
                });
            }
        }

        // Delete the permit
        mockPermits.splice(permitIndex, 1);
        return true;
    }
    return false;
};

// Mock permit types for the Manage Permit Types page
export const mockPermitTypes = [
    {
        id: 'PT001',
        name: 'Student Semester Permit',
        category: 'Student',
        quantity: 500,
        duration: 'Semester',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' }
        ],
        price: 125.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT002',
        name: 'Student Stadium Permit',
        category: 'Student',
        quantity: 300,
        duration: 'Semester',
        lots: [
            { lotId: 'L003', lotName: 'Stadium Lot' }
        ],
        price: 125.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT003',
        name: 'Faculty Semester Permit',
        category: 'Faculty',
        quantity: 200,
        duration: 'Semester',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' },
            { lotId: 'L004', lotName: 'Faculty Lot 2' }
        ],
        price: 275.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT004',
        name: 'Faculty Single Lot Semester Permit',
        category: 'Faculty',
        quantity: 150,
        duration: 'Semester',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' }
        ],
        price: 275.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT005',
        name: 'Staff Semester Permit',
        category: 'Staff',
        quantity: 250,
        duration: 'Semester',
        lots: [
            { lotId: 'L002', lotName: 'Faculty Lot 1' },
            { lotId: 'L004', lotName: 'Faculty Lot 2' }
        ],
        price: 250.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT006',
        name: 'Visitor Semester Permit',
        category: 'Visitor',
        quantity: 100,
        duration: 'Semester',
        lots: [
            { lotId: 'L005', lotName: 'Visitor Lot' }
        ],
        price: 30.00,
        startDate: '2024-01-01',
        endDate: '2024-05-31',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT007',
        name: 'Summer Semester Permit',
        category: 'Student',
        quantity: 200,
        duration: 'Semester',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' },
            { lotId: 'L003', lotName: 'Stadium Lot' }
        ],
        price: 90.00,
        startDate: '2024-06-01',
        endDate: '2024-08-15',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    },
    {
        id: 'PT008',
        name: 'Fall Semester Permit',
        category: 'Student',
        quantity: 450,
        duration: 'Semester',
        lots: [
            { lotId: 'L001', lotName: 'South P Lot' }
        ],
        price: 125.00,
        startDate: '2024-08-20',
        endDate: '2024-12-20',
        createdAt: '2023-12-01',
        updatedAt: '2023-12-01'
    }
];

// Function to get permit types with filtering and pagination
export const getPermitTypes = (filters = {}, page = 1, limit = 10) => {
    let filteredPermitTypes = [...mockPermitTypes];

    // Apply filters
    if (filters.category) {
        filteredPermitTypes = filteredPermitTypes.filter(type => type.category === filters.category);
    }

    if (filters.duration) {
        filteredPermitTypes = filteredPermitTypes.filter(type => type.duration === filters.duration);
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredPermitTypes = filteredPermitTypes.filter(type =>
            type.name.toLowerCase().includes(searchLower) ||
            type.category.toLowerCase().includes(searchLower) ||
            type.lots.some(lot => lot.lotName.toLowerCase().includes(searchLower))
        );
    }

    // Calculate pagination
    const totalTypes = filteredPermitTypes.length;
    const totalPages = Math.ceil(totalTypes / limit);
    const offset = (page - 1) * limit;
    const paginatedTypes = filteredPermitTypes.slice(offset, offset + limit);

    return {
        permitTypes: paginatedTypes,
        pagination: {
            total: totalTypes,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

// Function to get a single permit type by ID
export const getPermitTypeById = (permitTypeId) => {
    return mockPermitTypes.find(type => type.id === permitTypeId);
};

// Function to create a new permit type
export const createPermitType = (permitTypeData) => {
    const newPermitType = {
        id: `PT${String(mockPermitTypes.length + 1).padStart(3, '0')}`,
        ...permitTypeData,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0]
    };

    mockPermitTypes.push(newPermitType);
    return newPermitType;
};

// Function to update a permit type
export const updatePermitType = (permitTypeId, permitTypeData) => {
    const permitTypeIndex = mockPermitTypes.findIndex(type => type.id === permitTypeId);
    if (permitTypeIndex !== -1) {
        mockPermitTypes[permitTypeIndex] = {
            ...mockPermitTypes[permitTypeIndex],
            ...permitTypeData,
            updatedAt: new Date().toISOString().split('T')[0]
        };
        return true;
    }
    return false;
};

// Function to delete a permit type
export const deletePermitType = (permitTypeId) => {
    const permitTypeIndex = mockPermitTypes.findIndex(type => type.id === permitTypeId);
    if (permitTypeIndex !== -1) {
        mockPermitTypes.splice(permitTypeIndex, 1);
        return true;
    }
    return false;
}; 