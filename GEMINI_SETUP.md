# 🤖 Gemini AI Integration Setup Guide

## Overview

This guide will help you integrate Google's Gemini 2.5 Flash model into your P4SBU parking management chatbot for intelligent, context-aware responses.

## Prerequisites

- Node.js and npm installed
- P4SBU project set up and running
- Google account for API access

## Step 1: Get Gemini API Key

1. **Visit Google AI Studio:**
   - Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account

2. **Create API Key:**
   - Click "Create API Key"
   - Choose "Create API key in new project" or select existing project
   - Copy the generated API key (keep it secure!)

3. **Important Notes:**
   - Keep your API key private and secure
   - Don't commit it to version control
   - The free tier includes generous usage limits

## Step 2: Install Dependencies

```bash
# Navigate to server directory
cd server

# Install Google Generative AI package
npm install @google/generative-ai
```

## Step 3: Configure Environment Variables

1. **Add to server/.env file:**
   ```bash
   # Gemini AI configuration for intelligent chatbot responses
   GEMINI_API_KEY=your_actual_api_key_here
   ```

2. **Example .env entry:**
   ```bash
   GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Step 4: Test the Integration

Run the test script to verify everything is working:

```bash
# From the server directory
npm run test:gemini
```

**Expected output:**
```
🤖 Testing Gemini AI Integration...

✅ Gemini API key found
✅ Gemini service is available

🧪 Testing basic response generation...
✅ Basic response generation successful!
📝 Response:
──────────────────────────────────────────────────
Hello John! I'd be happy to help you find parking on campus...
──────────────────────────────────────────────────

🎉 All Gemini AI tests passed successfully!
🚀 Your chatbot is ready to use AI-powered responses!
```

## Step 5: Start the Application

```bash
# Terminal 1 - Start the server
cd server
npm start

# Terminal 2 - Start the client
cd client
npm run dev
```

## Step 6: Test the Chatbot

1. **Open the application** in your browser (usually http://localhost:5173)
2. **Click the blue robot icon** in the bottom-right corner
3. **Try these test messages:**
   - "I need help finding parking"
   - "What parking is available right now?"
   - "Show me my reservations"
   - "How much does parking cost?"

4. **Look for the AI indicator:**
   - AI-generated responses will show a "✨ AI" badge
   - Fallback responses won't have this badge

## Features of Gemini Integration

### 🧠 **Intelligent Responses**
- Natural language understanding
- Context-aware answers based on real parking data
- Personalized responses using user information
- Conversational tone and helpful suggestions

### 🔄 **Fallback System**
- Graceful degradation if API is unavailable
- Rule-based responses as backup
- No interruption to user experience

### 📊 **Context Integration**
- Real-time parking lot availability
- User's current reservations and permits
- Campus-wide statistics and trends
- Personalized recommendations

## Troubleshooting

### ❌ "GEMINI_API_KEY not found"
**Solution:** Add your API key to the server/.env file

### ❌ "Gemini service is not available"
**Solutions:**
- Check your API key is correct
- Verify internet connection
- Check Google AI Studio for API status

### ❌ "Failed to generate AI response"
**Solutions:**
- Check API quota limits
- Verify API key permissions
- The chatbot will automatically fall back to rule-based responses

### 🔍 **Debug Mode**
Enable detailed logging by setting:
```bash
# In server/.env
NODE_ENV=development
```

## API Usage and Limits

### **Free Tier Limits:**
- 15 requests per minute
- 1,500 requests per day
- 1 million tokens per month

### **Rate Limiting:**
The integration includes automatic retry logic and graceful fallbacks to stay within limits.

### **Cost Optimization:**
- Responses are cached when possible
- Context is optimized to reduce token usage
- Fallback responses prevent unnecessary API calls

## Customization

### **Modify System Prompt:**
Edit `server/services/geminiService.js`:

```javascript
this.systemPrompt = `You are the SBU Parking Assistant...
// Customize the assistant's personality and knowledge here
`;
```

### **Add New Intents:**
1. Add intent detection in frontend
2. Add case in `server/routes/chatbot.js`
3. Add intent handler in `geminiService.js`

### **Adjust Response Style:**
Modify the prompt engineering in `generateIntentResponse()` method.

## Security Best Practices

1. **Never expose API key in frontend code**
2. **Use environment variables for configuration**
3. **Implement rate limiting if needed**
4. **Monitor API usage regularly**
5. **Rotate API keys periodically**

## Monitoring and Analytics

### **Track Usage:**
- Monitor API calls in Google Cloud Console
- Track response quality and user satisfaction
- Analyze common queries for improvements

### **Performance Metrics:**
- Response time (typically 1-3 seconds)
- Success rate (should be >95%)
- Fallback usage (should be <5%)

## Next Steps

1. **Collect User Feedback:** Monitor how users interact with AI responses
2. **Improve Prompts:** Refine system prompts based on usage patterns
3. **Add Features:** Consider voice input/output, file attachments
4. **Scale Up:** Upgrade to paid tier if usage grows

## Support

- **Google AI Documentation:** [https://ai.google.dev/docs](https://ai.google.dev/docs)
- **API Reference:** [https://ai.google.dev/api](https://ai.google.dev/api)
- **Community Forum:** [https://discuss.ai.google.dev/](https://discuss.ai.google.dev/)

## Success Indicators

✅ Test script passes all checks
✅ Chatbot shows "✨ AI" badges on responses
✅ Responses are contextual and helpful
✅ Fallback system works when API is unavailable
✅ No errors in server logs

Your chatbot is now powered by Google's Gemini 2.5 Flash model! 🎉
