import React from 'react';
import { FaTools, FaChevronLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const UnderConstruction = ({ darkMode }) => {
    const navigate = useNavigate();

    return (
        <div className={`flex flex-col items-center justify-center min-h-[80vh] px-4 py-12 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className={`w-full max-w-md p-8 mx-auto text-center rounded-xl shadow-lg animate-slideInUp ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <FaTools className={`w-24 h-24 animate-spin-slow ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className={`w-12 h-12 rounded-full border-4 border-opacity-25 ${darkMode ? 'border-blue-400' : 'border-blue-500'}`}></div>
                        </div>
                    </div>
                </div>

                <h1 className={`mb-4 text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    Under Construction
                </h1>

                <p className={`mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    We're working hard to bring you this feature. Please check back soon!
                </p>

                <div className="mb-6">
                    <div className={`w-full h-3 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div className={`h-3 rounded-full w-2/3 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                    </div>
                    <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estimated completion: 66%</p>
                </div>

                <button
                    onClick={() => navigate(-1)}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${darkMode
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                >
                    <FaChevronLeft className="mr-2" />
                    Go Back
                </button>
            </div>
        </div>
    );
};

export default UnderConstruction; 