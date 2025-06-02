import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./firebase/firebase";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import Sidebar from "./components/sidebar";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Faculty from "./pages/Faculty";
import Classrooms from "./pages/Classrooms";
import Courses from "./pages/Courses";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
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
      setUser(currentUser);
      
      if (currentUser) {
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "faculty", currentUser.uid));
        const userData = userDoc.data();
        setUserRole(userData?.role);
        
        // Check if password change is required
        if (userData && !userData.passwordChanged) {
          console.log("User needs to change password");
          setNeedsPasswordChange(true);
        } else {
          setNeedsPasswordChange(false);
        }
      } else {
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

  // If user needs to change password, show the Login component with password change view
  if (needsPasswordChange) {
    return <Login initialView="password_change" />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar userRole={userRole} />
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
