/**
 * Utility functions for handling, parsing, and formatting errors throughout the
 * React Native mobile application. Provides standardized error handling for API
 * responses, validation errors, and user-friendly error messages.
 */

import { AxiosError } from 'axios'; // ^1.3.4
import { ApiErrorType, ApiError } from '../types/api.types';

/**
 * Interface for standardized error object returned by parseApiError
 */
export interface ParsedError {
  type: ApiErrorType;
  message: string;
  details: Record<string, string>;
}

/**
 * Interface for error handler configuration options
 */
export interface ErrorHandlerOptions {
  onError?: (error: ParsedError) => void;
  onAuthError?: (error: ParsedError) => void;
  onNetworkError?: (error: ParsedError) => void;
  onValidationError?: (error: ParsedError) => void;
}

/**
 * Parses API errors from various sources into a standardized format
 * @param error Any error object that needs to be standardized
 * @returns Standardized ParsedError object
 */
export const parseApiError = (error: any): ParsedError => {
  // Default error values
  let errorType = ApiErrorType.SERVER_ERROR;
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: Record<string, string> = {};

  // Handle Axios errors
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError<any>;
    const statusCode = axiosError.response?.status;
    const responseData = axiosError.response?.data;

    // Determine error type from status code
    if (statusCode) {
      errorType = getErrorTypeFromStatus(statusCode);
    } else if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
      errorType = ApiErrorType.NETWORK_ERROR;
    } else if (!axiosError.response && axiosError.request) {
      errorType = ApiErrorType.NETWORK_ERROR;
    }

    // Extract error message from response
    if (responseData?.error?.message) {
      errorMessage = responseData.error.message;
    } else if (responseData?.message) {
      errorMessage = responseData.message;
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }

    // Extract validation details if available
    if (
      errorType === ApiErrorType.VALIDATION_ERROR &&
      responseData?.error?.details
    ) {
      errorDetails = formatValidationErrors(responseData.error.details);
    }
  }
  // Handle API Error objects directly
  else if (error?.type && Object.values(ApiErrorType).includes(error.type)) {
    errorType = error.type;
    errorMessage = error.message || getErrorMessage(errorType, '');
    if (error.details) {
      errorDetails = formatValidationErrors(error.details);
    }
  }
  // Handle LLM service errors
  else if (
    error?.message?.includes('LLM') ||
    error?.message?.includes('AI service')
  ) {
    errorType = ApiErrorType.LLM_SERVICE_ERROR;
    errorMessage = error.message || getErrorMessage(ApiErrorType.LLM_SERVICE_ERROR, '');
  }
  // Handle network errors
  else if (isNetworkError(error)) {
    errorType = ApiErrorType.NETWORK_ERROR;
    errorMessage = getErrorMessage(ApiErrorType.NETWORK_ERROR, error.message);
  }

  return {
    type: errorType,
    message: errorMessage,
    details: errorDetails,
  };
};

/**
 * Determines the error type based on HTTP status code
 * @param statusCode HTTP status code
 * @returns The corresponding API error type
 */
export const getErrorTypeFromStatus = (statusCode: number): ApiErrorType => {
  if (statusCode === 401 || statusCode === 403) {
    return statusCode === 403
      ? ApiErrorType.FORBIDDEN
      : ApiErrorType.AUTHENTICATION_ERROR;
  } else if (statusCode === 404) {
    return ApiErrorType.NOT_FOUND;
  } else if (statusCode === 422) {
    return ApiErrorType.VALIDATION_ERROR;
  } else if (statusCode >= 500 && statusCode < 600) {
    return ApiErrorType.SERVER_ERROR;
  }
  return ApiErrorType.NETWORK_ERROR;
};

/**
 * Gets a user-friendly error message based on error type
 * @param errorType Type of error from ApiErrorType enum
 * @param defaultMessage Optional default message to use if provided
 * @returns User-friendly error message
 */
export const getErrorMessage = (
  errorType: ApiErrorType,
  defaultMessage?: string
): string => {
  if (defaultMessage) {
    return defaultMessage;
  }

  switch (errorType) {
    case ApiErrorType.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection.';
    case ApiErrorType.AUTHENTICATION_ERROR:
      return 'Authentication failed. Please log in again.';
    case ApiErrorType.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case ApiErrorType.SERVER_ERROR:
      return 'Server error. Please try again later.';
    case ApiErrorType.NOT_FOUND:
      return 'The requested resource was not found.';
    case ApiErrorType.FORBIDDEN:
      return 'You do not have permission to access this resource.';
    case ApiErrorType.LLM_SERVICE_ERROR:
      return 'Unable to connect to the AI service. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Formats validation errors into a user-friendly format
 * @param validationErrors Object containing validation errors
 * @returns Formatted validation error messages
 */
export const formatValidationErrors = (
  validationErrors: Record<string, any>
): Record<string, string> => {
  const formattedErrors: Record<string, string> = {};

  Object.entries(validationErrors).forEach(([field, errors]) => {
    // Handle array of error messages
    if (Array.isArray(errors)) {
      formattedErrors[field] = errors[0].toString();
    }
    // Handle nested validation errors
    else if (typeof errors === 'object' && errors !== null) {
      const nestedErrors = formatValidationErrors(errors);
      Object.entries(nestedErrors).forEach(([nestedField, nestedError]) => {
        formattedErrors[`${field}.${nestedField}`] = nestedError;
      });
    }
    // Handle simple string error message
    else {
      formattedErrors[field] = errors.toString();
    }
  });

  return formattedErrors;
};

/**
 * Checks if an error is a network connectivity error
 * @param error Any error object
 * @returns True if the error is a network error
 */
export const isNetworkError = (error: any): boolean => {
  // Check for Axios specific network errors
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError;
    
    // No response received but request was sent
    if (!axiosError.response && axiosError.request) {
      return true;
    }
    
    // Timeout errors
    if (
      axiosError.code === 'ECONNABORTED' ||
      axiosError.message.includes('timeout')
    ) {
      return true;
    }
    
    // Network errors like ENOTFOUND, ECONNREFUSED, etc.
    if (
      axiosError.code === 'ENOTFOUND' ||
      axiosError.code === 'ECONNREFUSED' ||
      axiosError.code === 'ECONNRESET'
    ) {
      return true;
    }
  }
  
  // Check for error messages that indicate network problems
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('offline') ||
      message.includes('internet')
    ) {
      return true;
    }
  }
  
  return false;
};

/**
 * Checks if an error is an authentication error
 * @param error Any error object
 * @returns True if the error is an authentication error
 */
export const isAuthenticationError = (error: any): boolean => {
  // Check for Axios errors with 401 or 403 status
  if (error?.isAxiosError) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    if (status === 401 || status === 403) {
      return true;
    }
  }
  
  // Check if error type is explicitly set to AUTHENTICATION_ERROR or FORBIDDEN
  if (
    error?.type === ApiErrorType.AUTHENTICATION_ERROR ||
    error?.type === ApiErrorType.FORBIDDEN
  ) {
    return true;
  }
  
  // Check for authentication-related error messages
  if (error?.message) {
    const message = error.message.toLowerCase();
    if (
      message.includes('authentication') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('login') ||
      message.includes('token expired')
    ) {
      return true;
    }
  }
  
  return false;
};

/**
 * Creates a standardized error handler function with configurable options
 * @param options Configuration options for the error handler
 * @returns Error handler function that processes errors according to options
 */
export const createErrorHandler = (options: ErrorHandlerOptions = {}) => {
  return (error: any): ParsedError => {
    const parsedError = parseApiError(error);
    
    // Call general onError handler if provided
    if (options.onError) {
      options.onError(parsedError);
    }
    
    // Call specific error type handlers if provided
    if (isAuthenticationError(error) && options.onAuthError) {
      options.onAuthError(parsedError);
    } else if (isNetworkError(error) && options.onNetworkError) {
      options.onNetworkError(parsedError);
    } else if (
      parsedError.type === ApiErrorType.VALIDATION_ERROR &&
      options.onValidationError
    ) {
      options.onValidationError(parsedError);
    }
    
    return parsedError;
  };
};