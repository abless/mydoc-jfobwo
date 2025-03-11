/**
 * Authentication Controller
 * 
 * Handles authentication-related HTTP requests including user signup, login, and token validation.
 * Acts as an intermediary between the routes and the authentication service, handling request/response
 * formatting and error management.
 * 
 * @module controllers/auth.controller
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import Joi from 'joi'; // ^17.9.1
import {
  signup,
  login,
  validateToken,
  formatUserResponse
} from '../services/auth.service';
import {
  LoginRequest,
  SignupRequest,
  AuthenticatedRequest
} from '../types/auth.types';
import { 
  AuthenticationError,
  ValidationError
} from '../utils/error.util';
import {
  sendSuccess,
  sendCreated,
  sendError
} from '../utils/response.util';
import logger from '../config/logger';

/**
 * Handles user registration HTTP requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function signupHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as SignupRequest;
    
    // Call auth service to handle signup
    const result = await signup({ email, password });
    
    // Log successful registration (exclude sensitive data)
    logger.info('User registered successfully', {
      userId: result.user.id,
      email: result.user.email
    });
    
    // Send created response with token and user data
    sendCreated(res, result, 'User registered successfully');
  } catch (error) {
    // Forward any errors to error handling middleware
    next(error);
  }
}

/**
 * Handles user login HTTP requests
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body as LoginRequest;
    
    // Call auth service to handle login
    const result = await login({ email, password });
    
    // Log successful login (exclude sensitive data)
    logger.info('User logged in successfully', {
      userId: result.user.id,
      email: result.user.email
    });
    
    // Send success response with token and user data
    sendSuccess(res, result, 'User logged in successfully');
  } catch (error) {
    // Forward any errors to error handling middleware
    next(error);
  }
}

/**
 * Middleware to validate signup request data
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function validateSignup(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Define validation schema using Joi
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      password: Joi.string()
        .min(8)
        .required()
        .pattern(new RegExp('^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])'))
        .messages({
          'string.min': 'Password must be at least 8 characters long',
          'string.pattern.base': 'Password must contain at least one letter, one number, and one special character',
          'any.required': 'Password is required'
        })
    });
    
    // Validate request body against schema
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // If validation fails, create validation error with details
      const validationErrors: Record<string, string> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        validationErrors[key] = detail.message;
      });
      
      throw new ValidationError('Validation failed', validationErrors);
    }
    
    // If validation passes, proceed to next middleware
    next();
  } catch (error) {
    // Forward error to error handling middleware
    next(error);
  }
}

/**
 * Middleware to validate login request data
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function validateLogin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Define validation schema using Joi
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .required()
        .messages({
          'string.email': 'Please provide a valid email address',
          'any.required': 'Email is required'
        }),
      password: Joi.string()
        .required()
        .messages({
          'any.required': 'Password is required'
        })
    });
    
    // Validate request body against schema
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // If validation fails, create validation error with details
      const validationErrors: Record<string, string> = {};
      error.details.forEach((detail) => {
        const key = detail.path.join('.');
        validationErrors[key] = detail.message;
      });
      
      throw new ValidationError('Validation failed', validationErrors);
    }
    
    // If validation passes, proceed to next middleware
    next();
  } catch (error) {
    // Forward error to error handling middleware
    next(error);
  }
}

/**
 * Middleware to authenticate JWT token and attach user to request
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError(
        'Authentication token is missing',
        'UNAUTHORIZED'
      );
    }
    
    // Extract token from Bearer string
    const token = authHeader.split(' ')[1];
    
    // Validate token and get associated user
    const user = await validateToken(token);
    
    // Format user data and attach to request
    const formattedUser = formatUserResponse(user);
    (req as AuthenticatedRequest).user = formattedUser;
    
    // Proceed to next middleware
    next();
  } catch (error) {
    // Forward error to error handling middleware
    next(error);
  }
}