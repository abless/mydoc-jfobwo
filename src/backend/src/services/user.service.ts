/**
 * User Service Module
 * 
 * This module provides business logic for user profile management in the Health Advisor
 * application. It handles retrieving user profile information and formatting user data
 * for API responses.
 * 
 * @module services/user.service
 */

import { Types } from 'mongoose'; // ^7.0.3
import { getUserById } from '../repositories/user.repository';
import { UserDocument, UserProfileResponse, UserErrorType } from '../types/user.types';
import { NotFoundError } from '../utils/error.util';
import logger from '../config/logger';

/**
 * Retrieves a user's profile information by their ID
 * 
 * @param userId - User's ObjectId or string representation
 * @returns Promise resolving to user profile data formatted for API response
 */
export async function getUserProfile(userId: string | Types.ObjectId): Promise<UserProfileResponse> {
  try {
    logger.info('Retrieving user profile', {
      userId: typeof userId === 'string' ? userId : userId.toString()
    });
    
    // Get user document from repository
    const user = await getUserById(userId);
    
    // Format user document into profile response
    const userProfile = formatUserProfile(user);
    
    logger.info('User profile retrieved successfully', {
      userId: userProfile.id,
      email: userProfile.email
    });
    
    return userProfile;
  } catch (error) {
    // If error is already a NotFoundError, just rethrow it
    if (error instanceof NotFoundError) {
      throw error;
    }
    
    // Log the error
    logger.error('Error retrieving user profile', {
      userId: typeof userId === 'string' ? userId : userId.toString(),
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Rethrow the error
    throw error;
  }
}

/**
 * Formats a user document into a standardized profile response object
 * 
 * @param user - User document from database
 * @returns Formatted user profile with selected fields
 */
export function formatUserProfile(user: UserDocument): UserProfileResponse {
  return {
    id: user._id.toString(),
    email: user.email,
    createdAt: user.createdAt.toISOString()
  };
}