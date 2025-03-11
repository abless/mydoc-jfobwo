/**
 * @file storage.service.ts
 * 
 * Storage service that provides a wrapper around React Native's AsyncStorage.
 * This service handles persistent data storage for the mobile application with
 * proper error handling and type safety.
 * 
 * It includes:
 * - Base methods for storing, retrieving, and removing any data
 * - Specialized methods for common storage operations (auth tokens, user info, etc.)
 * - Error handling and logging
 * 
 * @version 1.0.0
 */

import AsyncStorage from '@react-native-async-storage/async-storage'; // v1.18.0
import { STORAGE_KEYS } from '../constants/storage';
import { UserResponse } from '../types/auth.types';

/**
 * StorageService class to handle AsyncStorage operations
 * Provides methods to store, retrieve, and remove data with error handling
 */
export class StorageService {
  /**
   * Stores data in AsyncStorage with error handling
   * @param key Storage key to use
   * @param value Data to store
   * @returns Promise that resolves when data is stored successfully
   */
  async storeData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('Error storing data:', error);
      throw error;
    }
  }

  /**
   * Retrieves data from AsyncStorage with error handling
   * @param key Storage key to retrieve
   * @returns Promise that resolves with the stored data or null if not found
   */
  async getData(key: string): Promise<any | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        try {
          // Attempt to parse as JSON
          return JSON.parse(value);
        } catch (e) {
          // If not valid JSON, return as is (string)
          return value;
        }
      }
      return null;
    } catch (error) {
      console.error('Error retrieving data:', error);
      return null;
    }
  }

  /**
   * Removes data from AsyncStorage with error handling
   * @param key Storage key to remove
   * @returns Promise that resolves when data is removed successfully
   */
  async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing data:', error);
      throw error;
    }
  }

  /**
   * Clears all application data from AsyncStorage
   * @returns Promise that resolves when all data is cleared successfully
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

// Create a singleton instance of the storage service
export const storageService = new StorageService();

// Export the base methods for direct use
export const storeData = storageService.storeData.bind(storageService);
export const getData = storageService.getData.bind(storageService);
export const removeData = storageService.removeData.bind(storageService);
export const clearAll = storageService.clearAll.bind(storageService);

/**
 * Stores authentication token in AsyncStorage
 * @param token JWT token to store
 * @returns Promise that resolves when token is stored successfully
 */
export const storeAuthToken = async (token: string): Promise<void> => {
  return storeData(STORAGE_KEYS.AUTH_TOKEN, token);
};

/**
 * Retrieves authentication token from AsyncStorage
 * @returns Promise that resolves with the token or null if not found
 */
export const getAuthToken = async (): Promise<string | null> => {
  return getData(STORAGE_KEYS.AUTH_TOKEN) as Promise<string | null>;
};

/**
 * Removes authentication token from AsyncStorage
 * @returns Promise that resolves when token is removed successfully
 */
export const removeAuthToken = async (): Promise<void> => {
  return removeData(STORAGE_KEYS.AUTH_TOKEN);
};

/**
 * Stores refresh token in AsyncStorage
 * @param token Refresh token to store
 * @returns Promise that resolves when refresh token is stored successfully
 */
export const storeRefreshToken = async (token: string): Promise<void> => {
  return storeData(STORAGE_KEYS.REFRESH_TOKEN, token);
};

/**
 * Retrieves refresh token from AsyncStorage
 * @returns Promise that resolves with the refresh token or null if not found
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return getData(STORAGE_KEYS.REFRESH_TOKEN) as Promise<string | null>;
};

/**
 * Stores user information in AsyncStorage
 * @param user User information to store
 * @returns Promise that resolves when user info is stored successfully
 */
export const storeUserInfo = async (user: UserResponse): Promise<void> => {
  return storeData(STORAGE_KEYS.USER_INFO, user);
};

/**
 * Retrieves user information from AsyncStorage
 * @returns Promise that resolves with the user info or null if not found
 */
export const getUserInfo = async (): Promise<UserResponse | null> => {
  return getData(STORAGE_KEYS.USER_INFO) as Promise<UserResponse | null>;
};

/**
 * Stores theme preference in AsyncStorage
 * @param theme Theme preference to store ('light', 'dark', or 'system')
 * @returns Promise that resolves when theme preference is stored successfully
 */
export const storeThemePreference = async (theme: string): Promise<void> => {
  return storeData(STORAGE_KEYS.THEME_PREFERENCE, theme);
};

/**
 * Retrieves theme preference from AsyncStorage
 * @returns Promise that resolves with the theme preference or null if not found
 */
export const getThemePreference = async (): Promise<string | null> => {
  return getData(STORAGE_KEYS.THEME_PREFERENCE) as Promise<string | null>;
};

/**
 * Stores the timestamp of the last data synchronization
 * @param timestamp Timestamp to store
 * @returns Promise that resolves when timestamp is stored successfully
 */
export const storeLastSyncTimestamp = async (timestamp: number): Promise<void> => {
  return storeData(STORAGE_KEYS.LAST_SYNC_TIMESTAMP, timestamp);
};

/**
 * Retrieves the timestamp of the last data synchronization
 * @returns Promise that resolves with the timestamp or null if not found
 */
export const getLastSyncTimestamp = async (): Promise<number | null> => {
  return getData(STORAGE_KEYS.LAST_SYNC_TIMESTAMP) as Promise<number | null>;
};

/**
 * Marks the onboarding process as completed
 * @returns Promise that resolves when onboarding status is stored successfully
 */
export const setOnboardingCompleted = async (): Promise<void> => {
  return storeData(STORAGE_KEYS.ONBOARDING_COMPLETED, true);
};

/**
 * Checks if the onboarding process has been completed
 * @returns Promise that resolves with true if onboarding is completed, false otherwise
 */
export const isOnboardingCompleted = async (): Promise<boolean> => {
  const completed = await getData(STORAGE_KEYS.ONBOARDING_COMPLETED);
  return completed === true;
};