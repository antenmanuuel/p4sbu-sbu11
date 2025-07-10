/**
 * Test script for Gemini AI integration
 * Run this to verify your Gemini API key is working correctly
 * 
 * Usage: node scripts/test-gemini.js
 */

require('dotenv').config();
const geminiService = require('../services/geminiService');

async function testGeminiIntegration() {
  console.log('🤖 Testing Gemini AI Integration...\n');

  // Check if API key is configured
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    console.log('Please add your Gemini API key to the .env file:');
    console.log('GEMINI_API_KEY=your_api_key_here\n');
    console.log('Get your API key from: https://makersuite.google.com/app/apikey');
    process.exit(1);
  }

  // Check if service is available
  if (!geminiService.isAvailable()) {
    console.error('❌ Gemini service is not available');
    console.log('Please check your API key configuration');
    process.exit(1);
  }

  console.log('✅ Gemini API key found');
  console.log('✅ Gemini service is available\n');

  // Test basic response generation
  try {
    console.log('🧪 Testing basic response generation...');
    
    const testContext = {
      user: {
        firstName: 'John',
        lastName: 'Doe',
        userType: 'student',
        email: 'john.doe@stonybrook.edu'
      },
      message: 'Hello, I need help finding parking',
      parkingData: {
        availableLots: [
          {
            name: 'North P Lot',
            availableSpaces: 45,
            totalSpaces: 100,
            hourlyRate: 2.50,
            permitTypes: ['Student', 'Faculty']
          },
          {
            name: 'South Campus Lot',
            availableSpaces: 23,
            totalSpaces: 80,
            hourlyRate: 3.00,
            permitTypes: ['Student']
          }
        ]
      }
    };

    const response = await geminiService.generateResponse(
      'I need help finding parking on campus',
      testContext
    );

    console.log('✅ Basic response generation successful!');
    console.log('📝 Response:');
    console.log('─'.repeat(50));
    console.log(response);
    console.log('─'.repeat(50));
    console.log();

  } catch (error) {
    console.error('❌ Basic response generation failed:', error.message);
    return;
  }

  // Test intent-specific responses
  try {
    console.log('🧪 Testing intent-specific responses...');

    const intentContext = {
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'faculty',
        email: 'jane.smith@stonybrook.edu'
      },
      parkingData: {
        availableLots: [
          {
            name: 'Faculty Lot A',
            availableSpaces: 12,
            totalSpaces: 50,
            hourlyRate: 0,
            permitTypes: ['Faculty']
          }
        ]
      }
    };

    const intentResponse = await geminiService.generateIntentResponse(
      'findParking',
      intentContext
    );

    console.log('✅ Intent-specific response generation successful!');
    console.log('📝 Find Parking Response:');
    console.log('─'.repeat(50));
    console.log(intentResponse);
    console.log('─'.repeat(50));
    console.log();

  } catch (error) {
    console.error('❌ Intent-specific response generation failed:', error.message);
    return;
  }

  // Test error handling
  try {
    console.log('🧪 Testing error handling...');

    // Test with minimal context
    const minimalResponse = await geminiService.generateResponse(
      'What are the parking hours?',
      { user: { firstName: 'Test' } }
    );

    console.log('✅ Error handling test successful!');
    console.log('📝 Minimal Context Response:');
    console.log('─'.repeat(50));
    console.log(minimalResponse);
    console.log('─'.repeat(50));
    console.log();

  } catch (error) {
    console.error('❌ Error handling test failed:', error.message);
    return;
  }

  console.log('🎉 All Gemini AI tests passed successfully!');
  console.log('🚀 Your chatbot is ready to use AI-powered responses!');
  console.log('\nNext steps:');
  console.log('1. Start your server: npm start');
  console.log('2. Open the client application');
  console.log('3. Click the chatbot icon and start chatting!');
}

// Run the test
testGeminiIntegration().catch(error => {
  console.error('💥 Test failed with error:', error);
  process.exit(1);
});
