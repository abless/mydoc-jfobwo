/**
 * Custom React hook for persisting and retrieving data from AsyncStorage with React state integration.
 * This hook provides a useState-like interface while automatically syncing state with AsyncStorage.
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react'; // react v18.2.0
import { storeData, getData } from '../services/storage.service';

/**
 * Type definition for the return value of the useLocalStorage hook
 * [0]: The stored value (of any type)
 * [1]: Function to update the stored value
 * [2]: Boolean indicating if data is being loaded
 * [3]: Error message if any occurred, or null
 */
export type UseLocalStorageResult<T> = [
  T, 
  (value: T | ((prevValue: T) => T)) => Promise<void>,
  boolean,
  string | null
];

/**
 * Custom hook for persisting and retrieving data from AsyncStorage with React state integration.
 * 
 * @param key - The storage key to use for persisting the data
 * @param initialValue - The default value to use if no value is stored
 * @returns A tuple containing:
 *   - The stored value (or initialValue if nothing was stored)
 *   - A function to update the stored value (similar to setState)
 *   - A boolean indicating if the data is currently being loaded
 *   - An error message if any error occurred, or null
 * 
 * @example
 * // Usage in a component
 * const [username, setUsername, loading, error] = useLocalStorage('username', '');
 * 
 * // Update the value
 * const handleChange = (newName) => {
 *   setUsername(newName);
 * };
 * 
 * // Using a function to update based on previous value
 * const updateUser = () => {
 *   setUsername(prev => prev + '!');
 * };
 */
export function useLocalStorage<T>(key: string, initialValue: T): UseLocalStorageResult<T> {
  // State to store our value, loading status, and error
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the initial value from AsyncStorage
  useEffect(() => {
    const fetchStoredValue = async () => {
      try {
        setLoading(true);
        setError(null);
        const value = await getData(key);
        
        // Use the stored value if it exists, otherwise use the initial value
        setStoredValue(value !== null ? value : initialValue);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error(`Error reading stored value for key "${key}":`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchStoredValue();
  }, [key, initialValue]);

  // Define the setValue function
  const setValue = useCallback(async (value: T | ((prevValue: T) => T)) => {
    try {
      setError(null);
      
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to AsyncStorage
      await storeData(key, valueToStore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred while storing data');
      console.error(`Error saving value for key "${key}":`, err);
    }
  }, [key, storedValue]);

  return [storedValue, setValue, loading, error];
}

export default useLocalStorage;