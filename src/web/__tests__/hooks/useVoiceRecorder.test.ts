import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // @testing-library/react-hooks ^8.0.1
import useVoiceRecorder, { VoiceRecorderOptions } from '../../src/hooks/useVoiceRecorder';
import { VoiceService, getAudioFilePath } from '../../src/services/voice.service';

// Mock the voice service
jest.mock('../../src/services/voice.service', () => ({
  VoiceService: jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn(),
    playRecording: jest.fn(),
    stopPlayback: jest.fn(),
    startTranscription: jest.fn(),
    stopTranscription: jest.fn(),
    getAudioFileInfo: jest.fn(),
    deleteRecording: jest.fn(),
    cleanup: jest.fn()
  })),
  getAudioFilePath: jest.fn().mockReturnValue('test-audio-path.m4a')
}));

describe('useVoiceRecorder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up default mock implementations
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.recordingPath).toBe('');
    expect(result.current.transcription).toBe('');
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBe('');
    expect(result.current.permissionGranted).toBe(false);
  });

  it('should start recording successfully', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.startRecording).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(true);
    expect(result.current.permissionGranted).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('should handle recording permission denial', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(false),
      stopRecording: jest.fn().mockResolvedValue(''),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.startRecording).toHaveBeenCalled();
    expect(result.current.isRecording).toBe(false);
    expect(result.current.permissionGranted).toBe(false);
    expect(result.current.error).toBe('Failed to start recording');
  });

  it('should stop recording successfully', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder({ autoTranscribe: false }));
    
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.stopRecording).toHaveBeenCalled();
    expect(mockInstance.getAudioFileInfo).toHaveBeenCalledWith('test-recording-path.m4a');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.recordingPath).toBe('test-recording-path.m4a');
    expect(result.current.duration).toBe(5000);
    expect(result.current.error).toBe('');
  });

  it('should auto-transcribe after stopping recording when enabled', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder({ autoTranscribe: true }));
    
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.startTranscription).toHaveBeenCalledWith(
      'test-recording-path.m4a',
      expect.any(Function),
      expect.any(Function)
    );
    expect(result.current.isTranscribing).toBe(true);
  });

  it('should play recording successfully', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    // Set up a recording path first
    act(() => {
      result.current.recordingPath = 'test-recording-path.m4a';
    });
    
    await act(async () => {
      await result.current.playRecording();
    });
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.playRecording).toHaveBeenCalledWith('test-recording-path.m4a');
    expect(result.current.isPlaying).toBe(true);
    expect(result.current.error).toBe('');
  });

  it('should stop playback successfully', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    // Set up playing state first
    act(() => {
      result.current.isPlaying = true;
    });
    
    await act(async () => {
      await result.current.stopPlayback();
    });
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.stopPlayback).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.error).toBe('');
  });

  it('should delete recording successfully', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    // Set up a recording path first
    act(() => {
      result.current.recordingPath = 'test-recording-path.m4a';
    });
    
    await act(async () => {
      await result.current.deleteRecording();
    });
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.deleteRecording).toHaveBeenCalledWith('test-recording-path.m4a');
    expect(result.current.recordingPath).toBe('');
    expect(result.current.error).toBe('');
  });

  it('should reset state successfully', async () => {
    const { result } = renderHook(() => useVoiceRecorder());
    
    // Set up various states first
    act(() => {
      result.current.isRecording = true;
      result.current.isPlaying = true;
      result.current.isTranscribing = true;
      result.current.recordingPath = 'test-recording-path.m4a';
      result.current.transcription = 'Test transcription';
      result.current.duration = 5000;
      result.current.error = 'Test error';
    });
    
    await act(async () => {
      await result.current.reset();
    });
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.deleteRecording).toHaveBeenCalledWith('test-recording-path.m4a');
    expect(result.current.isRecording).toBe(false);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isTranscribing).toBe(false);
    expect(result.current.recordingPath).toBe('');
    expect(result.current.transcription).toBe('');
    expect(result.current.duration).toBe(0);
    expect(result.current.error).toBe('');
  });

  it('should handle recording errors', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockRejectedValue(new Error('Recording error')),
      stopRecording: jest.fn().mockResolvedValue(''),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder());
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(result.current.error).toBe('Recording error');
    expect(result.current.isRecording).toBe(false);
  });

  it('should handle playback errors', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockRejectedValue(new Error('Playback error')),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder());
    
    // Set up a recording path first
    act(() => {
      result.current.recordingPath = 'test-recording-path.m4a';
    });
    
    await act(async () => {
      await result.current.playRecording();
    });
    
    expect(result.current.error).toBe('Playback error');
    expect(result.current.isPlaying).toBe(false);
  });

  it('should handle transcription errors', async () => {
    // Create a mock implementation that simulates a transcription error
    let transcriptionErrorCallback: Function | null = null;
    
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockImplementation((path, onResult, onError) => {
        // Store the error callback to call it later
        transcriptionErrorCallback = onError;
        return Promise.resolve(true);
      }),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const { result } = renderHook(() => useVoiceRecorder({ autoTranscribe: true }));
    
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    
    // Now we should have the error callback stored
    expect(transcriptionErrorCallback).not.toBeNull();
    
    // Simulate a transcription error
    await act(async () => {
      if (transcriptionErrorCallback) {
        transcriptionErrorCallback('Transcription error');
      }
    });
    
    // Now we should see the error
    expect(result.current.error).toBe('Transcription error');
    expect(result.current.isTranscribing).toBe(false);
  });

  it('should call onTranscriptionComplete callback when transcription is done', async () => {
    // Create a mock implementation that simulates a successful transcription
    let transcriptionCallback: Function | null = null;
    
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('test-recording-path.m4a'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockImplementation((path, onResult, onError) => {
        // Store the callback to call it later
        transcriptionCallback = onResult;
        return Promise.resolve(true);
      }),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const onTranscriptionComplete = jest.fn();
    const { result } = renderHook(() => 
      useVoiceRecorder({ autoTranscribe: true, onTranscriptionComplete })
    );
    
    await act(async () => {
      await result.current.startRecording();
      await result.current.stopRecording();
    });
    
    // Now we should have the callback stored
    expect(transcriptionCallback).not.toBeNull();
    
    // Simulate transcription completion
    await act(async () => {
      if (transcriptionCallback) {
        transcriptionCallback('Test transcription');
      }
    });
    
    // Now we should see the results
    expect(result.current.transcription).toBe('Test transcription');
    expect(result.current.isTranscribing).toBe(false);
    expect(onTranscriptionComplete).toHaveBeenCalledWith('Test transcription');
  });

  it('should call onError callback when an error occurs', async () => {
    const mockVoiceService = VoiceService as jest.Mock;
    mockVoiceService.mockImplementation(() => ({
      startRecording: jest.fn().mockRejectedValue(new Error('Recording error')),
      stopRecording: jest.fn().mockResolvedValue(''),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      startTranscription: jest.fn().mockResolvedValue(true),
      stopTranscription: jest.fn().mockResolvedValue(undefined),
      getAudioFileInfo: jest.fn().mockResolvedValue({ exists: true, size: 1000, duration: 5000 }),
      deleteRecording: jest.fn().mockResolvedValue(true),
      cleanup: jest.fn().mockResolvedValue(undefined)
    }));
    
    const onError = jest.fn();
    const { result } = renderHook(() => useVoiceRecorder({ onError }));
    
    await act(async () => {
      await result.current.startRecording();
    });
    
    expect(onError).toHaveBeenCalledWith('Recording error');
    expect(result.current.error).toBe('Recording error');
  });

  it('should clean up resources on unmount', async () => {
    const { unmount } = renderHook(() => useVoiceRecorder());
    
    unmount();
    
    const mockVoiceService = VoiceService as jest.Mock;
    const mockInstance = mockVoiceService.mock.results[0].value;
    
    expect(mockInstance.cleanup).toHaveBeenCalled();
  });
});