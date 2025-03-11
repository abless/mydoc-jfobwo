/**
 * Services index file
 * 
 * Central export file for all service modules in the React Native mobile application.
 * Provides a unified entry point for accessing API communication, authentication,
 * health data management, chat functionality, storage, camera operations, and voice recording
 * services throughout the application.
 * 
 * This file implements the Facade pattern, simplifying access to the various service modules
 * by providing a single import point.
 */

// API Service for backend communication
// Provides methods for making authenticated HTTP requests to the backend
export { apiService } from './api.service';

// Authentication Service for user login, signup, and session management
// Handles user authentication operations including JWT token management
export { authService } from './auth.service';

// Chat Service for LLM health advisor interaction
// Functions for sending messages to the LLM and managing chat conversations
export { 
  sendMessage,
  getConversations,
  getConversation,
  getMessages,
  createConversation
} from './chat.service';

// Health Service for health data management (meals, lab results, symptoms)
// Functions for creating, retrieving, and managing health data entries
export {
  getHealthDataById,
  getHealthData,
  getHealthDataByDate,
  searchHealthData,
  createMealData,
  createLabResultData,
  createSymptomData,
  createHealthData,
  deleteHealthData,
  formatHealthDataForDisplay,
  groupHealthDataByDate,
  getHealthContext
} from './health.service';

// Storage Service for AsyncStorage operations
// Provides methods for securely storing and retrieving data from device storage
export {
  storeData,
  getData,
  removeData,
  clearAll,
  storeAuthToken,
  getAuthToken,
  removeAuthToken,
  storeRefreshToken,
  getRefreshToken,
  storeUserInfo,
  getUserInfo,
  storeThemePreference,
  getThemePreference,
  storeLastSyncTimestamp,
  getLastSyncTimestamp,
  setOnboardingCompleted,
  isOnboardingCompleted,
  storageService
} from './storage.service';

// Camera Service for image capture and processing
// Functions for capturing, selecting, and processing images for health data input
export {
  captureImage,
  selectImageFromLibrary,
  processImage,
  getImageTypeFromUri
} from './camera.service';

// Voice Service for audio recording and transcription
// Provides functionality for voice recording, playback, and transcription for symptom reporting
export {
  VoiceService,
  requestMicrophonePermission,
  getAudioFilePath
} from './voice.service';