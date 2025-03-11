/**
 * Custom React hook that provides authentication functionality for the Health Advisor mobile application.
 * It encapsulates the authentication logic and state management, offering a simplified interface
 * for components to handle user authentication operations.
 * 
 * Implements F-001: User Authentication requirement for email and password-based authentication
 * with JWT token implementation.
 */

import { useState, useEffect, useCallback } from 'react'; // ^18.2.0
import { authService } from '../services/auth.service';
import { useAuthContext } from '../contexts/AuthContext';
import { 
  LoginRequest, 
  SignupRequest, 
  UserResponse,
  AuthState 
} from '../types/auth.types';
import { parseApiError } from '../utils/error.utils';

/**
 * Interface defining the return type of the useAuth hook
 */
export interface UseAuthResult {
  isAuthenticated: boolean;
  user: UserResponse | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (credentials: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

/**
 * Custom hook that provides authentication functionality and state
 * 
 * @returns An object containing authentication state and methods
 */
export const useAuth = (): UseAuthResult => {
  // Get authentication state and methods from context
  const { state } = useAuthContext();
  
  /**
   * Handles user login with email and password
   * 
   * Implements F-001-RQ-002: User login with email and password
   * 
   * @param credentials - User login credentials (email and password)
   * @returns Promise that resolves when login is complete
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    try {
      await authService.login(credentials);
    } catch (error) {
      // Parse and rethrow the error for consistent error handling
      throw parseApiError(error);
    }
  }, []);

  /**
   * Handles user registration with email and password
   * 
   * Implements F-001-RQ-001: User signup with email and password
   * 
   * @param credentials - User signup data (email, password, confirmPassword)
   * @returns Promise that resolves when signup is complete
   */
  const signup = useCallback(async (credentials: SignupRequest): Promise<void> => {
    try {
      await authService.signup(credentials);
    } catch (error) {
      // Parse and rethrow the error for consistent error handling
      throw parseApiError(error);
    }
  }, []);

  /**
   * Handles user logout
   * 
   * @returns Promise that resolves when logout is complete
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error during logout:', error);
      await authService.handleAuthError(error);
    }
  }, []);

  /**
   * Checks if the user is authenticated
   * 
   * @returns Promise that resolves with true if authenticated, false otherwise
   */
  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      return await authService.checkAuthStatus();
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }, []);

  // Return authentication state and methods
  return {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    signup,
    logout,
    checkAuth
  };
};