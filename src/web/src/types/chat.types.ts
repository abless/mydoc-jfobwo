/**
 * TypeScript type definitions for chat functionality in the Health Advisor mobile application.
 * These types define structures for chat messages, conversations, and API request/response interfaces
 * to enable type-safe interactions with the LLM health advisor feature.
 */

import { ApiResponse, PaginatedResponse } from './api.types';

/**
 * Enum defining possible roles in chat messages.
 */
export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/**
 * Enum defining possible status states for chat messages.
 */
export enum ChatMessageStatus {
  SENDING = 'sending',
  SENT = 'sent',
  ERROR = 'error',
}

/**
 * Interface for chat message objects used in the client application.
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  status: ChatMessageStatus;
}

/**
 * Interface for chat message responses from the API.
 * Note: timestamp is a string in API responses and converted to Date in the client.
 */
export interface ChatMessageResponse {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  timestamp: string;
}

/**
 * Interface for conversation objects used in the client application.
 */
export interface Conversation {
  id: string;
  title: string;
  startedAt: Date;
  lastMessageAt: Date;
  messages: ChatMessage[];
}

/**
 * Interface for conversation responses from the API.
 * Note: date fields are strings in API responses and converted to Date in the client.
 */
export interface ConversationResponse {
  id: string;
  title: string;
  startedAt: string;
  lastMessageAt: string;
}

/**
 * Interface for request payload to send a message to the LLM.
 */
export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

/**
 * Interface for response payload after sending a message to the LLM.
 */
export interface SendMessageResponse {
  response: string;
  conversationId: string;
}

/**
 * Interface for parameters to retrieve chat history with pagination.
 */
export interface ChatHistoryParams {
  conversationId: string;
  page: number;
  limit: number;
}

/**
 * Interface for parameters to retrieve conversations with pagination.
 */
export interface ConversationsParams {
  page: number;
  limit: number;
}

/**
 * Interface for chat context data in the React context.
 * Stores state related to conversations and active chat.
 */
export interface ChatContextData {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loading: boolean;
  error: string | null;
}

/**
 * Interface for chat context actions in the React context.
 * Defines methods for interacting with the chat functionality.
 */
export interface ChatContextActions {
  /**
   * Sends a message to the LLM and returns the response
   * @param message - The message text to send
   * @param conversationId - Optional ID of an existing conversation
   * @returns Promise with the LLM response
   */
  sendMessage: (message: string, conversationId?: string) => Promise<SendMessageResponse>;
  
  /**
   * Loads the list of user conversations with pagination
   * @param params - Optional pagination parameters
   */
  loadConversations: (params?: ConversationsParams) => Promise<void>;
  
  /**
   * Loads a specific conversation by ID
   * @param conversationId - The ID of the conversation to load
   */
  loadConversation: (conversationId: string) => Promise<void>;
  
  /**
   * Creates a new conversation
   * @returns Promise with the new conversation ID
   */
  createNewConversation: () => Promise<string>;
}

/**
 * Interface for the complete chat context in the React context.
 * Combines both state data and action methods.
 */
export interface ChatContextType {
  data: ChatContextData;
  actions: ChatContextActions;
}