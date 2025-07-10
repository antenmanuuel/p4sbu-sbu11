# 🤖 SBU Parking Assistant Chatbot

## Overview

The SBU Parking Assistant is an **AI-powered chatbot** integrated into the P4SBU parking management system. Powered by **Google's Gemini 2.5 Flash** model, it provides users with intelligent, context-aware assistance for parking-related questions and tasks through a natural conversational interface.

## Features

### 🎯 **Core Capabilities**

- **AI-Powered Responses**: Uses Google Gemini 2.5 Flash for intelligent, natural conversations
- **Real-time Parking Information**: Get live availability data for all campus lots
- **Personalized Responses**: Tailored answers based on user profile and history
- **Quick Actions**: One-click access to common tasks
- **Smart Intent Detection**: Understands natural language queries
- **Contextual Help**: Provides relevant assistance based on user type and current needs
- **Fallback System**: Graceful degradation to rule-based responses if AI is unavailable

### 💬 **Supported Intents**
1. **Find Parking** - Locate available parking spots
2. **Building-Specific Parking** - Find closest lots to specific campus buildings
3. **Check Availability** - View real-time lot occupancy
4. **My Reservations** - Review current and upcoming bookings
5. **My Permits** - Check active permits and validity
6. **Payment Help** - Assistance with billing and payments
7. **General Help** - Information about parking policies and procedures

### 🚀 **Quick Actions**
- Find Parking
- Near Building (Building-specific parking)
- My Reservations
- Payment Help

## AI Integration

### Google Gemini 2.5 Flash

The chatbot leverages **Google's Gemini 2.5 Flash** model for intelligent responses:

- **Natural Language Understanding**: Processes user queries in natural language
- **Context-Aware Responses**: Uses real-time parking data and user information
- **Personalized Communication**: Adapts tone and content based on user profile
- **Fallback System**: Gracefully falls back to rule-based responses if AI is unavailable

### AI Service (`server/services/geminiService.js`)

```javascript
const geminiService = require('../services/geminiService');

// Generate intelligent response with context
const response = await geminiService.generateIntentResponse('findParking', {
  user: userInfo,
  parkingData: realTimeData
});
```

**Features:**
- Context-aware prompt engineering
- Real-time data integration
- Error handling with fallbacks
- Configurable system prompts

## Technical Implementation

### Frontend Component (`client/src/components/Chatbot.jsx`)

```jsx
<Chatbot 
  darkMode={darkMode}
  user={user}
  isAuthenticated={isAuthenticated}
/>
```

**Key Features:**
- Responsive design with dark/light mode support
- Real-time typing indicators
- Message history with timestamps
- Auto-scroll to latest messages
- Quick action buttons for common tasks
- Fallback to local responses when API is unavailable

### Backend API (`server/routes/chatbot.js`)

**Endpoints:**
- `POST /api/chatbot/chat` - Process chat messages
- `GET /api/chatbot/stats` - Get user statistics for context

**Intelligence Features:**
- Database integration for real-time data
- Personalized responses using user information
- Context-aware suggestions based on current system state
- Error handling with graceful fallbacks

## Usage Examples

### Finding Parking
**User:** "I need to find parking"
**Bot:** "Great news John! I found 3 lots with available spaces:

🅿️ North P Lot: 45/100 spaces available
   Rate: $2.50/hour

🅿️ South Campus: 23/80 spaces available  
   Rate: $3.00/hour

🅿️ West Side Lot: 12/60 spaces available
   Rate: $2.00/hour

Would you like me to help you make a reservation?"

### Checking Reservations
**User:** "Show my reservations"
**Bot:** "Here are your current reservations:

🎫 North P Lot
   12/15/2024 2:00 PM - 12/15/2024 6:00 PM
   Status: active

🎫 Library Lot
   12/16/2024 9:00 AM - 12/16/2024 12:00 PM
   Status: pending"

### Building-Specific Parking
**User:** "I need parking near the computer science building"
**Bot:** "Perfect! Here are the closest parking options to the Computer Science Building:

🅿️ **North P Lot**
   📍 120m away (2 min walk)
   🚗 23/100 spaces available
   💰 $2.50/hour
   🎫 Permits: Student, Faculty

🅿️ **Academic Mall Lot**
   📍 180m away (3 min walk)
   🚗 15/60 spaces available
   💰 $3.00/hour
   🎫 Permits: Student, Faculty, Staff

💡 Tip: North P Lot is your closest option, just a 2-minute walk from the CS building!"

### Getting Help
**User:** "I need help with parking"
**Bot:** "I'm here to help! Here's what I can do:

🔍 Find available parking spots
📅 Check your reservations
🎫 Review your permits
📊 Show parking availability
💳 Help with payments
📞 Connect you with support

Just ask me anything about parking!"

## Installation & Setup

### 1. Frontend Integration

The chatbot is already integrated into `AppContent.jsx`:

```jsx
import Chatbot from './components/Chatbot.jsx';

// In the component render:
<Chatbot
  darkMode={darkMode}
  user={user}
  isAuthenticated={isAuthenticated}
/>
```

### 2. Backend Setup

The chatbot routes are registered in `server.js`:

```javascript
const chatbotRoutes = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoutes);
```

### 3. Install Dependencies

**Backend:**
```bash
cd server
npm install @google/generative-ai
```

**Frontend:**
- React Icons (already included)
- Axios for API calls (already included)

**Backend:**
- Express.js (already included)
- Mongoose for database queries (already included)
- JWT authentication middleware (already included)
- Google Generative AI SDK (newly added)

### 4. Configure Gemini AI

1. **Get Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the API key

2. **Add to Environment Variables:**
   ```bash
   # In server/.env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Verify Setup:**
   The chatbot will automatically detect if Gemini AI is available and use it for responses. If the API key is missing or invalid, it will fall back to rule-based responses.

## Testing

### Running Tests

```bash
# Backend API tests
cd server
npm test -- chatbot.test.js

# Frontend component tests (if implemented)
cd client
npm test -- Chatbot.test.jsx
```

### Test Coverage

The chatbot includes comprehensive tests for:
- All intent handling
- Authentication requirements
- Error handling
- Database integration
- Response formatting

## Customization

### Adding New Intents

1. **Frontend** - Add to `detectIntent()` function:
```javascript
if (lowerMessage.includes('new-intent-keyword')) {
  return 'newIntent';
}
```

2. **Backend** - Add case to switch statement:
```javascript
case 'newIntent':
  // Custom logic here
  response = "Custom response for new intent";
  break;
```

### Styling Customization

The chatbot supports full theming through Tailwind CSS classes:
- Dark/light mode automatic switching
- Responsive design for mobile/desktop
- Customizable colors and animations

### Response Personalization

Responses automatically include:
- User's first name
- User type (student/faculty/admin)
- Current system state
- Historical context

## Performance Considerations

- **Lazy Loading**: Chatbot only loads when opened
- **API Fallbacks**: Local responses when backend unavailable
- **Caching**: Quick stats cached for better performance
- **Debouncing**: Prevents spam requests
- **Memory Management**: Message history limited to prevent memory leaks

## Security

- **Authentication Required**: Backend API requires valid JWT
- **Input Validation**: All user inputs sanitized
- **Rate Limiting**: Prevents abuse (can be added)
- **Error Handling**: No sensitive data exposed in errors

## Future Enhancements

### Planned Features
- **Voice Input/Output**: Speech recognition and synthesis
- **File Attachments**: Share parking permits, receipts
- **Multi-language Support**: Spanish, Chinese, etc.
- **Advanced AI**: Integration with OpenAI or similar services
- **Push Notifications**: Proactive parking alerts
- **Analytics Dashboard**: Usage metrics and insights

### Integration Opportunities
- **Campus Events**: Automatic parking suggestions for events
- **Weather Integration**: Parking recommendations based on weather
- **Traffic Data**: Real-time traffic-aware suggestions
- **Mobile App**: Native mobile chatbot experience

## Troubleshooting

### Common Issues

1. **Chatbot not responding**
   - Check authentication status
   - Verify backend API is running
   - Check browser console for errors

2. **Outdated information**
   - Backend automatically fetches real-time data
   - Check database connection
   - Verify lot data is current

3. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check dark/light mode state
   - Verify responsive breakpoints

### Debug Mode

Enable debug logging by adding to localStorage:
```javascript
localStorage.setItem('chatbot-debug', 'true');
```

## Contributing

When contributing to the chatbot:
1. Follow existing code patterns
2. Add tests for new features
3. Update documentation
4. Test both authenticated and non-authenticated flows
5. Ensure mobile responsiveness

## License

This chatbot feature is part of the P4SBU project and follows the same MIT license.
