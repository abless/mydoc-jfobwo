import mongoose from 'mongoose'; // v7.0.3
import { ChatService } from '../../../src/services/chat.service';
import { HealthService } from '../../../src/services/health.service';
import { 
  sendRequestToLLM,
  buildPrompt,
  processResponse
} from '../../../src/services/llm.service';
import { 
  getUserConversations,
  getConversationById,
  createConversation,
  getConversationMessages,
  createUserMessage,
  createAssistantMessage,
  getConversationHistory
} from '../../../src/repositories/chat.repository';
import { NotFoundError, BadRequestError, ServiceUnavailableError } from '../../../src/utils/error.util';
import { ChatRole } from '../../../src/types/chat.types';
import { mockUserId } from '../../mocks/user.mock';
import { 
  mockConversationId, 
  createMockChatMessage, 
  createMockChatConversation, 
  createMockChatMessageArray, 
  createMockConversationArray,
  createMockHealthContext
} from '../../mocks/chat.mock';
import { DEFAULT_MOCK_RESPONSE, createMockLLMResponse } from '../../mocks/llm.mock';
import { createMockHealthData } from '../../mocks/health.mock';

// Mock dependencies
jest.mock('../../../src/repositories/chat.repository');
jest.mock('../../../src/services/llm.service');
jest.mock('../../../src/services/health.service');

describe('ChatService', () => {
  let chatService: ChatService;
  let mockConnection: mongoose.Connection;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Create a mock mongoose connection
    mockConnection = {} as mongoose.Connection;

    // Mock repository functions
    (getUserConversations as jest.Mock).mockResolvedValue({
      conversations: createMockConversationArray(),
      total: 3,
      page: 1
    });

    (getConversationById as jest.Mock).mockImplementation((id, userId) => {
      if (id === mockConversationId && userId === mockUserId) {
        return Promise.resolve(createMockChatConversation());
      }
      return Promise.resolve(null);
    });

    (getConversationMessages as jest.Mock).mockResolvedValue({
      messages: createMockChatMessageArray(),
      total: 5,
      page: 1
    });

    (createConversation as jest.Mock).mockImplementation((userId, title) => {
      return Promise.resolve(createMockChatConversation({
        _id: new mongoose.Types.ObjectId(mockConversationId),
        userId: new mongoose.Types.ObjectId(userId),
        title
      }));
    });

    (createUserMessage as jest.Mock).mockResolvedValue(
      createMockChatMessage({ role: ChatRole.USER })
    );

    (createAssistantMessage as jest.Mock).mockResolvedValue(
      createMockChatMessage({ role: ChatRole.ASSISTANT })
    );

    (getConversationHistory as jest.Mock).mockResolvedValue(
      createMockChatMessageArray()
    );

    // Mock LLM service functions
    (sendRequestToLLM as jest.Mock).mockResolvedValue({
      content: DEFAULT_MOCK_RESPONSE
    });

    (buildPrompt as jest.Mock).mockReturnValue([
      { role: ChatRole.SYSTEM, content: 'System instruction' },
      { role: ChatRole.USER, content: 'User message' }
    ]);

    (processResponse as jest.Mock).mockImplementation(response => response);

    // Mock HealthService.getRecentHealthData method
    jest.spyOn(HealthService.prototype, 'getRecentHealthData').mockResolvedValue({
      recentMeals: [createMockHealthData()],
      recentLabResults: [createMockHealthData()],
      recentSymptoms: [createMockHealthData()]
    });

    // Create ChatService instance
    chatService = new ChatService(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserConversations', () => {
    it('should retrieve user conversations successfully', async () => {
      const result = await chatService.getUserConversations(mockUserId);
      
      expect(getUserConversations).toHaveBeenCalledWith(mockUserId, {});
      expect(result.conversations).toBeDefined();
      expect(result.total).toBe(3);
      expect(result.page).toBe(1);
    });

    it('should handle pagination parameters', async () => {
      const options = { page: 2, limit: 10 };
      await chatService.getUserConversations(mockUserId, options);
      
      expect(getUserConversations).toHaveBeenCalledWith(mockUserId, options);
    });

    it('should propagate errors from repository', async () => {
      const error = new Error('Database error');
      (getUserConversations as jest.Mock).mockRejectedValue(error);
      
      await expect(chatService.getUserConversations(mockUserId)).rejects.toThrow(error);
    });
  });

  describe('getConversationMessages', () => {
    it('should retrieve conversation messages successfully', async () => {
      const result = await chatService.getConversationMessages(mockConversationId, mockUserId);
      
      expect(getConversationById).toHaveBeenCalledWith(mockConversationId, mockUserId);
      expect(getConversationMessages).toHaveBeenCalledWith(mockConversationId, {});
      expect(result.messages).toBeDefined();
      expect(result.total).toBe(5);
    });

    it('should throw NotFoundError if conversation does not exist', async () => {
      (getConversationById as jest.Mock).mockResolvedValue(null);
      
      await expect(chatService.getConversationMessages(mockConversationId, mockUserId))
        .rejects.toThrow(NotFoundError);
      
      expect(getConversationMessages).not.toHaveBeenCalled();
    });

    it('should handle unauthorized access to conversation', async () => {
      const differentUserId = 'different-user-id';
      (getConversationById as jest.Mock).mockResolvedValue(null);
      
      await expect(chatService.getConversationMessages(mockConversationId, differentUserId))
        .rejects.toThrow(NotFoundError);
    });

    it('should handle pagination parameters', async () => {
      const options = { page: 2, limit: 10 };
      await chatService.getConversationMessages(mockConversationId, mockUserId, options);
      
      expect(getConversationMessages).toHaveBeenCalledWith(mockConversationId, options);
    });
  });

  describe('createNewConversation', () => {
    it('should create a new conversation successfully', async () => {
      const initialMessage = 'Hello, I have a health question';
      const result = await chatService.createNewConversation(mockUserId, initialMessage);
      
      expect(createConversation).toHaveBeenCalled();
      expect(createUserMessage).toHaveBeenCalled();
      expect(getConversationHistory).toHaveBeenCalled();
      expect(sendRequestToLLM).toHaveBeenCalled();
      expect(createAssistantMessage).toHaveBeenCalled();
      expect(result.conversationId).toBeDefined();
      expect(result.response).toBe(DEFAULT_MOCK_RESPONSE);
    });

    it('should generate a title from the initial message', async () => {
      const initialMessage = 'Hello, I have a health question';
      await chatService.createNewConversation(mockUserId, initialMessage);
      
      expect(createConversation).toHaveBeenCalledWith(
        mockUserId,
        expect.stringContaining('Hello')
      );
    });

    it('should handle repository errors', async () => {
      const error = new Error('Failed to create conversation');
      (createConversation as jest.Mock).mockRejectedValue(error);
      
      await expect(chatService.createNewConversation(mockUserId, 'Hello'))
        .rejects.toThrow(error);
    });

    it('should handle LLM service errors', async () => {
      (sendRequestToLLM as jest.Mock).mockRejectedValue(new Error('LLM service error'));
      
      await expect(chatService.createNewConversation(mockUserId, 'Hello'))
        .rejects.toThrow();
    });
  });

  describe('sendMessage', () => {
    it('should send message to existing conversation', async () => {
      const request = { message: 'How can I improve my diet?', conversationId: mockConversationId };
      const result = await chatService.sendMessage(request, mockUserId);
      
      expect(getConversationById).toHaveBeenCalledWith(mockConversationId, mockUserId);
      expect(createUserMessage).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId,
        request.message
      );
      expect(result.response).toBe(DEFAULT_MOCK_RESPONSE);
      expect(result.conversationId).toBe(mockConversationId);
    });

    it('should throw BadRequestError for empty message', async () => {
      const request = { message: '', conversationId: mockConversationId };
      
      await expect(chatService.sendMessage(request, mockUserId))
        .rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError for very long messages', async () => {
      const request = { message: 'a'.repeat(2001), conversationId: mockConversationId };
      
      await expect(chatService.sendMessage(request, mockUserId))
        .rejects.toThrow(BadRequestError);
    });

    it('should create new conversation if none provided', async () => {
      const request = { message: 'How can I improve my diet?' };
      const result = await chatService.sendMessage(request, mockUserId);
      
      expect(createConversation).toHaveBeenCalled();
      expect(result.conversationId).toBeDefined();
    });

    it('should create new conversation if provided conversation not found', async () => {
      (getConversationById as jest.Mock).mockResolvedValue(null);
      const request = { message: 'How can I improve my diet?', conversationId: 'non-existent-id' };
      
      const result = await chatService.sendMessage(request, mockUserId);
      
      expect(createConversation).toHaveBeenCalled();
      expect(result.conversationId).toBeDefined();
    });

    it('should handle LLM service errors', async () => {
      (sendRequestToLLM as jest.Mock).mockImplementation(() => {
        throw new ServiceUnavailableError('LLM service error', 'LLM Provider');
      });
      
      const request = { message: 'Hello', conversationId: mockConversationId };
      
      await expect(chatService.sendMessage(request, mockUserId))
        .rejects.toThrow(ServiceUnavailableError);
    });
  });

  // Test the private methods indirectly through their effects on public methods
  describe('sendMessageToLLM', () => {
    it('should retrieve health context and conversation history', async () => {
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      expect(HealthService.prototype.getRecentHealthData).toHaveBeenCalled();
      expect(getConversationHistory).toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableError when LLM service fails', async () => {
      (sendRequestToLLM as jest.Mock).mockRejectedValue(new Error('LLM service error'));
      
      const request = { message: 'Hello', conversationId: mockConversationId };
      
      await expect(chatService.sendMessage(request, mockUserId))
        .rejects.toThrow();
    });

    it('should store user message and assistant response', async () => {
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      expect(createUserMessage).toHaveBeenCalled();
      expect(createAssistantMessage).toHaveBeenCalled();
    });

    it('should include conversation history for context continuity', async () => {
      const mockHistory = createMockChatMessageArray();
      (getConversationHistory as jest.Mock).mockResolvedValue(mockHistory);
      
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      expect(getConversationHistory).toHaveBeenCalledWith(
        mockConversationId,
        expect.any(Number)
      );
      expect(buildPrompt).toHaveBeenCalled();
    });
  });
  
  describe('buildHealthContext', () => {
    it('should handle empty health data gracefully', async () => {
      // Mock empty health data
      jest.spyOn(HealthService.prototype, 'getRecentHealthData').mockResolvedValue({
        recentMeals: [],
        recentLabResults: [],
        recentSymptoms: []
      });
      
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      // Test should pass without errors
      expect(sendRequestToLLM).toHaveBeenCalled();
    });

    it('should handle health service errors gracefully', async () => {
      // Mock health service error
      jest.spyOn(HealthService.prototype, 'getRecentHealthData').mockRejectedValue(
        new Error('Failed to get health data')
      );
      
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      // Test should pass without errors and fallback to empty context
      expect(sendRequestToLLM).toHaveBeenCalled();
    });

    it('should format different types of health data appropriately', async () => {
      // Provide rich mock data with different health data types
      const mockHealthData = {
        recentMeals: [createMockHealthData({ type: 'meal' })],
        recentLabResults: [createMockHealthData({ type: 'labResult' })],
        recentSymptoms: [createMockHealthData({ type: 'symptom' })]
      };
      jest.spyOn(HealthService.prototype, 'getRecentHealthData').mockResolvedValue(mockHealthData);
      
      await chatService.sendMessage({ message: 'Hello', conversationId: mockConversationId }, mockUserId);
      
      // Verify that sendRequestToLLM was called with health context included
      expect(sendRequestToLLM).toHaveBeenCalled();
      expect(buildPrompt).toHaveBeenCalled();
    });
  });
});