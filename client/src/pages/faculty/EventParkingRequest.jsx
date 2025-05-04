import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { EventParkingService } from '../../utils/api';
import NotificationModal from '../../components/NotificationModal';

const EventParkingRequest = ({ darkMode, user, isAuthenticated }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [availableLots, setAvailableLots] = useState([]);
    const [formData, setFormData] = useState({
        eventName: '',
        eventDescription: '',
        eventDate: new Date(),
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default 2 hours from now
        location: '',
        expectedAttendees: 10,
        parkingLotPreference: null, // Changed from empty string to null to avoid ObjectId cast errors
        specialRequirements: '',
        organizerName: user ? `${user.firstName} ${user.lastName}` : '',
        organizerEmail: user ? user.email : '',
        organizerPhone: '',
        departmentName: user ? user.department || '' : ''
    });

    // For time dropdowns
    const [startHour, setStartHour] = useState('09');
    const [startMinute, setStartMinute] = useState('00');
    const [startAmPm, setStartAmPm] = useState('AM');
    const [endHour, setEndHour] = useState('11');
    const [endMinute, setEndMinute] = useState('00');
    const [endAmPm, setEndAmPm] = useState('AM');

    // Generate hours, minutes for dropdowns
    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 4 }, (_, i) => (i * 15).toString().padStart(2, '0'));

    // Add notification state
    const [notification, setNotification] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Redirect non-faculty users
    useEffect(() => {
        if (user && user.userType !== 'faculty') {
            alert('Only faculty members can access special event parking requests.');
            navigate('/dashboard');
        }
    }, [user, navigate]);

    // Fetch available parking lots
    useEffect(() => {
        const fetchLots = async () => {
            setLoading(true);
            try {
                console.log('Fetching available lots for event parking');
                const result = await EventParkingService.getAvailableLots();

                if (result.success) {
                    console.log('Available lots fetched successfully:', result.data);
                    setAvailableLots(result.data || []);
                } else {
                    console.error('Failed to fetch available lots:', result.error);
                    alert(`Failed to load available parking lots: ${result.error}`);
                }
            } catch (error) {
                console.error('Error fetching lots:', error);
                alert(`Error loading available parking lots: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };

        if (user?.userType === 'faculty') {
            fetchLots();
        }
    }, [user]);

    // Initialize time dropdowns from formData times
    useEffect(() => {
        const startDate = new Date(formData.startTime);
        const endDate = new Date(formData.endTime);

        // Set start time dropdowns
        setStartHour(startDate.getHours() % 12 || 12);
        setStartMinute(startDate.getMinutes().toString().padStart(2, '0'));
        setStartAmPm(startDate.getHours() >= 12 ? 'PM' : 'AM');

        // Set end time dropdowns
        setEndHour(endDate.getHours() % 12 || 12);
        setEndMinute(endDate.getMinutes().toString().padStart(2, '0'));
        setEndAmPm(endDate.getHours() >= 12 ? 'PM' : 'AM');
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Special handling for parking lot preference to avoid ObjectId cast errors
        if (name === 'parkingLotPreference') {
            setFormData(prev => ({
                ...prev,
                [name]: value || null // Use null instead of empty string
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleDateChange = (date, field) => {
        setFormData(prev => ({
            ...prev,
            [field]: date
        }));
    };

    // Update time in formData when time dropdowns change
    const updateTimeInFormData = () => {
        // Create start time
        const startDate = new Date(formData.eventDate);
        const startHourVal = parseInt(startHour);
        const startHour24 = startAmPm === 'PM' && startHourVal !== 12
            ? startHourVal + 12
            : (startAmPm === 'AM' && startHourVal === 12 ? 0 : startHourVal);
        startDate.setHours(startHour24, parseInt(startMinute), 0);

        // Create end time
        const endDate = new Date(formData.eventDate);
        const endHourVal = parseInt(endHour);
        const endHour24 = endAmPm === 'PM' && endHourVal !== 12
            ? endHourVal + 12
            : (endAmPm === 'AM' && endHourVal === 12 ? 0 : endHourVal);
        endDate.setHours(endHour24, parseInt(endMinute), 0);

        // Update form data
        setFormData(prev => ({
            ...prev,
            startTime: startDate,
            endTime: endDate
        }));
    };

    // Show notification
    const showNotification = (title, message, type = 'info') => {
        setNotification({
            isOpen: true,
            title,
            message,
            type
        });
    };

    // Close notification
    const closeNotification = () => {
        setNotification(prev => ({ ...prev, isOpen: false }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Update times from dropdowns
        updateTimeInFormData();

        // Basic form validation
        if (!formData.eventName || !formData.eventDescription || !formData.location ||
            !formData.organizerName || !formData.organizerEmail || !formData.organizerPhone ||
            !formData.departmentName) {
            showNotification('Missing Information', 'Please fill in all required fields.', 'error');
            return;
        }

        // Start time must be before end time
        if (formData.startTime >= formData.endTime) {
            showNotification('Invalid Time', 'Event end time must be after start time.', 'error');
            return;
        }

        setSubmitting(true);

        try {
            // Create a copy of the data to send
            const dataToSubmit = { ...formData };

            // Ensure parkingLotPreference is null if empty string
            if (dataToSubmit.parkingLotPreference === '') {
                dataToSubmit.parkingLotPreference = null;
            }

            console.log('Submitting event parking request', dataToSubmit);
            const result = await EventParkingService.submitEventRequest(dataToSubmit);

            if (result.success) {
                console.log('Event request submitted successfully:', result.data);

                // Navigate to confirmation page with request data instead of showing alert
                navigate('/faculty/event-parking-confirmation', {
                    state: {
                        requestData: {
                            ...dataToSubmit,
                            requestId: result.data.requestId,
                            status: result.data.status
                        }
                    }
                });
            } else {
                console.error('Failed to submit event request:', result.error);
                showNotification('Submission Failed', `Failed to submit request: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            showNotification('Error', `Error submitting request: ${error.message}`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Special Event <span className="text-red-600">Parking Request</span></h1>

            <div className="bg-white shadow-md rounded-lg p-6 mb-8">
                <p className="text-gray-700 mb-4">
                    The Office of Mobility & Parking Services coordinates parking needs for all Stony Brook special events.
                    Use this form to request parking arrangements for your upcoming event on campus.
                </p>
                <div className="bg-red-50 p-4 rounded-md border-l-4 border-red-600">
                    <p className="text-gray-800 font-medium">Important Notes:</p>
                    <ul className="list-disc ml-5 text-gray-700">
                        <li>Please submit your request at least two weeks before the event date</li>
                        <li>Larger events may require additional planning time</li>
                        <li>You will receive a confirmation email once your request is submitted</li>
                    </ul>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Event Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label htmlFor="eventName" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Name*
                            </label>
                            <input
                                type="text"
                                id="eventName"
                                name="eventName"
                                value={formData.eventName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Location/Building*
                            </label>
                            <input
                                type="text"
                                id="location"
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                placeholder="Building/Venue Name"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="eventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                            Event Description*
                        </label>
                        <textarea
                            id="eventDescription"
                            name="eventDescription"
                            value={formData.eventDescription}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                            placeholder="Please provide a brief description of the event"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="mb-4">
                            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Event Date*
                            </label>
                            <DatePicker
                                selected={formData.eventDate}
                                onChange={(date) => handleDateChange(date, 'eventDate')}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                minDate={new Date()}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Start Time*
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    value={startHour}
                                    onChange={(e) => setStartHour(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    {hours.map(hour => (
                                        <option key={`start-hour-${hour}`} value={hour}>{hour}</option>
                                    ))}
                                </select>
                                <span className="flex items-center">:</span>
                                <select
                                    value={startMinute}
                                    onChange={(e) => setStartMinute(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    {minutes.map(minute => (
                                        <option key={`start-minute-${minute}`} value={minute}>{minute}</option>
                                    ))}
                                </select>
                                <select
                                    value={startAmPm}
                                    onChange={(e) => setStartAmPm(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                                End Time*
                            </label>
                            <div className="flex space-x-2">
                                <select
                                    value={endHour}
                                    onChange={(e) => setEndHour(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    {hours.map(hour => (
                                        <option key={`end-hour-${hour}`} value={hour}>{hour}</option>
                                    ))}
                                </select>
                                <span className="flex items-center">:</span>
                                <select
                                    value={endMinute}
                                    onChange={(e) => setEndMinute(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    {minutes.map(minute => (
                                        <option key={`end-minute-${minute}`} value={minute}>{minute}</option>
                                    ))}
                                </select>
                                <select
                                    value={endAmPm}
                                    onChange={(e) => setEndAmPm(e.target.value)}
                                    className="px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Parking Needs</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label htmlFor="expectedAttendees" className="block text-sm font-medium text-gray-700 mb-1">
                                Expected Number of Attendees*
                            </label>
                            <input
                                type="number"
                                id="expectedAttendees"
                                name="expectedAttendees"
                                value={formData.expectedAttendees}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="parkingLotPreference" className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Parking Lot (Optional)
                            </label>
                            {availableLots.length > 0 ? (
                                <select
                                    id="parkingLotPreference"
                                    name="parkingLotPreference"
                                    value={formData.parkingLotPreference || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                >
                                    <option value="">No Preference</option>
                                    {availableLots.map(lot => (
                                        <option key={lot._id} value={lot._id}>
                                            {lot.name} ({lot.availableSpaces} spaces available)
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    id="parkingLotPreference"
                                    name="parkingLotPreference"
                                    value={formData.parkingLotPreference || ''}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                    placeholder="Enter preferred lot if any"
                                />
                            )}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label htmlFor="specialRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                            Special Requirements (Optional)
                        </label>
                        <textarea
                            id="specialRequirements"
                            name="specialRequirements"
                            value={formData.specialRequirements}
                            onChange={handleInputChange}
                            rows="3"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                            placeholder="Any additional parking needs or arrangements for your event"
                        />
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Contact Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label htmlFor="organizerName" className="block text-sm font-medium text-gray-700 mb-1">
                                Organizer Name*
                            </label>
                            <input
                                type="text"
                                id="organizerName"
                                name="organizerName"
                                value={formData.organizerName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="departmentName" className="block text-sm font-medium text-gray-700 mb-1">
                                Department Name*
                            </label>
                            <input
                                type="text"
                                id="departmentName"
                                name="departmentName"
                                value={formData.departmentName}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="organizerEmail" className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address*
                            </label>
                            <input
                                type="email"
                                id="organizerEmail"
                                name="organizerEmail"
                                value={formData.organizerEmail}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="organizerPhone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number*
                            </label>
                            <input
                                type="tel"
                                id="organizerPhone"
                                name="organizerPhone"
                                value={formData.organizerPhone}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600"
                                placeholder="(123) 456-7890"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-center mt-8">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-600 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            </form>

            {/* Add the notification modal at the end of the component */}
            <NotificationModal
                isOpen={notification.isOpen}
                onClose={closeNotification}
                title={notification.title}
                message={notification.message}
                type={notification.type}
            />
        </div>
    );
};

export default EventParkingRequest; 