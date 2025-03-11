/**
 * JWT Utility Module
 * 
 * Provides functions for working with JSON Web Tokens (JWT) for authentication
 * and authorization in the Health Advisor application. Includes utilities for
 * generating, verifying, and handling JWT tokens with appropriate error handling.
 * 
 * @module utils/jwt.util
 */

import jwt from 'jsonwebtoken'; // ^9.0.0
import { Request } from 'express'; // ^4.18.2
import { environment } from '../config/environment';
import { JwtPayload, TokenType, AuthErrorType } from '../types/auth.types';
import { AuthenticationError } from './error.util';
import logger from '../config/logger';

/**
 * Generates a JWT token with the provided payload and token type
 * 
 * @param payload - Data to be included in the token
 * @param tokenType - Type of token (access or refresh)
 * @returns Generated JWT token string
 */
export function generateToken(payload: JwtPayload, tokenType: TokenType): string {
  // Determine expiration time based on token type
  const expiresIn = tokenType === TokenType.ACCESS 
    ? environment.JWT_EXPIRATION 
    : environment.REFRESH_TOKEN_EXPIRATION;
  
  // Generate and return the signed token
  return jwt.sign(payload, environment.JWT_SECRET, { expiresIn });
}

/**
 * Verifies and decodes a JWT token
 * 
 * @param token - JWT token to verify
 * @returns Promise resolving to decoded payload if valid
 * @throws AuthenticationError if token is invalid or expired
 */
export function verifyToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, environment.JWT_SECRET, (err, decoded) => {
      if (err) {
        // Handle different JWT verification errors
        if (err.name === 'TokenExpiredError') {
          logger.debug('Token verification failed: Token expired', { 
            tokenPreview: token.substring(0, 10) + '...' 
          });
          
          reject(new AuthenticationError(
            'Token has expired',
            AuthErrorType.TOKEN_EXPIRED
          ));
        } else {
          logger.debug('Token verification failed: Invalid token', { 
            tokenPreview: token.substring(0, 10) + '...',
            errorMessage: err.message 
          });
          
          reject(new AuthenticationError(
            'Invalid token',
            AuthErrorType.INVALID_TOKEN
          ));
        }
      } else {
        // Token is valid
        logger.debug('Token verified successfully');
        resolve(decoded as JwtPayload);
      }
    });
  });
}

/**
 * Creates a standardized JWT payload from user data
 * 
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @returns JWT payload object with user information
 */
export function createTokenPayload(userId: string, email: string): JwtPayload {
  return {
    userId,
    email,
    iat: Math.floor(Date.now() / 1000) // Issued at timestamp in seconds
  };
}

/**
 * Extracts JWT token from the Authorization header
 * 
 * @param req - Express request object
 * @returns Extracted token or null if not found
 */
export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return null;
  }
  
  // Check if the header has the Bearer format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logger.debug('Invalid authorization header format', { 
      format: parts[0],
      shouldBe: 'Bearer'
    });
    return null;
  }
  
  return parts[1];
}

/**
 * Decodes a JWT token without verification (for debugging or inspection)
 * 
 * @param token - JWT token to decode
 * @returns Decoded payload or null if decoding fails
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.decode(token);
    logger.debug('Token decoded for inspection', { 
      decodedPayload: decoded 
    });
    return decoded as JwtPayload;
  } catch (error) {
    logger.error('Failed to decode token', { error });
    return null;
  }
}