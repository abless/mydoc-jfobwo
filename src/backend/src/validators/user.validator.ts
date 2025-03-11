import Joi from 'joi'; // ^17.9.0
import { UserProfileResponse } from '../types/user.types';
import { ValidationError } from '../utils/error.util';
import { isValidObjectId, isValidEmail } from '../utils/validator.util';

/**
 * Creates and returns a Joi validation schema for user ID parameters
 * @returns Joi schema for validating user ID parameters
 */
export function validateUserIdSchema(): Joi.ObjectSchema {
  return Joi.object({
    id: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!isValidObjectId(value)) {
          return helpers.error('string.objectId', { value });
        }
        return value;
      }, 'MongoDB ObjectId validation')
      .messages({
        'string.objectId': 'Invalid user ID format',
        'string.empty': 'User ID cannot be empty',
        'any.required': 'User ID is required'
      })
  });
}

/**
 * Creates and returns a Joi validation schema for user profile updates
 * @returns Joi schema for validating user profile updates
 */
export function validateUserProfileSchema(): Joi.ObjectSchema {
  return Joi.object({
    email: Joi.string()
      .email()
      .custom((value, helpers) => {
        if (value && !isValidEmail(value)) {
          return helpers.error('string.email', { value });
        }
        return value;
      }, 'Email format validation')
      .messages({
        'string.email': 'Invalid email format',
        'string.empty': 'Email cannot be empty'
      })
  });
}

/**
 * Validates user ID against the user ID schema
 * @param userId - User ID to validate
 * @returns Validation result with potential error and validated ID
 */
export function validateUserId(userId: string): { error?: ValidationError, value: string } {
  const schema = validateUserIdSchema();
  const { error, value } = schema.validate({ id: userId }, { abortEarly: false });
  
  if (error) {
    return {
      error: formatValidationErrors(error),
      value: userId
    };
  }
  
  return { value: value.id };
}

/**
 * Validates user profile update data against the profile schema
 * @param profileData - User profile data to validate
 * @returns Validation result with potential error and validated data
 */
export function validateUserProfile(profileData: Partial<UserProfileResponse>): { 
  error?: ValidationError, 
  value: Partial<UserProfileResponse> 
} {
  const schema = validateUserProfileSchema();
  const { error, value } = schema.validate(profileData, { abortEarly: false });
  
  if (error) {
    return {
      error: formatValidationErrors(error),
      value: profileData
    };
  }
  
  return { value };
}

/**
 * Formats Joi validation errors into a more user-friendly structure
 * @param error - Joi validation error
 * @returns Formatted validation error
 */
function formatValidationErrors(error: Joi.ValidationError): ValidationError {
  const validationErrors: Record<string, string> = {};
  
  error.details.forEach((detail) => {
    // Extract the field name from the path
    const field = detail.path.join('.');
    validationErrors[field] = detail.message;
  });
  
  return new ValidationError('Validation failed', validationErrors);
}

export {
  validateUserId,
  validateUserProfile,
  validateUserIdSchema,
  validateUserProfileSchema
};