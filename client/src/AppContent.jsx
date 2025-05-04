/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Footer from './components/Footer.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import AboutUs from './pages/AboutUs.jsx';
import ContactUs from './pages/ContactUs.jsx';
import UnderConstruction from './pages/UnderConstruction.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import FacultyDashboard from './pages/FacultyDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ManageUsers from './pages/admin/ManageUsers.jsx';
import ManagePermits from './pages/admin/ManagePermits.jsx';
import ManageLots from './pages/admin/ManageLots.jsx';
import ManagePermitTypes from './pages/admin/ManagePermitTypes.jsx';
import ContactSubmissions from './pages/admin/ContactSubmissions.jsx';
import FindParking from './pages/FindParking.jsx';
import Billing from './pages/Billing.jsx';
import PastReservations from './pages/PastReservations.jsx';
import PastCitations from './pages/PastCitations.jsx';
import PastPermits from './pages/PastPermits.jsx';
import ManageTickets from './pages/admin/ManageTickets';
import ManageReservations from './pages/admin/ManageReservations';
import ManageEventRequests from './pages/admin/ManageEventRequests';
import Notifications from './pages/Notifications.jsx';
import PaymentComplete from './components/PaymentComplete.jsx';
import InactivityTimer from './components/InactivityTimer.jsx';
import EventParkingRequest from './pages/faculty/EventParkingRequest.jsx';
import EventParkingRequests from './pages/faculty/EventParkingRequests.jsx';
import EventParkingDetail from './pages/faculty/EventParkingDetail.jsx';
import EventParkingConfirmation from './pages/faculty/EventParkingConfirmation.jsx';
import { AuthService, UserService } from './utils/api.js';

// Protected route component
const ProtectedRoute = ({ isAuthenticated, children, requiredUserType, user }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated, but save the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific user type is required and user doesn't match, redirect to home
  if (requiredUserType && user?.userType !== requiredUserType) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(1200000); // Default 20 minutes

  // Load inactivity timeout from localStorage if available
  useEffect(() => {
    const savedTimeout = localStorage.getItem('inactivityTimeout');
    if (savedTimeout) {
      setInactivityTimeout(parseInt(savedTimeout));
    }
  }, []);

  // Fetch user profile data from backend
  const fetchUserProfile = async () => {
    try {
      const result = await UserService.getProfile();
      if (result.success) {
        setUser(result.data.user);
      } else {
        console.error('Failed to fetch user profile:', result.error);
        // If profile fetch fails, log the user out
        logout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Real login function using AuthService
  const login = async (email, password, redirectPath = '/dashboard', reservationPending = false, rememberMe = false) => {
    try {
      console.log('Login attempt for:', email);
      const result = await AuthService.login({ email, password, rememberMe });

      if (result.success) {
        console.log('Login successful, result:', result.data);

        // Set authentication state
        setIsAuthenticated(true);

        // Set basic user info from login response
        setUser(result.data.user);
        console.log('User state set:', result.data.user);

        // Determine appropriate dashboard based on user type
        let dashboardRoute = '/dashboard'; // Default to student dashboard

        if (result.data.user.userType === 'admin') {
          dashboardRoute = '/admin-dashboard';
          console.log('Admin user detected, redirecting to admin dashboard');
        } else if (result.data.user.userType === 'faculty') {
          dashboardRoute = '/faculty-dashboard';
          console.log('Faculty user detected, redirecting to faculty dashboard');
        } else {
          console.log('Student user detected, redirecting to student dashboard');
        }

        // Use a more robust approach for redirection
        console.log('Starting redirection to:', dashboardRoute);

        // First update the state, then redirect after a brief delay
        setTimeout(() => {
          console.log('Executing redirect to:', dashboardRoute);
          // Use direct navigation to ensure the page reloads with the new auth state
          window.location.href = dashboardRoute;
        }, 300); // Slightly longer delay to ensure state updates

        return true;
      } else {
        console.error('Login failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Real logout function
  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Handle session timeout
  const handleSessionTimeout = () => {
    // Already handled by InactivityTimer component
    setIsAuthenticated(false);
    setUser(null);

    // Redirect to login page with timeout indicator
    window.location.href = '/login?expired=1';
  };

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      console.log('Checking authentication status...');
      const isAuth = AuthService.isAuthenticated();
      console.log('Auth check result:', isAuth);

      if (isAuth) {
        setIsAuthenticated(true);

        // Get basic user info from localStorage
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('User data loaded from localStorage:', currentUser);
        }

        // Fetch complete profile data
        await fetchUserProfile();
      } else {
        setIsAuthenticated(false);
        setUser(null);
        console.log('User not authenticated');
      }

      setLoading(false);
      console.log('Authentication check completed, loading:', false);
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Inactivity Timer */}
      <InactivityTimer
        darkMode={darkMode}
        isAuthenticated={isAuthenticated}
        onLogout={handleSessionTimeout}
        inactivityTimeout={inactivityTimeout}
      />

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <Home darkMode={darkMode} isAuthenticated={isAuthenticated} user={user} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <Login
                  darkMode={darkMode}
                  login={login}
                  setIsAuthenticated={setIsAuthenticated}
                />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <ForgotPassword darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <ResetPassword darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/reset-password"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <ResetPassword darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/register"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <Register darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/find-parking"
          element={
            <>
              {user?.userType === 'admin' ? (
                <Navigate to="/" replace />
              ) : (
                <>
                  <Navbar
                    darkMode={darkMode}
                    setDarkMode={setDarkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                    logout={logout}
                  />
                  <main className="flex-grow">
                    <FindParking
                      darkMode={darkMode}
                      isAuthenticated={isAuthenticated}
                    />
                  </main>
                  <Footer darkMode={darkMode} />
                </>
              )}
            </>
          }
        />
        <Route
          path="/under-construction"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <UnderConstruction darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/about-us"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <AboutUs darkMode={darkMode} user={user} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/faculty-dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <FacultyDashboard
                    darkMode={darkMode}
                    user={user}
                    isAuthenticated={isAuthenticated} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <StudentDashboard
                    darkMode={darkMode}
                    user={user}
                    isAuthenticated={isAuthenticated} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/past-reservations"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <PastReservations
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <AdminDashboard
                    darkMode={darkMode}
                    user={user}
                    isAuthenticated={isAuthenticated} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-submissions"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ContactSubmissions
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact-us"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <ContactUs darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <Profile darkMode={darkMode} user={user} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <Settings darkMode={darkMode} user={user} />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-users"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManageUsers
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-permits"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManagePermits
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/manage-lots"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManageLots
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <Billing
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/past-citations"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <PastCitations
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/past-permits"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <PastPermits
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tickets"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManageTickets
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/permit-types"
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              allowedRoles={['Admin']}
              userRole={user?.userType}
            >
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManagePermitTypes
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route // These routes (reservations, payment-complete, and notifications) utilize the same logic as the above, Initial was written by Student (TP: Initial code written by Student for these 3 routes processed and modified by ChatGPT for code readability/moduralizing/optimization)
          path="/admin/reservations" // (*ChatGPT has context of project*, was asked to modularize, optimize, and modify these 3 routes' code blocks for better readability, formatting, and concise logic. )
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManageReservations
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-complete"
          element={
            <>
              <Navbar
                darkMode={darkMode}
                setDarkMode={setDarkMode}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
              <main className="flex-grow">
                <PaymentComplete darkMode={darkMode} />
              </main>
              <Footer darkMode={darkMode} />
            </>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <Notifications
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/event-parking-request"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="faculty" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <EventParkingRequest
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/event-parking-requests"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="faculty" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <EventParkingRequests
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/event-parking/:requestId"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="faculty" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <EventParkingDetail
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/faculty/event-parking-confirmation"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="faculty" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <EventParkingConfirmation
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/event-requests"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated} requiredUserType="admin" user={user}>
              <>
                <Navbar
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                  isAuthenticated={isAuthenticated}
                  user={user}
                  logout={logout}
                />
                <main className="flex-grow">
                  <ManageEventRequests
                    darkMode={darkMode}
                    isAuthenticated={isAuthenticated}
                    user={user}
                  />
                </main>
                <Footer darkMode={darkMode} />
              </>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default AppContent;