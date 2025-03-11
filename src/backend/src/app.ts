/**
 * Main application setup for the Health Advisor backend using Express.
 * This file configures middleware, routes, and error handling for the API.
 * It initializes the Express application, sets up security middleware, connects to the database,
 * registers API routes, and configures error handling.
 */

import express from 'express'; // Web framework for Node.js, version ^4.18.2
import cors from 'cors'; // Cross-Origin Resource Sharing middleware, version ^2.8.5
import helmet from 'helmet'; // Security middleware to set HTTP headers, version ^6.0.1
import compression from 'compression'; // Response compression middleware, version ^1.7.4
import morgan from 'morgan'; // HTTP request logger middleware, version ^1.10.0
import mongoSanitize from 'express-mongo-sanitize'; // Sanitize user input to prevent MongoDB operator injection, version ^2.2.0

import { environment, logger, db, security } from './config';
import createRoutes from './routes';
import { errorMiddleware, notFoundMiddleware, uncaughtExceptionHandler, unhandledRejectionHandler, rateLimitMiddleware } from './middlewares';

/**
 * Sets up global handlers for uncaught exceptions and unhandled promise rejections
 * @returns void
 */
function setupGlobalHandlers(): void {
  // Register handler for uncaught exceptions
  process.on('uncaughtException', uncaughtExceptionHandler);

  // Register handler for unhandled promise rejections
  process.on('unhandledRejection', unhandledRejectionHandler);

  logger.info('Global exception handlers registered');
}

/**
 * Sets up a health check endpoint to verify API and database status
 * @param app - Express application instance
 * @returns void
 */
function setupHealthCheck(app: express.Application): void {
  // Create a GET endpoint at /health
  app.get('/health', async (req, res) => {
    // Check database connection status
    const dbStatus = db.getStatus();

    // Return health status with uptime and database connection information
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      database: dbStatus
    });

    // Log that health check endpoint has been configured
    logger.info('Health check endpoint configured');
  });
}

/**
 * Creates and configures the Express application with all middleware and routes
 * @returns Promise<express.Application> - Configured Express application ready to listen for requests
 */
async function createApp(): Promise<express.Application> {
  // Create a new Express application instance
  const app = express();

  // Register global exception handlers
  setupGlobalHandlers();

  // Configure security middleware (helmet, cors, rate limiting)
  app.use(helmet(security.helmetOptions));
  app.use(cors(security.corsOptions));

  // Set up request parsing middleware (json, urlencoded)
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Configure request logging with morgan
  app.use(morgan('combined', { stream: logger.stream }));

  // Add compression middleware for response size reduction
  app.use(compression());

  // Add MongoDB query sanitization middleware
  app.use(mongoSanitize());

  // Apply rate limiting middleware
  app.use(rateLimitMiddleware);

  // Connect to the database
  await db.connect();

  // Register API routes with the API_PREFIX
  app.use(environment.API_PREFIX, createRoutes(db.connect));

  // Add health check endpoint
  setupHealthCheck(app);

  // Add 404 handler for undefined routes
  app.use(notFoundMiddleware);

  // Register global error handling middleware
  app.use(errorMiddleware);

  // Log that the Express application has been configured
  logger.info('Express application configured');

  // Return the configured Express application
  return app;
}

// Export the createApp function for use in server.ts
export { createApp };