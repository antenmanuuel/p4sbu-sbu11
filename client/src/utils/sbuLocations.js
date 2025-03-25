/**
 * Stony Brook University locations data
 * Contains key locations around campus with coordinates for custom search functionality
 * Format: [longitude, latitude] for coordinates (MapBox format)
 */

export const sbuLocations = [
    {
        name: "Stony Brook Union",
        description: "Student center with dining and activities",
        coordinates: [-73.1225, 40.9171]
        ,
    },
    {
        name: "Island Federal Credit Union Arena",
        description: "Sports Complex",
        coordinates: [-73.1260, 40.9174]
    },
    {
        name: "Chemistry Building",
        description: "Chemistry Building",
        coordinates: [-73.1237, 40.9164]
    },
    {
        name: "Recreation Center",
        description: "Walter J. Hawrys Campus Recreation & Wellness Center ",
        coordinates: [-73.1235, 40.9172]
    },
    {
        name: "Sports Complex",
        description: "Sports Complex",
        coordinates: [-73.1248, 40.9173]
    },
    {
        name: "Kenneth P. LaValle Stadium",
        description: "Stadium",
        coordinates: [-73.1243, 40.9189]
    },
    {
        name: "Track Practice Field",
        description: "Track Practice Field",
        coordinates: [-73.1265, 40.9201]
    },
    {
        name: "Student Health Center",
        description: "Student Health Center",
        coordinates: [-73.1217, 40.9193]
    },
    {
        name: "Recreation Tennis Court",
        description: "Recreation Tennis Court",
        coordinates: [-73.1225, 40.9205]
    },
    {
        name: "Varsity Tennis Court",
        description: "Varsity Tennis Court",
        coordinates: [-73.1221, 40.9213]
    },
    {
        name: "Recreation Fields",
        description: "Recreation Fields",
        coordinates: [-73.1251, 40.9218]
    },
    {
        name: "Joe Nathan Field",
        description: "Joe Nathan Field",
        coordinates: [-73.1223, 40.9235]
    },
    {
        name: "Athlete Indoor Practice Facility",
        description: "Athlete Indoor Practice Facility",
        coordinates: [-73.1234, 40.9210]
    },
    {
        name: "East Side Dining Hall",
        description: "East Side Dining Hall",
        coordinates: [-73.1207, 40.9169]
    },
    {
        name: "Staller Center of Arts",
        description: "Staller Center of Arts",
        coordinates: [-73.1214, 40.9159]
    },
    {
        name: "Charles B. Wang Center",
        description: "Charles B. Wang Center",
        coordinates: [-73.1197, 40.9160]
    },
    {
        name: "Tubman Hall",
        description: "Tubman Hall",
        coordinates: [-73.1192, 40.9169]
    },
    {
        name: "Gray College ",
        description: "Gray College",
        coordinates: [-73.1213, 40.9177]
    },
    {
        name: "Irving Mailroom",
        description: "Irving Mailroom",
        coordinates: [-73.1196, 40.9177]
    },
    {
        name: "Ammann College",
        description: "Ammann College",
        coordinates: [-73.1210, 40.9188]
    },
    {
        name: "Starbucks West",
        description: "Starbucks West",
        coordinates: [-73.1229, 40.9159]
    },
    {
        name: "Frank Melville Jr. Memorial Library",
        description: "Frank Melville Jr. Memorial Library",
        coordinates: [-73.1227, 40.9155]
    },
    {
        name: "Frey Hall",
        description: "Frey Hall",
        coordinates: [-73.1239, 40.9157]
    },
    {
        name: "Stony Brook University Hospital",
        description: "Stony Brook University Hospital",
        coordinates: [-73.1259, 40.9148]
    },
    
    
        

    
    
    
    

        

];

/**
 * Convert the locations array to GeoJSON format for MapBox
 */
export const sbuLocationsGeoJSON = {
    type: 'FeatureCollection',
    features: sbuLocations.map(location => ({
        type: 'Feature',
        properties: {
            name: location.name,
            description: location.description
        },
        geometry: {
            type: 'Point',
            coordinates: location.coordinates
        }
    }))
};

/**
 * Search function to filter SBU locations by name
 * @param {string} query - The search query
 * @returns {Array} - Filtered locations that match the query
 */
export const searchSbuLocations = (query) => {
    if (!query) return [];
    const lowercaseQuery = query.toLowerCase().trim();

    return sbuLocations.filter(location =>
        location.name.toLowerCase().includes(lowercaseQuery) ||
        location.description.toLowerCase().includes(lowercaseQuery)
    );
};

export default {
    sbuLocations,
    sbuLocationsGeoJSON,
    searchSbuLocations
}; 