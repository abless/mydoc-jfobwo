import { useState, useCallback } from 'react'; // react ^18.0.0
import { Alert } from 'react-native'; // react-native 0.71.0
import { captureImage, selectImageFromLibrary } from '../services/camera.service';
import { HealthDataType } from '../types/health.types';

/**
 * Interface defining the return value of the useCamera hook
 * Provides the necessary state and functions for camera functionality
 */
export interface UseCameraResult {
  /**
   * The current image information (uri, type, name), or null if no image is selected
   */
  image: { uri: string; type: string; name: string } | null;
  
  /**
   * Boolean indicating whether a camera operation is in progress
   */
  isLoading: boolean;
  
  /**
   * Error message if a camera operation failed, or null if no error
   */
  error: string | null;
  
  /**
   * Function to take a photo using the device camera
   */
  takePhoto: () => Promise<void>;
  
  /**
   * Function to select an image from the device gallery
   */
  selectFromGallery: () => Promise<void>;
  
  /**
   * Function to reset/clear the current image
   */
  resetImage: () => void;
}

/**
 * Custom hook that provides camera functionality for capturing and selecting images
 * for health data entry. This hook handles camera interactions, image selection,
 * and maintains state for the selected image and operation status.
 * 
 * @param dataType - The type of health data being recorded (MEAL or LAB_RESULT)
 * @returns An object containing camera state and functions
 * 
 * @example
 * ```tsx
 * // In a meal entry component
 * const { image, isLoading, takePhoto, selectFromGallery, resetImage } = useCamera(HealthDataType.MEAL);
 * 
 * // Render a camera button
 * return (
 *   <Button 
 *     title="Take Photo" 
 *     onPress={takePhoto} 
 *     disabled={isLoading} 
 *   />
 * );
 * ```
 */
export const useCamera = (dataType: HealthDataType): UseCameraResult => {
  // Validate that the data type is appropriate for camera functionality
  if (dataType !== HealthDataType.MEAL && dataType !== HealthDataType.LAB_RESULT) {
    console.error(`useCamera hook is only for MEAL or LAB_RESULT types, received: ${dataType}`);
    throw new Error(`useCamera hook is only for MEAL or LAB_RESULT types, received: ${dataType}`);
  }
  
  // Initialize state for the captured/selected image
  const [image, setImage] = useState<{ uri: string; type: string; name: string } | null>(null);
  
  // Initialize loading state for camera operations
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize error state for camera operation failures
  const [error, setError] = useState<string | null>(null);
  
  /**
   * Function to take a photo using the device camera
   * Sets loading state during the operation and updates the image state on success
   */
  const takePhoto = useCallback(async (): Promise<void> => {
    // Only proceed if not already loading
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await captureImage(dataType);
      
      // captureImage returns null if user cancels or if there's an error
      // The camera.service already handles showing alerts for specific error cases
      if (result) {
        setImage(result);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      setError('Failed to capture image. Please try again.');
      Alert.alert('Camera Error', 'An unexpected error occurred while capturing the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dataType, isLoading]);
  
  /**
   * Function to select an image from the device gallery
   * Sets loading state during the operation and updates the image state on success
   */
  const selectFromGallery = useCallback(async (): Promise<void> => {
    // Only proceed if not already loading
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await selectImageFromLibrary(dataType);
      
      // selectImageFromLibrary returns null if user cancels or if there's an error
      // The camera.service already handles showing alerts for specific error cases
      if (result) {
        setImage(result);
      }
    } catch (err) {
      console.error('Error selecting image from gallery:', err);
      setError('Failed to select image. Please try again.');
      Alert.alert('Gallery Error', 'An unexpected error occurred while selecting the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [dataType, isLoading]);
  
  /**
   * Function to reset/clear the current image
   * Also clears any error state
   */
  const resetImage = useCallback((): void => {
    setImage(null);
    setError(null);
  }, []);
  
  // Return camera state and functions
  return {
    image,
    isLoading,
    error,
    takePhoto,
    selectFromGallery,
    resetImage
  };
};