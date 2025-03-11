/**
 * Central routing module that aggregates and exports all API routes for the Health Advisor backend application.
 * This file imports individual route modules (auth, chat, health, user) and combines them into a single Express router
 * with appropriate path prefixes.
 *
 * @module routes/index
 */

import express, { Router } from 'express'; // ^4.18.2
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import healthRoutes from './health.routes';
import userRoutes from './user.routes';
import logger from '../config/logger';

/**
 * Creates and configures the main Express router with all application routes
 * @param connection - Mongoose connection object
 * @returns Configured Express router with all application routes
 */
function createRoutes(connection: mongoose.Connection): Router {
  // Create a new Express router instance
  const router = express.Router();

  // Import and mount authentication routes under /auth
  router.use('/auth', authRoutes);

  // Import and initialize chat routes under /chat
  router.use('/chat', chatRoutes());

  // Import and initialize health routes with database connection under /health
  router.use('/health', healthRoutes(connection));

  // Import and mount user routes under /users
  router.use('/users', userRoutes);

  // Log registration of all route modules
  logger.info('Route modules registered');

  // Return the configured router
  return router;
}

// Export the createRoutes function for use in the main application
export default createRoutes;