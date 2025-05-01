import { useState } from "react";
import { auth, db } from "../firebase/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Request form states
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPassword, setReqPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("Full-time");
  const [requestSuccess, setRequestSuccess] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.reload();
    } catch (err) {
      setError("Invalid email or password.");
    }
  };

  const handleRequestAccount = async (e) => {
    e.preventDefault();
    if (reqPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    try {
      await addDoc(collection(db, "facultyRequests"), {
        name: reqName,
        email: reqEmail,
        password: reqPassword, // You might want to hash this later
        status: status,
        requestDate: new Date(),
      });
      setRequestSuccess("Account request submitted successfully!");
      setReqName("");
      setReqEmail("");
      setReqPassword("");
      setConfirmPassword("");
      setStatus("Full-time");
      setShowRequestForm(false);
    } catch (err) {
      console.error("Error submitting request:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {!showRequestForm ? (
          <>
            <div className="login-header">
              <h1>Faculty Login</h1>
              <p>Enter your credentials to access your account</p>
            </div>
            
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <input 
                  id="email"
                  type="email" 
                  className="input-field" 
                  placeholder="your.email@university.edu" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="password">Password</label>
                <input 
                  id="password"
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <button type="submit" className="submit-button">
                Sign In
              </button>
            </form>

            <span className="text-link" onClick={() => setShowRequestForm(true)}>
              Need an account? Request access
            </span>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>Request Faculty Access</h1>
              <p>Submit your information for approval</p>
            </div>

            {requestSuccess && <div className="success-message">{requestSuccess}</div>}
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleRequestAccount}>
              <div className="input-group">
                <label htmlFor="fullName">Full Name</label>
                <input 
                  id="fullName"
                  type="text" 
                  className="input-field" 
                  placeholder="Dr. Jane Smith" 
                  value={reqName} 
                  onChange={(e) => setReqName(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="reqEmail">Email Address</label>
                <input 
                  id="reqEmail"
                  type="email" 
                  className="input-field" 
                  placeholder="your.email@university.edu" 
                  value={reqEmail} 
                  onChange={(e) => setReqEmail(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="reqPassword">Password</label>
                <input 
                  id="reqPassword"
                  type="password" 
                  className="input-field" 
                  placeholder="Create a secure password" 
                  value={reqPassword} 
                  onChange={(e) => setReqPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  id="confirmPassword"
                  type="password" 
                  className="input-field" 
                  placeholder="Confirm your password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="status">Faculty Status</label>
                <select 
                  id="status"
                  className="select-field" 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Visiting</option>
                </select>
              </div>
              
              <button type="submit" className="submit-button">
                Submit Request
              </button>
            </form>

            <span className="back-link" onClick={() => setShowRequestForm(false)}>
              Return to Login
            </span>
          </>
        )}
      </div>
    </div>
  );
}