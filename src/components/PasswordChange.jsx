import { useState } from 'react';
import { auth, db } from '../firebase/firebase';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import './PasswordChange.css';

export default function PasswordChange({ onComplete }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate passwords
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No user is currently signed in');
      }

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update firstLogin flag in Firestore
      const userDocRef = doc(db, 'faculty', user.uid);
      await updateDoc(userDocRef, {
        firstLogin: false
      });

      // Call the completion callback
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error updating password:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-change-container">
      <div className="password-change-card">
        <h2>Change Your Password</h2>
        <p>Please set a new password for your account.</p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
} 