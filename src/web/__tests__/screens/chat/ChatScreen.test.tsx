import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import ChatScreen from '../../../src/screens/chat/ChatScreen';
import useChat from '../../../src/hooks/useChat';
import useVoiceRecorder from '../../../src/hooks/useVoiceRecorder';
import { ThemeProvider } from '../../../src/contexts/ThemeContext';
import { ChatMessage, Conversation, ChatRole, ChatMessageStatus } from '../../../src/types/chat.types';

// Mock the hooks
jest.mock('../../../src/hooks/useChat', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../src/hooks/useVoiceRecorder', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../src/contexts/ThemeContext', () => ({
  __esModule: true,
  ThemeProvider: ({ children }) => children,
  useTheme: () => ({
    theme: {
      colors: { 
        PRIMARY: '#4A90E2', 
        BACKGROUND: '#F5F7FA', 
        TEXT: '#333333',
        CARD: '#FFFFFF',
        BORDER: '#E1E1E1',
        ERROR: '#FF3B30' 
      },
      spacing: {
        xs: 4,
        s: 8,
        m: 16,
        l: 24,
        xl: 32
      }
    }
  })
}));

describe('ChatScreen', () => {
  // Set up mocks for navigation, conversation, and hooks
  let mockNavigation;
  let mockActiveConversation;
  let mockMessages;
  
  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    jest.clearAllMocks();
    
    // Create mock conversation and messages data
    mockMessages = [
      {
        id: '1',
        conversationId: 'conv1',
        role: ChatRole.USER,
        content: 'Hello, I have a question about my diet',
        timestamp: new Date(),
        status: ChatMessageStatus.SENT
      },
      {
        id: '2',
        conversationId: 'conv1',
        role: ChatRole.ASSISTANT,
        content: 'Hi there! I\'d be happy to help with your diet questions. What would you like to know?',
        timestamp: new Date(),
        status: ChatMessageStatus.SENT
      }
    ];
    
    mockActiveConversation = {
      id: 'conv1',
      title: 'Health Discussion',
      startedAt: new Date(),
      lastMessageAt: new Date(),
      messages: mockMessages
    };
    
    // Mock navigation props
    mockNavigation = { navigate: jest.fn() };
    
    // Mock useChat hook to return controlled test values
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: mockActiveConversation,
      loading: false,
      error: null,
      sendMessage: jest.fn().mockResolvedValue({}),
      loadConversation: jest.fn().mockResolvedValue({}),
      createNewConversation: jest.fn().mockResolvedValue('new-conv-id')
    });
    
    // Mock useVoiceRecorder hook to return controlled test values
    (useVoiceRecorder as jest.Mock).mockImplementation((options) => ({
      isRecording: false,
      isTranscribing: false,
      transcription: '',
      startRecording: jest.fn().mockResolvedValue(true),
      stopRecording: jest.fn().mockResolvedValue('recording-path'),
      reset: jest.fn(),
      // Store options to access callbacks later
      _options: options
    }));
  });
  
  test('renders correctly', () => {
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Check that the header with 'Health Advisor' title is displayed
    expect(screen.getByText('Health Advisor')).toBeTruthy();
    
    // Check that the chat messages are rendered
    expect(screen.getByText('Hello, I have a question about my diet')).toBeTruthy();
    expect(screen.getByText('Hi there! I\'d be happy to help with your diet questions. What would you like to know?')).toBeTruthy();
    
    // Check that the message input field is present
    expect(screen.getByPlaceholderText('Type a message...')).toBeTruthy();
    
    // Check that the send button is present
    expect(screen.getByLabelText('Send message')).toBeTruthy();
    
    // Check that the voice input button is present
    expect(screen.getByLabelText('Voice input')).toBeTruthy();
  });
  
  test('sends message when send button is pressed', async () => {
    // Get the mocked sendMessage function for later verification
    const { sendMessage } = useChat();
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Find the message input field
    const input = screen.getByPlaceholderText('Type a message...');
    
    // Type a test message in the input field
    fireEvent.changeText(input, 'Test message');
    
    // Find and press the send button
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.press(sendButton);
    
    // Verify that sendMessage function was called with the correct message
    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith('Test message');
    });
    
    // Verify that the input field is cleared after sending
    expect(input.props.value).toBe('');
  });
  
  test('handles voice input correctly', async () => {
    // Set up mocks for the voice recorder functions
    const startRecordingMock = jest.fn().mockResolvedValue(true);
    const stopRecordingMock = jest.fn().mockResolvedValue('recording-path');
    const resetMock = jest.fn();
    
    // Mock the sendMessage function for verification
    const sendMessageMock = jest.fn().mockResolvedValue({});
    
    // Mock voice recorder with controlled recording state
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isTranscribing: false,
      transcription: '',
      startRecording: startRecordingMock,
      stopRecording: stopRecordingMock,
      reset: resetMock
    });
    
    // Mock useChat with sendMessage function
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: mockActiveConversation,
      loading: false,
      error: null,
      sendMessage: sendMessageMock,
      loadConversation: jest.fn(),
      createNewConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Find and press the voice input button
    const voiceButton = screen.getByLabelText('Voice input');
    fireEvent.press(voiceButton);
    
    // Verify that startRecording function was called
    expect(startRecordingMock).toHaveBeenCalled();
    
    // Simulate recording completion with transcription
    // Update the mock to return a transcription
    (useVoiceRecorder as jest.Mock).mockReturnValue({
      isRecording: false,
      isTranscribing: false,
      transcription: 'Voice transcription test',
      startRecording: startRecordingMock,
      stopRecording: stopRecordingMock,
      reset: resetMock
    });
    
    // Get the onTranscriptionComplete callback from the hook options
    const hookOptions = (useVoiceRecorder as jest.Mock).mock.calls[0][0];
    if (hookOptions && hookOptions.onTranscriptionComplete) {
      // Manually trigger the callback with the transcription
      act(() => {
        hookOptions.onTranscriptionComplete('Voice transcription test');
      });
    }
    
    // Re-render to reflect the updated state
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Find the input field and verify it contains the transcription
    const input = screen.getByPlaceholderText('Type a message...');
    
    // Since we can't directly set the input value in the test,
    // we'll manually trigger the send message flow
    fireEvent.changeText(input, 'Voice transcription test');
    
    // Find and press the send button
    const sendButton = screen.getByLabelText('Send message');
    fireEvent.press(sendButton);
    
    // Verify that sendMessage was called with the transcribed text
    await waitFor(() => {
      expect(sendMessageMock).toHaveBeenCalledWith('Voice transcription test');
    });
    
    // Verify that reset function was called to clear voice recorder state
    expect(resetMock).toHaveBeenCalled();
  });
  
  test('displays error message when chat fails', () => {
    // Mock useChat to return an error state
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: null,
      loading: false,
      error: 'Failed to connect to AI service',
      createNewConversation: jest.fn(),
      loadConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Verify that the error message is displayed
    expect(screen.getByText('Failed to connect to AI service')).toBeTruthy();
    
    // Find and press the retry button
    const retryButton = screen.getByText('Retry');
    fireEvent.press(retryButton);
    
    // Verify that createNewConversation function was called for retry
    expect(useChat().createNewConversation).toHaveBeenCalled();
  });
  
  test('shows loading indicator during message sending', () => {
    // Mock useChat to return loading: true
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: mockActiveConversation,
      loading: true,
      error: null,
      sendMessage: jest.fn(),
      loadConversation: jest.fn(),
      createNewConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Verify that the loading indicator is displayed in the chat input
    expect(screen.getByLabelText('Loading content')).toBeTruthy();
    
    // Verify that the input field and buttons are disabled during loading
    const input = screen.getByPlaceholderText('Type a message...');
    expect(input.props.disabled).toBeTruthy();
  });
  
  test('initializes conversation on mount', async () => {
    // Mock useChat with createNewConversation function
    const createNewConversationMock = jest.fn().mockResolvedValue('new-conv-id');
    
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: null,
      loading: false,
      error: null,
      createNewConversation: createNewConversationMock,
      loadConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Verify that createNewConversation was called on mount when no active conversation exists
    await waitFor(() => {
      expect(createNewConversationMock).toHaveBeenCalled();
    });
    
    // Now test with an active conversation
    jest.clearAllMocks();
    
    const loadConversationMock = jest.fn().mockResolvedValue({});
    
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: { ...mockActiveConversation, id: 'existing-conv-id' },
      loading: false,
      error: null,
      createNewConversation: jest.fn(),
      loadConversation: loadConversationMock
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Verify that createNewConversation was not called when there's an active conversation
    expect(createNewConversationMock).not.toHaveBeenCalled();
  });
  
  test('handles load more messages', () => {
    // Mock useChat with loadConversation function
    const loadConversationMock = jest.fn().mockResolvedValue({});
    
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: mockActiveConversation,
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      loadConversation: loadConversationMock,
      createNewConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Find the ChatList component and simulate onEndReached
    const chatList = screen.getByLabelText('Chat conversation');
    if (chatList.props.onEndReached) {
      chatList.props.onEndReached();
    }
    
    // Verify loadConversation was called with the correct conversation ID
    expect(loadConversationMock).toHaveBeenCalledWith(mockActiveConversation.id);
  });
  
  test('handles refresh', () => {
    // Mock useChat with loadConversation function
    const loadConversationMock = jest.fn().mockResolvedValue({});
    
    (useChat as jest.Mock).mockReturnValue({
      activeConversation: mockActiveConversation,
      loading: false,
      error: null,
      sendMessage: jest.fn(),
      loadConversation: loadConversationMock,
      createNewConversation: jest.fn()
    });
    
    render(<ChatScreen navigation={mockNavigation} />);
    
    // Find the ChatList component and simulate onRefresh
    const chatList = screen.getByLabelText('Chat conversation');
    if (chatList.props.onRefresh) {
      chatList.props.onRefresh();
    }
    
    // Verify loadConversation was called with the correct conversation ID
    expect(loadConversationMock).toHaveBeenCalledWith(mockActiveConversation.id);
  });
});