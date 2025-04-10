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
import { FaEnvelope, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
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
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-md w-full space-y-8 p-10 rounded-xl shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-600">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {/* A simple envelope icon variant */}
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 01-8 0" />
            </svg>
          </div>
          <h2 className={`mt-6 text-center text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Forgot Password
          </h2>
          <p className={`mt-2 text-center text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {message && (
          <div className={`p-4 mb-4 text-sm rounded-lg flex items-center ${darkMode ? 'bg-green-900/50 text-green-200' : 'bg-green-100 text-green-800'}`}>
            <FaCheckCircle className="mr-2 flex-shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Email address
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
                  value={email}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                  className={`pl-10 appearance-none block w-full px-3 py-2 border 
                    ${errors.email && touched.email
                      ? 'border-red-500 error-border'
                      : isFieldValid()
                        ? 'border-green-500'
                        : darkMode ? 'border-gray-700' : 'border-gray-300'
                    } 
                    rounded-md placeholder-gray-500 
                    ${darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'text-gray-900'} 
                    focus:outline-none focus:ring-red-500 focus:border-red-500 focus:z-10 sm:text-sm`}
                  placeholder="you@example.com"
                  aria-invalid={errors.email && touched.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
                {isFieldValid() && (
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
          </div>

          {formSubmitted && errors.email && (
            <div className={`p-3 rounded-md ${darkMode ? 'bg-red-900/50' : 'bg-red-50'} border ${darkMode ? 'border-red-800' : 'border-red-200'}`}>
              <div className="flex">
                <FaExclamationCircle className="flex-shrink-0 h-5 w-5 text-red-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-800'}`}>
                    Please correct the following error:
                  </h3>
                  <div className={`mt-2 text-sm ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                    <ul className="list-disc pl-5 space-y-1">
                      {errors.email && <li>{errors.email}</li>}
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
                  Sending...
                </>
              ) : 'Send Reset Link'}
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

export default ForgotPassword;
