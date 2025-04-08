import React, { createContext, useState, useContext, useEffect } from 'react';
import { getCurrentUser, getCurrentSession, signIn, signUp, signOut } from '../services/supabaseClient';

// Create the context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize: check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      try {
        setLoading(true);
        setError(null);

        // First check if there's an active session
        const { data: sessionData, error: sessionError } = await getCurrentSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!sessionData.session) {
          setUser(null);
          return;
        }

        // If there's a session, get the user details
        const { user: currentUser, error: userError } = await getCurrentUser();
        
        if (userError) {
          throw userError;
        }
        
        setUser(currentUser);
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err.message);
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    checkUser();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signInError } = await signIn(email, password);
      
      if (signInError) {
        throw signInError;
      }
      
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: signUpError } = await signUp(email, password);
      
      if (signUpError) {
        throw signUpError;
      }
      
      setUser(data.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      const { error: signOutError } = await signOut();
      
      if (signOutError) {
        throw signOutError;
      }
      
      setUser(null);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    initialized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};