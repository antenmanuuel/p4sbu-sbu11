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
        isEV: true,
        isMetered: true,
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
        hourlyRate: 'N/A',
        status: 'active',
        isEV: false,
        isMetered: false,
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
        isEV: true,
        isMetered: true,
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
        isEV: true,
        isMetered: false,
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
        hourlyRate: 'N/A',
        status: 'active',
        isEV: false,
        isMetered: false,
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
        hourlyRate: 'N/A',
        status: 'active',
        isEV: false,
        isMetered: false,
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
        hourlyRate: 'N/A',
        status: 'active',
        isEV: false,
        isMetered: false,
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
        hourlyRate: 'N/A',
        status: 'maintenance',
        isEV: false,
        isMetered: false,
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
        hourlyRate: 'N/A',
        status: 'inactive',
        isEV: false,
        isMetered: false,
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
        isEV: false,
        isMetered: true,
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
        const permitTypeFilter = filters.permitType.toLowerCase();
        filteredLots = filteredLots.filter(lot => {
            // For each lot, check if any of its permit types match the filter
            return lot.permitTypes.some(type => {
                const typeLower = type.toLowerCase();
                // Handle special cases where the database value doesn't exactly match filter value
                if (permitTypeFilter === 'commuter student' && (typeLower === 'commuter student' || typeLower === 'commuter')) {
                    return true;
                }
                if (permitTypeFilter === 'resident student' && (typeLower === 'resident student' || typeLower === 'resident')) {
                    return true;
                }
                // Direct match
                return typeLower === permitTypeFilter;
            });
        });
    }

    // Filter by lot type (EV, metered, standard)
    if (filters.lotType) {
        switch (filters.lotType) {
            case 'ev':
                filteredLots = filteredLots.filter(lot => lot.isEV);
                break;
            case 'metered':
                filteredLots = filteredLots.filter(lot => lot.isMetered);
                break;
            case 'standard':
                filteredLots = filteredLots.filter(lot => !lot.isEV && !lot.isMetered);
                break;
        }
    }

    // Filter by rate type (hourly or permit-based)
    if (filters.rateType) {
        switch (filters.rateType) {
            case 'hourly':
                filteredLots = filteredLots.filter(lot => lot.isEV || lot.isMetered);
                break;
            case 'permit':
                filteredLots = filteredLots.filter(lot => !lot.isEV && !lot.isMetered);
                break;
        }
    }

    if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredLots = filteredLots.filter(lot =>
            lot.name.toLowerCase().includes(searchLower) ||
            lot.address.toLowerCase().includes(searchLower) ||
            lot.id.toLowerCase().includes(searchLower) ||
            // Add searches for rate types and features
            (searchLower.includes('ev') && lot.isEV) ||
            (searchLower.includes('metered') && lot.isMetered) ||
            (searchLower.includes('permit') && !lot.isEV && !lot.isMetered) ||
            (searchLower.includes('hourly') && (lot.isEV || lot.isMetered)) ||
            (searchLower.includes('semester') && !lot.isEV && !lot.isMetered)
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
        // Adjust hourly rate based on lot type
        let hourlyRate = updatedData.hourlyRate || mockLots[lotIndex].hourlyRate;

        // Only apply hourly rate if the lot is metered or has EV charging
        if (!updatedData.isMetered && !updatedData.isEV) {
            hourlyRate = 'N/A'; // Not applicable for non-metered, non-EV lots
        }

        mockLots[lotIndex] = {
            ...mockLots[lotIndex],
            ...updatedData,
            hourlyRate: hourlyRate,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        return true;
    }
    return false;
};

// Function to create a new lot
export const createLot = (lotData) => {
    // Generate a new ID with LOT prefix
    const lastLotId = parseInt(mockLots[mockLots.length - 1].id.substring(3));
    const newLotId = `LOT${String(lastLotId + 1).padStart(3, '0')}`;

    // Set hourly rate based on lot type
    let hourlyRate = lotData.hourlyRate || '$0.00';

    // Only apply hourly rate if the lot is metered or has EV charging
    if (!lotData.isMetered && !lotData.isEV) {
        hourlyRate = 'N/A'; // Not applicable for non-metered, non-EV lots
    }

    // Create the new lot object with all properties including EV and metered flags
    const newLot = {
        id: newLotId,
        name: lotData.name,
        address: lotData.address,
        coordinates: lotData.coordinates,
        totalSpaces: parseInt(lotData.totalSpaces),
        availableSpaces: parseInt(lotData.availableSpaces),
        permitTypes: lotData.permitTypes,
        hourlyRate: hourlyRate,
        status: lotData.status,
        isEV: lotData.isEV || false,
        isMetered: lotData.isMetered || false,
        createdAt: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0]
    };

    // Add the new lot to the data
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