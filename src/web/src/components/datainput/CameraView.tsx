/**
 * A React Native component that provides a camera interface for capturing photos
 * of meals and lab results in the Health Advisor application.
 * Handles camera permissions, flash modes, camera switching, and photo capture.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'; // ^18.2.0
import { View, StyleSheet, Alert, TouchableOpacity, Platform } from 'react-native'; // ^0.71.0
import { Camera, useCameraDevices, CameraDevice, CameraPermissionStatus } from 'react-native-vision-camera'; // ^2.15.4
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // ^9.2.0

import { CameraViewProps } from '../../types/components.types';
import { useTheme } from '../../contexts/ThemeContext';
import { checkCameraPermission, requestCameraPermission } from '../../utils/permissions.utils';
import Button from '../buttons/Button';
import IconButton from '../buttons/IconButton';

/**
 * CameraView component for capturing photos of meals and lab results
 */
const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  flashMode = 'off',
  cameraType = 'back',
  style,
}) => {
  // State for camera permissions and settings
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentFlashMode, setCurrentFlashMode] = useState<'on' | 'off' | 'auto'>(flashMode);
  const [currentCameraType, setCurrentCameraType] = useState<'front' | 'back'>(cameraType);
  
  // Get current theme
  const { theme } = useTheme();
  
  // Camera reference for taking photos
  const cameraRef = useRef<Camera>(null);
  
  // Check and request camera permissions on mount
  useEffect(() => {
    const checkPermission = async () => {
      const hasPermission = await checkCameraPermission();
      if (hasPermission) {
        setHasPermission(true);
      } else {
        const granted = await requestCameraPermission();
        setHasPermission(granted);
      }
    };
    
    checkPermission();
  }, []);
  
  /**
   * Captures a photo using the camera and passes URI to onCapture callback
   */
  const handleCapturePhoto = useCallback(async () => {
    if (cameraRef.current && !isCapturing) {
      try {
        setIsCapturing(true);
        const photo = await cameraRef.current.takePhoto({
          flash: currentFlashMode,
          qualityPrioritization: 'quality',
        });
        
        // Convert file path to compatible URI format for both platforms
        const uri = Platform.OS === 'ios' 
          ? photo.path 
          : `file://${photo.path}`;
        
        onCapture(uri);
      } catch (error) {
        console.error('Error capturing photo:', error);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      } finally {
        setIsCapturing(false);
      }
    }
  }, [currentFlashMode, isCapturing, onCapture]);
  
  /**
   * Toggles flash mode in sequence: off -> on -> auto -> off
   */
  const toggleFlash = useCallback(() => {
    setCurrentFlashMode(prevMode => {
      switch (prevMode) {
        case 'off':
          return 'on';
        case 'on':
          return 'auto';
        case 'auto':
        default:
          return 'off';
      }
    });
  }, []);
  
  /**
   * Toggles between front and back camera
   */
  const toggleCamera = useCallback(() => {
    setCurrentCameraType(prevType => prevType === 'back' ? 'front' : 'back');
  }, []);
  
  // Get available camera devices
  const devices = useCameraDevices();
  const device = currentCameraType === 'back' ? devices.back : devices.front;
  
  // Render loading state if no device is available yet
  if (!device) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.BACKGROUND }]}>
        <View style={styles.loadingContainer}>
          <Button label="Loading camera..." disabled={true} />
        </View>
      </View>
    );
  }
  
  // Render permission request if no permission
  if (hasPermission === false) {
    return (
      <View style={[styles.container, style, { backgroundColor: theme.colors.BACKGROUND }]}>
        <View style={styles.permissionContainer}>
          <Button 
            label="Allow Camera Access" 
            onPress={async () => {
              const granted = await requestCameraPermission();
              setHasPermission(granted);
            }} 
          />
        </View>
      </View>
    );
  }
  
  /**
   * Returns the appropriate flash icon name based on current flash mode
   */
  const getFlashIcon = () => {
    switch (currentFlashMode) {
      case 'on':
        return 'flash';
      case 'auto':
        return 'flash-auto';
      case 'off':
      default:
        return 'flash-off';
    }
  };
  
  // Render the camera interface with controls
  return (
    <View style={[styles.container, style]}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        device={device}
        isActive={true}
        photo={true}
        enableZoomGesture
      />
      
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Flash toggle button */}
          <IconButton
            icon={<MaterialCommunityIcons name={getFlashIcon()} size={24} color={theme.colors.WHITE} />}
            onPress={toggleFlash}
            accessibilityLabel={`Flash mode: ${currentFlashMode}`}
          />
          
          {/* Capture button */}
          <TouchableOpacity
            style={[
              styles.captureButton,
              { borderColor: theme.colors.WHITE }
            ]}
            onPress={handleCapturePhoto}
            disabled={isCapturing}
            accessibilityLabel="Take photo"
            accessibilityRole="button"
          >
            <View 
              style={[
                styles.captureButtonInner, 
                { backgroundColor: isCapturing ? theme.colors.SECONDARY : theme.colors.WHITE }
              ]} 
            />
          </TouchableOpacity>
          
          {/* Camera flip button */}
          <IconButton
            icon={<MaterialCommunityIcons name="camera-flip" size={24} color={theme.colors.WHITE} />}
            onPress={toggleCamera}
            accessibilityLabel="Switch camera"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 8,
  },
  camera: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
});

export default CameraView;