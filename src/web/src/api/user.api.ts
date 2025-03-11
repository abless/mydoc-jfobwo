/**
 * API module that provides functions for interacting with user-related endpoints in the backend API.
 * This module handles retrieving the current user profile and updating user profile information.
 * Implements requirements from the User Profile Management feature (F-005).
 */

import { apiService } from '../services/api.service'; // ^1.3.4
import { ENDPOINTS } from '../constants/endpoints';
import { UserProfile, UpdateProfileRequest } from '../types/user.types';

/**
 * Retrieves the current user's profile information from the backend API
 * @returns Promise that resolves with the user profile data
 */
export const getCurrentUser = async (): Promise<UserProfile> => {
  return apiService.get<UserProfile>(ENDPOINTS.USER.CURRENT_USER);
};

/**
 * Updates the current user's profile information in the backend API
 * @param profileData - The profile data to update
 * @returns Promise that resolves with the updated user profile data
 */
export const updateUserProfile = async (profileData: UpdateProfileRequest): Promise<UserProfile> => {
  return apiService.put<UserProfile>(ENDPOINTS.USER.UPDATE_PROFILE, profileData);
};