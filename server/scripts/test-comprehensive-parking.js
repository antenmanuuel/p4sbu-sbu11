/**
 * Comprehensive test script for parking database integration
 * Tests that all parking lot information is properly retrieved and displayed
 * 
 * Usage: node scripts/test-comprehensive-parking.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Lot = require('../models/lot');
const buildingsService = require('../services/buildingsService');

async function testComprehensiveParkingData() {
  console.log('🧪 Testing Comprehensive Parking Database Integration\n');
  console.log('=' .repeat(60));

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Fetch all lots with comprehensive data
    console.log('\n📊 Test 1: Fetching all lots with comprehensive data...');
    const allLots = await Lot.find({ status: 'Active' })
      .select('name availableSpaces totalSpaces hourlyRate semesterRate rateType location permitTypes features operatingHours evSpaces meteredSpaces address description');

    console.log(`Found ${allLots.length} active lots in database`);

    if (allLots.length === 0) {
      console.log('⚠️  No lots found in database. Please add some test data.');
      return;
    }

    // Display comprehensive lot information
    allLots.slice(0, 3).forEach((lot, index) => {
      console.log(`\n${index + 1}. **${lot.name}**`);
      console.log(`   📍 Address: ${lot.address || 'Not specified'}`);
      console.log(`   🚗 Capacity: ${lot.availableSpaces}/${lot.totalSpaces} spaces available`);
      
      // Pricing information
      if (lot.rateType === 'Hourly') {
        console.log(`   💰 Pricing: $${lot.hourlyRate}/hour`);
      } else if (lot.features?.isSemesterBased) {
        console.log(`   💰 Pricing: $${lot.semesterRate}/semester (permit required)`);
      } else {
        console.log(`   💰 Pricing: Permit-based only`);
      }
      
      // Special features
      const features = [];
      if (lot.features?.isEV) {
        const evInfo = lot.evSpaces?.total > 0 ? 
          `(${lot.evSpaces.available}/${lot.evSpaces.total} available)` : '';
        features.push(`⚡ EV charging ${evInfo}`);
      }
      if (lot.features?.isMetered) {
        const meteredInfo = lot.meteredSpaces?.total > 0 ? 
          `(${lot.meteredSpaces.available}/${lot.meteredSpaces.total} available)` : '';
        features.push(`🪙 Metered parking ${meteredInfo}`);
      }
      if (lot.features?.isAccessible) {
        features.push('♿ Accessible parking');
      }
      if (lot.features?.isSemesterBased) {
        features.push('📅 Semester permits available');
      }
      
      if (features.length > 0) {
        console.log(`   ✨ Features: ${features.join(', ')}`);
      }
      
      console.log(`   🎫 Permits: ${lot.permitTypes.join(', ')}`);
      
      // Operating hours (if available)
      if (lot.operatingHours?.monday) {
        console.log(`   🕐 Hours: ${lot.operatingHours.monday.start} - ${lot.operatingHours.monday.end} (Mon-Fri)`);
      }
      
      if (lot.description) {
        console.log(`   📝 Description: ${lot.description}`);
      }
    });

    // Test 2: Building-specific parking recommendations
    console.log('\n\n📍 Test 2: Building-specific parking recommendations...');
    const testBuilding = 'library';
    const buildingRecommendation = buildingsService.findClosestParkingLots(testBuilding, allLots, 3);
    
    if (buildingRecommendation) {
      console.log(`\nClosest parking to ${buildingRecommendation.building.name}:`);
      buildingRecommendation.closestLots.forEach((lot, index) => {
        console.log(`\n${index + 1}. **${lot.name}**`);
        console.log(`   📍 Distance: ${buildingsService.formatDistance(lot.distanceFromBuilding)} (${lot.walkingTimeMinutes} min walk)`);
        console.log(`   🚗 Availability: ${lot.availableSpaces}/${lot.totalSpaces} spaces`);
        
        if (lot.rateType === 'Hourly') {
          console.log(`   💰 Cost: $${lot.hourlyRate}/hour`);
        } else if (lot.features?.isSemesterBased) {
          console.log(`   💰 Cost: $${lot.semesterRate}/semester`);
        } else {
          console.log(`   💰 Cost: Permit required`);
        }
        
        // Special features for this lot
        const features = [];
        if (lot.features?.isEV && lot.evSpaces?.available > 0) {
          features.push(`⚡ EV charging (${lot.evSpaces.available} available)`);
        }
        if (lot.features?.isMetered && lot.meteredSpaces?.available > 0) {
          features.push(`🪙 Metered (${lot.meteredSpaces.available} available)`);
        }
        if (features.length > 0) {
          console.log(`   ✨ Features: ${features.join(', ')}`);
        }
      });
    }

    // Test 3: Statistics calculation
    console.log('\n\n📊 Test 3: Campus parking statistics...');
    const totalSpaces = allLots.reduce((sum, lot) => sum + lot.totalSpaces, 0);
    const availableSpaces = allLots.reduce((sum, lot) => sum + lot.availableSpaces, 0);
    const occupancyRate = ((totalSpaces - availableSpaces) / totalSpaces * 100).toFixed(1);
    
    const evTotal = allLots.reduce((sum, lot) => sum + (lot.evSpaces?.total || 0), 0);
    const evAvailable = allLots.reduce((sum, lot) => sum + (lot.evSpaces?.available || 0), 0);
    const meteredTotal = allLots.reduce((sum, lot) => sum + (lot.meteredSpaces?.total || 0), 0);
    const meteredAvailable = allLots.reduce((sum, lot) => sum + (lot.meteredSpaces?.available || 0), 0);
    
    console.log(`📊 Overall occupancy: ${occupancyRate}%`);
    console.log(`🅿️ Total spaces: ${availableSpaces}/${totalSpaces} available`);
    
    if (evTotal > 0) {
      console.log(`⚡ EV charging: ${evAvailable}/${evTotal} available`);
    }
    if (meteredTotal > 0) {
      console.log(`🪙 Metered parking: ${meteredAvailable}/${meteredTotal} available`);
    }

    // Test 4: Pricing breakdown
    console.log('\n\n💰 Test 4: Pricing breakdown...');
    const hourlyLots = allLots.filter(lot => lot.rateType === 'Hourly');
    const semesterLots = allLots.filter(lot => lot.features?.isSemesterBased);
    const permitLots = allLots.filter(lot => lot.rateType === 'Permit-based');
    
    console.log(`Hourly parking: ${hourlyLots.length} lots`);
    if (hourlyLots.length > 0) {
      const avgHourly = (hourlyLots.reduce((sum, lot) => sum + lot.hourlyRate, 0) / hourlyLots.length).toFixed(2);
      console.log(`  Average rate: $${avgHourly}/hour`);
    }
    
    console.log(`Semester permits: ${semesterLots.length} lots`);
    if (semesterLots.length > 0) {
      const avgSemester = (semesterLots.reduce((sum, lot) => sum + (lot.semesterRate || 0), 0) / semesterLots.length).toFixed(2);
      console.log(`  Average rate: $${avgSemester}/semester`);
    }
    
    console.log(`Permit-only lots: ${permitLots.length} lots`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n🎯 The chatbot will now provide comprehensive information including:');
    console.log('  • Real-time availability from database');
    console.log('  • Hourly and semester pricing');
    console.log('  • EV charging station availability');
    console.log('  • Metered parking options');
    console.log('  • Accessible parking information');
    console.log('  • Operating hours and enforcement');
    console.log('  • Building-specific recommendations with distances');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testComprehensiveParkingData().catch(error => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
