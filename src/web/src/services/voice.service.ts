import { Platform, PermissionsAndroid, NativeModules } from 'react-native'; // react-native v0.71+
import { Audio } from 'expo-av'; // expo-av ~13.2.1
import * as FileSystem from 'expo-file-system'; // expo-file-system ~15.2.0
import Voice from 'react-native-voice'; // react-native-voice ^3.2.4

import { requestMicrophonePermission } from '../utils/permissions.utils';
import { InputSource } from '../types/health.types';

/**
 * Generates a unique file path for storing audio recordings
 * @param prefix Optional prefix for the filename
 * @returns A file path string for the audio recording
 */
export const getAudioFilePath = (prefix: string = 'recording'): string => {
  const timestamp = new Date().getTime();
  const directory = Platform.OS === 'ios' 
    ? FileSystem.documentDirectory 
    : FileSystem.cacheDirectory;
  
  return `${directory}${prefix}_${timestamp}.m4a`;
};

/**
 * Wrapper function around the imported requestMicrophonePermission to handle errors
 * @returns Promise resolving to true if permission is granted, false otherwise
 */
export const requestMicrophonePermissionWrapper = async (): Promise<boolean> => {
  try {
    return await requestMicrophonePermission();
  } catch (error) {
    console.error('Error requesting microphone permission:', error);
    return false;
  }
};

/**
 * Service class that provides voice recording, playback, and transcription functionality
 * for the Health Advisor application, primarily used for symptom reporting.
 */
export class VoiceService {
  // Recording state
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private isRecording: boolean = false;
  private isPlaying: boolean = false;
  private isTranscribing: boolean = false;
  private recordingPath: string = '';
  private recordingDuration: number = 0;
  
  // Transcription callbacks
  private onTranscriptionResult: ((text: string) => void) | null = null;
  private onTranscriptionError: ((error: any) => void) | null = null;

  /**
   * Initializes a new instance of the VoiceService class
   */
  constructor() {
    // Initialize properties
    this.recording = null;
    this.sound = null;
    this.isRecording = false;
    this.isPlaying = false;
    this.isTranscribing = false;
    this.recordingPath = '';
    this.recordingDuration = 0;
    
    // Set up Voice recognition event listeners
    Voice.onSpeechResults = this.handleTranscriptionResult.bind(this);
    Voice.onSpeechError = this.handleTranscriptionError.bind(this);
  }

  /**
   * Starts recording audio after requesting microphone permission
   * @param filePath Optional custom file path for the recording
   * @returns Promise resolving to true if recording started successfully, false otherwise
   */
  async startRecording(filePath?: string): Promise<boolean> {
    try {
      // Request microphone permission
      const hasPermission = await requestMicrophonePermissionWrapper();
      if (!hasPermission) {
        console.log('Microphone permission denied');
        return false;
      }

      // Prepare recording
      this.recordingPath = filePath || getAudioFilePath('symptom');
      
      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Create new recording instance
      this.recording = new Audio.Recording();
      
      // Prepare recording with audio quality settings
      await this.recording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      
      // Start recording
      await this.recording.startAsync();
      
      // Update state
      this.isRecording = true;
      
      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      this.recording = null;
      this.isRecording = false;
      return false;
    }
  }

  /**
   * Stops the current audio recording
   * @returns Promise resolving to the file path of the recorded audio
   */
  async stopRecording(): Promise<string> {
    try {
      if (!this.recording || !this.isRecording) {
        throw new Error('No active recording to stop');
      }
      
      // Stop recording
      await this.recording.stopAndUnloadAsync();
      
      // Get recording URI
      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }
      
      // Get recording status to determine duration
      const status = await this.recording.getStatusAsync();
      this.recordingDuration = status.durationMillis || 0;
      
      // Update state
      this.isRecording = false;
      this.recording = null;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      return uri;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      this.recording = null;
      return this.recordingPath || '';
    }
  }

  /**
   * Plays back the recorded audio file
   * @param filePath Optional path to the audio file to play (defaults to last recorded)
   * @returns Promise resolving when playback starts
   */
  async playRecording(filePath?: string): Promise<void> {
    try {
      // Use provided path or last recording path
      const path = filePath || this.recordingPath;
      if (!path) {
        throw new Error('No audio file path specified');
      }
      
      // Make sure we're not already playing
      if (this.isPlaying) {
        await this.stopPlayback();
      }
      
      // Configure audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      
      // Create and load sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true },
        this.onPlaybackStatusUpdate.bind(this)
      );
      
      this.sound = sound;
      this.isPlaying = true;
      
      await sound.playAsync();
    } catch (error) {
      console.error('Error playing recording:', error);
      this.isPlaying = false;
      this.sound = null;
    }
  }

  /**
   * Stops the current audio playback
   * @returns Promise resolving when playback stops
   */
  async stopPlayback(): Promise<void> {
    try {
      if (this.sound) {
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
      this.isPlaying = false;
    } catch (error) {
      console.error('Error stopping playback:', error);
      this.isPlaying = false;
      this.sound = null;
    }
  }

  /**
   * Starts the speech-to-text transcription process
   * @param filePath Optional path to the audio file to transcribe (defaults to last recorded)
   * @param onResult Callback function to receive transcription results
   * @param onError Callback function to receive transcription errors
   * @returns Promise resolving to true if transcription started successfully
   */
  async startTranscription(
    filePath?: string,
    onResult?: (text: string) => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      // Use provided path or last recording path
      const path = filePath || this.recordingPath;
      if (!path) {
        throw new Error('No audio file path specified');
      }
      
      // Store callback functions
      this.onTranscriptionResult = onResult || null;
      this.onTranscriptionError = onError || null;
      
      // Check if Voice is available
      if (!Voice.isAvailable()) {
        throw new Error('Voice recognition is not available');
      }
      
      // Start recognition on the audio file
      // Note: react-native-voice primarily supports live transcription from microphone
      // For a production app, you might want to use a server-side solution for file transcription
      // such as Google Cloud Speech-to-Text API
      
      // For this implementation, we'll use Voice's live recognition capabilities
      await Voice.start('en-US');
      
      this.isTranscribing = true;
      return true;
    } catch (error) {
      console.error('Error starting transcription:', error);
      if (this.onTranscriptionError) {
        this.onTranscriptionError(error);
      }
      this.isTranscribing = false;
      return false;
    }
  }

  /**
   * Stops the current transcription process
   * @returns Promise resolving when transcription stops
   */
  async stopTranscription(): Promise<void> {
    try {
      if (this.isTranscribing) {
        await Voice.stop();
        this.isTranscribing = false;
      }
    } catch (error) {
      console.error('Error stopping transcription:', error);
      this.isTranscribing = false;
    }
  }

  /**
   * Gets information about the recorded audio file
   * @param filePath Optional path to the audio file (defaults to last recorded)
   * @returns Promise resolving to object with file information
   */
  async getAudioFileInfo(filePath?: string): Promise<{ exists: boolean; size: number; duration: number }> {
    try {
      const path = filePath || this.recordingPath;
      if (!path) {
        return { exists: false, size: 0, duration: 0 };
      }
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(path);
      
      if (!fileInfo.exists) {
        return { exists: false, size: 0, duration: 0 };
      }
      
      return {
        exists: true,
        size: fileInfo.size || 0,
        duration: this.recordingDuration,
      };
    } catch (error) {
      console.error('Error getting audio file info:', error);
      return { exists: false, size: 0, duration: 0 };
    }
  }

  /**
   * Deletes the recorded audio file
   * @param filePath Optional path to the audio file to delete (defaults to last recorded)
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteRecording(filePath?: string): Promise<boolean> {
    try {
      const path = filePath || this.recordingPath;
      if (!path) {
        return false;
      }
      
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (!fileInfo.exists) {
        return false;
      }
      
      // Delete the file
      await FileSystem.deleteAsync(path);
      
      // Clear recording path if it matches the deleted file
      if (this.recordingPath === path) {
        this.recordingPath = '';
        this.recordingDuration = 0;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting recording:', error);
      return false;
    }
  }

  /**
   * Cleans up resources used by the service
   * @returns Promise resolving when cleanup is complete
   */
  async cleanup(): Promise<void> {
    try {
      // Stop any active recording
      if (this.isRecording && this.recording) {
        await this.stopRecording();
      }
      
      // Stop any active playback
      if (this.isPlaying && this.sound) {
        await this.stopPlayback();
      }
      
      // Stop any active transcription
      if (this.isTranscribing) {
        await this.stopTranscription();
      }
      
      // Remove Voice recognition event listeners
      Voice.destroy().then(() => {
        Voice.removeAllListeners();
      });
      
      // Reset all state variables
      this.recording = null;
      this.sound = null;
      this.isRecording = false;
      this.isPlaying = false;
      this.isTranscribing = false;
      this.recordingPath = '';
      this.recordingDuration = 0;
      this.onTranscriptionResult = null;
      this.onTranscriptionError = null;
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  /**
   * Handles transcription results from Voice recognition
   * @param result Result object from Voice recognition
   */
  private handleTranscriptionResult(result: any): void {
    try {
      if (result && result.value && result.value.length > 0) {
        const transcription = result.value[0];
        if (this.onTranscriptionResult) {
          this.onTranscriptionResult(transcription);
        }
      }
    } catch (error) {
      console.error('Error handling transcription result:', error);
    }
  }

  /**
   * Handles errors from Voice recognition
   * @param error Error object from Voice recognition
   */
  private handleTranscriptionError(error: any): void {
    console.error('Transcription error:', error);
    if (this.onTranscriptionError) {
      this.onTranscriptionError(error);
    }
  }

  /**
   * Handles playback status updates
   * @param status Playback status object
   */
  private onPlaybackStatusUpdate(status: any): void {
    if (status.didJustFinish) {
      // Playback just finished - cleanup
      this.stopPlayback();
    }
  }
}

// Re-export the microphone permission request function
export { requestMicrophonePermission };