/**
 * Data Input Components for Health Advisor application
 * 
 * This file exports all data input components used for health data entry,
 * including camera capture for meals and lab results, voice recording for
 * symptoms, and option selection for choosing data entry methods.
 * 
 * These components implement the Health Data Input feature (F-002) which
 * provides multiple methods for users to input health data through the
 * interfaces defined in the UI design specifications.
 * 
 * @version 1.0.0
 */

import CameraView from './CameraView';
import DataEntryOptions from './DataEntryOptions';
import VoiceRecorder from './VoiceRecorder';

// Export all data input components
export {
  CameraView,     // For capturing photos of meals and lab results
  DataEntryOptions, // For selecting data entry method from + button
  VoiceRecorder,  // For recording and transcribing symptom descriptions
};