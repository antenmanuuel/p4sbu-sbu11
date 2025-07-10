/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaExclamationCircle, FaCheckCircle, FaArrowLeft } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthService } from '../utils/api';

const Login = ({ darkMode, login, setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check if user was redirected from another page
  const from = location.state?.from?.pathname || location.state?.from || '/dashboard';
  // Check if the user was redirected with a pending reservation
  const reservationPending = location.state?.reservationPending || false;
  // Check for message from registration
  const registrationMessage = location.state?.message || '';

  console.log("Login - From path:", from);
  console.log("Login - Reservation pending:", reservationPending);
  console.log("Login - Location state:", location.state);

  // Set message from registration if exists
  useEffect(() => {
    if (registrationMessage) {
      setLoginMessage(registrationMessage);
    }
  }, [registrationMessage]);

  // Check for session expiration parameter
  useEffect(() => {
    // Check for redirect due to session timeout
    const params = new URLSearchParams(location.search);
    const expired = params.get('expired');
    const sessionExpired = localStorage.getItem('sessionExpired');

    if (expired === '1' || sessionExpired === 'true') {
      toast.warning('Your session has expired. Please log in again.', {
        position: "top-center",
        autoClose: 5000
      });

      // Clear the flag so we don't show the message again
      localStorage.removeItem('sessionExpired');

      // Update URL without the expired parameter to prevent showing the message on refresh
      if (expired === '1') {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location]);

  // Check for pendingReservation in sessionStorage when component loads
  useEffect(() => {
    const pendingReservation = sessionStorage.getItem('pendingReservation');
    if (pendingReservation) {
      console.log('Login loaded with pending reservation in sessionStorage:', pendingReservation);

      try {
        const reservationData = JSON.parse(pendingReservation);
        console.log('Parsed reservation data:', reservationData);
      } catch (e) {
        console.error('Error parsing reservation data:', e);
      }
    } else {
      console.log('No pending reservation found in sessionStorage');
    }
  }, []);

  // Validate a single field
  const validateField = (name, value) => {
    switch (name) {
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
      default:
        return '';
    }
    return '';
  };

  const validateForm = () => {
    const newErrors = {};

    newErrors.email = validateField('email', email);
    newErrors.password = validateField('password', password);

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
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
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
        let value = field === 'email' ? email : password;

        const error = validateField(field, value);
        if (error) {
          newErrors[field] = error;
        } else {
          delete newErrors[field];
        }
      });

      setErrors(newErrors);
    }
  }, [email, password, touched]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Set all fields as touched
    setTouched({
      email: true,
      password: true
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

    setIsLoading(true);
    setLoginError('');

    try {
      // Pass the from path from location state to the login function
      const redirectPath = location.state?.from || '/dashboard';
      const success = await login(email, password, redirectPath, location.state?.reservationPending, rememberMe);
      if (!success) {
        setLoginError('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if a field is valid
  const isFieldValid = (field) => touched[field] && !errors[field];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <ToastContainer />

      {/* Hero Section */}
      <div className="relative mb-10">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-600 opacity-5 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

        <div className="text-center relative z-10">
          <div className="inline-block mb-4">
            <span className={`inline-flex items-center justify-center p-3 ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'} rounded-xl`}>
              <FaLock className="w-8 h-8" />
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Sign in to <span className="text-red-600">P4SBU</span>
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Access your Stony Brook University parking account
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 mb-16">
        {/* Left column - welcome image/description */}
        <div className="lg:w-1/2">
          <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <div className="relative h-64 bg-gradient-to-r from-red-600 to-red-400">
              <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                <h2 className="text-2xl font-bold mb-2">Welcome Back!</h2>
                <p className="text-lg opacity-90">Manage your parking permits, reservations, and more.</p>
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
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Secure Platform</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your data is protected with industry-standard encryption.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Fast, Easy Access</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Sign in quickly to access real-time parking information.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-green-100 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Digital Permits</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>View and manage your digital parking permits and citations.</p>
                  </div>
                </div>
              </div>

              {/* Show message if user was redirected from a reservation */}
              {reservationPending && (
                <div className="mt-6 p-4 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm">
                  <p className="text-sm font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    Please log in to complete your parking reservation. Your selection will be maintained.
                  </p>
                </div>
              )}

              {/* Show message from registration */}
              {loginMessage && (
                <div className={`mt-6 p-4 rounded-xl ${darkMode ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-800'} shadow-sm`}>
                  <p className="text-sm font-medium flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                    </svg>
                    {loginMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right column - auth form */}
        <div className="lg:w-1/2">
          <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <div className="p-8 relative">
              {/* Decorative accent */}
              <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

              <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Sign in to your account
              </h2>

              {loginError && (
                <div className={`p-4 mb-6 rounded-xl flex items-center ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'}`}>
                  <FaExclamationCircle className="flex-shrink-0 mr-3" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email-address" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Email address
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <FaEnvelope className="w-5 h-5" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                      ${errors.email && touched.email ? 'border-red-500 error-border' : isFieldValid('email') ? 'border-green-500' : 'border'} 
                      focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                      placeholder="your.email@example.com"
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

                <div>
                  <label htmlFor="password" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <FaLock className="w-5 h-5" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
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

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className={`h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded ${darkMode ? 'bg-gray-700 border-gray-600' : ''}`}
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <label htmlFor="remember-me" className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Remember me
                    </label>
                  </div>

                  <Link to="/forgot-password" className={`text-sm font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                    Forgot password?
                  </Link>
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
                      Signing in...
                    </div>
                  ) : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Don't have an account?{' '}
                  <Link to="/register" className={`font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}>
                    Register now
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

export default Login;