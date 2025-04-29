/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaUserTag, FaCheckCircle, FaExclamationCircle, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { AuthService } from '../utils/api';

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
    const validateField = (name, value, allValues) => {
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
                } else if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    return 'Please confirm your password';
                } else if (value !== allValues.password) {
                    return 'Passwords do not match';
                } else if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                }
                break;
            case 'sbuId':
                // Skip SBU ID validation for visitors
                if (allValues.userType === 'visitor') {
                    return '';
                }
                if (!value) {
                    return 'SBU ID is required';
                } else if (!/^\d{9}$/.test(value)) {
                    return 'SBU ID must be 9 digits';
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
                [name]: validateField(name, value, formData)
            }));
        }
    };

    // Effect to validate touched fields
    useEffect(() => {
        if (Object.keys(touched).length > 0) {
            const fieldsToValidate = Object.keys(touched).filter(field => touched[field]);

            const newErrors = { ...errors };
            fieldsToValidate.forEach(field => {
                const error = validateField(field, formData[field], formData);
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
            const error = validateField(field, formData[field], formData);
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
            // Call the API to register the user
            const { firstName, lastName, email, password, sbuId, userType } = formData;

            // Prepare user data for registration - make sbuId optional for visitors
            const userData = {
                firstName,
                lastName,
                email,
                password,
                userType
            };

            // Only include sbuId if not a visitor or if provided anyway
            if (userType !== 'visitor' || sbuId.trim() !== '') {
                userData.sbuId = sbuId;
            }

            const result = await AuthService.register(userData);

            setIsLoading(false);

            if (result.success) {
                setSuccess(true);
                setRegisterError('');

                // Navigate to login after successful registration with a small delay
                setTimeout(() => {
                    navigate('/login', {
                        state: {
                            message: 'Registration successful! Your account is pending approval from an administrator.'
                        }
                    });
                }, 1500);
            } else {
                setRegisterError(result.error);
                setSuccess(false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            setRegisterError('An unexpected error occurred. Please try again.');
            setIsLoading(false);
            setSuccess(false);
        }
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field];

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            {/* Hero Section */}
            <div className="relative mb-10">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-2xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

                <div className="text-center relative z-10">
                    <div className="inline-block mb-4">
                        <span className={`inline-flex items-center justify-center p-3 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'} rounded-xl`}>
                            <FaUserTag className="w-8 h-8" />
                        </span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Create <span className="text-red-600">P4SBU</span> Account
                    </h1>
                    <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Register for Stony Brook University parking management
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 mb-16">
                {/* Left Column - Info */}
                <div className="lg:w-1/3">
                    <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="relative h-48 bg-gradient-to-r from-red-600 to-red-400">
                            <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                                <h2 className="text-2xl font-bold mb-2">Join Our Community</h2>
                                <p className="text-lg opacity-90">Easy access to campus parking</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Registration Process
                                    </h3>
                                    <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">1</span>
                                            Create your account with a valid @stonybrook.edu email
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">2</span>
                                            Wait for administrator approval (usually within 24 hours)
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">3</span>
                                            Log in and start using P4SBU services
                                        </li>
                                    </ul>
                                </div>

                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <h4 className={`font-medium mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <FaShieldAlt className="mr-2 text-green-500" />
                                        Important Information
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Stony Brook University affiliated individuals (students and faculty) require an <strong>@stonybrook.edu</strong> email address and SBU ID. Visitors can register with any email address.
                                    </p>
                                </div>

                                <div>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Already have an account?{' '}
                                        <Link to="/login" className={`font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                                            Sign in
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back to home button */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/"
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${darkMode
                                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}
                        >
                            <FaArrowLeft className="mr-2" />
                            Back to Home
                        </Link>
                    </div>
                </div>

                {/* Right Column - Registration Form */}
                <div className="lg:w-2/3">
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Register for an Account
                            </h2>

                            {/* Success message */}
                            {success && (
                                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'} flex items-center`}>
                                    <FaCheckCircle className="flex-shrink-0 mr-3" />
                                    <span>Registration successful! Redirecting to login page...</span>
                                </div>
                            )}

                            {/* Error message */}
                            {registerError && (
                                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'} flex items-center`}>
                                    <FaExclamationCircle className="flex-shrink-0 mr-3" />
                                    <span>{registerError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Name Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="firstName" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            First Name*
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <FaUser className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="firstName"
                                                name="firstName"
                                                type="text"
                                                autoComplete="given-name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                                                className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                                ${errors.firstName && touched.firstName ? 'border-red-500 error-border' : isFieldValid('firstName') ? 'border-green-500' : 'border'} 
                                                focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                                placeholder="John"
                                            />
                                            {isFieldValid('firstName') && (
                                                <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                            )}
                                        </div>
                                        {errors.firstName && touched.firstName && (
                                            <p className="mt-1 text-sm text-red-500 flex items-center">
                                                <FaExclamationCircle className="mr-1" /> {errors.firstName}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="lastName" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Last Name*
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <FaUser className="w-5 h-5" />
                                            </div>
                                            <input
                                                id="lastName"
                                                name="lastName"
                                                type="text"
                                                autoComplete="family-name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                                                className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                                ${errors.lastName && touched.lastName ? 'border-red-500 error-border' : isFieldValid('lastName') ? 'border-green-500' : 'border'} 
                                                focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                                placeholder="Doe"
                                            />
                                            {isFieldValid('lastName') && (
                                                <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                            )}
                                        </div>
                                        {errors.lastName && touched.lastName && (
                                            <p className="mt-1 text-sm text-red-500 flex items-center">
                                                <FaExclamationCircle className="mr-1" /> {errors.lastName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Email */}
                                <div>
                                    <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Email Address*
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaEnvelope className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.email && touched.email ? 'border-red-500 error-border' : isFieldValid('email') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                            placeholder="your.name@stonybrook.edu"
                                        />
                                        {isFieldValid('email') && (
                                            <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.email && touched.email && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.email}
                                        </p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Password*
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaLock className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.password && touched.password ? 'border-red-500 error-border' : isFieldValid('password') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                            placeholder="••••••••"
                                        />
                                        {isFieldValid('password') && (
                                            <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.password && touched.password && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.password}
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Confirm Password*
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaLock className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            autoComplete="new-password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500 error-border' : isFieldValid('confirmPassword') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                            placeholder="••••••••"
                                        />
                                        {isFieldValid('confirmPassword') && (
                                            <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.confirmPassword && touched.confirmPassword && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="userType" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        User Type*
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaUserTag className="w-5 h-5" />
                                        </div>
                                        <select
                                            id="userType"
                                            name="userType"
                                            value={formData.userType}
                                            onChange={handleChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, userType: true }))}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg appearance-none ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.userType && touched.userType ? 'border-red-500 error-border' : isFieldValid('userType') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                        >
                                            <option value="student">Student</option>
                                            <option value="faculty">Faculty/Staff</option>
                                            <option value="visitor">Visitor</option>
                                        </select>
                                        {isFieldValid('userType') && (
                                            <FaCheckCircle className="absolute right-8 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.userType && touched.userType && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.userType}
                                        </p>
                                    )}
                                </div>

                                {/* SBU ID field - show for all users but make it auto-generated for visitors */}
                                <div>
                                    <label htmlFor="sbuId" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        {formData.userType === 'visitor' ? 'Visitor ID (Auto-generated)' : 'SBU ID* (9 digits)'}
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaIdCard className="w-5 h-5" />
                                        </div>
                                        <input
                                            id="sbuId"
                                            name="sbuId"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={9}
                                            value={formData.userType === 'visitor' ? 'Will be auto-generated' : formData.sbuId}
                                            onChange={handleChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, sbuId: true }))}
                                            disabled={formData.userType === 'visitor'}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.sbuId && touched.sbuId ? 'border-red-500 error-border' : isFieldValid('sbuId') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}
                                            ${formData.userType === 'visitor' ? `${darkMode ? 'bg-gray-600' : 'bg-gray-100'} cursor-not-allowed` : ''}`}
                                            placeholder={formData.userType === 'visitor' ? '' : "123456789"}
                                        />
                                        {isFieldValid('sbuId') && formData.userType !== 'visitor' && (
                                            <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.sbuId && touched.sbuId && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.sbuId}
                                        </p>
                                    )}
                                    {formData.userType === 'visitor' && (
                                        <p className="mt-1 text-sm text-amber-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" />
                                            Visitors are not part of Stony Brook University. A unique Visitor ID will be automatically assigned.
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg
                                        ${isLoading
                                                ? 'bg-gray-400 cursor-not-allowed'
                                                : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Registering...
                                            </div>
                                        ) : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;