import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const Register = ({ darkMode }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        sbuId: '',
        userType: 'student' // Default value
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [registerError, setRegisterError] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    // Validate a single field
    const validateField = (name, value) => {
        switch (name) {
            case 'firstName':
                if (!value.trim()) {
                    return 'First name is required';
                }
                break;
            case 'lastName':
                if (!value.trim()) {
                    return 'Last name is required';
                }
                break;
            case 'email':
                if (!value) {
                    return 'Email is required';
                } else if (!/\S+@\S+\.\S+/.test(value)) {
                    return 'Email is invalid';
                }
                break;
            case 'password':
                if (!value) {
                    return 'Password is required';
                } else if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    return 'Please confirm your password';
                } else if (value !== formData.password) {
                    return 'Passwords do not match';
                }
                break;
            case 'sbuId':
                if (!value) {
                    return 'SBU ID is required';
                } else if (!/^\d{8}$/.test(value)) {
                    return 'SBU ID must be 8 digits';
                }
                break;
            case 'userType':
                if (!value) {
                    return 'User type is required';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    // Handle field change with validation
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));

        // Update form data
        setFormData({
            ...formData,
            [name]: value
        });

        // If form was already submitted once, validate the field immediately
        if (formSubmitted) {
            setErrors(prev => ({
                ...prev,
                [name]: validateField(name, value)
            }));
        }
    };

    // Effect to validate touched fields
    useEffect(() => {
        if (Object.keys(touched).length > 0) {
            const fieldsToValidate = Object.keys(touched).filter(field => touched[field]);

            const newErrors = { ...errors };
            fieldsToValidate.forEach(field => {
                const error = validateField(field, formData[field]);
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
            });

            setErrors(newErrors);
        }
    }, [formData, touched]);

    const validateForm = () => {
        const newErrors = {};

        // Validate each field
        Object.keys(formData).forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Set all fields as touched
        const allTouched = {};
        Object.keys(formData).forEach(field => {
            allTouched[field] = true;
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

        setIsLoading(true);
        setRegisterError('');
        setSuccess(false);

        try {
            // Simulate registration request
            // In a real app, you would call an API here
            setTimeout(() => {
                setIsLoading(false);
                setSuccess(true);

                // Navigate to login after successful registration with a small delay
                setTimeout(() => {
                    navigate('/login');
                }, 1500);
            }, 1000);
        } catch {
            setRegisterError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field];

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
            <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div>
                    <div className="flex justify-center">
                        <div className="size-16 bg-red-600 rounded-md flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            P
                        </div>
                    </div>
                    <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Create a new account
                    </h2>
                    <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Or{' '}
                        <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
                            sign in to your account
                        </Link>
                    </p>
                </div>

                {registerError && (
                    <div className={`p-3 rounded-md flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-800'}`}>
                        <FaExclamationCircle className="mr-2 flex-shrink-0" />
                        <span>{registerError}</span>
                    </div>
                )}

                {success && (
                    <div className={`p-3 rounded-md flex items-center ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-50 text-green-800'}`}>
                        <FaCheckCircle className="mr-2 flex-shrink-0 text-green-500" />
                        <span>Registration successful! Redirecting to login...</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="firstName" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    First Name
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaUser />
                                    </div>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        autoComplete="given-name"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                            ${errors.firstName && touched.firstName
                                                ? 'border-red-500 error-border'
                                                : isFieldValid('firstName')
                                                    ? 'border-green-500'
                                                    : darkMode ? 'border-gray-700' : 'border-gray-300'
                                            } 
                                            placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-700 text-white placeholder-gray-400'
                                                : 'text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.firstName && touched.firstName ? "true" : "false"}
                                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                                    />
                                    {isFieldValid('firstName') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className="text-green-500" />
                                        </div>
                                    )}
                                    {errors.firstName && touched.firstName && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className="text-red-500" />
                                        </div>
                                    )}
                                </div>
                                {errors.firstName && touched.firstName && (
                                    <p id="firstName-error" className="mt-1 text-sm text-red-500 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.firstName}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="lastName" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Last Name
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaUser />
                                    </div>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                                        className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                            ${errors.lastName && touched.lastName
                                                ? 'border-red-500 error-border'
                                                : isFieldValid('lastName')
                                                    ? 'border-green-500'
                                                    : darkMode ? 'border-gray-700' : 'border-gray-300'
                                            }
                                            placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-700 text-white placeholder-gray-400'
                                                : 'text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.lastName && touched.lastName ? "true" : "false"}
                                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                                    />
                                    {isFieldValid('lastName') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className="text-green-500" />
                                        </div>
                                    )}
                                    {errors.lastName && touched.lastName && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className="text-red-500" />
                                        </div>
                                    )}
                                </div>
                                {errors.lastName && touched.lastName && (
                                    <p id="lastName-error" className="mt-1 text-sm text-red-500 flex items-center">
                                        <FaExclamationCircle className="mr-1" /> {errors.lastName}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Email Address
                            </label>
                            <div className="relative mt-1">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaEnvelope />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                    className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                        ${errors.email && touched.email
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('email')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        }
                                        placeholder-gray-500 
                                        ${darkMode
                                            ? 'bg-gray-700 text-white placeholder-gray-400'
                                            : 'text-gray-900'
                                        } 
                                        focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="you@example.com"
                                    aria-invalid={errors.email && touched.email ? "true" : "false"}
                                    aria-describedby={errors.email ? "email-error" : undefined}
                                />
                                {isFieldValid('email') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.email && touched.email && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.email && touched.email && (
                                <p id="email-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Password
                            </label>
                            <div className="relative mt-1">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaLock />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                    className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                        ${errors.password && touched.password
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('password')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        }
                                        placeholder-gray-500 
                                        ${darkMode
                                            ? 'bg-gray-700 text-white placeholder-gray-400'
                                            : 'text-gray-900'
                                        } 
                                        focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="••••••"
                                    aria-invalid={errors.password && touched.password ? "true" : "false"}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                />
                                {isFieldValid('password') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.password && touched.password && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.password && touched.password && (
                                <p id="password-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Confirm Password
                            </label>
                            <div className="relative mt-1">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaLock />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                                    className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                        ${errors.confirmPassword && touched.confirmPassword
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('confirmPassword')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        }
                                        placeholder-gray-500 
                                        ${darkMode
                                            ? 'bg-gray-700 text-white placeholder-gray-400'
                                            : 'text-gray-900'
                                        } 
                                        focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="••••••"
                                    aria-invalid={errors.confirmPassword && touched.confirmPassword ? "true" : "false"}
                                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                                />
                                {isFieldValid('confirmPassword') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.confirmPassword && touched.confirmPassword && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.confirmPassword && touched.confirmPassword && (
                                <p id="confirmPassword-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.confirmPassword}
                                </p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="sbuId" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                SBU ID
                            </label>
                            <div className="relative mt-1">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaIdCard />
                                </div>
                                <input
                                    id="sbuId"
                                    name="sbuId"
                                    type="text"
                                    value={formData.sbuId}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, sbuId: true }))}
                                    className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                        ${errors.sbuId && touched.sbuId
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('sbuId')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        }
                                        placeholder-gray-500 
                                        ${darkMode
                                            ? 'bg-gray-700 text-white placeholder-gray-400'
                                            : 'text-gray-900'
                                        } 
                                        focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="12345678"
                                    maxLength="8"
                                    aria-invalid={errors.sbuId && touched.sbuId ? "true" : "false"}
                                    aria-describedby={errors.sbuId ? "sbuId-error" : undefined}
                                />
                                {isFieldValid('sbuId') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.sbuId && touched.sbuId && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.sbuId && touched.sbuId && (
                                <p id="sbuId-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.sbuId}
                                </p>
                            )}
                            <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Your 8-digit Stony Brook University ID number
                            </p>
                        </div>

                        <div>
                            <label htmlFor="userType" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                User Type
                            </label>
                            <div className="relative mt-1">
                                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <FaUserTag />
                                </div>
                                <select
                                    id="userType"
                                    name="userType"
                                    value={formData.userType}
                                    onChange={handleChange}
                                    onBlur={() => setTouched(prev => ({ ...prev, userType: true }))}
                                    className={`pl-10 appearance-none rounded-md relative block w-full px-3 py-2 border
                                        ${errors.userType && touched.userType
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('userType')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        }
                                        ${darkMode
                                            ? 'bg-gray-700 text-white'
                                            : 'text-gray-900'
                                        } 
                                        focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    aria-invalid={errors.userType && touched.userType ? "true" : "false"}
                                    aria-describedby={errors.userType ? "userType-error" : undefined}
                                >
                                    <option value="student">Student</option>
                                    <option value="faculty">Faculty</option>
                                    <option value="staff">Staff</option>
                                    <option value="visitor">Visitor</option>
                                </select>
                                {isFieldValid('userType') && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <FaCheckCircle className="text-green-500" />
                                    </div>
                                )}
                                {errors.userType && touched.userType && (
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-10 pointer-events-none">
                                        <FaExclamationCircle className="text-red-500" />
                                    </div>
                                )}
                            </div>
                            {errors.userType && touched.userType && (
                                <p id="userType-error" className="mt-1 text-sm text-red-500 flex items-center">
                                    <FaExclamationCircle className="mr-1" /> {errors.userType}
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

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent rounded-md font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating Account...
                                </>
                            ) : 'Create Account'}
                        </button>
                    </div>

                    <div className="text-center">
                        <Link
                            to="/"
                            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${darkMode
                                ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            Back to Home
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;