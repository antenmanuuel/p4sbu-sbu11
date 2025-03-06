import React from 'react';
import { FaParking, FaRoad, FaClipboardList, FaMapMarkedAlt } from 'react-icons/fa';

const AboutUs = ({ darkMode }) => {
    const features = [
        {
            title: "Smart Parking Management",
            description: "P4SBU offers multiple parking options for Stony Brook University students, faculty, and staff. With almost 6,000 student parking spaces, we provide various options for budget and convenience.",
            icon: <FaParking className="w-8 h-8" />
        },
        {
            title: "Campus Integration",
            description: "Our system is fully integrated with the walkable and bike-friendly campus infrastructure and SBU Transit, giving our users numerous transit options.",
            icon: <FaRoad className="w-8 h-8" />
        },
        {
            title: "Permit Management",
            description: "Student permits are issued by semester on a first-come, first-served basis. Faculty and staff permits are available for annual purchase. All permits use virtual permitting technology.",
            icon: <FaClipboardList className="w-8 h-8" />
        },
        {
            title: "Location Services",
            description: "Our system uses license plate recognition technology to verify parking assignments and help users locate available parking spots efficiently.",
            icon: <FaMapMarkedAlt className="w-8 h-8" />
        }
    ];

    return (
        <div className={`py-12 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-gray-900'} sm:text-4xl`}>
                        About P4SBU
                    </h2>
                    <p className={`mt-4 max-w-2xl mx-auto text-xl ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                        Modernizing parking management at Stony Brook University
                    </p>
                </div>

                <div className="mt-12">
                    <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="px-6 py-8 sm:p-10">
                            <div className="text-center">
                                <h3 className={`text-2xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Our Mission
                                </h3>
                                <div className={`mt-4 flex items-baseline text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <p className="text-left">
                                        P4SBU (Parking for Stony Brook University) is dedicated to providing efficient parking management solutions for the Stony Brook University community. Our goal is to streamline the parking experience through innovative technology and user-centered design, making it easier for students, faculty, and visitors to find, reserve, and pay for parking spaces across campus.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <div className="grid gap-8 md:grid-cols-2">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'}`}
                            >
                                <div className="flex items-center">
                                    <div className={`rounded-md p-3 ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`}>
                                        {feature.icon}
                                    </div>
                                    <h3 className="ml-4 text-xl font-medium">{feature.title}</h3>
                                </div>
                                <p className={`mt-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <div className={`rounded-lg shadow-lg overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="px-6 py-8 sm:p-10">
                            <div className="text-center">
                                <h3 className={`text-2xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Our History
                                </h3>
                                <div className={`mt-4 flex items-baseline text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    <p className="text-left">
                                        Founded in 2023, P4SBU emerged from a student-led initiative to address parking challenges at Stony Brook University. Recognizing the frustration caused by limited parking availability and outdated management systems, a team of computer science students collaborated to develop a modern solution that leverages technology to optimize parking resources and enhance the user experience for the entire campus community.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <h3 className={`text-2xl font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Join us in revolutionizing campus parking
                    </h3>
                    <p className={`mt-4 max-w-2xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        P4SBU is committed to continuous improvement and innovation. We welcome feedback from the Stony Brook community as we work to create a more efficient and sustainable parking ecosystem.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AboutUs; 