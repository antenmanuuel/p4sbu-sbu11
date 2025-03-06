import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaQuestionCircle, FaCarAlt, FaFileAlt, FaMoneyBillWave } from 'react-icons/fa';

const ContactUs = ({ darkMode }) => {
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
        <div className={`py-12 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
                        Contact Us
                    </h2>
                    <p className={`mt-4 max-w-2xl mx-auto text-xl ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        We're here to help with all your parking needs
                    </p>
                </div>

                <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {contactInfo.map((item, index) => (
                        <div
                            key={index}
                            className={`rounded-lg p-6 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} shadow-md`}
                        >
                            <div className="flex items-center justify-center">
                                <div className={`p-3 rounded-md ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} text-white`}>
                                    {item.icon}
                                </div>
                            </div>
                            <h3 className="mt-4 text-center text-xl font-medium">{item.title}</h3>
                            <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {item.content}
                            </p>
                        </div>
                    ))}
                </div>

                <div className={`mt-12 p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Contact Form
                    </h3>
                    <div className="mt-6 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                        <div>
                            <label htmlFor="first-name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                First name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="first-name"
                                    id="first-name"
                                    autoComplete="given-name"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="last-name" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Last name
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="last-name"
                                    id="last-name"
                                    autoComplete="family-name"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="phone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Phone
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="phone"
                                    id="phone"
                                    autoComplete="tel"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="subject" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Subject
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    name="subject"
                                    id="subject"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="message" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Message
                            </label>
                            <div className="mt-1">
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="4"
                                    className={`py-3 px-4 block w-full shadow-sm focus:ring-blue-500 focus:border-blue-500 border border-gray-300 rounded-md ${darkMode ? 'bg-gray-600 text-white border-gray-500' : ''}`}
                                ></textarea>
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <button
                                type="submit"
                                className={`w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white ${darkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Frequently Asked Questions
                    </h3>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2">
                        {faqCategories.map((category, index) => (
                            <div key={index} className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-center">
                                    <div className={`p-2 rounded-md ${darkMode ? 'bg-blue-500' : 'bg-blue-600'} text-white`}>
                                        {category.icon}
                                    </div>
                                    <h4 className="ml-4 text-lg font-medium">{category.title}</h4>
                                </div>
                                <p className={`mt-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{category.description}</p>
                                <div className="mt-4">
                                    <a
                                        href={category.title === "General Inquiries" ? "/about-us" : "/contact-us"}
                                        className={`text-sm font-medium ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                                    >
                                        View frequently asked questions &rarr;
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`mt-12 p-8 rounded-lg shadow-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h3 className={`text-2xl font-medium text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Visit Us
                    </h3>
                    <div className="mt-6 aspect-w-16 aspect-h-9">
                        <div className="w-full h-96 rounded-lg overflow-hidden">
                            {/* Placeholder for map - in a real app, you'd use Google Maps or similar */}
                            <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                                <p className="text-center">
                                    <FaMapMarkerAlt className="mx-auto h-10 w-10 mb-2" />
                                    <span className="block">Interactive map would be displayed here</span>
                                    <span className="block mt-2">Administration Building, 1st Floor, Room 107</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactUs; 