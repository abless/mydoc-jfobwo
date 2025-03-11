import { renderHook, act } from '@testing-library/react-hooks'; // @testing-library/react-hooks v8.0.1
import { Alert } from 'react-native'; // react-native 0.71.0

import { useCamera } from '../../src/hooks/useCamera';
import { HealthDataType } from '../../src/types/health.types';
import { captureImage, selectImageFromLibrary } from '../../src/services/camera.service';

// Mock the camera service
jest.mock('../../src/services/camera.service', () => ({
  captureImage: jest.fn(),
  selectImageFromLibrary: jest.fn(),
  processImage: jest.fn()
}));

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn()
  }
}));

describe('useCamera hook', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set image when takePhoto is successful', async () => {
    // Mock the captureImage function to return a test image
    const testImage = { uri: 'test-uri', type: 'image/jpeg', name: 'test.jpg' };
    (captureImage as jest.Mock).mockResolvedValue(testImage);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute the takePhoto function
    await act(async () => {
      await result.current.takePhoto();
    });
    
    // Check the final state
    expect(result.current.image).toEqual(testImage);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verify captureImage was called with the right data type
    expect(captureImage).toHaveBeenCalledWith(HealthDataType.MEAL);
  });

  it('should handle error when takePhoto fails', async () => {
    // Mock the captureImage function to throw an error
    const testError = new Error('Camera error');
    (captureImage as jest.Mock).mockRejectedValue(testError);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute the takePhoto function
    await act(async () => {
      await result.current.takePhoto();
    });
    
    // Check the final state
    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to capture image. Please try again.');
    
    // Verify Alert.alert was called
    expect(Alert.alert).toHaveBeenCalledWith(
      'Camera Error',
      'An unexpected error occurred while capturing the image. Please try again.'
    );
  });

  it('should set image when selectFromGallery is successful', async () => {
    // Mock the selectImageFromLibrary function to return a test image
    const testImage = { uri: 'gallery-uri', type: 'image/jpeg', name: 'gallery.jpg' };
    (selectImageFromLibrary as jest.Mock).mockResolvedValue(testImage);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute the selectFromGallery function
    await act(async () => {
      await result.current.selectFromGallery();
    });
    
    // Check the final state
    expect(result.current.image).toEqual(testImage);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    
    // Verify selectImageFromLibrary was called with the right data type
    expect(selectImageFromLibrary).toHaveBeenCalledWith(HealthDataType.MEAL);
  });

  it('should handle error when selectFromGallery fails', async () => {
    // Mock the selectImageFromLibrary function to throw an error
    const testError = new Error('Gallery error');
    (selectImageFromLibrary as jest.Mock).mockRejectedValue(testError);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute the selectFromGallery function
    await act(async () => {
      await result.current.selectFromGallery();
    });
    
    // Check the final state
    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Failed to select image. Please try again.');
    
    // Verify Alert.alert was called
    expect(Alert.alert).toHaveBeenCalledWith(
      'Gallery Error',
      'An unexpected error occurred while selecting the image. Please try again.'
    );
  });

  it('should reset image when resetImage is called', async () => {
    // First set an image by mocking a successful takePhoto
    const testImage = { uri: 'test-uri', type: 'image/jpeg', name: 'test.jpg' };
    (captureImage as jest.Mock).mockResolvedValue(testImage);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute the takePhoto function to set an image
    await act(async () => {
      await result.current.takePhoto();
    });
    
    // Verify the image is set
    expect(result.current.image).toEqual(testImage);
    
    // Now reset the image
    act(() => {
      result.current.resetImage();
    });
    
    // Check that image is reset to null
    expect(result.current.image).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should pass correct data type to camera service functions', async () => {
    const { result } = renderHook(() => useCamera(HealthDataType.LAB_RESULT));
    
    // Execute takePhoto
    await act(async () => {
      await result.current.takePhoto();
    });
    
    // Verify captureImage was called with LAB_RESULT
    expect(captureImage).toHaveBeenCalledWith(HealthDataType.LAB_RESULT);
    
    // Execute selectFromGallery
    await act(async () => {
      await result.current.selectFromGallery();
    });
    
    // Verify selectImageFromLibrary was called with LAB_RESULT
    expect(selectImageFromLibrary).toHaveBeenCalledWith(HealthDataType.LAB_RESULT);
  });

  it('should handle null return from camera functions (user cancellation)', async () => {
    // Mock captureImage to return null (simulating user cancellation)
    (captureImage as jest.Mock).mockResolvedValue(null);
    
    const { result } = renderHook(() => useCamera(HealthDataType.MEAL));
    
    // Execute takePhoto
    await act(async () => {
      await result.current.takePhoto();
    });
    
    // Check that image remains null
    expect(result.current.image).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});