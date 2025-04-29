import React from 'react';
import { FaParking, FaRoad, FaClipboardList, FaMapMarkedAlt, FaUniversity, FaArrowLeft, FaInfoCircle, FaExternalLinkAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const AboutUs = ({ darkMode, user }) => {
    const features = [
        {
            title: "Official Parking Services",
            description: "Stony Brook University's official Mobility & Parking Services (MAPS) provides multiple parking options for students, faculty, and staff with thousands of parking spaces across campus.",
            icon: <FaParking className="w-8 h-8" />,
            link: "https://www.stonybrook.edu/mobility-and-parking/#"
        },
        {
            title: "Transportation Options",
            description: "MAPS supports the campus community with shuttle services, transportation options, and integration with walkable and bike-friendly campus infrastructure.",
            icon: <FaRoad className="w-8 h-8" />,
            link: "https://www.stonybrook.edu/mobility-and-parking/#"
        },
        {
            title: "Permit System",
            description: "Student permits are available by semester while faculty and staff permits are available annually. Learn about permit types, eligibility, and purchasing options.",
            icon: <FaClipboardList className="w-8 h-8" />,
            link: "https://www.stonybrook.edu/mobility-and-parking/#"
        },
        {
            title: "Campus Parking Map",
            description: "Use the official campus parking map to locate available parking spots and understand lot designations and restrictions.",
            icon: <FaMapMarkedAlt className="w-8 h-8" />,
            link: "https://www.stonybrook.edu/mobility-and-parking/#"
        }
    ];

    // Check if user is admin
    const isAdmin = user?.userType === 'admin';

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
                            <FaUniversity className="w-8 h-8" />
                        </span>
                    </div>
                    <h1 className={`text-4xl md:text-5xl font-bold mb-4 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        About <span className="text-red-600">P4SBU</span>
                    </h1>
                    <p className={`text-xl md:text-2xl max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Modernizing parking management at Stony Brook University
                    </p>
                    <div className="mt-6">
                        <a
                            href="https://www.stonybrook.edu/mobility-and-parking/#"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${darkMode ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-red-600 text-white hover:bg-red-700'}`}
                        >
                            Visit Official SBU Parking Website <FaExternalLinkAlt className="ml-2" />
                        </a>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 mb-16">
                {/* Left column - Mission */}
                <div className="lg:w-1/2">
                    <div className={`rounded-2xl shadow-lg overflow-hidden transform transition-all duration-500 hover:shadow-xl ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="relative h-64 bg-gradient-to-r from-red-600 to-red-400">
                            <div className="absolute inset-0 p-8 text-white flex flex-col justify-end bg-black bg-opacity-20">
                                <h2 className="text-2xl font-bold mb-2">Our Mission</h2>
                                <p className="text-lg opacity-90">Revolutionizing the campus parking experience</p>
                            </div>
                        </div>

                        <div className="p-8">
                            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
                                P4SBU (Parking for Stony Brook University) is dedicated to providing efficient parking management solutions for the Stony Brook University community. Our goal is to streamline the parking experience through innovative technology and user-centered design, making it easier for students, faculty, and visitors to find, reserve, and pay for parking spaces across campus.
                            </p>

                            <div className="mt-6">
                                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'} flex items-center`}>
                                    <FaInfoCircle className="flex-shrink-0 mr-2" />
                                    This project is designed to complement the official <a href="https://www.stonybrook.edu/mobility-and-parking/#" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Mobility & Parking Services</a> at Stony Brook University.
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

                {/* Right column - History */}
                <div className="lg:w-1/2">
                    <div className={`rounded-2xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8 relative">
                            {/* Decorative accent */}
                            <div className="absolute top-0 right-0 h-1 w-24 bg-gradient-to-l from-red-600 to-red-400"></div>

                            <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Our History
                            </h2>

                            <p className={`mb-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg`}>
                                Founded in January 2025 as part of the CSE 416 Software Engineering class at Stony Brook University, P4SBU emerged from a student-led initiative to address campus parking challenges. Recognizing the frustration caused by limited parking availability and outdated management systems, a team of computer science students collaborated to develop a modern solution that leverages technology to optimize parking resources and enhance the user experience for the entire campus community.
                            </p>

                            <div className="space-y-4 mt-8">
                                <div className="flex items-start gap-3">
                                    <div className="rounded-full p-2 bg-red-100 text-red-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Student-Led Initiative</h3>
                                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Created by students who understand campus parking challenges firsthand.</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="rounded-full p-2 bg-blue-100 text-blue-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Technological Innovation</h3>
                                        <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Leveraging modern technology to create an efficient parking ecosystem.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="mt-16">
                <h3 className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    SBU Parking Resources
                </h3>
                <p className={`mt-3 max-w-2xl mx-auto text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Learn about official Stony Brook University parking services
                </p>

                <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {features.map((feature, index) => (
                        <a
                            key={index}
                            href={feature.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${darkMode
                                ? 'bg-gray-800 border border-gray-700'
                                : 'bg-white border border-gray-100'
                                }`}
                        >
                            <div className="flex items-center justify-center mb-4">
                                <div className={`p-3 rounded-xl ${darkMode
                                    ? 'bg-red-900/30 text-red-400'
                                    : 'bg-red-50 text-red-600'
                                    }`}>
                                    {feature.icon}
                                </div>
                            </div>
                            <h4 className={`text-lg font-medium text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                {feature.title}
                            </h4>
                            <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {feature.description}
                            </p>
                            <div className="mt-4 text-center">
                                <span className={`inline-flex items-center text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                    Learn more <FaExternalLinkAlt className="ml-1 w-3 h-3" />
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Team/Join Us Section - hide for admin users */}
            {!isAdmin && (
                <div className="mt-16">
                    <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                        <div className="p-8">
                            <h3 className={`text-2xl font-bold text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Join Our Team
                            </h3>
                            <p className={`mt-2 text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Interested in contributing to the future of campus parking?
                            </p>

                            <div className="mt-8 max-w-3xl mx-auto">
                                <div className={`p-6 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                    <p className={`text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                        P4SBU is looking for passionate individuals to join our team. Whether you're a developer, designer, or have ideas to improve campus parking, we want to hear from you.
                                    </p>
                                    <div className="mt-6 text-center">
                                        <Link
                                            to="/contact-us"
                                            className={`inline-flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-md transform transition-all hover:-translate-y-1 hover:shadow-lg ${darkMode
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-red-600 hover:bg-red-700'
                                                }`}
                                        >
                                            Contact Us
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AboutUs; 