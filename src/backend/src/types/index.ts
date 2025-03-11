/**
 * Central type definitions for the Health Advisor backend application
 * This file aggregates and re-exports all types used throughout the application
 * providing a single import point for improved consistency and maintainability
 */

import { Types } from 'mongoose'; // ^7.0.3
import * as AuthTypes from './auth.types';
import * as FileTypes from './file.types';
import * as HealthTypes from './health.types';
import * as UserTypes from './user.types';

/**
 * Type alias for MongoDB ObjectId for use throughout the application
 */
export type ObjectId = Types.ObjectId;

// Re-export auth types
export * from './auth.types';

// Chat-related types and enums
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

// Re-export file types
export * from './file.types';

// Re-export health data types
export * from './health.types';

// Re-export user types
export * from './user.types';

/**
 * Common error response interface used across the application
 */
export interface ErrorResponse {
  message: string;
  code: string;
  status: number;
  details?: Record<string, any>;
}

/**
 * Generic API response interface used for consistent response formatting
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
}

/**
 * Generic paginated response interface for list endpoints
 */
export interface PaginatedResponse<T = any> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}