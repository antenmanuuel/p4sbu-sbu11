import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaEnvelope, FaUser, FaCog, FaSignOutAlt, FaUserShield, FaInfoCircle, FaParking, FaBell, FaCheck, FaTrash, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { NotificationService } from '../utils/api';

// Navbar Component
const Navbar = ({ darkMode, setDarkMode, isAuthenticated, user, logout }) => {
  const [activeLink, setActiveLink] = useState('Home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
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
      setActiveLink('Dashboard');
    } else if (location.pathname === '/about-us') {
      setActiveLink('About Us');
    } else if (location.pathname === '/contact-us') {
      setActiveLink('Contact Us');
    } else if (location.pathname === '/find-parking') {
      setActiveLink('Find Parking');
    }
  }, [location.pathname]);

  // Fetch notifications when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
    }
  }, [isAuthenticated, user]);

  // Fetch notifications 
  const fetchNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const result = await NotificationService.getNotifications(5, false, 0);
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const handleMarkAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const result = await NotificationService.markAsRead(notificationId);
      if (result.success) {
        // Update local state
        setNotifications(notifications.map(note =>
          note._id === notificationId ? { ...note, isRead: true } : note
        ));
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async (e) => {
    e.stopPropagation();
    try {
      const result = await NotificationService.markAllAsRead();
      if (result.success) {
        // Update local state
        setNotifications(notifications.map(note => ({ ...note, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const result = await NotificationService.deleteNotification(notificationId);
      if (result.success) {
        // Remove from local state
        const updatedNotifications = notifications.filter(note => note._id !== notificationId);
        setNotifications(updatedNotifications);

        // Update unread count if necessary
        const deletedNote = notifications.find(note => note._id === notificationId);
        if (deletedNote && !deletedNote.isRead) {
          setUnreadCount(prevCount => Math.max(0, prevCount - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    // If the notification has an action URL, navigate to it
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    // Mark as read if not already
    if (!notification.isRead) {
      NotificationService.markAsRead(notification._id);

      // Update local state
      setNotifications(notifications.map(note =>
        note._id === notification._id ? { ...note, isRead: true } : note
      ));
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    }

    // Close dropdown
    setIsNotificationsOpen(false);
  };

  // Click event handler for outside clicks to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the profile dropdown
      const profileDropdown = document.getElementById('profile-dropdown');
      const profileButton = document.getElementById('profile-button');
      if (isProfileDropdownOpen &&
        profileDropdown &&
        profileButton &&
        !profileDropdown.contains(event.target) &&
        !profileButton.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }

      // Check if the click is outside the notifications dropdown
      const notificationsDropdown = document.getElementById('notifications-dropdown');
      const notificationsButton = document.getElementById('notifications-button');
      if (isNotificationsOpen &&
        notificationsDropdown &&
        notificationsButton &&
        !notificationsDropdown.contains(event.target) &&
        !notificationsButton.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };

    // Add event listener when dropdowns are open
    if (isProfileDropdownOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileDropdownOpen, isNotificationsOpen]);

  const handleLogout = () => {
    logout && logout();
    navigate('/');
    setIsProfileDropdownOpen(false);
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

    // Add About Us link for all users
    links.push({ name: 'About Us', path: '/about-us', icon: <FaInfoCircle className="mr-2" /> });

    // Add Contact Us link only for non-admin users
    if (!isAuthenticated || user?.userType !== 'admin') {
      links.push({ name: 'Contact Us', path: '/contact-us', icon: <FaEnvelope className="mr-2" /> });
    }

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
          name: ' Dashboard',
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
      className={`sticky top-0 z-50 w-full border-b shadow-sm ${darkMode
        ? 'bg-gray-900 border-gray-800 text-white'
        : 'bg-white border-gray-100 text-gray-900'
        }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button
              className="flex items-center gap-2 font-bold text-xl transition-all duration-300 hover:opacity-90 active:scale-95"
              onClick={handleLogoClick}
              aria-label="Homepage"
              type="button"
            >
              <div className="size-9 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center text-white font-semibold shadow-md">
                P
              </div>
              <span className={`${darkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>
                P4<span className="text-red-600">SBU</span>
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.name}
                to={link.path}
                className={`relative px-3 py-2 rounded-md font-medium text-sm flex items-center transition-all duration-300 ${activeLink === link.name
                  ? 'text-red-600'
                  : darkMode
                    ? 'text-gray-200 hover:text-white hover:bg-gray-800'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
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


            {/* Notifications */}
            {isAuthenticated && user && (
              <div className="relative">
                <button
                  id="notifications-button"
                  className={`relative p-2 rounded-full ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  aria-expanded={isNotificationsOpen}
                  aria-haspopup="true"
                >
                  <FaBell className={`size-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex items-center justify-center size-5 text-xs font-bold text-white bg-red-600 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {isNotificationsOpen && (
                  <div
                    id="notifications-dropdown"
                    className={`absolute right-0 mt-2 w-80 origin-top-right rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-[1000] ${darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}
                  >
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto max-h-[350px]">
                      {isLoadingNotifications ? (
                        <div className="p-4 text-center text-gray-500">
                          <FaClock className="mx-auto mb-2 animate-pulse" />
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <FaBell className="mx-auto mb-2" />
                          No notifications
                        </div>
                      ) : (
                        <div>
                          {notifications.map(notification => (
                            <div
                              key={notification._id}
                              onClick={() => handleNotificationClick(notification)}
                              className={`p-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} cursor-pointer
                                ${!notification.isRead ? (darkMode ? 'bg-gray-700' : 'bg-blue-50') : ''} 
                                hover:${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`flex-shrink-0 rounded-full p-2 ${notification.type === 'fine'
                                  ? 'bg-red-100 text-red-600'
                                  : notification.type === 'permit'
                                    ? 'bg-yellow-100 text-yellow-600'
                                    : notification.type === 'reservation'
                                      ? 'bg-blue-100 text-blue-600'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                  {notification.type === 'fine' && <FaExclamationTriangle />}
                                  {notification.type === 'permit' && <FaParking />}
                                  {notification.type === 'reservation' && <FaClock />}
                                  {notification.type === 'system' && <FaInfoCircle />}
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {notification.title}
                                  </h4>
                                  <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                    {notification.message}
                                  </p>
                                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {new Date(notification.createdAt).toLocaleString()}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  {!notification.isRead && (
                                    <button
                                      onClick={(e) => handleMarkAsRead(notification._id, e)}
                                      className={`p-1 rounded-full hover:bg-${darkMode ? 'gray-600' : 'gray-200'}`}
                                      title="Mark as read"
                                    >
                                      <FaCheck className="size-3 text-green-500" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => handleDeleteNotification(notification._id, e)}
                                    className={`p-1 rounded-full hover:bg-${darkMode ? 'gray-600' : 'gray-200'}`}
                                    title="Delete notification"
                                  >
                                    <FaTrash className="size-3 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="p-2 border-t border-gray-700 text-center">
                      <Link
                        to="/notifications"
                        className={`text-sm ${darkMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
                        onClick={() => setIsNotificationsOpen(false)}
                      >
                        View all notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                            {user?.userType === 'visitor' ? 'Visitor ID: ' : 'SBU ID: '}{user?.sbuId || user?._id || '123456789'}
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
