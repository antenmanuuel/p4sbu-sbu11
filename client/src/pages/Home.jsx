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
      title: "Appeal a citation",
      description: "File an appeal for a citation",
      route: "/appeal",
      icon: "A"
    }
  ];

  // Parking options data
  const parkingOptions = [
    {
      title: "Commuter Core - Students",
      price: "$155.00/semester",
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
    }
  ];

  // Handle quick link click
  const handleQuickLinkClick = () => {
    // All quick links should go to under-construction page for now
    navigate('/under-construction');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Section */}
      <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-xl mb-16">
        {/* Background gradient */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
          style={{
            backgroundImage: "linear-gradient(to bottom right, rgba(30,58,138,0.9), rgba(55,48,163,0.95)), url('https://www.stonybrook.edu/commcms/campres/_images/campus/quad_arial.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center"
          }}
        ></div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col items-start justify-center px-8 md:px-12 text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tighter text-balance animate-slideInUp">
            SBU Parking Made Simple
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl text-white/90 animate-slideInUp" style={{ animationDelay: '0.1s' }}>
            Find, reserve, and manage your parking spots efficiently with our streamlined platform
          </p>
          <div className="flex flex-wrap gap-4 animate-slideInUp" style={{ animationDelay: '0.2s' }}>
            {/* Show appropriate buttons based on user authentication status and type */}

            {/* Find Parking button - show for anyone except admin users */}
            {(!isAuthenticated || (isAuthenticated && user?.userType !== 'admin')) && (
              <button
                onClick={() => {
                  console.log('Navigating to Find Parking');
                  navigate('/find-parking');
                }}
                className="px-6 py-3 text-base font-medium bg-red-600 text-white rounded-md shadow-lg hover:bg-red-700 hover:shadow-xl transition-all"
              >
                Find Parking
              </button>
            )}

            {/* Create Account button - show only for not logged in users */}
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className={`px-6 py-3 text-base font-medium rounded-md transition-all ${darkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-900 hover:bg-gray-100'
                  } shadow-lg hover:shadow-xl`}
              >
                Create Account
              </button>
            )}

            {/* Admin Dashboard button - only for admin users */}
            {isAuthenticated && user?.userType === 'admin' && (
              <button
                onClick={() => navigate('/admin-dashboard')}
                className="px-6 py-3 text-base font-medium bg-blue-600 text-white rounded-md shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all"
              >
                Go to Admin Dashboard
              </button>
            )}

            {/* Faculty Dashboard button - only for faculty users */}
            {isAuthenticated && user?.userType === 'faculty' && (
              <button
                onClick={() => navigate('/faculty-dashboard')}
                className="px-6 py-3 text-base font-medium bg-green-600 text-white rounded-md shadow-lg hover:bg-green-700 hover:shadow-xl transition-all"
              >
                Go to Faculty Dashboard
              </button>
            )}

            {/* Student Dashboard button - only for student users */}
            {isAuthenticated && user?.userType === 'student' && (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 text-base font-medium bg-indigo-600 text-white rounded-md shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
              >
                Go to Student Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Links Section */}
      <div className="mb-16">
        <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Quick Links
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickLinks.map((link, index) => (
            <div
              key={index}
              onClick={() => handleQuickLinkClick(link.route)}
              className={`group flex flex-col h-full rounded-xl p-6 shadow-sm cursor-pointer transition-all duration-300 ${darkMode
                ? 'bg-gray-800 border border-gray-700 hover:bg-gray-750'
                : 'bg-white border border-gray-100 hover:border-gray-200 hover:shadow-md'
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
              <div className={`mt-auto pt-4 text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'
                } flex items-center`}>
                <span className="group-hover:underline">Access {link.title.toLowerCase()}</span>
                <svg className="ml-2 size-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parking Options Section */}
      <div className="mb-16">
        <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Parking Options
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {parkingOptions.map((option, index) => (
            <div
              key={index}
              className={`group h-full rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${darkMode ? 'shadow-gray-800' : ''
                }`}
            >
              <div className={`h-40 ${option.color} flex items-center justify-center text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    className={`text-sm font-medium ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'
                      }`}
                    onClick={() => navigate('/under-construction')}
                  >
                    View details
                  </button>
                </div>
              </div>
            </div>
          ))}
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
            <div className={`flex flex-col items-center text-center`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Save Time
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Quickly find and reserve parking spots without circling the campus
              </p>
            </div>
            <div className={`flex flex-col items-center text-center`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Secure Platform
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Your payment and personal information are always protected
              </p>
            </div>
            <div className={`flex flex-col items-center text-center`}>
              <div className={`size-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-600'
                }`}>
                <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                24/7 Support
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Our team is always available to help with any parking-related issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
