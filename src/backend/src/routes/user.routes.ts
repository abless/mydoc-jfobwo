/**
 * User Routes Module
 * 
 * This module defines API endpoints for user profile management in the Health Advisor
 * application. It configures routes for retrieving user profile information and applies
 * appropriate middleware for authentication and validation.
 * 
 * @module routes/user.routes
 */

import express, { Router } from 'express'; // ^4.18.2
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';

// Create a new router instance
const router: Router = express.Router();

/**
 * @route GET /api/users/me
 * @desc Get current user profile information
 * @access Private (requires authentication)
 */
router.get('/me', authenticate, UserController.getCurrentUser);

export default router;