import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaQuestionCircle, FaCarAlt, FaFileAlt, FaMoneyBillWave, FaPaperPlane, FaExclamationCircle, FaCheckCircle, FaUser } from 'react-icons/fa';

const ContactUs = ({ darkMode }) => {
    // Form state with validation
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [formStatus, setFormStatus] = useState('idle'); // idle, sending, success, error

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
            case 'subject':
                if (!value.trim()) {
                    return 'Subject is required';
                }
                break;
            case 'message':
                if (!value.trim()) {
                    return 'Message is required';
                } else if (value.trim().length < 10) {
                    return 'Message must be at least 10 characters';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    // Handle field change with validation
    const handleInputChange = (e) => {
        const { name, value } = e.target;

        // Mark field as touched
        setTouched(prev => ({ ...prev, [name]: true }));

        // Update form data
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

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
    }, [errors, formData, touched]);

    // Validate entire form
    const validateForm = () => {
        const newErrors = {};

        // Validate required fields
        Object.keys(formData).forEach(field => {
            // Phone is optional
            if (field === 'phone') return;

            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setFormSubmitted(true);

        // Set all fields as touched
        const allTouched = {};
        Object.keys(formData).forEach(field => {
            // Except phone which is optional
            if (field !== 'phone' || formData[field].trim() !== '') {
                allTouched[field] = true;
            }
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

        setFormStatus('sending');

        // Simulate form submission
        setTimeout(() => {
            setFormStatus('success');
            // Reset form after 3 seconds
            setTimeout(() => {
                setFormStatus('idle');
                setFormData({
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                });
                setFormSubmitted(false);
                setTouched({});
            }, 3000);
        }, 1500);
    };

    // Determine if a field is valid
    const isFieldValid = (field) => touched[field] && !errors[field];

    const contactInfo = [
        {
            title: "Location",
            content: "Administration Building, 1st Floor, Room 107",
            icon: <FaMapMarkerAlt className="h-6 w-6" />
        },
        {
            title: "Phone",
            content: "(631) 632-AUTO (2886)",
            icon: <FaPhone className="h-6 w-6" />
        },
        {
            title: "Email",
            content: "p4sbu@stonybrook.edu",
            icon: <FaEnvelope className="h-6 w-6" />
        },
        {
            title: "Hours",
            content: "Monday-Friday: 8:30 AM - 4:30 PM (Closed weekends and holidays)",
            icon: <FaClock className="h-6 w-6" />
        }
    ];

    const faqCategories = [
        {
            title: "General Inquiries",
            description: "Questions about P4SBU services and policies",
            icon: <FaQuestionCircle className="h-10 w-10" />
        },
        {
            title: "Permits",
            description: "Information about permit types, eligibility, and purchasing",
            icon: <FaCarAlt className="h-10 w-10" />
        },
        {
            title: "Citations",
            description: "Questions about parking citations and appeals process",
            icon: <FaFileAlt className="h-10 w-10" />
        },
        {
            title: "Payments",
            description: "Help with payment methods and refund policies",
            icon: <FaMoneyBillWave className="h-10 w-10" />
        }
    ];

    return (
        <div className={`py-12 ${darkMode ? 'bg-gray-800 text-white' : 'bg-gradient-to-b from-white to-blue-50 text-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
                        Contact Us
                    </h2>
                    <p className={`mt-4 max-w-2xl mx-auto text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        We're here to help with all your parking needs
                    </p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {contactInfo.map((item, index) => (
                        <div
                            key={index}
                            className={`rounded-lg shadow-md p-6 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${darkMode
                                ? 'bg-gray-700 border border-gray-600'
                                : 'bg-white border border-gray-100 shadow-md'
                                }`}
                        >
                            <div className="flex items-center justify-center">
                                <div className={`p-3 rounded-md ${darkMode
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                    }`}>
                                    {item.icon}
                                </div>
                            </div>
                            <h3 className={`mt-4 text-center text-xl font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {item.title}
                            </h3>
                            <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className={`mt-16 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-100'}`}>
                    <div className={`p-8 ${darkMode ? 'border-b border-gray-600' : 'border-b border-gray-100'}`}>
                        <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Contact Form
                        </h3>
                        <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Fill out the form below and we'll get back to you as soon as possible.
                        </p>
                    </div>

                    {formStatus === 'success' && (
                        <div className={`mx-8 mb-4 p-3 rounded-md flex items-center ${darkMode ? 'bg-green-800 text-green-100 border border-green-700' : 'bg-green-50 text-green-800'}`}>
                            <FaCheckCircle className={`mr-2 flex-shrink-0 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                            <span>Your message has been sent! We'll get back to you soon.</span>
                        </div>
                    )}

                    {formStatus === 'error' && (
                        <div className={`mx-8 mb-4 p-3 rounded-md flex items-center ${darkMode ? 'bg-red-800 text-red-100 border border-red-700' : 'bg-red-50 text-red-800'}`}>
                            <FaExclamationCircle className={`mr-2 flex-shrink-0 ${darkMode ? 'text-red-400' : 'text-red-500'}`} />
                            <span>There was an error sending your message. Please try again.</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 pt-4">
                        <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                            <div>
                                <label htmlFor="first-name" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    First name*
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaUser />
                                    </div>
                                    <input
                                        type="text"
                                        name="firstName"
                                        id="first-name"
                                        autoComplete="given-name"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, firstName: true }))}
                                        className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                                            ${errors.firstName && touched.firstName
                                                ? darkMode ? 'border-red-500 error-border' : 'border-red-500 error-border'
                                                : isFieldValid('firstName')
                                                    ? darkMode ? 'border-green-500' : 'border-green-500'
                                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                                            } 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.firstName && touched.firstName ? "true" : "false"}
                                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                                    />
                                    {isFieldValid('firstName') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                        </div>
                                    )}
                                    {errors.firstName && touched.firstName && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                        </div>
                                    )}
                                </div>
                                {errors.firstName && touched.firstName && (
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`} id="firstName-error">
                                        {errors.firstName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="last-name" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Last name*
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaUser />
                                    </div>
                                    <input
                                        type="text"
                                        name="lastName"
                                        id="last-name"
                                        autoComplete="family-name"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, lastName: true }))}
                                        className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                                            ${errors.lastName && touched.lastName
                                                ? darkMode ? 'border-red-500 error-border' : 'border-red-500 error-border'
                                                : isFieldValid('lastName')
                                                    ? darkMode ? 'border-green-500' : 'border-green-500'
                                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                                            } 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.lastName && touched.lastName ? "true" : "false"}
                                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                                    />
                                    {isFieldValid('lastName') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                        </div>
                                    )}
                                    {errors.lastName && touched.lastName && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                        </div>
                                    )}
                                </div>
                                {errors.lastName && touched.lastName && (
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`} id="lastName-error">
                                        {errors.lastName}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Email*
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
                                        onChange={handleInputChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                                        className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                                            ${errors.email && touched.email
                                                ? darkMode ? 'border-red-500 error-border' : 'border-red-500 error-border'
                                                : isFieldValid('email')
                                                    ? darkMode ? 'border-green-500' : 'border-green-500'
                                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                                            } 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.email && touched.email ? "true" : "false"}
                                        aria-describedby={errors.email ? "email-error" : undefined}
                                        placeholder="you@example.com"
                                    />
                                    {isFieldValid('email') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                        </div>
                                    )}
                                    {errors.email && touched.email && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                        </div>
                                    )}
                                </div>
                                {errors.email && touched.email && (
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`} id="email-error">
                                        {errors.email}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Phone (optional)
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaPhone />
                                    </div>
                                    <input
                                        type="text"
                                        name="phone"
                                        id="phone"
                                        autoComplete="tel"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                                            ${darkMode ? 'border-gray-600' : 'border-gray-300'} 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        placeholder="(123) 456-7890"
                                    />
                                </div>
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="subject" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Subject*
                                </label>
                                <div className="relative mt-1">
                                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        <FaQuestionCircle />
                                    </div>
                                    <input
                                        type="text"
                                        name="subject"
                                        id="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                                        className={`pl-10 appearance-none relative block w-full px-3 py-2 border 
                                            ${errors.subject && touched.subject
                                                ? darkMode ? 'border-red-500 error-border' : 'border-red-500 error-border'
                                                : isFieldValid('subject')
                                                    ? darkMode ? 'border-green-500' : 'border-green-500'
                                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                                            } 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.subject && touched.subject ? "true" : "false"}
                                        aria-describedby={errors.subject ? "subject-error" : undefined}
                                        placeholder="How can we help you?"
                                    />
                                    {isFieldValid('subject') && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaCheckCircle className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                        </div>
                                    )}
                                    {errors.subject && touched.subject && (
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                            <FaExclamationCircle className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                        </div>
                                    )}
                                </div>
                                {errors.subject && touched.subject && (
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`} id="subject-error">
                                        {errors.subject}
                                    </p>
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="message" className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                    Message*
                                </label>
                                <div className="relative mt-1">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows="4"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                                        className={`appearance-none relative block w-full px-3 py-2 border 
                                            ${errors.message && touched.message
                                                ? darkMode ? 'border-red-500 error-border' : 'border-red-500 error-border'
                                                : isFieldValid('message')
                                                    ? darkMode ? 'border-green-500' : 'border-green-500'
                                                    : darkMode ? 'border-gray-600' : 'border-gray-300'
                                            } 
                                            rounded-md placeholder-gray-500 
                                            ${darkMode
                                                ? 'bg-gray-800 text-white placeholder-gray-500'
                                                : 'bg-white text-gray-900'
                                            } 
                                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm`}
                                        aria-invalid={errors.message && touched.message ? "true" : "false"}
                                        aria-describedby={errors.message ? "message-error" : undefined}
                                        placeholder="Enter your message here"
                                    ></textarea>
                                    {isFieldValid('message') && (
                                        <div className="absolute top-2 right-2 pointer-events-none">
                                            <FaCheckCircle className={darkMode ? 'text-green-400' : 'text-green-500'} />
                                        </div>
                                    )}
                                    {errors.message && touched.message && (
                                        <div className="absolute top-2 right-2 pointer-events-none">
                                            <FaExclamationCircle className={darkMode ? 'text-red-400' : 'text-red-500'} />
                                        </div>
                                    )}
                                </div>
                                {errors.message && touched.message && (
                                    <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-500'}`} id="message-error">
                                        {errors.message}
                                    </p>
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={formStatus === 'sending' || formStatus === 'success'}
                                    className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-md text-base font-medium text-white transition-all duration-300 ${formStatus === 'success'
                                        ? darkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
                                        : darkMode
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                        } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    {formStatus === 'sending' ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : formStatus === 'success' ? (
                                        <>
                                            <svg className="-ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                            Message Sent!
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="mr-2" />
                                            Submit
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="mt-16">
                    <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Frequently Asked Questions
                    </h3>
                    <p className={`mt-3 max-w-2xl mx-auto text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Browse our FAQ categories to find answers to common questions
                    </p>
                    <div className="mt-8 grid gap-6 sm:grid-cols-2">
                        {faqCategories.map((category, index) => (
                            <div
                                key={index}
                                className={`rounded-lg shadow-md p-6 ${darkMode
                                    ? 'bg-gray-700 border border-gray-600'
                                    : 'bg-white border border-gray-200 hover:border-blue-200'
                                    }`}
                            >
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-md ${darkMode
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-md text-white'
                                        }`}>
                                        {category.icon}
                                    </div>
                                    <h4 className={`ml-4 text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                        {category.title}
                                    </h4>
                                </div>
                                <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {category.description}
                                </p>
                                <div className="mt-4">
                                    <a
                                        href={category.title === "General Inquiries" ? "/about-us" : "/contact-us"}
                                        className={`text-sm font-medium inline-flex items-center transition-colors ${darkMode
                                            ? 'text-blue-400 hover:text-blue-300'
                                            : 'text-blue-600 hover:text-blue-800'
                                            }`}
                                    >
                                        View frequently asked questions
                                        <svg className="ml-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                            <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`mt-16 rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-100'}`}>
                    <div className="p-8">
                        <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Visit Us
                        </h3>
                        <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Stop by our office for in-person assistance with all your parking needs
                        </p>
                    </div>
                    <div className="w-full h-96 rounded-lg overflow-hidden">
                        {/* Placeholder for map - in a real app, you'd use Google Maps or similar */}
                        <div className={`w-full h-full flex items-center justify-center ${darkMode
                            ? 'bg-gray-800 border-t border-gray-600'
                            : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                            }`}>
                            <div className="text-center max-w-md mx-auto p-4">
                                <div className={`inline-flex items-center justify-center p-4 mx-auto mb-4 rounded-full ${darkMode
                                    ? 'bg-gray-700 border border-gray-600'
                                    : 'bg-white shadow-md'
                                    }`}>
                                    <FaMapMarkerAlt className={`h-8 w-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                </div>
                                <h4 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                    Our Location
                                </h4>
                                <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                                    Administration Building, 1st Floor, Room 107
                                </p>
                                <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    Stony Brook University, Stony Brook, NY 11794
                                </p>
                                <button className={`mt-6 px-6 py-2 text-sm font-medium rounded-full transition-colors ${darkMode
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-500'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                                    }`}>
                                    Get Directions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs; 