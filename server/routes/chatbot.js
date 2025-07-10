const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Lot = require('../models/lot');
const Reservation = require('../models/reservation');
const Permit = require('../models/permits');
const User = require('../models/users');
const Car = require('../models/car');
const Ticket = require('../models/tickets');
const UserActivity = require('../models/user_activity');
const Notification = require('../models/notification');
const NotificationPreferences = require('../models/notification_preferences');
const PermitType = require('../models/permit_types');
const geminiService = require('../services/geminiService');
const buildingsService = require('../services/buildingsService');

/**
 * Enhanced chatbot API endpoint with comprehensive database information
 * Provides context-aware responses based on extensive user data and system state
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, intent } = req.body;
    const userId = req.user.userId;

    // Get comprehensive user data for personalized responses
    const user = await User.findById(userId).populate('car');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional user context data
    const [userCars, userTickets, userActivity, userNotifications, notificationPrefs] = await Promise.all([
      Car.find({ userId: userId }),
      Ticket.find({ user: userId }).sort({ date_posted: -1 }).limit(5),
      UserActivity.find({ user: userId }).sort({ created_at: -1 }).limit(10),
      Notification.find({ user: userId, isRead: false }).sort({ createdAt: -1 }).limit(5),
      NotificationPreferences.findOne({ user: userId })
    ]);

    let response = '';
    let data = null;
    let context = {
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        email: user.email,
        phone: user.phone,
        department: user.department,
        dateJoined: user.dateJoined,
        // Enhanced user context
        hasDefaultPayment: !!user.defaultPaymentMethodId,
        isApproved: user.isApproved,
        status: user.status
      },
      userProfile: {
        cars: userCars.map(car => ({
          make: car.make,
          model: car.model,
          color: car.color,
          plateNumber: car.plateNumber,
          stateProv: car.stateProv,
          bodyType: car.bodyType,
          year: car.year
        })),
        tickets: userTickets.map(ticket => ({
          name: ticket.name,
          amount: ticket.amount,
          datePosted: ticket.date_posted,
          isPaid: ticket.isPaid,
          canPetition: ticket.canPetition,
          paidAt: ticket.paidAt
        })),
        recentActivity: userActivity.map(activity => ({
          action: activity.activity_type,
          timestamp: activity.created_at,
          details: activity.details
        })),
        unreadNotifications: userNotifications.map(notif => ({
          title: notif.title,
          message: notif.message,
          type: notif.type,
          createdAt: notif.createdAt
        })),
        notificationPrefs: notificationPrefs ? {
          emailEnabled: notificationPrefs.emailEnabled,
          smsEnabled: notificationPrefs.smsEnabled,
          pushEnabled: notificationPrefs.pushEnabled,
          reservationReminders: notificationPrefs.reservationReminders,
          paymentReminders: notificationPrefs.paymentReminders
        } : null
      },
      message,
      parkingData: {}
    };

    switch (intent) {
      case 'findParking':
        // Get real-time parking availability with comprehensive information
        const availableLots = await Lot.find({
          availableSpaces: { $gt: 0 },
          status: 'Active'
        }).select('name availableSpaces totalSpaces hourlyRate semesterRate rateType location permitTypes features operatingHours evSpaces meteredSpaces address description');

        // Get permit types for better recommendations
        const availablePermitTypes = await PermitType.find({ active: true });

        // Check if user mentioned a specific building
        const buildingName = buildingsService.extractBuildingFromMessage(message);
        let buildingRecommendation = null;

        if (buildingName) {
          buildingRecommendation = buildingsService.findClosestParkingLots(
            buildingName,
            availableLots,
            3
          );
        }

        // Enhanced context with user's cars and preferences
        context.parkingData.availableLots = availableLots;
        context.parkingData.buildingRecommendation = buildingRecommendation;
        context.parkingData.permitTypes = availablePermitTypes;
        context.parkingData.userHasEV = userCars.some(car => car.bodyType?.toLowerCase().includes('electric') || car.bodyType?.toLowerCase().includes('ev'));
        data = { availableLots, buildingRecommendation, permitTypes: availablePermitTypes };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('findParking', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for findParking:', aiError.message);
            // Enhanced fallback with user vehicle info
            if (availableLots.length > 0) {
              response = `Great news ${user.firstName}! I found ${availableLots.length} lots with available spaces:\n\n`;

              // Prioritize EV lots if user has electric vehicle
              const sortedLots = context.parkingData.userHasEV
                ? availableLots.sort((a, b) => (b.features?.isEV ? 1 : 0) - (a.features?.isEV ? 1 : 0))
                : availableLots;

              sortedLots.slice(0, 3).forEach(lot => {
                response += `🅿️ **${lot.name}**\n`;
                response += `   🚗 ${lot.availableSpaces}/${lot.totalSpaces} spaces available\n`;

                // Pricing information
                if (lot.rateType === 'Hourly') {
                  response += `   💰 $${lot.hourlyRate}/hour\n`;
                } else if (lot.features?.isSemesterBased) {
                  response += `   💰 $${lot.semesterRate}/semester (permit required)\n`;
                } else {
                  response += `   💰 Permit-based parking\n`;
                }

                // Special features with user context
                const features = [];
                if (lot.features?.isEV && lot.evSpaces?.total > 0) {
                  const evText = `⚡ EV charging (${lot.evSpaces.available}/${lot.evSpaces.total})`;
                  if (context.parkingData.userHasEV) {
                    features.push(evText + ' ⭐ Perfect for your EV!');
                  } else {
                    features.push(evText);
                  }
                }
                if (lot.features?.isMetered && lot.meteredSpaces?.total > 0) {
                  features.push(`🪙 Metered (${lot.meteredSpaces.available}/${lot.meteredSpaces.total})`);
                }
                if (lot.features?.isAccessible) {
                  features.push('♿ Accessible');
                }
                if (features.length > 0) {
                  response += `   ${features.join(', ')}\n`;
                }

                response += `   🎫 Permits: ${lot.permitTypes.join(', ')}\n`;
                response += `   📍 ${lot.address}\n\n`;
              });

              // Add personalized suggestions based on user data
              if (userCars.length > 0) {
                response += `\n🚙 For your ${userCars[0].color} ${userCars[0].make} ${userCars[0].model}, `;
                if (context.parkingData.userHasEV) {
                  response += `I've prioritized lots with EV charging stations above.\n`;
                } else {
                  response += `any of these lots will work perfectly.\n`;
                }
              }

              response += '\nWould you like me to help you make a reservation?';
            } else {
              response = `Sorry ${user.firstName}, all lots are currently full. `;
              if (userTickets.filter(t => !t.isPaid).length > 0) {
                response += `Also, I noticed you have unpaid tickets that might affect new reservations. `;
              }
              response += `Would you like me to check for upcoming availability or help you join a waitlist?`;
            }
          }
        } else {
          // Original fallback logic
          if (availableLots.length > 0) {
            response = `Great news ${user.firstName}! I found ${availableLots.length} lots with available spaces:\n\n`;
            availableLots.slice(0, 3).forEach(lot => {
              response += `🅿️ ${lot.name}: ${lot.availableSpaces}/${lot.totalSpaces} spaces available\n`;
              response += `   Rate: $${lot.hourlyRate}/hour\n\n`;
            });
            response += 'Would you like me to help you make a reservation?';
          } else {
            response = `Sorry ${user.firstName}, all lots are currently full. Would you like me to check for upcoming availability or help you join a waitlist?`;
          }
        }
        break;

      case 'buildingParking':
        // Handle specific building parking requests
        const targetBuilding = buildingsService.extractBuildingFromMessage(message);
        if (!targetBuilding) {
          response = `I'd be happy to help you find parking near a specific building! Could you tell me which building you're visiting? For example:

• Library
• Student Union
• Computer Science Building
• Engineering Building
• Recreation Center
• Hospital

Just say something like "I need parking near the library" and I'll find the closest available spots!`;
          break;
        }

        const allActiveLots = await Lot.find({ status: 'Active' })
          .select('name availableSpaces totalSpaces hourlyRate semesterRate rateType location permitTypes features operatingHours evSpaces meteredSpaces address description');

        const buildingParkingInfo = buildingsService.findClosestParkingLots(
          targetBuilding,
          allActiveLots,
          5
        );

        if (!buildingParkingInfo) {
          response = `I couldn't find information about that building. Could you try a different name? I know about buildings like the Library, Student Union, Computer Science, Engineering, and many others.`;
          break;
        }

        context.parkingData.buildingRecommendation = buildingParkingInfo;
        data = { buildingRecommendation: buildingParkingInfo };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('buildingParking', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for buildingParking:', aiError.message);
            // Fallback response
            const building = buildingParkingInfo.building;
            response = `Here are the closest parking options to ${building.name}:\n\n`;

            buildingParkingInfo.closestLots.forEach((lot, index) => {
              const available = lot.availableSpaces > 0 ? `${lot.availableSpaces} spaces available` : 'Currently full';
              response += `${index + 1}. 🅿️ **${lot.name}**\n`;
              response += `   📍 ${buildingsService.formatDistance(lot.distanceFromBuilding)} away (${lot.walkingTimeMinutes} min walk)\n`;
              response += `   🚗 ${available}\n`;
              response += `   💰 $${lot.hourlyRate}/hour\n`;
              response += `   🎫 Permits: ${lot.permitTypes.join(', ')}\n\n`;
            });

            response += `💡 Tip: The closest option is ${buildingParkingInfo.closestLots[0].name}, just ${buildingsService.formatDistance(buildingParkingInfo.closestLots[0].distanceFromBuilding)} from ${building.name}!`;
          }
        } else {
          // Original fallback logic
          const building = buildingParkingInfo.building;
          response = `Here are the closest parking options to ${building.name}:\n\n`;

          buildingParkingInfo.closestLots.forEach((lot, index) => {
            const available = lot.availableSpaces > 0 ? `${lot.availableSpaces} spaces available` : 'Currently full';
            response += `${index + 1}. 🅿️ **${lot.name}**\n`;
            response += `   📍 ${buildingsService.formatDistance(lot.distanceFromBuilding)} away (${lot.walkingTimeMinutes} min walk)\n`;
            response += `   🚗 ${available}\n`;
            response += `   💰 $${lot.hourlyRate}/hour\n`;
            response += `   🎫 Permits: ${lot.permitTypes.join(', ')}\n\n`;
          });

          response += `💡 Tip: The closest option is ${buildingParkingInfo.closestLots[0].name}, just ${buildingsService.formatDistance(buildingParkingInfo.closestLots[0].distanceFromBuilding)} from ${building.name}!`;
        }
        break;

      case 'myReservations':
        // Get user's current and upcoming reservations with vehicle info
        const reservations = await Reservation.find({
          user: userId,
          status: { $in: ['active', 'pending'] },
          endTime: { $gte: new Date() }
        }).populate('lotId', 'name').populate('vehicleInfo').sort({ startTime: 1 });

        context.parkingData.reservations = reservations;
        data = { reservations };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('myReservations', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for myReservations:', aiError.message);
            // Enhanced fallback with vehicle info
            if (reservations.length > 0) {
              response = `Here are your current reservations:\n\n`;
              reservations.forEach(reservation => {
                const startTime = new Date(reservation.startTime).toLocaleString();
                const endTime = new Date(reservation.endTime).toLocaleString();
                response += `🎫 ${reservation.lotId.name}\n`;
                response += `   📅 ${startTime} - ${endTime}\n`;
                response += `   🚗 Vehicle: ${reservation.vehicleInfo?.make} ${reservation.vehicleInfo?.model}\n`;
                response += `   💰 Cost: $${reservation.totalPrice}\n`;
                response += `   📊 Status: ${reservation.status}\n\n`;
              });

              // Add helpful reminders based on user data
              if (userNotifications.some(n => n.type === 'reservation_reminder')) {
                response += `💡 Reminder: You have notification reminders set up for your reservations.\n`;
              }
            } else {
              response = `You don't have any active reservations. `;
              if (userCars.length > 0) {
                response += `Your registered ${userCars[0].make} ${userCars[0].model} is ready for a new reservation! `;
              }
              response += `Would you like me to help you find parking?`;
            }
          }
        } else {
          // Original fallback logic
          if (reservations.length > 0) {
            response = `Here are your current reservations:\n\n`;
            reservations.forEach(reservation => {
              const startTime = new Date(reservation.startTime).toLocaleString();
              const endTime = new Date(reservation.endTime).toLocaleString();
              response += `🎫 ${reservation.lotId.name}\n`;
              response += `   ${startTime} - ${endTime}\n`;
              response += `   Status: ${reservation.status}\n\n`;
            });
          } else {
            response = `You don't have any active reservations. Would you like me to help you find parking?`;
          }
        }
        break;

      case 'myPermits':
        // Get user's active permits with enhanced information
        const permits = await Permit.find({
          userId: userId,
          status: 'active',
          endDate: { $gte: new Date() }
        }).populate('permitTypeId');

        context.parkingData.permits = permits;
        data = { permits };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('myPermits', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for myPermits:', aiError.message);
            // Enhanced fallback
            if (permits.length > 0) {
              response = `Your active permits:\n\n`;
              permits.forEach(permit => {
                const endDate = new Date(permit.endDate).toLocaleDateString();
                const daysLeft = Math.ceil((permit.endDate - new Date()) / (1000 * 60 * 60 * 24));
                response += `🎫 ${permit.permitName} (${permit.permitType})\n`;
                response += `   📅 Valid until: ${endDate} (${daysLeft} days left)\n`;
                response += `   🅿️ Lots: ${permit.lots.map(lot => lot.lotName).join(', ')}\n`;
                response += `   💳 Status: ${permit.paymentStatus}\n\n`;
              });

              // Add renewal reminders
              const expiringSoon = permits.filter(p => {
                const daysLeft = Math.ceil((p.endDate - new Date()) / (1000 * 60 * 60 * 24));
                return daysLeft <= 30;
              });

              if (expiringSoon.length > 0) {
                response += `⚠️ ${expiringSoon.length} permit(s) expiring within 30 days. Consider renewing soon!\n`;
              }
            } else {
              response = `You don't have any active permits. `;
              if (user.userType === 'student') {
                response += `As a student, you may want to consider purchasing a Student permit for regular campus parking. `;
              } else if (user.userType === 'faculty') {
                response += `As faculty, you may want to consider purchasing a Faculty permit for convenient campus parking. `;
              }
              response += `Would you like to purchase one?`;
            }
          }
        } else {
          // Original fallback
          if (permits.length > 0) {
            response = `Your active permits:\n\n`;
            permits.forEach(permit => {
              const endDate = new Date(permit.endDate).toLocaleDateString();
              response += `🎫 ${permit.permitName} (${permit.permitType})\n`;
              response += `   Valid until: ${endDate}\n`;
              response += `   Lots: ${permit.lots.map(lot => lot.lotName).join(', ')}\n\n`;
            });
          } else {
            response = `You don't have any active permits. Would you like to purchase one?`;
          }
        }
        break;

      case 'myTickets':
        // Handle parking tickets information
        const unpaidTickets = userTickets.filter(ticket => !ticket.isPaid);
        const paidTickets = userTickets.filter(ticket => ticket.isPaid);

        context.parkingData.tickets = { unpaid: unpaidTickets, paid: paidTickets };
        data = { unpaidTickets, paidTickets };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('myTickets', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for myTickets:', aiError.message);
            // Enhanced fallback
            if (unpaidTickets.length > 0) {
              const totalOwed = unpaidTickets.reduce((sum, ticket) => sum + ticket.amount, 0);
              response = `⚠️ You have ${unpaidTickets.length} unpaid parking ticket(s):\n\n`;

              unpaidTickets.forEach(ticket => {
                const daysOld = Math.floor((new Date() - new Date(ticket.date_posted)) / (1000 * 60 * 60 * 24));
                response += `🎫 ${ticket.name}\n`;
                response += `   💰 Amount: $${ticket.amount}\n`;
                response += `   📅 Posted: ${new Date(ticket.date_posted).toLocaleDateString()} (${daysOld} days ago)\n`;
                response += `   📝 Can petition: ${ticket.canPetition ? 'Yes' : 'No'}\n\n`;
              });

              response += `💳 Total owed: $${totalOwed.toFixed(2)}\n\n`;
              response += `💡 Tip: Unpaid tickets may affect your ability to make new reservations. Pay them online or visit parking services.`;
            } else {
              response = `✅ Great news! You have no unpaid parking tickets.\n\n`;

              if (paidTickets.length > 0) {
                response += `📋 Recent paid tickets:\n`;
                paidTickets.slice(0, 3).forEach(ticket => {
                  response += `• ${ticket.name}: $${ticket.amount} (paid ${new Date(ticket.paidAt).toLocaleDateString()})\n`;
                });
              } else {
                response += `🎉 You have a clean parking record - no tickets at all!`;
              }
            }
          }
        } else {
          // Basic fallback
          if (unpaidTickets.length > 0) {
            response = `You have ${unpaidTickets.length} unpaid parking tickets totaling $${unpaidTickets.reduce((sum, t) => sum + t.amount, 0)}. Please pay them to avoid issues with future reservations.`;
          } else {
            response = `You have no unpaid parking tickets. Great job following parking rules!`;
          }
        }
        break;

      case 'myProfile':
        // Get user's active permits for profile summary
        const userPermits = await Permit.find({
          userId: userId,
          status: 'active',
          endDate: { $gte: new Date() }
        });

        const userUnpaidTickets = userTickets.filter(ticket => !ticket.isPaid);

        // Handle user profile information
        context.parkingData.profileSummary = {
          memberSince: user.dateJoined,
          totalReservations: await Reservation.countDocuments({ user: userId }),
          totalSpent: await Reservation.aggregate([
            { $match: { user: userId, paymentStatus: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } }
          ]).then(result => result[0]?.total || 0),
          activePermits: userPermits.length,
          unpaidTickets: userUnpaidTickets.length
        };

        data = {
          user: context.user,
          cars: userCars,
          profileSummary: context.parkingData.profileSummary,
          notificationPrefs: context.userProfile.notificationPrefs
        };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('myProfile', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for myProfile:', aiError.message);
            // Enhanced profile summary
            response = `👤 Your Parking Profile - ${user.firstName} ${user.lastName}\n\n`;
            response += `📧 ${user.email}\n`;
            response += `🏫 ${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}`;
            if (user.department) {
              response += ` - ${user.department}`;
            }
            response += `\n📅 Member since: ${new Date(user.dateJoined).toLocaleDateString()}\n\n`;

            response += `🅿️ Parking Summary:\n`;
            response += `• ${context.parkingData.profileSummary.totalReservations} total reservations\n`;
            response += `• $${context.parkingData.profileSummary.totalSpent.toFixed(2)} total spent\n`;
            response += `• ${context.parkingData.profileSummary.activePermits} active permits\n`;

            if (userUnpaidTickets.length > 0) {
              response += `• ⚠️ ${userUnpaidTickets.length} unpaid tickets\n`;
            } else {
              response += `• ✅ No unpaid tickets\n`;
            }

            if (userCars.length > 0) {
              response += `\n🚗 Registered Vehicles:\n`;
              userCars.forEach(car => {
                response += `• ${car.color} ${car.make} ${car.model} (${car.plateNumber})\n`;
              });
            } else {
              response += `\n🚗 No vehicles registered. Add your vehicle info to make reservations easier!\n`;
            }

            if (context.userProfile.notificationPrefs) {
              const prefs = context.userProfile.notificationPrefs;
              response += `\n🔔 Notifications: `;
              const enabled = [];
              if (prefs.emailEnabled) enabled.push('Email');
              if (prefs.smsEnabled) enabled.push('SMS');
              if (prefs.pushEnabled) enabled.push('Push');
              response += enabled.length > 0 ? enabled.join(', ') : 'None enabled';
            }
          }
        } else {
          response = `Your profile: ${user.firstName} ${user.lastName} (${user.userType})\nEmail: ${user.email}\nMember since: ${new Date(user.dateJoined).toLocaleDateString()}`;
        }
        break;

      case 'availability':
        // Get overall parking availability statistics with comprehensive data
        const allLots = await Lot.find({ status: 'Active' })
          .select('name availableSpaces totalSpaces hourlyRate semesterRate rateType permitTypes features evSpaces meteredSpaces');
        const totalSpaces = allLots.reduce((sum, lot) => sum + lot.totalSpaces, 0);
        const availableSpaces = allLots.reduce((sum, lot) => sum + lot.availableSpaces, 0);
        const occupancyRate = ((totalSpaces - availableSpaces) / totalSpaces * 100).toFixed(1);

        // Show top 3 lots with most availability
        const sortedLots = allLots
          .filter(lot => lot.availableSpaces > 0)
          .sort((a, b) => b.availableSpaces - a.availableSpaces)
          .slice(0, 3);

        context.parkingData.stats = { totalSpaces, availableSpaces, occupancyRate };
        context.parkingData.topLots = sortedLots;
        data = { totalSpaces, availableSpaces, occupancyRate, topLots: sortedLots };

        // Use Gemini AI for intelligent response
        if (geminiService.isAvailable()) {
          try {
            response = await geminiService.generateIntentResponse('availability', context);
          } catch (aiError) {
            console.log('Gemini AI fallback for availability:', aiError.message);
            // Fallback to original logic
            response = `Current campus parking status:\n\n`;
            response += `📊 Overall occupancy: ${occupancyRate}%\n`;
            response += `🅿️ Available spaces: ${availableSpaces}/${totalSpaces}\n\n`;

            if (sortedLots.length > 0) {
              response += `Best availability:\n`;
              sortedLots.forEach(lot => {
                response += `• ${lot.name}: ${lot.availableSpaces} spaces\n`;
              });
            }
          }
        } else {
          // Original fallback logic with comprehensive information
          response = `Current campus parking status:\n\n`;
          response += `📊 Overall occupancy: ${occupancyRate}%\n`;
          response += `🅿️ Available spaces: ${availableSpaces}/${totalSpaces}\n\n`;

          // Calculate special parking statistics
          const evTotal = allLots.reduce((sum, lot) => sum + (lot.evSpaces?.total || 0), 0);
          const evAvailable = allLots.reduce((sum, lot) => sum + (lot.evSpaces?.available || 0), 0);
          const meteredTotal = allLots.reduce((sum, lot) => sum + (lot.meteredSpaces?.total || 0), 0);
          const meteredAvailable = allLots.reduce((sum, lot) => sum + (lot.meteredSpaces?.available || 0), 0);

          if (evTotal > 0) {
            response += `⚡ EV charging spaces: ${evAvailable}/${evTotal} available\n`;
          }
          if (meteredTotal > 0) {
            response += `🪙 Metered spaces: ${meteredAvailable}/${meteredTotal} available\n`;
          }
          response += '\n';

          if (sortedLots.length > 0) {
            response += `Best availability:\n`;
            sortedLots.forEach(lot => {
              response += `• **${lot.name}**: ${lot.availableSpaces}/${lot.totalSpaces} spaces`;

              // Add pricing info
              if (lot.rateType === 'Hourly') {
                response += ` ($${lot.hourlyRate}/hour)`;
              } else if (lot.features?.isSemesterBased) {
                response += ` ($${lot.semesterRate}/semester)`;
              } else {
                response += ` (permit-based)`;
              }

              // Add special features
              const features = [];
              if (lot.features?.isEV && lot.evSpaces?.available > 0) {
                features.push('EV charging');
              }
              if (lot.features?.isMetered && lot.meteredSpaces?.available > 0) {
                features.push('Metered');
              }
              if (features.length > 0) {
                response += ` - ${features.join(', ')}`;
              }
              response += '\n';
            });
          }
        }
        break;

      case 'payment':
        // Get user's recent payment history
        const recentPayments = await Reservation.find({
          user: userId,
          paymentStatus: 'completed',
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).sort({ createdAt: -1 }).limit(5);

        const totalSpent = recentPayments.reduce((sum, payment) => sum + payment.totalPrice, 0);

        response = `Your recent parking payments:\n\n`;
        if (recentPayments.length > 0) {
          response += `💳 Total spent (last 30 days): $${totalSpent.toFixed(2)}\n\n`;
          recentPayments.forEach(payment => {
            const date = new Date(payment.createdAt).toLocaleDateString();
            response += `• ${date}: $${payment.totalPrice.toFixed(2)}\n`;
          });
          response += `\nNeed help with a payment issue?`;
        } else {
          response += `No recent payments found. All payments are processed securely through Stripe.`;
        }
        data = { recentPayments, totalSpent };
        break;

      case 'help':
        response = `I'm here to help! Here's what I can do:\n\n`;
        response += `🔍 Find available parking spots\n`;
        response += `📅 Check your reservations\n`;
        response += `🎫 Review your permits\n`;
        response += `📊 Show parking availability\n`;
        response += `💳 Help with payments\n`;
        response += `📞 Connect you with support\n\n`;
        response += `Just ask me anything about parking!`;
        break;

      default:
        // Use Gemini AI for general conversation and unrecognized intents
        if (geminiService.isAvailable()) {
          try {
            // Get some basic parking data for context
            const basicLots = await Lot.find({ status: 'active' }).limit(5).select('name availableSpaces totalSpaces');
            context.parkingData.availableLots = basicLots;

            response = await geminiService.generateResponse(message, context);
          } catch (aiError) {
            console.log('Gemini AI fallback for general message:', aiError.message);
            // Fallback to rule-based responses
            const lowerMessage = message.toLowerCase();

            if (lowerMessage.includes('thank')) {
              response = `You're welcome, ${user.firstName}! Happy to help with your parking needs. 😊`;
            } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
              response = `I'm sorry you're experiencing an issue. Let me help you:\n\n`;
              response += `• For technical problems, try refreshing the page\n`;
              response += `• For payment issues, check your billing history\n`;
              response += `• For urgent matters, contact support at (631) 632-PARK\n\n`;
              response += `What specific problem are you facing?`;
            } else {
              response = `I understand you're asking about "${message}". While I'm still learning, I can help you with:\n\n`;
              response += `• Finding parking spots\n`;
              response += `• Checking availability\n`;
              response += `• Managing reservations\n`;
              response += `• Permit information\n\n`;
              response += `Could you rephrase your question using one of these topics?`;
            }
          }
        } else {
          // Original rule-based fallback
          const lowerMessage = message.toLowerCase();

          if (lowerMessage.includes('thank')) {
            response = `You're welcome, ${user.firstName}! Happy to help with your parking needs. 😊`;
          } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue')) {
            response = `I'm sorry you're experiencing an issue. Let me help you:\n\n`;
            response += `• For technical problems, try refreshing the page\n`;
            response += `• For payment issues, check your billing history\n`;
            response += `• For urgent matters, contact support at (631) 632-PARK\n\n`;
            response += `What specific problem are you facing?`;
          } else {
            response = `I understand you're asking about "${message}". While I'm still learning, I can help you with:\n\n`;
            response += `• Finding parking spots\n`;
            response += `• Checking availability\n`;
            response += `• Managing reservations\n`;
            response += `• Permit information\n\n`;
            response += `Could you rephrase your question using one of these topics?`;
          }
        }
        break;
    }

    res.json({
      success: true,
      response,
      data,
      timestamp: new Date(),
      user: {
        firstName: user.firstName,
        userType: user.userType
      }
    });

  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({
      success: false,
      error: 'Sorry, I encountered an error. Please try again.',
      message: error.message
    });
  }
});

/**
 * Get quick stats for chatbot context
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get quick stats for personalized responses
    const [activeReservations, activePermits, availableLots] = await Promise.all([
      Reservation.countDocuments({
        user: userId,
        status: 'active',
        endTime: { $gte: new Date() }
      }),
      Permit.countDocuments({
        userId: userId,
        status: 'active',
        endDate: { $gte: new Date() }
      }),
      Lot.countDocuments({
        availableSpaces: { $gt: 0 },
        status: 'active'
      })
    ]);

    res.json({
      success: true,
      stats: {
        activeReservations,
        activePermits,
        availableLots
      }
    });

  } catch (error) {
    console.error('Chatbot stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats'
    });
  }
});

module.exports = router;
