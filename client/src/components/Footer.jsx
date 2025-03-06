import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaMapMarkerAlt, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';

const Footer = ({ darkMode }) => {
  return (
    <footer className={`border-t ${darkMode ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-white text-gray-700 border-gray-200'}`}>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-lg font-semibold mb-4">About P4SBU</h2>
            <p className="text-sm">
              P4SBU (Parking for Stony Brook University) provides efficient parking management solutions for the Stony Brook University community.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Home</Link>
              </li>
              <li>
                <Link to="/about-us" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>About Us</Link>
              </li>

              <li>
                <Link to="/contact-us" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Resources</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/under-construction" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Parking Rules</Link>
              </li>
              <li>
                <Link to="/under-construction" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Campus Map</Link>
              </li>
              <li>
                <Link to="/under-construction" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Permit Types</Link>
              </li>
              <li>
                <Link to="/under-construction" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>Citations</Link>
              </li>

            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Contact Us</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start">
                <FaMapMarkerAlt className="mt-1 mr-2" />
                <span>100 Nicolls Rd, Stony Brook, NY 11794</span>
              </li>
              <li className="flex items-center">
                <FaPhone className="mr-2" />
                <span>(631) 632-6000</span>
              </li>
              <li className="flex items-center">
                <FaEnvelope className="mr-2" />
                <a href="/contact-us" className={`${darkMode ? 'hover:text-white' : 'hover:text-gray-900'}`}>
                  parking@stonybrook.edu
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t text-sm text-center">
          <p className={`${darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
            &copy; {new Date().getFullYear()} P4SBU - Parking for Stony Brook University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;