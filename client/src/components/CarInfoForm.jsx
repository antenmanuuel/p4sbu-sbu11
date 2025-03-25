import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaCar, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const CarInfoForm = ({ darkMode, lotName, onBackClick, onContinue }) => {
    const [vehicleInfo, setVehicleInfo] = useState({
        plateNumber: '',
        state: 'New York',
        make: '',
        model: '',
        color: '',
        bodyType: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [availableModels, setAvailableModels] = useState([]);

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

    const handleSubmit = (e) => {
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

        onContinue(vehicleInfo);
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
            </div>

            {/* Form */}
            <div className={`p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex items-center mb-5">
                    <FaCar className={`mr-3 text-xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                    <h2 className={`font-semibold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Enter your vehicle details
                    </h2>
                </div>

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

                    <button
                        type="submit"
                        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors shadow-md"
                    >
                        Continue to Payment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CarInfoForm; 