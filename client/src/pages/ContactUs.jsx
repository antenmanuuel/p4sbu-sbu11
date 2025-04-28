import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaQuestionCircle, FaPaperPlane, FaExclamationCircle, FaCheckCircle, FaUser, FaArrowLeft } from 'react-icons/fa';
import { ContactService } from '../utils/api';
import { Link } from 'react-router-dom';

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

    const handleSubmit = async (e) => {
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

        try {
            // Submit form using the ContactService
            const result = await ContactService.submitContactForm(formData);

            if (result.success) {
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
            } else {
                // Handle error
                setFormStatus('error');
                console.error('Form submission failed:', result.error);
                // Reset status after 3 seconds
                setTimeout(() => {
                    setFormStatus('idle');
                }, 3000);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            setFormStatus('error');
            // Reset status after 3 seconds
            setTimeout(() => {
                setFormStatus('idle');
            }, 3000);
        }
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
                            <FaEnvelope className="w-8 h-8" />
                        </span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Contact <span className="text-red-600">P4SBU</span>
                    </h1>
                    <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        We're here to help with all your parking needs
                    </p>
                </div>
            </div>

            {/* Contact Info Cards */}
            <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                {contactInfo.map((item, index) => (
                    <div
                        key={index}
                        className={`rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode
                            ? 'bg-gray-800 border border-gray-700'
                            : 'bg-white border border-gray-100'
                            }`}
                    >
                        <div className="flex items-center justify-center">
                            <div className={`p-3 rounded-xl ${darkMode
                                ? 'bg-red-900/30 text-red-400'
                                : 'bg-red-50 text-red-600'
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

            <div className="flex flex-col lg:flex-row gap-12 mt-16">
                {/* Left Column - Info */}
                <div className="lg:w-1/3">
                    <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="relative h-48 bg-gradient-to-r from-red-600 to-red-400">
                            <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                                <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
                                <p className="text-lg opacity-90">We value your feedback</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <div className="space-y-6">
                                <div>
                                    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        How We Can Help
                                    </h3>
                                    <ul className={`space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">1</span>
                                            Answer questions about permits & parking
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">2</span>
                                            Help with account issues and billing
                                        </li>
                                        <li className="flex items-start">
                                            <span className="inline-flex items-center justify-center size-5 rounded-full bg-red-100 text-red-600 mr-2 mt-0.5">3</span>
                                            Provide information about campus parking
                                        </li>
                                    </ul>
                                </div>

                                <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                    <h4 className={`font-medium mb-2 flex items-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <FaQuestionCircle className="mr-2 text-green-500" />
                                        Response Time
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        We aim to respond to all inquiries within <strong>1-2 business days</strong>. For urgent matters, please call our office directly.
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

                {/* Right Column - Contact Form */}
                <div className="lg:w-2/3">
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Contact Form
                            </h2>
                            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Fill out the form below and we'll get back to you as soon as possible.
                            </p>

                            {formStatus === 'success' && (
                                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-green-900/30 text-green-300' : 'bg-green-50 text-green-800'} flex items-center`}>
                                    <FaCheckCircle className="flex-shrink-0 mr-3" />
                                    <span>Your message has been sent! We'll get back to you soon.</span>
                                </div>
                            )}

                            {formStatus === 'error' && (
                                <div className={`mb-6 p-4 rounded-xl ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-800'} flex items-center`}>
                                    <FaExclamationCircle className="flex-shrink-0 mr-3" />
                                    <span>There was an error sending your message. Please try again.</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="first-name" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            First Name*
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <FaUser className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="firstName"
                                                id="first-name"
                                                autoComplete="given-name"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
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
                                        <label htmlFor="last-name" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Last Name*
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <FaUser className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="lastName"
                                                id="last-name"
                                                autoComplete="family-name"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="email" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Email*
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
                                                onChange={handleInputChange}
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
                                        <label htmlFor="phone" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Phone (optional)
                                        </label>
                                        <div className="relative">
                                            <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                <FaPhone className="w-5 h-5" />
                                            </div>
                                            <input
                                                type="text"
                                                name="phone"
                                                id="phone"
                                                autoComplete="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                                focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                                placeholder="(123) 456-7890"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="subject" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Subject*
                                    </label>
                                    <div className="relative">
                                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            <FaQuestionCircle className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="text"
                                            name="subject"
                                            id="subject"
                                            value={formData.subject}
                                            onChange={handleInputChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, subject: true }))}
                                            className={`pl-10 w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.subject && touched.subject ? 'border-red-500 error-border' : isFieldValid('subject') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                            placeholder="How can we help you?"
                                        />
                                        {isFieldValid('subject') && (
                                            <FaCheckCircle className="absolute right-3 top-3 text-green-500" />
                                        )}
                                    </div>
                                    {errors.subject && touched.subject && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.subject}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="message" className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Message*
                                    </label>
                                    <div className="relative">
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows="4"
                                            value={formData.message}
                                            onChange={handleInputChange}
                                            onBlur={() => setTouched(prev => ({ ...prev, message: true }))}
                                            className={`w-full px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} 
                                            ${errors.message && touched.message ? 'border-red-500 error-border' : isFieldValid('message') ? 'border-green-500' : 'border'} 
                                            focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-red-400' : 'focus:ring-red-600'}`}
                                            placeholder="Enter your message here"
                                        ></textarea>
                                        {isFieldValid('message') && (
                                            <div className="absolute top-3 right-3 pointer-events-none">
                                                <FaCheckCircle className="text-green-500" />
                                            </div>
                                        )}
                                    </div>
                                    {errors.message && touched.message && (
                                        <p className="mt-1 text-sm text-red-500 flex items-center">
                                            <FaExclamationCircle className="mr-1" /> {errors.message}
                                        </p>
                                    )}
                                </div>

                                <div className="mt-6">
                                    <button
                                        type="submit"
                                        disabled={formStatus === 'sending' || formStatus === 'success'}
                                        className={`w-full py-3 px-4 rounded-lg text-white font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg
                                        ${formStatus === 'success'
                                                ? 'bg-green-600 hover:bg-green-700'
                                                : formStatus === 'sending'
                                                    ? 'bg-gray-400 cursor-not-allowed'
                                                    : 'bg-red-600 hover:bg-red-700'}`}
                                    >
                                        {formStatus === 'sending' ? (
                                            <div className="flex items-center justify-center">
                                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Sending...
                                            </div>
                                        ) : formStatus === 'success' ? (
                                            <div className="flex items-center justify-center">
                                                <FaCheckCircle className="mr-2" />
                                                Message Sent!
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center">
                                                <FaPaperPlane className="mr-2" />
                                                Submit
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-16">
                <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                    <div className="p-8">
                        <h3 className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Visit Us
                        </h3>
                        <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Stop by our office for in-person assistance with all your parking needs
                        </p>
                    </div>
                    <div className="w-full h-96 rounded-b-2xl overflow-hidden relative">
                        {/* Google Maps Embed */}
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1509.304179269089!2d-73.12545334326456!3d40.91512367135073!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89e83f154308371f%3A0xbf9adb334708fa9!2sAdministration%20Building%2C%20Stony%20Brook%2C%20NY%2011794!5e0!3m2!1sen!2sus!4v1683643148472!5m2!1sen!2sus&markers=color:red%7CStony+Brook+Administration+Building"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Stony Brook University Administration Building"
                            className="w-full h-full"
                        ></iframe>

                        {/* View larger map link */}
                        <a
                            href="https://www.google.com/maps?ll=40.915124,-73.1239057&z=16&t=m&hl=en&gl=US&mapclient=embed&q=Administration+Building+Stony+Brook,+NY+11794"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`absolute top-4 left-4 z-10 text-sm py-1 px-3 ${darkMode
                                ? 'bg-gray-800 text-blue-400 hover:text-blue-300'
                                : 'bg-white text-blue-600 hover:text-blue-800'
                                } rounded shadow transition-colors`}
                        >
                            View larger map
                        </a>

                        {/* Location Info Overlay */}
                        <div className={`absolute bottom-4 left-4 z-10 ${darkMode ? 'bg-gray-800/85' : 'bg-white/85'} p-4 rounded-lg shadow-lg backdrop-blur-sm`}>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-full mr-3 ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                                    <FaMapMarkerAlt className={`h-5 w-5 ${darkMode ? 'text-red-400' : 'text-red-600'}`} />
                                </div>
                                <div>
                                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                        Our Location
                                    </h4>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Administration Building, 1st Floor, Room 107
                                    </p>
                                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        Stony Brook University, Stony Brook, NY 11794
                                    </p>
                                    <a
                                        href="https://www.google.com/maps/search/?api=1&query=Administration+Building+Stony+Brook+University+Stony+Brook+NY+11794"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center justify-center mt-4 px-6 py-2 text-sm font-medium rounded-lg transition-all hover:-translate-y-1 ${darkMode
                                            ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500'
                                            : 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                                            }`}
                                    >
                                        Get Directions
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs; 