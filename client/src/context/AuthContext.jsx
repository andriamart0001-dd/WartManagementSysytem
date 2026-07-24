// =============================================================================
// AuthContext.jsx — Authentication State Management
// =============================================================================
// This React Context manages authentication state for the entire application.
// It tracks:
//   - user: Logged-in user object { id, fullName, email, role }
//   - token: JWT authentication string
//   - isAuthenticated: Boolean flag indicating if a valid user is logged in
//   - isLoading: Boolean flag indicating initial auth state verification
//
// It exports:
//   - AuthContext & AuthProvider component
//   - useAuth custom hook for clean access in components
// =============================================================================

import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { STORAGE_KEYS } from '../constants';

// Create the React Context
const AuthContext = createContext(null);

// -----------------------------------------------------------------------------
// AuthProvider Component
// -----------------------------------------------------------------------------
// Wraps the application tree and provides auth state + login/logout actions.
// -----------------------------------------------------------------------------
export const AuthProvider = ({ children }) => {
  // State variables
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ===========================================================================
  // INITIAL LOAD EFFECT
  // Checks localStorage on initial page load to restore an active session.
  // ===========================================================================
  useEffect(() => {
    // Read saved credentials from localStorage
    const savedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
    const savedUserJson = localStorage.getItem(STORAGE_KEYS.USER);

    try {
      if (savedToken && savedUserJson) {
        // Parse stored user JSON string
        const parsedUser = JSON.parse(savedUserJson);

        // Update state with restored session
        setToken(savedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error restoring session from localStorage:', error);
      // Clear corrupt data
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } finally {
      // Mark initial load check as finished
      setIsLoading(false);
    }
  }, []);

  // ===========================================================================
  // LOGIN FUNCTION
  // Sends POST request to /api/auth/login with credentials.
  // Saves token & user details upon success.
  // ===========================================================================
  const login = async (email, password) => {
    try {
      // Send login request to backend API endpoint
      const response = await axiosInstance.post('/auth/login', {
        email: email,
        password: password
      });

      // Extract token and user object from backend response
      const responseToken = response.data.token;
      const responseUser = response.data.user;

      // Save token and user into localStorage for persistence
      localStorage.setItem(STORAGE_KEYS.TOKEN, responseToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(responseUser));

      // Update React state
      setToken(responseToken);
      setUser(responseUser);
      setIsAuthenticated(true);

      // Return success object
      return {
        success: true,
        user: responseUser
      };

    } catch (error) {
      // Extract error message from API response if available
      let errorMessage = 'Login failed. Please check your credentials and try again.';

      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }

      // Return failure result object
      return {
        success: false,
        message: errorMessage
      };
    }
  };

  // ===========================================================================
  // LOGOUT FUNCTION
  // Clears user session from React state and localStorage.
  // ===========================================================================
  const logout = () => {
    // Remove stored auth items from browser storage
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    // Reset state to initial empty values
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Bundle state and action functions into context value object
  const contextValue = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// -----------------------------------------------------------------------------
// Custom Hook: useAuth
// Allows any component to quickly access auth state and methods.
// -----------------------------------------------------------------------------
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
