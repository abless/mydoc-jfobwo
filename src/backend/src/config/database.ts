/**
 * Database Configuration Module
 * 
 * This module manages MongoDB connection setup, provides connection and disconnection
 * functions, and implements connection pooling and error handling for the
 * Health Advisor application.
 * 
 * @module config/database
 */

import mongoose from 'mongoose'; // ^7.0.0
import { environment } from './environment';
import logger from './logger';

// Maximum number of connection retry attempts
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Configures Mongoose connection options based on best practices
 * 
 * @returns Mongoose connection options
 */
function getConnectionOptions(): mongoose.ConnectOptions {
  return {
    // Connection pool configuration
    maxPoolSize: environment.IS_PRODUCTION ? 10 : 5,
    minPoolSize: environment.IS_PRODUCTION ? 2 : 1,
    
    // Default timeout in milliseconds
    connectTimeoutMS: 30000,
    
    // Socket timeout in milliseconds
    socketTimeoutMS: 45000,
    
    // Server selection timeout in milliseconds
    serverSelectionTimeoutMS: 30000,
    
    // Retry connection on failure
    retryWrites: true,
    
    // Heartbeat to keep connections alive
    heartbeatFrequencyMS: 10000,
    
    // Auto index creation - disable in production for performance
    autoIndex: !environment.IS_PRODUCTION,
  };
}

/**
 * Establishes connection to MongoDB using the configured connection string
 * 
 * @param retryAttempt - Current retry attempt number (used internally for recursion)
 * @returns A promise that resolves to the Mongoose connection object
 */
export async function connectToDatabase(retryAttempt = 0): Promise<mongoose.Connection> {
  try {
    logger.info('Connecting to MongoDB...', { 
      uri: environment.IS_DEVELOPMENT ? environment.MONGODB_URI : '[redacted]',
      retry: retryAttempt > 0 ? retryAttempt : undefined
    });
    
    // Set up global configuration
    mongoose.set('strictQuery', true);
    
    // Configure connection options
    const options = getConnectionOptions();
    
    // Setup connection event listeners
    setupConnectionListeners();
    
    // Connect to the database
    await mongoose.connect(environment.MONGODB_URI, options);
    
    logger.info('Successfully connected to MongoDB', {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });
    
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      retryAttempt
    });
    
    // Skip retry logic in test environment
    if (environment.IS_TEST) {
      throw error;
    }
    
    // Implement retry logic with exponential backoff
    if (retryAttempt < MAX_RETRY_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, retryAttempt), 30000); // Max 30 second delay
      logger.info(`Retrying connection in ${delay / 1000} seconds...`, { retryAttempt: retryAttempt + 1 });
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectToDatabase(retryAttempt + 1);
    }
    
    logger.error(`Maximum retry attempts (${MAX_RETRY_ATTEMPTS}) reached. Giving up.`);
    throw new Error(`Failed to connect to MongoDB after ${MAX_RETRY_ATTEMPTS} attempts: ${(error as Error).message}`);
  }
}

/**
 * Sets up event listeners for the MongoDB connection
 */
function setupConnectionListeners(): void {
  const connection = mongoose.connection;
  
  // Connection successful
  connection.on('connected', () => {
    logger.info('MongoDB connection established');
  });
  
  // Connection disconnected
  connection.on('disconnected', () => {
    logger.info('MongoDB connection disconnected');
    
    // Don't attempt reconnection if shutting down or in test mode
    if (!environment.IS_TEST && process.uptime() > 10) {
      logger.info('Attempting to reconnect to MongoDB...');
    }
  });
  
  // Connection error
  connection.on('error', (err) => {
    logger.error('MongoDB connection error', { 
      error: err.message,
      stack: err.stack
    });
  });
  
  // Connection reconnected
  connection.on('reconnected', () => {
    logger.info('MongoDB connection reestablished');
  });
  
  // Connection closed
  connection.on('close', () => {
    logger.info('MongoDB connection closed');
  });
  
  // SIGINT handler for graceful shutdown
  process.on('SIGINT', () => {
    disconnectFromDatabase()
      .then(() => {
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      })
      .catch(err => {
        logger.error('Error during MongoDB disconnection on app termination', { 
          error: err.message,
          stack: err.stack
        });
        process.exit(1);
      });
  });
}

/**
 * Gracefully closes the MongoDB connection
 * 
 * @returns A promise that resolves when the connection is closed
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    if (mongoose.connection.readyState === 0) {
      logger.debug('MongoDB connection already closed');
      return;
    }
    
    logger.info('Closing MongoDB connection...');
    await mongoose.disconnect();
    logger.info('MongoDB connection closed successfully');
  } catch (error) {
    logger.error('Error disconnecting from MongoDB', { 
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

/**
 * Returns the current status of the database connection
 * 
 * @returns An object containing connection status information
 */
export function getConnectionStatus(): { 
  connected: boolean; 
  readyState: number;
  readyStateText: string;
  host?: string;
  name?: string;
} {
  const readyState = mongoose.connection.readyState;
  
  // Convert readyState to descriptive text
  let readyStateText: string;
  switch (readyState) {
    case 0:
      readyStateText = 'disconnected';
      break;
    case 1:
      readyStateText = 'connected';
      break;
    case 2:
      readyStateText = 'connecting';
      break;
    case 3:
      readyStateText = 'disconnecting';
      break;
    default:
      readyStateText = 'unknown';
  }
  
  const status = {
    connected: readyState === 1,
    readyState,
    readyStateText
  };
  
  // Add additional information if connected
  if (readyState === 1) {
    return {
      ...status,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  }
  
  return status;
}