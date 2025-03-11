/**
 * Authentication service for the React Native mobile application.
 * Handles user authentication operations including login, signup, token management,
 * and session validation. This service provides a clean interface for
 * authentication-related functionality and manages the authentication state.
 * 
 * Implements F-001: User Authentication requirement for email and password-based
 * authentication with JWT token implementation.
 */

import {
  login,
  signup,
  setAuthToken,
  clearAuthToken
} from '../api/auth.api';
import {
  storeAuthToken,
  getAuthToken,
  removeAuthToken,
  storeUserInfo,
  getUserInfo
} from '../services/storage.service';
import {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  UserResponse
} from '../types/auth.types';
import {
  validateLoginForm,
  validateSignupForm,
  isFormValid
} from '../utils/validation.utils';
import {
  parseApiError,
  isAuthenticationError
} from '../utils/error.utils';

/**
 * Authenticates a user with the provided credentials and stores the authentication data
 * 
 * Implements F-001-RQ-002: User login with email and password
 * 
 * @param credentials - Object containing email and password
 * @returns Promise that resolves with authentication response containing token and user data
 * @throws Error if validation fails or authentication fails
 */
const authenticateUser = async (credentials: LoginRequest): Promise<AuthResponse> => {
  // Validate login credentials
  const validationErrors = validateLoginForm(credentials);
  if (!isFormValid(validationErrors)) {
    throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
  }

  try {
    // Call login API
    const authResponse = await login(credentials);
    
    // Store authentication data
    await storeAuthToken(authResponse.token);
    await storeUserInfo(authResponse.user);
    
    // Set token for API requests
    await setAuthToken(authResponse.token);
    
    return authResponse;
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Registers a new user with the provided credentials and authenticates them
 * 
 * Implements F-001-RQ-001: User signup with email and password
 * 
 * @param credentials - Object containing email, password and confirmPassword
 * @returns Promise that resolves with authentication response containing token and user data
 * @throws Error if validation fails or registration fails
 */
const registerUser = async (credentials: SignupRequest): Promise<AuthResponse> => {
  // Validate signup credentials
  const validationErrors = validateSignupForm(credentials);
  if (!isFormValid(validationErrors)) {
    throw new Error(`Validation failed: ${JSON.stringify(validationErrors)}`);
  }

  try {
    // Call signup API
    const authResponse = await signup(credentials);
    
    // Store authentication data
    await storeAuthToken(authResponse.token);
    await storeUserInfo(authResponse.user);
    
    // Set token for API requests
    await setAuthToken(authResponse.token);
    
    return authResponse;
  } catch (error) {
    throw parseApiError(error);
  }
};

/**
 * Logs out the current user by clearing authentication data
 * 
 * @returns Promise that resolves when logout is complete
 */
const logoutUser = async (): Promise<void> => {
  try {
    // Clear auth token from API service
    await clearAuthToken();
    
    // Remove auth token from storage
    await removeAuthToken();
    
    // Note: If there are other user-related data to clear, handle it here
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

/**
 * Checks if the user is authenticated by verifying stored token
 * 
 * @returns Promise that resolves with true if user is authenticated, false otherwise
 */
const checkAuthStatus = async (): Promise<boolean> => {
  try {
    // Get token from storage
    const token = await getAuthToken();
    if (!token) {
      return false;
    }
    
    // Set token for API requests
    await setAuthToken(token);
    
    // Get user info from storage
    const userInfo = await getUserInfo();
    
    // User is authenticated if both token and user info exist
    return !!userInfo;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Gets the current authenticated user information
 * 
 * @returns Promise that resolves with user data or null if not authenticated
 */
const getCurrentUser = async (): Promise<UserResponse | null> => {
  try {
    return await getUserInfo();
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Service class for handling authentication operations
 * Provides methods for login, signup, logout, and checking authentication status
 */
export class AuthService {
  /**
   * Authenticates a user with email and password
   * 
   * @param credentials - Object containing email and password
   * @returns Promise that resolves with authentication response
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return authenticateUser(credentials);
  }

  /**
   * Registers a new user with email and password
   * 
   * @param credentials - Object containing email, password and confirmPassword
   * @returns Promise that resolves with authentication response
   */
  async signup(credentials: SignupRequest): Promise<AuthResponse> {
    return registerUser(credentials);
  }

  /**
   * Logs out the current user
   * 
   * @returns Promise that resolves when logout is complete
   */
  async logout(): Promise<void> {
    return logoutUser();
  }

  /**
   * Checks if the user is authenticated
   * 
   * @returns Promise that resolves with authentication status
   */
  async checkAuthStatus(): Promise<boolean> {
    return checkAuthStatus();
  }

  /**
   * Gets the current authenticated user
   * 
   * @returns Promise that resolves with user data or null
   */
  async getCurrentUser(): Promise<UserResponse | null> {
    return getCurrentUser();
  }

  /**
   * Handles authentication errors
   * 
   * @param error - Error to handle
   * @returns Promise that resolves when error is handled
   * @throws Original error after handling
   */
  async handleAuthError(error: any): Promise<void> {
    const parsedError = parseApiError(error);
    
    // If it's an authentication error, logout the user
    if (isAuthenticationError(error)) {
      await logoutUser();
    }
    
    // Rethrow the error for handling by the caller
    throw parsedError;
  }
}

/**
 * Singleton instance of the AuthService class for use throughout the application
 */
export const authService = new AuthService();