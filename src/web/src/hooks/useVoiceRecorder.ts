import { useState, useEffect, useCallback, useRef } from 'react'; // react v18.2.0
import { VoiceService, getAudioFilePath } from '../services/voice.service';
import { InputSource } from '../types/health.types';

/**
 * Interface defining the state of the voice recorder
 */
export interface VoiceRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  isTranscribing: boolean;
  recordingPath: string;
  transcription: string;
  duration: number;
  error: string;
  permissionGranted: boolean;
}

/**
 * Interface defining the control functions provided by the voice recorder
 */
export interface VoiceRecorderControls {
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string>;
  playRecording: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  deleteRecording: () => Promise<boolean>;
  reset: () => Promise<void>;
}

/**
 * Interface defining configuration options for the voice recorder
 */
export interface VoiceRecorderOptions {
  autoTranscribe: boolean;
  maxDuration: number;
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
}

/**
 * A custom React hook that provides voice recording functionality for symptom reporting
 * in the Health Advisor mobile application.
 * 
 * @param options Optional configuration options for the voice recorder
 * @returns An object containing both state values and control functions
 */
const useVoiceRecorder = (options?: Partial<VoiceRecorderOptions>) => {
  // Default options
  const defaultOptions: VoiceRecorderOptions = {
    autoTranscribe: true,
    maxDuration: 120, // 2 minutes
    onTranscriptionComplete: () => {},
    onError: () => {},
  };

  // Merge provided options with defaults
  const mergedOptions = { ...defaultOptions, ...options };

  // State initialization
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingPath, setRecordingPath] = useState<string>('');
  const [transcription, setTranscription] = useState<string>('');
  const [duration, setDuration] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);

  // Reference to hold the voice service instance
  const voiceServiceRef = useRef<VoiceService | null>(null);
  
  // Reference for the max duration timeout
  const maxDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize the voice service on component mount
  useEffect(() => {
    try {
      voiceServiceRef.current = new VoiceService();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize voice service';
      setError(errorMessage);
      mergedOptions.onError(errorMessage);
    }

    // Cleanup function to run on component unmount
    return () => {
      // Clear any active timeouts
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
        maxDurationTimeoutRef.current = null;
      }
      
      // Cleanup the voice service
      if (voiceServiceRef.current) {
        voiceServiceRef.current.cleanup().catch(err => {
          console.error('Error during voice service cleanup:', err);
        });
      }
    };
  }, [mergedOptions]);

  /**
   * Starts recording audio from the microphone
   * @returns Promise resolving to a boolean indicating success
   */
  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      // Check if voice service is initialized
      if (!voiceServiceRef.current) {
        throw new Error('Voice service not initialized');
      }

      // Reset error and transcription
      setError('');
      setTranscription('');

      // Generate a unique file path for this recording
      const filePath = getAudioFilePath('symptom');

      // Start the recording process
      const success = await voiceServiceRef.current.startRecording(filePath);

      if (success) {
        setIsRecording(true);
        setRecordingPath(filePath);
        setPermissionGranted(true);

        // Set a timeout to automatically stop recording after maxDuration
        if (mergedOptions.maxDuration > 0) {
          // Clear any existing timeout
          if (maxDurationTimeoutRef.current) {
            clearTimeout(maxDurationTimeoutRef.current);
          }
          
          maxDurationTimeoutRef.current = setTimeout(() => {
            if (isRecording) {
              stopRecording().catch(err => {
                console.error('Error auto-stopping recording:', err);
              });
            }
            maxDurationTimeoutRef.current = null;
          }, mergedOptions.maxDuration * 1000);
        }
      } else {
        setError('Failed to start recording');
        setPermissionGranted(false);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error while starting recording';
      setError(errorMessage);
      setIsRecording(false);
      mergedOptions.onError(errorMessage);
      return false;
    }
  }, [isRecording, mergedOptions]);

  /**
   * Stops the current audio recording
   * @returns Promise resolving to the file path of the recorded audio
   */
  const stopRecording = useCallback(async (): Promise<string> => {
    try {
      // Clear the max duration timeout if it exists
      if (maxDurationTimeoutRef.current) {
        clearTimeout(maxDurationTimeoutRef.current);
        maxDurationTimeoutRef.current = null;
      }

      if (!voiceServiceRef.current) {
        throw new Error('Voice service not initialized');
      }

      if (!isRecording) {
        return recordingPath;
      }

      // Stop the recording
      const filePath = await voiceServiceRef.current.stopRecording();

      // Get information about the recording file
      const fileInfo = await voiceServiceRef.current.getAudioFileInfo(filePath);

      // Update state
      setIsRecording(false);
      setDuration(fileInfo.duration);

      // Start transcription if auto-transcribe is enabled
      if (mergedOptions.autoTranscribe && filePath) {
        setIsTranscribing(true);
        voiceServiceRef.current.startTranscription(
          filePath,
          // Transcription success callback
          (text: string) => {
            setTranscription(text);
            setIsTranscribing(false);
            mergedOptions.onTranscriptionComplete(text);
          },
          // Transcription error callback
          (err: any) => {
            const errorMessage = typeof err === 'string'
              ? err
              : err instanceof Error ? err.message : 'Unknown transcription error';
            setError(errorMessage);
            setIsTranscribing(false);
            mergedOptions.onError(errorMessage);
          }
        );
      }

      return filePath;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error while stopping recording';
      setError(errorMessage);
      setIsRecording(false);
      mergedOptions.onError(errorMessage);
      return recordingPath;
    }
  }, [isRecording, recordingPath, mergedOptions]);

  /**
   * Plays back the recorded audio file
   * @returns Promise that resolves when playback starts
   */
  const playRecording = useCallback(async (): Promise<void> => {
    try {
      if (!voiceServiceRef.current) {
        throw new Error('Voice service not initialized');
      }

      if (!recordingPath) {
        throw new Error('No recording to play');
      }

      setIsPlaying(true);

      // Start playback - the voice service handles completion via event listener
      await voiceServiceRef.current.playRecording(recordingPath);
      
      // The voice service will call its own onPlaybackStatusUpdate method when playback ends
      // which will update isPlaying state through event handling
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error while playing recording';
      setError(errorMessage);
      setIsPlaying(false);
      mergedOptions.onError(errorMessage);
    }
  }, [recordingPath, mergedOptions]);

  /**
   * Stops the current audio playback
   * @returns Promise that resolves when playback stops
   */
  const stopPlayback = useCallback(async (): Promise<void> => {
    try {
      if (!voiceServiceRef.current) {
        throw new Error('Voice service not initialized');
      }

      await voiceServiceRef.current.stopPlayback();
      setIsPlaying(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error while stopping playback';
      setError(errorMessage);
      setIsPlaying(false);
      mergedOptions.onError(errorMessage);
    }
  }, [mergedOptions]);

  /**
   * Deletes the recorded audio file
   * @returns Promise resolving to boolean indicating success
   */
  const deleteRecording = useCallback(async (): Promise<boolean> => {
    try {
      if (!voiceServiceRef.current) {
        throw new Error('Voice service not initialized');
      }

      if (!recordingPath) {
        return false;
      }

      const success = await voiceServiceRef.current.deleteRecording(recordingPath);

      if (success) {
        setRecordingPath('');
        setTranscription('');
        setDuration(0);
      }

      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error while deleting recording';
      setError(errorMessage);
      mergedOptions.onError(errorMessage);
      return false;
    }
  }, [recordingPath, mergedOptions]);

  /**
   * Resets the voice recorder state and deletes any existing recording
   * @returns Promise that resolves when reset is complete
   */
  const reset = useCallback(async (): Promise<void> => {
    try {
      if (!voiceServiceRef.current) {
        return;
      }

      // Stop any active processes
      if (isRecording) {
        await voiceServiceRef.current.stopRecording();
      }
      
      if (isPlaying) {
        await voiceServiceRef.current.stopPlayback();
      }
      
      if (isTranscribing) {
        await voiceServiceRef.current.stopTranscription();
      }

      // Delete the recording if it exists
      if (recordingPath) {
        await voiceServiceRef.current.deleteRecording(recordingPath);
      }

      // Reset all state
      setIsRecording(false);
      setIsPlaying(false);
      setIsTranscribing(false);
      setRecordingPath('');
      setTranscription('');
      setDuration(0);
      setError('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error during reset';
      setError(errorMessage);
      mergedOptions.onError(errorMessage);
    }
  }, [isRecording, isPlaying, isTranscribing, recordingPath, mergedOptions]);

  // Return both state values and control functions
  return {
    // State
    isRecording,
    isPlaying,
    isTranscribing,
    recordingPath,
    transcription,
    duration,
    error,
    permissionGranted,
    
    // Controls
    startRecording,
    stopRecording,
    playRecording,
    stopPlayback,
    deleteRecording,
    reset,
  };
};

export default useVoiceRecorder;