import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/firebase";
import { useEffect, useState } from "react";
import { AdminSidebar, TeacherSidebar } from "./components/sidebar";
import PasswordChange from "./components/PasswordChange";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Faculty from "./pages/Faculty";
import Classrooms from "./pages/Classrooms";
import Courses from "./pages/Courses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AuthTest from "./components/AuthTest";
import api from "./api/axios";
import "./App.css";

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  
  return auth.currentUser ? children : <Navigate to="/login" />;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("🔄 Auth state changed:", currentUser ? `User ID: ${currentUser.uid}` : "No user");
      setUser(currentUser);
      
      if (currentUser) {
        console.log("🔍 Attempting to fetch user data from backend...");
        // Get user data from backend API
        try {
          const userProfileRes = await api.get(`/faculty/${currentUser.uid}`);
          const userData = userProfileRes.data;
          console.log("✅ User data from backend:", userData);
          setUserRole(userData?.role);
          // Check if password change is required
          if (userData && !userData.passwordChanged) {
            console.log("🔐 User needs to change password");
            setNeedsPasswordChange(true);
          } else {
            console.log("✅ User password already changed");
            setNeedsPasswordChange(false);
          }
        } catch (err) {
          console.error("❌ Error fetching user data:", err);
          console.error("❌ Error details:", {
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
          });
          setUserRole(null);
          setNeedsPasswordChange(false);
        }
      } else {
        console.log("👤 No user - clearing state");
        setUserRole(null);
        setNeedsPasswordChange(false);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }

  // If user needs to change password, show the PasswordChange component
  if (needsPasswordChange) {
    return <PasswordChange onComplete={async () => {
      // Update local state first
      setNeedsPasswordChange(false);
      
      // Wait a moment for the backend update to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Sign out and reload to ensure fresh state
      await auth.signOut();
      window.location.reload();
    }} />;
  }

  // Debug userRole before rendering sidebar
  console.log("userRole:", userRole);

  return (
    <Router>
      <div className="app-container">
        {userRole === "admin" ? <AdminSidebar /> : userRole === "teacher" ? <TeacherSidebar /> : null}
        <div className="main-content">
          <Routes>
            {/* All routes accessible to both admin and teacher */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/schedule" 
              element={
                <ProtectedRoute>
                  <Schedule />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/courses" 
              element={
                <ProtectedRoute>
                  <Courses />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/faculty" 
              element={
                <ProtectedRoute>
                  <Faculty />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/classrooms" 
              element={
                <ProtectedRoute>
                  <Classrooms />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              } 
            />

            {/* Test route for debugging */}
            <Route 
              path="/test" 
              element={
                <ProtectedRoute>
                  <AuthTest />
                </ProtectedRoute>
              } 
            />

            {/* Simple test route without authentication */}
            <Route 
              path="/test-public" 
              element={<AuthTest />}
            />

            {/* Error and unauthorized routes */}
            <Route 
              path="/unauthorized" 
              element={
                <div className="p-8">
                  <h1>Unauthorized Access</h1>
                  <p>You do not have permission to view this page.</p>
                </div>
              } 
            />
            <Route 
              path="*" 
              element={
                <div className="p-8">
                  <h1>404 - Page Not Found</h1>
                  <p>The page you are looking for does not exist.</p>
                </div>
              } 
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
