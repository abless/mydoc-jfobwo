import { Types, Document } from 'mongoose'; // mongoose version ^7.0.3

/**
 * Enum defining possible user roles for authorization purposes
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Base interface for user data structure
 */
export interface User {
  email: string;
  password: string; // Hashed password, not plaintext
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extended interface for user document with Mongoose document methods
 * Includes Mongoose document features and custom methods
 */
export interface UserDocument extends User, Document {
  _id: Types.ObjectId;
  /**
   * Method to compare a candidate password with the stored hashed password
   * @param candidatePassword - The plaintext password to compare
   * @returns Promise resolving to boolean indicating if passwords match
   */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * Interface for user creation input data
 */
export interface CreateUserInput {
  email: string;
  password: string; // Plaintext password that will be hashed before storage
}

/**
 * Interface for user profile data returned in API responses
 * Excludes sensitive data like password
 */
export interface UserProfileResponse {
  id: string; // String representation of ObjectId
  email: string;
  createdAt: string; // ISO date string format
}

/**
 * Enum defining error types specific to user operations
 * Used for consistent error handling throughout the application
 */
export enum UserErrorType {
  USER_NOT_FOUND = 'User not found',
  EMAIL_ALREADY_EXISTS = 'Email already exists',
  INVALID_USER_DATA = 'Invalid user data'
}