/**
 * API type definitions for the Health Advisor mobile application.
 * These types provide a foundation for type-safe API communication between
 * the mobile app and the Express backend.
 */

/**
 * Enum representing HTTP methods used in API requests
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

/**
 * Enum for different types of API errors that can occur
 */
export enum ApiErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  LLM_SERVICE_ERROR = 'LLM_SERVICE_ERROR'
}

/**
 * Interface for API error details
 */
export interface ApiError {
  type: ApiErrorType;
  message: string;
  code: number;
  details?: Record<string, any>;
}

/**
 * Generic interface for successful API responses
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Interface for API error responses
 */
export interface ApiErrorResponse {
  success: boolean;
  error: ApiError;
}

/**
 * Generic interface for paginated API responses
 * Used for Health Log and Chat history endpoints
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Interface for pagination parameters in API requests
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

/**
 * Interface for API request configuration
 */
export interface ApiRequestConfig {
  url: string;
  method: HttpMethod;
  data?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

/**
 * Interface for API request options
 */
export interface ApiRequestOptions {
  requiresAuth?: boolean;
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
}

/**
 * Interface for file upload data structure
 * Used for uploading meal photos, lab results, and voice recordings
 */
export interface FileUpload {
  uri: string;
  name: string;
  type: string;
}

/**
 * Interface defining the API service methods
 * This will be implemented by the actual API service
 */
export interface ApiServiceInterface {
  /**
   * Generic request method
   * @param config Request configuration
   * @param options Request options
   * @returns Promise with response data
   */
  request<T>(config: ApiRequestConfig, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * GET request method
   * @param url API endpoint
   * @param params Query parameters
   * @param options Request options
   * @returns Promise with response data
   */
  get<T>(url: string, params?: Record<string, any>, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * POST request method
   * @param url API endpoint
   * @param data Request body
   * @param options Request options
   * @returns Promise with response data
   */
  post<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * PUT request method
   * @param url API endpoint
   * @param data Request body
   * @param options Request options
   * @returns Promise with response data
   */
  put<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * DELETE request method
   * @param url API endpoint
   * @param options Request options
   * @returns Promise with response data
   */
  delete<T>(url: string, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * PATCH request method
   * @param url API endpoint
   * @param data Request body
   * @param options Request options
   * @returns Promise with response data
   */
  patch<T>(url: string, data?: any, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * Upload file method
   * @param url API endpoint
   * @param formData Form data with file
   * @param options Request options
   * @returns Promise with response data
   */
  uploadFile<T>(url: string, formData: FormData, options?: ApiRequestOptions): Promise<T>;
  
  /**
   * Set authentication token for future requests
   * @param token JWT token
   */
  setAuthToken(token: string): Promise<void>;
  
  /**
   * Clear authentication token
   */
  clearAuthToken(): Promise<void>;
}