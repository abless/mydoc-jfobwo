import { HealthDataType, MealType, SymptomSeverity } from '../types/health.types';
import { LoginRequest, SignupRequest } from '../types/auth.types';

/**
 * Validates if a string is a properly formatted email address
 * @param email Email string to validate
 * @returns True if email is valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a password meets the required strength criteria
 * @param password Password string to validate
 * @returns True if password meets criteria, false otherwise
 */
export const isValidPassword = (password: string): boolean => {
  // Check length >= 8 characters
  if (password.length < 8) return false;
  
  // Check for at least one letter
  const hasLetter = /[a-zA-Z]/.test(password);
  if (!hasLetter) return false;
  
  // Check for at least one number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) return false;
  
  // Check for at least one special character
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecial) return false;
  
  return true;
};

/**
 * Validates that a field has a non-empty value
 * @param value Value to check for presence
 * @param fieldName Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === undefined || value === null || value === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validates that a string meets a minimum length requirement
 * @param value String to validate
 * @param minLength Minimum length required
 * @param fieldName Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters`;
  }
  
  return null;
};

/**
 * Validates that a string does not exceed a maximum length
 * @param value String to validate
 * @param maxLength Maximum length allowed
 * @param fieldName Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (typeof value !== 'string') {
    return `${fieldName} must be a string`;
  }
  
  if (value.length > maxLength) {
    return `${fieldName} must not exceed ${maxLength} characters`;
  }
  
  return null;
};

/**
 * Validates email format and returns appropriate error message
 * @param email Email string to validate
 * @returns Error message if validation fails, null if valid
 */
export const validateEmail = (email: string): string | null => {
  const requiredError = validateRequired(email, 'Email');
  if (requiredError) return requiredError;
  
  if (!isValidEmail(email)) {
    return 'Please enter a valid email address';
  }
  
  return null;
};

/**
 * Validates password strength and returns appropriate error message
 * @param password Password string to validate
 * @returns Error message if validation fails, null if valid
 */
export const validatePassword = (password: string): string | null => {
  const requiredError = validateRequired(password, 'Password');
  if (requiredError) return requiredError;
  
  if (!isValidPassword(password)) {
    return 'Password must be at least 8 characters and include at least one letter, one number, and one special character';
  }
  
  return null;
};

/**
 * Validates that password and confirm password match
 * @param password Password string
 * @param confirmPassword Confirmation password string
 * @returns Error message if validation fails, null if valid
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  const requiredError = validateRequired(confirmPassword, 'Confirm Password');
  if (requiredError) return requiredError;
  
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }
  
  return null;
};

/**
 * Validates if a value is a valid member of an enum
 * @param value Value to validate
 * @param enumObject Enum object to check against
 * @param fieldName Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export const validateEnum = (
  value: any,
  enumObject: object,
  fieldName: string
): string | null => {
  const requiredError = validateRequired(value, fieldName);
  if (requiredError) return requiredError;
  
  const enumValues = Object.values(enumObject);
  if (!enumValues.includes(value)) {
    return `${fieldName} must be one of the following values: ${enumValues.join(', ')}`;
  }
  
  return null;
};

/**
 * Validates if a string can be parsed as a valid date
 * @param dateString Date string to validate
 * @param fieldName Name of the field for error message
 * @returns Error message if validation fails, null if valid
 */
export const validateDate = (dateString: string, fieldName: string): string | null => {
  const requiredError = validateRequired(dateString, fieldName);
  if (requiredError) return requiredError;
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return `${fieldName} must be a valid date`;
  }
  
  return null;
};

/**
 * Validates login form data
 * @param values Login form values
 * @returns Object containing validation errors for each field
 */
export const validateLoginForm = (values: LoginRequest): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;
  
  return errors;
};

/**
 * Validates signup form data
 * @param values Signup form values
 * @returns Object containing validation errors for each field
 */
export const validateSignupForm = (values: SignupRequest): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const emailError = validateEmail(values.email);
  if (emailError) errors.email = emailError;
  
  const passwordError = validatePassword(values.password);
  if (passwordError) errors.password = passwordError;
  
  const confirmPasswordError = validateRequired(values.confirmPassword, 'Confirm Password');
  if (confirmPasswordError) {
    errors.confirmPassword = confirmPasswordError;
  } else {
    const passwordMatchError = validatePasswordMatch(values.password, values.confirmPassword);
    if (passwordMatchError) errors.confirmPassword = passwordMatchError;
  }
  
  return errors;
};

/**
 * Validates meal entry form data
 * @param values Meal form values
 * @returns Object containing validation errors for each field
 */
export const validateMealForm = (values: {
  mealType?: MealType;
  description?: string;
  image?: { uri: string; type: string; name: string } | null;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const mealTypeError = validateEnum(values.mealType, MealType, 'Meal type');
  if (mealTypeError) errors.mealType = mealTypeError;
  
  if (values.description !== undefined) {
    const descriptionError = validateMaxLength(values.description, 1000, 'Description');
    if (descriptionError) errors.description = descriptionError;
  }
  
  const imageError = validateRequired(values.image, 'Image');
  if (imageError) errors.image = imageError;
  
  return errors;
};

/**
 * Validates lab result entry form data
 * @param values Lab result form values
 * @returns Object containing validation errors for each field
 */
export const validateLabResultForm = (values: {
  testType?: string;
  testDate?: string;
  notes?: string;
  image?: { uri: string; type: string; name: string } | null;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const testTypeError = validateRequired(values.testType, 'Test type');
  if (testTypeError) errors.testType = testTypeError;
  
  if (values.testDate) {
    const testDateError = validateDate(values.testDate, 'Test date');
    if (testDateError) errors.testDate = testDateError;
  } else {
    errors.testDate = 'Test date is required';
  }
  
  const imageError = validateRequired(values.image, 'Image');
  if (imageError) errors.image = imageError;
  
  if (values.notes !== undefined) {
    const notesError = validateMaxLength(values.notes, 1000, 'Notes');
    if (notesError) errors.notes = notesError;
  }
  
  return errors;
};

/**
 * Validates symptom entry form data
 * @param values Symptom form values
 * @returns Object containing validation errors for each field
 */
export const validateSymptomForm = (values: {
  description?: string;
  severity?: SymptomSeverity;
  duration?: string;
  audio?: { uri: string; type: string; name: string } | null;
  transcription?: string;
}): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  const descriptionError = validateRequired(values.description, 'Description');
  if (descriptionError) {
    errors.description = descriptionError;
  } else if (values.description) {
    const descMaxLengthError = validateMaxLength(values.description, 1000, 'Description');
    if (descMaxLengthError) errors.description = descMaxLengthError;
  }
  
  const severityError = validateEnum(values.severity, SymptomSeverity, 'Severity');
  if (severityError) errors.severity = severityError;
  
  const durationError = validateRequired(values.duration, 'Duration');
  if (durationError) errors.duration = durationError;
  
  // If no audio is provided, transcription should be required
  if (!values.audio && !values.transcription) {
    errors.transcription = 'Either audio recording or text description is required';
  }
  
  return errors;
};

/**
 * Checks if a form has any validation errors
 * @param errors Object containing validation errors
 * @returns True if form has no errors, false otherwise
 */
export const isFormValid = (errors: Record<string, string>): boolean => {
  return Object.keys(errors).length === 0 || Object.values(errors).every(error => !error);
};

/**
 * Sanitizes user input by removing potentially harmful characters
 * @param input Input string to sanitize
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Replace HTML tags with their escaped versions
  let sanitized = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};