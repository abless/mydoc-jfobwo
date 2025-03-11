import { NativeModules } from 'react-native';
import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Mock React Native Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock Gesture Handler
jest.mock('react-native-gesture-handler', () => ({}));

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  return {
    useSharedValue: jest.fn(),
    useAnimatedStyle: jest.fn(),
    withTiming: jest.fn(),
    withSpring: jest.fn(),
    withDelay: jest.fn(),
    runOnJS: jest.fn((fn) => fn)
  };
});

// Mock React Native Permissions
jest.mock('react-native-permissions', () => {
  return {
    PERMISSIONS: {
      IOS: {
        CAMERA: 'ios.permission.CAMERA',
        MICROPHONE: 'ios.permission.MICROPHONE',
        PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY'
      },
      ANDROID: {
        CAMERA: 'android.permission.CAMERA',
        RECORD_AUDIO: 'android.permission.RECORD_AUDIO',
        READ_EXTERNAL_STORAGE: 'android.permission.READ_EXTERNAL_STORAGE'
      }
    },
    check: jest.fn(() => Promise.resolve('granted')),
    request: jest.fn(() => Promise.resolve('granted'))
  };
});

// Mock React Native Camera
jest.mock('react-native-camera', () => {
  return {
    RNCamera: {
      Constants: {
        Type: {
          back: 'back',
          front: 'front'
        },
        FlashMode: {
          on: 'on',
          off: 'off',
          auto: 'auto'
        },
        CaptureMode: {
          still: 'still',
          video: 'video'
        }
      }
    }
  };
});

// Mock React Native Voice
jest.mock('react-native-voice', () => {
  return {
    onSpeechStart: jest.fn(),
    onSpeechEnd: jest.fn(),
    onSpeechResults: jest.fn(),
    onSpeechError: jest.fn(),
    start: jest.fn(() => Promise.resolve()),
    stop: jest.fn(() => Promise.resolve()),
    destroy: jest.fn(() => Promise.resolve())
  };
});

// Mock fetch API
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
);

// Mock FormData
global.FormData = class FormData {
  append() {}
};

// Suppress console errors and warnings during tests
global.console.error = jest.fn();
global.console.warn = jest.fn();

// Use fake timers for testing
jest.useFakeTimers();

/**
 * Sets up a mock for the Date object to ensure consistent date-based testing
 */
export function setupDateMock(): void {
  // Create a fixed date for testing
  const fixedDate = new Date('2023-05-15T10:00:00Z');
  
  // Save original Date
  const RealDate = global.Date;
  
  // Mock the Date constructor
  global.Date = class extends RealDate {
    constructor() {
      super();
      return fixedDate;
    }
    
    // Make sure static methods still work
    static now() {
      return fixedDate.getTime();
    }
  } as DateConstructor;
  
  // Restore the original Date functionality for these methods
  global.Date.UTC = RealDate.UTC;
  global.Date.parse = RealDate.parse;
}

/**
 * Sets up mocks for various React Native native modules
 */
export function setupNativeModuleMocks(): void {
  // StatusBarManager
  NativeModules.StatusBarManager = {
    height: 44
  };

  // RNCNetInfo
  NativeModules.RNCNetInfo = {
    getCurrentState: jest.fn(() => 
      Promise.resolve({ isConnected: true, isInternetReachable: true, type: 'wifi' })
    ),
    addListener: jest.fn(() => ({ remove: jest.fn() }))
  };

  // RNPermissions
  NativeModules.RNPermissions = {
    check: jest.fn(() => Promise.resolve('granted')),
    request: jest.fn(() => Promise.resolve('granted'))
  };

  // RNCameraRoll
  NativeModules.RNCameraRoll = {
    getPhotos: jest.fn(() => 
      Promise.resolve({ edges: [], page_info: { has_next_page: false } })
    ),
    saveToCameraRoll: jest.fn(() => Promise.resolve('file://test-image.jpg'))
  };

  // RNImagePicker
  NativeModules.RNImagePicker = {
    launchCamera: jest.fn(() => 
      Promise.resolve({ 
        didCancel: false, 
        assets: [{ 
          uri: 'file://test-image.jpg', 
          type: 'image/jpeg', 
          fileName: 'test-image.jpg' 
        }] 
      })
    ),
    launchImageLibrary: jest.fn(() => 
      Promise.resolve({ 
        didCancel: false, 
        assets: [{ 
          uri: 'file://test-image.jpg', 
          type: 'image/jpeg', 
          fileName: 'test-image.jpg' 
        }] 
      })
    )
  };
}