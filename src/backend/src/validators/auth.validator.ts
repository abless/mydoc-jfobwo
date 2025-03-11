/**
 * Authentication Validator Module
 * 
 * This module provides validation schemas and functions for authentication-related
 * requests including login and signup operations. It uses Joi for schema validation
 * and ensures data integrity and security for user credentials.
 * 
 * Key features:
 * - Email format validation
 * - Password strength validation
 * - Consistent error formatting
 * - Type-safe validation interfaces
 */

import Joi from 'joi'; // ^17.9.0
import { LoginRequest, SignupRequest } from '../types/auth.types';
import { ValidationError } from '../utils/error.util';
import { isValidEmail, isValidPassword } from '../utils/validator.util';

/**
 * Creates and returns a Joi validation schema for login requests
 * @returns Joi schema for validating login requests
 */
export function validateLoginSchema(): Joi.ObjectSchema {
  return Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Disable TLD validation
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      })
  });
}

/**
 * Creates and returns a Joi validation schema for signup requests
 * @returns Joi schema for validating signup requests
 */
export function validateSignupSchema(): Joi.ObjectSchema {
  return Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } }) // Disable TLD validation
      .required()
      .messages({
        'string.email': 'Please enter a valid email address',
        'string.empty': 'Email is required',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(8)
      .custom((value, helpers) => {
        if (!isValidPassword(value)) {
          return helpers.error('password.complexity');
        }
        return value;
      })
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'password.complexity': 'Password must contain at least one letter, one number, and one special character',
        'string.empty': 'Password is required',
        'any.required': 'Password is required'
      })
  });
}

/**
 * Formats Joi validation errors into a more user-friendly structure
 * @param error - Joi validation error
 * @returns Formatted validation error
 */
function formatValidationErrors(error: Joi.ValidationError): ValidationError {
  const errors: Record<string, string> = {};
  
  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    errors[key] = detail.message;
  });
  
  return new ValidationError('Validation failed', errors);
}

/**
 * Validates login request data against the login schema
 * @param data - Login request data
 * @returns Validation result with potential error and validated data
 */
export function validateLogin(data: LoginRequest): { error?: ValidationError, value: LoginRequest } {
  const schema = validateLoginSchema();
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return { error: formatValidationErrors(error), value };
  }
  
  return { value };
}

/**
 * Validates signup request data against the signup schema
 * @param data - Signup request data
 * @returns Validation result with potential error and validated data
 */
export function validateSignup(data: SignupRequest): { error?: ValidationError, value: SignupRequest } {
  const schema = validateSignupSchema();
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return { error: formatValidationErrors(error), value };
  }
  
  return { value };
}