/**
 * TypeScript type definitions for chat functionality in the Health Advisor application
 * Defines interfaces for chat messages, conversations, LLM interactions, and API request/response structures
 * Used throughout the backend for handling user-LLM communication and chat history
 */

import { Types } from 'mongoose'; // ^7.0.3
import { ObjectId } from './index';

/**
 * Enum defining possible roles in chat messages
 */
export enum ChatRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

/**
 * Interface for chat message documents stored in the database
 */
export interface ChatMessage {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ChatRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Interface for chat conversation documents stored in the database
 */
export interface ChatConversation {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  startedAt: Date;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for message structure sent to LLM provider
 */
export interface LLMMessage {
  role: ChatRole;
  content: string;
}

/**
 * Interface for health context data structure used to provide context to LLM
 */
export interface HealthContext {
  recentMeals: object[];
  recentLabResults: object[];
  recentSymptoms: object[];
}

/**
 * Interface for request structure sent to LLM provider
 */
export interface LLMRequest {
  messages: LLMMessage[];
  userId: string;
  maxTokens?: number;
}

/**
 * Interface for response structure received from LLM provider
 */
export interface LLMResponse {
  content: string;
  metadata?: Record<string, any>;
}

/**
 * Interface for client request to send a message to the LLM
 */
export interface SendMessageRequest {
  message: string;
  conversationId?: string;
}

/**
 * Interface for server response after processing a message with the LLM
 */
export interface SendMessageResponse {
  response: string;
  conversationId: string;
}

/**
 * Interface for client request to retrieve chat history with pagination
 */
export interface GetChatHistoryRequest {
  conversationId: string;
  page?: number;
  limit?: number;
}

/**
 * Interface for server response with paginated chat history
 */
export interface GetChatHistoryResponse {
  messages: ChatMessage[];
  total: number;
  page: number;
}

/**
 * Interface for client request to retrieve user's conversations with pagination
 */
export interface GetConversationsRequest {
  page?: number;
  limit?: number;
}

/**
 * Interface for server response with paginated conversations
 */
export interface GetConversationsResponse {
  conversations: ChatConversation[];
  total: number;
  page: number;
}

/**
 * Enum for chat-related error types
 */
export enum ChatErrorType {
  CONVERSATION_NOT_FOUND = 'Conversation not found',
  INVALID_MESSAGE = 'Invalid message content',
  LLM_SERVICE_ERROR = 'Error communicating with LLM service',
  UNAUTHORIZED_ACCESS = 'Unauthorized access to conversation'
}