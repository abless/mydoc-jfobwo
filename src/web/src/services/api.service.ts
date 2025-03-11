/**
 * Core API service for the React Native mobile application that handles all HTTP requests to the backend server.
 * Provides methods for making authenticated and unauthenticated requests, handling errors,
 * retrying failed requests, and managing file uploads.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios'; // ^1.3.4
import { 
  API_CONSTANTS, 
  HTTP_STATUS,
  ERROR_MESSAGES 
} from '../constants/api.constants';
import { parseApiError } from '../utils/error.utils';
import { 
  getAuthToken, 
  storeAuthToken, 
  removeAuthToken 
} from './storage.service';
import { 
  HttpMethod, 
  ApiRequestConfig, 
  ApiRequestOptions,
  ApiServiceInterface
} from '../types/api.types';

/**
 * Service class for handling API requests to the backend server
 * Implements the ApiServiceInterface for consistent type-safe API communication
 */
export class ApiService implements ApiServiceInterface {
  private axios: AxiosInstance;
  private authToken: string | null = null;

  /**
   * Initializes the ApiService with default configuration
   */
  constructor() {
    // Initialize axios instance with base configuration
    this.axios = axios.create({
      baseURL: API_CONSTANTS.BASE_URL,
      timeout: API_CONSTANTS.TIMEOUT,
      headers: API_CONSTANTS.DEFAULT_HEADERS
    });

    // Set up request interceptor to add auth token if available
    this.axios.interceptors.request.use(
      async (config) => {
        if (this.authToken) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for error handling
    this.axios.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        // Handle 401 Unauthorized errors (token expired)
        if (error.response?.status === HTTP_STATUS.UNAUTHORIZED || 
            error.response?.status === HTTP_STATUS.FORBIDDEN) {
          // We'll handle token clearing in the request method to avoid
          // clearing token during requests that don't require auth
          console.warn('Authentication error occurred:', error.response?.status);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Makes a generic API request with the given configuration and options
   * @param config Request configuration object
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async request<T>(
    config: ApiRequestConfig,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    const {
      requiresAuth = true,
      retryCount = API_CONSTANTS.RETRY_COUNT,
      retryDelay = API_CONSTANTS.RETRY_DELAY,
      timeout = API_CONSTANTS.TIMEOUT
    } = options;

    // Check if authentication is required but no token is available
    if (requiresAuth && !this.authToken) {
      // Try to load token from storage as a fallback
      await this.loadAuthToken();
      
      // If still no token, throw authentication error
      if (!this.authToken) {
        throw new Error(ERROR_MESSAGES.AUTHENTICATION_ERROR);
      }
    }

    // Prepare axios request config
    const axiosConfig: AxiosRequestConfig = {
      url: config.url,
      method: config.method,
      headers: { ...config.headers },
      timeout: timeout
    };

    // Add data or params based on the request method
    if (
      config.method === HttpMethod.POST ||
      config.method === HttpMethod.PUT ||
      config.method === HttpMethod.PATCH
    ) {
      axiosConfig.data = config.data;
    } else if (config.params) {
      axiosConfig.params = config.params;
    }

    try {
      // Make request with retry logic
      const response = await this.retryRequest(axiosConfig, retryCount, retryDelay);
      return response.data;
    } catch (error) {
      // Handle authentication errors
      if (error.response?.status === HTTP_STATUS.UNAUTHORIZED || 
          error.response?.status === HTTP_STATUS.FORBIDDEN) {
        if (requiresAuth) {
          await this.clearAuthToken();
        }
      }
      
      // Parse and throw standardized error
      const parsedError = parseApiError(error);
      throw parsedError;
    }
  }

  /**
   * Makes a GET request to the specified URL
   * @param url The URL to make the request to
   * @param params Optional query parameters
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async get<T>(
    url: string,
    params: Record<string, any> = {},
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.GET,
        params
      },
      options
    );
  }

  /**
   * Makes a POST request to the specified URL with the given data
   * @param url The URL to make the request to
   * @param data The data to send in the request body
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async post<T>(
    url: string,
    data: any = {},
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.POST,
        data
      },
      options
    );
  }

  /**
   * Makes a PUT request to the specified URL with the given data
   * @param url The URL to make the request to
   * @param data The data to send in the request body
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async put<T>(
    url: string,
    data: any = {},
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.PUT,
        data
      },
      options
    );
  }

  /**
   * Makes a DELETE request to the specified URL
   * @param url The URL to make the request to
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async delete<T>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.DELETE
      },
      options
    );
  }

  /**
   * Makes a PATCH request to the specified URL with the given data
   * @param url The URL to make the request to
   * @param data The data to send in the request body
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async patch<T>(
    url: string,
    data: any = {},
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.PATCH,
        data
      },
      options
    );
  }

  /**
   * Uploads a file or form data to the specified URL
   * @param url The URL to upload the file to
   * @param formData FormData object containing the file and additional data
   * @param options Additional request options
   * @returns Promise that resolves with the API response data
   */
  async uploadFile<T>(
    url: string,
    formData: FormData,
    options: ApiRequestOptions = {}
  ): Promise<T> {
    return this.request<T>(
      {
        url,
        method: HttpMethod.POST,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      },
      options
    );
  }

  /**
   * Sets the authentication token for API requests
   * @param token JWT token to be used for authentication
   * @returns Promise that resolves when token is set
   */
  async setAuthToken(token: string): Promise<void> {
    this.authToken = token;
    await storeAuthToken(token);
  }

  /**
   * Clears the authentication token
   * @returns Promise that resolves when token is cleared
   */
  async clearAuthToken(): Promise<void> {
    this.authToken = null;
    await removeAuthToken();
  }

  /**
   * Loads the authentication token from storage if available
   * @returns Promise that resolves when token is loaded
   */
  async loadAuthToken(): Promise<void> {
    const token = await getAuthToken();
    if (token) {
      this.authToken = token;
    }
  }

  /**
   * Implements retry logic for failed requests
   * @param config Axios request configuration
   * @param retryCount Number of retry attempts
   * @param retryDelay Base delay between retries in milliseconds
   * @returns Promise that resolves with the API response
   */
  private async retryRequest(
    config: AxiosRequestConfig,
    retryCount: number,
    retryDelay: number
  ): Promise<any> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        return await this.axios.request(config);
      } catch (error: any) {
        lastError = error;
        
        // Don't retry if this is not a network error or server error
        const isNetworkError = !error.response && error.request;
        const isServerError = error.response && error.response.status >= 500;
        const isTimeoutError = error.code === 'ECONNABORTED' || 
                               (error.message && error.message.includes('timeout'));
        
        if (!isNetworkError && !isServerError && !isTimeoutError) {
          throw error;
        }
        
        if (attempt === retryCount) {
          throw error;
        }
        
        // Exponential backoff delay with jitter
        const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
        const delay = retryDelay * Math.pow(2, attempt) * jitter;
        console.log(`Request failed. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${retryCount})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }
}

// Create a singleton instance of the API service for use throughout the application
export const apiService = new ApiService();