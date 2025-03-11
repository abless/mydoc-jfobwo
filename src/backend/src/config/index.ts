/**
 * Configuration Module
 * 
 * This is the central configuration module that aggregates and exports all
 * configuration components for the Health Advisor backend application. It serves
 * as a single entry point for accessing environment variables, database settings,
 * logging configuration, security options, and LLM integration parameters
 * throughout the application.
 * 
 * @module config
 */

import { 
  environment,
  NODE_ENV,
  PORT,
  API_PREFIX,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST
} from './environment';

import logger from './logger';

import {
  connectToDatabase,
  disconnectFromDatabase,
  getConnectionStatus
} from './database';

import { securityConfig } from './security';
import { llmConfig, validateLLMConfig } from './llm';

/**
 * Database interface for consistent access to database functions
 */
const db = {
  /**
   * Connect to the MongoDB database
   * 
   * @returns A promise that resolves to the Mongoose connection object
   */
  connect: connectToDatabase,
  
  /**
   * Disconnect from the MongoDB database
   * 
   * @returns A promise that resolves when the connection is closed
   */
  disconnect: disconnectFromDatabase,
  
  /**
   * Get the current status of the database connection
   * 
   * @returns An object containing connection status information
   */
  getStatus: getConnectionStatus
};

/**
 * Security configuration object with standardized naming
 */
const security = securityConfig;

/**
 * LLM configuration object with standardized naming
 */
const llm = llmConfig;

/**
 * Initializes all configuration components and validates settings
 * 
 * This function should be called during application startup to ensure
 * all configuration components are properly initialized and validated
 * before the application starts accepting requests.
 * 
 * @returns A promise that resolves when all configurations are initialized
 */
async function initializeConfig(): Promise<void> {
  try {
    // Validate environment variables
    const { validateEnvironmentVariables } = await import('./environment');
    validateEnvironmentVariables();
    
    // Log initialization
    logger.info(`Initializing application in ${environment.NODE_ENV} environment`);
    
    // Validate LLM configuration
    validateLLMConfig();
    
    logger.info('Configuration initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize configuration', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    throw error;
  }
}

// Export all configuration components
export {
  // Environment configuration
  environment,
  
  // Logger instance
  logger,
  
  // Database functions
  db,
  
  // Security configuration
  security,
  
  // LLM configuration
  llm,
  
  // Initialization function
  initializeConfig
};