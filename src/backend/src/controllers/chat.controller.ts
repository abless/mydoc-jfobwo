/**
 * Chat Controller Module
 * 
 * This module handles HTTP requests for chat functionality in the Health Advisor application.
 * It processes client requests for sending messages to the LLM, retrieving chat history,
 * and managing conversations.
 * 
 * All controller functions validate user authentication and apply appropriate error handling
 * to ensure secure and reliable interaction with the LLM service.
 */

import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import { ChatService } from '../services/chat.service';
import { 
  SendMessageRequest, 
  GetChatHistoryRequest,
  GetConversationsRequest
} from '../types/chat.types';
import { AuthenticatedRequest } from '../types/auth.types';
import { 
  sendSuccess, 
  sendCreated, 
  sendPaginated,
  sendError
} from '../utils/response.util';
import logger from '../config/logger';
import { connection } from '../config/database';

/**
 * Handles requests to send a message to the LLM and get a response
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export async function handleSendMessage(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing message request', { userId: req.user.id });
    
    // Extract message request data from request body
    const messageRequest: SendMessageRequest = req.body;
    
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Initialize ChatService with database connection
    const chatService = new ChatService(connection);
    
    // Send message to LLM and get response
    const response = await chatService.sendMessage(messageRequest, userId);
    
    // Send success response with LLM response
    sendSuccess(res, response, 'Message processed successfully');
  } catch (error) {
    logger.error('Error processing message request', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId: req.user.id 
    });
    next(error);
  }
}

/**
 * Handles requests to retrieve a user's conversation history
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export async function handleGetConversations(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing get conversations request', { userId: req.user.id });
    
    // Extract pagination parameters from query
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Initialize ChatService with database connection
    const chatService = new ChatService(connection);
    
    // Get user conversations with pagination
    const { conversations, total, page: currentPage } = await chatService.getUserConversations(
      userId, 
      { page, limit }
    );
    
    // Send paginated response with conversations
    sendPaginated(
      res, 
      conversations, 
      total, 
      currentPage, 
      limit, 
      'Conversations retrieved successfully'
    );
  } catch (error) {
    logger.error('Error retrieving conversations', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId: req.user.id 
    });
    next(error);
  }
}

/**
 * Handles requests to create a new conversation with an initial message
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export async function handleCreateConversation(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing create conversation request', { userId: req.user.id });
    
    // Extract initial message from request body
    const { message } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return sendError(res, new Error('Message is required'), 'Message is required', 400);
    }
    
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Initialize ChatService with database connection
    const chatService = new ChatService(connection);
    
    // Create new conversation with initial message
    const result = await chatService.createNewConversation(userId, message);
    
    // Send created response with conversation ID and initial response
    sendCreated(res, result, 'Conversation created successfully');
  } catch (error) {
    logger.error('Error creating conversation', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId: req.user.id 
    });
    next(error);
  }
}

/**
 * Handles requests to retrieve a specific conversation by ID
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export async function handleGetConversation(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing get conversation request', { 
      userId: req.user.id,
      conversationId: req.params.id
    });
    
    // Extract conversation ID from request parameters
    const conversationId = req.params.id;
    
    if (!conversationId) {
      return sendError(res, new Error('Conversation ID is required'), 'Conversation ID is required', 400);
    }
    
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Initialize ChatService with database connection
    const chatService = new ChatService(connection);
    
    // Get conversation history
    const messages = await chatService.getConversationMessages(
      conversationId,
      userId,
      { limit: 1000 } // Large limit to get full conversation
    );
    
    // Send success response with conversation details
    sendSuccess(res, {
      id: conversationId,
      messages: messages.messages
    }, 'Conversation retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving conversation', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId: req.user.id,
      conversationId: req.params.id
    });
    next(error);
  }
}

/**
 * Handles requests to retrieve message history for a specific conversation
 * 
 * @param req - Express request object with authenticated user
 * @param res - Express response object
 * @param next - Express next function
 */
export async function handleGetChatHistory(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    logger.info('Processing get chat history request', { 
      userId: req.user.id,
      conversationId: req.params.id
    });
    
    // Extract conversation ID from request parameters
    const conversationId = req.params.id;
    
    if (!conversationId) {
      return sendError(res, new Error('Conversation ID is required'), 'Conversation ID is required', 400);
    }
    
    // Extract pagination parameters from query
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    // Extract user ID from authenticated request
    const userId = req.user.id;
    
    // Initialize ChatService with database connection
    const chatService = new ChatService(connection);
    
    // Get conversation messages with pagination
    const { messages, total, page: currentPage } = await chatService.getConversationMessages(
      conversationId,
      userId,
      { page, limit }
    );
    
    // Send paginated response with messages
    sendPaginated(
      res, 
      messages, 
      total, 
      currentPage, 
      limit, 
      'Chat history retrieved successfully'
    );
  } catch (error) {
    logger.error('Error retrieving chat history', { 
      error: (error as Error).message,
      stack: (error as Error).stack,
      userId: req.user.id,
      conversationId: req.params.id
    });
    next(error);
  }
}