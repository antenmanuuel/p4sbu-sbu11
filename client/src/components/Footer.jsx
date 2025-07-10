import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaHeart } from 'react-icons/fa';

const Footer = ({ darkMode }) => {
  return (
    <footer className={`border-t shadow-sm ${darkMode ? 'bg-gray-900 text-gray-300 border-gray-800' : 'bg-white text-gray-700 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Top decorative bar with gradient */}
        <div className="relative mb-8">
          <div className="h-1 bg-gradient-to-r from-red-600 to-red-400 rounded-full w-24 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About P4SBU</h2>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              P4SBU (Parking for Stony Brook University) provides efficient parking management solutions for the Stony Brook University community.
            </p>
          </div>

          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Quick Links</h2>
            <ul className="space-y-2">
              <li>
                <Link to="/" className={`text-sm flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors duration-300`}>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about-us" className={`text-sm flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors duration-300`}>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact-us" className={`text-sm flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors duration-300`}>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/find-parking" className={`text-sm flex items-center ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors duration-300`}>
                  <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-2"></span>
                  Find Parking
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Contact Us</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <FaMapMarkerAlt className={`mt-1 mr-3 text-red-600 flex-shrink-0`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>100 Nicolls Rd, Stony Brook, NY 11794</span>
              </li>
              <li className="flex items-center">
                <FaPhone className={`mr-3 text-red-600 flex-shrink-0`} />
                <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>(631) 632-6000</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className={`mr-3 text-red-600 flex-shrink-0`} />
                <a href="mailto:parking@stonybrook.edu" className={`text-sm ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-red-600'} transition-colors duration-300`}>
                  parking@stonybrook.edu
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t text-sm text-center">
          <p className={`${darkMode ? 'border-gray-800 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
            &copy; {new Date().getFullYear()} P4SBU - Parking for Stony Brook University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;