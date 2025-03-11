/**
 * User-related type definitions for the Health Advisor application
 * These types represent user profile data structures and related state management
 */

/**
 * Interface for user profile data returned from the backend API
 * Contains the essential user information for display and identification
 */
export interface UserProfile {
  /** Unique identifier for the user */
  id: string;
  /** User's email address, used for authentication and communication */
  email: string;
  /** ISO timestamp when the user account was created */
  createdAt: string;
}

/**
 * Interface for update profile request payload sent to the backend API
 * Currently only supports updating email, but can be extended for additional fields
 */
export interface UpdateProfileRequest {
  /** Updated email address for the user */
  email: string;
}

/**
 * Interface for user profile state in the application
 * Tracks the current profile data, loading state, and any error messages
 */
export interface UserProfileState {
  /** Current user profile data or null if not loaded */
  profile: UserProfile | null;
  /** Indicates whether profile data is currently being loaded */
  loading: boolean;
  /** Error message if profile fetch/update failed, or null if no error */
  error: string | null;
}

/**
 * Interface for the user context providing profile state and methods
 * Used to access and update user profile information throughout the application
 */
export interface UserContextType {
  /** Current user profile data or null if not loaded */
  profile: UserProfile | null;
  /** Indicates whether profile data is currently being loaded */
  loading: boolean;
  /** Error message if profile fetch/update failed, or null if no error */
  error: string | null;
  /** 
   * Fetches the current user's profile from the backend
   * @returns Promise that resolves when the operation completes
   */
  getUserProfile: () => Promise<void>;
  /**
   * Updates the user's profile with new information
   * @param data - The profile data to update
   * @returns Promise that resolves when the operation completes
   */
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
}