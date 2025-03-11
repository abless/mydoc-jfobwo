import { Platform, Alert } from 'react-native'; // react-native v0.71.0
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions, Asset } from 'react-native-image-picker'; // react-native-image-picker v5.0.0
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'; // expo-image-manipulator ~11.0.0
import { checkCameraPermission, requestCameraPermission, checkStoragePermission, requestStoragePermission } from '../utils/permissions.utils';
import { HealthDataType } from '../types/health.types';

// Constants for image processing
const DEFAULT_IMAGE_QUALITY = 0.8;
const MAX_IMAGE_WIDTH = 1200;
const MAX_IMAGE_HEIGHT = 1200;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

/**
 * Captures an image using the device camera
 * @param dataType The type of health data being captured (meal or lab result)
 * @returns Promise resolving to image file information or null if capture failed or was cancelled
 */
export const captureImage = async (
  dataType: HealthDataType
): Promise<{ uri: string; type: string; name: string } | null> => {
  try {
    // Check camera permission
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      const granted = await requestCameraPermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to capture images. Please enable camera permissions in your device settings.'
        );
        return null;
      }
    }

    // Configure camera options based on data type
    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: MAX_IMAGE_HEIGHT,
      maxWidth: MAX_IMAGE_WIDTH,
      quality: DEFAULT_IMAGE_QUALITY,
      saveToPhotos: false, // Don't automatically save to device photos
      presentationStyle: 'fullScreen', // Use fullscreen camera on iOS
      cameraType: 'back', // Use back camera by default
    };

    // Launch camera
    const result = await launchCamera(options);

    // Handle user cancellation
    if (result.didCancel) {
      console.log('User cancelled camera');
      return null;
    }

    // Handle different error cases
    if (result.errorCode) {
      console.error(`Camera error: ${result.errorCode} - ${result.errorMessage}`);
      
      switch (result.errorCode) {
        case 'camera_unavailable':
          Alert.alert('Error', 'Camera is not available on this device.');
          break;
        case 'permission':
          Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
          break;
        case 'others':
        default:
          Alert.alert('Error', 'Failed to capture image. Please try again.');
          break;
      }
      
      return null;
    }

    // Ensure we have an asset
    if (!result.assets || result.assets.length === 0) {
      Alert.alert('Error', 'No image was captured. Please try again.');
      return null;
    }

    const asset = result.assets[0];

    // Process the image (resize, compress)
    const processedImage = await processImage(asset);

    // Get image type and generate filename
    const imageType = asset.type || getImageTypeFromUri(asset.uri);
    const fileName = generateImageFilename(dataType, imageType);

    return {
      uri: processedImage.uri,
      type: imageType,
      name: fileName,
    };
  } catch (error) {
    console.error('Error capturing image:', error);
    Alert.alert('Error', 'An unexpected error occurred while capturing the image. Please try again.');
    return null;
  }
};

/**
 * Selects an image from the device photo library
 * @param dataType The type of health data being captured (meal or lab result)
 * @returns Promise resolving to image file information or null if selection failed or was cancelled
 */
export const selectImageFromLibrary = async (
  dataType: HealthDataType
): Promise<{ uri: string; type: string; name: string } | null> => {
  try {
    // Check storage permission
    const hasPermission = await checkStoragePermission();
    if (!hasPermission) {
      const granted = await requestStoragePermission();
      if (!granted) {
        Alert.alert(
          'Permission Required',
          'Storage access is needed to select images. Please enable storage permissions in your device settings.'
        );
        return null;
      }
    }

    // Configure image library options
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: MAX_IMAGE_HEIGHT,
      maxWidth: MAX_IMAGE_WIDTH,
      quality: DEFAULT_IMAGE_QUALITY,
      selectionLimit: 1, // Only allow selecting one image
    };

    // Launch image library
    const result = await launchImageLibrary(options);

    // Handle user cancellation
    if (result.didCancel) {
      console.log('User cancelled image selection');
      return null;
    }

    // Handle different error cases
    if (result.errorCode) {
      console.error(`Image library error: ${result.errorCode} - ${result.errorMessage}`);
      
      switch (result.errorCode) {
        case 'permission':
          Alert.alert('Permission Denied', 'Photo library access permission is required to select images.');
          break;
        case 'others':
        default:
          Alert.alert('Error', 'Failed to select image. Please try again.');
          break;
      }
      
      return null;
    }

    // Ensure we have an asset
    if (!result.assets || result.assets.length === 0) {
      Alert.alert('Error', 'No image was selected. Please try again.');
      return null;
    }

    const asset = result.assets[0];

    // Validate selected image type
    const imageType = asset.type || getImageTypeFromUri(asset.uri);
    if (!ALLOWED_IMAGE_TYPES.includes(imageType)) {
      Alert.alert('Invalid Image Type', 'Please select a JPEG or PNG image.');
      return null;
    }

    // Process the image (resize, compress)
    const processedImage = await processImage(asset);

    // Generate filename
    const fileName = generateImageFilename(dataType, imageType);

    return {
      uri: processedImage.uri,
      type: imageType,
      name: fileName,
    };
  } catch (error) {
    console.error('Error selecting image from library:', error);
    Alert.alert('Error', 'An unexpected error occurred while selecting the image. Please try again.');
    return null;
  }
};

/**
 * Processes an image to optimize size and quality
 * @param image The image asset to process
 * @returns Promise resolving to processed image information
 */
export const processImage = async (
  image: Asset
): Promise<{ uri: string; width: number; height: number }> => {
  try {
    const { uri, width, height } = image;
    
    // Check if we need to resize the image
    let needsResize = false;
    let newWidth = width || MAX_IMAGE_WIDTH;
    let newHeight = height || MAX_IMAGE_HEIGHT;
    
    if (width && width > MAX_IMAGE_WIDTH) {
      newWidth = MAX_IMAGE_WIDTH;
      newHeight = height ? Math.floor((height / width) * MAX_IMAGE_WIDTH) : MAX_IMAGE_HEIGHT;
      needsResize = true;
    } else if (height && height > MAX_IMAGE_HEIGHT) {
      newHeight = MAX_IMAGE_HEIGHT;
      newWidth = width ? Math.floor((width / height) * MAX_IMAGE_HEIGHT) : MAX_IMAGE_WIDTH;
      needsResize = true;
    }
    
    // Manipulate the image if needed
    if (needsResize) {
      console.log(`Resizing image from ${width}x${height} to ${newWidth}x${newHeight}`);
      const manipResult = await manipulateAsync(
        uri,
        [{ resize: { width: newWidth, height: newHeight } }],
        { compress: DEFAULT_IMAGE_QUALITY, format: SaveFormat.JPEG }
      );
      
      return {
        uri: manipResult.uri,
        width: manipResult.width,
        height: manipResult.height,
      };
    }
    
    // If no resizing needed, just compress the image
    const manipResult = await manipulateAsync(
      uri,
      [],
      { compress: DEFAULT_IMAGE_QUALITY, format: SaveFormat.JPEG }
    );
    
    return {
      uri: manipResult.uri,
      width: manipResult.width,
      height: manipResult.height,
    };
  } catch (error) {
    console.error('Error processing image:', error);
    // Return original image if processing fails
    return {
      uri: image.uri,
      width: image.width || 0,
      height: image.height || 0,
    };
  }
};

/**
 * Generates a unique filename for an image based on data type and timestamp
 * @param dataType The type of health data (meal or lab result)
 * @param fileType The MIME type of the image
 * @returns Generated filename
 */
export const generateImageFilename = (dataType: HealthDataType, fileType: string): string => {
  // Create prefix based on data type
  const prefix = dataType === HealthDataType.MEAL ? 'meal' : 'lab_result';
  
  // Generate timestamp string
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Create random string for uniqueness
  const random = Math.random().toString(36).substring(2, 8);
  
  // Determine file extension from fileType
  let extension = '.jpg';
  if (fileType.includes('png')) {
    extension = '.png';
  } else if (fileType.includes('jpeg') || fileType.includes('jpg')) {
    extension = '.jpg';
  }
  
  return `${prefix}_${timestamp}_${random}${extension}`;
};

/**
 * Extracts the image MIME type from a file URI or path
 * @param uri The URI or path of the image file
 * @returns MIME type of the image
 */
export const getImageTypeFromUri = (uri: string): string => {
  // Extract file extension from URI
  const extension = uri.split('.').pop()?.toLowerCase() || '';
  
  // Map extension to corresponding MIME type
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    default:
      return 'image/jpeg'; // Default to JPEG if unknown
  }
};