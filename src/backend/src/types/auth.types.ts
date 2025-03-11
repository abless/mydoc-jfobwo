import { Request } from 'express'; // express version ^4.18.2

/**
 * Interface for login request payload containing user credentials
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for signup request payload containing new user credentials
 */
export interface SignupRequest {
  email: string;
  password: string;
}

/**
 * Interface for user data returned in authentication responses
 */
export interface UserResponse {
  id: string;
  email: string;
}

/**
 * Interface for authentication response containing JWT token and user information
 */
export interface AuthResponse {
  token: string;
  user: UserResponse;
}

/**
 * Interface for JWT token payload structure
 */
export interface JwtPayload {
  userId: string;
  email: string;
  iat: number; // Issued at timestamp
}

/**
 * Extension of Express Request interface with authenticated user information
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

/**
 * Enum for different types of authentication tokens
 */
export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh'
}

/**
 * Enum for authentication-related error types
 */
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'Invalid email or password',
  EMAIL_EXISTS = 'Email is already registered',
  UNAUTHORIZED = 'Unauthorized access',
  INVALID_TOKEN = 'Invalid authentication token',
  TOKEN_EXPIRED = 'Authentication token has expired'
}