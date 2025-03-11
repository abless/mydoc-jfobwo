import { ValidationError as JoiValidationError } from 'joi'; // ^17.9.1
import { AuthErrorType } from '../types/auth.types';
import logger from '../config/logger';

/**
 * Error Utility Module
 * 
 * This module provides a standardized error handling framework for the backend application.
 * It includes a hierarchy of custom error classes for different scenarios and utility functions
 * for formatting error responses.
 * 
 * Features:
 * - Custom error classes with appropriate HTTP status codes
 * - Standardized error response format
 * - Validation error formatting
 * - Error logging integration
 */

/**
 * Base error class for application-specific errors with status code and error code
 */
export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  isOperational: boolean;

  /**
   * Creates a new AppError instance
   * @param message Error message
   * @param statusCode HTTP status code (defaults to 500)
   * @param errorCode Application-specific error code
   */
  constructor(message: string, statusCode = 500, errorCode: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Indicates if this is an operational error that we can handle

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error class for validation errors with details about validation failures
 */
export class ValidationError extends AppError {
  validationErrors: Record<string, string>;

  /**
   * Creates a new ValidationError instance
   * @param message Error message
   * @param validationErrors Object containing validation error details
   */
  constructor(message: string, validationErrors: Record<string, string>) {
    super(message, 400, 'VALIDATION_ERROR');
    this.validationErrors = validationErrors;
  }
}

/**
 * Error class for authentication-related errors
 */
export class AuthenticationError extends AppError {
  /**
   * Creates a new AuthenticationError instance
   * @param message Error message
   * @param errorType Authentication error type from AuthErrorType enum
   */
  constructor(message: string, errorType: string) {
    super(message, 401, errorType);
  }
}

/**
 * Error class for resource not found errors
 */
export class NotFoundError extends AppError {
  /**
   * Creates a new NotFoundError instance
   * @param message Error message
   * @param resourceType Type of resource that was not found
   */
  constructor(message: string, resourceType: string) {
    super(message, 404, 'NOT_FOUND');
    logger.error(`Resource not found: ${resourceType} - ${message}`);
  }
}

/**
 * Error class for conflict errors like duplicate resources
 */
export class ConflictError extends AppError {
  /**
   * Creates a new ConflictError instance
   * @param message Error message
   * @param errorCode Specific error code for the conflict
   */
  constructor(message: string, errorCode: string) {
    super(message, 409, errorCode);
  }
}

/**
 * Error class for authorization errors when user lacks permission
 */
export class ForbiddenError extends AppError {
  /**
   * Creates a new ForbiddenError instance
   * @param message Error message
   */
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * Error class for invalid request errors
 */
export class BadRequestError extends AppError {
  /**
   * Creates a new BadRequestError instance
   * @param message Error message
   * @param errorCode Specific error code for the bad request
   */
  constructor(message: string, errorCode = 'BAD_REQUEST') {
    super(message, 400, errorCode);
  }
}

/**
 * Error class for unexpected server errors
 */
export class InternalServerError extends AppError {
  originalError: Error | null;

  /**
   * Creates a new InternalServerError instance
   * @param message Error message
   * @param originalError Original error that caused this error
   */
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
    this.originalError = originalError || null;
    
    // Log the internal server error with details
    logger.error('Internal Server Error', {
      message,
      originalError: originalError ? {
        name: originalError.name,
        message: originalError.message,
        stack: originalError.stack
      } : 'No original error'
    });
  }
}

/**
 * Error class for external service failures
 */
export class ServiceUnavailableError extends AppError {
  serviceName: string;

  /**
   * Creates a new ServiceUnavailableError instance
   * @param message Error message
   * @param serviceName Name of the unavailable service
   */
  constructor(message: string, serviceName: string) {
    super(message, 503, 'SERVICE_UNAVAILABLE');
    this.serviceName = serviceName;
    
    logger.error(`Service unavailable: ${serviceName} - ${message}`);
  }
}

/**
 * Formats an error object into a standardized error response structure
 * @param error Error object to format
 * @returns Standardized error response object with status, message, code, and details
 */
export function formatErrorResponse(error: Error): {
  status: string;
  code: string;
  message: string;
  details?: Record<string, string>;
} {
  // Default values
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: Record<string, string> | undefined = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    errorCode = error.errorCode;
    message = error.message;
    
    if (error instanceof ValidationError) {
      details = error.validationErrors;
    }
  } else if (error instanceof JoiValidationError) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = formatValidationErrors(error);
  } else {
    // Unknown error type
    logger.error('Unhandled error type', {
      errorType: error.constructor.name,
      message: error.message,
      stack: error.stack
    });
  }

  return {
    status: 'error',
    code: errorCode,
    message,
    ...(details && { details })
  };
}

/**
 * Formats Joi validation errors into a user-friendly structure
 * @param error Joi validation error
 * @returns Object with field names as keys and error messages as values
 */
export function formatValidationErrors(error: JoiValidationError): Record<string, string> {
  const validationErrors: Record<string, string> = {};
  
  if (error.details) {
    error.details.forEach((detail) => {
      const path = detail.path.join('.');
      validationErrors[path] = detail.message;
    });
  }
  
  return validationErrors;
}