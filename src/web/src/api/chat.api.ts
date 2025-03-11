/**
 * Chat API module for interacting with the LLM health advisor
 * 
 * This module provides functions for sending messages to the LLM health advisor,
 * retrieving conversation history, creating new conversations, and managing chat data.
 * It handles all chat-related API requests to the backend server.
 */

import { apiService } from '../services/api.service'; // API service for making HTTP requests
import { ENDPOINTS } from '../constants/endpoints'; // Chat API endpoint URLs
import {
  SendMessageRequest,
  SendMessageResponse,
  ChatHistoryParams,
  ConversationsParams,
  Conversation,
  ChatMessage
} from '../types/chat.types';
import { ApiResponse, PaginatedResponse } from '../types/api.types';

/**
 * Sends a user message to the LLM health advisor and returns the response
 * @param message - The message text to send to the LLM
 * @param conversationId - Optional ID of an existing conversation
 * @returns Promise that resolves with the LLM response and conversation ID
 */
export const sendMessage = async (
  message: string,
  conversationId?: string
): Promise<SendMessageResponse> => {
  // Create request payload with message and optional conversationId
  const payload: SendMessageRequest = {
    message,
    ...(conversationId && { conversationId })
  };

  // Make POST request to send message endpoint
  return apiService.post<SendMessageResponse>(
    ENDPOINTS.CHAT.SEND_MESSAGE,
    payload
  );
};

/**
 * Retrieves the user's chat conversations with pagination
 * @param params - Pagination parameters (page, limit)
 * @returns Promise that resolves with paginated conversations
 */
export const getConversations = async (
  params: ConversationsParams
): Promise<PaginatedResponse<Conversation>> => {
  // Make GET request to get conversations endpoint with pagination parameters
  return apiService.get<PaginatedResponse<Conversation>>(
    ENDPOINTS.CHAT.GET_CONVERSATIONS,
    params
  );
};

/**
 * Retrieves a specific conversation by ID
 * @param conversationId - ID of the conversation to retrieve
 * @returns Promise that resolves with the conversation details
 */
export const getConversation = async (
  conversationId: string
): Promise<ApiResponse<Conversation>> => {
  // Replace :id parameter in the URL with the actual conversation ID
  const url = ENDPOINTS.CHAT.GET_CONVERSATION.replace(':id', conversationId);
  
  // Make GET request to get specific conversation
  return apiService.get<ApiResponse<Conversation>>(url);
};

/**
 * Retrieves messages for a specific conversation with pagination
 * @param params - Parameters containing conversation ID and pagination info
 * @returns Promise that resolves with paginated messages
 */
export const getMessages = async (
  params: ChatHistoryParams
): Promise<PaginatedResponse<ChatMessage>> => {
  // Extract conversation ID from params
  const { conversationId, ...paginationParams } = params;
  
  // Replace :id parameter in the URL with the actual conversation ID
  const url = ENDPOINTS.CHAT.GET_MESSAGES.replace(':id', conversationId);
  
  // Make GET request to get messages for the conversation with pagination
  return apiService.get<PaginatedResponse<ChatMessage>>(
    url,
    paginationParams
  );
};

/**
 * Creates a new conversation
 * @returns Promise that resolves with the newly created conversation
 */
export const createConversation = async (): Promise<ApiResponse<Conversation>> => {
  // Make POST request to create a new conversation
  return apiService.post<ApiResponse<Conversation>>(
    ENDPOINTS.CHAT.CREATE_CONVERSATION
  );
};