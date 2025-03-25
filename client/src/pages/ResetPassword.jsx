/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { FaLock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
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
        <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className={`max-w-md w-full space-y-8 p-10 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <div>
                    <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-600">
                        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Reset Your Password
                    </h2>
                    <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Enter your new password below
                    </p>
                </div>

                {message && (
                    <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${messageType === 'success'
                            ? (darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800')
                            : (darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800')
                        }`}>
                        {messageType === 'success' ? (
                            <FaCheckCircle className="mr-2 flex-shrink-0" />
                        ) : (
                            <FaExclamationCircle className="mr-2 flex-shrink-0" />
                        )}
                        <span>{message}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="password" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                New Password
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
                                    value={password}
                                    onChange={(e) => handleFieldChange('password', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                                    className={`pl-10 appearance-none block w-full px-3 py-2 border 
                    ${errors.password && touched.password
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('password')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        } 
                    rounded-md placeholder-gray-500 
                    ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'text-gray-900'} 
                    focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="••••••••"
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
                                Confirm New Password
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
                                    value={confirmPassword}
                                    onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                                    onBlur={() => setTouched(prev => ({ ...prev, confirmPassword: true }))}
                                    className={`pl-10 appearance-none block w-full px-3 py-2 border 
                    ${errors.confirmPassword && touched.confirmPassword
                                            ? 'border-red-500 error-border'
                                            : isFieldValid('confirmPassword')
                                                ? 'border-green-500'
                                                : darkMode ? 'border-gray-700' : 'border-gray-300'
                                        } 
                    rounded-md placeholder-gray-500 
                    ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'text-gray-900'} 
                    focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                                    placeholder="••••••••"
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
                                    Updating Password...
                                </>
                            ) : 'Reset Password'}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <Link
                            to="/login"
                            className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${darkMode
                                    ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Back to Login
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword; 