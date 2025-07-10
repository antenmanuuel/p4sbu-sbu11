const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (!this.apiKey) {
      console.warn('Gemini API key not found. AI responses will be disabled.');
      this.genAI = null;
      return;
    }

    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // System prompt for the parking assistant
    this.systemPrompt = `You are the SBU Parking Assistant, a helpful AI chatbot for Stony Brook University's parking management system. 

Your role:
- Help students, faculty, and staff with parking-related questions
- Provide information about parking lots, reservations, permits, and payments
- Be friendly, concise, and professional
- Use emojis appropriately to make responses engaging
- Always prioritize user safety and university policies

Guidelines:
- Keep responses under 200 words unless detailed information is requested
- Use bullet points for lists and clear formatting
- Include relevant parking lot names, prices, and availability when provided
- Suggest next steps or actions when appropriate
- If you don't have specific information, direct users to contact parking services

Context about SBU Parking:
- Campus has multiple parking lots with different permit requirements
- Hourly rates typically range from $2-5 per hour
- Semester permits available for long-term parking
- EV charging stations available in select lots
- Metered parking available for short-term visitors
- Accessible parking spaces in all lots
- Permits are available for students, faculty, staff, and visitors
- Reservations can be made up to 7 days in advance
- Payment is processed through Stripe
- Parking enforcement hours vary by lot (typically 7 AM - 10 PM weekdays)
- Support contact: parking@stonybrook.edu or (631) 632-PARK

Always maintain a helpful, professional tone while being conversational and approachable.`;
  }

  /**
   * Generate AI response using Gemini 2.5 Flash
   * @param {string} userMessage - The user's message
   * @param {Object} context - Additional context (user info, parking data, etc.)
   * @returns {Promise<string>} - AI generated response
   */
  async generateResponse(userMessage, context = {}) {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized. Please check API key.');
    }

    try {
      // Build context-aware prompt
      let prompt = this.systemPrompt + '\n\n';

      // Add user context
      if (context.user) {
        prompt += `User Information:
- Name: ${context.user.firstName} ${context.user.lastName}
- Type: ${context.user.userType}
- Email: ${context.user.email}`;

        if (context.user.department) {
          prompt += `\n- Department: ${context.user.department}`;
        }
        if (context.user.phone) {
          prompt += `\n- Phone: ${context.user.phone}`;
        }
        prompt += `\n- Member since: ${new Date(context.user.dateJoined).toLocaleDateString()}`;
        prompt += `\n- Account status: ${context.user.status}`;
        prompt += `\n- Has default payment: ${context.user.hasDefaultPayment ? 'Yes' : 'No'}\n\n`;
      }

      // Add comprehensive user profile data
      if (context.userProfile) {
        // User's vehicles
        if (context.userProfile.cars && context.userProfile.cars.length > 0) {
          prompt += `User's Registered Vehicles:\n`;
          context.userProfile.cars.forEach(car => {
            prompt += `- ${car.color} ${car.make} ${car.model} (${car.year || 'Unknown year'})\n`;
            prompt += `  License: ${car.plateNumber} (${car.stateProv})\n`;
            prompt += `  Type: ${car.bodyType}\n`;
          });
          prompt += '\n';
        }

        // Parking tickets
        if (context.userProfile.tickets && context.userProfile.tickets.length > 0) {
          const unpaidTickets = context.userProfile.tickets.filter(t => !t.isPaid);
          const paidTickets = context.userProfile.tickets.filter(t => t.isPaid);

          if (unpaidTickets.length > 0) {
            const totalOwed = unpaidTickets.reduce((sum, t) => sum + t.amount, 0);
            prompt += `Unpaid Parking Tickets (IMPORTANT - affects reservations):\n`;
            unpaidTickets.forEach(ticket => {
              const daysOld = Math.floor((new Date() - new Date(ticket.datePosted)) / (1000 * 60 * 60 * 24));
              prompt += `- ${ticket.name}: $${ticket.amount} (${daysOld} days old)\n`;
            });
            prompt += `Total owed: $${totalOwed.toFixed(2)}\n\n`;
          }

          if (paidTickets.length > 0) {
            prompt += `Recent Paid Tickets:\n`;
            paidTickets.slice(0, 3).forEach(ticket => {
              prompt += `- ${ticket.name}: $${ticket.amount} (paid)\n`;
            });
            prompt += '\n';
          }
        }

        // Recent user activity
        if (context.userProfile.recentActivity && context.userProfile.recentActivity.length > 0) {
          prompt += `Recent User Activity:\n`;
          context.userProfile.recentActivity.slice(0, 5).forEach(activity => {
            const timeAgo = Math.floor((new Date() - new Date(activity.timestamp)) / (1000 * 60 * 60));
            prompt += `- ${activity.action} (${timeAgo}h ago)\n`;
          });
          prompt += '\n';
        }

        // Unread notifications
        if (context.userProfile.unreadNotifications && context.userProfile.unreadNotifications.length > 0) {
          prompt += `Unread Notifications:\n`;
          context.userProfile.unreadNotifications.forEach(notif => {
            prompt += `- ${notif.type}: ${notif.title}\n`;
          });
          prompt += '\n';
        }

        // Notification preferences
        if (context.userProfile.notificationPrefs) {
          const prefs = context.userProfile.notificationPrefs;
          prompt += `Notification Preferences:\n`;
          prompt += `- Email: ${prefs.emailEnabled ? 'Enabled' : 'Disabled'}\n`;
          prompt += `- SMS: ${prefs.smsEnabled ? 'Enabled' : 'Disabled'}\n`;
          prompt += `- Push: ${prefs.pushEnabled ? 'Enabled' : 'Disabled'}\n`;
          prompt += `- Reservation reminders: ${prefs.reservationReminders ? 'Yes' : 'No'}\n`;
          prompt += `- Payment reminders: ${prefs.paymentReminders ? 'Yes' : 'No'}\n\n`;
        }
      }

      // Add parking data context
      if (context.parkingData) {
        prompt += `Current Parking Data:\n`;

        if (context.parkingData.availableLots) {
          prompt += `Available Lots (from database):\n`;
          context.parkingData.availableLots.forEach(lot => {
            prompt += `- ${lot.name}: ${lot.availableSpaces}/${lot.totalSpaces} spaces available\n`;
            prompt += `  Pricing: `;
            if (lot.rateType === 'Hourly') {
              prompt += `$${lot.hourlyRate}/hour`;
            } else if (lot.features?.isSemesterBased) {
              prompt += `$${lot.semesterRate}/semester`;
            } else {
              prompt += `Permit-based (${lot.permitTypes.join(', ')})`;
            }
            prompt += `\n`;

            // Add special features
            const features = [];
            if (lot.features?.isEV && lot.evSpaces?.total > 0) {
              features.push(`EV charging (${lot.evSpaces.available}/${lot.evSpaces.total} available)`);
            }
            if (lot.features?.isMetered && lot.meteredSpaces?.total > 0) {
              features.push(`Metered parking (${lot.meteredSpaces.available}/${lot.meteredSpaces.total} available)`);
            }
            if (lot.features?.isAccessible) {
              features.push('Accessible parking');
            }
            if (features.length > 0) {
              prompt += `  Features: ${features.join(', ')}\n`;
            }

            prompt += `  Permits accepted: ${lot.permitTypes.join(', ')}\n`;
            prompt += `  Address: ${lot.address}\n\n`;
          });
        }

        // Add user's EV status for better recommendations
        if (context.parkingData.userHasEV) {
          prompt += `IMPORTANT: User has an electric vehicle - prioritize lots with EV charging!\n\n`;
        }

        if (context.parkingData.buildingRecommendation) {
          const rec = context.parkingData.buildingRecommendation;
          prompt += `Building-Specific Recommendation:\n`;
          prompt += `Target Building: ${rec.building.name}\n`;
          prompt += `Closest Parking Lots:\n`;
          rec.closestLots.forEach((lot, index) => {
            prompt += `${index + 1}. ${lot.name}: ${lot.distanceFromBuilding}m away (${lot.walkingTimeMinutes} min walk), ${lot.availableSpaces}/${lot.totalSpaces} spaces, $${lot.hourlyRate}/hour\n`;
          });
          prompt += '\n';
        }

        if (context.parkingData.reservations) {
          prompt += `User's Active Reservations:\n`;
          context.parkingData.reservations.forEach(res => {
            const startTime = new Date(res.startTime).toLocaleString();
            const endTime = new Date(res.endTime).toLocaleString();
            prompt += `- ${res.lotId?.name || 'Unknown Lot'}: ${startTime} - ${endTime} (${res.status})\n`;
            prompt += `  Cost: $${res.totalPrice}, Payment: ${res.paymentStatus}\n`;
          });
          prompt += '\n';
        }

        if (context.parkingData.permits) {
          prompt += `User's Active Permits:\n`;
          context.parkingData.permits.forEach(permit => {
            const endDate = new Date(permit.endDate).toLocaleDateString();
            const daysLeft = Math.ceil((permit.endDate - new Date()) / (1000 * 60 * 60 * 24));
            prompt += `- ${permit.permitName} (${permit.permitType}): Valid until ${endDate} (${daysLeft} days left)\n`;
            if (daysLeft <= 30) {
              prompt += `  ⚠️ EXPIRING SOON - suggest renewal!\n`;
            }
          });
          prompt += '\n';
        }

        if (context.parkingData.tickets) {
          if (context.parkingData.tickets.unpaid && context.parkingData.tickets.unpaid.length > 0) {
            const totalOwed = context.parkingData.tickets.unpaid.reduce((sum, t) => sum + t.amount, 0);
            prompt += `IMPORTANT - User has ${context.parkingData.tickets.unpaid.length} unpaid tickets ($${totalOwed.toFixed(2)} owed)!\n`;
            prompt += `This may affect their ability to make new reservations.\n\n`;
          }
        }

        if (context.parkingData.profileSummary) {
          const summary = context.parkingData.profileSummary;
          prompt += `User's Parking History:\n`;
          prompt += `- Total reservations: ${summary.totalReservations}\n`;
          prompt += `- Total spent: $${summary.totalSpent.toFixed(2)}\n`;
          prompt += `- Active permits: ${summary.activePermits}\n`;
          prompt += `- Unpaid tickets: ${summary.unpaidTickets}\n\n`;
        }

        if (context.parkingData.stats) {
          const stats = context.parkingData.stats;
          prompt += `Campus Statistics:\n`;
          prompt += `- Total spaces: ${stats.totalSpaces}\n`;
          prompt += `- Available: ${stats.availableSpaces}\n`;
          prompt += `- Occupancy: ${stats.occupancyRate}%\n\n`;
        }
      }

      // Add the user's message
      prompt += `User Message: "${userMessage}"\n\n`;
      prompt += `Please provide a helpful response as the SBU Parking Assistant. Use the comprehensive user data above to personalize your response and provide relevant suggestions:`;

      // Generate response
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return text.trim();

    } catch (error) {
      console.error('Gemini AI error:', error);
      throw new Error('Failed to generate AI response');
    }
  }

  /**
   * Generate response for specific intents with structured data
   * @param {string} intent - The detected intent
   * @param {Object} context - Context data
   * @returns {Promise<string>} - AI generated response
   */
  async generateIntentResponse(intent, context = {}) {
    if (!this.genAI) {
      throw new Error('Gemini AI not initialized. Please check API key.');
    }

    let intentPrompt = this.systemPrompt + '\n\n';

    // Add context
    if (context.user) {
      intentPrompt += `User: ${context.user.firstName} (${context.user.userType})\n\n`;
    }

    // Intent-specific prompts
    switch (intent) {
      case 'findParking':
        intentPrompt += `The user wants to find parking. `;
        if (context.parkingData?.availableLots) {
          intentPrompt += `Here are the available lots with comprehensive data from the database:\n`;
          context.parkingData.availableLots.forEach(lot => {
            intentPrompt += `- ${lot.name}: ${lot.availableSpaces}/${lot.totalSpaces} spaces available\n`;

            // Pricing information
            if (lot.rateType === 'Hourly') {
              intentPrompt += `  Pricing: $${lot.hourlyRate}/hour\n`;
            } else if (lot.features?.isSemesterBased) {
              intentPrompt += `  Pricing: $${lot.semesterRate}/semester (permit required)\n`;
            } else {
              intentPrompt += `  Pricing: Permit-based only\n`;
            }

            // Special features
            const features = [];
            if (lot.features?.isEV && lot.evSpaces?.total > 0) {
              features.push(`EV charging stations (${lot.evSpaces.available}/${lot.evSpaces.total} available)`);
            }
            if (lot.features?.isMetered && lot.meteredSpaces?.total > 0) {
              features.push(`Metered spaces (${lot.meteredSpaces.available}/${lot.meteredSpaces.total} available)`);
            }
            if (lot.features?.isAccessible) {
              features.push('Accessible parking available');
            }
            if (features.length > 0) {
              intentPrompt += `  Special features: ${features.join(', ')}\n`;
            }

            intentPrompt += `  Permits accepted: ${lot.permitTypes.join(', ')}\n`;
            intentPrompt += `  Location: ${lot.address}\n\n`;
          });
          intentPrompt += `\nProvide a helpful response highlighting the best options, including any EV charging, metered parking, or semester-based options. Mention specific availability numbers and pricing details.`;
        } else {
          intentPrompt += `No lots are currently available. Suggest alternatives like checking back later or joining a waitlist.`;
        }
        break;

      case 'myReservations':
        intentPrompt += `The user wants to see their reservations. `;
        if (context.parkingData?.reservations) {
          intentPrompt += `Here are their current and upcoming reservations:\n`;
          context.parkingData.reservations.forEach(res => {
            const startTime = new Date(res.startTime).toLocaleString();
            const endTime = new Date(res.endTime).toLocaleString();
            intentPrompt += `- ${res.lotId?.name || 'Unknown Lot'}: ${startTime} - ${endTime}\n`;
            intentPrompt += `  Status: ${res.status}, Cost: $${res.totalPrice}, Payment: ${res.paymentStatus}\n`;
            if (res.vehicleInfo) {
              intentPrompt += `  Vehicle: ${res.vehicleInfo.make} ${res.vehicleInfo.model}\n`;
            }
          });

          // Add context about user's notification preferences
          if (context.userProfile?.notificationPrefs?.reservationReminders) {
            intentPrompt += `\nNote: User has reservation reminders enabled.\n`;
          }
        } else {
          intentPrompt += `The user has no active or upcoming reservations. `;
          if (context.userProfile?.cars?.length > 0) {
            intentPrompt += `They have registered vehicles available for making new reservations.`;
          }
        }
        intentPrompt += `\nProvide a helpful summary and suggest next actions if appropriate.`;
        break;

      case 'availability':
        intentPrompt += `The user wants to check parking availability. `;
        if (context.parkingData?.stats) {
          const stats = context.parkingData.stats;
          intentPrompt += `Current campus statistics: ${stats.availableSpaces}/${stats.totalSpaces} spaces available (${stats.occupancyRate}% occupied). `;
          if (context.parkingData.topLots) {
            intentPrompt += `Best availability: `;
            context.parkingData.topLots.forEach(lot => {
              intentPrompt += `${lot.name} (${lot.availableSpaces} spaces), `;
            });
          }
        }
        intentPrompt += `Provide a clear overview of availability and suggest next steps.`;
        break;

      case 'myPermits':
        intentPrompt += `The user wants to see their permits. `;
        if (context.parkingData?.permits) {
          intentPrompt += `Here are their active permits:\n`;
          context.parkingData.permits.forEach(permit => {
            const endDate = new Date(permit.endDate).toLocaleDateString();
            const daysLeft = Math.ceil((permit.endDate - new Date()) / (1000 * 60 * 60 * 24));
            intentPrompt += `- ${permit.permitName} (${permit.permitType}): Valid until ${endDate} (${daysLeft} days left)\n`;
            intentPrompt += `  Lots: ${permit.lots.map(lot => lot.lotName).join(', ')}\n`;
            intentPrompt += `  Payment status: ${permit.paymentStatus}\n`;
            if (daysLeft <= 30) {
              intentPrompt += `  ⚠️ EXPIRING SOON - recommend renewal!\n`;
            }
          });
        } else {
          intentPrompt += `The user has no active permits. `;
          if (context.user?.userType) {
            intentPrompt += `As a ${context.user.userType}, suggest appropriate permit types they might need.`;
          }
        }
        intentPrompt += `\nProvide a helpful summary with renewal reminders if needed and suggest permit options.`;
        break;

      case 'myTickets':
        intentPrompt += `The user wants to see their parking tickets. `;
        if (context.parkingData?.tickets) {
          const unpaid = context.parkingData.tickets.unpaid || [];
          const paid = context.parkingData.tickets.paid || [];

          if (unpaid.length > 0) {
            const totalOwed = unpaid.reduce((sum, t) => sum + t.amount, 0);
            intentPrompt += `They have ${unpaid.length} UNPAID tickets totaling $${totalOwed.toFixed(2)}:\n`;
            unpaid.forEach(ticket => {
              const daysOld = Math.floor((new Date() - new Date(ticket.datePosted)) / (1000 * 60 * 60 * 24));
              intentPrompt += `- ${ticket.name}: $${ticket.amount} (${daysOld} days old)\n`;
              intentPrompt += `  Can petition: ${ticket.canPetition ? 'Yes' : 'No'}\n`;
            });
            intentPrompt += `\n⚠️ IMPORTANT: Unpaid tickets may affect their ability to make new reservations!\n`;
          } else {
            intentPrompt += `Great news - they have no unpaid tickets! `;
          }

          if (paid.length > 0) {
            intentPrompt += `\nRecent paid tickets:\n`;
            paid.slice(0, 3).forEach(ticket => {
              intentPrompt += `- ${ticket.name}: $${ticket.amount} (paid)\n`;
            });
          }
        } else {
          intentPrompt += `The user has no parking tickets - excellent parking record!`;
        }
        intentPrompt += `\nProvide helpful information about payment options and petition process if applicable.`;
        break;

      case 'myProfile':
        intentPrompt += `The user wants to see their profile information. Provide a comprehensive summary including:\n`;

        if (context.user) {
          intentPrompt += `Personal Info: ${context.user.firstName} ${context.user.lastName} (${context.user.userType})\n`;
          intentPrompt += `Email: ${context.user.email}\n`;
          if (context.user.department) {
            intentPrompt += `Department: ${context.user.department}\n`;
          }
          intentPrompt += `Member since: ${new Date(context.user.dateJoined).toLocaleDateString()}\n`;
          intentPrompt += `Account status: ${context.user.status}\n`;
        }

        if (context.userProfile?.cars?.length > 0) {
          intentPrompt += `\nRegistered Vehicles:\n`;
          context.userProfile.cars.forEach(car => {
            intentPrompt += `- ${car.color} ${car.make} ${car.model} (${car.plateNumber})\n`;
          });
        } else {
          intentPrompt += `\nNo vehicles registered - suggest they add vehicle info.\n`;
        }

        if (context.parkingData?.profileSummary) {
          const summary = context.parkingData.profileSummary;
          intentPrompt += `\nParking Summary:\n`;
          intentPrompt += `- Total reservations: ${summary.totalReservations}\n`;
          intentPrompt += `- Total spent: $${summary.totalSpent.toFixed(2)}\n`;
          intentPrompt += `- Active permits: ${summary.activePermits}\n`;
          intentPrompt += `- Unpaid tickets: ${summary.unpaidTickets}\n`;
        }

        if (context.userProfile?.notificationPrefs) {
          const prefs = context.userProfile.notificationPrefs;
          intentPrompt += `\nNotification Settings:\n`;
          intentPrompt += `- Email: ${prefs.emailEnabled ? 'Enabled' : 'Disabled'}\n`;
          intentPrompt += `- SMS: ${prefs.smsEnabled ? 'Enabled' : 'Disabled'}\n`;
          intentPrompt += `- Reservation reminders: ${prefs.reservationReminders ? 'On' : 'Off'}\n`;
        }

        intentPrompt += `\nProvide a friendly, organized profile summary with suggestions for improvements or missing information.`;
        break;

      case 'payment':
        intentPrompt += `The user needs help with payments. `;
        if (context.parkingData?.recentPayments) {
          const totalSpent = context.parkingData.totalSpent || 0;
          intentPrompt += `They've spent $${totalSpent.toFixed(2)} in the last 30 days. `;
          if (context.parkingData.recentPayments.length > 0) {
            intentPrompt += `Recent payments: `;
            context.parkingData.recentPayments.slice(0, 3).forEach(payment => {
              const date = new Date(payment.createdAt).toLocaleDateString();
              intentPrompt += `$${payment.totalPrice} on ${date}, `;
            });
          }
        }
        intentPrompt += `Provide payment help and mention support options for issues.`;
        break;

      case 'buildingParking':
        intentPrompt += `The user wants parking near a specific building. `;
        if (context.parkingData?.buildingRecommendation) {
          const rec = context.parkingData.buildingRecommendation;
          intentPrompt += `They're looking for parking near ${rec.building.name}. Here are the closest options:\n`;
          rec.closestLots.forEach((lot, index) => {
            const available = lot.availableSpaces > 0 ? `${lot.availableSpaces} spaces available` : 'Currently full';
            intentPrompt += `${index + 1}. ${lot.name}: ${lot.distanceFromBuilding}m away (${lot.walkingTimeMinutes} min walk)\n`;
            intentPrompt += `   ${available}, $${lot.hourlyRate}/hour\n`;
            intentPrompt += `   Permits: ${lot.permitTypes.join(', ')}\n`;

            // Special features with user context
            const features = [];
            if (lot.features?.isEV && lot.evSpaces?.available > 0) {
              if (context.parkingData?.userHasEV) {
                features.push('⚡ EV charging (perfect for your EV!)');
              } else {
                features.push('⚡ EV charging available');
              }
            }
            if (lot.features?.isAccessible) {
              features.push('♿ Accessible');
            }
            if (features.length > 0) {
              intentPrompt += `   Features: ${features.join(', ')}\n`;
            }

            intentPrompt += `   Address: ${lot.address}\n\n`;
          });
          intentPrompt += `\nProvide a helpful response highlighting the best options, walking distances, and any special features. Be enthusiastic and mention specific availability numbers!`;
        } else {
          intentPrompt += `Help them specify which building they need parking for.`;
        }
        break;

      default:
        intentPrompt += `The user said: "${context.message || 'general inquiry'}". Provide helpful parking assistance based on their message.`;
    }

    try {
      const result = await this.model.generateContent(intentPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini intent response error:', error);
      throw new Error('Failed to generate AI response for intent');
    }
  }

  /**
   * Check if Gemini AI is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.genAI !== null;
  }
}

module.exports = new GeminiService();
