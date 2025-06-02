import { createContext, useState, useEffect, useContext } from "react";
import { auth } from "../firebase/firebase";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRoles, setUserRoles] = useState({ isAdmin: false });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get the ID token to check for custom claims
        const idTokenResult = await user.getIdTokenResult();
        
        // Set user roles based on custom claims
        setUserRoles({
          isAdmin: !!idTokenResult.claims.admin,
          isFaculty: !!idTokenResult.claims.faculty
        });
      } else {
        setUserRoles({ isAdmin: false, isFaculty: false });
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRoles,
    loading
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}