/**
 * Hooks Index
 * 
 * This file exports all custom React hooks used in the Health Advisor mobile application.
 * It serves as a central export point for hooks that handle API requests, authentication,
 * camera functionality, chat interactions, form management, health data operations,
 * keyboard events, local storage, and voice recording.
 * 
 * By using this index file, we can import hooks more cleanly in components:
 * import { useAuth, useHealthData, useChat } from '../hooks';
 * 
 * @version 1.0.0
 */

// API request hook for making HTTP requests with loading and error states
export { useApi, UseApiResult } from './useApi';

// Authentication hook for user login, signup, and session management
export { useAuth, UseAuthResult } from './useAuth';

// Camera hook for capturing photos for meals and lab results
export { useCamera, UseCameraResult } from './useCamera';

// Chat hook for interacting with the LLM health advisor
export { useChat, UseChatResult } from './useChat';

// Form management hook for handling form state, validation, and submission
export { useForm } from './useForm';

// Health data hook for managing health records (meals, lab results, symptoms)
export { useHealthData } from './useHealthData';

// Keyboard hook for tracking keyboard visibility and adjusting layouts
export { default as useKeyboard, KeyboardState } from './useKeyboard';

// Local storage hook for persisting data with AsyncStorage
export { useLocalStorage, UseLocalStorageResult } from './useLocalStorage';

// Voice recorder hook for capturing symptom descriptions
export { default as useVoiceRecorder } from './useVoiceRecorder';
export { 
  VoiceRecorderState,
  VoiceRecorderControls,
  VoiceRecorderOptions 
} from './useVoiceRecorder';