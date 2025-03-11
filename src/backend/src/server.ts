/**
 * Entry point for the Health Advisor Express backend application.
 * This file initializes the server, handles graceful shutdown, and manages the application lifecycle.
 * It creates the Express application, starts the HTTP server on the configured port,
 * and sets up process signal handlers for proper cleanup during shutdown.
 */

import http from 'http'; // Create HTTP server for the Express application, version ^0.0.1-security
import { createApp } from './app'; // Import function to create and configure the Express application
import { environment, logger, db } from './config'; // Import environment configuration including server port

/**
 * Initializes and starts the Express application server
 * @returns Promise<http.Server> HTTP server instance
 */
async function startServer(): Promise<http.Server> {
  // Create Express application using createApp()
  const app = await createApp();

  // Create HTTP server with the Express app
  const server = http.createServer(app);

  // Start listening on the configured PORT
  server.listen(environment.PORT, () => {
    // Log server startup information
    logger.info(`Server listening on port ${environment.PORT} in ${environment.NODE_ENV} mode`);
  });

  // Return the HTTP server instance
  return server;
}

/**
 * Sets up signal handlers for graceful server shutdown
 * @param server http.Server
 */
function setupGracefulShutdown(server: http.Server): void {
  // Register handler for SIGTERM signal
  process.on('SIGTERM', async (signal) => {
    await gracefulShutdown(server, signal);
  });

  // Register handler for SIGINT signal
  process.on('SIGINT', async (signal) => {
    await gracefulShutdown(server, signal);
  });

  // Log that shutdown handlers have been registered
  logger.info('Shutdown handlers registered');
}

/**
 * Performs graceful shutdown of server and database connections
 * @param server http.Server
 * @param signal string
 */
async function gracefulShutdown(server: http.Server, signal: string): Promise<void> {
  // Log shutdown initiation with signal type
  logger.info(`Initiating graceful shutdown with signal: ${signal}`);

  // Close HTTP server connections
  logger.info('Closing HTTP server connections...');
  server.close((err) => {
    if (err) {
      logger.error('Error closing HTTP server', {
        error: err.message,
        stack: err.stack
      });
      process.exitCode = 1;
    }

    // Disconnect from database
    logger.info('Disconnecting from database...');
    db.disconnect()
      .then(() => {
        // Log successful shutdown
        logger.info('Successful shutdown');
        // Exit process with success code
        process.exit(0);
      })
      .catch((dbErr) => {
        logger.error('Error disconnecting from database', {
          error: dbErr.message,
          stack: dbErr.stack
        });
        process.exitCode = 1;
      })
      .finally(() => {
        process.exit();
      });
  });
}

/**
 * Main function that starts the server and sets up shutdown handlers
 */
async function main(): Promise<void> {
  try {
    // Call startServer() to initialize and start the server
    const server = await startServer();

    // Set up graceful shutdown handlers
    setupGracefulShutdown(server);

    // Log successful server initialization
    logger.info('Server initialized successfully');
  } catch (error) {
    // Handle any startup errors
    logger.error('Server startup failed', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    process.exit(1);
  }
}

// Execute main function
main();