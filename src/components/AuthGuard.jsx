import { Navigate } from 'react-router-dom';
import { useUser } from './UserContext';

// Protect admin routes
export function AdminRoute({ children }) {
  const { currentUser, userRoles, loading } = useUser();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (!userRoles.isAdmin) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Protect faculty routes
export function FacultyRoute({ children }) {
  const { currentUser, loading } = useUser();
  
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  return children;
}