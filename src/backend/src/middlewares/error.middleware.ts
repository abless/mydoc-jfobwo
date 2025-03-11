import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { ValidationError as JoiValidationError } from 'joi'; // ^17.9.1
import { 
  AppError, 
  ValidationError, 
  NotFoundError
} from '../utils/error.util';
import logger from '../config/logger';
import { sendError } from '../utils/response.util';
import { environment } from '../config/environment';

/**
 * Express middleware for handling errors during request processing
 * 
 * This middleware centralizes error handling across the application, ensuring
 * consistent error responses. It handles different error types appropriately and
 * logs error details for debugging and monitoring.
 * 
 * @param err - Error object
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export function errorMiddleware(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error details including context from the request
  logger.error('Error caught by error middleware', {
    errorType: err.constructor.name,
    message: err.message,
    path: req.path,
    method: req.method,
    userId: (req as any).user?.id || 'unauthenticated',
    stack: err.stack
  });

  // Handle Joi validation errors by converting them to our ValidationError format
  if (err instanceof JoiValidationError) {
    const validationErrors: Record<string, string> = {};
    err.details.forEach((detail) => {
      const path = detail.path.join('.');
      validationErrors[path] = detail.message;
    });

    const validationError = new ValidationError(
      'Validation failed',
      validationErrors
    );

    sendError(res, validationError);
    return;
  }

  // For operational errors (expected errors), send detailed information
  // These are errors that we expect and handle gracefully
  if (err instanceof AppError && err.isOperational) {
    sendError(res, err);
    return;
  }

  // For programming errors or unknown errors in production
  // send a generic error message to avoid leaking implementation details
  if (environment.IS_PRODUCTION) {
    const internalError = new AppError(
      'Something went wrong on our end. We are working to fix it.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
    sendError(res, internalError);
    return;
  }

  // In development, send detailed error information for easier debugging
  sendError(res, err);
}

/**
 * Express middleware for handling 404 not found errors
 * 
 * This middleware is used for routes that don't match any endpoints.
 * It creates a NotFoundError and passes it to the error middleware.
 * 
 * @param req - Express Request object
 * @param res - Express Response object
 * @param next - Express NextFunction
 */
export function notFoundMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const notFoundError = new NotFoundError(
    `Resource not found: ${req.method} ${req.originalUrl}`,
    'route'
  );
  next(notFoundError);
}

/**
 * Global handler for uncaught exceptions
 * 
 * This function handles exceptions that weren't caught by any try/catch block.
 * It logs the error and exits the process to allow the process manager to restart it.
 * 
 * @param error - Error object
 */
export function uncaughtExceptionHandler(error: Error): void {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...', {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    }
  });
  
  // Exit the process with error code 1 to allow process manager (e.g., PM2) to restart it
  process.exit(1);
}

/**
 * Global handler for unhandled promise rejections
 * 
 * This function handles promise rejections that weren't caught by any try/catch or .catch() block.
 * It logs the error and exits the process to allow the process manager to restart it.
 * 
 * @param reason - Error or reason for the rejection
 * @param promise - The promise that was rejected
 */
export function unhandledRejectionHandler(
  reason: Error,
  promise: Promise<any>
): void {
  logger.error('UNHANDLED REJECTION! Shutting down...', {
    reason: {
      name: reason.name,
      message: reason.message,
      stack: reason.stack
    },
    promise
  });
  
  // Exit the process with error code 1 to allow process manager to restart it
  process.exit(1);
}