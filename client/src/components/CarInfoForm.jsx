// TP: this .jsx file's code was manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's optimized/modified version of the student changes/written code was added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 

import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCar, FaExclamationCircle, FaCheckCircle, FaTicketAlt } from 'react-icons/fa';
import PropTypes from 'prop-types';
import { CarService } from '../utils/api';

const CarInfoForm = ({ darkMode, lotName, permitType, onBackClick, onContinue, isAuthenticated }) => {
    const [vehicleInfo, setVehicleInfo] = useState({
        plateNumber: '',
        state: 'New York',
        make: '',
        model: '',
        color: '',
        bodyType: '',
        year: new Date().getFullYear().toString()
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);
    const [saveCarInfo, setSaveCarInfo] = useState(true);
    // Changes below made on/before 4/6/2025, please refer to top of file for appropriate credit
    // State for user's saved cars
    const [userCars, setUserCars] = useState([]);
    const [loadingCars, setLoadingCars] = useState(false);
    const [showSavedCars, setShowSavedCars] = useState(true);
    const [selectedSavedCarId, setSelectedSavedCarId] = useState(null);
    const [carsError, setCarsError] = useState(null);

    // Add useEffect to check for saved car info when component mounts
    useEffect(() => {
        // Set initial errors
        validateForm();
    }, [vehicleInfo]);

    // Fetch user cars from backend if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            fetchUserCars();
        }
    }, [isAuthenticated]);

    // Function to fetch user cars from backend
    const fetchUserCars = async () => {
        try {
            if (isAuthenticated) {
                setLoadingCars(true);
                setCarsError(null);

                // Fetch cars from backend
                const response = await CarService.getUserCars();

                if (response.success && response.cars && response.cars.length > 0) {
                    setUserCars(response.cars);
                    setShowSavedCars(true);

                    // Select the first car by default instead of the primary car
                    const defaultCar = response.cars[0];
                    setSelectedSavedCarId(defaultCar._id);

                    // Pre-fill form with car data
                    const carInfo = {
                        plateNumber: defaultCar.plateNumber || '',
                        state: defaultCar.stateProv || 'New York',
                        make: defaultCar.make || '',
                        model: defaultCar.model || '',
                        color: defaultCar.color || '',
                        bodyType: defaultCar.bodyType || '',
                        year: defaultCar.year || new Date().getFullYear().toString()
                    };

                    setVehicleInfo(carInfo);

                    // Mark all fields as touched to show validation state
                    const allTouched = {};
                    Object.keys(carInfo).forEach(key => {
                        allTouched[key] = true;
                    });
                    setTouched(allTouched);
                } else {
                    setUserCars([]);
                    setShowSavedCars(false);
                }
            }
        } catch (error) {
            console.error('Error fetching user cars:', error);
            setCarsError('Failed to load your saved vehicles. Please try again.');
            setUserCars([]);
            setShowSavedCars(false);
        } finally {
            setLoadingCars(false);
        }
    };

    // Handle selecting a saved car
    const handleSelectSavedCar = (car) => {
        setSelectedSavedCarId(car._id);

        // Update the vehicle info fields with the selected car's data
        setVehicleInfo({
            make: car.make,
            model: car.model,
            plateNumber: car.plateNumber,
            state: car.stateProv,
            color: car.color,
            bodyType: car.bodyType,
            year: car.year || new Date().getFullYear().toString(),
            carId: car._id  // Include the car ID for backend reference
        });

        // Mark all fields as touched to validate them
        setTouched({
            make: true,
            model: true,
            plateNumber: true,
            state: true,
            color: true,
            bodyType: true
        });
    };

    // Sample data
    const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    const makes = ['Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Hyundai', 'Kia'];

    const modelsByMake = {
        'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Prius'],
        'Honda': ['Civic', 'Accord', 'CR-V', 'Pilot', 'Odyssey', 'Fit'],
        'Ford': ['F-150', 'Escape', 'Explorer', 'Mustang', 'Edge', 'Focus'],
        'Chevrolet': ['Silverado', 'Equinox', 'Malibu', 'Tahoe', 'Suburban', 'Traverse'],
        'Nissan': ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Murano', 'Frontier'],
        'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series', 'X1'],
        'Mercedes': ['C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class', 'A-Class'],
        'Audi': ['A4', 'Q5', 'A6', 'Q7', 'A3', 'Q3'],
        'Volkswagen': ['Jetta', 'Tiguan', 'Passat', 'Atlas', 'Golf', 'Taos'],
        'Hyundai': ['Elantra', 'Tucson', 'Santa Fe', 'Sonata', 'Kona', 'Palisade'],
        'Kia': ['Forte', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'Seltos']
    };

    const colors = ['Black', 'White', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 'Brown', 'Orange'];

    const bodyTypes = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Hatchback', 'Van', 'Convertible', 'Wagon'];

    // Update available models when make changes
    useEffect(() => {
        if (vehicleInfo.make) {
            setAvailableModels(modelsByMake[vehicleInfo.make] || []);

            // Clear model if the current one is not valid for the new make
            if (vehicleInfo.model && !modelsByMake[vehicleInfo.make]?.includes(vehicleInfo.model)) {
                setVehicleInfo(prev => ({ ...prev, model: '' }));
            }
        } else {
            setAvailableModels([]);
        }
    }, [vehicleInfo.make]);

    // Validate a single field
    const validateField = (name, value) => {
        switch (name) {
            case 'plateNumber':
                if (!value.trim()) {
                    return 'License plate number is required';
                }
                if (value.trim().length < 3 || value.trim().length > 10) {
                    return 'License plate number must be between 3-10 characters';
                }
                break;
            case 'state':
                if (!value) {
                    return 'State is required';
                }
                break;
            case 'make':
                if (!value) {
                    return 'Vehicle make is required';
                }
                break;
            case 'model':
                if (!value) {
                    return 'Vehicle model is required';
                }
                break;
            case 'color':
                if (!value) {
                    return 'Vehicle color is required';
                }
                break;
            case 'bodyType':
                if (!value) {
                    return 'Vehicle body type is required';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        // Validate each field
        Object.keys(vehicleInfo).forEach(field => {
            const error = validateField(field, vehicleInfo[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleFieldChange = (field, value) => {
        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));

        // Update field value
        setVehicleInfo(prev => ({ ...prev, [field]: value }));

        // If the form was submitted once, validate the field immediately
        if (formSubmitted) {
            setErrors(prev => ({
                ...prev,
                [field]: validateField(field, value)
            }));
        }

        // If user changes a field manually, clear the selected saved car
        if (selectedSavedCarId) {
            setSelectedSavedCarId(null);
        }
    };

    // Effect to validate touched fields
    useEffect(() => {
        if (Object.keys(touched).length > 0) {
            const fieldsToValidate = Object.keys(touched).filter(field => touched[field]);

            const newErrors = { ...errors };
            fieldsToValidate.forEach(field => {
                const error = validateField(field, vehicleInfo[field]);
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
            });

            setErrors(newErrors);
        }
    }, [vehicleInfo, touched]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Set all fields as touched
        const allTouched = {};
        Object.keys(vehicleInfo).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);

        if (!validateForm()) {
            // Scroll to first error and focus it
            const firstErrorField = document.querySelector('.error-border');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
            return;
        }

        // If saveCarInfo is checked and no car is selected, save car information
        if (saveCarInfo && !selectedSavedCarId) {
            try {
                if (isAuthenticated) {
                    // If logged in, save to backend
                    const carData = {
                        plateNumber: vehicleInfo.plateNumber,
                        stateProv: vehicleInfo.state,
                        make: vehicleInfo.make,
                        model: vehicleInfo.model,
                        color: vehicleInfo.color,
                        bodyType: vehicleInfo.bodyType,
                        year: vehicleInfo.year
                    };

                    await CarService.saveCar(carData);
                } else {
                    // If not logged in, save to localStorage
                    localStorage.setItem('userCarInfo', JSON.stringify(vehicleInfo));
                }
            } catch (error) {
                console.error('Error saving car info:', error);
            }
        }

        // If a saved car is selected, pass the car ID instead of the car details
        if (selectedSavedCarId && isAuthenticated) {
            onContinue({ carId: selectedSavedCarId });
        } else {
            onContinue(vehicleInfo);
        }
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field] && vehicleInfo[field];

    return (
        <div className="w-full animate-fadeIn">
            {/* Header with back button */}
            <div className="flex items-center mb-6">
                <button
                    onClick={onBackClick}
                    className="text-red-600 hover:text-red-800 mr-4 flex items-center p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                    <FaArrowLeft className="text-lg" />
                </button>
                <h1 className={`text-xl md:text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Vehicle Information
                </h1>
            </div>

            {/* Reservation summary */}
            <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reserving spot at:</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{lotName}</p>

                {permitType && (
                    <div className="mt-2 flex items-center">
                        <FaTicketAlt className={`mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Permit Type: <span className="font-semibold">{permitType}</span>
                        </p>
                    </div>
                )}
            </div>

            {/* Section for Saved Cars (when authenticated) */}
            {isAuthenticated && (
                <div className="mb-8">
                    {loadingCars ? (
                        <div className="flex justify-center items-center py-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                        </div>
                    ) : carsError ? (
                        <div className={`p-4 rounded-md ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'} mb-4`}>
                            <p className="flex items-center">
                                <FaExclamationCircle className="mr-2 flex-shrink-0" />
                                {carsError}
                            </p>
                        </div>
                    ) : userCars.length > 0 ? (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Your Saved Vehicles
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowSavedCars(false)}
                                    className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                >
                                    Use a different vehicle
                                </button>
                            </div>

                            {showSavedCars ? (
                                <div className="space-y-4">
                                    {userCars.map((car) => (
                                        <div
                                            key={car._id}
                                            onClick={() => handleSelectSavedCar(car)}
                                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedSavedCarId === car._id
                                                ? darkMode
                                                    ? 'bg-gray-700 border-red-500'
                                                    : 'bg-red-50 border-red-500'
                                                : darkMode
                                                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-700'
                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div className="flex justify-between">
                                                <div className="flex items-start">
                                                    <FaCar className={`mt-1 mr-2 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                                    <div>
                                                        <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                            {car.make} {car.model} ({car.year || 'Unknown'})
                                                        </h3>
                                                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                                            {car.color} {car.bodyType}
                                                        </p>
                                                        <p className={`mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                            {car.plateNumber} • {car.stateProv}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setShowSavedCars(true)}
                                    className={`mb-6 flex items-center text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                                >
                                    <FaCar className="mr-1" /> Select from saved vehicles
                                </button>
                            )}
                        </>
                    ) : null}
                </div>
            )}

            {/* Only show the vehicle form if not using a saved car */}
            {(!isAuthenticated || !showSavedCars || userCars.length === 0) && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* License Plate */}
                        <div>
                            <label
                                htmlFor="plateNumber"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                License Plate Number*
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="plateNumber"
                                    value={vehicleInfo.plateNumber}
                                    onChange={(e) => handleFieldChange('plateNumber', e.target.value.toUpperCase())}
                                    onBlur={() => setTouched(prev => ({ ...prev, plateNumber: true }))}
                                    className={`w-full p-3 rounded-md text-base shadow-sm uppercase ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.plateNumber && touched.plateNumber ? 'border-red-500 error-border' :
                                            isFieldValid('plateNumber') ? 'border-green-500' : ''
                                        }`}
                                    placeholder="ABC123"
                                    aria-invalid={errors.plateNumber && touched.plateNumber ? "true" : "false"}
                                    aria-describedby={errors.plateNumber ? "plateNumber-error" : undefined}
                                />
                                {isFieldValid('plateNumber') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.plateNumber && touched.plateNumber && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.plateNumber && touched.plateNumber && (
                                <p id="plateNumber-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.plateNumber}
                                </p>
                            )}
                        </div>

                        {/* State */}
                        <div>
                            <label
                                htmlFor="state"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                State*
                            </label>
                            <div className="relative">
                                <select
                                    id="state"
                                    value={vehicleInfo.state}
                                    onChange={(e) => handleFieldChange('state', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, state: true }))}
                                    className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.state && touched.state ? 'border-red-500 error-border' :
                                            isFieldValid('state') ? 'border-green-500' : ''
                                        }`}
                                    aria-invalid={errors.state && touched.state ? "true" : "false"}
                                    aria-describedby={errors.state ? "state-error" : undefined}
                                >
                                    <option value="">Select State</option>
                                    {states.map(state => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                                {isFieldValid('state') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.state && touched.state && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.state && touched.state && (
                                <p id="state-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.state}
                                </p>
                            )}
                        </div>

                        {/* Make */}
                        <div>
                            <label
                                htmlFor="make"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Make*
                            </label>
                            <div className="relative">
                                <select
                                    id="make"
                                    value={vehicleInfo.make}
                                    onChange={(e) => handleFieldChange('make', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, make: true }))}
                                    className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.make && touched.make ? 'border-red-500 error-border' :
                                            isFieldValid('make') ? 'border-green-500' : ''
                                        }`}
                                    aria-invalid={errors.make && touched.make ? "true" : "false"}
                                    aria-describedby={errors.make ? "make-error" : undefined}
                                >
                                    <option value="">Select Make</option>
                                    {makes.map(make => (
                                        <option key={make} value={make}>{make}</option>
                                    ))}
                                </select>
                                {isFieldValid('make') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.make && touched.make && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.make && touched.make && (
                                <p id="make-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.make}
                                </p>
                            )}
                        </div>

                        {/* Model */}
                        <div>
                            <label
                                htmlFor="model"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Model*
                            </label>
                            <div className="relative">
                                <select
                                    id="model"
                                    value={vehicleInfo.model}
                                    onChange={(e) => handleFieldChange('model', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, model: true }))}
                                    disabled={!vehicleInfo.make}
                                    className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.model && touched.model ? 'border-red-500 error-border' :
                                            isFieldValid('model') ? 'border-green-500' : ''
                                        } ${!vehicleInfo.make ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    aria-invalid={errors.model && touched.model ? "true" : "false"}
                                    aria-describedby={errors.model ? "model-error" : undefined}
                                >
                                    <option value="">Select Model</option>
                                    {availableModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                                {isFieldValid('model') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.model && touched.model && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.model && touched.model && (
                                <p id="model-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.model}
                                </p>
                            )}
                            {!vehicleInfo.make && touched.model && (
                                <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Please select a make first
                                </p>
                            )}
                        </div>

                        {/* Color */}
                        <div>
                            <label
                                htmlFor="color"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Color*
                            </label>
                            <div className="relative">
                                <select
                                    id="color"
                                    value={vehicleInfo.color}
                                    onChange={(e) => handleFieldChange('color', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, color: true }))}
                                    className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.color && touched.color ? 'border-red-500 error-border' :
                                            isFieldValid('color') ? 'border-green-500' : ''
                                        }`}
                                    aria-invalid={errors.color && touched.color ? "true" : "false"}
                                    aria-describedby={errors.color ? "color-error" : undefined}
                                >
                                    <option value="">Select Color</option>
                                    {colors.map(color => (
                                        <option key={color} value={color}>{color}</option>
                                    ))}
                                </select>
                                {isFieldValid('color') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.color && touched.color && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.color && touched.color && (
                                <p id="color-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.color}
                                </p>
                            )}
                        </div>

                        {/* Body Type */}
                        <div>
                            <label
                                htmlFor="bodyType"
                                className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            >
                                Body Type*
                            </label>
                            <div className="relative">
                                <select
                                    id="bodyType"
                                    value={vehicleInfo.bodyType}
                                    onChange={(e) => handleFieldChange('bodyType', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, bodyType: true }))}
                                    className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                        ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                        : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                        } border focus:outline-none focus:ring-2 ${errors.bodyType && touched.bodyType ? 'border-red-500 error-border' :
                                            isFieldValid('bodyType') ? 'border-green-500' : ''
                                        }`}
                                    aria-invalid={errors.bodyType && touched.bodyType ? "true" : "false"}
                                    aria-describedby={errors.bodyType ? "bodyType-error" : undefined}
                                >
                                    <option value="">Select Body Type</option>
                                    {bodyTypes.map(type => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </select>
                                {isFieldValid('bodyType') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.bodyType && touched.bodyType && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.bodyType && touched.bodyType && (
                                <p id="bodyType-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.bodyType}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Form validation summary */}
                    {formSubmitted && Object.keys(errors).length > 0 && (
                        <div className={`p-3 rounded-md ${darkMode ? 'bg-red-900/50' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                            <div className="flex">
                                <FaExclamationCircle className={`flex-shrink-0 h-5 w-5 text-red-500 mt-0.5`} />
                                <div className="ml-3">
                                    <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                                        Please correct the following errors:
                                    </h3>
                                    <div className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                                        <ul className="list-disc pl-5 space-y-1">
                                            {Object.keys(errors).map(key => (
                                                <li key={key}>{errors[key]}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Changes below made on/before 4/6/2025, please refer to top of file for appropriate credit */} 
                    <div className="flex items-center mb-4">
                        <input
                            id="saveCarInfo"
                            type="checkbox"
                            checked={saveCarInfo}
                            onChange={(e) => setSaveCarInfo(e.target.checked)}
                            className={`w-4 h-4 rounded mr-2 text-red-600 focus:ring-red-500 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}
                        />
                        <label
                            htmlFor="saveCarInfo"
                            className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                            Save this vehicle for future reservations
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors shadow-md"
                    >
                        Continue to Payment
                    </button>
                </form>
            )}

            {/* Changes below made on/before 4/6/2025, please refer to top of file for appropriate credit */}
            {isAuthenticated && showSavedCars && userCars.length > 0 && (
                <div className="flex justify-end space-x-4 mt-6">
                    <button
                        type="button"
                        onClick={onBackClick}
                        className={`px-4 py-2 rounded-lg shadow-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    >
                        Back
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            const selectedCar = userCars.find(car => car._id === selectedSavedCarId);
                            if (selectedCar) {
                                onContinue({
                                    make: selectedCar.make,
                                    model: selectedCar.model,
                                    plateNumber: selectedCar.plateNumber,
                                    stateProv: selectedCar.stateProv,
                                    color: selectedCar.color,
                                    bodyType: selectedCar.bodyType,
                                    year: selectedCar.year,
                                    carId: selectedCar._id
                                });
                            }
                        }}
                        disabled={!selectedSavedCarId}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md"
                    >
                        Continue
                    </button>
                </div>
            )}
        </div>
    );
};

export default CarInfoForm;

// Add PropTypes
CarInfoForm.propTypes = {
    darkMode: PropTypes.bool,
    lotName: PropTypes.string,
    permitType: PropTypes.string,
    onBackClick: PropTypes.func.isRequired,
    onContinue: PropTypes.func.isRequired,
    isAuthenticated: PropTypes.bool
};

// Add defaultProps
CarInfoForm.defaultProps = {
    darkMode: false,
    lotName: '',
    permitType: '',
    isAuthenticated: false
}; 