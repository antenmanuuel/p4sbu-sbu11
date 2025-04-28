/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaLock, FaExclamationCircle, FaCheckCircle, FaArrowLeft, FaUnlock } from 'react-icons/fa';
import { AuthService } from '../utils/api';

const ResetPassword = ({ darkMode }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success'); // 'success' or 'error'
    const navigate = useNavigate();
    const { token } = useParams();
    const location = useLocation();

    // Extract token from URL if not in params
    useEffect(() => {
        if (!token) {
            const searchParams = new URLSearchParams(location.search);
            const tokenFromQuery = searchParams.get('token');
            if (!tokenFromQuery) {
                setMessageType('error');
                setMessage('Invalid or missing reset token. Please request a new password reset link.');
            }
        }
    }, [token, location]);

    // Validate a single field
    const validateField = (name, value) => {
        switch (name) {
            case 'password':
                if (!value) {
                    return 'Password is required';
                } else if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                } else if (!/[A-Z]/.test(value)) {
                    return 'Password must contain at least one uppercase letter';
                } else if (!/[a-z]/.test(value)) {
                    return 'Password must contain at least one lowercase letter';
                } else if (!/[0-9]/.test(value)) {
                    return 'Password must contain at least one number';
                }
                break;
            case 'confirmPassword':
                if (!value) {
                    return 'Please confirm your password';
                } else if (value !== password) {
                    return 'Passwords do not match';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    const validateForm = () => {
        const newErrors = {};

        newErrors.password = validateField('password', password);
        newErrors.confirmPassword = validateField('confirmPassword', confirmPassword);

        // Remove empty error messages
        Object.keys(newErrors).forEach(key => {
            if (!newErrors[key]) {
                delete newErrors[key];
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle field change with validation
    const handleFieldChange = (name, value) => {
        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));

        // Update field value
        if (name === 'password') {
            setPassword(value);
        } else if (name === 'confirmPassword') {
            setConfirmPassword(value);
        }

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
                let value = field === 'password' ? password : confirmPassword;
                const error = validateField(field, value);
                if (error) {
                    newErrors[field] = error;
                } else {
                    delete newErrors[field];
                }
            });

            setErrors(newErrors);
        }
    }, [password, confirmPassword, touched]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Set all fields as touched
        setTouched({
            password: true,
            confirmPassword: true
        });

        if (!validateForm()) {
            // Scroll to first error and focus it
            const firstErrorField = document.querySelector('.error-border');
            if (firstErrorField) {
                firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstErrorField.focus();
            }
            return;
        }

        // Get token from URL if not in params
        const resetToken = token || new URLSearchParams(location.search).get('token');

        if (!resetToken) {
            setMessageType('error');
            setMessage('Invalid or missing reset token. Please request a new password reset link.');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const result = await AuthService.resetPassword(resetToken, password);

            if (result.success) {
                setMessageType('success');
                setMessage('Your password has been reset successfully. You can now log in with your new password.');

                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/login', { state: { message: 'Password reset successful. Please log in with your new password.' } });
                }, 3000);
            } else {
                setMessageType('error');
                setMessage(result.error || 'Failed to reset password. The link may have expired or is invalid.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setMessageType('error');
            setMessage('An unexpected error occurred. Please try again or request a new reset link.');
        } finally {
            setIsLoading(false);
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
                            <FaUnlock className="w-8 h-8" />
                        </span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Reset <span className="text-red-600">Password</span>
                    </h1>
                    <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Create a new password for your account
                    </p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 mb-16">
                {/* Left column - info */}
                <div className="lg:w-1/2">
                    <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="relative h-64 bg-gradient-to-r from-red-600 to-red-400">
                            <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                                <h2 className="text-2xl font-bold mb-2">Create a New Password</h2>
                                <p className="text-lg opacity-90">Secure your P4SBU account</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full p-2 bg-red-100 text-red-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Strong Password</h3>
                                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Create a strong password with at least 8 characters, including uppercase, lowercase, and numbers.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Account Security</h3>
                                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your new password will help keep your parking account secure.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right column - password form */}
                <div className="lg:w-1/2">
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Reset your password
                            </h2>

                            {message && (
                                <div className={`p-4 mb-6 rounded-xl flex items-center ${messageType === 'success'
                                    ? (darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800')
                                    : (darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800')
                                    }`}>
                                    {messageType === 'success' ? (
                                        <FaCheckCircle className="flex-shrink-0 mr-3" />
                                    ) : (
                                        <FaExclamationCircle className="flex-shrink-0 mr-3" />
                                    )}
                                    <span>{message}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        New Password
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
                                            value={password}
                                            onChange={(e) => handleFieldChange('password', e.target.value)}
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

                                <div>
                                    <label htmlFor="confirmPassword" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Confirm Password
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
                                            value={confirmPassword}
                                            onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
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
                                            Resetting Password...
                                        </div>
                                    ) : 'Reset Password'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Remember your password?{' '}
                                    <Link to="/login" className={`font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                                        Back to login
                                    </Link>
                                </p>
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
            </div>
        </div>
    );
};

export default ResetPassword;