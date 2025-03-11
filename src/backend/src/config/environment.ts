/**
 * Environment Configuration Module
 * 
 * This module manages environment variables and provides a centralized access point
 * for application settings. It loads variables from .env files, validates required
 * values, and exposes them with appropriate types for use throughout the application.
 * 
 * The loading process prioritizes environment-specific .env files (.env.development,
 * .env.test, .env.production) over the default .env file.
 * 
 * @module config/environment
 */

import dotenv from 'dotenv'; // ^16.0.3
import path from 'path'; // ^0.12.7

/**
 * Loads environment variables from .env files based on current NODE_ENV.
 * 
 * First attempts to load from an environment-specific file like .env.development
 * or .env.production. Falls back to the default .env file if the specific one
 * is not found.
 */
export function loadEnvironmentVariables(): void {
  // Determine current environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Try to load environment-specific .env file first
  const envSpecificPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  let result = dotenv.config({ path: envSpecificPath });
  
  if (result.error) {
    // If environment-specific file fails to load, try default .env
    console.log(`Environment-specific .env.${nodeEnv} not found, trying default .env`);
    const defaultEnvPath = path.resolve(process.cwd(), '.env');
    result = dotenv.config({ path: defaultEnvPath });
    
    if (result.error) {
      console.warn(`Warning: Could not load any .env file`);
    } else {
      console.log(`Environment variables loaded from default .env file`);
    }
  } else {
    console.log(`Environment variables loaded from .env.${nodeEnv}`);
  }
}

/**
 * Validates that all required environment variables are present.
 * 
 * This function checks for the presence of critical configuration values
 * and throws an error if any are missing, preventing the application from
 * starting with an incomplete configuration.
 * 
 * @throws {Error} If any required environment variables are missing
 */
export function validateEnvironmentVariables(): void {
  // Define array of required environment variables
  const requiredEnvVars = [
    'PORT',
    'MONGODB_URI',
    'JWT_SECRET',
    'JWT_EXPIRATION',
    'REFRESH_TOKEN_EXPIRATION',
    'LLM_PROVIDER_API_KEY',
    'LLM_PROVIDER_URL',
  ];
  
  // Check for missing required variables
  const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`
    );
  }
  
  console.log('All required environment variables are present');
}

// Load environment variables when this module is imported
loadEnvironmentVariables();

/**
 * The application environment configuration.
 * 
 * This object provides typed access to all environment variables used by the application.
 * It includes default values for optional variables and performs type conversion
 * for numeric and boolean values.
 */
const environment = {
  // Node environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server configuration
  PORT: parseInt(process.env.PORT || '3000', 10),
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // Database configuration
  MONGODB_URI: process.env.MONGODB_URI || '',
  
  // Authentication configuration
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '',
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '',
  
  // LLM provider configuration
  LLM_PROVIDER_API_KEY: process.env.LLM_PROVIDER_API_KEY || '',
  LLM_PROVIDER_URL: process.env.LLM_PROVIDER_URL || '',
  LLM_MODEL: process.env.LLM_MODEL || 'gpt-3.5-turbo',
  
  // Security configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  // Logging configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  
  // Environment helpers
  get IS_PRODUCTION(): boolean {
    return this.NODE_ENV === 'production';
  },
  get IS_DEVELOPMENT(): boolean {
    return this.NODE_ENV === 'development';
  },
  get IS_TEST(): boolean {
    return this.NODE_ENV === 'test';
  }
};

export { environment, loadEnvironmentVariables, validateEnvironmentVariables };