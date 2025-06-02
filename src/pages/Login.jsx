import { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebase";
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  updatePassword,
  signOut
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import "./Login.css";

// View states enum
const VIEW = {
  LOGIN: 'login',
  PASSWORD_CHANGE: 'password_change',
  FORGOT_PASSWORD: 'forgot_password'
};

export default function Login({ initialView }) {
  // Current view state
  const [currentView, setCurrentView] = useState(initialView || VIEW.LOGIN);
  
  // Effect to handle initialView changes
  useEffect(() => {
    if (initialView) {
      setCurrentView(initialView);
    }
  }, [initialView]);

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Clear messages on view change
  useEffect(() => {
    setError("");
    setSuccess("");
  }, [currentView]);

  // Validation helpers
  const isValidSchoolId = (id) => /^\d{2}-\d{4}-\d{3}$/.test(id);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Set persistence if remember me is checked
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }
      
      // Format email from school ID or use provided email
      let loginEmail;
      if (isValidSchoolId(identifier)) {
        loginEmail = `${identifier}@school.edu`;
      } else if (isValidEmail(identifier)) {
        loginEmail = identifier;
      } else {
        throw new Error("Please enter a valid school ID (22-2222-222) or email address");
      }
      
      // Attempt login
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const user = userCredential.user;
      
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "faculty", user.uid));
      const userData = userDoc.data();
      
      if (!userData) {
        await signOut(auth);
        throw new Error("Account not found. Please contact administrator.");
      }

      // Check if password change is required
      if (!userData.passwordChanged) {
        console.log("Password change required. Redirecting to password change form.");
        setCurrentView(VIEW.PASSWORD_CHANGE);
        return; // Add return here to prevent navigation
      }
      
      // Only navigate to dashboard if password has been changed
      window.location.href = "/dashboard";
      
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.code === "auth/user-not-found" ? "No account found with these credentials." :
        err.code === "auth/wrong-password" ? "Incorrect password." :
        err.code === "auth/too-many-requests" ? "Too many attempts. Try again later." :
        err.message || "Login failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No active session");

      // Validate password
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      if (checkPasswordStrength(newPassword) < 4) {
        throw new Error("Password must include uppercase, lowercase, numbers, and special characters");
      }

      // Update password
      await updatePassword(user, newPassword);

      // Update Firestore flags
      const userDocRef = doc(db, "faculty", user.uid);
      await updateDoc(userDocRef, {
        passwordChanged: true,
        passwordLastChanged: new Date()
      });

      // Show success message
      setSuccess("Password changed successfully! Redirecting to dashboard...");
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 2000);

    } catch (err) {
      console.error("Password change error:", err);
      if (err.code === "auth/requires-recent-login") {
        await signOut(auth);
        setError("Session expired. Please sign in again.");
        setTimeout(() => setCurrentView(VIEW.LOGIN), 1500);
      } else {
        setError(err.message || "Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess("Password reset email sent! Check your inbox.");
      setTimeout(() => setCurrentView(VIEW.LOGIN), 3000);
    } catch (err) {
      setError(
        err.code === "auth/user-not-found" 
          ? "No account found with this email"
          : "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  // Login Form
  const renderLoginForm = () => (
    <>
      <div className="login-header">
        <h1>Faculty Login</h1>
        <p>Sign in to access the faculty portal</p>
      </div>
      
      {error && <div className="error-message">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>}
      
      {success && <div className="success-message">
        <CheckCircle2 size={18} />
        <span>{success}</span>
      </div>}

      <form onSubmit={handleLogin}>
        <div className="input-group">
          <label htmlFor="identifier">School ID or Email</label>
          <input 
            id="identifier"
            type="text" 
            className="input-field" 
            placeholder="Enter school ID (22-2222-222) or email" 
            value={identifier} 
            onChange={(e) => setIdentifier(e.target.value)} 
            required 
          />
          <small className="input-hint">Enter your school ID (22-2222-222) or email address</small>
        </div>
        
        <div className="input-group">
          <label htmlFor="password">Password</label>
          <div className="password-input-container">
            <input 
              id="password"
              type={showPassword ? "text" : "password"} 
              className="input-field" 
              placeholder="Enter your password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        
        <div className="form-options">
          <div className="remember-me">
            <input 
              type="checkbox" 
              id="remember" 
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)} 
            />
            <label htmlFor="remember">Remember me</label>
          </div>
          
          <button 
            type="button"
            className="forgot-password"
            onClick={() => setCurrentView(VIEW.FORGOT_PASSWORD)}
          >
            Forgot password?
          </button>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </>
  );

  // Password Change Form
  const renderPasswordChangeForm = () => (
    <>
      <div className="login-header">
        <h1>Change Your Password</h1>
        <p>You must change your password before continuing</p>
      </div>
      
      {error && <div className="error-message">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>}

      <form onSubmit={handlePasswordChange}>
        <div className="input-group">
          <label htmlFor="newPassword">New Password</label>
          <div className="password-input-container">
            <input 
              id="newPassword"
              type={showNewPassword ? "text" : "password"} 
              className="input-field" 
              placeholder="Enter new password" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              minLength={8}
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? "Hide" : "Show"}
            </button>
          </div>
          <small className="input-hint">
            Must be at least 8 characters with uppercase, lowercase, numbers, and special characters
          </small>
        </div>
        
        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <div className="password-input-container">
            <input 
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"} 
              className="input-field" 
              placeholder="Confirm new password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              required 
            />
            <button 
              type="button" 
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? "Changing Password..." : "Change Password"}
        </button>
      </form>
    </>
  );

  // Password Reset Form
  const renderPasswordResetForm = () => (
    <>
      <div className="login-header">
        <h2>Reset Password</h2>
        <p>Enter your email to receive a reset link</p>
      </div>

      {error && <div className="error-message">
        <AlertCircle size={18} />
        <span>{error}</span>
      </div>}
      
      {success && <div className="success-message">
        <CheckCircle2 size={18} />
        <span>{success}</span>
      </div>}

      <form onSubmit={handlePasswordReset}>
        <div className="input-group">
          <label htmlFor="resetEmail">Email Address</label>
          <input 
            id="resetEmail"
            type="email" 
            className="input-field" 
            placeholder="Enter your email address" 
            value={resetEmail} 
            onChange={(e) => setResetEmail(e.target.value)} 
            required 
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <button 
        className="back-button"
        onClick={() => setCurrentView(VIEW.LOGIN)}
      >
        <ArrowLeft size={18} />
        Back to Login
      </button>
    </>
  );

  return (
    <div className="login-container">
      <div className="login-card">
        {currentView === VIEW.PASSWORD_CHANGE && renderPasswordChangeForm()}
        {currentView === VIEW.FORGOT_PASSWORD && renderPasswordResetForm()}
        {currentView === VIEW.LOGIN && renderLoginForm()}
      </div>
    </div>
  );
}