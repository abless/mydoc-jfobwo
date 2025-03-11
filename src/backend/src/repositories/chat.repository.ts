/**
 * Chat Repository Module
 * 
 * This module provides data access methods for chat functionality in the Health Advisor application.
 * It abstracts database operations related to chat conversations and messages, providing
 * a clean interface for the service layer to interact with the database.
 * 
 * @module repositories/chat.repository
 */

import { Types } from 'mongoose'; // ^7.0.3
import { ChatConversation, ChatMessage, ChatRole } from '../types/chat.types';
import { ChatConversation as ChatConversationModel, getChatMessageModel } from '../models';
import { NotFoundError } from '../utils/error.util';

/**
 * Retrieves all conversations for a specific user with pagination
 * 
 * @param userId - The ID of the user to retrieve conversations for
 * @param options - Pagination options (page, limit)
 * @returns Promise resolving to paginated conversations and metadata
 */
export async function getUserConversations(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ conversations: ChatConversation[]; total: number; page: number }> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  
  const conversations = await ChatConversationModel.findByUserId(userId, { page, limit });
  const total = await ChatConversationModel.countUserConversations(userId);
  
  return {
    conversations,
    total,
    page
  };
}

/**
 * Retrieves a specific conversation by ID and verifies user ownership
 * 
 * @param conversationId - The ID of the conversation to retrieve
 * @param userId - The ID of the user who should own the conversation
 * @returns Promise resolving to the conversation document
 * @throws NotFoundError if the conversation doesn't exist or doesn't belong to the user
 */
export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ChatConversation> {
  const conversation = await ChatConversationModel.findById(conversationId, userId);
  
  if (!conversation) {
    throw new NotFoundError('Conversation not found or does not belong to the user', 'ChatConversation');
  }
  
  return conversation;
}

/**
 * Creates a new conversation for a user
 * 
 * @param userId - The ID of the user creating the conversation
 * @param title - The title of the conversation
 * @returns Promise resolving to the newly created conversation
 */
export async function createConversation(
  userId: string,
  title: string
): Promise<ChatConversation> {
  return ChatConversationModel.createConversation(userId, title);
}

/**
 * Retrieves all messages for a specific conversation with pagination
 * 
 * @param conversationId - The ID of the conversation to retrieve messages for
 * @param options - Pagination options (page, limit)
 * @returns Promise resolving to paginated messages and metadata
 */
export async function getConversationMessages(
  conversationId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ messages: ChatMessage[]; total: number; page: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  
  try {
    const ChatMessageModel = await getChatMessageModel();
    
    // Get messages for the conversation with pagination
    const messages = await ChatMessageModel.findByConversationId(conversationId, { page, limit });
    const total = await ChatMessageModel.countConversationMessages(conversationId);
    
    return {
      messages,
      total,
      page
    };
  } catch (error) {
    throw new Error(`Failed to get conversation messages: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Creates a new message in a conversation
 * 
 * @param conversationId - The ID of the conversation
 * @param userId - The ID of the user
 * @param role - The role of the message sender (user, assistant, system)
 * @param content - The message content
 * @param metadata - Additional metadata for the message
 * @returns Promise resolving to the created message
 */
export async function createMessage(
  conversationId: string,
  userId: string,
  role: ChatRole,
  content: string,
  metadata: Record<string, any> = {}
): Promise<ChatMessage> {
  try {
    const ChatMessageModel = await getChatMessageModel();
    
    // Create the message
    const message = await ChatMessageModel.createMessage(conversationId, userId, role, content, metadata);
    
    // Update the conversation's last message timestamp
    await ChatConversationModel.updateLastMessageTime(conversationId);
    
    return message;
  } catch (error) {
    throw new Error(`Failed to create message: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to create a message with USER role
 * 
 * @param conversationId - The ID of the conversation
 * @param userId - The ID of the user
 * @param content - The message content
 * @returns Promise resolving to the created user message
 */
export async function createUserMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<ChatMessage> {
  return createMessage(conversationId, userId, ChatRole.USER, content, {});
}

/**
 * Helper function to create a message with ASSISTANT role
 * 
 * @param conversationId - The ID of the conversation
 * @param userId - The ID of the user
 * @param content - The message content
 * @param metadata - Additional metadata for the message
 * @returns Promise resolving to the created assistant message
 */
export async function createAssistantMessage(
  conversationId: string,
  userId: string,
  content: string,
  metadata: Record<string, any> = {}
): Promise<ChatMessage> {
  return createMessage(conversationId, userId, ChatRole.ASSISTANT, content, metadata);
}

/**
 * Helper function to create a message with SYSTEM role
 * 
 * @param conversationId - The ID of the conversation
 * @param userId - The ID of the user
 * @param content - The message content
 * @returns Promise resolving to the created system message
 */
export async function createSystemMessage(
  conversationId: string,
  userId: string,
  content: string
): Promise<ChatMessage> {
  return createMessage(conversationId, userId, ChatRole.SYSTEM, content, {});
}

/**
 * Retrieves recent messages from a conversation for context building
 * 
 * @param conversationId - The ID of the conversation
 * @param limit - Maximum number of messages to retrieve
 * @returns Promise resolving to recent messages
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  try {
    const ChatMessageModel = await getChatMessageModel();
    return ChatMessageModel.getConversationHistory(conversationId, limit);
  } catch (error) {
    throw new Error(`Failed to get conversation history: ${error instanceof Error ? error.message : String(error)}`);
  }
}