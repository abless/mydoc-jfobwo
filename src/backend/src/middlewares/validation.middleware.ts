import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { Schema, ValidationError as JoiValidationError } from 'joi'; // ^17.9.1
import { ValidationError, formatValidationErrors } from '../utils/error.util';

/**
 * Validation Middleware Module
 * 
 * This module provides middleware functions for validating incoming requests
 * against Joi schemas before they reach route handlers. It ensures data integrity,
 * enforces schema compliance, and provides consistent error responses for invalid data.
 */

/**
 * Creates a middleware function that validates a specific part of the request
 * against a Joi schema.
 * 
 * @param schema - Joi schema to validate against
 * @param source - Request part to validate ('body', 'query', or 'params')
 * @returns Express middleware function
 */
export const validate = (schema: Schema, source: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Determine which part of the request to validate
    let dataToValidate: any;
    
    switch(source) {
      case 'body':
        dataToValidate = req.body;
        break;
      case 'query':
        dataToValidate = req.query;
        break;
      case 'params':
        dataToValidate = req.params;
        break;
      default:
        return next(new ValidationError('Invalid validation source specified', { 
          source: `Invalid source: ${source}. Must be 'body', 'query', or 'params'`
        }));
    }
    
    // Validate data against the provided schema
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
      context: { req }    // Make request object available in custom validations
    });
    
    if (error) {
      // Format validation errors into a user-friendly structure
      const formattedErrors = formatValidationErrors(error);
      
      // Create and pass ValidationError to the error handling middleware
      return next(new ValidationError('Validation failed', formattedErrors));
    }
    
    // Update request with validated and sanitized data
    switch(source) {
      case 'body':
        req.body = value;
        break;
      case 'query':
        req.query = value;
        break;
      case 'params':
        req.params = value;
        break;
    }
    
    return next();
  };
};

/**
 * Middleware factory for validating request body against a schema
 * 
 * @param schema - Joi schema to validate request body against
 * @returns Express middleware function
 * @example
 * // Usage in route definition:
 * router.post('/users', validateBody(userSchema), createUserHandler);
 */
export const validateBody = (schema: Schema) => validate(schema, 'body');

/**
 * Middleware factory for validating request query parameters against a schema
 * 
 * @param schema - Joi schema to validate query parameters against
 * @returns Express middleware function
 * @example
 * // Usage in route definition:
 * router.get('/users', validateQuery(userQuerySchema), getUsersHandler);
 */
export const validateQuery = (schema: Schema) => validate(schema, 'query');

/**
 * Middleware factory for validating request URL parameters against a schema
 * 
 * @param schema - Joi schema to validate URL parameters against
 * @returns Express middleware function
 * @example
 * // Usage in route definition:
 * router.get('/users/:id', validateParams(userIdSchema), getUserByIdHandler);
 */
export const validateParams = (schema: Schema) => validate(schema, 'params');