/**
 * Path finding utility using Dijkstra's algorithm
 * This provides more realistic distances than the straight-line Haversine formula
 */

// Helper function to convert degrees to radians
const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Calculate haversine distance between two points - used for edge weights
const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

/**
 * Create a simplified graph from locations
 * In a real implementation, this would use actual road/path data
 * This implementation creates a simplified graph by connecting nearby points
 */
const createGraph = (locations, maxEdgeDistance = 5.0) => {
    const graph = {};

    // Initialize all nodes
    locations.forEach((location, index) => {
        graph[index] = { edges: [] };
    });

    // Create edges between locations that are within maxEdgeDistance
    for (let i = 0; i < locations.length; i++) {
        for (let j = i + 1; j < locations.length; j++) {
            const loc1 = locations[i];
            const loc2 = locations[j];

            // Calculate direct distance between locations
            const distance = haversineDistance(
                loc1.coordinates[0], loc1.coordinates[1],
                loc2.coordinates[0], loc2.coordinates[1]
            );

            // Only connect locations that are relatively close
            if (distance <= maxEdgeDistance) {
                // Add bidirectional edges
                graph[i].edges.push({ to: j, weight: distance });
                graph[j].edges.push({ to: i, weight: distance });
            }
        }
    }

    // Ensure all nodes have at least one connection to avoid disconnected graphs
    // Connect each node to its closest neighbor if it has no connections
    for (let i = 0; i < locations.length; i++) {
        if (graph[i].edges.length === 0 && locations.length > 1) {
            // Find the closest node to connect to
            let minDistance = Infinity;
            let closestNode = null;

            for (let j = 0; j < locations.length; j++) {
                if (i !== j) {
                    const distance = haversineDistance(
                        locations[i].coordinates[0], locations[i].coordinates[1],
                        locations[j].coordinates[0], locations[j].coordinates[1]
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestNode = j;
                    }
                }
            }

            // Add bidirectional edges to closest node
            if (closestNode !== null) {
                graph[i].edges.push({ to: closestNode, weight: minDistance });
                graph[closestNode].edges.push({ to: i, weight: minDistance });
            }
        }
    }

    return graph;
};

/**
 * Implementation of Dijkstra's algorithm for finding shortest path
 * @param {Object} graph - Graph representation with nodes and edges
 * @param {Number} startNode - Index of the starting node
 * @param {Number} endNode - Index of the target node
 * @returns {Object} - Distance and path
 */
const dijkstra = (graph, startNode, endNode) => {
    // Track distances from start node to every other node
    const distances = {};
    // Track paths
    const previous = {};
    // Nodes to visit (priority queue would be more efficient)
    const nodes = new Set();

    // Initialize distances
    Object.keys(graph).forEach(node => {
        distances[node] = Infinity;
        previous[node] = null;
        nodes.add(node);
    });

    // Distance to start node is 0
    distances[startNode] = 0;

    while (nodes.size > 0) {
        // Find node with minimum distance
        let minNode = null;
        let minDistance = Infinity;

        nodes.forEach(node => {
            if (distances[node] < minDistance) {
                minDistance = distances[node];
                minNode = node;
            }
        });

        // No path found or we've reached the end node
        if (minNode === null || minNode == endNode) break;

        // Remove minimum node from unvisited set
        nodes.delete(minNode);

        // Check all neighbors of the current node
        graph[minNode].edges.forEach(edge => {
            const alt = distances[minNode] + edge.weight;

            // If we found a better path, update it
            if (alt < distances[edge.to]) {
                distances[edge.to] = alt;
                previous[edge.to] = minNode;
            }
        });
    }

    // Reconstruct the path
    const path = [];
    let current = endNode;

    while (current !== null) {
        path.unshift(current);
        current = previous[current];
    }

    return {
        distance: distances[endNode],
        path: path
    };
};

/**
 * Calculate the shortest path distance between a source and all destinations
 * @param {Array} sourceCoords - [lat, lng] of the source
 * @param {Array} destinations - Array of destination objects with coordinates
 * @returns {Array} - Destinations with calculated distances
 */
export const calculatePathDistances = (sourceCoords, destinations) => {
    // Only proceed if we have valid input
    if (!sourceCoords || !destinations || !destinations.length) {
        return destinations;
    }

    // Create a copy of destinations and add the source as the first location
    const allLocations = [
        { coordinates: [sourceCoords[0], sourceCoords[1]] },
        ...destinations
    ];

    // Create a graph from all locations
    const graph = createGraph(allLocations);

    // Calculate distance from source (index 0) to each destination
    return destinations.map((destination, index) => {
        const destIndex = index + 1; // +1 because source is at index 0

        // Try to find a path using Dijkstra's algorithm
        try {
            const { distance } = dijkstra(graph, "0", destIndex.toString());

            // If no path was found (distance is Infinity), fall back to direct distance
            if (!isFinite(distance)) {
                // Calculate direct haversine distance as fallback
                const directDistance = haversineDistance(
                    sourceCoords[0], sourceCoords[1],
                    destination.coordinates[0], destination.coordinates[1]
                );
                const distanceMiles = directDistance * 0.621371;

                return {
                    ...destination,
                    calculatedDistance: directDistance,
                    distance: `${distanceMiles.toFixed(1)} miles (direct)`
                };
            }

            // Convert km to miles and format the distance string
            const distanceMiles = distance * 0.621371;
            const distanceString = `${distanceMiles.toFixed(1)} miles`;

            // Return the destination with the calculated distance
            return {
                ...destination,
                calculatedDistance: distance, // the raw distance in km
                distance: distanceString // formatted distance string
            };
        } catch (error) {
            console.error("Error calculating path:", error);

            // Fallback to direct haversine distance if path finding fails
            const directDistance = haversineDistance(
                sourceCoords[0], sourceCoords[1],
                destination.coordinates[0], destination.coordinates[1]
            );
            const distanceMiles = directDistance * 0.621371;

            return {
                ...destination,
                calculatedDistance: directDistance,
                distance: `${distanceMiles.toFixed(1)} miles (direct)`
            };
        }
    });
};

// Export functions
export default {
    calculatePathDistances,
    haversineDistance,
    dijkstra,
    createGraph
}; 