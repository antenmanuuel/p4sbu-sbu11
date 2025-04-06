import React, { useState, useEffect } from 'react';
import { FaCheck, FaExclamationCircle } from 'react-icons/fa';

const CarForm = ({ darkMode, initialData, onSubmit, onCancel, isProcessing }) => {
    const [carData, setCarData] = useState({
        plateNumber: '',
        stateProv: 'NY',
        make: '',
        model: '',
        color: '',
        bodyType: '',
        year: new Date().getFullYear().toString(),
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

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

    const years = Array.from({ length: 31 }, (_, i) => (new Date().getFullYear() - 30 + i).toString());

    // Load initial data if provided (for editing)
    useEffect(() => {
        if (initialData) {
            setCarData({
                plateNumber: initialData.plateNumber || '',
                stateProv: initialData.stateProv || 'NY',
                make: initialData.make || '',
                model: initialData.model || '',
                color: initialData.color || '',
                bodyType: initialData.bodyType || '',
                year: initialData.year || new Date().getFullYear().toString(),
            });
        }
    }, [initialData]);

    // Update available models when make changes
    const [availableModels, setAvailableModels] = useState([]);
    useEffect(() => {
        if (carData.make) {
            setAvailableModels(modelsByMake[carData.make] || []);

            // Clear model if the current one is not valid for the new make
            if (carData.model && !modelsByMake[carData.make]?.includes(carData.model)) {
                setCarData(prev => ({ ...prev, model: '' }));
            }
        } else {
            setAvailableModels([]);
        }
    }, [carData.make]);

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
            case 'stateProv':
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
            case 'year':
                if (!value) {
                    return 'Vehicle year is required';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    // Handle field changes
    const handleFieldChange = (field, value) => {
        // Mark field as touched
        setTouched(prev => ({ ...prev, [field]: true }));

        // Update field value
        setCarData(prev => ({ ...prev, [field]: value }));

        // Validate the field
        const error = validateField(field, value);
        setErrors(prev => {
            const newErrors = { ...prev };
            if (error) {
                newErrors[field] = error;
            } else {
                delete newErrors[field]; // Remove the error if field is valid
            }
            return newErrors;
        });
    };

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = {};
        Object.keys(carData).forEach(key => {
            allTouched[key] = true;
        });
        setTouched(allTouched);

        // Validate all fields explicitly
        const newErrors = {};
        Object.entries(carData).forEach(([field, value]) => {
            const error = validateField(field, value);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            onSubmit(carData);
        } else {
            // Scroll to first error and focus it
            const firstErrorField = document.querySelector('.error-border');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
        }
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field] && carData[field];

    return (
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
                            value={carData.plateNumber}
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
                            disabled={isProcessing}
                        />
                        {isFieldValid('plateNumber') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
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
                        htmlFor="stateProv"
                        className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        State*
                    </label>
                    <div className="relative">
                        <select
                            id="stateProv"
                            value={carData.stateProv}
                            onChange={(e) => handleFieldChange('stateProv', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, stateProv: true }))}
                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                } border focus:outline-none focus:ring-2 ${errors.stateProv && touched.stateProv ? 'border-red-500 error-border' :
                                    isFieldValid('stateProv') ? 'border-green-500' : ''
                                }`}
                            aria-invalid={errors.stateProv && touched.stateProv ? "true" : "false"}
                            aria-describedby={errors.stateProv ? "stateProv-error" : undefined}
                            disabled={isProcessing}
                        >
                            <option value="">Select State</option>
                            {states.map(state => (
                                <option key={state} value={state}>{state}</option>
                            ))}
                        </select>
                        {isFieldValid('stateProv') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
                            </div>
                        )}
                        {errors.stateProv && touched.stateProv && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                <FaExclamationCircle className="text-red-500" />
                            </div>
                        )}
                    </div>
                    {errors.stateProv && touched.stateProv && (
                        <p id="stateProv-error" className="mt-1 text-sm text-red-500 flex items-center">
                            <FaExclamationCircle className="mr-1" /> {errors.stateProv}
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
                            value={carData.make}
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
                            disabled={isProcessing}
                        >
                            <option value="">Select Make</option>
                            {makes.map(make => (
                                <option key={make} value={make}>{make}</option>
                            ))}
                        </select>
                        {isFieldValid('make') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
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
                            value={carData.model}
                            onChange={(e) => handleFieldChange('model', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, model: true }))}
                            disabled={!carData.make || isProcessing}
                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                } border focus:outline-none focus:ring-2 ${errors.model && touched.model ? 'border-red-500 error-border' :
                                    isFieldValid('model') ? 'border-green-500' : ''
                                } ${!carData.make ? 'opacity-60 cursor-not-allowed' : ''}`}
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
                                <FaCheck className="text-green-500" />
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
                    {!carData.make && touched.model && (
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
                            value={carData.color}
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
                            disabled={isProcessing}
                        >
                            <option value="">Select Color</option>
                            {colors.map(color => (
                                <option key={color} value={color}>{color}</option>
                            ))}
                        </select>
                        {isFieldValid('color') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
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
                            value={carData.bodyType}
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
                            disabled={isProcessing}
                        >
                            <option value="">Select Body Type</option>
                            {bodyTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {isFieldValid('bodyType') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
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

                {/* Year */}
                <div>
                    <label
                        htmlFor="year"
                        className={`block mb-2 font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        Year*
                    </label>
                    <div className="relative">
                        <select
                            id="year"
                            value={carData.year}
                            onChange={(e) => handleFieldChange('year', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, year: true }))}
                            className={`w-full p-3 rounded-md text-base shadow-sm ${darkMode
                                ? 'bg-gray-700 text-white border-gray-600 focus:ring-red-600'
                                : 'bg-gray-50 text-gray-900 border-gray-300 focus:ring-red-500'
                                } border focus:outline-none focus:ring-2 ${errors.year && touched.year ? 'border-red-500 error-border' :
                                    isFieldValid('year') ? 'border-green-500' : ''
                                }`}
                            aria-invalid={errors.year && touched.year ? "true" : "false"}
                            aria-describedby={errors.year ? "year-error" : undefined}
                            disabled={isProcessing}
                        >
                            <option value="">Select Year</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        {isFieldValid('year') && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <FaCheck className="text-green-500" />
                            </div>
                        )}
                        {errors.year && touched.year && (
                            <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                <FaExclamationCircle className="text-red-500" />
                            </div>
                        )}
                    </div>
                    {errors.year && touched.year && (
                        <p id="year-error" className="mt-1 text-sm text-red-500 flex items-center">
                            <FaExclamationCircle className="mr-1" /> {errors.year}
                        </p>
                    )}
                </div>
            </div>

            {/* Form validation summary */}
            {Object.entries(errors).filter(([key]) => touched[key]).length > 0 && (
                <div className={`p-3 rounded-md ${darkMode ? 'bg-red-900/50' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                    <div className="flex">
                        <FaExclamationCircle className={`flex-shrink-0 h-5 w-5 text-red-500 mt-0.5`} />
                        <div className="ml-3 w-full">
                            <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                                Please correct the following errors:
                            </h3>
                            <div className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                                <ul className="list-disc pl-5 space-y-1">
                                    {Object.entries(errors)
                                        .filter(([key, error]) => touched[key] && error)
                                        .map(([key, error]) => (
                                            <li key={key}>{error}</li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
                <button
                    type="button"
                    onClick={onCancel}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                    disabled={isProcessing}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center justify-center ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
                    disabled={isProcessing}
                >
                    {isProcessing ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                            Processing...
                        </>
                    ) : (
                        `${initialData ? 'Save Changes' : 'Add Vehicle'}`
                    )}
                </button>
            </div>
        </form>
    );
};

export default CarForm; 