/**
 * Script to list all available buildings in the system
 * Useful for testing and verification
 * 
 * Usage: node scripts/list-buildings.js
 */

const buildingsService = require('../services/buildingsService');

console.log('🏢 SBU Campus Buildings Database\n');
console.log('=' .repeat(60));

const buildings = buildingsService.getAllBuildings();

// Group buildings by category
const categories = {
  'Academic Buildings - Core Campus': [
    'library', 'student union', 'administration', 'student health center', 'recreation center'
  ],
  'STEM Buildings': [
    'computer science', 'engineering', 'physics', 'chemistry', 'math tower', 
    'earth and space sciences', 'life sciences', 'psychology a', 'psychology b'
  ],
  'Liberal Arts & Humanities': [
    'humanities', 'social sciences', 'fine arts center', 'theatre arts'
  ],
  'Business & Professional Schools': [
    'business building', 'journalism'
  ],
  'Medical Campus': [
    'hospital', 'health sciences center', 'basic science tower', 'clinical center'
  ],
  'Residential Areas': [
    'chapin apartments', 'west apartments', 'roth quad', 'tabler quad', 'kelly quad',
    'mendelsohn quad', 'roosevelt quad', 'hand college', 'toscanini college'
  ],
  'Athletic Facilities': [
    'seawolves sports complex', 'pritchard gymnasium', 'indoor sports complex'
  ],
  'Support Buildings': [
    'central hall', 'old chemistry', 'graduate chemistry', 'heavy engineering',
    'light engineering', 'engineering drive'
  ],
  'Research Buildings': [
    'centers for molecular medicine', 'laufer center', 'simons center'
  ],
  'Dining & Services': [
    'east side dining', 'west side dining', 'campus bookstore', 'postal services'
  ]
};

// Display buildings by category
Object.entries(categories).forEach(([category, buildingKeys]) => {
  console.log(`\n📍 ${category}`);
  console.log('-'.repeat(category.length + 4));
  
  buildingKeys.forEach(key => {
    const building = buildings.find(b => b.key === key);
    if (building) {
      console.log(`  • ${building.name}`);
      console.log(`    Aliases: ${building.aliases.join(', ')}`);
      console.log('');
    }
  });
});

console.log(`\n📊 Total Buildings: ${buildings.length}`);
console.log('\n🔍 Test Examples:');
console.log('Try asking the chatbot:');
console.log('  • "I need parking near the library"');
console.log('  • "Where can I park close to the computer science building?"');
console.log('  • "Parking near Roth quad"');
console.log('  • "I\'m going to the hospital, where should I park?"');
console.log('  • "Best parking for the recreation center"');

console.log('\n✨ The chatbot will automatically detect building names and provide:');
console.log('  • Closest parking lots with distances');
console.log('  • Walking times to each lot');
console.log('  • Real-time availability');
console.log('  • Pricing and permit information');
console.log('  • AI-powered recommendations');

// Test building detection
console.log('\n🧪 Testing Building Detection:');
const testMessages = [
  "I need parking near the library",
  "Where can I park close to CS building?",
  "Parking for Roth quad",
  "Going to the hospital",
  "Best parking for rec center"
];

testMessages.forEach(message => {
  const detected = buildingsService.extractBuildingFromMessage(message);
  console.log(`  "${message}" → ${detected || 'No building detected'}`);
});

console.log('\n🎯 All buildings are now available in the chatbot!');
console.log('Users can ask about parking near any of these locations.');
