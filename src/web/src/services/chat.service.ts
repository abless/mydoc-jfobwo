/**
 * Chat Service
 * 
 * Service that provides chat functionality for the React Native mobile application,
 * handling communication with the LLM health advisor through the backend API.
 * This service manages sending messages, retrieving conversation history, and creating new conversations.
 * 
 * @version 1.0.0
 */

import { apiService } from './api.service'; // ^1.3.4
import { ENDPOINTS } from '../constants/endpoints'; // Version: 1.0.0
import { parseApiError } from '../utils/error.utils';
import { 
  ChatMessage, 
  ChatMessageResponse, 
  Conversation, 
  ConversationResponse, 
  SendMessageRequest, 
  SendMessageResponse,
  ChatHistoryParams,
  ConversationsParams,
  ChatRole,
  ChatMessageStatus
} from '../types/chat.types';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

/**
 * Sends a user message to the LLM health advisor and returns the response
 * 
 * @param message - The message text to send to the LLM
 * @param conversationId - Optional ID of an existing conversation to continue
 * @returns Promise that resolves with the LLM response and conversation ID
 */
export const sendMessage = async (
  message: string,
  conversationId?: string
): Promise<SendMessageResponse> => {
  try {
    // Create request payload with message and optional conversationId
    const payload: SendMessageRequest = {
      message,
      ...(conversationId && { conversationId })
    };

    // Make POST request to send message endpoint
    const response = await apiService.post<ApiResponse<SendMessageResponse>>(
      ENDPOINTS.CHAT.SEND_MESSAGE,
      payload
    );

    return response.data;
  } catch (error) {
    // Handle and transform any API errors
    const parsedError = parseApiError(error);
    throw parsedError;
  }
};

/**
 * Retrieves the user's chat conversations with pagination
 * 
 * @param params - Pagination parameters (page, limit)
 * @returns Promise that resolves with paginated conversations
 */
export const getConversations = async (
  params: ConversationsParams
): Promise<PaginatedResponse<Conversation>> => {
  try {
    // Make GET request to conversations endpoint with pagination parameters
    const response = await apiService.get<ApiResponse<PaginatedResponse<ConversationResponse>>>(
      ENDPOINTS.CHAT.GET_CONVERSATIONS,
      params
    );

    // Transform API response data to client model
    const transformedItems = response.data.items.map(conversation => 
      transformConversation(conversation)
    );

    return {
      items: transformedItems,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit
    };
  } catch (error) {
    const parsedError = parseApiError(error);
    throw parsedError;
  }
};

/**
 * Retrieves a specific conversation by ID
 * 
 * @param conversationId - ID of the conversation to retrieve
 * @returns Promise that resolves with the conversation details
 */
export const getConversation = async (
  conversationId: string
): Promise<Conversation> => {
  try {
    // Replace :id placeholder in the endpoint URL with the actual conversationId
    const url = ENDPOINTS.CHAT.GET_CONVERSATION.replace(':id', conversationId);
    
    // Make GET request to conversation endpoint
    const response = await apiService.get<ApiResponse<ConversationResponse>>(url);
    
    // Transform API response data to client model
    return transformConversation(response.data);
  } catch (error) {
    const parsedError = parseApiError(error);
    throw parsedError;
  }
};

/**
 * Retrieves messages for a specific conversation with pagination
 * 
 * @param params - Parameters including conversationId and pagination details
 * @returns Promise that resolves with paginated messages
 */
export const getMessages = async (
  params: ChatHistoryParams
): Promise<PaginatedResponse<ChatMessage>> => {
  try {
    // Extract conversationId from params and prepare pagination params
    const { conversationId, page, limit } = params;
    const paginationParams = { page, limit };
    
    // Replace :id placeholder in the endpoint URL with the actual conversationId
    const url = ENDPOINTS.CHAT.GET_MESSAGES.replace(':id', conversationId);
    
    // Make GET request to messages endpoint with pagination parameters
    const response = await apiService.get<ApiResponse<PaginatedResponse<ChatMessageResponse>>>(
      url,
      paginationParams
    );
    
    // Transform API response data to client model
    const transformedItems = response.data.items.map(message => 
      transformMessage(message)
    );
    
    return {
      items: transformedItems,
      total: response.data.total,
      page: response.data.page,
      limit: response.data.limit
    };
  } catch (error) {
    const parsedError = parseApiError(error);
    throw parsedError;
  }
};

/**
 * Creates a new conversation
 * 
 * @returns Promise that resolves with the newly created conversation
 */
export const createConversation = async (): Promise<Conversation> => {
  try {
    // Make POST request to create conversation endpoint
    const response = await apiService.post<ApiResponse<ConversationResponse>>(
      ENDPOINTS.CHAT.CREATE_CONVERSATION
    );
    
    // Transform API response data to client model
    return transformConversation(response.data);
  } catch (error) {
    const parsedError = parseApiError(error);
    throw parsedError;
  }
};

/**
 * Transforms a conversation response from the API to the client model
 * 
 * @param conversationResponse - Conversation data from API
 * @returns Transformed conversation object for client use
 */
export const transformConversation = (
  conversationResponse: ConversationResponse
): Conversation => {
  return {
    id: conversationResponse.id,
    title: conversationResponse.title,
    startedAt: new Date(conversationResponse.startedAt),
    lastMessageAt: new Date(conversationResponse.lastMessageAt),
    messages: [] // Messages are loaded separately to avoid large payloads
  };
};

/**
 * Transforms a message response from the API to the client model
 * 
 * @param messageResponse - Message data from API
 * @returns Transformed message object for client use
 */
export const transformMessage = (
  messageResponse: ChatMessageResponse
): ChatMessage => {
  return {
    id: messageResponse.id,
    conversationId: messageResponse.conversationId,
    role: messageResponse.role as ChatRole, // Map string role to enum
    content: messageResponse.content,
    timestamp: new Date(messageResponse.timestamp),
    status: ChatMessageStatus.SENT // All messages from API are considered sent
  };
};