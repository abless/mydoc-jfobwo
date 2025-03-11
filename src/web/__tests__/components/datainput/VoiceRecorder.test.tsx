import React from 'react'; // React v18.2.0
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'; // ^11.5.0
import { TouchableOpacity, Text, View } from 'react-native'; // v0.71.0

import VoiceRecorder from '../../../src/components/datainput/VoiceRecorder';
import useVoiceRecorder from '../../../src/hooks/useVoiceRecorder';

// Mock the useVoiceRecorder hook
jest.mock('../../../src/hooks/useVoiceRecorder', () => ({ __esModule: true, default: jest.fn() }));

describe('VoiceRecorder component', () => {
  // Default mock implementation for useVoiceRecorder hook
  beforeEach(() => {
    jest.resetAllMocks();
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('recording-path'),
      playRecording: jest.fn().mockResolvedValue(undefined),
      stopPlayback: jest.fn().mockResolvedValue(undefined),
      deleteRecording: jest.fn().mockResolvedValue(true),
      reset: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('should render correctly in initial state', () => {
    // Mock useVoiceRecorder to return initial state values
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByLabelText, queryByText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the microphone button is rendered
    const micButton = getByLabelText('Start recording');
    expect(micButton).toBeTruthy();

    // Verify that the recording status text shows 'Ready'
    const statusText = getByLabelText('Recording status: Tap microphone to start recording');
    expect(statusText).toBeTruthy();

    // Verify that no transcription text is displayed
    expect(queryByText('Transcription:')).toBeNull();
  });

  it('should show recording state when recording', () => {
    // Mock useVoiceRecorder to return isRecording: true
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: true,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the microphone button has the recording state
    const micButton = getByLabelText('Stop recording');
    expect(micButton).toBeTruthy();

    // Verify that the recording status text shows 'Recording...'
    const statusText = getByLabelText('Recording status: Recording...');
    expect(statusText).toBeTruthy();
  });

  it('should show transcribing state when transcribing', () => {
    // Mock useVoiceRecorder to return isTranscribing: true
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: true,
      recordingPath: 'test-path',
      transcription: '',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByLabelText, getByRole } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the loading indicator is displayed
    const loadingIndicator = getByRole('progressbar');
    expect(loadingIndicator).toBeTruthy();

    // Verify that the recording status text shows 'Transcribing...'
    const statusText = getByLabelText('Recording status: Transcribing...');
    expect(statusText).toBeTruthy();
  });

  it('should show playing state when playing', () => {
    // Mock useVoiceRecorder to return isPlaying: true
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: true,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText, getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the stop button is displayed
    const stopButton = getByText('Stop');
    expect(stopButton).toBeTruthy();

    // Verify that the recording status text shows 'Playing...'
    const statusText = getByLabelText('Recording status: Recording complete (5s)');
    expect(statusText).toBeTruthy();
  });

  it('should display transcription when available', () => {
    // Mock useVoiceRecorder to return transcription
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the transcription text is displayed
    const transcriptionLabel = getByText('Transcription:');
    expect(transcriptionLabel).toBeTruthy();
    
    const transcriptionText = getByText('Test transcription');
    expect(transcriptionText).toBeTruthy();
  });

  it('should start recording when microphone button is pressed', () => {
    // Create a mock for startRecording
    const mockStartRecording = jest.fn().mockResolvedValue(true);
    
    // Mock useVoiceRecorder to return the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: '',
      permissionGranted: true,
      startRecording: mockStartRecording,
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the microphone button
    const micButton = getByLabelText('Start recording');
    fireEvent.press(micButton);

    // Verify that startRecording was called
    expect(mockStartRecording).toHaveBeenCalled();
  });

  it('should stop recording when stop button is pressed', () => {
    // Create a mock for stopRecording
    const mockStopRecording = jest.fn().mockResolvedValue('test-path');
    
    // Mock useVoiceRecorder to return isRecording: true and the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: true,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: mockStopRecording,
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the stop button (which is the mic button in recording state)
    const stopButton = getByLabelText('Stop recording');
    fireEvent.press(stopButton);

    // Verify that stopRecording was called
    expect(mockStopRecording).toHaveBeenCalled();
  });

  it('should play recording when play button is pressed', () => {
    // Create a mock for playRecording
    const mockPlayRecording = jest.fn().mockResolvedValue(undefined);
    
    // Mock useVoiceRecorder to return recordingPath and the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: mockPlayRecording,
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the play button
    const playButton = getByText('Play');
    fireEvent.press(playButton);

    // Verify that playRecording was called
    expect(mockPlayRecording).toHaveBeenCalled();
  });

  it('should stop playback when stop button is pressed during playback', () => {
    // Create a mock for stopPlayback
    const mockStopPlayback = jest.fn().mockResolvedValue(undefined);
    
    // Mock useVoiceRecorder to return isPlaying: true and the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: true,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: mockStopPlayback,
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the stop button
    const stopButton = getByText('Stop');
    fireEvent.press(stopButton);

    // Verify that stopPlayback was called
    expect(mockStopPlayback).toHaveBeenCalled();
  });

  it('should delete recording when delete button is pressed', () => {
    // Create a mock for deleteRecording
    const mockDeleteRecording = jest.fn().mockResolvedValue(true);
    
    // Mock useVoiceRecorder to return recordingPath and the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: mockDeleteRecording,
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the delete button
    const deleteButton = getByText('Delete');
    fireEvent.press(deleteButton);

    // Verify that deleteRecording was called
    expect(mockDeleteRecording).toHaveBeenCalled();
  });

  it('should call onRecordComplete when save button is pressed', () => {
    // Create a mock for onRecordComplete callback
    const mockOnRecordComplete = jest.fn();
    
    // Mock useVoiceRecorder to return recordingPath and transcription
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: 'test-path',
      transcription: 'Test transcription',
      duration: 5000,
      error: '',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component with the mock callback
    const { getByText } = render(
      <VoiceRecorder onRecordComplete={mockOnRecordComplete} />
    );

    // Find and press the save button
    const saveButton = getByText('Save');
    fireEvent.press(saveButton);

    // Verify that onRecordComplete was called with the correct parameters
    expect(mockOnRecordComplete).toHaveBeenCalledWith('test-path', 'Test transcription');
  });

  it('should handle errors gracefully', () => {
    // Mock useVoiceRecorder to return error
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: 'Test error',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: jest.fn(),
    });

    // Render the VoiceRecorder component
    const { getByText, getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Verify that the error message is displayed
    const errorMessage = getByText('Test error');
    expect(errorMessage).toBeTruthy();
    
    // Verify that the error message has the correct accessibility label
    expect(getByLabelText('Error: Test error')).toBeTruthy();
  });

  it('should retry recording when retry button is pressed after error', () => {
    // Create a mock for reset function
    const mockReset = jest.fn().mockResolvedValue(undefined);
    
    // Mock useVoiceRecorder to return error and the mock function
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isPlaying: false,
      isTranscribing: false,
      recordingPath: '',
      transcription: '',
      duration: 0,
      error: 'Test error',
      permissionGranted: true,
      startRecording: jest.fn(),
      stopRecording: jest.fn(),
      playRecording: jest.fn(),
      stopPlayback: jest.fn(),
      deleteRecording: jest.fn(),
      reset: mockReset,
    });

    // Render the VoiceRecorder component
    const { getByLabelText } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} />
    );

    // Find and press the microphone button to attempt recording again
    const micButton = getByLabelText('Start recording');
    fireEvent.press(micButton);

    // Verify that the reset function was called
    expect(mockReset).toHaveBeenCalled();
  });

  it('should respect maxDuration prop', () => {
    // Render the VoiceRecorder component with maxDuration prop
    render(<VoiceRecorder onRecordComplete={jest.fn()} maxDuration={60} />);

    // Verify that useVoiceRecorder was called with the correct maxDuration value
    expect(useVoiceRecorder).toHaveBeenCalledWith(
      expect.objectContaining({
        maxDuration: 60,
      })
    );
  });

  it('should apply custom styles when provided', () => {
    // Create a custom style object
    const customStyle = { backgroundColor: 'red', padding: 20 };

    // Render the VoiceRecorder component with the style prop
    const { toJSON } = render(
      <VoiceRecorder onRecordComplete={jest.fn()} style={customStyle} />
    );

    // Get the JSON representation of the rendered component
    const tree = toJSON();

    // The style prop is typically merged into an array of styles
    // Find our custom style properties in the rendered output
    expect(JSON.stringify(tree)).toContain('backgroundColor":"red"');
    expect(JSON.stringify(tree)).toContain('padding":20');
  });
});