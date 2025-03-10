// Mock parking lots data
export const mockLots = [
    {
        id: 'LOT001',
        name: 'North P Lot',
        address: 'Circle Road, Stony Brook, NY 11794',
        coordinates: [40.9181, -73.1259],
        totalSpaces: 450,
        availableSpaces: 122,
        permitTypes: ['Faculty', 'Staff', 'Student', 'Visitor'],
        hourlyRate: '$2.50',
        status: 'active',
        createdAt: '2023-01-15',
        lastUpdated: '2024-02-10'
    },
    {
        id: 'LOT002',
        name: 'South P Lot',
        address: 'Stony Brook Rd, Stony Brook, NY 11794',
        coordinates: [40.9048, -73.1278],
        totalSpaces: 600,
        availableSpaces: 241,
        permitTypes: ['Student', 'Visitor', 'Commuter'],
        hourlyRate: '$2.00',
        status: 'active',
        createdAt: '2023-01-15',
        lastUpdated: '2024-02-20'
    },
    {
        id: 'LOT003',
        name: 'Administration Garage',
        address: 'Administration Dr, Stony Brook, NY 11794',
        coordinates: [40.9158, -73.1243],
        totalSpaces: 200,
        availableSpaces: 45,
        permitTypes: ['Faculty', 'Staff', 'Admin'],
        hourlyRate: '$3.00',
        status: 'active',
        createdAt: '2023-01-20',
        lastUpdated: '2024-03-05'
    },
    {
        id: 'LOT004',
        name: 'Health Sciences Garage',
        address: 'Health Sciences Dr, Stony Brook, NY 11794',
        coordinates: [40.9085, -73.1161],
        totalSpaces: 350,
        availableSpaces: 98,
        permitTypes: ['Faculty', 'Staff', 'Medical', 'Visitor'],
        hourlyRate: '$3.50',
        status: 'active',
        createdAt: '2023-02-01',
        lastUpdated: '2024-02-28'
    },
    {
        id: 'LOT005',
        name: 'Chapin Apartments Lot',
        address: 'Chapin Apartments, Stony Brook, NY 11794',
        coordinates: [40.9222, -73.1267],
        totalSpaces: 120,
        availableSpaces: 34,
        permitTypes: ['Resident', 'Student'],
        hourlyRate: '$1.50',
        status: 'active',
        createdAt: '2023-02-10',
        lastUpdated: '2024-01-15'
    },
    {
        id: 'LOT006',
        name: 'Stadium Lot',
        address: 'Kenneth P. LaValle Stadium, Stony Brook, NY 11794',
        coordinates: [40.9218, -73.1225],
        totalSpaces: 400,
        availableSpaces: 320,
        permitTypes: ['Event', 'Student', 'Visitor'],
        hourlyRate: '$2.00',
        status: 'active',
        createdAt: '2023-03-01',
        lastUpdated: '2024-02-05'
    },
    {
        id: 'LOT007',
        name: 'West Apartment Lot',
        address: 'West Apartments, Stony Brook, NY 11794',
        coordinates: [40.9154, -73.1310],
        totalSpaces: 150,
        availableSpaces: 22,
        permitTypes: ['Resident', 'Student'],
        hourlyRate: '$1.50',
        status: 'active',
        createdAt: '2023-03-15',
        lastUpdated: '2024-01-20'
    },
    {
        id: 'LOT008',
        name: 'Engineering Lot',
        address: 'Engineering Drive, Stony Brook, NY 11794',
        coordinates: [40.9138, -73.1247],
        totalSpaces: 180,
        availableSpaces: 58,
        permitTypes: ['Faculty', 'Staff', 'Student'],
        hourlyRate: '$2.50',
        status: 'maintenance',
        createdAt: '2023-04-01',
        lastUpdated: '2024-02-15'
    },
    {
        id: 'LOT009',
        name: 'East Campus Lot',
        address: 'East Campus Dr, Stony Brook, NY 11794',
        coordinates: [40.9110, -73.1180],
        totalSpaces: 220,
        availableSpaces: 0,
        permitTypes: ['Faculty', 'Staff'],
        hourlyRate: '$2.50',
        status: 'inactive',
        createdAt: '2023-05-01',
        lastUpdated: '2023-12-10'
    },
    {
        id: 'LOT010',
        name: 'Visitor Parking Center',
        address: 'Visitor Circle, Stony Brook, NY 11794',
        coordinates: [40.9155, -73.1235],
        totalSpaces: 80,
        availableSpaces: 15,
        permitTypes: ['Visitor', 'Event'],
        hourlyRate: '$3.00',
        status: 'active',
        createdAt: '2023-06-15',
        lastUpdated: '2024-03-01'
    }
];

// Function to get lots with filtering and pagination
export const getLots = (filters = {}, page = 1, limit = 10) => {
    let filteredLots = [...mockLots];

    // Apply filters
    if (filters.status) {
        filteredLots = filteredLots.filter(lot => lot.status === filters.status);
    }

    if (filters.permitType) {
        filteredLots = filteredLots.filter(lot =>
            lot.permitTypes.some(type => type.toLowerCase() === filters.permitType.toLowerCase())
        );
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLots = filteredLots.filter(lot =>
            lot.name.toLowerCase().includes(searchLower) ||
            lot.address.toLowerCase().includes(searchLower) ||
            lot.id.toLowerCase().includes(searchLower)
        );
    }

    // Calculate pagination
    const totalLots = filteredLots.length;
    const totalPages = Math.ceil(totalLots / limit);
    const offset = (page - 1) * limit;
    const paginatedLots = filteredLots.slice(offset, offset + limit);

    return {
        lots: paginatedLots,
        pagination: {
            total: totalLots,
            totalPages,
            currentPage: page,
            limit
        }
    };
};

// Function to get a single lot by ID
export const getLotById = (lotId) => {
    return mockLots.find(lot => lot.id === lotId);
};

// Function to toggle lot status
export const toggleLotStatus = (lotId, newStatus) => {
    const lotIndex = mockLots.findIndex(lot => lot.id === lotId);
    if (lotIndex !== -1) {
        mockLots[lotIndex].status = newStatus;
        mockLots[lotIndex].lastUpdated = new Date().toISOString().split('T')[0];
        return true;
    }
    return false;
};

// Function to update lot details
export const updateLot = (lotId, updatedData) => {
    const lotIndex = mockLots.findIndex(lot => lot.id === lotId);
    if (lotIndex !== -1) {
        mockLots[lotIndex] = {
            ...mockLots[lotIndex],
            ...updatedData,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        return true;
    }
    return false;
};

// Function to create a new lot
export const createLot = (lotData) => {
    const newLot = {
        id: `LOT${String(mockLots.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        status: 'active',
        ...lotData
    };

    mockLots.push(newLot);
    return newLot;
};

// Function to delete a lot
export const deleteLot = (lotId) => {
    const lotIndex = mockLots.findIndex(lot => lot.id === lotId);
    if (lotIndex !== -1) {
        mockLots.splice(lotIndex, 1);
        return true;
    }
    return false;
}; 