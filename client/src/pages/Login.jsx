import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Login = ({ darkMode, login }) => {
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

  // Set message from registration if exists
  useEffect(() => {
    if (registrationMessage) {
      setLoginMessage(registrationMessage);
    }
  }, [registrationMessage]);

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
      // Call the login function from props that now uses the real API
      if (login) {
        const success = await login(email, password);

        if (success) {
          // Login was successful, the parent component will handle redirection
          // AppContent will decide which dashboard to show based on user type
        } else {
          setLoginError('Invalid email or password. Please try again.');
        }
      } else {
        setLoginError('Login function not available');
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Determine if a field is valid
  const isFieldValid = (field) => touched[field] && !errors[field];

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8`}>
      <div className={`max-w-md w-full space-y-8 p-10 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-600">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Sign in to your account</h2>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Or{' '}
            <Link to="/register" className="font-medium text-red-600 hover:text-red-500">
              register for a new account
            </Link>
          </p>

          {/* Show message if user was redirected from a reservation */}
          {reservationPending && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-lg">
              <p className="text-sm font-medium">
                Please log in to complete your parking reservation. Your selection will be maintained.
              </p>
            </div>
          )}

          {/* Show message from registration */}
          {loginMessage && (
            <div className={`mt-4 p-3 rounded-lg ${darkMode ? 'bg-blue-900/50 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
              <p className="text-sm font-medium">
                {loginMessage}
              </p>
            </div>
          )}
        </div>

        {loginError && (
          <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${darkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'}`}>
            <FaExclamationCircle className="mr-2 flex-shrink-0" />
            <span><span className="font-medium">Error:</span> {loginError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Email address
              </label>
              <div className="relative mt-1">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <FaEnvelope />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                    ${errors.email && touched.email
                      ? 'border-red-500 error-border'
                      : isFieldValid('email')
                        ? 'border-green-500'
                        : darkMode ? 'border-gray-700' : 'border-gray-300'
                    } 
                    rounded-md placeholder-gray-500 
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
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => handleFieldChange('password', e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                  className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                    ${errors.password && touched.password
                      ? 'border-red-500 error-border'
                      : isFieldValid('password')
                        ? 'border-green-500'
                        : darkMode ? 'border-gray-700' : 'border-gray-300'
                    } 
                    rounded-md placeholder-gray-500 
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
              <label htmlFor="remember-me" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-red-600 hover:text-red-500">
                Forgot your password?
              </Link>
            </div>
          </div>

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
                  Signing in...
                </>
              ) : 'Sign in'}
            </button>
          </div>

          <div className="text-center mt-4">
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

export default Login;