/**
 * Chat Service Module
 * 
 * This service provides high-level chat functionality for the Health Advisor application.
 * It handles user-LLM interactions, conversation management, and integration of health
 * data context to provide personalized health insights to users.
 * 
 * The service orchestrates the flow between user messages, health data context, and LLM
 * responses, ensuring that interactions are contextualized with relevant health information.
 */

import mongoose from 'mongoose'; // ^7.0.3
import { llm, logger } from '../config';
import { 
  ChatRole, 
  LLMMessage, 
  LLMRequest, 
  LLMResponse,
  HealthContext,
  SendMessageRequest,
  SendMessageResponse,
  GetChatHistoryRequest,
  GetChatHistoryResponse,
  ChatErrorType
} from '../types/chat.types';

import {
  getUserConversations,
  getConversationById,
  createConversation,
  getConversationMessages,
  createUserMessage,
  createAssistantMessage,
  getConversationHistory
} from '../repositories/chat.repository';

import {
  sendRequestToLLM,
  buildPrompt,
  processResponse
} from './llm.service';

import { HealthService } from './health.service';
import { NotFoundError, BadRequestError, ServiceUnavailableError } from '../utils/error.util';

/**
 * Service class that provides high-level chat functionality for the Health Advisor application
 */
export class ChatService {
  private healthService: HealthService;

  /**
   * Initializes the ChatService with database connection and health service
   * 
   * @param connection - MongoDB connection instance
   */
  constructor(private connection: mongoose.Connection) {
    // Initialize HealthService with the connection
    this.healthService = new HealthService(connection);
    logger.info('Chat service initialized');
  }

  /**
   * Retrieves all conversations for a specific user with pagination
   * 
   * @param userId - ID of the user
   * @param options - Pagination options (page, limit)
   * @returns Promise resolving to paginated conversations and metadata
   */
  async getUserConversations(
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{ conversations: any[]; total: number; page: number }> {
    try {
      logger.debug('Getting conversations for user', { userId, options });
      
      // Get conversations from repository with pagination
      const result = await getUserConversations(userId, options);
      
      return result;
    } catch (error) {
      logger.error('Error getting user conversations', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Retrieves all messages for a specific conversation with pagination
   * 
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user who owns the conversation
   * @param options - Pagination options (page, limit)
   * @returns Promise resolving to paginated messages and metadata
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<GetChatHistoryResponse> {
    try {
      logger.debug('Getting messages for conversation', { conversationId, userId, options });
      
      // Verify the user has access to this conversation
      const conversation = await getConversationById(conversationId, userId);
      
      if (!conversation) {
        logger.warn('Conversation not found or unauthorized access', { conversationId, userId });
        throw new NotFoundError(ChatErrorType.CONVERSATION_NOT_FOUND, 'Conversation');
      }
      
      // Get messages from repository with pagination
      const { messages, total, page } = await getConversationMessages(conversationId, options);
      
      return { messages, total, page };
    } catch (error) {
      logger.error('Error getting conversation messages', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        conversationId,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Creates a new conversation for a user
   * 
   * @param userId - ID of the user creating the conversation
   * @param initialMessage - First message to start the conversation
   * @returns Promise resolving to new conversation ID and initial response
   */
  async createNewConversation(
    userId: string,
    initialMessage: string
  ): Promise<{ conversationId: string; response: string }> {
    try {
      logger.info('Creating new conversation', { userId });
      
      // Generate a title based on the initial message
      const title = this.generateConversationTitle(initialMessage);
      
      // Create new conversation in the database
      const conversation = await createConversation(userId, title);
      
      // Process the initial message with the LLM
      const response = await this.sendMessageToLLM(
        conversation._id.toString(),
        userId,
        initialMessage
      );
      
      logger.info('New conversation created successfully', { 
        conversationId: conversation._id.toString(),
        userId
      });
      
      return {
        conversationId: conversation._id.toString(),
        response
      };
    } catch (error) {
      logger.error('Error creating new conversation', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      throw error;
    }
  }

  /**
   * Sends a user message to an existing conversation and gets LLM response
   * 
   * @param request - Message request containing message text and optional conversationId
   * @param userId - ID of the user sending the message
   * @returns Promise resolving to LLM response and conversation ID
   */
  async sendMessage(
    request: SendMessageRequest,
    userId: string
  ): Promise<SendMessageResponse> {
    try {
      logger.info('Processing message request', { 
        userId,
        conversationId: request.conversationId || 'new'
      });
      
      const { message, conversationId } = request;
      
      // Validate message content
      if (!message || message.trim() === '') {
        throw new BadRequestError(ChatErrorType.INVALID_MESSAGE, 'MESSAGE_EMPTY');
      }
      
      // Limit message length to prevent abuse
      if (message.length > 2000) {
        throw new BadRequestError(ChatErrorType.INVALID_MESSAGE, 'MESSAGE_TOO_LONG');
      }
      
      let activeConversationId = conversationId;
      
      // If conversationId is provided, verify user has access to it
      if (activeConversationId) {
        const conversation = await getConversationById(activeConversationId, userId);
        
        if (!conversation) {
          logger.warn('Conversation not found or unauthorized access', { 
            conversationId: activeConversationId,
            userId
          });
          
          // Create a new conversation since the provided one is invalid
          logger.info('Creating new conversation as fallback', { userId });
          const newConversation = await createConversation(
            userId,
            this.generateConversationTitle(message)
          );
          activeConversationId = newConversation._id.toString();
        }
      } else {
        // Create a new conversation if none provided
        logger.info('Creating new conversation', { userId });
        const newConversation = await createConversation(
          userId,
          this.generateConversationTitle(message)
        );
        activeConversationId = newConversation._id.toString();
      }
      
      // Process the message with LLM
      const response = await this.sendMessageToLLM(
        activeConversationId,
        userId,
        message
      );
      
      return {
        response,
        conversationId: activeConversationId
      };
    } catch (error) {
      logger.error('Error sending message', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId,
        conversationId: request.conversationId
      });
      
      throw error;
    }
  }

  /**
   * Processes a user message, retrieves health context, sends to LLM, and stores response
   * 
   * @param conversationId - ID of the conversation
   * @param userId - ID of the user sending the message
   * @param message - Message text from the user
   * @returns Promise resolving to the LLM response text
   */
  private async sendMessageToLLM(
    conversationId: string,
    userId: string,
    message: string
  ): Promise<string> {
    try {
      logger.debug('Preparing LLM request', { conversationId, userId });
      
      // Create user message in the database
      await createUserMessage(conversationId, userId, message);
      
      // Get recent conversation history
      const conversationHistory = await getConversationHistory(conversationId, 10);
      
      // Get user's health context
      const healthContext = await this.buildHealthContext(userId);
      
      // Format conversation messages for LLM
      const formattedMessages = this.formatConversationMessages(conversationHistory);
      
      // Build prompt with context
      const prompt = buildPrompt(formattedMessages, healthContext);
      
      // Prepare LLM request
      const llmRequest: LLMRequest = {
        messages: prompt,
        userId,
        maxTokens: llm.requestDefaults.maxTokens
      };
      
      // Send request to LLM
      let llmResponse: LLMResponse;
      try {
        llmResponse = await sendRequestToLLM(llmRequest);
      } catch (error) {
        logger.error('LLM service error', {
          error: (error as Error).message,
          userId,
          conversationId
        });
        throw new ServiceUnavailableError(
          ChatErrorType.LLM_SERVICE_ERROR,
          'LLM Service'
        );
      }
      
      // Process LLM response
      const processedResponse = processResponse(llmResponse);
      
      // Store assistant message in the database
      await createAssistantMessage(
        conversationId,
        userId,
        processedResponse.content,
        { 
          model: llmResponse.metadata?.model || llm.model,
          processedAt: new Date().toISOString()
        }
      );
      
      return processedResponse.content;
    } catch (error) {
      logger.error('Error in LLM processing', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        conversationId,
        userId
      });
      
      // If it's already a ServiceUnavailableError, rethrow it
      if (error instanceof ServiceUnavailableError) {
        throw error;
      }
      
      // Otherwise wrap in a general error
      throw new Error(`Failed to process message: ${(error as Error).message}`);
    }
  }

  /**
   * Builds a health context string from user's recent health data
   * 
   * @param userId - ID of the user
   * @returns Promise resolving to formatted health context string
   */
  private async buildHealthContext(userId: string): Promise<string> {
    try {
      logger.debug('Building health context for user', { userId });
      
      // Get recent health data from the health service
      const healthData = await this.healthService.getRecentHealthData(userId, 5);
      
      if (!healthData || 
          (healthData.recentMeals.length === 0 && 
           healthData.recentLabResults.length === 0 && 
           healthData.recentSymptoms.length === 0)) {
        logger.debug('No health data available for context', { userId });
        return "";
      }
      
      // Format meals
      let mealContext = "";
      if (healthData.recentMeals.length > 0) {
        mealContext = "Recent meals:\n" + healthData.recentMeals.map(meal => {
          const date = new Date(meal.timestamp).toLocaleString();
          return `- ${date}: ${meal.data.description} (${meal.data.mealType})`;
        }).join("\n");
      }
      
      // Format lab results
      let labContext = "";
      if (healthData.recentLabResults.length > 0) {
        labContext = "\n\nRecent lab results:\n" + healthData.recentLabResults.map(lab => {
          const date = new Date(lab.timestamp).toLocaleString();
          return `- ${date}: ${lab.data.testType} - ${JSON.stringify(lab.data.results || {})}`;
        }).join("\n");
      }
      
      // Format symptoms
      let symptomContext = "";
      if (healthData.recentSymptoms.length > 0) {
        symptomContext = "\n\nRecent symptoms:\n" + healthData.recentSymptoms.map(symptom => {
          const date = new Date(symptom.timestamp).toLocaleString();
          return `- ${date}: ${symptom.data.description} (Severity: ${symptom.data.severity}, Duration: ${symptom.data.duration || 'Not specified'})`;
        }).join("\n");
      }
      
      // Combine all context sections
      const fullContext = `HEALTH CONTEXT:\n${mealContext}${labContext}${symptomContext}`;
      
      logger.debug('Health context built successfully', { 
        userId, 
        contextLength: fullContext.length
      });
      
      return fullContext;
    } catch (error) {
      logger.error('Error building health context', {
        error: (error as Error).message,
        stack: (error as Error).stack,
        userId
      });
      
      // Return empty context on error rather than failing the entire request
      // This allows the conversation to continue without health context
      return "";
    }
  }

  /**
   * Formats database conversation messages into LLM-compatible message format
   * 
   * @param messages - Array of database message objects
   * @returns Array of formatted messages for the LLM
   */
  private formatConversationMessages(messages: any[]): LLMMessage[] {
    return messages.map(message => ({
      role: message.role as ChatRole,
      content: message.content
    }));
  }

  /**
   * Generates a default conversation title based on the initial message
   * 
   * @param message - Initial message to generate title from
   * @returns Generated conversation title
   */
  private generateConversationTitle(message: string): string {
    // Use first ~30 characters of message as the title
    const baseTitle = message.substring(0, 30).trim();
    // Add ellipsis if the message was truncated
    const title = message.length > 30 ? `${baseTitle}...` : baseTitle;
    // Add date for uniqueness
    return `${title} - ${new Date().toLocaleDateString()}`;
  }
}