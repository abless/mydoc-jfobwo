import { Types } from 'mongoose'; // ^7.0.3
import {
  ChatRole,
  ChatMessage,
  ChatConversation,
  LLMMessage,
  HealthContext
} from '../../src/types/chat.types';
import {
  mockUserId,
  mockUserObjectId
} from './user.mock';
import {
  createMockHealthData,
  createMockHealthDataArray
} from './health.mock';
import { DEFAULT_MOCK_RESPONSE } from './llm.mock';

// Create consistent mock IDs for testing
export const mockConversationId = new Types.ObjectId().toString();
export const mockConversationObjectId = new Types.ObjectId();

/**
 * Creates a mock chat message for testing
 * @param overrides - Optional property overrides for the chat message
 * @returns A mock chat message with default values and any provided overrides
 */
export const createMockChatMessage = (overrides?: Partial<ChatMessage>): ChatMessage => {
  return {
    _id: new Types.ObjectId(),
    conversationId: mockConversationObjectId,
    userId: mockUserObjectId,
    role: ChatRole.USER,
    content: 'This is a test message',
    timestamp: new Date(),
    metadata: {},
    ...overrides
  } as ChatMessage;
};

/**
 * Default mock chat message for testing
 */
export const mockChatMessage: ChatMessage = createMockChatMessage();

/**
 * Creates a mock chat conversation for testing
 * @param overrides - Optional property overrides for the chat conversation
 * @returns A mock chat conversation with default values and any provided overrides
 */
export const createMockChatConversation = (overrides?: Partial<ChatConversation>): ChatConversation => {
  const now = new Date();
  return {
    _id: mockConversationObjectId,
    userId: mockUserObjectId,
    title: 'Test Conversation',
    startedAt: new Date(now.getTime() - 3600000), // 1 hour ago
    lastMessageAt: now,
    createdAt: new Date(now.getTime() - 3600000),
    updatedAt: now,
    ...overrides
  } as ChatConversation;
};

/**
 * Default mock chat conversation for testing
 */
export const mockChatConversation: ChatConversation = createMockChatConversation();

/**
 * Creates an array of mock chat messages for testing
 * @param conversationId - Optional conversation ID, defaults to mockConversationId
 * @param userId - Optional user ID, defaults to mockUserId
 * @param count - Number of messages to create, defaults to 5
 * @returns An array of mock chat messages
 */
export const createMockChatMessageArray = (
  conversationId: string = mockConversationId,
  userId: string = mockUserId,
  count: number = 5
): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  const conversationObjectId = new Types.ObjectId(conversationId);
  const userObjectId = new Types.ObjectId(userId);
  const baseTime = new Date();
  
  for (let i = 0; i < count; i++) {
    // Alternate between user and assistant for a realistic conversation
    const role = i % 2 === 0 ? ChatRole.USER : ChatRole.ASSISTANT;
    // Set timestamps with increasing values (older to newer)
    const timestamp = new Date(baseTime.getTime() - (count - i) * 300000); // 5 minutes apart
    
    messages.push({
      _id: new Types.ObjectId(),
      conversationId: conversationObjectId,
      userId: userObjectId,
      role,
      content: role === ChatRole.USER 
        ? `User test message ${i + 1}` 
        : `Assistant response for message ${i}`,
      timestamp,
      metadata: {},
      createdAt: timestamp
    } as ChatMessage);
  }
  
  return messages;
};

/**
 * Creates an array of mock chat conversations for testing
 * @param userId - Optional user ID, defaults to mockUserId
 * @param count - Number of conversations to create, defaults to 3
 * @returns An array of mock chat conversations
 */
export const createMockConversationArray = (
  userId: string = mockUserId,
  count: number = 3
): ChatConversation[] => {
  const conversations: ChatConversation[] = [];
  const userObjectId = new Types.ObjectId(userId);
  const baseTime = new Date();
  
  for (let i = 0; i < count; i++) {
    // Set timestamps with increasing values (older to newer)
    const startedAt = new Date(baseTime.getTime() - (count - i) * 86400000); // 1 day apart
    const lastMessageAt = new Date(startedAt.getTime() + 3600000); // 1 hour after start
    
    conversations.push({
      _id: new Types.ObjectId(),
      userId: userObjectId,
      title: `Test Conversation ${i + 1}`,
      startedAt,
      lastMessageAt,
      createdAt: startedAt,
      updatedAt: lastMessageAt,
    } as ChatConversation);
  }
  
  return conversations;
};

/**
 * Creates a mock health context for LLM interactions
 * @param userId - Optional user ID, defaults to mockUserId
 * @returns A mock health context with recent health data
 */
export const createMockHealthContext = (userId: string = mockUserId): HealthContext => {
  return {
    recentMeals: createMockHealthDataArray(3, userId, 'meal'),
    recentLabResults: createMockHealthDataArray(2, userId, 'labResult'),
    recentSymptoms: createMockHealthDataArray(2, userId, 'symptom'),
  };
};

/**
 * Default mock health context for testing
 */
export const mockHealthContext: HealthContext = createMockHealthContext();

/**
 * Mock implementation of getConversationById function
 * @param conversationId - The conversation ID to retrieve
 * @param userId - The user ID making the request
 * @returns Promise resolving to a mock conversation or null
 */
export const mockGetConversationById = async (
  conversationId: string,
  userId: string
): Promise<ChatConversation | null> => {
  if (conversationId === mockConversationId && userId === mockUserId) {
    return createMockChatConversation({
      _id: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId),
    });
  }
  return null;
};

/**
 * Mock implementation of getConversationMessages function
 * @param conversationId - The conversation ID to retrieve messages for
 * @param options - Pagination options
 * @returns Promise resolving to paginated messages
 */
export const mockGetConversationMessages = async (
  conversationId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ messages: ChatMessage[]; total: number; page: number }> => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const mockMessages = createMockChatMessageArray(conversationId);
  const total = mockMessages.length;
  
  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedMessages = mockMessages.slice(start, end);
  
  return {
    messages: paginatedMessages,
    total,
    page
  };
};

/**
 * Mock implementation of getUserConversations function
 * @param userId - The user ID to retrieve conversations for
 * @param options - Pagination options
 * @returns Promise resolving to paginated conversations
 */
export const mockGetUserConversations = async (
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ conversations: ChatConversation[]; total: number; page: number }> => {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const mockConversations = createMockConversationArray(userId);
  const total = mockConversations.length;
  
  // Apply pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedConversations = mockConversations.slice(start, end);
  
  return {
    conversations: paginatedConversations,
    total,
    page
  };
};

/**
 * Mock implementation of createConversation function
 * @param userId - The user ID creating the conversation
 * @param title - The conversation title
 * @returns Promise resolving to a newly created mock conversation
 */
export const mockCreateConversation = async (
  userId: string,
  title: string
): Promise<ChatConversation> => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(userId),
    title,
    startedAt: now,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
  } as ChatConversation;
};

/**
 * Mock implementation of createUserMessage function
 * @param conversationId - The conversation ID to add the message to
 * @param userId - The user ID creating the message
 * @param content - The message content
 * @returns Promise resolving to a newly created mock user message
 */
export const mockCreateUserMessage = async (
  conversationId: string,
  userId: string,
  content: string
): Promise<ChatMessage> => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    conversationId: new Types.ObjectId(conversationId),
    userId: new Types.ObjectId(userId),
    role: ChatRole.USER,
    content,
    timestamp: now,
    metadata: {},
    createdAt: now,
  } as ChatMessage;
};

/**
 * Mock implementation of createAssistantMessage function
 * @param conversationId - The conversation ID to add the message to
 * @param userId - The user ID associated with the conversation
 * @param content - The message content
 * @param metadata - Optional metadata for the message
 * @returns Promise resolving to a newly created mock assistant message
 */
export const mockCreateAssistantMessage = async (
  conversationId: string,
  userId: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<ChatMessage> => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    conversationId: new Types.ObjectId(conversationId),
    userId: new Types.ObjectId(userId),
    role: ChatRole.ASSISTANT,
    content,
    timestamp: now,
    metadata,
    createdAt: now,
  } as ChatMessage;
};

/**
 * Mock implementation of getConversationHistory function
 * @param conversationId - The conversation ID to retrieve history for
 * @param limit - Maximum number of messages to retrieve, defaults to 10
 * @returns Promise resolving to recent mock messages
 */
export const mockGetConversationHistory = async (
  conversationId: string,
  limit: number = 10
): Promise<ChatMessage[]> => {
  const mockMessages = createMockChatMessageArray(conversationId);
  return mockMessages.slice(-limit);
};

/**
 * Creates a complete mock chat repository for testing
 * @param customImplementations - Optional overrides for specific repository methods
 * @returns A mock chat repository object with all required methods
 */
export const mockChatRepository = (customImplementations = {}) => ({
  getUserConversations: mockGetUserConversations,
  getConversationById: mockGetConversationById,
  createConversation: mockCreateConversation,
  getConversationMessages: mockGetConversationMessages,
  createUserMessage: mockCreateUserMessage,
  createAssistantMessage: mockCreateAssistantMessage,
  getConversationHistory: mockGetConversationHistory,
  ...customImplementations
});

/**
 * Creates a complete mock chat service for testing
 * @param customImplementations - Optional overrides for specific service methods
 * @returns A mock chat service object with all required methods
 */
export const mockChatService = (customImplementations = {}) => ({
  getUserConversations: async (userId: string, options = {}) => 
    mockGetUserConversations(userId, options),
  
  getConversationMessages: async (conversationId: string, userId: string, options = {}) => 
    mockGetConversationMessages(conversationId, options),
  
  createNewConversation: async (userId: string, title: string) => 
    mockCreateConversation(userId, title),
  
  sendMessage: async (userId: string, message: string, conversationId?: string) => {
    const actualConversationId = conversationId || new Types.ObjectId().toString();
    const userMessage = await mockCreateUserMessage(actualConversationId, userId, message);
    const assistantResponse = await mockCreateAssistantMessage(
      actualConversationId, 
      userId, 
      DEFAULT_MOCK_RESPONSE
    );
    
    return {
      response: assistantResponse.content,
      conversationId: actualConversationId
    };
  },
  
  sendMessageToLLM: async (userId: string, message: string, conversationId: string) => {
    return DEFAULT_MOCK_RESPONSE;
  },
  
  buildHealthContext: (userId: string) => createMockHealthContext(userId),
  
  formatConversationMessages: (messages: ChatMessage[]): LLMMessage[] => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  },
  
  ...customImplementations
});