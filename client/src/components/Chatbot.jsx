import React, { useState, useEffect, useRef } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaUser, FaParking, FaCreditCard, FaQuestionCircle, FaMapMarkerAlt, FaUserCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const Chatbot = ({ darkMode, user, isAuthenticated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = {
        id: Date.now(),
        text: `Hello! I'm your SBU Parking Assistant 🚗. I can help you with:

• Finding parking spots
• Checking availability
• Reservation assistance
• Permit information
• Payment help
• General parking questions

How can I assist you today?`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Predefined responses - different for authenticated vs guest users
  const authenticatedBotResponses = {
    greeting: [
      "Hello! How can I help you with parking today?",
      "Hi there! What parking assistance do you need?",
      "Welcome! I'm here to help with all your parking needs."
    ],

    findParking: [
      "I can help you find parking! Let me check real-time availability and personalized recommendations based on your profile.",
      "Looking for a parking spot? I'll search our database for the best options based on your vehicle and preferences!"
    ],

    myReservations: [
      "Let me check your current reservations for you! I can show you:\n\n✅ Active reservations\n✅ Upcoming bookings\n✅ Reservation details and costs\n✅ Vehicle information\n\nWould you like me to help you modify or extend any reservations?"
    ],

    myPermits: [
      "I can help you with your parking permits! Here's what I can show you:\n\n🎫 Active permits and expiration dates\n🎫 Permitted parking lots\n🎫 Renewal reminders\n🎫 Payment status\n\nNeed help purchasing a new permit or renewing an existing one?"
    ],

    myTickets: [
      "Let me check your parking tickets for you. I can show you:\n\n🎫 Any unpaid tickets and amounts owed\n🎫 Recent payment history\n🎫 Petition options if available\n🎫 Payment methods and deadlines\n\nRemember: unpaid tickets may affect your ability to make new reservations!"
    ],

    myProfile: [
      "I can show you your complete parking profile including:\n\n👤 Personal information and account status\n🚗 Registered vehicles\n📊 Parking history and spending\n🔔 Notification preferences\n🎫 Active permits and tickets\n\nWould you like me to help you update any information?"
    ],

    payment: [
      "For parking payments, I can help with:\n\n💳 Recent payment history\n💳 Outstanding balances\n💳 Payment methods on file\n💳 Billing questions\n\nAll payments are processed securely through Stripe. Need help with a specific payment?"
    ],

    help: [
      "I'm here to help! Here's what I can do:\n\n🔍 Find available parking spots\n📅 Check your reservations\n🎫 Review your permits and tickets\n📊 Show parking availability\n💳 Help with payments\n👤 Show your profile information\n📞 Connect you with support\n\nJust ask me anything about parking!"
    ],

    availability: [
      "Let me check real-time parking availability across campus with personalized recommendations for you!"
    ],

    buildingParking: [
      "I'd love to help you find parking near a specific building! Just tell me which building you're visiting and I'll find the closest available spots with walking distances."
    ],

    hours: [
      "Parking enforcement hours vary by lot:\n\n🕐 Most lots: 7 AM - 10 PM (weekdays)\n🕐 Some lots: 24/7 enforcement\n🕐 Visitor lots: 8 AM - 6 PM\n🕐 Weekends: Limited enforcement\n\nCheck specific lot details for exact hours!"
    ],

    contact: [
      "Need more help? Contact parking services:\n\n📞 Phone: (631) 632-PARK\n📧 Email: parking@stonybrook.edu\n🏢 Office: Administration Building\n\nFor emergencies or urgent issues, call campus security at (631) 632-3333"
    ],

    default: [
      "I understand you're asking about parking. I can help you with:\n\n🅿️ Finding parking spots\n📅 Managing reservations\n🎫 Checking permits and tickets\n💳 Payment assistance\n👤 Profile information\n\nCould you be more specific about what you need?"
    ]
  };

  const guestBotResponses = {
    greeting: [
      "Hello! I can help you find parking on campus. Please log in for personalized assistance with reservations and permits.",
      "Welcome to SBU Parking! I can show you available parking spots and general information. Log in to access your account features.",
      "Hi there! I can help you find parking spots on campus. For personal account features, please log in first."
    ],

    findParking: [
      "I can help you find parking! Here are your options:\n\n1. Use our 'Find Parking' feature to see general availability\n2. Check the campus map for lot locations\n3. View pricing and permit requirements\n\n💡 Log in to get personalized recommendations and make reservations!",
      "Looking for a parking spot? I can show you general availability on campus!\n\n🔐 Please log in to access personalized parking recommendations, check your vehicle info, and make reservations."
    ],

    buildingParking: [
      "I can help you find parking near campus buildings! Just tell me which building you're visiting.\n\n💡 For the best recommendations and to make reservations, please log in to your account."
    ],

    availability: [
      "I can show you general parking availability across campus.\n\n🔐 Log in to see personalized availability based on your permits and preferences!"
    ],

    hours: [
      "Parking enforcement hours vary by lot:\n\n🕐 Most lots: 7 AM - 10 PM (weekdays)\n🕐 Some lots: 24/7 enforcement\n🕐 Visitor lots: 8 AM - 6 PM\n🕐 Weekends: Limited enforcement\n\nCheck specific lot details for exact hours!"
    ],

    contact: [
      "Need more help? Contact parking services:\n\n📞 Phone: (631) 632-PARK\n📧 Email: parking@stonybrook.edu\n🏢 Office: Administration Building\n\nFor emergencies or urgent issues, call campus security at (631) 632-3333"
    ],

    // Redirect personal account features to login
    myReservations: [
      "🔐 **Login Required**\n\nTo view your reservations, please log in to your account first.\n\nOnce logged in, I can show you:\n✅ Your active reservations\n✅ Upcoming bookings\n✅ Reservation history\n\nClick the login button to get started!"
    ],

    myPermits: [
      "🔐 **Login Required**\n\nTo view your permits, please log in to your account first.\n\nOnce logged in, I can help you:\n🎫 Check permit status\n🎫 View expiration dates\n🎫 Manage renewals\n\nClick the login button to access your permits!"
    ],

    myTickets: [
      "🔐 **Login Required**\n\nTo view your parking tickets, please log in to your account first.\n\nOnce logged in, I can show you:\n🎫 Outstanding tickets\n🎫 Payment history\n🎫 Appeal options\n\nClick the login button to check your tickets!"
    ],

    myProfile: [
      "🔐 **Login Required**\n\nTo view your profile, please log in to your account first.\n\nOnce logged in, you can access:\n👤 Account information\n🚗 Vehicle details\n📊 Parking history\n🔔 Notification settings\n\nClick the login button to view your profile!"
    ],

    payment: [
      "🔐 **Login Required**\n\nTo view payment information, please log in to your account first.\n\nOnce logged in, I can help with:\n💳 Payment history\n💳 Outstanding balances\n💳 Payment methods\n\nClick the login button to access payment features!"
    ],

    help: [
      "I'm here to help! As a guest, I can assist with:\n\n🔍 Finding available parking spots\n📍 Locating parking near buildings\n🕐 Parking hours and rules\n📞 Contact information\n\n🔐 **For full features, please log in to access:**\n📅 Your reservations\n🎫 Your permits and tickets\n💳 Payment history\n👤 Profile management"
    ],

    default: [
      "I can help you with general parking information.\n\n🅿️ Finding parking spots\n📍 Building locations\n🕐 Parking hours\n📞 Contact support\n\n🔐 **For personal account features, please log in first!**"
    ]
  };

  // Select appropriate responses based on authentication
  const botResponses = isAuthenticated ? authenticatedBotResponses : guestBotResponses;

  // Quick actions - different sets based on authentication status
  const authenticatedQuickActions = [
    { text: "Find Parking", icon: FaParking, action: "findParking" },
    { text: "Near Building", icon: FaMapMarkerAlt, action: "buildingParking" },
    { text: "My Reservations", icon: FaUser, action: "myReservations" },
    { text: "My Profile", icon: FaUserCircle, action: "myProfile" },
    { text: "My Tickets", icon: FaExclamationTriangle, action: "myTickets" },
    { text: "Payment Help", icon: FaCreditCard, action: "payment" }
  ];

  const guestQuickActions = [
    { text: "Find Parking", icon: FaParking, action: "findParking" },
    { text: "Near Building", icon: FaMapMarkerAlt, action: "buildingParking" },
    { text: "Parking Hours", icon: FaQuestionCircle, action: "hours" },
    { text: "Contact Support", icon: FaCreditCard, action: "contact" }
  ];

  // Select appropriate quick actions based on authentication
  const quickActions = isAuthenticated ? authenticatedQuickActions : guestQuickActions;

  // Enhanced intent detection function
  const detectIntent = (message) => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return 'greeting';
    }

    // Profile and account related - always detect these intents
    // The response will differ based on authentication status
    if (lowerMessage.includes('profile') || lowerMessage.includes('account') || lowerMessage.includes('my info') || lowerMessage.includes('personal info')) {
      return 'myProfile';
    }

    // Tickets and violations
    if (lowerMessage.includes('ticket') || lowerMessage.includes('fine') || lowerMessage.includes('violation') || lowerMessage.includes('citation')) {
      return 'myTickets';
    }

    // Permits
    if (lowerMessage.includes('permit') || lowerMessage.includes('pass') || lowerMessage.includes('my permits')) {
      return 'myPermits';
    }

    // Reservations
    if (lowerMessage.includes('reservation') || lowerMessage.includes('book') || lowerMessage.includes('reserve') || lowerMessage.includes('my reservations')) {
      return 'myReservations';
    }

    // Payment and billing - sensitive when asking about "my" payments
    if (lowerMessage.includes('my payment') || lowerMessage.includes('my bill') || lowerMessage.includes('payment history') || lowerMessage.includes('billing')) {
      return 'payment';
    }

    // General payment info (allowed for guests)
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('credit') || lowerMessage.includes('card')) {
      return isAuthenticated ? 'payment' : 'contact'; // Redirect guests to contact info
    }

    // Check for building-specific parking queries
    const buildingKeywords = [
      // Core Academic
      'library', 'melville', 'student union', 'sac', 'administration', 'admin', 'health center',
      'recreation center', 'rec center', 'gym', 'student center',

      // STEM Buildings
      'computer science', 'cs building', 'cs', 'engineering', 'physics', 'chemistry', 'chem',
      'math tower', 'mathematics', 'earth space sciences', 'ess', 'life sciences', 'biology',
      'psychology a', 'psychology b', 'psych',

      // Liberal Arts
      'humanities', 'hum', 'social sciences', 'sbs', 'fine arts', 'staller', 'theatre', 'theater',

      // Professional Schools
      'business', 'harriman', 'journalism',

      // Medical Campus
      'hospital', 'health sciences', 'hsc', 'basic science tower', 'bst', 'clinical center',

      // Residential
      'chapin', 'west apartments', 'west', 'roth', 'tabler', 'kelly', 'mendelsohn', 'mendy',
      'roosevelt', 'hand', 'toscanini',

      // Athletics
      'lavalle', 'stadium', 'pritchard', 'sports complex',

      // Support Buildings
      'central hall', 'old chemistry', 'graduate chemistry', 'heavy engineering', 'light engineering',

      // Research
      'laufer', 'simons', 'molecular medicine',

      // Dining & Services
      'east side dining', 'west side dining', 'bookstore', 'postal'
    ];

    const hasBuilding = buildingKeywords.some(keyword => lowerMessage.includes(keyword));
    const hasParkingContext = lowerMessage.includes('parking') || lowerMessage.includes('near') ||
      lowerMessage.includes('close') || lowerMessage.includes('by') ||
      lowerMessage.includes('going to') || lowerMessage.includes('visiting');

    if (hasBuilding && hasParkingContext) {
      return 'buildingParking';
    }

    if (lowerMessage.includes('find') && lowerMessage.includes('parking')) {
      return 'findParking';
    }
    if (lowerMessage.includes('availability') || lowerMessage.includes('available') || lowerMessage.includes('spots')) {
      return 'availability';
    }
    if (lowerMessage.includes('hours') || lowerMessage.includes('time') || lowerMessage.includes('when')) {
      return 'hours';
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('help') || lowerMessage.includes('support')) {
      return isAuthenticated ? 'help' : 'contact';
    }

    // Vehicle and EV related
    if (lowerMessage.includes('electric') || lowerMessage.includes('ev') || lowerMessage.includes('charging')) {
      return 'findParking'; // Will prioritize EV lots for authenticated users
    }

    // Notification related - redirect to login if not authenticated
    if (lowerMessage.includes('notification') || lowerMessage.includes('reminder') || lowerMessage.includes('alert')) {
      return 'myProfile'; // Profile includes notification settings
    }

    // Login-related queries for guests
    if (!isAuthenticated && (lowerMessage.includes('log in') || lowerMessage.includes('login') || lowerMessage.includes('sign in'))) {
      return 'help'; // Will show guest help with login info
    }

    return 'default';
  };

  // Generate bot response
  const generateBotResponse = (intent) => {
    const responses = botResponses[intent] || botResponses.default;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Add personalized touches if user is authenticated
    if (isAuthenticated && user) {
      if (intent === 'greeting') {
        return `Hello ${user.firstName}! How can I help you with parking today?`;
      }
      if (intent === 'findParking') {
        return `Hi ${user.firstName}! ${randomResponse}`;
      }
    }

    return randomResponse;
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    try {
      // If user is authenticated, try to get intelligent response from backend
      if (isAuthenticated) {
        const intent = detectIntent(currentMessage);
        const response = await axios.post('/api/chatbot/chat', {
          message: currentMessage,
          intent: intent
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          const botMessage = {
            id: Date.now() + 1,
            text: response.data.response,
            sender: 'bot',
            timestamp: new Date(),
            data: response.data.data,
            isAI: true // Mark as AI-generated response
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          throw new Error('API response failed');
        }
      } else {
        // Fallback to local responses for non-authenticated users
        throw new Error('Not authenticated');
      }
    } catch (error) {
      // Fallback to local responses
      console.log('Using local chatbot response:', error.message);
      setTimeout(() => {
        const intent = detectIntent(currentMessage);
        const botResponse = generateBotResponse(intent);

        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle quick actions
  const handleQuickAction = async (action) => {
    const actionText = quickActions.find(qa => qa.action === action)?.text || action;
    const actionMessage = {
      id: Date.now(),
      text: actionText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, actionMessage]);
    setIsTyping(true);

    try {
      // If user is authenticated, try to get intelligent response from backend
      if (isAuthenticated) {
        const response = await axios.post('/api/chatbot/chat', {
          message: actionText,
          intent: action
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.data.success) {
          const botMessage = {
            id: Date.now() + 1,
            text: response.data.response,
            sender: 'bot',
            timestamp: new Date(),
            data: response.data.data,
            isAI: true // Mark as AI-generated response
          };
          setMessages(prev => [...prev, botMessage]);
        } else {
          throw new Error('API response failed');
        }
      } else {
        throw new Error('Not authenticated');
      }
    } catch {
      // Fallback to local responses
      setTimeout(() => {
        const botResponse = generateBotResponse(action);
        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          sender: 'bot',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }, 500);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${darkMode
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          aria-label="Open chatbot"
        >
          {isOpen ? <FaTimes size={20} /> : <FaRobot size={20} />}
        </button>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 w-96 h-[500px] rounded-lg shadow-2xl z-40 flex flex-col ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
          {/* Header */}
          <div className={`p-4 rounded-t-lg flex items-center justify-between ${darkMode ? 'bg-gray-700 border-b border-gray-600' : 'bg-blue-500 border-b border-blue-600'
            }`}>
            <div className="flex items-center space-x-2">
              <FaRobot className="text-white" size={20} />
              <h3 className="text-white font-semibold">SBU Parking Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FaTimes size={16} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className={`p-3 border-b ${darkMode ? 'border-gray-600 bg-gray-750' : 'border-gray-200 bg-gray-50'
            }`}>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.action)}
                  className={`p-2 rounded-lg text-xs flex items-center space-x-1 transition-colors ${darkMode
                    ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                    }`}
                >
                  <action.icon size={12} />
                  <span>{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${message.sender === 'user'
                    ? darkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500 text-white'
                    : darkMode
                      ? 'bg-gray-700 text-gray-200'
                      : 'bg-gray-100 text-gray-800'
                    }`}
                >
                  <div className="whitespace-pre-line text-sm">{message.text}</div>
                  <div className={`text-xs mt-1 opacity-70 flex items-center justify-between ${message.sender === 'user' ? 'text-blue-100' : darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {message.isAI && message.sender === 'bot' && (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full ml-2">
                        ✨ AI
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-800'
                  }`}>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className={`p-4 border-t ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'
            }`}>
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message..."
                className={`flex-1 p-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className={`p-2 rounded-lg transition-colors ${inputMessage.trim()
                  ? darkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                  : darkMode
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;