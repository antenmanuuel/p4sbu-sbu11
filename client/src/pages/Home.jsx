import React from "react";
import { useNavigate } from "react-router-dom";

const Home = ({ darkMode, isAuthenticated, user }) => {
  const navigate = useNavigate();

  // Quick Links data
  const quickLinks = [
    {
      title: "Purchase a permit",
      description: "Purchase a new parking permit",
      route: "/permit",
      icon: "P"
    },
    {
      title: "Manage citations",
      description: "Pay a citation or view history",
      route: "/citation",
      icon: "C"
    },
    {
      title: "Manage permits",
      description: "View or update your existing permits",
      route: "/permit",
      icon: "M"
    },
    {
      title: "View notifications",
      description: "Check all your system notifications",
      route: "/notifications",
      icon: "N"
    },
    {
      title: "Past reservations",
      description: "View your parking reservation history",
      route: "/past-reservations",
      icon: "R"
    },
    {
      title: "Billing information",
      description: "Manage payment methods and history",
      route: "/billing",
      icon: "B"
    },
    {
      title: "User profile",
      description: "Update your personal information",
      route: "/profile",
      icon: "U"
    },
    {
      title: "Event Parking",
      description: "Faculty-only special event parking requests",
      route: "/faculty/event-parking-request",
      icon: "E"
    }
  ];

  // Parking options data
  const parkingOptions = [
    {
      title: "Commuter Core - Students",
      price: "$135.00/semester",
      color: "bg-blue-600"
    },
    {
      title: "Commuter Satellite - Students",
      price: "$90.00/semester",
      color: "bg-green-500"
    },
    {
      title: "Commuter Perimeter - Students",
      price: "$0.00/semester",
      color: "bg-yellow-500"
    },
    {
      title: "Metered Lots",
      price: "$2.50/hour",
      color: "bg-purple-500"
    },
    {
      title: "EV Charging Lots",
      price: "$1.50/hour + parking fee",
      color: "bg-teal-500"
    },
    {
      title: "Faculty Permit - Faculty",
      price: "$50.05/semester",
      color: "bg-orange-500"
    }
  ];

  // Handle quick link click
  const handleQuickLinkClick = (route) => {
    navigate(route);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section with modern layout */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-12 mb-16">
        {/* Image container - left side on desktop, top on mobile */}
        <div className="lg:w-1/2 w-full">
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden shadow-xl transform transition-all duration-500 hover:scale-[1.02]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url('https://news.stonybrook.edu/wp-content/uploads/2023/12/fall-2023-sunset.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center"
              }}
            ></div>
            {/* Floating badge */}
            <div className="absolute top-6 left-6 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg animate-pulse">
              Stony Brook University
            </div>
          </div>
        </div>

        {/* Content container - right side on desktop, bottom on mobile */}
        <div className="lg:w-1/2 w-full">
          <div className="relative">
            {/* Decorative element */}
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-red-600 opacity-10 rounded-full blur-xl"></div>

            <h1 className={`text-4xl md:text-6xl font-bold mb-6 tracking-tighter leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-red-600 block">SBU Parking</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-400">Made Simple</span>
            </h1>

            <p className={`text-xl md:text-2xl mb-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Find, reserve, and manage your parking spots efficiently with our streamlined platform
            </p>

            <div className="flex flex-wrap gap-4">
              {/* Show appropriate buttons based on user authentication status and type */}

              {/* Find Parking button - show for anyone except admin users */}
              {(!isAuthenticated || (isAuthenticated && user?.userType !== 'admin')) && (
                <button
                  onClick={() => {
                    console.log('Navigating to Find Parking');
                    navigate('/find-parking');
                  }}
                  className="px-6 py-3 text-base font-medium bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Find Parking
                </button>
              )}

              {/* Create Account button - show only for not logged in users */}
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/register')}
                  className={`px-6 py-3 text-base font-medium rounded-md transition-all transform hover:-translate-y-1 ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'
                    } shadow-lg hover:shadow-xl`}
                >
                  Create Account
                </button>
              )}

              {/* Admin Dashboard button - only for admin users */}
              {isAuthenticated && user?.userType === 'admin' && (
                <button
                  onClick={() => navigate('/admin-dashboard')}
                  className="px-6 py-3 text-base font-medium bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Go to Admin Dashboard
                </button>
              )}

              {/* Faculty Dashboard button - only for faculty users */}
              {isAuthenticated && user?.userType === 'faculty' && (
                <button
                  onClick={() => navigate('/faculty-dashboard')}
                  className="px-6 py-3 text-base font-medium bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Go to Faculty Dashboard
                </button>
              )}

              {/* Student Dashboard button - only for student users */}
              {isAuthenticated && user?.userType === 'student' && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                  Go to Student Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section - New! */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-16 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        <div className={`p-8 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-sm transition-all hover:shadow-md`}>
          <div className="text-4xl font-bold text-red-600 mb-2">10,000+</div>
          <div className="text-sm opacity-70">Parking Spaces</div>
        </div>
        <div className={`p-8 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-sm transition-all hover:shadow-md`}>
          <div className="text-4xl font-bold text-red-600 mb-2">5,000+</div>
          <div className="text-sm opacity-70">Daily Users</div>
        </div>
        <div className={`p-8 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-sm transition-all hover:shadow-md`}>
          <div className="text-4xl font-bold text-red-600 mb-2">20+</div>
          <div className="text-sm opacity-70">Parking Lots</div>
        </div>
        <div className={`p-8 rounded-xl text-center ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} shadow-sm transition-all hover:shadow-md`}>
          <div className="text-4xl font-bold text-red-600 mb-2">24/7</div>
          <div className="text-sm opacity-70">Support Available</div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            What You Can Do Here
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks
            .filter(link =>
              // Filter out Event Parking for non-faculty users
              !(link.title === "Event Parking" && (!isAuthenticated || user?.userType !== "faculty"))
            )
            .map((link, index) => (
              <div
                key={index}
                className={`flex flex-col h-full rounded-xl p-6 shadow-sm ${darkMode
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-white border border-gray-100'
                  }`}
              >
                <div className="flex items-center mb-4">
                  <div className={`size-12 rounded-lg flex items-center justify-center mr-4 ${index % 4 === 0 ? 'bg-red-600' :
                    index % 4 === 1 ? 'bg-blue-600' :
                      index % 4 === 2 ? 'bg-green-600' :
                        'bg-purple-600'
                    } text-white font-bold text-lg`}>
                    {link.icon}
                  </div>
                  <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {link.title}
                  </h3>
                </div>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {link.description}
                </p>
              </div>
            ))}
        </div>
      </div>

      {/* Parking Options Section */}
      <div className="mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Parking Options
          </h2>
          <a href="https://www.stonybrook.edu/mobility-and-parking/#" target="_blank" rel="noopener noreferrer" className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'} hover:underline`}>View all permits →</a>
        </div>

        <div className="relative">
          {/* Decorative element */}
          <div className="hidden md:block absolute -bottom-10 right-10 w-40 h-40 bg-blue-500 opacity-5 rounded-full blur-2xl"></div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {parkingOptions.map((option, index) => (
              <div
                key={index}
                className={`h-full rounded-xl overflow-hidden shadow-sm ${darkMode ? 'shadow-gray-800' : 'shadow-sm'}`}
              >
                <div className={`h-40 ${option.color} flex items-center justify-center text-white relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <span className="relative z-10 text-3xl font-bold">
                    {option.title.split(" ")[0].charAt(0)}
                    {option.title.split(" ")[1]?.charAt(0)}
                  </span>
                </div>
                <div className={`p-5 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                  <h3 className={`text-base font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {option.title}
                  </h3>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {option.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className={`rounded-xl p-8 mb-16 ${darkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-50 border border-gray-100'
        }`}>
        <div className="max-w-3xl mx-auto">
          <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Why Choose P4SBU?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className={`flex flex-col items-center text-center transform transition-transform hover:scale-105`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Save Time
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Quickly find and reserve parking spots without circling the lot.
              </p>
            </div>

            <div className={`flex flex-col items-center text-center transform transition-transform hover:scale-105`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Easy to Use
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Our intuitive platform makes parking management simple for everyone.
              </p>
            </div>

            <div className={`flex flex-col items-center text-center transform transition-transform hover:scale-105`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Secure & Reliable
              </h3>
              <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Count on our system for safe, dependable parking management.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default Home;
