// Real Data for Parking Application

export const mockParkingLots = [
    {
        id: 'lot1',
        name: 'South P Lot (Commuter Satellite)',
        coordinates: [40.9012, -73.1265],
        address: '100 Circle Rd, Stony Brook, NY 11794',
        availableSpaces: 245,
        totalSpaces: 2000,
        hourlyRate: 'Free with permit',
        distance: '1.5 miles',
        walkingDistance: '25 min walk',
        passType: 'Commuter Satellite (Free)',
        destinationBuilding: 'Campus via shuttle',
        peakHours: [
            { time: '6am-10am', percentage: 85 },
            { time: '10am-2pm', percentage: 95 },
            { time: '2pm-6pm', percentage: 75 },
            { time: '6pm-10pm', percentage: 40 }
        ],
        description: 'Large commuter lot with frequent shuttle service to campus. Free parking for commuter students with Commuter Satellite permits.',
        features: ['Handicap Spaces', 'Emergency Phones', 'Bus Stop', 'Solar-powered Lighting', 'Free Parking']
    },
    {
        id: 'lot2',
        name: 'Administration Garage',
        coordinates: [40.9164, -73.1219],
        address: 'John S. Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 58,
        totalSpaces: 220,
        hourlyRate: '$2.50/hr or Evening Permit',
        distance: '0.2 miles',
        walkingDistance: '3 min walk',
        passType: 'Faculty/Staff/Visitor/Evening Student',
        destinationBuilding: 'Administration Building',
        peakHours: [
            { time: '6am-10am', percentage: 60 },
            { time: '10am-2pm', percentage: 95 },
            { time: '2pm-6pm', percentage: 80 },
            { time: '6pm-10pm', percentage: 30 }
        ],
        description: 'Covered parking garage adjacent to the Administration Building. Visitor parking available with pay stations. Evening permits give access from 2:30pm-8:00am on weekdays, and all day on weekends.',
        features: ['Covered Parking', 'Pay Station', 'EV Charging Stations', 'ADA Accessible', 'Evening Permits Available']
    },
    {
        id: 'lot3',
        name: 'Health Sciences Garage',
        coordinates: [40.9089, -73.1187],
        address: 'Health Sciences Drive, Stony Brook, NY 11794',
        availableSpaces: 75,
        totalSpaces: 350,
        hourlyRate: '$1.50/hr or Evening Permit',
        distance: '0.3 miles',
        walkingDistance: '5 min walk',
        passType: 'Hospital Staff/Visitor/Evening Student',
        destinationBuilding: 'Stony Brook Hospital',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 60 }
        ],
        description: 'Multi-level garage serving the Health Sciences Center and Stony Brook University Hospital. Patient and visitor parking available. Evening permits give access from 4:00pm-9:00am on weekdays, and all day on weekends.',
        features: ['Covered Parking', 'Pay Station', 'Wheelchair Access', '24/7 Access', 'Evening Permits Available']
    },
    {
        id: 'lot4',
        name: 'North P Lot',
        coordinates: [40.9225, -73.1252],
        address: 'Circle Road, Stony Brook, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'H-Quad',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot5',
        name: 'Commuter Perimeter Lot',
        coordinates: [40.9225, -73.1252],
        address: 'Circle Road, Stony Brook, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: '$90/semester with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter Perimeter',
        destinationBuilding: 'Main Campus',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students with Commuter Perimeter permits. Permit costs $90/semester (fall and spring) or $60/semester (summer).',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit', 'Discounted permits available']
    },
    {
        id: 'lot6',
        name: 'Commuter Core Lot',
        coordinates: [40.9142, -73.1257],
        address: 'John S. Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 35,
        totalSpaces: 280,
        hourlyRate: '$135/semester with permit',
        distance: '0.1 miles',
        walkingDistance: '2 min walk',
        passType: 'Commuter Core',
        destinationBuilding: 'Student Activities Center',
        peakHours: [
            { time: '6am-10am', percentage: 65 },
            { time: '10am-2pm', percentage: 95 },
            { time: '2pm-6pm', percentage: 90 },
            { time: '6pm-10pm', percentage: 40 }
        ],
        description: 'Convenient parking lot adjacent to central campus. Requires Commuter Core permit which costs $135/semester (fall and spring) or $90/semester (summer).',
        features: ['ADA Accessible', 'Emergency Phones', 'Well Lit', 'Close to Main Campus']
    },
    {
        id: 'lot7',
        name: 'Residential Zone',
        coordinates: [40.9137, -73.1240],
        address: 'John S. Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 62,
        totalSpaces: 280,
        hourlyRate: '$90/semester with permit',
        distance: '0.2 miles',
        walkingDistance: '4 min walk',
        passType: 'Residential Perimeter',
        destinationBuilding: 'Residence Halls',
        peakHours: [
            { time: '6am-10am', percentage: 30 },
            { time: '10am-2pm', percentage: 50 },
            { time: '2pm-6pm', percentage: 55 },
            { time: '6pm-10pm', percentage: 85 }
        ],
        description: 'Parking zones designated for resident students. First and second-year residents are not eligible for permits without an approved petition. Permit costs $90/semester (fall and spring) or $60/semester (summer).',
        features: ['Close to Residence Halls', 'Well Lit', 'Security Cameras', 'Emergency Phones']
    },
    {
        id: 'lot8',
        name: 'Stadium Lot',
        coordinates: [40.9185, -73.1287],
        address: 'John Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 105,
        totalSpaces: 350,
        hourlyRate: 'Free with permit',
        distance: '0.4 miles',
        walkingDistance: '8 min walk',
        passType: 'Student/Faculty/Staff',
        destinationBuilding: 'Kenneth P. LaValle Stadium',
        peakHours: [
            { time: '6am-10am', percentage: 30 },
            { time: '10am-2pm', percentage: 65 },
            { time: '2pm-6pm', percentage: 60 },
            { time: '6pm-10pm', percentage: 90 }
        ],
        description: 'Large lot serving the sports complex and stadium. Free parking during regular hours, special event pricing may apply.',
        features: ['Event Parking', 'Tailgating Allowed', 'Well Lit', 'ADA Accessible']
    },
    {
        id: 'lot9',
        name: 'West Campus Garage',
        coordinates: [40.9137, -73.1240],
        address: 'John S. Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 62,
        totalSpaces: 280,
        hourlyRate: '$3.00/hr',
        distance: '0.2 miles',
        walkingDistance: '4 min walk',
        passType: 'Faculty/Visitor',
        destinationBuilding: 'Student Activities Center',
        peakHours: [
            { time: '6am-10am', percentage: 50 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 45 }
        ],
        description: 'Central covered parking facility near the Student Activities Center and academic buildings.',
        features: ['Covered Parking', 'Pay Station', 'Well Lit', 'Security Cameras']
    },
    {
        id: 'lot10',
        name: 'Engineering Garage',
        coordinates: [40.9142, -73.1257],
        address: 'Engineering Drive, Stony Brook, NY 11794',
        availableSpaces: 35,
        totalSpaces: 120,
        hourlyRate: '$2.00/hr',
        distance: '0.1 miles',
        walkingDistance: '2 min walk',
        passType: 'Faculty/Staff/Student',
        destinationBuilding: 'Engineering Building',
        peakHours: [
            { time: '6am-10am', percentage: 65 },
            { time: '10am-2pm', percentage: 95 },
            { time: '2pm-6pm', percentage: 90 },
            { time: '6pm-10pm', percentage: 40 }
        ],
        description: 'Convenient parking garage adjacent to the Engineering Building. Limited spots available.',
        features: ['Covered Parking', 'Pay Station', 'EV Charging', 'Bicycle Racks']
    },
    {
        id: 'lot11',
        name: 'Stadium Lot',
        coordinates: [40.9185, -73.1287],
        address: 'John Toll Drive, Stony Brook, NY 11794',
        availableSpaces: 105,
        totalSpaces: 350,
        hourlyRate: 'Free with permit',
        distance: '0.4 miles',
        walkingDistance: '8 min walk',
        passType: 'Student/Faculty/Staff',
        destinationBuilding: 'Kenneth P. LaValle Stadium',
        peakHours: [
            { time: '6am-10am', percentage: 30 },
            { time: '10am-2pm', percentage: 65 },
            { time: '2pm-6pm', percentage: 60 },
            { time: '6pm-10pm', percentage: 90 }
        ],
        description: 'Large lot serving the sports complex and stadium. Free parking during regular hours, special event pricing may apply.',
        features: ['Event Parking', 'Tailgating Allowed', 'Well Lit', 'ADA Accessible']
    },
    {
        id: 'lot12',
        name: 'Chapin Apartments, Stony Brook University, NY',
        coordinates: [40.9129, -73.1308],
        address: 'Chapin Hall, Stony Brook University, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'Chapin Apartments',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot13',
        name: 'West Apartments, Stony Brook University, NY',
        coordinates: [40.9146, -73.1315],
        address: 'West Hall, Stony Brook University, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'West Apartments',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot14',
        name: 'Earth and Space Sciences Building, Stony Brook University, NY',
        coordinates: [40.9139, -73.1244],
        address: 'Earth and Space Sciences Building, Stony Brook University, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'Earth and Space Sciences Building',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot15',
        name: 'Simons Center for Geometry and Physics, Stony Brook University, NY',
        coordinates: [40.9150, -73.1254],
        address: 'Simons Center for Geometry and Physics, Stony Brook University, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'Simons Center for Geometry and Physics',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot16',
        name: 'Humanities Building, Stony Brook University, NY',
        coordinates: [40.9154, -73.1213],
        address: 'Humanities Building, Stony Brook University, NY 11794',
        availableSpaces: 180,
        totalSpaces: 750,
        hourlyRate: 'Free with permit',
        distance: '0.7 miles',
        walkingDistance: '12 min walk',
        passType: 'Commuter',
        destinationBuilding: 'Humanities Building',
        peakHours: [
            { time: '6am-10am', percentage: 70 },
            { time: '10am-2pm', percentage: 90 },
            { time: '2pm-6pm', percentage: 85 },
            { time: '6pm-10pm', percentage: 50 }
        ],
        description: 'Large outdoor parking area primarily serving commuter students. Shuttle service available to main campus.',
        features: ['Bus Stop', 'Emergency Phones', 'Well Lit']
    },
    {
        id: 'lot17',
        name: 'Social and Behavioral Sciences Building, Stony Brook University, NY',
        coordinates: [40.9143, -73.1222],
    }
];

// Helper function to highlight matched terms in text
export const highlightMatches = (text, query) => {
    if (!query || query.trim().length < 2) {
        return text;
    }

    // Prepare the text and query
    const lowerText = text.toLowerCase();
    const queryTerms = query.toLowerCase().trim().split(/\s+/).filter(term => term.length >= 2);

    // If no valid query terms, return original text
    if (queryTerms.length === 0) {
        return text;
    }

    // Find all matches and their positions
    const matches = [];
    for (const term of queryTerms) {
        let startPos = 0;
        let pos;

        while ((pos = lowerText.indexOf(term, startPos)) !== -1) {
            matches.push({
                start: pos,
                end: pos + term.length,
                term
            });
            startPos = pos + 1;
        }
    }

    // Sort matches by position
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping matches
    const mergedMatches = [];
    for (const match of matches) {
        if (mergedMatches.length === 0) {
            mergedMatches.push(match);
            continue;
        }

        const lastMatch = mergedMatches[mergedMatches.length - 1];
        if (match.start <= lastMatch.end) {
            // Overlapping matches, extend the end position
            lastMatch.end = Math.max(lastMatch.end, match.end);
        } else {
            // Non-overlapping match
            mergedMatches.push(match);
        }
    }

    // Build the highlighted text
    let result = '';
    let lastEnd = 0;

    for (const match of mergedMatches) {
        // Add text before the match
        result += text.substring(lastEnd, match.start);
        // Add the highlighted match
        result += `<strong>${text.substring(match.start, match.end)}</strong>`;
        lastEnd = match.end;
    }

    // Add any remaining text
    result += text.substring(lastEnd);

    return result;
};

// Function to get suggestions based on search query
export const getMockSuggestions = (query) => {
    if (!query || query.trim().length < 1) {
        return [];
    }

    const queryTerms = query.toLowerCase().trim().split(/\s+/);

    const realPlaces = [
        {
            id: 'place1',
            place_name: 'Student Activities Center, Stony Brook University, NY',
            center: [40.9135, -73.1240]
        },
        {
            id: 'place2',
            place_name: 'Frank Melville Jr. Memorial Library, Stony Brook University, NY',
            center: [40.9152, -73.1230]
        },
        {
            id: 'place3',
            place_name: 'Staller Center for the Arts, Stony Brook University, NY',
            center: [40.9162, -73.1221]
        },
        {
            id: 'place4',
            place_name: 'Stony Brook University Hospital, Stony Brook, NY',
            center: [40.9089, -73.1187]
        },
        {
            id: 'place5',
            place_name: 'Charles B. Wang Center, Stony Brook University, NY',
            center: [40.9156, -73.1195]
        },
        {
            id: 'place6',
            place_name: 'Engineering Building, Stony Brook University, NY',
            center: [40.9142, -73.1257]
        },
        {
            id: 'place7',
            place_name: 'Administration Building, Stony Brook University, NY',
            center: [40.9164, -73.1219]
        },
        {
            id: 'place8',
            place_name: 'Health Sciences Center, Stony Brook University, NY',
            center: [40.9089, -73.1187]
        },
        {
            id: 'place9',
            place_name: 'Chemistry Building, Stony Brook University, NY',
            center: [40.9145, -73.1246]
        },
        {
            id: 'place10',
            place_name: 'Physics Building, Stony Brook University, NY',
            center: [40.9141, -73.1251]
        },
        {
            id: 'place11',
            place_name: 'Kenneth P. LaValle Stadium, Stony Brook University, NY',
            center: [40.9185, -73.1287]
        },
        {
            id: 'place12',
            place_name: 'Chapin Apartments, Stony Brook University, NY',
            center: [40.9129, -73.1308]
        },
        {
            id: 'place13',
            place_name: 'West Apartments, Stony Brook University, NY',
            center: [40.9146, -73.1315]
        },
        // Adding more major buildings and areas
        {
            id: 'place14',
            place_name: 'Earth and Space Sciences Building, Stony Brook University, NY',
            center: [40.9139, -73.1244]
        },
        {
            id: 'place15',
            place_name: 'Simons Center for Geometry and Physics, Stony Brook University, NY',
            center: [40.9150, -73.1254]
        },
        {
            id: 'place16',
            place_name: 'Humanities Building, Stony Brook University, NY',
            center: [40.9154, -73.1213]
        },
        {
            id: 'place17',
            place_name: 'Social and Behavioral Sciences Building, Stony Brook University, NY',
            center: [40.9143, -73.1222]
        },
        {
            id: 'place18',
            place_name: 'Harriman Hall, Stony Brook University, NY',
            center: [40.9143, -73.1212]
        },
        {
            id: 'place19',
            place_name: 'Javits Lecture Center, Stony Brook University, NY',
            center: [40.9147, -73.1234]
        },
        {
            id: 'place20',
            place_name: 'Life Sciences Building, Stony Brook University, NY',
            center: [40.9132, -73.1232]
        },
        {
            id: 'place21',
            place_name: 'Computer Science Building, Stony Brook University, NY',
            center: [40.9132, -73.1269]
        },
        {
            id: 'place22',
            place_name: 'Frey Hall, Stony Brook University, NY',
            center: [40.9162, -73.1242]
        },
        {
            id: 'place23',
            place_name: 'Center for Molecular Medicine, Stony Brook University, NY',
            center: [40.9081, -73.1175]
        },
        {
            id: 'place24',
            place_name: 'Heavy Engineering Building, Stony Brook University, NY',
            center: [40.9137, -73.1260]
        },
        {
            id: 'place25',
            place_name: 'Light Engineering Building, Stony Brook University, NY',
            center: [40.9135, -73.1252]
        },
        {
            id: 'place26',
            place_name: 'Roth Quad, Stony Brook University, NY',
            center: [40.9175, -73.1240]
        },
        {
            id: 'place27',
            place_name: 'Tabler Quad, Stony Brook University, NY',
            center: [40.9164, -73.1292]
        },
        {
            id: 'place28',
            place_name: 'H-Quad, Stony Brook University, NY',
            center: [40.9181, -73.1231]
        },
        {
            id: 'place29',
            place_name: 'Mendelsohn Quad, Stony Brook University, NY',
            center: [40.9180, -73.1260]
        },
        {
            id: 'place30',
            place_name: 'Roosevelt Quad, Stony Brook University, NY',
            center: [40.9169, -73.1196]
        },
        {
            id: 'place31',
            place_name: 'Kelly Quad, Stony Brook University, NY',
            center: [40.9157, -73.1328]
        },
        {
            id: 'place32',
            place_name: 'Sports Complex, Stony Brook University, NY',
            center: [40.9195, -73.1249]
        },
        {
            id: 'place33',
            place_name: 'University Pool, Stony Brook University, NY',
            center: [40.9199, -73.1242]
        },
        {
            id: 'place34',
            place_name: 'Rec Center, Stony Brook University, NY',
            center: [40.9187, -73.1239]
        },
        {
            id: 'place35',
            place_name: 'Stony Brook Union, Stony Brook University, NY',
            center: [40.9146, -73.1241]
        },
        {
            id: 'place36',
            place_name: 'Stony Brook Dental School, Stony Brook University, NY',
            center: [40.9093, -73.1185]
        },
        {
            id: 'place37',
            place_name: 'Laufer Center for Physical and Quantitative Biology, Stony Brook University, NY',
            center: [40.9121, -73.1226]
        },
        {
            id: 'place38',
            place_name: 'Cancer Center, Stony Brook University, NY',
            center: [40.9085, -73.1180]
        },
        {
            id: 'place39',
            place_name: 'Marine Sciences Research Center, Stony Brook University, NY',
            center: [40.9126, -73.1270]
        },
        {
            id: 'place40',
            place_name: 'Advanced Energy Research and Technology Center, Stony Brook University, NY',
            center: [40.9120, -73.1272]
        }
    ];

    // Calculate relevance score for each place
    const scoredResults = realPlaces.map(place => {
        const placeName = place.place_name.toLowerCase();
        let score = 0;

        // Check for exact matches (highest priority)
        if (placeName === query.toLowerCase()) {
            score += 100;
        }

        // Check for starts with (high priority)
        if (placeName.startsWith(query.toLowerCase())) {
            score += 50;
        }

        // Check for individual term matches
        for (const term of queryTerms) {
            if (term.length < 1) continue; // Skip empty terms

            // Exact term match
            if (placeName.includes(term)) {
                score += 10;

                // Bonus for term at beginning of words
                const words = placeName.split(/\s+|,/);
                for (const word of words) {
                    if (word.startsWith(term)) {
                        score += 5;
                    }
                }
            }
        }

        // Only include results with a positive score
        return { ...place, score };
    }).filter(item => item.score > 0);

    // Sort by score (highest first) and limit to 10 results
    const results = scoredResults
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

    // Add highlighted text to results
    const resultsWithHighlights = results.map(result => ({
        ...result,
        highlighted_name: highlightMatches(result.place_name, query)
    }));

    // Always return at least one result for testing if query contains 'test'
    if (resultsWithHighlights.length === 0 && query.toLowerCase().includes('test')) {
        return [{
            id: 'test-place',
            place_name: `Test Result for: ${query}`,
            highlighted_name: `Test Result for: <strong>${query}</strong>`,
            center: [-73.12, 40.91]
        }];
    }

    return resultsWithHighlights;
};

// Function to get nearby parking lots based on center coordinates
export const getNearbyParkingLots = (coordinates) => {
    if (!coordinates || coordinates.length !== 2) {
        // Return all lots if coordinates are invalid
        return mockParkingLots;
    }

    // Calculate actual distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    // Convert degrees to radians
    const deg2rad = (deg) => {
        return deg * (Math.PI / 180);
    };

    // Calculate distance for each lot and add it to the lot object
    const lotsWithDistance = mockParkingLots.map(lot => {
        // Ensure coordinates are numbers
        const lotLat = parseFloat(lot.coordinates[0]);
        const lotLng = parseFloat(lot.coordinates[1]);
        const userLat = parseFloat(coordinates[0]);
        const userLng = parseFloat(coordinates[1]);

        const distance = calculateDistance(
            userLat, userLng,
            lotLat, lotLng
        );

        // Format distance string based on calculated distance
        let distanceString;
        if (distance < 0.1) {
            distanceString = `${Math.round(distance * 1000)} meters`;
        } else if (distance < 1) {
            distanceString = `${(distance * 0.621371).toFixed(1)} miles`;
        } else {
            distanceString = `${(distance * 0.621371).toFixed(1)} miles`;
        }

        // Estimate walking time (assuming 5km/h walking speed)
        const walkingTimeMinutes = Math.round((distance / 5) * 60);
        const walkingString = `${walkingTimeMinutes} min walk`;

        return {
            ...lot,
            calculatedDistance: distance,  // Actual calculated distance in km
            distance: distanceString,      // Formatted distance string
            walkingDistance: walkingString // Estimated walking time
        };
    });

    // Sort lots by distance (closest first)
    return lotsWithDistance.sort((a, b) => a.calculatedDistance - b.calculatedDistance);
};

// Function to get lot details by ID
export const getLotById = (id) => {
    return mockParkingLots.find(lot => lot.id === id) || null;
}; 