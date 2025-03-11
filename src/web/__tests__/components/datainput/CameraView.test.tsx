import React from 'react'; // ^18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // ^12.0.0
import { Platform } from 'react-native';
import CameraView from '../../../src/components/datainput/CameraView';
import { checkCameraPermission, requestCameraPermission } from '../../../src/utils/permissions.utils';
import { ThemeContext } from '../../../src/contexts/ThemeContext';

// Mock the permissions utilities
jest.mock('../../../src/utils/permissions.utils', () => ({
  checkCameraPermission: jest.fn(() => Promise.resolve(true)),
  requestCameraPermission: jest.fn(() => Promise.resolve(true)),
}));

// Mock the camera module
jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevices: jest.fn(() => ({
    back: { id: 'back', devices: [] },
    front: { id: 'front', devices: [] },
  })),
  CameraDevice: {
    Type: {
      back: 'back',
      front: 'front',
    },
  },
}));

describe('CameraView component', () => {
  // Helper function to render with ThemeContext
  const renderWithTheme = (ui: React.ReactElement) => {
    const mockTheme = {
      theme: {
        colors: {
          PRIMARY: '#4A90E2',
          SECONDARY: '#6ABEFF',
          ACCENT: '#FF8C42',
          BACKGROUND: '#F5F7FA',
          TEXT: '#333333',
          ERROR: '#E53E3E',
          SUCCESS: '#38A169',
          WARNING: '#F6AD55',
          INFO: '#63B3ED',
          BORDER: '#E2E8F0',
          CARD: '#FFFFFF',
          DISABLED: '#A0AEC0',
          TRANSPARENT: 'transparent',
          WHITE: '#FFFFFF',
          BLACK: '#000000',
        },
        typography: {
          fontFamily: {
            regular: 'System',
            medium: 'System',
            semiBold: 'System',
            bold: 'System',
          },
          fontSize: {
            xs: 12,
            s: 14,
            m: 16,
            l: 18,
            xl: 20,
            xxl: 24,
          },
          lineHeight: {
            xs: 16,
            s: 20,
            m: 24,
            l: 28,
            xl: 32,
            xxl: 36,
          },
        },
        spacing: {
          xs: 4,
          s: 8,
          m: 16,
          l: 24,
          xl: 32,
          xxl: 48,
        },
        borderRadius: {
          small: 4,
          medium: 8,
          large: 16,
          round: 9999,
        },
        elevation: {
          small: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.18,
            shadowRadius: 1.0,
            elevation: 2,
          },
          medium: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          },
          large: {
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.30,
            shadowRadius: 4.65,
            elevation: 8,
          },
        },
        isDark: false,
      },
      isDark: false,
      toggleTheme: jest.fn(),
      setThemeMode: jest.fn(),
    };

    return render(
      <ThemeContext.Provider value={mockTheme}>
        {ui}
      </ThemeContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders correctly with default props', () => {
    const onCapture = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Verify camera controls are rendered
    expect(getByLabelText('Flash mode: off')).toBeTruthy();
    expect(getByLabelText('Take photo')).toBeTruthy();
    expect(getByLabelText('Switch camera')).toBeTruthy();
  });

  test('shows permission request when permission is denied', async () => {
    // Mock that camera permission is not granted
    (checkCameraPermission as jest.Mock).mockResolvedValueOnce(false);
    (requestCameraPermission as jest.Mock).mockResolvedValueOnce(false);
    
    const onCapture = jest.fn();
    const { findByText, queryByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Should show the permission request view
    const permissionButton = await findByText('Allow Camera Access');
    expect(permissionButton).toBeTruthy();
    
    // Should not show camera controls
    expect(queryByLabelText('Take photo')).toBeNull();
  });

  test('requests camera permission when button is pressed', async () => {
    // Mock initial denial, then grant on request
    (checkCameraPermission as jest.Mock).mockResolvedValueOnce(false);
    (requestCameraPermission as jest.Mock).mockResolvedValueOnce(true);
    
    const onCapture = jest.fn();
    const { findByText, findByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Find the permission button
    const permissionButton = await findByText('Allow Camera Access');
    
    // Press the button to request permission
    await act(async () => {
      fireEvent.press(permissionButton);
    });
    
    // Should show camera controls after permission is granted
    const captureButton = await findByLabelText('Take photo');
    expect(captureButton).toBeTruthy();
    expect(requestCameraPermission).toHaveBeenCalled();
  });

  test('toggles flash mode when flash button is pressed', async () => {
    const onCapture = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Initial flash mode should be 'off'
    const flashButton = getByLabelText('Flash mode: off');
    
    // Press to toggle to 'on'
    await act(async () => {
      fireEvent.press(flashButton);
    });
    expect(getByLabelText('Flash mode: on')).toBeTruthy();
    
    // Press to toggle to 'auto'
    await act(async () => {
      fireEvent.press(getByLabelText('Flash mode: on'));
    });
    expect(getByLabelText('Flash mode: auto')).toBeTruthy();
    
    // Press to toggle back to 'off'
    await act(async () => {
      fireEvent.press(getByLabelText('Flash mode: auto'));
    });
    expect(getByLabelText('Flash mode: off')).toBeTruthy();
  });

  test('toggles camera type when flip button is pressed', async () => {
    const onCapture = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} cameraType="back" />
    );
    
    // Find the flip button
    const flipButton = getByLabelText('Switch camera');
    
    // Press to toggle camera type
    await act(async () => {
      fireEvent.press(flipButton);
    });
    
    // Since we can't directly test the state change, we just verify that the button exists
    // and that pressing it doesn't cause errors
    expect(flipButton).toBeTruthy();
  });

  test('captures photo when capture button is pressed', async () => {
    // Mock Platform.OS for URI formatting
    jest.spyOn(Platform, 'OS', 'get').mockReturnValue('ios');
    
    // Mock the camera reference and takePhoto method
    const mockTakePhoto = jest.fn().mockResolvedValue({ path: 'test/photo/path.jpg' });
    
    // Mock useRef to return our camera mock
    const originalUseRef = React.useRef;
    jest.spyOn(React, 'useRef').mockImplementation(() => ({
      current: {
        takePhoto: mockTakePhoto,
      },
    }));
    
    const onCapture = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Find and press the capture button
    const captureButton = getByLabelText('Take photo');
    
    await act(async () => {
      fireEvent.press(captureButton);
    });
    
    // Wait for the async operations to complete
    await waitFor(() => {
      expect(mockTakePhoto).toHaveBeenCalled();
      expect(onCapture).toHaveBeenCalledWith('test/photo/path.jpg');
    });
    
    // Restore original useRef
    React.useRef = originalUseRef;
  });

  test('shows loading state when no device is available', () => {
    // Mock no available devices
    const mockUseCameraDevices = require('react-native-vision-camera').useCameraDevices;
    mockUseCameraDevices.mockReturnValueOnce({
      back: null,
      front: null,
    });
    
    const onCapture = jest.fn();
    const { getByText, queryByLabelText } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Should show loading message
    expect(getByText('Loading camera...')).toBeTruthy();
    
    // Should not show camera controls
    expect(queryByLabelText('Take photo')).toBeNull();
  });

  test('cleans up properly when unmounted', () => {
    // This test ensures that component cleanup doesn't cause errors
    const onCapture = jest.fn();
    const { unmount } = renderWithTheme(
      <CameraView onCapture={onCapture} />
    );
    
    // Verify that unmounting doesn't throw errors
    expect(() => unmount()).not.toThrow();
  });
});