/**
 * Authentication Middleware Module
 * 
 * Provides middleware functions for authenticating requests using JWT tokens.
 * Includes both required and optional authentication mechanisms for different
 * route security needs.
 * 
 * @module middlewares/auth.middleware
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.util';
import { AuthenticatedRequest, AuthErrorType } from '../types/auth.types';
import { AuthenticationError } from '../utils/error.util';
import logger from '../config/logger';

/**
 * Middleware that authenticates requests by verifying JWT tokens
 * 
 * This middleware extracts the JWT token from the Authorization header,
 * verifies it, and attaches the user information to the request object.
 * If authentication fails, it returns an appropriate error response.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise<void>
 */
export async function authenticate(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    // If no token is found, throw an unauthorized error
    if (!token) {
      logger.debug('Authentication failed: No token provided');
      throw new AuthenticationError(
        'Authentication required', 
        AuthErrorType.UNAUTHORIZED
      );
    }
    
    // Verify the token
    const payload = await verifyToken(token);
    
    // Extract user information from the token payload
    const { userId, email } = payload;
    
    // Attach user object to the request for use in subsequent middleware/handlers
    (req as AuthenticatedRequest).user = {
      id: userId,
      email
    };
    
    // Log successful authentication
    logger.debug('User authenticated successfully', { userId });
    
    // Proceed to the next middleware/handler
    next();
  } catch (error) {
    // Pass the error to the next middleware (error handler)
    next(error);
  }
}

/**
 * Middleware that attempts authentication but allows requests to proceed
 * even without valid authentication
 * 
 * This middleware is useful for routes that can work with or without
 * authentication, such as endpoints that provide different data based
 * on authentication status.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 * @returns Promise<void>
 */
export async function optionalAuthenticate(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractTokenFromHeader(req);
    
    // If no token is found, proceed without authentication
    if (!token) {
      logger.debug('Optional authentication: No token provided');
      return next();
    }
    
    try {
      // Attempt to verify the token
      const payload = await verifyToken(token);
      
      // Extract user information from the token payload
      const { userId, email } = payload;
      
      // Attach user object to the request
      (req as AuthenticatedRequest).user = {
        id: userId,
        email
      };
      
      logger.debug('Optional authentication successful', { userId });
    } catch (error) {
      // Log the error but don't block the request
      logger.debug('Optional authentication failed', { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
    
    // Always proceed to the next middleware/handler
    next();
  } catch (error) {
    // This should rarely happen, but handle unexpected errors
    logger.error('Unexpected error in optional authentication', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    next(error);
  }
}