import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaPlug, FaMoneyBillWave, FaTimes, FaInfoCircle, FaExclamationTriangle, FaArrowLeft, FaCreditCard, FaPlus, FaCheck, FaCar, FaTicketAlt, FaTrash, FaChargingStation, FaFileInvoiceDollar, FaFileDownload } from "react-icons/fa";
import { AuthService, TicketService, ReservationService, PermitService, UserService, CarService, PaymentMethodService } from "../utils/api";
import CarForm from "../components/CarForm";
import StripeProvider from "../components/StripeProvider";
import StripeCardElement from "../components/StripeCardElement";
// import EVChargingSimulator from '../components/EVChargingSimulator';

const StudentDashboard = ({ darkMode }) => {
  const navigate = useNavigate();

  // Check authentication on component mount
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      navigate('/login', { state: { from: '/dashboard' } });
    } else {
      // Check if user type is student
      const currentUser = AuthService.getCurrentUser();
      if (currentUser && currentUser.userType !== 'student') {
        // Redirect to appropriate dashboard based on user type
        if (currentUser.userType === 'admin') {
          navigate('/admin-dashboard');
        } else if (currentUser.userType === 'faculty') {
          navigate('/faculty-dashboard');
        }
      }
    }
  }, [navigate]);

  // Modal state management
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showBillingDetailsModal, setShowBillingDetailsModal] = useState(false);
  const [showCitationPaymentModal, setShowCitationPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Cars state management
  const [cars, setCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [carsError, setCarsError] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  const [showEditCarModal, setShowEditCarModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [carToDelete, setCarToDelete] = useState(null);

  // Extend reservation state
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [additionalHours, setAdditionalHours] = useState(1);
  const [extendingError, setExtendingError] = useState(null);

  // Credit card states
  const [hasStoredCard, setHasStoredCard] = useState(false);
  const [showAddCardForm, setShowAddCardForm] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [cardErrors, setCardErrors] = useState({});
  const [isAddingCard, setIsAddingCard] = useState(false);

  // State for data loading
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingReservations, setLoadingReservations] = useState(true);
  const [loadingPermits, setLoadingPermits] = useState(true);
  const [loadingBilling, setLoadingBilling] = useState(true);

  // State for errors
  const [ticketsError, setTicketsError] = useState(null);
  const [reservationsError, setReservationsError] = useState(null);
  const [permitsError, setPermitsError] = useState(null);
  const [billingError, setBillingError] = useState(null);

  // State for data
  const [tickets, setTickets] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [activePermits, setActivePermits] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);

  // Add saved payment methods state
  const [savedPaymentMethods, setSavedPaymentMethods] = useState([]);
  const [loadingSavedCards, setLoadingSavedCards] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Fetch tickets on component mount
  useEffect(() => {
    const fetchTickets = async () => {
      setLoadingTickets(true);
      try {
        const response = await TicketService.getUserTickets();
        console.log('Tickets response:', response); // Debug log
        if (response.success) {
          // The server returns an array directly, not wrapped in a tickets property
          const ticketsData = Array.isArray(response.data) ? response.data : [];
          console.log('Tickets data processed:', ticketsData);
          setTickets(ticketsData);
        } else {
          setTicketsError(response.error || 'Failed to fetch tickets');
        }
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTicketsError('An unexpected error occurred while fetching tickets');
      } finally {
        setLoadingTickets(false);
      }
    };

    fetchTickets();
  }, []);

  // Fetch reservations on component mount
  useEffect(() => {
    const fetchReservations = async () => {
      setLoadingReservations(true);
      setReservationsError(null); // Reset error on each fetch
      try {
        const response = await ReservationService.getUserReservations();
        console.log('Raw reservations response:', response);

        if (response.success) {
          // Check different possible data structures
          const reservationsData = response.data?.data?.reservations || response.data?.reservations || [];
          console.log('Extracted reservations data:', reservationsData);

          if (Array.isArray(reservationsData) && reservationsData.length > 0) {
            // Transform API data to match our component's expected format
            const formattedReservations = reservationsData.map(reservation => {
              console.log('Processing reservation:', reservation);

              // Debug the reservation's properties
              const lotInfo = reservation.lotId || {};
              console.log('Lot info:', lotInfo);
              console.log('Reservation status:', reservation.status);
              console.log('Is free reservation:', reservation.isFreeReservation);
              console.log('Free reason:', reservation.freeReason);

              // Calculate the adjusted price for time-based rules if this is a metered lot
              let adjustedPrice = reservation.totalPrice;
              const isMeteredLot = lotInfo.features?.isMetered ||
                (lotInfo.name && lotInfo.name.toLowerCase().includes('metered'));

              if (isMeteredLot && reservation.totalPrice > 0) {
                // Extract hourly rate - default to 2.50 if not set
                const hourlyRate = lotInfo.hourlyRate || 2.50;
                console.log(`Detected metered lot with hourly rate: $${hourlyRate}`);

                // Create a deep copy with all required properties for price calculation
                const calculationData = {
                  ...reservation,
                  lotId: {
                    ...lotInfo,
                    hourlyRate: hourlyRate,
                    rateType: lotInfo.rateType || 'Hourly',
                    features: {
                      ...(lotInfo.features || {}),
                      isMetered: true
                    },
                    name: lotInfo.name
                  },
                  totalPrice: reservation.totalPrice
                };

                adjustedPrice = calculateAdjustedPrice(calculationData);
                console.log(`Adjusted price for ${lotInfo.name}: $${adjustedPrice.toFixed(2)} (original: $${reservation.totalPrice.toFixed(2)})`);
              }

              // Create the formatted reservation object
              return {
                id: reservation.reservationId || reservation._id,
                lotName: lotInfo.name || 'Unknown Lot',
                spotNumber: reservation.permitType || 'Standard', // Using permitType as spotNumber
                isReserved: true,
                reservationStart: reservation.startTime,
                reservationEnd: reservation.endTime,
                isMetered: lotInfo.features?.isMetered || false,
                isEV: lotInfo.features?.isEV || false,
                status: reservation.status || 'Pending',
                originalPrice: reservation.totalPrice || 0,
                price: adjustedPrice, // Use the adjusted price
                location: lotInfo.location || { x: 0, y: 0 },
                isFreeReservation: reservation.isFreeReservation || false,
                freeReason: reservation.freeReason || '',
                lotId: lotInfo // Keep the lot data for future calculations
              };
            });

            console.log('Formatted reservations:', formattedReservations);
            setReservations(formattedReservations);
          } else {
            console.log('No reservations found in response');
            setReservations([]);
          }
        } else {
          console.error('Failed to fetch reservations:', response);
          setReservationsError(response.error || 'Failed to fetch reservations');
        }
      } catch (error) {
        console.error('Error fetching reservations:', error);
        setReservationsError(error.message || 'An unexpected error occurred while fetching reservations');
      } finally {
        setLoadingReservations(false);
      }
    };

    // Force refresh when component mounts to ensure we have the latest data
    fetchReservations();

    // Set an interval to refresh the reservations every 30 seconds
    const intervalId = setInterval(() => {
      fetchReservations();
    }, 30000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Fetch permits on component mount
  useEffect(() => {
    const fetchPermits = async () => {
      setLoadingPermits(true);
      setPermitsError(null); // Reset error on each fetch
      try {
        // Use the new getUserPermits method instead
        const response = await PermitService.getUserPermits('active');
        console.log('Permits response:', response);

        if (response.success) {
          // Check different possible data structures
          const permitsData = response.permits || response.data?.permits || [];
          console.log('Extracted permits data:', permitsData);

          if (Array.isArray(permitsData) && permitsData.length > 0) {
            // Additional client-side check for expired permits
            const now = new Date();
            const validPermits = permitsData.filter(permit => {
              const endDate = new Date(permit.endDate);
              return endDate >= now;
            });

            // Transform the data to match our UI format
            const formattedPermits = validPermits.map(permit => ({
              id: permit._id || permit.id,
              type: permit.permitName || permit.permitType || 'Standard',
              lot: Array.isArray(permit.lots)
                ? permit.lots.map(lot => lot.lotName || lot.name).join(', ')
                : 'Unknown',
              validUntil: permit.endDate
                ? new Date(permit.endDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })
                : 'N/A',
              status: permit.status || 'Active'
            }));
            console.log('Formatted permits:', formattedPermits);
            setActivePermits(formattedPermits);
          } else {
            console.log('No permits found in response');
            setActivePermits([]);
          }
        } else {
          console.error('Failed to fetch permits:', response);
          setPermitsError(response.error || 'Failed to fetch permits');
        }
      } catch (error) {
        console.error('Error fetching permits:', error);
        setPermitsError(error.message || 'An unexpected error occurred while fetching permits');
      } finally {
        setLoadingPermits(false);
      }
    };

    fetchPermits();
  }, []);

  // Fetch cars on component mount
  useEffect(() => {
    const fetchCars = async () => {
      setLoadingCars(true);
      setCarsError(null); // Reset error on each fetch
      try {
        const response = await CarService.getUserCars();
        console.log('Cars response:', response);

        if (response.success && response.cars) {
          setCars(response.cars);
        } else {
          console.error('Failed to fetch cars:', response);
          setCarsError(response.error || 'Failed to fetch vehicles');
          setCars([]);
        }
      } catch (error) {
        console.error('Error fetching cars:', error);
        setCarsError(error.message || 'An unexpected error occurred while fetching vehicles');
        setCars([]);
      } finally {
        setLoadingCars(false);
      }
    };

    fetchCars();
  }, []);

  // Fetch billing history - We need to check how payment data is structured
  useEffect(() => {
    const fetchBillingHistory = async () => {
      setLoadingBilling(true);
      setBillingError(null);
      try {
        const response = await UserService.getBillingHistory();
        console.log('Billing history response:', response);

        if (response.success && response.data.billingHistory) {
          // Process billing history items to apply client-side pricing adjustments
          const processedBillingHistory = response.data.billingHistory.map(item => {
            let processedItem = { ...item };

            // For reservation items, apply time-based pricing rules
            if (item.type === 'reservation' && item.rawData) {
              const { isMetered, startTime, endTime, hourlyRate } = item.rawData;

              if (isMetered) {
                // Calculate adjusted price based on time constraints (7am-7pm on weekdays)
                const start = new Date(startTime);
                const end = new Date(endTime);

                // Check if it's a weekend (0 = Sunday, 6 = Saturday)
                const isWeekend = start.getDay() === 0 || start.getDay() === 6;

                if (isWeekend) {
                  // Free on weekends
                  processedItem.adjustedAmount = 0;
                  processedItem.priceInfo = "Free (weekend parking)";
                } else {
                  // Calculate billable hours (only between 7am and 7pm)
                  const startHour = start.getHours() + (start.getMinutes() / 60);
                  const endHour = end.getHours() + (end.getMinutes() / 60);

                  // Billable window is 7am to 7pm (7.0 to 19.0 in decimal hours)
                  const billableStart = Math.max(startHour, 7.0);
                  const billableEnd = Math.min(endHour, 19.0);
                  const billableHours = Math.max(0, billableEnd - billableStart);

                  // Calculate adjusted price
                  const adjustedAmount = billableHours * (hourlyRate || 2.50);
                  processedItem.adjustedAmount = adjustedAmount;

                  if (adjustedAmount < item.amount) {
                    processedItem.priceInfo = `Adjusted for time-based pricing (${billableHours.toFixed(1)} billable hours)`;
                  }
                }
              }
            }

            // For refund entries with rawData, apply time-based pricing adjustments
            if (item.type === 'refund' && item.rawData) {
              const { isMetered, startTime, endTime, hourlyRate } = item.rawData;

              if (isMetered) {
                // Calculate adjusted refund amount based on time constraints (7am-7pm on weekdays)
                const start = new Date(startTime);
                const end = new Date(endTime);

                // Check if it's a weekend (0 = Sunday, 6 = Saturday)
                const isWeekend = start.getDay() === 0 || start.getDay() === 6;

                if (isWeekend) {
                  // Free on weekends, so refund should be $0
                  processedItem.adjustedAmount = 0;
                  processedItem.priceInfo = "No refund needed (weekend parking is free)";
                } else {
                  // Calculate billable hours (only between 7am and 7pm)
                  const startHour = start.getHours() + (start.getMinutes() / 60);
                  const endHour = end.getHours() + (end.getMinutes() / 60);

                  // Billable window is 7am to 7pm (7.0 to 19.0 in decimal hours)
                  const billableStart = Math.max(startHour, 7.0);
                  const billableEnd = Math.min(endHour, 19.0);
                  const billableHours = Math.max(0, billableEnd - billableStart);

                  // Calculate adjusted refund amount (negative value for refunds)
                  const adjustedAmount = -1 * billableHours * (hourlyRate || 2.50);
                  processedItem.adjustedAmount = adjustedAmount;

                  if (Math.abs(adjustedAmount) < Math.abs(item.amount)) {
                    processedItem.priceInfo = `Adjusted refund for time-based pricing (${billableHours.toFixed(1)} billable hours)`;
                  }
                }
              }
            }

            // Format the date as YYYY-MM-DD
            processedItem.date = new Date(item.date).toISOString().split('T')[0];

            // Format amount as a currency string
            processedItem.amountDisplay = formatCurrency(processedItem.adjustedAmount !== undefined ?
              processedItem.adjustedAmount : item.amount);

            return processedItem;
          });

          setBillingHistory(processedBillingHistory);
        } else {
          setBillingError(response.error || 'Failed to fetch billing history');
          // Fallback to empty array if there's an error
          setBillingHistory([]);
        }
      } catch (error) {
        console.error('Error fetching billing history:', error);
        setBillingError(error.message || 'An unexpected error occurred');
        setBillingHistory([]);
      } finally {
        setLoadingBilling(false);
      }
    };

    fetchBillingHistory();
  }, []);

  // Fetch saved payment methods
  useEffect(() => {
    const fetchSavedPaymentMethods = async () => {
      setLoadingSavedCards(true);
      try {
        const response = await PaymentMethodService.getSavedPaymentMethods();
        console.log('Saved payment methods response:', response);
        if (response.success) {
          setSavedPaymentMethods(response.paymentMethods || []);
          // Set hasStoredCard to true if there are saved payment methods
          setHasStoredCard(response.paymentMethods.length > 0);
          // Select the default payment method if available
          const defaultMethod = response.paymentMethods.find(pm => pm.isDefault);
          if (defaultMethod) {
            setSelectedPaymentMethod(defaultMethod);
            setCardDetails({
              ...cardDetails,
              cardNumber: `**** **** **** ${defaultMethod.last4}`,
              paymentMethodId: defaultMethod.id
            });
          }
        }
      } catch (error) {
        console.error('Error fetching saved payment methods:', error);
      } finally {
        setLoadingSavedCards(false);
      }
    };

    if (AuthService.isAuthenticated()) {
      fetchSavedPaymentMethods();
    }
  }, []);

  // Calculate adjusted price for metered lots based on start and end times
  const calculateAdjustedPrice = (reservation) => {
    // If the reservation already has a set price, use that
    if (reservation.totalPrice !== undefined) {
      console.log("Calculating for reservation with totalPrice:", reservation.totalPrice);

      // Basic validation - we need start and end times
      if (!reservation.startTime || !reservation.endTime) {
        console.log("Missing start or end time, returning original price");
        return reservation.totalPrice;
      }

      // Check if we have time details available
      if (reservation.lotId) {
        // Get the date objects
        const startTime = new Date(reservation.startTime);
        const endTime = new Date(reservation.endTime);
        console.log(`Reservation time: ${startTime.toLocaleString()} to ${endTime.toLocaleString()}`);

        // Check if it's a weekend (0 = Sunday, 6 = Saturday)
        const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;
        if (isWeekend) {
          console.log("Weekend reservation - free");
          return 0; // Free on weekends
        }

        // Check if it's a metered lot
        const isMeteredLot = (reservation.lotId.features && reservation.lotId.features.isMetered) ||
          (reservation.lotId.name && reservation.lotId.name.toLowerCase().includes('metered')) ||
          reservation.isMetered;

        console.log("Is metered lot:", isMeteredLot);
        console.log("Hourly rate:", reservation.lotId.hourlyRate || 2.50);

        if (isMeteredLot) {
          // Define the billable time window (7am to 7pm = 7.0 to 19.0 hours)
          const billableStartHour = 7.0;  // 7:00 AM
          const billableEndHour = 19.0;   // 7:00 PM

          // Convert reservation times to decimal hours
          const startHour = startTime.getHours();
          const startMinute = startTime.getMinutes();
          const endHour = endTime.getHours();
          const endMinute = endTime.getMinutes();
          const startTimeDecimal = startHour + (startMinute / 60);
          const endTimeDecimal = endHour + (endMinute / 60);

          console.log(`Start time decimal: ${startTimeDecimal}, End time decimal: ${endTimeDecimal}`);
          console.log(`Billable window: ${billableStartHour} to ${billableEndHour}`);

          // Check if the reservation is entirely outside of billable hours
          if (endTimeDecimal <= billableStartHour || startTimeDecimal >= billableEndHour) {
            console.log("Reservation is entirely outside billable hours (before 7AM or after 7PM)");
            return 0;
          }

          // Calculate the billable hours by finding the overlap between
          // the reservation and the billable window
          const overlapStart = Math.max(startTimeDecimal, billableStartHour);
          const overlapEnd = Math.min(endTimeDecimal, billableEndHour);
          const billableHours = Math.max(0, overlapEnd - overlapStart);

          console.log(`Billable hours calculation: max(0, min(${endTimeDecimal}, ${billableEndHour}) - max(${startTimeDecimal}, ${billableStartHour}))`);
          console.log(`Billable hours: ${billableHours.toFixed(2)}`);

          // Use hourlyRate with default to 2.50 if not defined
          const hourlyRate = reservation.lotId.hourlyRate || 2.50;

          console.log(`Metered lot reservation: ${billableHours.toFixed(1)} billable hours (7am-7pm only) at $${hourlyRate}/hour`);

          // Calculate the adjusted price
          const adjustedPrice = billableHours * hourlyRate;
          console.log(`Adjusted price: ${adjustedPrice.toFixed(2)}`);
          return adjustedPrice;
        }
      }

      // For non-metered lots or if we can't determine, return the original price
      console.log("Not a metered lot or couldn't determine - returning original price");
      return reservation.totalPrice;
    }

    // If no price is set, return 0
    console.log("No price set, returning 0");
    return 0;
  };

  // Handle View Details button click
  const handleViewDetails = async (reservation) => {
    try {
      // Fetch reservation details from backend
      const response = await ReservationService.getReservationById(reservation.id);
      console.log('Fetched reservation details:', response);

      if (response.success && response.data) {
        // Use the detailed reservation data from backend
        const detailedReservation = response.data.data?.reservation || response.data.reservation;

        // Extract lot rate type and pricing information from the detailed data
        const rateType = detailedReservation.lotId?.rateType || null;
        const hourlyRate = detailedReservation.lotId?.hourlyRate || 2.50; // Default to $2.50 if not specified
        const semesterRate = detailedReservation.lotId?.semesterRate || 0;

        // Ensure the lotId data is complete for accurate price calculation
        const completeReservation = {
          ...detailedReservation,
          lotId: {
            ...detailedReservation.lotId,
            hourlyRate: hourlyRate,
            rateType: rateType
          }
        };

        // Calculate adjusted price for time-based rules
        const adjustedPrice = calculateAdjustedPrice(completeReservation);
        console.log(`Original price: ${detailedReservation.totalPrice}, Adjusted price: ${adjustedPrice}`);

        // Merge current data with backend data to ensure we have all fields
        setSelectedReservation({
          ...reservation,
          ...detailedReservation,
          rateType,
          hourlyRate,
          semesterRate,
          // Override the price with the adjusted price
          price: adjustedPrice,
          // Store original price for reference
          originalPrice: detailedReservation.totalPrice
        });
        setShowDetailsModal(true);
      } else {
        // If there's an error, just use the data we already have
        console.error('Error fetching reservation details:', response.error);
        setSelectedReservation(reservation);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error in handleViewDetails:', error);
      // Fallback to using current data
      setSelectedReservation(reservation);
      setShowDetailsModal(true);
    }
  };

  // Handle Cancel button click
  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  // Handle Cancel Reservation submission
  const handleCancelReservation = async () => {
    try {
      // Show proper loading state
      setIsProcessingPayment(true); // Reusing this state for loading indication

      console.log('Cancelling reservation:', selectedReservation.id, 'with reason:', cancelReason);
      const response = await ReservationService.cancelReservation(selectedReservation.id, cancelReason);
      console.log('Cancellation response:', response);

      if (response.success) {
        // Update the local state with the cancelled reservation
        setReservations(prevReservations =>
          prevReservations.map(res =>
            res.id === selectedReservation.id ? { ...res, status: "cancelled" } : res
          )
        );

        // Close the modal and clear the reason
        setShowCancelModal(false);
        setCancelReason('');

        // Show appropriate success message with refund information if available
        let message = "Your reservation has been cancelled successfully.";
        if (response.data && response.data.refund) {
          const refundAmount = response.data.refund.amount.toFixed(2);
          message = `Your reservation has been cancelled successfully and a refund of $${refundAmount} has been processed.`;
        }

        setSuccessMessage(message);
        setShowSuccessMessage(true);

        // Hide success message after 5 seconds (longer for refund info)
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      } else {
        // Show specific error message
        throw new Error(response.error || 'Failed to cancel reservation');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      // Show error message
      setSuccessMessage(`Error: ${error.message || 'Failed to cancel reservation'}`);
      setShowSuccessMessage(true);

      // Hide error message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    } finally {
      setIsProcessingPayment(false); // Stop loading state
    }
  };

  // Close all modals
  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowCancelModal(false);
    setShowBillingDetailsModal(false);
    setShowCitationPaymentModal(false);
    setShowExtendModal(false);
    setSelectedReservation(null);
    setSelectedBill(null);
    setSelectedCitation(null);
    setShowAddCardForm(false);
    setCardDetails({
      cardNumber: '',
      cardholderName: '',
      expiryDate: '',
      cvv: ''
    });
    setCardErrors({});
    setAdditionalHours(1);
    setExtendingError(null);
  };

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border border-green-200";
      case "inactive":
        return "bg-gray-100 text-gray-800 border border-gray-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "paid":
        return "bg-green-100 text-green-800 border border-green-200";
      case "unpaid":
        return "bg-red-100 text-red-800 border border-red-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);

    // Use NY timezone to display the exact time stored in the database
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Calculate reservation duration in hours
  const calculateDuration = (start, end) => {
    const startTime = new Date(start);
    const endTime = new Date(end);
    const durationMs = endTime - startTime;
    const durationHours = durationMs / (1000 * 60 * 60);
    return durationHours.toFixed(1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleViewBillingDetails = (bill) => {
    console.log('Viewing billing details:', bill);

    // If the bill already has adjusted price info from our client calculation, use that
    if (bill.adjustedAmount !== undefined) {
      setSelectedBill({
        ...bill,
        amount: bill.adjustedAmount
      });
      setShowBillingDetailsModal(true);
      return;
    }

    // For items that don't have client-calculated adjustments, ensure we have a valid amount
    const numericAmount = typeof bill.amount === 'number' ?
      bill.amount :
      parseFloat(String(bill.amount).replace(/[^0-9.-]+/g, ''));

    setSelectedBill({
      ...bill,
      amount: isNaN(numericAmount) ? 0 : numericAmount
    });
    setShowBillingDetailsModal(true);
  };

  // Handle ticket payment
  const handlePayTicket = async (ticket) => {
    setSelectedCitation(ticket);
    setShowCitationPaymentModal(true);
  };

  // Handle credit card form submission from Stripe with save option
  const handlePaymentMethodCreated = async (paymentMethod, saveCard) => {
    try {
      // Store payment method details
      setHasStoredCard(true);
      setCardDetails({
        ...cardDetails,
        cardNumber: `**** **** **** ${paymentMethod.card.last4}`,
        paymentMethodId: paymentMethod.id
      });
      setShowAddCardForm(false);

      // If saveCard is true, save the payment method for future use
      if (saveCard) {
        const response = await PaymentMethodService.savePaymentMethod(paymentMethod.id, !savedPaymentMethods.length);
        if (response.success) {
          console.log('Payment method saved successfully');
          // Refresh the list of saved payment methods
          const pmResponse = await PaymentMethodService.getSavedPaymentMethods();
          if (pmResponse.success) {
            setSavedPaymentMethods(pmResponse.paymentMethods || []);
          }
        } else {
          console.error('Failed to save payment method:', response.error);
        }
      }

      // Process the payment with the new payment method
      await processPaymentWithMethod(paymentMethod.id);
    } catch (error) {
      console.error('Error handling payment method:', error);
      setBillingError('Failed to process payment method');
    }
  };

  // Process payment with a payment method ID
  const processPaymentWithMethod = async (paymentMethodId) => {
    setIsProcessingPayment(true);
    try {
      const response = await TicketService.payTicket(selectedCitation._id, {
        paymentMethodId
      });

      if (response.success) {
        // Update local tickets state
        setTickets(tickets.map(ticket =>
          ticket._id === selectedCitation._id
            ? { ...ticket, isPaid: true }
            : ticket
        ));

        setShowCitationPaymentModal(false);

        // If there's a receipt URL from Stripe, open it in a new tab
        if (response.paymentIntent?.receiptUrl) {
          window.open(response.paymentIntent.receiptUrl, '_blank');
        }

        setSuccessMessage("Ticket payment processed successfully!");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        setBillingError(response.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setBillingError('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Process ticket payment (updated to delegate to processPaymentWithMethod if using card)
  const handleProcessTicketPayment = async () => {
    setIsProcessingPayment(true);
    try {
      // If using credit card and a card is stored, use stored payment method ID
      if (paymentMethod === 'credit-card' && hasStoredCard) {
        await processPaymentWithMethod(cardDetails.paymentMethodId);
        return;
      }

      // For student account payment
      const response = await TicketService.payTicket(selectedCitation._id);

      if (response.success) {
        // Update local tickets state
        setTickets(tickets.map(ticket =>
          ticket._id === selectedCitation._id
            ? { ...ticket, isPaid: true }
            : ticket
        ));

        setShowCitationPaymentModal(false);
        setSuccessMessage("Ticket payment processed successfully!");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        setBillingError(response.error);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setBillingError('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Function to validate credit card form
  const validateCardForm = () => {
    const errors = {};

    // Card number validation - basic length check and numbers only
    if (!cardDetails.cardNumber.trim()) {
      errors.cardNumber = 'Card number is required';
    } else if (!/^\d{15,16}$/.test(cardDetails.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = 'Card number must be 15-16 digits';
    }

    // Cardholder name validation
    if (!cardDetails.cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required';
    }

    // Expiry date validation - MM/YY format
    if (!cardDetails.expiryDate.trim()) {
      errors.expiryDate = 'Expiry date is required';
    } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiryDate)) {
      errors.expiryDate = 'Use MM/YY format';
    } else {
      // Check if card is expired
      const [month, year] = cardDetails.expiryDate.split('/');
      const expiryDate = new Date(2000 + parseInt(year), parseInt(month) - 1);
      const today = new Date();
      if (expiryDate < today) {
        errors.expiryDate = 'Card is expired';
      }
    }

    // CVV validation - 3 or 4 digits
    if (!cardDetails.cvv.trim()) {
      errors.cvv = 'CVV is required';
    } else if (!/^\d{3,4}$/.test(cardDetails.cvv)) {
      errors.cvv = 'CVV must be 3-4 digits';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Function to handle card detail changes with formatting

  // Function to handle card form submission

  // Handle Extend Time button click
  const handleExtendClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowExtendModal(true);
  };

  // Handle Extend Reservation submission
  const handleExtendReservation = async () => {
    try {
      // Show loading state
      setIsProcessingPayment(true);
      setExtendingError(null);

      console.log(`Extending reservation ${selectedReservation.id} by ${additionalHours} hours`);
      const response = await ReservationService.extendReservation(
        selectedReservation.id,
        additionalHours,
        null, // No payment method
        selectedReservation.isMetered // Pass the isMetered flag
      );
      console.log('Extension response:', response);

      if (response.success) {
        // Update the local state with the extended reservation
        const updatedReservations = reservations.map(res => {
          if (res.id === selectedReservation.id) {
            const updatedReservation = { ...res };
            // Update end time by adding hours
            const currentEndTime = new Date(res.reservationEnd);
            const newEndTime = new Date(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000));
            updatedReservation.reservationEnd = newEndTime.toISOString();
            return updatedReservation;
          }
          return res;
        });

        setReservations(updatedReservations);

        // Close the modal and reset state
        setShowExtendModal(false);
        setAdditionalHours(1);

        // Check if it's a semester rate (free extension)
        const isSemesterRate = response.data?.data?.extension?.isSemesterRate;

        // Check if it's a metered lot
        const isMetered = selectedReservation.isMetered;

        // Check if the new end time is after 7PM
        const newEndTime = new Date(new Date(selectedReservation.reservationEnd).getTime() + (additionalHours * 60 * 60 * 1000));
        const isAfter7PM = newEndTime.getHours() >= 19; // 7PM = 19:00

        // Check if current time is after 4PM (for permit holders)
        const currentTime = new Date();
        const isAfter4PM = currentTime.getHours() >= 16; // 4PM = 16:00

        // Check if the user has a valid permit for free after 4PM
        const hasFreeAfter4PMWithPermit = activePermits.length > 0 && isAfter4PM;

        // Check if the server indicated this was a free after 4PM extension
        const isFreeAfter4PMFromServer = response.data?.data?.extension?.isFreeAfter4PMWithPermit;

        // Show different success message based on rate type, metered status, and time
        let successMsg;
        if (isSemesterRate) {
          successMsg = `Your reservation has been extended by ${additionalHours} hour(s) at no additional cost.`;
        } else if (isFreeAfter4PMFromServer || hasFreeAfter4PMWithPermit) {
          successMsg = `Your reservation has been extended by ${additionalHours} hour(s) at no additional cost (free after 4PM with permit).`;
        } else if (isMetered && !isAfter7PM) {
          successMsg = `Your reservation has been extended by ${additionalHours} hour(s) with a $2.50 extension fee.`;
        } else if (isMetered && isAfter7PM) {
          successMsg = `Your reservation has been extended by ${additionalHours} hour(s) at no additional cost (after 7PM).`;
        } else {
          successMsg = `Your reservation has been extended by ${additionalHours} hour(s).`;
        }

        setSuccessMessage(successMsg);
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        throw new Error(response.error || 'Failed to extend reservation');
      }
    } catch (error) {
      console.error('Error extending reservation:', error);
      setExtendingError(error.message || 'Failed to extend reservation time');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle editing a car
  const handleEditCar = (car) => {
    setSelectedCar(car);
    setShowEditCarModal(true);
  };

  // Handle deleting a car
  const handleDeleteCar = (carId) => {
    setCarToDelete(carId);
    setShowDeleteConfirmModal(true);
  };

  // Handle confirming car deletion
  const handleConfirmDeleteCar = async () => {
    if (!carToDelete) return;

    try {
      setIsProcessingPayment(true); // Reuse the loading state
      const response = await CarService.deleteCar(carToDelete);

      if (response.success) {
        // Remove the deleted car from the list
        setCars(prevCars => prevCars.filter(car => car._id !== carToDelete));

        setSuccessMessage('Vehicle deleted successfully');
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);

        setShowDeleteConfirmModal(false);
        setCarToDelete(null);
      } else {
        console.error('Failed to delete car:', response.error);
        setCarsError(response.error);
      }
    } catch (error) {
      console.error('Error deleting car:', error);
      setCarsError(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Handle saving a new or edited car
  const handleSaveCar = async (carData) => {
    try {
      setIsProcessingPayment(true); // Reuse the loading state

      let response;
      if (selectedCar) {
        // Update existing car
        response = await CarService.updateCar(selectedCar._id, carData);
      } else {
        // Create new car
        response = await CarService.saveCar(carData);
      }

      if (response.success) {
        // If editing, update the car in the list
        if (selectedCar) {
          setCars(prevCars => prevCars.map(car =>
            car._id === selectedCar._id ? response.car : car
          ));
          setShowEditCarModal(false);
        } else {
          // If adding, add the new car to the list
          setCars(prevCars => [...prevCars, response.car]);
          setShowAddCarModal(false);
        }

        setSuccessMessage(`Vehicle ${selectedCar ? 'updated' : 'added'} successfully`);
        setShowSuccessMessage(true);

        // Reset selected car
        setSelectedCar(null);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      } else {
        console.error(`Failed to ${selectedCar ? 'update' : 'add'} car:`, response.error);
        setCarsError(response.error);
      }
    } catch (error) {
      console.error(`Error ${selectedCar ? 'updating' : 'adding'} car:`, error);
      setCarsError(error.message || 'An unexpected error occurred');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Debug function to refresh ticket data
  const refreshTickets = async () => {
    setLoadingTickets(true);
    try {
      const response = await TicketService.getUserTickets();
      console.log('Fresh Tickets response:', response);
      if (response.success) {
        // The server returns an array directly, not wrapped in a tickets property
        const ticketsData = Array.isArray(response.data) ? response.data : [];
        console.log('Tickets data processed:', ticketsData);
        setTickets(ticketsData);

        // Display success message
        setSuccessMessage("Tickets refreshed successfully!");
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        setTicketsError(response.error || 'Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTicketsError('An unexpected error occurred while fetching tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  // Handle selecting a saved payment method
  const handleSelectPaymentMethod = (method) => {
    setSelectedPaymentMethod(method);
    setCardDetails({
      ...cardDetails,
      cardNumber: `**** **** **** ${method.last4}`,
      paymentMethodId: method.id
    });
  };

  // Delete a saved payment method
  const handleDeletePaymentMethod = async (methodId, event) => {
    event.stopPropagation(); // Prevent selecting the card when clicking delete
    try {
      const response = await PaymentMethodService.deletePaymentMethod(methodId);
      if (response.success) {
        // Remove the deleted method from the state
        setSavedPaymentMethods(savedPaymentMethods.filter(pm => pm.id !== methodId));

        // If the deleted method was selected, clear the selection
        if (selectedPaymentMethod && selectedPaymentMethod.id === methodId) {
          setSelectedPaymentMethod(null);
          setCardDetails({
            ...cardDetails,
            cardNumber: '',
            paymentMethodId: null
          });
        }

        // Update hasStoredCard based on remaining payment methods
        setHasStoredCard(savedPaymentMethods.length > 1);
      } else {
        console.error('Failed to delete payment method:', response.error);
      }
    } catch (error) {
      console.error('Error deleting payment method:', error);
    }
  };

  // Set a payment method as default

  // Handle billing details receipt download
  const handleDownloadReceipt = async (bill) => {
    try {
      const result = await UserService.downloadReceiptPDF(bill.id || bill._id);
      if (!result.success) {
        console.error('Error downloading receipt:', result.error);
        // Here you could add error notification UI if needed
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>

      {/* Success Message Toast */}
      {showSuccessMessage && (
        <div className="fixed top-20 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50 shadow-md flex items-center">
          <FaInfoCircle className="mr-2" />
          <span>{successMessage}</span>
          <button className="ml-4" onClick={() => setShowSuccessMessage(false)}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Permits</p>
          {loadingPermits ? (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</p>
          ) : permitsError ? (
            <p className="text-sm text-red-500 mt-1">Error loading permits</p>
          ) : (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activePermits.length}</p>
          )}
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Citations</p>
          {loadingTickets ? (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</p>
          ) : ticketsError ? (
            <p className="text-sm text-red-500 mt-1">Error loading citations</p>
          ) : (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{tickets.length}</p>
          )}
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding Balance</p>
          {loadingTickets ? (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</p>
          ) : ticketsError ? (
            <p className="text-sm text-red-500 mt-1">Error loading balance</p>
          ) : (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(
                tickets
                  .filter(ticket => ticket && !ticket.isPaid)
                  .reduce((total, ticket) => total + (ticket.amount || 0), 0)
              )}
            </p>
          )}
          {/* Add a debug button to force refresh tickets data */}
          <button
            onClick={() => {
              console.log("Current tickets:", tickets);
              const fetchTickets = async () => {
                setLoadingTickets(true);
                try {
                  const response = await TicketService.getUserTickets();
                  console.log('Tickets response:', response);
                  if (response.success) {
                    const ticketsData = Array.isArray(response.data) ? response.data : [];
                    console.log('Tickets data processed:', ticketsData);
                    setTickets(ticketsData);
                  } else {
                    setTicketsError(response.error || 'Failed to fetch tickets');
                  }
                } catch (error) {
                  console.error('Error fetching tickets:', error);
                  setTicketsError('An unexpected error occurred while fetching tickets');
                } finally {
                  setLoadingTickets(false);
                }
              };
              fetchTickets();
            }}
            className="mt-2 text-xs text-blue-500 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Reservations</p>
          {loadingReservations ? (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</p>
          ) : reservationsError ? (
            <p className="text-sm text-red-500 mt-1">Error loading reservations</p>
          ) : (
            <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {reservations.filter(r => r.status.toLowerCase() === 'active').length}
            </p>
          )}
        </div>
      </div>

      {/* Parking Reservations Section */}
      <div className={`mt-6 p-6 mb-10 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex flex-col mb-3 md:mb-0">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Parking Reservations</h2>
            <button
              className={`mt-1 text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              onClick={() => navigate('/past-reservations')}
            >
              View all reservation history <FaArrowLeft className="ml-1 transform rotate-180" />
            </button>
          </div>
          <button
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            onClick={() => navigate('/find-parking')}
          >
            <FaMapMarkerAlt className="mr-2" />
            Reserve Parking
          </button>
        </div>

        {loadingReservations ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        ) : reservationsError ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <p className="flex items-center">
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              {reservationsError}
            </p>
          </div>
        ) : reservations.filter(res => ['active', 'upcoming', 'pending'].includes(res.status.toLowerCase())).length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any active parking reservations.</p>
        ) : (
          <div className="space-y-4">
            {/* Show all active, upcoming, or pending reservations */}
            {reservations
              .filter(reservation => ['active', 'upcoming', 'pending'].includes(reservation.status.toLowerCase()))
              .map((reservation) => {
                // Calculate the adjusted price for each reservation
                let calculatedPrice = reservation.price;

                // Ensure we're using hourly rate correctly for metered lots
                if (reservation.isMetered && reservation.lotId) {
                  // Create complete reservation data for calculation
                  const calculationData = {
                    ...reservation,
                    startTime: reservation.reservationStart,
                    endTime: reservation.reservationEnd,
                    lotId: {
                      ...reservation.lotId,
                      hourlyRate: reservation.lotId.hourlyRate || 2.50,
                      rateType: reservation.lotId.rateType || 'Hourly',
                      features: {
                        ...(reservation.lotId.features || {}),
                        isMetered: true
                      }
                    },
                    totalPrice: reservation.originalPrice
                  };

                  // Recalculate the adjusted price
                  calculatedPrice = calculateAdjustedPrice(calculationData);
                  console.log(`Display price for ${reservation.lotName}: ${calculatedPrice} (original: ${reservation.originalPrice})`);
                }

                return (
                  <div
                    key={reservation.id}
                    className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}
                  >
                    <div className="flex flex-col md:flex-row justify-between">
                      <div className="mb-4 md:mb-0">
                        <div className="flex items-center mb-2">
                          <FaMapMarkerAlt className={`mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                          <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            {reservation.lotName} - Spot {reservation.spotNumber}
                          </h3>
                        </div>

                        <div className="flex items-center mb-2">
                          <FaClock className={`mr-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {formatDateTime(reservation.reservationStart)} - {formatDateTime(reservation.reservationEnd)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(reservation.status)}`}>
                            {reservation.status}
                          </span>

                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-gray-600 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
                            <FaClock className="mr-1" /> {calculateDuration(reservation.reservationStart, reservation.reservationEnd)} hours
                          </span>

                          {reservation.isEV && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800`}>
                              <FaPlug className="mr-1" /> EV Charging
                            </span>
                          )}

                          {reservation.isMetered && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800`}>
                              <FaMoneyBillWave className="mr-1" /> Metered
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col space-y-2">
                        <button
                          className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                          onClick={() => handleViewDetails(reservation)}
                        >
                          View Details
                        </button>

                        {(reservation.status.toLowerCase() === 'upcoming' || reservation.status.toLowerCase() === 'active' || reservation.status.toLowerCase() === 'pending') && (
                          <>
                            <button
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                              onClick={() => handleExtendClick(reservation)}
                            >
                              Extend Time
                            </button>
                            <button
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                              onClick={() => handleCancelClick(reservation)}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {showDetailsModal && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeAllModals}
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-4">Reservation Details</h3>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div>
                <p className="text-sm font-medium mb-1">Reservation Number</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReservation.id}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedReservation.status)}`}>
                  {selectedReservation.status}
                </span>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Parking Location</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReservation.lotName}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Permit Name</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedReservation.spotNumber}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Start Time</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDateTime(selectedReservation.reservationStart)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">End Time</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatDateTime(selectedReservation.reservationEnd)}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Duration</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{calculateDuration(selectedReservation.reservationStart, selectedReservation.reservationEnd)} hours</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Price</p>
                <div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(selectedReservation.price)}
                  </p>
                  {selectedReservation.originalPrice !== undefined &&
                    selectedReservation.originalPrice !== selectedReservation.price && (
                      <p className="text-sm text-gray-500">
                        Original price: <span className="line-through">{formatCurrency(selectedReservation.originalPrice)}</span>
                        <span className="ml-2 text-green-500">
                          (Saved {formatCurrency(selectedReservation.originalPrice - selectedReservation.price)})
                        </span>
                      </p>
                    )}
                </div>

                {/* Add time-based pricing explanation if applicable */}
                {selectedReservation.lotId && selectedReservation.lotId.rateType === 'Hourly' &&
                  (selectedReservation.lotId.features?.isMetered || selectedReservation.lotName?.toLowerCase().includes('metered')) && (
                    <div className={`mt-2 p-3 rounded-lg text-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <h4 className="font-medium mb-1">Time-Based Pricing Applied</h4>
                      <p>Metered lots only charge between 7am-7pm on weekdays.</p>

                      {/* Calculate and show billable hours */}
                      {(() => {
                        const startTime = new Date(selectedReservation.startTime);
                        const endTime = new Date(selectedReservation.endTime);
                        const isWeekend = startTime.getDay() === 0 || startTime.getDay() === 6;

                        if (isWeekend) {
                          return <p className="text-green-500 mt-1">Free on weekends.</p>;
                        }

                        const startHour = startTime.getHours();
                        const endHour = endTime.getHours();

                        // Early morning or evening
                        if ((startHour < 7 && endHour < 7) || (startHour >= 19 && endHour >= 19)) {
                          return <p className="text-green-500 mt-1">Free: Outside billable hours (7am-7pm).</p>;
                        }

                        // Calculate billable hours
                        const startTimeDecimal = startHour + (startTime.getMinutes() / 60);
                        const endTimeDecimal = endHour + (endTime.getMinutes() / 60);
                        const billableStart = Math.max(startTimeDecimal, 7.0);
                        const billableEnd = Math.min(endTimeDecimal, 19.0);
                        let billableHours = 0;

                        if (billableEnd > billableStart) {
                          billableHours = billableEnd - billableStart;
                        }

                        // Calculate adjusted price
                        const adjustedPrice = billableHours * selectedReservation.lotId.hourlyRate;

                        return (
                          <div className="mt-1">
                            <p>Billable hours: <span className="font-medium">{billableHours.toFixed(1)} hours</span> (7am-7pm only)</p>
                            {startHour < 7 && <p className="text-green-500">• Free before 7:00 AM</p>}
                            {endHour >= 19 && <p className="text-green-500">• Free after 7:00 PM</p>}
                            <p>Rate: ${selectedReservation.hourlyRate}/hour</p>
                            <p className="mt-2 font-medium">Total Adjusted Price: {formatCurrency(adjustedPrice)}</p>
                            {selectedReservation.originalPrice && adjustedPrice < selectedReservation.originalPrice && (
                              <p className="text-green-500">You saved {formatCurrency(selectedReservation.originalPrice - adjustedPrice)} due to time-based pricing.</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Features</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedReservation.isEV && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaPlug className="mr-1" /> EV Charging
                    </span>
                  )}
                  {selectedReservation.isMetered && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      <FaMoneyBillWave className="mr-1" /> Metered
                    </span>
                  )}
                  {!selectedReservation.isMetered && !selectedReservation.isEV && (
                    <span className="text-sm text-gray-500">No special features</span>
                  )}
                </div>
              </div>
            </div>

            {/* Add EV Charging Simulator if this is an EV charging reservation */}
            {/* Commented out EV Simulator UI
            {(selectedReservation.isEVCharging || (selectedReservation.isEV && selectedReservation.status === 'active')) && (
              <div className="mt-6">
                <h4 className={`font-semibold mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                  <FaChargingStation className="inline mr-2" /> EV Charging Controls
                </h4>
                <EVChargingSimulator reservationId={selectedReservation.id} darkMode={darkMode} />
              </div>
            )}
            */}

            <div className="mt-6 flex justify-end space-x-3">
              {(selectedReservation.status.toLowerCase() === 'upcoming' || selectedReservation.status.toLowerCase() === 'active' || selectedReservation.status.toLowerCase() === 'pending') && (
                <>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleExtendClick(selectedReservation);
                    }}
                  >
                    Extend Time
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleCancelClick(selectedReservation);
                    }}
                  >
                    Cancel Reservation
                  </button>
                </>
              )}

              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={closeAllModals}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Reservation Modal */}
      {showCancelModal && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeAllModals}
            >
              <FaTimes size={20} />
            </button>

            <div className="flex items-center mb-4 text-red-500">
              <FaExclamationTriangle size={24} className="mr-2" />
              <h3 className="text-xl font-semibold">Cancel Reservation</h3>
            </div>

            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to cancel your reservation at {selectedReservation.lotName} ({selectedReservation.spotNumber}) on {formatDateTime(selectedReservation.reservationStart).split(',')[0]}?
            </p>

            <div className="mb-6">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} focus:outline-none`}
                rows="3"
                placeholder="Please provide a reason for cancelling..."
              ></textarea>
            </div>

            <div className={`mb-6 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <p className={`text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cancellation Policy</p>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Cancellations made at least 24 hours before the reservation start time receive a full refund. Later cancellations may be subject to a cancellation fee.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={closeAllModals}
                disabled={isProcessingPayment}
              >
                Keep Reservation
              </button>
              <button
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center ${isProcessingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleCancelReservation}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Yes, Cancel Reservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Reservation Modal */}
      {showExtendModal && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeAllModals}
            >
              <FaTimes size={20} />
            </button>

            <div className="flex items-center mb-4 text-blue-500">
              <FaClock size={24} className="mr-2" />
              <h3 className="text-xl font-semibold">Extend Reservation Time</h3>
            </div>

            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You are extending your reservation at {selectedReservation.lotName} ({selectedReservation.spotNumber}).
            </p>

            <div className="mb-6">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Current end time
              </label>
              <p className={`mb-4 font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatDateTime(selectedReservation.reservationEnd)}
              </p>

              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Additional hours
              </label>
              <div className="flex items-center">
                <button
                  className={`px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-l-lg font-bold`}
                  onClick={() => setAdditionalHours(Math.max(1, additionalHours - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={additionalHours}
                  onChange={(e) => setAdditionalHours(Math.max(1, Math.min(24, parseInt(e.target.value) || 1)))}
                  className={`w-16 text-center py-2 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
                <button
                  className={`px-4 py-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-r-lg font-bold`}
                  onClick={() => setAdditionalHours(Math.min(24, additionalHours + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>New end time</p>
              <p className={`font-medium text-green-500`}>
                {formatDateTime(new Date(new Date(selectedReservation.reservationEnd).getTime() + (additionalHours * 60 * 60 * 1000)))}
              </p>
            </div>

            {/* Only show pricing info if available */}
            {selectedReservation.rateType && (
              <div className="mb-6">
                <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Pricing</p>
                {selectedReservation.rateType.toLowerCase() === 'hourly' ? (
                  // For hourly rate lots
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Your hourly rate is ${selectedReservation.hourlyRate?.toFixed(2) || '0.00'}/hour.
                    <br />
                    {selectedReservation.isMetered ? (
                      (() => {
                        // Calculate the new end time
                        const currentEndTime = new Date(selectedReservation.reservationEnd);
                        const newEndTime = new Date(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000));
                        const isAfter7PM = newEndTime.getHours() >= 19; // 7PM = 19:00

                        // Check if current time is after 4PM (for permit holders)
                        const currentTime = new Date();
                        const isAfter4PM = currentTime.getHours() >= 16; // 4PM = 16:00

                        // If user has active permits and we're after 4PM
                        const hasPermitAndAfter4PM = activePermits.length > 0 && isAfter4PM;

                        if (hasPermitAndAfter4PM) {
                          return (
                            <>
                              <span className="font-medium text-green-500">Free extension after 4PM with permit!</span><br />
                              <span className="text-xs">Permit holders get free access after 4PM</span><br />
                              Hourly cost: ${((selectedReservation.hourlyRate || 0) * additionalHours).toFixed(2)}<br />
                              <span className="font-medium text-green-500">Estimated total cost: $0.00</span>
                            </>
                          );
                        } else if (isAfter7PM) {
                          return (
                            <>
                              <span className="font-medium text-green-500">Free extension after 7PM!</span><br />
                              <span className="text-xs">Metered parking is free after 7PM</span><br />
                              <span className="font-medium text-green-500">Estimated total cost: $0.00</span>
                            </>
                          );
                        } else {
                          return (
                            <>
                              <span className="font-medium text-amber-500">Extension fee: $2.50</span><br />
                              Hourly cost: ${((selectedReservation.hourlyRate || 0) * additionalHours).toFixed(2)}<br />
                              Estimated total cost: ${(((selectedReservation.hourlyRate || 0) * additionalHours) + 2.50).toFixed(2)}
                            </>
                          );
                        }
                      })()
                    ) : (
                      <>
                        {/* Check if user has permits and it's after 4PM */}
                        {(() => {
                          const currentTime = new Date();
                          const isAfter4PM = currentTime.getHours() >= 16; // 4PM = 16:00
                          const hasPermitAndAfter4PM = activePermits.length > 0 && isAfter4PM;

                          if (hasPermitAndAfter4PM) {
                            return (
                              <>
                                <span className="font-medium text-green-500">Free extension after 4PM with permit!</span><br />
                                <span className="text-xs">Permit holders get free access after 4PM</span><br />
                                <span className="font-medium text-green-500">Estimated total cost: $0.00</span>
                              </>
                            );
                          } else {
                            return (
                              <>
                                Estimated additional cost: ${((selectedReservation.hourlyRate || 0) * additionalHours).toFixed(2)}
                              </>
                            );
                          }
                        })()}
                      </>
                    )}
                  </p>
                ) : (
                  // For semester-based/permit-based lots
                  <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="text-green-500 font-medium">No additional cost</span> - This is a semester/permit-based lot
                    with fixed pricing for the term.
                  </p>
                )}
              </div>
            )}

            {extendingError && (
              <div className={`p-3 mb-4 rounded-md ${darkMode ? 'bg-red-900/20 text-red-200' : 'bg-red-50 text-red-800'}`}>
                <p>{extendingError}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={closeAllModals}
                disabled={isProcessingPayment}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center ${isProcessingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleExtendReservation}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Extend Reservation'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Permits Section - Fixed to properly use darkMode prop */}
      <div className={`rounded-lg shadow-sm p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Permits</h2>
          <button
            className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={() => navigate('/past-permits')}
          >
            View All Permits <FaArrowLeft className="ml-1 transform rotate-180" />
          </button>
        </div>

        {loadingPermits ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        ) : permitsError ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <p className="flex items-center">
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              {permitsError}
            </p>
          </div>
        ) : activePermits.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any active permits.</p>
        ) : (
          <div className="space-y-4">
            {/* Show only the most recent permit */}
            {activePermits.slice(0, 1).map((permit, index) => (
              <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{permit.type}</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Valid Until: {permit.validUntil}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(permit.status)}`}>
                    {permit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Vehicles Section */}
      <div className={`rounded-lg shadow-sm p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>My Vehicles</h2>
          <button
            className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            onClick={() => setShowAddCarModal(true)}
            disabled={cars.length >= 2}
          >
            <FaPlus className="mr-2" />
            Add Vehicle {cars.length >= 2 && "(Max 2)"}
          </button>
        </div>

        {loadingCars ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        ) : carsError ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <p className="flex items-center">
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              {carsError}
            </p>
          </div>
        ) : cars.length === 0 ? (
          <div className="text-center py-8">
            <FaCar className={`mx-auto text-5xl mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} />
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You haven't added any vehicles yet.</p>
            <button
              className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
              onClick={() => setShowAddCarModal(true)}
            >
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {cars.map((car) => (
              <div key={car._id} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between">
                  <div>
                    <div className="flex items-start">
                      <FaCar className={`mt-1 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                      <div>
                        <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          {car.make} {car.model} ({car.year})
                        </h3>
                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {car.color} {car.bodyType}
                        </p>
                        <p className={`mt-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {car.plateNumber} • {car.stateProv}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button
                      className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                      onClick={() => handleEditCar(car)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                      onClick={() => handleDeleteCar(car._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History Section - Updated to properly use darkMode prop */}
      <div className={`rounded-lg shadow-sm p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Billing History</h2>
          <button
            className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={() => navigate('/billing')}
          >
            View All <FaArrowLeft className="ml-1 transform rotate-180" />
          </button>
        </div>

        {loadingBilling ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-700"></div>
          </div>
        ) : billingError ? (
          <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
            <p className="flex items-center">
              <FaExclamationTriangle className="mr-2 flex-shrink-0" />
              {billingError}
            </p>
          </div>
        ) : billingHistory.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any billing history.</p>
        ) : (
          <div className="space-y-4">
            {/* Display all permit switch related transactions and show the most recent transaction for other types */}
            {billingHistory
              .filter((bill, index, self) => {
                // Check if this is part of a permit switch transaction
                const isPermitSwitch = bill.description.includes('Permit Switch') ||
                  (bill.description.includes('Permit') &&
                    self.some(b => b.description.includes('Refund') &&
                      b.description.includes('Permit Switch')));

                // If it's part of a permit switch, include it
                // Otherwise, only include it if it's the most recent transaction
                return isPermitSwitch || index === 0;
              })
              .slice(0, 5) // Limit to the 5 most recent/relevant transactions
              .map((bill, index) => (
                <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                  <div className="flex flex-col md:flex-row justify-between">
                    <div>
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        {bill.date}
                      </span>
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {bill.description}
                      </h3>
                      {bill.priceInfo && (
                        <p className="text-xs text-green-500">{bill.priceInfo}</p>
                      )}
                    </div>
                    <div className="flex items-center mt-2 md:mt-0">
                      <span className={`font-bold text-lg mr-4 ${bill.description.includes('Refund')
                        ? 'text-green-600'
                        : darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {bill.amountDisplay}
                        {bill.adjustedAmount !== undefined && bill.adjustedAmount !== bill.amount && (
                          <span className="ml-2 text-sm line-through text-gray-500">
                            {formatCurrency(bill.amount)}
                          </span>
                        )}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(bill.status)}`}>
                        {bill.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleViewBillingDetails(bill)}
                      className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Billing Details Modal */}
      {showBillingDetailsModal && selectedBill && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center ${darkMode ? 'bg-gray-900 bg-opacity-50' : 'bg-black bg-opacity-25'}`}>
          <div className={`relative p-6 rounded-lg shadow-xl w-full max-w-md mx-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <button
              onClick={() => {
                setShowBillingDetailsModal(false);
                setSelectedBill(null);
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <FaTimes className="h-5 w-5" />
            </button>

            <h2 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Billing Details</h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Date</p>
                <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                  {new Date(selectedBill.date).toLocaleDateString()}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className={darkMode ? 'text-white' : 'text-gray-900'}>{selectedBill.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Amount</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'} font-bold`}>
                  {typeof selectedBill.amount === 'number' && !isNaN(selectedBill.amount)
                    ? formatCurrency(selectedBill.amount)
                    : '$0.00'}
                </p>

                {/* Show adjusted vs original amount if they differ */}
                {selectedBill.adjustedAmount !== undefined &&
                  selectedBill.originalAmount !== undefined &&
                  selectedBill.adjustedAmount !== selectedBill.originalAmount && (
                    <p className="text-sm text-gray-500 mt-1">
                      <span className="line-through">{formatCurrency(selectedBill.originalAmount)}</span>
                      <span className="ml-2 text-green-500">
                        {selectedBill.adjustedAmount < selectedBill.originalAmount
                          ? '(Discounted for metered lot time restrictions)'
                          : ''}
                      </span>
                    </p>
                  )}
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <p className={`${selectedBill.status.toLowerCase() === 'paid' ? 'text-green-500' : 'text-yellow-500'}`}>
                  {selectedBill.status}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-100'}`}
                onClick={() => {
                  setShowBillingDetailsModal(false);
                  setSelectedBill(null);
                }}
              >
                Close
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                onClick={() => handleDownloadReceipt(selectedBill)}
              >
                <FaFileDownload className="mr-2" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Citation Payment Modal */}
      {showCitationPaymentModal && selectedCitation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Pay Citation</h3>
              <button
                onClick={() => setShowCitationPaymentModal(false)}
                className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-4">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Citation Details</p>
              <div className={`mt-2 p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className="font-medium">{selectedCitation.name}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Date: {new Date(selectedCitation.date_posted).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                  })}
                </p>
                <p className="font-bold mt-2">Amount Due: ${selectedCitation.amount.toFixed(2)}</p>
              </div>
            </div>

            {billingError && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded-lg text-sm">
                {billingError}
              </div>
            )}

            <div className="mb-4">
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select Payment Method</p>
              <div className="space-y-2">
                {/* Credit/Debit Card Option */}
                <label className={`flex items-center p-3 rounded-lg border ${darkMode
                  ? paymentMethod === 'credit-card' ? 'border-blue-500 bg-gray-700' : 'border-gray-600 bg-gray-700'
                  : paymentMethod === 'credit-card' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="credit-card"
                    checked={paymentMethod === 'credit-card'}
                    onChange={() => setPaymentMethod('credit-card')}
                    className="mr-3"
                  />
                  <div className="flex-grow">
                    <p className="font-medium">Credit/Debit Card</p>
                    {hasStoredCard && selectedPaymentMethod ? (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Using card ending in {selectedPaymentMethod.last4}
                      </p>
                    ) : (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Add a payment card
                      </p>
                    )}
                  </div>
                </label>

                {/* Display saved payment methods if any */}
                {paymentMethod === 'credit-card' && savedPaymentMethods.length > 0 && (
                  <div className={`mt-2 ml-8 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p className="text-sm font-medium mb-2">Your saved cards:</p>
                    <div className="space-y-2">
                      {savedPaymentMethods.map((method) => (
                        <div
                          key={method.id}
                          onClick={() => handleSelectPaymentMethod(method)}
                          className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedPaymentMethod && selectedPaymentMethod.id === method.id
                            ? darkMode ? 'bg-blue-800' : 'bg-blue-100'
                            : darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                          <div className="flex items-center">
                            <FaCreditCard className="mr-2" />
                            <div>
                              <p className="text-sm">{method.brand} •••• {method.last4}</p>
                              <p className="text-xs">Expires {method.exp_month}/{method.exp_year}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {method.isDefault && (
                              <span className={`mr-2 px-1.5 py-0.5 text-xs rounded-full ${darkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'
                                }`}>
                                Default
                              </span>
                            )}
                            <button
                              onClick={(e) => handleDeletePaymentMethod(method.id, e)}
                              className={`p-1 rounded-full ${darkMode ? 'hover:bg-red-900 text-gray-400' : 'hover:bg-red-100 text-gray-500'
                                }`}
                            >
                              <FaTrash size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setShowAddCardForm(true)}
                      className={`mt-3 flex items-center px-2 py-1 rounded text-xs ${darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                    >
                      <FaPlus className="mr-1" /> Add New Card
                    </button>
                  </div>
                )}

                {/* Add a new card button if no saved cards */}
                {paymentMethod === 'credit-card' && !savedPaymentMethods.length && !showAddCardForm && (
                  <div className="mt-2 ml-8">
                    <button
                      onClick={() => setShowAddCardForm(true)}
                      className={`flex items-center px-2 py-1 rounded text-xs ${darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                    >
                      <FaPlus className="mr-1" /> Add Payment Card
                    </button>
                  </div>
                )}

                <label className={`flex items-center p-3 rounded-lg border ${darkMode
                  ? paymentMethod === 'student-account' ? 'border-blue-500 bg-gray-700' : 'border-gray-600 bg-gray-700'
                  : paymentMethod === 'student-account' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white'
                  }`}>
                  <input
                    type="radio"
                    name="payment-method"
                    value="student-account"
                    checked={paymentMethod === 'student-account'}
                    onChange={() => setPaymentMethod('student-account')}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">Student Account</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Charge to your student account</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Stripe Card Element */}
            {paymentMethod === 'credit-card' && !hasStoredCard && (
              <div className="mb-4">
                <StripeProvider>
                  <StripeCardElement
                    darkMode={darkMode}
                    onPaymentMethodCreated={handlePaymentMethodCreated}
                    buttonText="Save Card & Pay"
                  />
                </StripeProvider>
              </div>
            )}

            {/* Manual Credit Card Form is replaced by Stripe Elements */}

            <div className="flex justify-end">
              <button
                onClick={() => setShowCitationPaymentModal(false)}
                className={`px-4 py-2 rounded-lg font-medium text-sm mr-2 ${darkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
              >
                Cancel
              </button>

              {/* Only show this button if we have a stored card or using student account */}
              {(hasStoredCard || paymentMethod === 'student-account') && (
                <button
                  onClick={handleProcessTicketPayment}
                  disabled={isProcessingPayment}
                  className={`px-4 py-2 rounded-lg font-medium text-sm ${isProcessingPayment
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                >
                  {isProcessingPayment ? 'Processing...' : `Pay $${selectedCitation.amount.toFixed(2)}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Citations Section - Using tickets data from API */}
      <div className={`rounded-lg shadow-sm p-6 mb-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Citations</h2>
          <div className="flex space-x-2">
            <button
              className={`text-sm px-2 py-1 rounded border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200'}`}
              onClick={refreshTickets}
            >
              Refresh
            </button>
            <button
              className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              onClick={() => navigate('/past-citations')}
            >
              View All <FaArrowLeft className="ml-1 transform rotate-180" />
            </button>
          </div>
        </div>

        {loadingTickets ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Loading citations...</p>
        ) : ticketsError ? (
          <p className="text-red-500">Error: {ticketsError}</p>
        ) : tickets.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any citations.</p>
        ) : (
          <div className="space-y-4">
            {/* Show only the most recent citation */}
            {tickets.slice(0, 1).map((ticket) => (
              <div key={ticket._id} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{ticket.name}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Date: {new Date(ticket.date_posted).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                    </p>
                    <p className={`font-medium mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>${ticket.amount}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(ticket.isPaid ? 'Paid' : 'Unpaid')}`}>
                      {ticket.isPaid ? 'Paid' : 'Unpaid'}
                    </span>
                    {!ticket.isPaid && (
                      <button
                        onClick={() => handlePayTicket(ticket)}
                        className="mt-2 flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                      >
                        <FaCreditCard className="mr-1" /> Pay Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Car Modal */}
      {showAddCarModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setShowAddCarModal(false)}
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaCar className="mr-2" /> Add New Vehicle
            </h3>

            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You can add up to 2 vehicles to your account. Vehicle information will be used for your parking reservations.
            </p>

            <CarForm
              darkMode={darkMode}
              onSubmit={handleSaveCar}
              onCancel={() => setShowAddCarModal(false)}
              isProcessing={isProcessingPayment}
            />
          </div>
        </div>
      )}

      {/* Edit Car Modal */}
      {showEditCarModal && selectedCar && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowEditCarModal(false);
                setSelectedCar(null);
              }}
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <FaCar className="mr-2" /> Edit Vehicle
            </h3>

            <CarForm
              darkMode={darkMode}
              initialData={selectedCar}
              onSubmit={handleSaveCar}
              onCancel={() => {
                setShowEditCarModal(false);
                setSelectedCar(null);
              }}
              isProcessing={isProcessingPayment}
            />
          </div>
        </div>
      )}

      {/* Delete Car Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => {
                setShowDeleteConfirmModal(false);
                setCarToDelete(null);
              }}
            >
              <FaTimes size={20} />
            </button>

            <div className="flex items-center mb-4 text-red-500">
              <FaExclamationTriangle size={24} className="mr-2" />
              <h3 className="text-xl font-semibold">Delete Vehicle</h3>
            </div>

            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to delete this vehicle? This action cannot be undone.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setCarToDelete(null);
                }}
                disabled={isProcessingPayment}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center ${isProcessingPayment ? 'opacity-75 cursor-not-allowed' : ''}`}
                onClick={handleConfirmDeleteCar}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </>
                ) : (
                  'Yes, Delete Vehicle'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;