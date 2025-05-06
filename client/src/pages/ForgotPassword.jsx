// NOTE: format taken from Login.jsx
// TP: this .jsx file's code was manipulated, optimized, and contributed to by ChatGPT (after the initial was written by Student) to provide clarity on bugs, modularize, and optimize/provide better solutions during the coding process. 
// It was prompted to take the initial iteration/changes and modify/optimize it to adapt for more concise techniques to achieve the desired functionalities.
// It was also prompted to explain all changes in detail (completely studied/understood by the student) before the AI's changes were added to the code file. 
// Additionally, ChatGPT (with project and code context) modified the initial/previous iteration of code to be maximized for code readability as well as descriptive comments (for Instructor understanding). 
// It can be credited that AI played a crucial role in heavily contributing/modifying/optimizing this entire file's code (after the initial changes were written by Student). 
// Commits and pushes are executed after the final version have been made for the specific implementation changes during that coding session. 
// Thus, We can properly credit ChatGPT with the final version for this code file. 

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaExclamationCircle, FaCheckCircle, FaArrowLeft, FaLock } from 'react-icons/fa';
import { AuthService } from '../utils/api';

const ForgotPassword = ({ darkMode }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Validate the email field
  const validateField = (value) => {
    if (!value) {
      return 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(value)) {
      return 'Email is invalid';
    }
    return '';
  };

  const validateForm = () => {
    const emailError = validateField(email);
    const newErrors = {};
    if (emailError) newErrors.email = emailError;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle changes in the email field
  const handleFieldChange = (value) => {
    setEmail(value);
    setTouched(prev => ({ ...prev, email: true }));
    if (formSubmitted) {
      setErrors({ email: validateField(value) });
    }
  };

  // Validate on blur or when the email changes
  useEffect(() => {
    if (touched.email) {
      setErrors({ email: validateField(email) });
    }
  }, [email, touched.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    if (!validateForm()) {
      const firstErrorField = document.querySelector('.error-border');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      // Use the real API call instead of simulating
      const result = await AuthService.requestPasswordReset(email);

      if (result.success) {
        setMessage('If an account with that email exists, a reset link has been sent.');

        // Redirect back to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        // Still show the same message even on error to prevent user enumeration
        setMessage('If an account with that email exists, a reset link has been sent.');

        // Still redirect back after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      console.error('Password reset request error:', error);
      // Still show success message to prevent user enumeration
      setMessage('If an account with that email exists, a reset link has been sent.');

      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } finally {
      setIsLoading(false);
    }
  };


  const isFieldValid = () => touched.email && !errors.email;

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
              <FaLock className="w-8 h-8" />
            </span>
          </div>
          <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Forgot <span className="text-red-600">Password</span>
          </h1>
          <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            We'll help you reset your password
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 mb-16">
        {/* Left column - info */}
        <div className="lg:w-1/2">
          <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
            <div className="relative h-64 bg-gradient-to-r from-red-600 to-red-400">
              <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                <h2 className="text-2xl font-bold mb-2">Password Recovery</h2>
                <p className="text-lg opacity-90">Get back into your P4SBU account</p>
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
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Secure Process</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>We'll send a secure reset link to your email address.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Recovery</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Reset your password and regain access to your account.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="rounded-full p-2 bg-green-100 text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Need Help?</h3>
                    <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Contact support if you're still having trouble accessing your account.</p>
                  </div>
                </div>
              </div>
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
                Reset your password
              </h2>

              {message && (
                <div className={`p-4 mb-6 rounded-xl flex items-center ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'}`}>
                  <FaCheckCircle className="flex-shrink-0 mr-3" />
                  <span>{message}</span>
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
                      onChange={(e) => handleFieldChange(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                      ${errors.email && touched.email ? 'border-red-500 error-border ring-2 ring-red-500' : isFieldValid() ? 'border-green-500 ring-2 ring-green-500' : 'border'} 
                      focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                      placeholder="your.email@example.com"
                      aria-invalid={errors.email && touched.email ? "true" : "false"}
                      aria-describedby={errors.email ? "email-error" : undefined}
                    />
                    {isFieldValid() && (
                      <FaCheckCircle className="absolute right-3 top-3 text-green-500" size={20} />
                    )}
                    {errors.email && touched.email && (
                      <FaExclamationCircle className="absolute right-3 top-3 text-red-500" size={20} />
                    )}
                  </div>
                  {errors.email && touched.email && (
                    <p id="email-error" className="mt-2 text-sm text-red-500 flex items-center font-medium">
                      <FaExclamationCircle className="mr-2" /> {errors.email}
                    </p>
                  )}

                  {/* Validation tips */}
                  <div className={`mt-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <p>Email format: your.email@example.com</p>
                  </div>
                </div>

                {/* Form submission errors summary */}
                {formSubmitted && errors.email && (
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
                    <div className="flex">
                      <FaExclamationCircle className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5" />
                      <div className="ml-3">
                        <h3 className="text-sm font-medium">Please correct the following error:</h3>
                        <div className="mt-2 text-sm">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>{errors.email}</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg
                  ${isLoading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : Object.keys(errors).length > 0 && touched.email
                        ? 'bg-red-300 hover:bg-red-400 cursor-not-allowed'
                        : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending Reset Link...
                    </div>
                  ) : 'Send Reset Link'}
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

export default ForgotPassword;
