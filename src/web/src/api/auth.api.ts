/**
 * Authentication API module that provides functions for user authentication operations
 * including login, signup, and token management. This module interfaces directly with
 * the backend authentication endpoints and is used by the auth service.
 * 
 * Implements F-001: User Authentication requirements for email and password-based
 * authentication with JWT token implementation.
 */

import { apiService } from '../services/api.service'; // ^1.3.4
import { ENDPOINTS } from '../constants/endpoints';
import { 
  LoginRequest, 
  SignupRequest, 
  AuthResponse 
} from '../types/auth.types';

/**
 * Authenticates a user with the provided credentials
 * 
 * Implements F-001-RQ-002: User login with email and password
 * 
 * @param credentials - Object containing email and password
 * @returns Promise that resolves with authentication response containing token and user data
 */
export const login = async (credentials: LoginRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>(
    ENDPOINTS.AUTH.LOGIN, 
    credentials
  );
};

/**
 * Registers a new user with the provided credentials
 * 
 * Implements F-001-RQ-001: User signup with email and password
 * 
 * @param credentials - Object containing email, password, and confirmPassword
 * @returns Promise that resolves with authentication response containing token and user data
 */
export const signup = async (credentials: SignupRequest): Promise<AuthResponse> => {
  return apiService.post<AuthResponse>(
    ENDPOINTS.AUTH.SIGNUP, 
    credentials
  );
};

/**
 * Validates the current authentication token
 * 
 * This is used to verify if a stored token is still valid without requiring
 * the user to log in again.
 * 
 * @returns Promise that resolves with true if token is valid, false otherwise
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    await apiService.post(
      ENDPOINTS.AUTH.VALIDATE,
      {},
      { requiresAuth: true }
    );
    return true;
  } catch (error) {
    // Token is invalid or expired
    return false;
  }
};

/**
 * Sets the authentication token for API requests
 * 
 * This token will be included in the Authorization header for all subsequent
 * API requests that require authentication.
 * 
 * @param token - JWT token to be used for authentication
 * @returns Promise that resolves when token is set
 */
export const setAuthToken = async (token: string): Promise<void> => {
  return apiService.setAuthToken(token);
};

/**
 * Clears the authentication token
 * 
 * This should be called during logout or when the token becomes invalid.
 * 
 * @returns Promise that resolves when token is cleared
 */
export const clearAuthToken = async (): Promise<void> => {
  return apiService.clearAuthToken();
};