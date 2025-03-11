/**
 * Logger Configuration Module
 * 
 * Configures and exports a Winston logger instance for standardized logging across
 * the backend application. This module provides consistent logging with appropriate
 * formats, levels, and transports based on the current environment.
 * 
 * In development: Console-based colorized logs for readability
 * In production: JSON-formatted logs with file rotation for machine parsing
 * 
 * @module config/logger
 */

import winston from 'winston'; // ^3.8.2
import DailyRotateFile from 'winston-daily-rotate-file'; // ^4.7.1
import path from 'path'; // ^0.12.7
import fs from 'fs'; // ^0.0.1-security
import { LOG_LEVEL, NODE_ENV, IS_PRODUCTION } from './environment';

// Define log directory path
const LOG_DIR = path.resolve(process.cwd(), 'logs');

/**
 * Creates the log directory if it doesn't exist
 */
function createLogDirectory(): void {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    console.log(`Created log directory: ${LOG_DIR}`);
  }
}

/**
 * Returns the appropriate log format based on environment
 * 
 * @returns Winston log format configured for the current environment
 */
function getLogFormat(): winston.Logform.Format {
  // Base format with timestamp and structured JSON output
  const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  // In production, return the base format for machine parsing
  if (IS_PRODUCTION) {
    return baseFormat;
  }

  // In development, add colorization and pretty printing for readability
  return winston.format.combine(
    baseFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
      return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
  );
}

/**
 * Returns an array of Winston transports based on environment
 * 
 * @returns Array of Winston transports configured for the current environment
 */
function getTransports(): winston.transport[] {
  const transports: winston.transport[] = [
    // Console transport for all environments
    new winston.transports.Console({
      level: LOG_LEVEL || 'info'
    })
  ];

  // In production, add file transports
  if (IS_PRODUCTION) {
    // Ensure log directory exists
    createLogDirectory();

    // Error logs transport (error level only)
    const errorFileTransport = new DailyRotateFile({
      level: 'error',
      dirname: LOG_DIR,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.json()
    });

    // Combined logs transport (all levels)
    const combinedFileTransport = new DailyRotateFile({
      dirname: LOG_DIR,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      format: winston.format.json()
    });

    // Add file transports to the array
    transports.push(errorFileTransport, combinedFileTransport);
  }

  return transports;
}

// Create Winston logger instance
const logger = winston.createLogger({
  level: LOG_LEVEL || 'info',
  format: getLogFormat(),
  defaultMeta: { service: 'health-advisor-api' },
  transports: getTransports(),
  // Exit on error = false to prevent logger from crashing the app
  exitOnError: false
});

// Stream interface for Morgan middleware
export const stream = {
  /**
   * Write method for Morgan integration
   * 
   * @param message - Log message
   */
  write: (message: string) => {
    logger.http(message.trim());
  }
};

logger.info(`Logger initialized in ${NODE_ENV} environment with level: ${LOG_LEVEL || 'info'}`);

export default logger;