/**
 * User Repository Module
 * 
 * Provides data access functions for user-related operations in the Health Advisor application.
 * Abstracts database interactions with the User model, handling user lookup, creation,
 * and error management.
 * 
 * @module repositories/user.repository
 */

import { Types } from 'mongoose'; // ^7.0.3
import User from '../models/user.model';
import { UserDocument, CreateUserInput, UserRole, UserErrorType } from '../types/user.types';
import { NotFoundError } from '../utils/error.util';
import logger from '../config/logger';

/**
 * Finds a user by their MongoDB ObjectId
 * 
 * @param id - User's ObjectId or string representation
 * @returns Promise resolving to user document or null if not found
 */
export async function findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
  try {
    // Convert string id to ObjectId if necessary
    const userId = typeof id === 'string' ? new Types.ObjectId(id) : id;
    
    return await User.findById(userId);
  } catch (error) {
    logger.error('Error finding user by ID', { 
      id: typeof id === 'string' ? id : id.toString(),
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Finds a user by their email address
 * 
 * @param email - User's email address
 * @returns Promise resolving to user document or null if not found
 */
export async function findByEmail(email: string): Promise<UserDocument | null> {
  try {
    return await User.findOne({ email: email.toLowerCase() });
  } catch (error) {
    logger.error('Error finding user by email', { 
      email,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Creates a new user with the provided data
 * 
 * @param userData - User creation input data including email and password
 * @returns Promise resolving to newly created user document
 */
export async function createUser(userData: CreateUserInput): Promise<UserDocument> {
  try {
    const { email, password } = userData;
    
    // Create user with default role of USER
    const newUser = await User.create({
      email,
      password,
      role: UserRole.USER
    });
    
    logger.info('New user created successfully', { 
      userId: newUser._id.toString(),
      email: newUser.email
    });
    
    return newUser;
  } catch (error) {
    logger.error('Error creating user', { 
      email: userData.email,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Gets a user by ID with error handling if user not found
 * 
 * @param id - User's ObjectId or string representation
 * @returns Promise resolving to user document
 * @throws NotFoundError if user is not found
 */
export async function getUserById(id: string | Types.ObjectId): Promise<UserDocument> {
  const user = await findById(id);
  
  if (!user) {
    throw new NotFoundError(
      `User with ID ${typeof id === 'string' ? id : id.toString()} not found`,
      UserErrorType.USER_NOT_FOUND
    );
  }
  
  return user;
}