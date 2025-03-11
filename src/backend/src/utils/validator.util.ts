import Joi from 'joi'; // ^17.9.0
import mongoose from 'mongoose'; // ^7.0.3
import { ValidationError } from './error.util';

/**
 * Utility module providing common validation functions for data validation across the application.
 * Serves as a centralized place for reusable validation logic that can be used by specific domain validators.
 */

/**
 * Validates if a string is a properly formatted email address
 * @param email - The string to validate as an email
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const schema = Joi.string().email().required();
  const { error } = schema.validate(email);
  return !error;
}

/**
 * Validates if a password meets the required strength criteria
 * @param password - The password to validate
 * @returns True if the password meets the criteria, false otherwise
 */
export function isValidPassword(password: string): boolean {
  // Check if password is at least 8 characters and contains at least one letter, one number, and one special character
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasMinLength && hasLetter && hasNumber && hasSpecialChar;
}

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param id - The string to validate as an ObjectId
 * @returns True if the id is a valid ObjectId, false otherwise
 */
export function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Validates if a string can be parsed as a valid date
 * @param dateString - The string to validate as a date
 * @returns True if the dateString is a valid date, false otherwise
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Validates if a string is a properly formatted URL
 * @param url - The string to validate as a URL
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  const schema = Joi.string().uri().required();
  const { error } = schema.validate(url);
  return !error;
}

/**
 * Sanitizes a string by removing potentially harmful characters
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeString(input: string): string {
  // Replace HTML tags and special characters with safe equivalents
  let sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Trim whitespace from beginning and end
  sanitized = sanitized.trim();
  
  return sanitized;
}

/**
 * Validates if a value is a valid member of an enum
 * @param value - The value to check
 * @param enumObject - The enum object to check against
 * @returns True if the value is a valid enum member, false otherwise
 */
export function validateEnum<T extends object>(value: any, enumObject: T): boolean {
  const enumValues = Object.values(enumObject);
  return enumValues.includes(value);
}

/**
 * Validates that all required fields are present and not empty in an object
 * @param data - The object to validate
 * @param requiredFields - Array of field names that should be present and not empty
 * @returns Object with isValid flag and array of missing fields if any
 */
export function validateRequiredFields(
  data: object,
  requiredFields: string[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    const value = (data as any)[field];
    if (value === undefined || value === null || value === '') {
      missingFields.push(field);
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * Validates that a string does not exceed a maximum length
 * @param value - The string to validate
 * @param maxLength - The maximum allowed length
 * @returns True if the string length is valid, false otherwise
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  return value.length <= maxLength;
}

/**
 * Validates that a string meets a minimum length requirement
 * @param value - The string to validate
 * @param minLength - The minimum required length
 * @returns True if the string length is valid, false otherwise
 */
export function validateMinLength(value: string, minLength: number): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  
  return value.length >= minLength;
}

/**
 * Validates that a number is within a specified range
 * @param value - The number to validate
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns True if the number is within range, false otherwise
 */
export function validateNumericRange(value: number, min: number, max: number): boolean {
  if (typeof value !== 'number' || isNaN(value)) {
    return false;
  }
  
  return value >= min && value <= max;
}