/**
 * Authentication Service
 * 
 * Provides functionality for user registration, authentication, and token validation.
 * Handles secure password storage, JWT token generation, and user verification.
 * 
 * @module services/auth.service
 */

import { Types } from 'mongoose'; // ^7.0.3
import { 
  findByEmail, 
  createUser, 
  getUserById 
} from '../repositories/user.repository';
import { 
  hashPassword, 
  verifyPassword 
} from '../utils/encryption.util';
import { 
  generateToken, 
  verifyToken, 
  createTokenPayload 
} from '../utils/jwt.util';
import { 
  AuthenticationError, 
  ConflictError 
} from '../utils/error.util';
import { 
  LoginRequest, 
  SignupRequest, 
  AuthResponse, 
  JwtPayload,
  TokenType, 
  AuthErrorType 
} from '../types/auth.types';
import { 
  CreateUserInput,
  UserDocument 
} from '../types/user.types';
import logger from '../config/logger';

/**
 * Registers a new user with email and password
 * 
 * @param signupData - User registration data containing email and password
 * @returns Promise resolving to authentication response with token and user data
 * @throws ConflictError if email already exists
 */
export async function signup(signupData: SignupRequest): Promise<AuthResponse> {
  try {
    const { email, password } = signupData;

    // Check if user with the same email already exists
    const existingUser = await findByEmail(email);
    if (existingUser) {
      throw new ConflictError(
        'Email is already registered',
        AuthErrorType.EMAIL_EXISTS
      );
    }

    // Create new user in the database - password will be hashed by the model's pre-save hook
    const newUser = await createUser({
      email,
      password
    });

    // Generate token payload and token
    const payload = createTokenPayload(
      newUser._id.toString(),
      newUser.email
    );
    const token = generateToken(payload, TokenType.ACCESS);

    // Format and return the response
    const userResponse = formatUserResponse(newUser);
    
    logger.info('User registered successfully', { 
      userId: newUser._id.toString(),
      email: newUser.email
    });

    return {
      token,
      user: userResponse
    };
  } catch (error) {
    logger.error('User registration failed', {
      email: signupData.email,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Authenticates a user with email and password
 * 
 * @param loginData - User login data containing email and password
 * @returns Promise resolving to authentication response with token and user data
 * @throws AuthenticationError if credentials are invalid
 */
export async function login(loginData: LoginRequest): Promise<AuthResponse> {
  try {
    const { email, password } = loginData;

    // Find user by email
    const user = await findByEmail(email);
    if (!user) {
      throw new AuthenticationError(
        'Invalid email or password',
        AuthErrorType.INVALID_CREDENTIALS
      );
    }

    // Verify password using the user model's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AuthenticationError(
        'Invalid email or password',
        AuthErrorType.INVALID_CREDENTIALS
      );
    }

    // Generate token payload and token
    const payload = createTokenPayload(
      user._id.toString(),
      user.email
    );
    const token = generateToken(payload, TokenType.ACCESS);

    // Format and return the response
    const userResponse = formatUserResponse(user);
    
    logger.info('User logged in successfully', { 
      userId: user._id.toString(),
      email: user.email
    });

    return {
      token,
      user: userResponse
    };
  } catch (error) {
    logger.error('User login failed', {
      email: loginData.email,
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Validates a JWT token and returns the associated user
 * 
 * @param token - JWT token to validate
 * @returns Promise resolving to the user document if token is valid
 * @throws AuthenticationError if token is invalid
 */
export async function validateToken(token: string): Promise<UserDocument> {
  try {
    // Verify token
    const decoded = await verifyToken(token);
    
    // Get user by ID from token payload
    const user = await getUserById(decoded.userId);
    
    return user;
  } catch (error) {
    logger.error('Token validation failed', {
      error: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

/**
 * Formats a user document into a standardized user response object
 * 
 * @param user - User document from database
 * @returns Formatted user response with id and email
 */
export function formatUserResponse(user: UserDocument): { id: string; email: string } {
  return {
    id: user._id.toString(),
    email: user.email
  };
}