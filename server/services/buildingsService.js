/**
 * Buildings Service - Hardcoded building locations and parking recommendations
 * Maps campus buildings to their coordinates and finds closest parking lots
 */

class BuildingsService {
  constructor() {
    // Comprehensive SBU campus buildings with their coordinates
    this.buildings = {
      // Academic Buildings - Core Campus
      'library': {
        name: 'Frank Melville Jr. Memorial Library',
        coordinates: { latitude: 40.9144, longitude: -73.1251 },
        aliases: ['melville library', 'main library', 'frank melville library', 'central library']
      },
      'student union': {
        name: 'Student Activities Center (SAC)',
        coordinates: { latitude: 40.9139, longitude: -73.1263 },
        aliases: ['sac', 'student activities center', 'union', 'student center']
      },
      'administration': {
        name: 'Administration Building',
        coordinates: { latitude: 40.9156, longitude: -73.1245 },
        aliases: ['admin building', 'admin', 'administration building']
      },
      'student health center': {
        name: 'Student Health Center',
        coordinates: { latitude: 40.9162, longitude: -73.1289 },
        aliases: ['health center', 'medical center', 'clinic', 'student health']
      },
      'recreation center': {
        name: 'Campus Recreation Center',
        coordinates: { latitude: 40.9118, longitude: -73.1298 },
        aliases: ['rec center', 'gym', 'fitness center', 'recreation', 'campus rec']
      },

      // STEM Buildings
      'computer science': {
        name: 'Computer Science Building',
        coordinates: { latitude: 40.9142, longitude: -73.1235 },
        aliases: ['cs building', 'comp sci', 'computer science building', 'cs']
      },
      'engineering': {
        name: 'Engineering Building',
        coordinates: { latitude: 40.9138, longitude: -73.1228 },
        aliases: ['engineering building', 'eng building', 'engineering', 'ceas']
      },
      'physics': {
        name: 'Physics Building',
        coordinates: { latitude: 40.9151, longitude: -73.1241 },
        aliases: ['physics building', 'phys building', 'physics', 'physics and astronomy']
      },
      'chemistry': {
        name: 'Chemistry Building',
        coordinates: { latitude: 40.9148, longitude: -73.1238 },
        aliases: ['chem building', 'chemistry building', 'chemistry', 'chem']
      },
      'math tower': {
        name: 'Mathematics Tower',
        coordinates: { latitude: 40.9145, longitude: -73.1242 },
        aliases: ['mathematics tower', 'math building', 'math', 'mathematics']
      },
      'earth and space sciences': {
        name: 'Earth and Space Sciences Building',
        coordinates: { latitude: 40.9147, longitude: -73.1233 },
        aliases: ['ess building', 'earth space sciences', 'geosciences', 'ess']
      },
      'life sciences': {
        name: 'Life Sciences Building',
        coordinates: { latitude: 40.9152, longitude: -73.1239 },
        aliases: ['life sciences building', 'bio building', 'biology', 'life sci']
      },
      'psychology a': {
        name: 'Psychology A Building',
        coordinates: { latitude: 40.9149, longitude: -73.1244 },
        aliases: ['psych a', 'psychology a', 'psych building a']
      },
      'psychology b': {
        name: 'Psychology B Building',
        coordinates: { latitude: 40.9147, longitude: -73.1246 },
        aliases: ['psych b', 'psychology b', 'psych building b']
      },

      // Liberal Arts & Humanities
      'humanities': {
        name: 'Humanities Building',
        coordinates: { latitude: 40.9141, longitude: -73.1248 },
        aliases: ['humanities building', 'hum building', 'humanities', 'hum']
      },
      'social sciences': {
        name: 'Social and Behavioral Sciences Building',
        coordinates: { latitude: 40.9143, longitude: -73.1255 },
        aliases: ['sbs building', 'social behavioral sciences', 'sbs', 'social sciences']
      },
      'fine arts center': {
        name: 'Staller Center for the Arts',
        coordinates: { latitude: 40.9136, longitude: -73.1271 },
        aliases: ['staller center', 'fine arts', 'arts center', 'staller', 'music building']
      },
      'theatre arts': {
        name: 'Theatre Arts Building',
        coordinates: { latitude: 40.9134, longitude: -73.1268 },
        aliases: ['theatre building', 'theater arts', 'drama', 'theatre']
      },

      // Business & Professional Schools
      'business building': {
        name: 'Harriman Hall (Business)',
        coordinates: { latitude: 40.9153, longitude: -73.1258 },
        aliases: ['harriman hall', 'business school', 'business', 'harriman']
      },
      'journalism': {
        name: 'School of Journalism',
        coordinates: { latitude: 40.9140, longitude: -73.1252 },
        aliases: ['journalism building', 'journalism school', 'journalism']
      },

      // Medical Campus
      'hospital': {
        name: 'Stony Brook University Hospital',
        coordinates: { latitude: 40.9201, longitude: -73.1289 },
        aliases: ['university hospital', 'medical center', 'sbu hospital', 'hospital']
      },
      'health sciences center': {
        name: 'Health Sciences Center',
        coordinates: { latitude: 40.9195, longitude: -73.1285 },
        aliases: ['hsc', 'health sciences', 'medical school', 'som']
      },
      'basic science tower': {
        name: 'Basic Science Tower',
        coordinates: { latitude: 40.9198, longitude: -73.1282 },
        aliases: ['bst', 'basic sciences', 'medical basic sciences']
      },
      'clinical center': {
        name: 'Clinical Center',
        coordinates: { latitude: 40.9203, longitude: -73.1291 },
        aliases: ['clinical', 'outpatient clinic']
      },

      // Residential Areas
      'chapin apartments': {
        name: 'Chapin Apartments',
        coordinates: { latitude: 40.9089, longitude: -73.1245 },
        aliases: ['chapin', 'chapin complex', 'chapin apts']
      },
      'west apartments': {
        name: 'West Apartments',
        coordinates: { latitude: 40.9098, longitude: -73.1312 },
        aliases: ['west', 'west complex', 'west apts']
      },
      'roth quad': {
        name: 'Roth Quad',
        coordinates: { latitude: 40.9125, longitude: -73.1278 },
        aliases: ['roth', 'roth quadrangle', 'roth residence']
      },
      'tabler quad': {
        name: 'Tabler Quad',
        coordinates: { latitude: 40.9108, longitude: -73.1265 },
        aliases: ['tabler', 'tabler quadrangle', 'tabler residence']
      },
      'kelly quad': {
        name: 'Kelly Quad',
        coordinates: { latitude: 40.9095, longitude: -73.1285 },
        aliases: ['kelly', 'kelly quadrangle', 'kelly residence']
      },
      'mendelsohn quad': {
        name: 'Mendelsohn Quad',
        coordinates: { latitude: 40.9112, longitude: -73.1295 },
        aliases: ['mendelsohn', 'mendy', 'mendelsohn residence']
      },
      'roosevelt quad': {
        name: 'Roosevelt Quad',
        coordinates: { latitude: 40.9102, longitude: -73.1275 },
        aliases: ['roosevelt', 'roosevelt residence', 'fdr']
      },
      'hand college': {
        name: 'Hand College',
        coordinates: { latitude: 40.9115, longitude: -73.1282 },
        aliases: ['hand', 'hand residence']
      },
      'toscanini college': {
        name: 'Toscanini College',
        coordinates: { latitude: 40.9118, longitude: -73.1285 },
        aliases: ['toscanini', 'toscanini residence', 'tosc']
      },

      // Athletic Facilities
      'seawolves sports complex': {
        name: 'Kenneth P. LaValle Stadium',
        coordinates: { latitude: 40.9088, longitude: -73.1298 },
        aliases: ['lavalle stadium', 'football stadium', 'stadium', 'seawolves stadium']
      },
      'pritchard gymnasium': {
        name: 'Pritchard Gymnasium',
        coordinates: { latitude: 40.9115, longitude: -73.1301 },
        aliases: ['pritchard gym', 'basketball arena', 'pritchard']
      },
      'indoor sports complex': {
        name: 'Indoor Sports Complex',
        coordinates: { latitude: 40.9092, longitude: -73.1305 },
        aliases: ['indoor sports', 'sports complex', 'indoor athletics']
      },

      // Support Buildings
      'central hall': {
        name: 'Central Hall',
        coordinates: { latitude: 40.9146, longitude: -73.1249 },
        aliases: ['central', 'central building']
      },
      'old chemistry': {
        name: 'Old Chemistry Building',
        coordinates: { latitude: 40.9144, longitude: -73.1235 },
        aliases: ['old chem', 'old chemistry building']
      },
      'graduate chemistry': {
        name: 'Graduate Chemistry Building',
        coordinates: { latitude: 40.9150, longitude: -73.1236 },
        aliases: ['grad chem', 'graduate chemistry']
      },
      'heavy engineering': {
        name: 'Heavy Engineering Building',
        coordinates: { latitude: 40.9135, longitude: -73.1225 },
        aliases: ['heavy eng', 'heavy engineering']
      },
      'light engineering': {
        name: 'Light Engineering Building',
        coordinates: { latitude: 40.9140, longitude: -73.1230 },
        aliases: ['light eng', 'light engineering']
      },
      'engineering drive': {
        name: 'Engineering Drive Building',
        coordinates: { latitude: 40.9136, longitude: -73.1232 },
        aliases: ['eng drive', 'engineering drive']
      },

      // Research Buildings
      'centers for molecular medicine': {
        name: 'Centers for Molecular Medicine',
        coordinates: { latitude: 40.9205, longitude: -73.1278 },
        aliases: ['cmm', 'molecular medicine', 'research building']
      },
      'laufer center': {
        name: 'Laufer Center for Physical and Quantitative Biology',
        coordinates: { latitude: 40.9158, longitude: -73.1228 },
        aliases: ['laufer', 'laufer center', 'quantitative biology']
      },
      'simons center': {
        name: 'Simons Center for Geometry and Physics',
        coordinates: { latitude: 40.9160, longitude: -73.1235 },
        aliases: ['simons', 'simons center', 'geometry physics']
      },

      // Dining & Services
      'east side dining': {
        name: 'East Side Dining',
        coordinates: { latitude: 40.9108, longitude: -73.1268 },
        aliases: ['east side', 'esd', 'dining hall east']
      },
      'west side dining': {
        name: 'West Side Dining',
        coordinates: { latitude: 40.9105, longitude: -73.1295 },
        aliases: ['west side', 'wsd', 'dining hall west']
      },
      'campus bookstore': {
        name: 'Campus Bookstore',
        coordinates: { latitude: 40.9138, longitude: -73.1265 },
        aliases: ['bookstore', 'campus store', 'student bookstore']
      },
      'postal services': {
        name: 'Campus Postal Services',
        coordinates: { latitude: 40.9141, longitude: -73.1260 },
        aliases: ['post office', 'mail services', 'postal']
      }
    };
  }

  /**
   * Find a building by name or alias
   * @param {string} buildingName - Name or alias of the building
   * @returns {Object|null} - Building object or null if not found
   */
  findBuilding(buildingName) {
    const searchName = buildingName.toLowerCase().trim();

    // Direct match
    if (this.buildings[searchName]) {
      return { key: searchName, ...this.buildings[searchName] };
    }

    // Search aliases
    for (const [key, building] of Object.entries(this.buildings)) {
      if (building.aliases.some(alias => alias.includes(searchName) || searchName.includes(alias))) {
        return { key, ...building };
      }
    }

    return null;
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {Object} coord1 - {latitude, longitude}
   * @param {Object} coord2 - {latitude, longitude}
   * @returns {number} - Distance in meters
   */
  calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1.latitude * Math.PI / 180;
    const φ2 = coord2.latitude * Math.PI / 180;
    const Δφ = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const Δλ = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Find closest parking lots to a building
   * @param {string} buildingName - Name of the building
   * @param {Array} parkingLots - Array of parking lot objects from database
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Array} - Array of closest parking lots with distances
   */
  findClosestParkingLots(buildingName, parkingLots, maxResults = 3) {
    const building = this.findBuilding(buildingName);
    if (!building) {
      return null;
    }

    // Calculate distances to all parking lots
    const lotsWithDistance = parkingLots
      .filter(lot => lot.location && lot.location.latitude && lot.location.longitude)
      .map(lot => {
        const distance = this.calculateDistance(
          building.coordinates,
          lot.location
        );

        return {
          ...lot.toObject ? lot.toObject() : lot,
          distanceFromBuilding: distance,
          walkingTimeMinutes: Math.ceil(distance / 80) // Assuming 80m/min walking speed
        };
      })
      .sort((a, b) => a.distanceFromBuilding - b.distanceFromBuilding)
      .slice(0, maxResults);

    return {
      building: building,
      closestLots: lotsWithDistance
    };
  }

  /**
   * Get all buildings list
   * @returns {Array} - Array of all buildings
   */
  getAllBuildings() {
    return Object.entries(this.buildings).map(([key, building]) => ({
      key,
      name: building.name,
      aliases: building.aliases
    }));
  }

  /**
   * Format distance for display
   * @param {number} distance - Distance in meters
   * @returns {string} - Formatted distance string
   */
  formatDistance(distance) {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  /**
   * Extract building name from user message
   * @param {string} message - User's message
   * @returns {string|null} - Detected building name or null
   */
  extractBuildingFromMessage(message) {
    const lowerMessage = message.toLowerCase();

    // Look for common patterns
    const patterns = [
      /(?:near|close to|by|at|in|parking (?:for|near)) (.+?)(?:\?|$|\.)/,
      /(?:going to|headed to|visiting) (.+?)(?:\?|$|\.)/,
      /(.+?) (?:building|center|library|quad|apartments?)(?:\?|$|\.)/
    ];

    for (const pattern of patterns) {
      const match = lowerMessage.match(pattern);
      if (match) {
        const extractedText = match[1].trim();
        const building = this.findBuilding(extractedText);
        if (building) {
          return building.key;
        }
      }
    }

    // Direct building search in the message
    for (const [key, building] of Object.entries(this.buildings)) {
      if (lowerMessage.includes(key) ||
        building.aliases.some(alias => lowerMessage.includes(alias))) {
        return key;
      }
    }

    return null;
  }
}

module.exports = new BuildingsService();
