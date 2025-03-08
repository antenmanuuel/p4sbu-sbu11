import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Footer from './components/Footer.jsx';
import Register from './pages/Register.jsx';
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
import FindParking from './pages/FindParking.jsx';
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

  const login = (email, password) => {

    if (password && password.length > 0) {
      let userType = 'student';
      let firstName = 'John';
      let lastName = 'Doe';

      if (email.includes('admin')) {
        userType = 'admin';
        firstName = 'Admin';
        lastName = 'User';
      } else if (email.includes('faculty')) {
        userType = 'faculty';
        firstName = 'Faculty';
        lastName = 'Member';
      }

      setIsAuthenticated(true);
      setUser({
        firstName: firstName,
        lastName: lastName,
        email: email,
        id: '12345678',
        userType: userType,
        phone: '(631) 555-1234'
      });
      return true;
    }
    return false;
  };

  // Mock logout function
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        setIsAuthenticated(true);
        setUser({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@stonybrook.edu',
          id: '12345678',
          userType: 'student',
          phone: '(631) 555-1234'
        });
      }
    };

    checkAuth();
  }, []);

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
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
                <AboutUs darkMode={darkMode} />
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
          path="/admin-dashboard"
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default AppContent;