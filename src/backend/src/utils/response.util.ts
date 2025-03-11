import { Response } from 'express'; // ^4.18.2
import { AppError } from './error.util';

/**
 * Response Utility Module
 * 
 * This module provides standardized response formatting functions for the Express backend API.
 * It ensures consistent response structure across all endpoints with appropriate HTTP status
 * codes and payload formatting.
 * 
 * Features:
 * - Standardized success responses with consistent structure
 * - Proper HTTP status codes for different response types
 * - Pagination support for collection responses
 * - Standardized error responses with appropriate status codes
 */

/**
 * Sends a standardized success response with 200 OK status code
 * 
 * @param res - Express Response object
 * @param data - Data to include in the response
 * @param message - Success message
 */
export function sendSuccess(res: Response, data: any, message: string = 'Success'): void {
  res.status(200).json({
    success: true,
    message,
    data
  });
}

/**
 * Sends a standardized created response with 201 Created status code
 * 
 * @param res - Express Response object
 * @param data - Data to include in the response (typically the created resource)
 * @param message - Success message
 */
export function sendCreated(res: Response, data: any, message: string = 'Resource created successfully'): void {
  res.status(201).json({
    success: true,
    message,
    data
  });
}

/**
 * Sends a 204 No Content response for successful operations that don't return data
 * 
 * @param res - Express Response object
 */
export function sendNoContent(res: Response): void {
  res.status(204).send();
}

/**
 * Sends a paginated response with metadata for collections
 * 
 * @param res - Express Response object
 * @param items - Array of items to include in the response
 * @param total - Total number of items (across all pages)
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param message - Success message
 */
export function sendPaginated(
  res: Response, 
  items: Array<any>, 
  total: number, 
  page: number, 
  limit: number, 
  message: string = 'Data retrieved successfully'
): void {
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
}

/**
 * Sends a standardized error response with appropriate status code
 * 
 * @param res - Express Response object
 * @param error - Error object
 * @param message - Error message (overrides error.message if provided)
 * @param statusCode - HTTP status code (overrides error.statusCode if provided)
 */
export function sendError(
  res: Response, 
  error: Error, 
  message?: string, 
  statusCode?: number
): void {
  let responseStatusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let responseMessage = message || error.message || 'An unexpected error occurred';
  let details = undefined;
  
  // If it's an AppError, use its status code and error code
  if (error instanceof AppError) {
    responseStatusCode = error.statusCode;
    errorCode = error.errorCode;
    
    // Check if it's a ValidationError with validation details
    if ('validationErrors' in error) {
      details = (error as any).validationErrors;
    }
  }
  
  // Override status code if provided
  if (statusCode) {
    responseStatusCode = statusCode;
  }
  
  const errorResponse = {
    success: false,
    message: responseMessage,
    error: {
      code: errorCode,
      ...(details && { details })
    }
  };
  
  res.status(responseStatusCode).json(errorResponse);
}

/**
 * Formats a success response object without sending it
 * 
 * @param data - Data to include in the response
 * @param message - Success message
 * @returns Formatted success response object
 */
export function formatSuccessResponse(data: any, message: string = 'Success'): object {
  return {
    success: true,
    message,
    data
  };
}

/**
 * Formats a paginated response object without sending it
 * 
 * @param items - Array of items to include in the response
 * @param total - Total number of items (across all pages)
 * @param page - Current page number
 * @param limit - Number of items per page
 * @param message - Success message
 * @returns Formatted paginated response object
 */
export function formatPaginatedResponse(
  items: Array<any>, 
  total: number, 
  page: number, 
  limit: number, 
  message: string = 'Data retrieved successfully'
): object {
  const totalPages = Math.ceil(total / limit);
  
  return {
    success: true,
    message,
    data: {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  };
}