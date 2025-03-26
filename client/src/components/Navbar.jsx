import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaEnvelope, FaUser, FaCog, FaSignOutAlt, FaUserShield, FaInfoCircle, FaParking } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';

// Navbar Component
const Navbar = ({ darkMode, setDarkMode, isAuthenticated, user, logout }) => {
  const [activeLink, setActiveLink] = useState('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Set active link based on current path
  useEffect(() => {
    if (location.pathname === '/') {
      setActiveLink('Home');
    } else if (location.pathname === '/dashboard') {
      setActiveLink('Dashboard');
    } else if (location.pathname === '/admin-dashboard') {
      setActiveLink('Admin Dashboard');
    } else if (location.pathname === '/faculty-dashboard') {
      setActiveLink('Faculty Dashboard');
    } else if (location.pathname === '/about-us') {
      setActiveLink('About Us');
    } else if (location.pathname === '/contact-us') {
      setActiveLink('Contact Us');
    } else if (location.pathname === '/find-parking') {
      setActiveLink('Find Parking');
    }
  }, [location.pathname]);

  // Click event handler for outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the dropdown
      const dropdown = document.getElementById('profile-dropdown');
      const button = document.getElementById('profile-button');
      if (isProfileDropdownOpen &&
        dropdown &&
        button &&
        !dropdown.contains(event.target) &&
        !button.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };

    // Add event listener when dropdown is open
    if (isProfileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen]);

  const handleLogout = () => {
    logout && logout();
    navigate('/');
    setIsProfileDropdownOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);

    // Check if search query matches about or contact us
    const query = searchQuery.toLowerCase();
    if (query.includes('about')) {
      navigate('/about-us');
    } else if (query.includes('contact')) {
      navigate('/contact-us');
    } else {
      navigate('/under-construction');
    }
  };

  const handleLinkClick = (linkName, path) => {
    console.log('Link clicked:', linkName, 'Path:', path);
    setActiveLink(linkName);
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  // Handle logo click based on user type - but no auto-redirect
  const handleLogoClick = (e) => {
    e.preventDefault(); // Prevent default button behavior
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  // Dynamic navigation links based on user type
  const navLinks = useMemo(() => {
    const links = [];

    // Add Home link for all users
    links.push({ name: 'Home', path: '/', icon: <FaHome className="mr-2" /> });

    // Add Find Parking link for all users except admins
    if (!isAuthenticated || user?.userType !== 'admin') {
      links.push({ name: 'Find Parking', path: '/find-parking', icon: <FaParking className="mr-2" /> });
    }

    // Add About Us and Contact Us links for all users
    links.push({ name: 'About Us', path: '/about-us', icon: <FaInfoCircle className="mr-2" /> });
    links.push({ name: 'Contact Us', path: '/contact-us', icon: <FaEnvelope className="mr-2" /> });

    // Add appropriate Dashboard link for authenticated users
    if (isAuthenticated) {
      if (user?.userType === 'admin') {
        links.push({
          name: 'Admin Dashboard',
          path: '/admin-dashboard',
          icon: <FaUserShield className="mr-2" />
        });
      } else if (user?.userType === 'faculty') {
        links.push({
          name: 'Faculty Dashboard',
          path: '/faculty-dashboard',
          icon: <MdDashboard className="mr-2" />
        });
      } else {
        // For student or other user types
        links.push({
          name: 'Dashboard',
          path: '/dashboard',
          icon: <MdDashboard className="mr-2" />
        });
      }
    }

    return links;
  }, [isAuthenticated, user]);

  return (
    <nav
      className={`sticky top-0 z-50 w-full border-b ${darkMode
        ? 'bg-gray-900 border-gray-800 text-white'
        : 'bg-white border-gray-100 text-gray-900'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              className="flex items-center gap-2 font-bold text-xl transition-transform hover:opacity-90 active:scale-95"
              onClick={handleLogoClick}
              aria-label="Homepage"
              type="button"
            >
              <div className="size-9 bg-red-600 rounded-md flex items-center justify-center text-white font-semibold shadow-sm">
                P
              </div>
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>P4SBU</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-3 py-2 rounded-md font-medium text-sm flex items-center transition-colors duration-200 ${activeLink === link.name
                  ? 'text-red-600'
                  : darkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                onClick={() => handleLinkClick(link.name, link.path)}
              >
                {link.icon}
                {link.name}
                {activeLink === link.name && (
                  <span className="absolute bottom-0 left-0 right-0 mx-auto w-1/2 h-0.5 bg-red-600 rounded-full"></span>
                )}
              </Link>
            ))}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Search Bar - Moved next to dark mode toggle */}
            <div className="hidden md:flex">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <input
                    type="text"
                    className={`w-44 pl-9 pr-3 py-1.5 text-sm rounded-md ${darkMode
                      ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500'
                      : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                      } border focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors`}
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                    <svg
                      className={`size-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </form>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              className={`size-9 inline-flex justify-center items-center rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${darkMode
                ? 'bg-gray-800 text-yellow-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              onClick={() => setDarkMode && setDarkMode(!darkMode)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? (
                <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="size-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  id="profile-button"
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                    }`}
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  aria-expanded={isProfileDropdownOpen}
                  aria-haspopup="true"
                >
                  <div className={`size-8 rounded-full flex items-center justify-center bg-blue-600 text-white`}>
                    {user?.firstName?.charAt(0) || 'U'}
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}</span>
                    <span className="text-xs opacity-75">{user?.userType === 'student' ? 'Student' : user?.userType || 'User'}</span>
                  </div>
                  <svg className="size-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isProfileDropdownOpen && (
                  <div
                    id="profile-dropdown"
                    className={`absolute right-0 mt-2 w-60 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[1000] ${darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                  >
                    <div className="p-3 border-b border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className={`size-12 rounded-full flex items-center justify-center bg-blue-600 text-white text-xl font-semibold`}>
                          {user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex flex-col">
                          <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                          </p>
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {user?.email || 'user@example.com'}
                          </p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            ID: {user?.sbuId || user?._id || '12345678'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        to="/profile"
                        className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        role="menuitem"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <FaUser className="mr-2" />
                          Your Profile
                        </div>
                      </Link>
                      <Link
                        to="/settings"
                        className={`block px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        role="menuitem"
                        onClick={() => setIsProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center">
                          <FaCog className="mr-2" />
                          Settings
                        </div>
                      </Link>
                      <button
                        className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        role="menuitem"
                        onClick={handleLogout}
                      >
                        <div className="flex items-center">
                          <FaSignOutAlt className="mr-2" />
                          Sign out
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/register"
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  Register
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              className={`md:hidden inline-flex items-center justify-center size-9 rounded-md ${darkMode ? 'text-gray-200 hover:bg-gray-800' : 'text-gray-700 hover:bg-gray-100'
                }`}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`md:hidden ${darkMode ? 'bg-gray-900' : 'bg-white'} border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} z-[1000]`}>
          {/* User info if authenticated - for mobile */}
          {isAuthenticated && (
            <div className="px-4 py-3 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-full flex items-center justify-center bg-blue-600 text-white font-semibold`}>
                  {user?.firstName?.charAt(0) || 'U'}
                </div>
                <div className="flex flex-col">
                  <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'User'}
                  </p>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user?.email || 'user@example.com'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Search Bar */}
          <div className="px-4 py-3">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type="text"
                  className={`w-full pl-9 pr-3 py-1.5 text-sm rounded-md ${darkMode
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-red-500'
                    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-red-500'
                    } border focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors`}
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg
                    className={`size-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </form>
          </div>

          <div className="space-y-1 px-4 py-3">
            {navLinks.map(link => (
              <button
                key={link.name}
                type="button"
                className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${activeLink === link.name
                  ? 'text-red-600 bg-red-50 dark:bg-gray-800'
                  : darkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                onClick={() => handleLinkClick(link.name, link.path)}
              >
                {link.icon}
                {link.name}
              </button>
            ))}

            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${darkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => {
                    navigate('/profile');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FaUser className="mr-2" />
                  Profile
                </button>
                <button
                  type="button"
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium ${darkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  onClick={() => {
                    navigate('/settings');
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FaCog className="mr-2" />
                  Settings
                </button>
                <button
                  type="button"
                  className={`flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-red-600 ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-red-50'
                    }`}
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <FaSignOutAlt className="mr-2" />
                  Sign out
                </button>
              </>
            ) : (
              <div className="flex flex-col space-y-2 mt-4 px-3">
                <Link
                  to="/login"
                  className="w-full py-2 text-sm font-medium text-center text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors shadow-sm"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className={`w-full py-2 text-sm font-medium text-center rounded-md transition-colors ${darkMode
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
