import { Platform, PermissionsAndroid, Alert } from 'react-native'; // react-native v0.71+
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions'; // v3.8.0

/**
 * Checks if the application has permission to use the device camera
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      : PERMISSIONS.ANDROID.CAMERA;
    
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking camera permission:', error);
    return false;
  }
};

/**
 * Requests camera permission from the user
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      : PERMISSIONS.ANDROID.CAMERA;
    
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting camera permission:', error);
    return false;
  }
};

/**
 * Checks if the application has permission to use the device microphone
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const checkMicrophonePermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.MICROPHONE 
      : PERMISSIONS.ANDROID.RECORD_AUDIO;
    
    const result = await check(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking microphone permission:', error);
    return false;
  }
};

/**
 * Requests microphone permission from the user
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.MICROPHONE 
      : PERMISSIONS.ANDROID.RECORD_AUDIO;
    
    const result = await request(permission);
    return result === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Checks if the application has permission to access device storage (for Android)
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const checkStoragePermission = async (): Promise<boolean> => {
  try {
    // iOS doesn't require explicit storage permission for our use case
    if (Platform.OS === 'ios') {
      return true;
    }
    
    // For Android, check both read and write permissions
    // Note: For a more comprehensive implementation, consider Android version-specific
    // permissions like READ_MEDIA_IMAGES for Android 13+
    const readResult = await check(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    const writeResult = await check(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
    
    return readResult === RESULTS.GRANTED && writeResult === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error checking storage permission:', error);
    return false;
  }
};

/**
 * Requests storage permission from the user (for Android)
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const requestStoragePermission = async (): Promise<boolean> => {
  try {
    // iOS doesn't require explicit storage permission for our use case
    if (Platform.OS === 'ios') {
      return true;
    }
    
    // For Android, request both read and write permissions
    // Note: For a more comprehensive implementation, consider Android version-specific
    // permissions like READ_MEDIA_IMAGES for Android 13+
    const readResult = await request(PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE);
    const writeResult = await request(PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE);
    
    return readResult === RESULTS.GRANTED && writeResult === RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};

/**
 * Handles the case when a permission is denied, showing appropriate alerts to the user
 * @param permissionType The type of permission that was denied ('camera', 'microphone', 'storage')
 */
export const handlePermissionDenied = (permissionType: string): void => {
  let message = '';
  let title = 'Permission Required';
  
  switch (permissionType) {
    case 'camera':
      message = 'Camera access is required to take photos of your meals and lab results. Please enable camera access in your device settings.';
      break;
    case 'microphone':
      message = 'Microphone access is required to record your symptom descriptions. Please enable microphone access in your device settings.';
      break;
    case 'storage':
      message = 'Storage access is required to save photos of your meals and lab results. Please enable storage access in your device settings.';
      break;
    default:
      message = 'This feature requires additional permissions. Please enable them in your device settings.';
  }
  
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: openAppSettings }
    ]
  );
};

/**
 * Opens the application settings page where the user can modify permissions
 * @returns Promise that resolves when the action is complete
 */
export const openAppSettings = async (): Promise<void> => {
  try {
    await openSettings();
  } catch (error) {
    console.error('Error opening app settings:', error);
    Alert.alert(
      'Error',
      'Unable to open settings. Please open the settings app and enable permissions for Health Advisor manually.'
    );
  }
};