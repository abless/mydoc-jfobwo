/**
 * Chat Validator Module
 * 
 * Provides Joi schema validation for chat-related requests including message sending,
 * chat history retrieval, and conversation management. Ensures data integrity and
 * appropriate format of requests before processing by the chat service.
 */

import Joi from 'joi'; // v17.9.0
import { 
  SendMessageRequest, 
  GetChatHistoryRequest, 
  GetConversationsRequest 
} from '../types/chat.types';
import { ValidationError } from '../utils/error.util';
import { isValidObjectId, validateMaxLength } from '../utils/validator.util';

/**
 * Creates and returns a Joi validation schema for send message requests
 * @returns Joi schema for validating send message requests
 */
export function validateSendMessageSchema(): Joi.ObjectSchema {
  return Joi.object({
    // Message must be a string, is required, and has a max length of 500 characters
    message: Joi.string()
      .required()
      .max(500)
      .messages({
        'string.empty': 'Message cannot be empty',
        'string.max': 'Message cannot exceed 500 characters',
        'any.required': 'Message is required'
      }),
    
    // Optional conversation ID that must be a valid MongoDB ObjectId when provided
    conversationId: Joi.string()
      .custom((value, helpers) => {
        if (value && !isValidObjectId(value)) {
          return helpers.error('string.objectId');
        }
        return value;
      })
      .messages({
        'string.objectId': 'Conversation ID must be a valid identifier'
      })
      .optional()
  });
}

/**
 * Creates and returns a Joi validation schema for chat history requests
 * @returns Joi schema for validating chat history requests
 */
export function validateGetChatHistorySchema(): Joi.ObjectSchema {
  return Joi.object({
    // Conversation ID is required and must be a valid MongoDB ObjectId
    conversationId: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!isValidObjectId(value)) {
          return helpers.error('string.objectId');
        }
        return value;
      })
      .messages({
        'string.empty': 'Conversation ID cannot be empty',
        'string.objectId': 'Conversation ID must be a valid identifier',
        'any.required': 'Conversation ID is required'
      }),
    
    // Page number for pagination, defaults to 1
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    
    // Number of items per page, defaults to 20, maximum 50
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      })
  });
}

/**
 * Creates and returns a Joi validation schema for conversations requests
 * @returns Joi schema for validating conversations requests
 */
export function validateGetConversationsSchema(): Joi.ObjectSchema {
  return Joi.object({
    // Page number for pagination, defaults to 1
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.min': 'Page must be at least 1'
      }),
    
    // Number of items per page, defaults to 10, maximum 50
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'Limit must be a number',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      })
  });
}

/**
 * Creates and returns a Joi validation schema for conversation ID parameters
 * @returns Joi schema for validating conversation ID parameters
 */
export function validateConversationIdSchema(): Joi.ObjectSchema {
  return Joi.object({
    // ID parameter must be a valid MongoDB ObjectId
    id: Joi.string()
      .required()
      .custom((value, helpers) => {
        if (!isValidObjectId(value)) {
          return helpers.error('string.objectId');
        }
        return value;
      })
      .messages({
        'string.empty': 'Conversation ID cannot be empty',
        'string.objectId': 'Conversation ID must be a valid identifier',
        'any.required': 'Conversation ID is required'
      })
  });
}

/**
 * Validates send message request data against the send message schema
 * @param data The request data to validate
 * @returns Validation result with potential error and validated data
 */
export function validateSendMessage(data: SendMessageRequest): { error?: ValidationError, value: SendMessageRequest } {
  const schema = validateSendMessageSchema();
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    return {
      error: formatValidationErrors(error),
      value
    };
  }
  
  return { value };
}

/**
 * Formats Joi validation errors into a more user-friendly structure
 * @param error Joi validation error
 * @returns Formatted validation error
 */
function formatValidationErrors(error: Joi.ValidationError): ValidationError {
  const validationErrors: Record<string, string> = {};
  
  error.details.forEach((detail) => {
    const key = detail.path.join('.');
    validationErrors[key] = detail.message;
  });
  
  return new ValidationError('Validation failed', validationErrors);
}