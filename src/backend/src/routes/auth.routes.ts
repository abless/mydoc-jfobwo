/**
 * Authentication Routes Module
 * 
 * Defines Express routes for authentication operations including user signup, login,
 * and token validation. This module configures API endpoints with appropriate
 * middleware for data validation and request handling.
 * 
 * @module routes/auth.routes
 */

import express, { Router } from 'express'; // ^4.18.2
import { signupHandler, loginHandler } from '../controllers/auth.controller';
import { validateSignupSchema, validateLoginSchema } from '../validators/auth.validator';
import { validateBody } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import logger from '../config/logger';

/**
 * Creates and configures the Express router for authentication routes
 * 
 * @returns Configured Express router with authentication routes
 */
function createAuthRouter(): Router {
  // Create a new Express router instance
  const router = express.Router();
  
  // POST /signup - User registration
  router.post(
    '/signup',
    validateBody(validateSignupSchema()),
    signupHandler
  );
  
  // POST /login - User authentication
  router.post(
    '/login',
    validateBody(validateLoginSchema()),
    loginHandler
  );
  
  // GET /validate - Validate authentication token
  // This route simply returns success if the token is valid
  router.get(
    '/validate',
    authenticate,
    (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: { user: req.user }
      });
    }
  );
  
  // Log registration of authentication routes
  logger.info('Auth routes registered');
  
  return router;
}

// Create and export the router
const authRouter = createAuthRouter();
export default authRouter;