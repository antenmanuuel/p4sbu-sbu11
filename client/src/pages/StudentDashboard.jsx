import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaClock, FaPlug, FaMoneyBillWave, FaCarAlt, FaTimes, FaCalendarAlt, FaInfoCircle, FaExclamationTriangle, FaArrowLeft, FaCreditCard, FaPlus, FaCheck } from "react-icons/fa";

const StudentDashboard = ({ isAuthenticated, darkMode }) => {
  const navigate = useNavigate();

  // Modal state management
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [additionalHours, setAdditionalHours] = useState(1);
  const [cancelReason, setCancelReason] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showBillingDetailsModal, setShowBillingDetailsModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showCitationPaymentModal, setShowCitationPaymentModal] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('credit-card');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

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

  if (!isAuthenticated) {
    navigate('/');
  }

  const activePermits = [
    { type: "Student Permit", lot: "Lot 2", validUntil: "2024-12-31", status: "Active" },
  ];

  const citations = [
    { date: "2024-03-15", violation: "No Valid Permit", amount: "$50", status: "Unpaid" },
    { date: "2024-02-26", violation: "Incorrect Spot", amount: "$75", status: "Unpaid" }
  ];

  const billingHistory = [
    { date: "2024-01-10", description: "Semester Parking Permit", amount: "$125", status: "Paid" },
  ];

  // Mock reservations data based on the Lot schema
  const [reservations, setReservations] = useState([
    {
      id: "R1001",
      location: { x: 40.9148, y: -73.1259 },
      lotName: "South P Lot",
      spotNumber: "A-123",
      isReserved: true,
      reservationStart: "2024-04-10T09:00:00",
      reservationEnd: "2024-04-10T17:00:00",
      isMetered: false,
      isEV: true,
      status: "Active",
      price: 15.00
    },
    {
      id: "R1002",
      location: { x: 40.9165, y: -73.1238 },
      lotName: "Administration Garage",
      spotNumber: "B-45",
      isReserved: true,
      reservationStart: "2024-04-15T08:30:00",
      reservationEnd: "2024-04-15T14:30:00",
      isMetered: true,
      isEV: false,
      status: "Upcoming",
      price: 20.00
    }
  ]);

  // Handle View Details button click
  const handleViewDetails = (reservation) => {
    setSelectedReservation(reservation);
    setShowDetailsModal(true);
  };

  // Handle Extend Time button click
  const handleExtendTimeClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowExtendModal(true);
  };

  // Handle Cancel button click
  const handleCancelClick = (reservation) => {
    setSelectedReservation(reservation);
    setShowCancelModal(true);
  };

  // Handle Extend Time submission
  const handleExtendTime = () => {
    // Calculate new end time
    const currentEndTime = new Date(selectedReservation.reservationEnd);
    const newEndTime = new Date(currentEndTime.getTime() + (additionalHours * 60 * 60 * 1000));

    // Update the reservations array
    const updatedReservations = reservations.map(res => {
      if (res.id === selectedReservation.id) {
        return {
          ...res,
          reservationEnd: newEndTime.toISOString(),
          price: res.price + (additionalHours * (res.isMetered ? 2.50 : 1.50)) // Simple price calculation
        };
      }
      return res;
    });

    setReservations(updatedReservations);
    setShowExtendModal(false);

    // Show success message
    setSuccessMessage(`Your reservation has been extended by ${additionalHours} hour${additionalHours > 1 ? 's' : ''}.`);
    setShowSuccessMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Handle Cancel Reservation submission
  const handleCancelReservation = () => {
    // Update the reservations array
    const updatedReservations = reservations.map(res => {
      if (res.id === selectedReservation.id) {
        return {
          ...res,
          status: "Cancelled"
        };
      }
      return res;
    });

    setReservations(updatedReservations);
    setShowCancelModal(false);
    setCancelReason('');

    // Show success message
    setSuccessMessage("Your reservation has been cancelled successfully.");
    setShowSuccessMessage(true);

    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Close all modals
  const closeAllModals = () => {
    setShowDetailsModal(false);
    setShowExtendModal(false);
    setShowCancelModal(false);
    setShowBillingDetailsModal(false);
    setShowCitationPaymentModal(false);
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
    setSelectedBill(bill);
    setShowBillingDetailsModal(true);
  };

  // Add a new function to handle opening the payment modal
  const handlePayCitation = (citation) => {
    setSelectedCitation(citation);
    setShowCitationPaymentModal(true);
  };

  // Add a function to process the citation payment
  const handleProcessCitationPayment = () => {
    setIsProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      // Update the citations array
      const updatedCitations = citations.map(citation => {
        if (citation === selectedCitation) {
          return { ...citation, status: "Paid" };
        }
        return citation;
      });

      // Update the citation list (in a real app, this would be an API call)
      // For now we're just working with the mock data
      citations.splice(0, citations.length, ...updatedCitations);

      setIsProcessingPayment(false);
      setShowCitationPaymentModal(false);

      // Show success message
      setSuccessMessage(`Citation payment of ${selectedCitation.amount} has been processed successfully.`);
      setShowSuccessMessage(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
    }, 1500);
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
  const handleCardDetailChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;

    // Format card number with spaces after every 4 digits
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').substring(0, 16);
      formattedValue = formattedValue.replace(/(\d{4})/g, '$1 ').trim();
    }

    // Format expiry date with slash
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
      if (formattedValue.length > 2) {
        formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
      }
    }

    // Limit CVV to 4 digits
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setCardDetails(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Function to handle card form submission
  const handleAddCard = () => {
    if (validateCardForm()) {
      setIsAddingCard(true);

      // Simulate adding the card to the user's account
      setTimeout(() => {
        setIsAddingCard(false);
        setHasStoredCard(true);
        setShowAddCardForm(false);

        // Show success message
        setSuccessMessage('Your credit card has been added successfully.');
        setShowSuccessMessage(true);

        // Hide success message after 3 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
      }, 1500);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <h1 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student Dashboard</h1>

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
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{activePermits.length}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Citations</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{citations.length}</p>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Outstanding Balance</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>$50.00</p>
        </div>
        <div className={`p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
          <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Reservations</p>
          <p className={`text-2xl font-bold mt-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{reservations.filter(r => r.status.toLowerCase() === 'active').length}</p>
        </div>
      </div>

      {/* Parking Reservations Section */}
      <div className={`mt-6 p-6 rounded-lg shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border border-gray-100'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <div className="flex flex-col mb-3 md:mb-0">
            <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>My Parking Reservations</h2>
            <button
              className={`mt-1 text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
              onClick={() => navigate('/past-reservations')}
            >
              View all reservation history
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

        {reservations.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any parking reservations.</p>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
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
                        {formatDateTime(reservation.reservationStart)} - {formatDateTime(reservation.reservationEnd).split(',')[1]}
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
                    {reservation.status.toLowerCase() === 'active' && (
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                        onClick={() => handleExtendTimeClick(reservation)}
                      >
                        Extend Time
                      </button>
                    )}

                    <button
                      className={`px-4 py-2 rounded text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                      onClick={() => handleViewDetails(reservation)}
                    >
                      View Details
                    </button>

                    {reservation.status.toLowerCase() === 'upcoming' && (
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                        onClick={() => handleCancelClick(reservation)}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                <p className="text-sm font-medium mb-1">Spot Number</p>
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
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedReservation.price)}</p>
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

              <div className="col-span-full">
                <p className="text-sm font-medium mb-1">Coordinates</p>
                <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Lat: {selectedReservation.location.x.toFixed(4)}, Long: {selectedReservation.location.y.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              {selectedReservation.status.toLowerCase() === 'active' && (
                <button
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleExtendTimeClick(selectedReservation);
                  }}
                >
                  Extend Time
                </button>
              )}

              {selectedReservation.status.toLowerCase() === 'upcoming' && (
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium"
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleCancelClick(selectedReservation);
                  }}
                >
                  Cancel Reservation
                </button>
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

      {/* Extend Time Modal */}
      {showExtendModal && selectedReservation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-md ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeAllModals}
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-2">Extend Reservation Time</h3>
            <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Current end time: {formatDateTime(selectedReservation.reservationEnd)}
            </p>

            <div className="mb-4">
              <label className={`block mb-2 text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Add Hours
              </label>
              <div className="flex items-center">
                <button
                  className={`px-3 py-1 rounded-l ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setAdditionalHours(Math.max(1, additionalHours - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={additionalHours}
                  onChange={(e) => setAdditionalHours(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                  className={`w-16 text-center py-1 ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                />
                <button
                  className={`px-3 py-1 rounded-r ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                  onClick={() => setAdditionalHours(Math.min(12, additionalHours + 1))}
                >
                  +
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="flex justify-between mb-2">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>New End Time:</span>
                  <span className="font-medium">
                    {formatDateTime(new Date(new Date(selectedReservation.reservationEnd).getTime() + (additionalHours * 60 * 60 * 1000)).toISOString())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Additional Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(additionalHours * (selectedReservation.isMetered ? 2.50 : 1.50))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                onClick={closeAllModals}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                onClick={handleExtendTime}
              >
                Confirm Extension
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
              >
                Keep Reservation
              </button>
              <button
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                onClick={handleCancelReservation}
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Permits Section - Fixed to properly use darkMode prop */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Active Permits</h2>
          <button
            className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={() => navigate('/past-permits')}
          >
            View All Permits <FaArrowLeft className="ml-1 transform rotate-180" />
          </button>
        </div>

        {activePermits.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any active permits.</p>
        ) : (
          <div className="space-y-4">
            {activePermits.map((permit, index) => (
              <div key={index} className={`rounded-lg p-4 shadow-sm ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>{permit.type} - {permit.lot}</h3>
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Valid Until: {permit.validUntil}</p>
                  </div>
                  <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    {permit.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Citations Section - Updated to properly use darkMode prop */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Citations</h2>
          <button
            className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={() => navigate('/past-citations')}
          >
            View All Citations <FaArrowLeft className="ml-1 transform rotate-180" />
          </button>
        </div>
        {citations.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any citations.</p>
        ) : (
          <div className="space-y-4">
            {citations.map((citation, index) => (
              <div key={index} className={`p-4 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>{citation.violation}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date: {citation.date}</p>
                    <p className={`font-medium mt-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{citation.amount}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusClass(citation.status)}`}>
                      {citation.status}
                    </span>
                    {citation.status === "Unpaid" && (
                      <button
                        onClick={() => handlePayCitation(citation)}
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

      {/* Billing History Section - Updated to properly use darkMode prop */}
      <div className={`rounded-lg shadow-md p-6 mb-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Billing History</h2>
          <button
            className={`text-sm font-medium flex items-center ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            onClick={() => navigate('/billing')}
          >
            View All <FaArrowLeft className="ml-1 transform rotate-180" />
          </button>
        </div>

        {billingHistory.length === 0 ? (
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>You don't have any billing history.</p>
        ) : (
          <div className="space-y-3">
            {billingHistory.map((bill, index) => (
              <div key={index} className={`rounded-lg p-4 shadow-sm ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex flex-col md:flex-row justify-between">
                  <div>
                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                      {bill.date}
                    </span>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bill.description}
                    </h3>
                  </div>
                  <div className="flex items-center mt-2 md:mt-0">
                    <span className={`font-bold text-lg mr-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {bill.amount}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${bill.status.toLowerCase() === 'paid' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
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

      {/* Add the billing details modal and handler function */}
      {showBillingDetailsModal && selectedBill && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`relative w-full max-w-2xl ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-xl p-6`}>
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={closeAllModals}
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-xl font-semibold mb-4">Billing Details</h3>

            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <div>
                <p className="text-sm font-medium mb-1">Date</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedBill.date}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedBill.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Amount</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{selectedBill.amount}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-1">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(selectedBill.status)}`}>
                  {selectedBill.status}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
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
                <p className="font-medium">{selectedCitation.violation}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Date: {selectedCitation.date}</p>
                <p className="font-bold mt-2">Amount Due: {selectedCitation.amount}</p>
              </div>
            </div>

            <div className="mb-4">
              <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Select Payment Method</p>
              <div className="space-y-2">
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
                    {hasStoredCard ? (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Card ending in {cardDetails.cardNumber.slice(-4) || '1234'}
                      </p>
                    ) : (
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No card on file
                      </p>
                    )}
                  </div>
                  {paymentMethod === 'credit-card' && !hasStoredCard && !showAddCardForm && (
                    <button
                      onClick={() => setShowAddCardForm(true)}
                      className={`ml-2 flex items-center px-2 py-1 rounded text-xs ${darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                    >
                      <FaPlus className="mr-1" /> Add Card
                    </button>
                  )}
                </label>

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

            {/* Credit Card Form */}
            {paymentMethod === 'credit-card' && showAddCardForm && (
              <div className={`mb-4 p-4 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <h4 className="font-medium mb-3">Add Payment Card</h4>

                <div className="space-y-3">
                  {/* Card Number */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Card Number
                    </label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={cardDetails.cardNumber}
                      onChange={handleCardDetailChange}
                      placeholder="1234 5678 9012 3456"
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode
                        ? 'bg-gray-800 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                        } focus:outline-none ${cardErrors.cardNumber
                          ? darkMode ? 'border-red-500' : 'border-red-500'
                          : darkMode ? 'focus:border-blue-500' : 'focus:border-blue-600'
                        }`}
                    />
                    {cardErrors.cardNumber && (
                      <p className="mt-1 text-xs text-red-500">{cardErrors.cardNumber}</p>
                    )}
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      name="cardholderName"
                      value={cardDetails.cardholderName}
                      onChange={handleCardDetailChange}
                      placeholder="John Doe"
                      className={`w-full px-3 py-2 rounded-lg border ${darkMode
                        ? 'bg-gray-800 text-white border-gray-600'
                        : 'bg-white text-gray-900 border-gray-300'
                        } focus:outline-none ${cardErrors.cardholderName
                          ? darkMode ? 'border-red-500' : 'border-red-500'
                          : darkMode ? 'focus:border-blue-500' : 'focus:border-blue-600'
                        }`}
                    />
                    {cardErrors.cardholderName && (
                      <p className="mt-1 text-xs text-red-500">{cardErrors.cardholderName}</p>
                    )}
                  </div>

                  {/* Expiry Date and CVV (in a row) */}
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={cardDetails.expiryDate}
                        onChange={handleCardDetailChange}
                        placeholder="MM/YY"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode
                          ? 'bg-gray-800 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                          } focus:outline-none ${cardErrors.expiryDate
                            ? darkMode ? 'border-red-500' : 'border-red-500'
                            : darkMode ? 'focus:border-blue-500' : 'focus:border-blue-600'
                          }`}
                      />
                      {cardErrors.expiryDate && (
                        <p className="mt-1 text-xs text-red-500">{cardErrors.expiryDate}</p>
                      )}
                    </div>

                    <div className="w-1/2">
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        CVV
                      </label>
                      <input
                        type="text"
                        name="cvv"
                        value={cardDetails.cvv}
                        onChange={handleCardDetailChange}
                        placeholder="123"
                        className={`w-full px-3 py-2 rounded-lg border ${darkMode
                          ? 'bg-gray-800 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                          } focus:outline-none ${cardErrors.cvv
                            ? darkMode ? 'border-red-500' : 'border-red-500'
                            : darkMode ? 'focus:border-blue-500' : 'focus:border-blue-600'
                          }`}
                      />
                      {cardErrors.cvv && (
                        <p className="mt-1 text-xs text-red-500">{cardErrors.cvv}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    onClick={() => setShowAddCardForm(false)}
                    className={`px-3 py-1 rounded-lg font-medium text-xs mr-2 ${darkMode
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                      }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddCard}
                    disabled={isAddingCard}
                    className={`px-3 py-1 rounded-lg font-medium text-xs ${isAddingCard
                      ? 'bg-blue-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                      } text-white flex items-center`}
                  >
                    {isAddingCard ? (
                      'Saving...'
                    ) : (
                      <>
                        <FaCheck className="mr-1" /> Save Card
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

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
              <button
                onClick={handleProcessCitationPayment}
                disabled={isProcessingPayment || (paymentMethod === 'credit-card' && !hasStoredCard)}
                className={`px-4 py-2 rounded-lg font-medium text-sm ${isProcessingPayment || (paymentMethod === 'credit-card' && !hasStoredCard)
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
              >
                {isProcessingPayment ? 'Processing...' : `Pay ${selectedCitation.amount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;

