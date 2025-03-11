import { useState, useCallback, useEffect, useRef } from 'react'; // ^18.2.0
import { apiService } from '../services';
import { ApiError, ApiRequestOptions } from '../types/api.types';

/**
 * The result of the useApi hook, containing wrapped API methods and state
 */
export interface UseApiResult {
  /**
   * Whether any API request is currently in progress
   */
  loading: boolean;
  
  /**
   * The most recent error that occurred during an API request, or null if no error
   */
  error: ApiError | null;
  
  /**
   * Clears the current error state
   */
  clearError: () => void;
  
  /**
   * Makes a GET request with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param params - Optional query parameters
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  get: <T>(url: string, params?: Record<string, any>, options?: ApiRequestOptions) => Promise<T | null>;
  
  /**
   * Makes a POST request with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param data - Optional request body data
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  post: <T>(url: string, data?: any, options?: ApiRequestOptions) => Promise<T | null>;
  
  /**
   * Makes a PUT request with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param data - Optional request body data
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  put: <T>(url: string, data?: any, options?: ApiRequestOptions) => Promise<T | null>;
  
  /**
   * Makes a DELETE request with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  delete: <T>(url: string, options?: ApiRequestOptions) => Promise<T | null>;
  
  /**
   * Makes a PATCH request with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param data - Optional request body data
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  patch: <T>(url: string, data?: any, options?: ApiRequestOptions) => Promise<T | null>;
  
  /**
   * Uploads a file with automatic loading and error handling
   * 
   * @param url - The URL to make the request to
   * @param formData - FormData object containing the file and additional data
   * @param options - Optional request options
   * @returns Promise resolving to the response data or null if an error occurred
   */
  uploadFile: <T>(url: string, formData: FormData, options?: ApiRequestOptions) => Promise<T | null>;
}

/**
 * Custom hook that wraps API service methods with loading and error state management
 * 
 * This hook simplifies API calls in React components by automatically handling
 * loading states, error states, and cleanup when components unmount.
 * 
 * @returns Object containing wrapped API methods, loading state, and error state
 * 
 * @example
 * ```tsx
 * function UserProfile({ userId }) {
 *   const { get, loading, error } = useApi();
 *   const [user, setUser] = useState(null);
 * 
 *   useEffect(() => {
 *     const fetchUser = async () => {
 *       const userData = await get(`/api/users/${userId}`);
 *       if (userData) {
 *         setUser(userData);
 *       }
 *     };
 *     
 *     fetchUser();
 *   }, [userId, get]);
 * 
 *   if (loading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage message={error.message} />;
 *   if (!user) return null;
 * 
 *   return <UserProfileView user={user} />;
 * }
 * ```
 */
export const useApi = (): UseApiResult => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const mounted = useRef(true);

  // Cleanup on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback(() => {
    if (mounted.current) {
      setError(null);
    }
  }, []);

  /**
   * Generic request handler that manages loading and error states
   */
  const request = useCallback(async <T>(
    requestFn: () => Promise<T>
  ): Promise<T | null> => {
    if (mounted.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await requestFn();
      if (mounted.current) {
        setLoading(false);
      }
      return response;
    } catch (error) {
      if (mounted.current) {
        setLoading(false);
        setError(error as ApiError);
      }
      return null;
    }
  }, []);

  /**
   * Makes a GET request with automatic loading and error handling
   */
  const get = useCallback(<T>(
    url: string, 
    params?: Record<string, any>, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.get<T>(url, params, options));
  }, [request]);

  /**
   * Makes a POST request with automatic loading and error handling
   */
  const post = useCallback(<T>(
    url: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.post<T>(url, data, options));
  }, [request]);

  /**
   * Makes a PUT request with automatic loading and error handling
   */
  const put = useCallback(<T>(
    url: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.put<T>(url, data, options));
  }, [request]);

  /**
   * Makes a DELETE request with automatic loading and error handling
   */
  const deleteMethod = useCallback(<T>(
    url: string, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.delete<T>(url, options));
  }, [request]);

  /**
   * Makes a PATCH request with automatic loading and error handling
   */
  const patch = useCallback(<T>(
    url: string, 
    data?: any, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.patch<T>(url, data, options));
  }, [request]);

  /**
   * Uploads a file with automatic loading and error handling
   */
  const uploadFile = useCallback(<T>(
    url: string, 
    formData: FormData, 
    options?: ApiRequestOptions
  ): Promise<T | null> => {
    return request<T>(() => apiService.uploadFile<T>(url, formData, options));
  }, [request]);

  return {
    loading,
    error,
    clearError,
    get,
    post,
    put,
    delete: deleteMethod,
    patch,
    uploadFile
  };
};