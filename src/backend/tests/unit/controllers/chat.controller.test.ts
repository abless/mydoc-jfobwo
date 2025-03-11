import { Response, NextFunction } from 'express';
import mongoose from 'mongoose'; // v7.0.3
import { AuthenticatedRequest } from '../../../src/types/auth.types';
import { 
  handleSendMessage,
  handleGetConversations, 
  handleCreateConversation,
  handleGetConversation, 
  handleGetChatHistory 
} from '../../../src/controllers/chat.controller';
import { ChatService } from '../../../src/services/chat.service';
import { 
  sendSuccess, 
  sendCreated, 
  sendPaginated,
  sendError 
} from '../../../src/utils/response.util';
import { 
  mockUserId,
  mockConversationId,
  mockChatService,
  createMockChatMessageArray,
  createMockConversationArray,
  mockChatConversation
} from '../../mocks/chat.mock';

// Mock the response utilities
jest.mock('../../../src/utils/response.util', () => ({
  sendSuccess: jest.fn(),
  sendCreated: jest.fn(),
  sendPaginated: jest.fn(),
  sendError: jest.fn()
}));

// Mock the ChatService
jest.mock('../../../src/services/chat.service');

// Mock database connection
jest.mock('../../../src/config/database', () => ({
  connection: {} as mongoose.Connection
}));

describe('Chat Controller', () => {
  // Common test variables
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let next: NextFunction;
  let chatServiceMock: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Set up request, response and next function mocks
    req = {
      user: { id: mockUserId, email: 'test@example.com' },
      params: {},
      query: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    } as Partial<Response>;
    next = jest.fn() as NextFunction;

    // Use the mock factory function from chat.mock.ts
    chatServiceMock = mockChatService();
    (ChatService as jest.Mock).mockImplementation(() => chatServiceMock);
  });

  describe('handleSendMessage', () => {
    it('should handle sending a message successfully', async () => {
      // Arrange
      const messageRequest = { message: 'Test message', conversationId: mockConversationId };
      req.body = messageRequest;
      
      const expectedResponse = { 
        response: 'AI response', 
        conversationId: mockConversationId 
      };
      
      jest.spyOn(chatServiceMock, 'sendMessage').mockResolvedValue(expectedResponse);

      // Act
      await handleSendMessage(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.sendMessage).toHaveBeenCalledWith(messageRequest, mockUserId);
      expect(sendSuccess).toHaveBeenCalledWith(res, expectedResponse, 'Message processed successfully');
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error when sending a message fails', async () => {
      // Arrange
      const messageRequest = { message: 'Test message', conversationId: mockConversationId };
      req.body = messageRequest;
      
      const error = new Error('Service error');
      jest.spyOn(chatServiceMock, 'sendMessage').mockRejectedValue(error);

      // Act
      await handleSendMessage(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.sendMessage).toHaveBeenCalledWith(messageRequest, mockUserId);
      expect(sendSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('handleGetConversations', () => {
    it('should retrieve user conversations with default pagination', async () => {
      // Arrange
      const mockResponse = {
        conversations: createMockConversationArray(),
        total: 3,
        page: 1
      };
      
      jest.spyOn(chatServiceMock, 'getUserConversations').mockResolvedValue(mockResponse);

      // Act
      await handleGetConversations(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getUserConversations).toHaveBeenCalledWith(
        mockUserId, 
        { page: 1, limit: 10 }
      );
      expect(sendPaginated).toHaveBeenCalledWith(
        res, 
        mockResponse.conversations, 
        mockResponse.total, 
        mockResponse.page, 
        10, 
        'Conversations retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should retrieve user conversations with custom pagination', async () => {
      // Arrange
      req.query = { page: '2', limit: '5' };
      
      const mockResponse = {
        conversations: createMockConversationArray(),
        total: 10,
        page: 2
      };
      
      jest.spyOn(chatServiceMock, 'getUserConversations').mockResolvedValue(mockResponse);

      // Act
      await handleGetConversations(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getUserConversations).toHaveBeenCalledWith(
        mockUserId, 
        { page: 2, limit: 5 }
      );
      expect(sendPaginated).toHaveBeenCalledWith(
        res, 
        mockResponse.conversations, 
        mockResponse.total, 
        mockResponse.page, 
        5, 
        'Conversations retrieved successfully'
      );
    });

    it('should handle error when retrieving conversations fails', async () => {
      // Arrange
      const error = new Error('Database error');
      jest.spyOn(chatServiceMock, 'getUserConversations').mockRejectedValue(error);

      // Act
      await handleGetConversations(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getUserConversations).toHaveBeenCalled();
      expect(sendPaginated).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('handleCreateConversation', () => {
    it('should create a new conversation successfully', async () => {
      // Arrange
      const message = 'Initial conversation message';
      req.body = { message };
      
      const expectedResponse = { 
        conversationId: mockConversationId, 
        response: 'AI response' 
      };
      
      jest.spyOn(chatServiceMock, 'createNewConversation').mockResolvedValue(expectedResponse);

      // Act
      await handleCreateConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.createNewConversation).toHaveBeenCalledWith(mockUserId, message);
      expect(sendCreated).toHaveBeenCalledWith(res, expectedResponse, 'Conversation created successfully');
      expect(next).not.toHaveBeenCalled();
    });

    it('should return an error when message is missing', async () => {
      // Arrange
      req.body = {}; // Empty body, no message

      // Act
      await handleCreateConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.createNewConversation).not.toHaveBeenCalled();
      expect(sendError).toHaveBeenCalledWith(
        res, 
        expect.any(Error), 
        'Message is required', 
        400
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return an error when message is empty', async () => {
      // Arrange
      req.body = { message: '' }; // Empty message

      // Act
      await handleCreateConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.createNewConversation).not.toHaveBeenCalled();
      expect(sendError).toHaveBeenCalledWith(
        res, 
        expect.any(Error), 
        'Message is required', 
        400
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error when creating conversation fails', async () => {
      // Arrange
      req.body = { message: 'Initial message' };
      
      const error = new Error('Service error');
      jest.spyOn(chatServiceMock, 'createNewConversation').mockRejectedValue(error);

      // Act
      await handleCreateConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.createNewConversation).toHaveBeenCalled();
      expect(sendCreated).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('handleGetConversation', () => {
    it('should retrieve a specific conversation successfully', async () => {
      // Arrange
      req.params = { id: mockConversationId };
      
      const mockMessages = {
        messages: createMockChatMessageArray(),
        total: 5,
        page: 1
      };
      
      jest.spyOn(chatServiceMock, 'getConversationMessages').mockResolvedValue(mockMessages);

      // Act
      await handleGetConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId,
        { limit: 1000 }
      );
      expect(sendSuccess).toHaveBeenCalledWith(
        res, 
        {
          id: mockConversationId,
          messages: mockMessages.messages
        }, 
        'Conversation retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return an error when conversation ID is missing', async () => {
      // Arrange
      req.params = {}; // No conversation ID

      // Act
      await handleGetConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).not.toHaveBeenCalled();
      expect(sendError).toHaveBeenCalledWith(
        res, 
        expect.any(Error), 
        'Conversation ID is required', 
        400
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error when retrieving conversation fails', async () => {
      // Arrange
      req.params = { id: mockConversationId };
      
      const error = new Error('Service error');
      jest.spyOn(chatServiceMock, 'getConversationMessages').mockRejectedValue(error);

      // Act
      await handleGetConversation(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).toHaveBeenCalled();
      expect(sendSuccess).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('handleGetChatHistory', () => {
    it('should retrieve chat history with default pagination', async () => {
      // Arrange
      req.params = { id: mockConversationId };
      
      const mockMessages = {
        messages: createMockChatMessageArray(),
        total: 5,
        page: 1
      };
      
      jest.spyOn(chatServiceMock, 'getConversationMessages').mockResolvedValue(mockMessages);

      // Act
      await handleGetChatHistory(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId,
        { page: 1, limit: 20 }
      );
      expect(sendPaginated).toHaveBeenCalledWith(
        res, 
        mockMessages.messages, 
        mockMessages.total, 
        mockMessages.page, 
        20, 
        'Chat history retrieved successfully'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should retrieve chat history with custom pagination', async () => {
      // Arrange
      req.params = { id: mockConversationId };
      req.query = { page: '2', limit: '15' };
      
      const mockMessages = {
        messages: createMockChatMessageArray(),
        total: 30,
        page: 2
      };
      
      jest.spyOn(chatServiceMock, 'getConversationMessages').mockResolvedValue(mockMessages);

      // Act
      await handleGetChatHistory(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).toHaveBeenCalledWith(
        mockConversationId,
        mockUserId,
        { page: 2, limit: 15 }
      );
      expect(sendPaginated).toHaveBeenCalledWith(
        res, 
        mockMessages.messages, 
        mockMessages.total, 
        mockMessages.page, 
        15, 
        'Chat history retrieved successfully'
      );
    });

    it('should return an error when conversation ID is missing', async () => {
      // Arrange
      req.params = {}; // No conversation ID

      // Act
      await handleGetChatHistory(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).not.toHaveBeenCalled();
      expect(sendError).toHaveBeenCalledWith(
        res, 
        expect.any(Error), 
        'Conversation ID is required', 
        400
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should handle error when retrieving chat history fails', async () => {
      // Arrange
      req.params = { id: mockConversationId };
      
      const error = new Error('Service error');
      jest.spyOn(chatServiceMock, 'getConversationMessages').mockRejectedValue(error);

      // Act
      await handleGetChatHistory(req as AuthenticatedRequest, res as Response, next);

      // Assert
      expect(chatServiceMock.getConversationMessages).toHaveBeenCalled();
      expect(sendPaginated).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});