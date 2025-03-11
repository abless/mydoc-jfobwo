/**
 * User Controller Module
 * 
 * This module handles HTTP requests for user profile management in the Health Advisor
 * application. It implements API endpoints for retrieving user profile information and
 * serves as the interface between Express routes and the user service layer.
 * 
 * @module controllers/user.controller
 */

import { Request, Response, NextFunction } from 'express'; // express version ^4.18.2
import { getUserProfile } from '../services/user.service';
import { AuthenticatedRequest } from '../types/auth.types';
import { sendSuccess, sendError } from '../utils/response.util';
import logger from '../config/logger';

/**
 * Namespace containing user controller functions
 */
export const UserController = {
  /**
   * Retrieves the current authenticated user's profile information
   * 
   * @param req - Express request object with authenticated user data
   * @param res - Express response object
   * @param next - Express next function
   */
  getCurrentUser: async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Extract user ID from authenticated request
      const userId = req.user.id;
      
      // Get user profile from service
      const userProfile = await getUserProfile(userId);
      
      // Log successful profile retrieval
      logger.info('User profile retrieved', { userId });
      
      // Send success response with user profile data
      sendSuccess(res, userProfile, 'User profile retrieved successfully');
    } catch (error) {
      // Log error
      logger.error('Error retrieving user profile', {
        error: error instanceof Error ? error.message : String(error),
        userId: req.user?.id
      });
      
      // Pass error to next middleware for centralized error handling
      next(error);
    }
  }
};