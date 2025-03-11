import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // ^8.0.1
import { useChat } from '../../src/hooks/useChat';
import { 
  sendMessage, 
  getConversations, 
  getConversation, 
  getMessages,
  createConversation 
} from '../../src/services/chat.service';
import { 
  ChatRole, 
  ChatMessageStatus, 
  Conversation, 
  ChatMessage,
  SendMessageResponse,
  PaginatedResponse
} from '../../src/types/chat.types';
import { useAuth } from '../../src/hooks/useAuth';

// Mock the chat service methods
jest.mock('../../src/services/chat.service', () => ({
  sendMessage: jest.fn(),
  getConversations: jest.fn(),
  getConversation: jest.fn(),
  getMessages: jest.fn(),
  createConversation: jest.fn()
}));

// Mock the useAuth hook
jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn().mockReturnValue({ isAuthenticated: true, user: { id: 'user-123', email: 'test@example.com' } })
}));

describe('useChat', () => {
  // Helper function to create a mock conversation
  const createMockConversation = (id: string, title: string): Conversation => ({
    id,
    title,
    startedAt: new Date('2023-05-15T10:00:00Z'),
    lastMessageAt: new Date('2023-05-15T10:30:00Z'),
    messages: []
  });

  // Helper function to create a mock message
  const createMockMessage = (
    id: string,
    conversationId: string,
    role: ChatRole,
    content: string
  ): ChatMessage => ({
    id,
    conversationId,
    role,
    content,
    timestamp: new Date('2023-05-15T10:30:00Z'),
    status: ChatMessageStatus.SENT
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup default mock implementations
    (getConversations as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 20
    });

    (getConversation as jest.Mock).mockResolvedValue(
      createMockConversation('conv-123', 'Test Conversation')
    );

    (getMessages as jest.Mock).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 100
    });

    (createConversation as jest.Mock).mockResolvedValue(
      createMockConversation('new-conv-123', 'New Conversation')
    );

    (sendMessage as jest.Mock).mockResolvedValue({
      response: 'This is a test response from the LLM.',
      conversationId: 'conv-123'
    });

    // Default useAuth mock implementation
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', email: 'test@example.com' }
    });
  });

  it('should initialize with default values', async () => {
    const { result } = renderHook(() => useChat());

    // Initial state should be loading with empty conversations and null activeConversation
    expect(result.current.conversations).toEqual([]);
    expect(result.current.activeConversation).toBeNull();
    expect(result.current.loading).toBeTruthy();
    expect(result.current.error).toBeNull();

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);
  });

  it('should load conversations successfully', async () => {
    // Create mock data for the test
    const mockConversations = [
      createMockConversation('conv-1', 'First Conversation'),
      createMockConversation('conv-2', 'Second Conversation')
    ];

    // Setup mock response
    (getConversations as jest.Mock).mockResolvedValue({
      items: mockConversations,
      total: mockConversations.length,
      page: 1,
      limit: 20
    });

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Load conversations explicitly
    await act(async () => {
      await result.current.loadConversations();
    });

    // Check if conversations are loaded correctly
    expect(result.current.conversations).toEqual(mockConversations);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(getConversations).toHaveBeenCalled();
  });

  it('should handle conversation loading failure', async () => {
    // Setup mock error response
    const mockError = new Error('Failed to load conversations');
    (getConversations as jest.Mock).mockRejectedValue(mockError);

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete (will fail)
    await waitFor(() => !result.current.loading);

    // Attempt to load conversations
    await act(async () => {
      await result.current.loadConversations();
    });

    // Check if error state is updated correctly
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).not.toBeNull();
    expect(result.current.conversations).toEqual([]);
  });

  it('should load a specific conversation successfully', async () => {
    // Create mock data for the test
    const conversationId = 'conv-123';
    const mockConversation = createMockConversation(conversationId, 'Test Conversation');
    const mockMessages = [
      createMockMessage('msg-1', conversationId, ChatRole.USER, 'Hello'),
      createMockMessage('msg-2', conversationId, ChatRole.ASSISTANT, 'Hi there!')
    ];

    // Setup mock responses
    (getConversation as jest.Mock).mockResolvedValue(mockConversation);
    (getMessages as jest.Mock).mockResolvedValue({
      items: mockMessages,
      total: mockMessages.length,
      page: 1,
      limit: 100
    });

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Load the specific conversation
    await act(async () => {
      await result.current.loadConversation(conversationId);
    });

    // Check if the conversation is loaded correctly
    expect(result.current.activeConversation).not.toBeNull();
    expect(result.current.activeConversation?.id).toBe(conversationId);
    expect(result.current.activeConversation?.messages).toEqual(mockMessages);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(getConversation).toHaveBeenCalledWith(conversationId);
    expect(getMessages).toHaveBeenCalled();
  });

  it('should handle specific conversation loading failure', async () => {
    // Setup mock error response
    const conversationId = 'non-existent-conv';
    const mockError = new Error('Failed to load conversation');
    (getConversation as jest.Mock).mockRejectedValue(mockError);

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Attempt to load a non-existent conversation
    await act(async () => {
      await result.current.loadConversation(conversationId);
    });

    // Check if error state is updated correctly
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).not.toBeNull();
    expect(result.current.activeConversation).toBeNull();
  });

  it('should create a new conversation successfully', async () => {
    // Create mock data for the test
    const newConversationId = 'new-conv-123';
    const mockNewConversation = createMockConversation(newConversationId, 'New Conversation');

    // Setup mock response
    (createConversation as jest.Mock).mockResolvedValue(mockNewConversation);

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Create a new conversation
    let createdConversationId: string | undefined;
    await act(async () => {
      createdConversationId = await result.current.createNewConversation();
    });

    // Check if the conversation is created correctly
    expect(createdConversationId).toBe(newConversationId);
    expect(result.current.activeConversation).not.toBeNull();
    expect(result.current.activeConversation?.id).toBe(newConversationId);
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
    expect(createConversation).toHaveBeenCalled();
  });

  it('should handle new conversation creation failure', async () => {
    // Setup mock error response
    const mockError = new Error('Failed to create conversation');
    (createConversation as jest.Mock).mockRejectedValue(mockError);

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Attempt to create a new conversation
    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.createNewConversation();
      } catch (error) {
        thrownError = error as Error;
      }
    });

    // Check if error state is updated correctly
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).not.toBeNull();
    expect(result.current.activeConversation).toBeNull();
    expect(thrownError).toBeDefined();
  });

  it('should send a message successfully', async () => {
    // Create mock data for the test
    const conversationId = 'conv-123';
    const mockConversation = {
      ...createMockConversation(conversationId, 'Test Conversation'),
      messages: [
        createMockMessage('msg-1', conversationId, ChatRole.USER, 'Hello'),
        createMockMessage('msg-2', conversationId, ChatRole.ASSISTANT, 'Hi there!')
      ]
    };
    const mockResponse: SendMessageResponse = {
      response: 'This is a test response from the LLM.',
      conversationId
    };

    // Setup mock responses
    (getConversation as jest.Mock).mockResolvedValue(mockConversation);
    (getMessages as jest.Mock).mockResolvedValue({
      items: mockConversation.messages,
      total: mockConversation.messages.length,
      page: 1,
      limit: 100
    });
    (sendMessage as jest.Mock).mockResolvedValue(mockResponse);

    // Render the hook with active conversation
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Set active conversation
    await act(async () => {
      await result.current.loadConversation(conversationId);
    });

    // Send a message
    let response: SendMessageResponse | undefined;
    await act(async () => {
      response = await result.current.sendMessage('Test message', conversationId);
    });

    // Verify the message was sent correctly
    expect(sendMessage).toHaveBeenCalledWith('Test message', conversationId);
    expect(response).toEqual(mockResponse);
    
    // Verify the user message was added to the conversation
    expect(result.current.activeConversation?.messages.length).toBeGreaterThan(
      mockConversation.messages.length
    );
    
    // Verify there is a user message with the test content
    const userMessage = result.current.activeConversation?.messages.find(
      msg => msg.role === ChatRole.USER && msg.content === 'Test message'
    );
    expect(userMessage).toBeDefined();
    
    // Verify there is an assistant message with the response
    const assistantMessage = result.current.activeConversation?.messages.find(
      msg => msg.role === ChatRole.ASSISTANT && msg.content === mockResponse.response
    );
    expect(assistantMessage).toBeDefined();
    
    expect(result.current.error).toBeNull();
  });

  it('should handle message sending failure', async () => {
    // Create mock data for the test
    const conversationId = 'conv-123';
    const mockConversation = {
      ...createMockConversation(conversationId, 'Test Conversation'),
      messages: [
        createMockMessage('msg-1', conversationId, ChatRole.USER, 'Hello'),
        createMockMessage('msg-2', conversationId, ChatRole.ASSISTANT, 'Hi there!')
      ]
    };
    const mockError = new Error('Failed to send message');

    // Setup mock responses
    (getConversation as jest.Mock).mockResolvedValue(mockConversation);
    (getMessages as jest.Mock).mockResolvedValue({
      items: mockConversation.messages,
      total: mockConversation.messages.length,
      page: 1,
      limit: 100
    });
    (sendMessage as jest.Mock).mockRejectedValue(mockError);

    // Render the hook with active conversation
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Set active conversation
    await act(async () => {
      await result.current.loadConversation(conversationId);
    });

    // Attempt to send a message
    let thrownError: Error | undefined;
    await act(async () => {
      try {
        await result.current.sendMessage('Test message', conversationId);
      } catch (error) {
        thrownError = error as Error;
      }
    });

    // Verify there is a user message with error status
    const userMessage = result.current.activeConversation?.messages.find(
      msg => msg.role === ChatRole.USER && msg.content === 'Test message'
    );
    expect(userMessage).toBeDefined();
    expect(userMessage?.status).toBe(ChatMessageStatus.ERROR);
    
    expect(result.current.error).not.toBeNull();
    expect(thrownError).toBeDefined();
  });

  it('should create a new conversation when sending a message without conversationId', async () => {
    // Create mock data for the test
    const newConversationId = 'new-conv-123';
    const mockNewConversation = createMockConversation(newConversationId, 'New Conversation');
    const mockResponse: SendMessageResponse = {
      response: 'This is a test response from the LLM.',
      conversationId: newConversationId
    };

    // Setup mock responses
    (createConversation as jest.Mock).mockResolvedValue(mockNewConversation);
    (sendMessage as jest.Mock).mockResolvedValue(mockResponse);

    // Render the hook
    const { result } = renderHook(() => useChat());

    // Wait for initial load to complete
    await waitFor(() => !result.current.loading);

    // Send a message without conversation ID
    let response: SendMessageResponse | undefined;
    await act(async () => {
      response = await result.current.sendMessage('Test message');
    });

    // Verify a new conversation was created
    expect(createConversation).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith('Test message', newConversationId);
    expect(response).toEqual(mockResponse);
  });

  it('should load conversations when authenticated user changes', async () => {
    // First render with unauthenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      user: null
    });

    const { result, rerender } = renderHook(() => useChat());

    // getConversations should not be called when unauthenticated
    expect(getConversations).not.toHaveBeenCalled();

    // Change to authenticated user
    (useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      user: { id: 'user-123', email: 'test@example.com' }
    });

    // Re-render the hook with updated auth state
    rerender();

    // Wait for load to complete after authentication change
    await waitFor(() => !result.current.loading);

    // getConversations should be called when authenticated
    expect(getConversations).toHaveBeenCalled();
  });
});