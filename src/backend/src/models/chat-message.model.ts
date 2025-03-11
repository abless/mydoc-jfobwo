/**
 * Chat Message Model
 * 
 * Defines the Mongoose schema and model for chat messages in the Health Advisor application.
 * Each message represents an individual interaction between a user and the LLM health advisor,
 * with appropriate references to conversations and users.
 */

import mongoose, { Schema, Model } from 'mongoose'; // ^7.0.3
import { ChatMessage, ChatRole } from '../types/chat.types';
import { getChatConversationModel } from './index';

/**
 * Mongoose schema for chat messages in the Health Advisor application
 * Defines the structure and validation for message documents
 */
export const ChatMessageSchema = new Schema<ChatMessage>({
  conversationId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatConversation',
    required: true,
    index: true // Index for faster queries by conversationId
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  role: {
    type: String,
    enum: Object.values(ChatRole),
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
    index: true // Index for sorting by timestamp
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add compound index for more efficient queries with sorting
ChatMessageSchema.index({ conversationId: 1, timestamp: 1 });

/**
 * Interface for the ChatMessage model with static methods
 */
interface ChatMessageModel extends Model<ChatMessage> {
  findByConversationId(conversationId: string, options?: { page?: number; limit?: number }): Promise<ChatMessage[]>;
  createMessage(conversationId: string, userId: string, role: ChatRole, content: string, metadata?: Record<string, any>): Promise<ChatMessage>;
  countConversationMessages(conversationId: string): Promise<number>;
  getConversationHistory(conversationId: string, limit?: number): Promise<ChatMessage[]>;
}

/**
 * Finds all messages for a specific conversation with pagination
 * @param conversationId - The ID of the conversation to find messages for
 * @param options - Pagination options (page, limit)
 * @returns Promise resolving to an array of message documents
 */
ChatMessageSchema.statics.findByConversationId = async function(
  conversationId: string,
  options: { page?: number; limit?: number } = {}
): Promise<ChatMessage[]> {
  const query = { conversationId };
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ timestamp: 1 }) // Sort by timestamp in ascending order (oldest first)
    .skip(skip)
    .limit(limit)
    .exec();
};

/**
 * Creates a new message in a conversation
 * @param conversationId - The ID of the conversation the message belongs to
 * @param userId - The ID of the user who sent/received the message
 * @param role - The role of the message sender (user, assistant, system)
 * @param content - The content of the message
 * @param metadata - Optional metadata to attach to the message
 * @returns Promise resolving to the newly created message document
 */
ChatMessageSchema.statics.createMessage = async function(
  conversationId: string,
  userId: string,
  role: ChatRole,
  content: string,
  metadata: Record<string, any> = {}
): Promise<ChatMessage> {
  // Create the new message
  const message = await this.create({
    conversationId,
    userId,
    role,
    content,
    timestamp: new Date(),
    metadata
  });

  // Update the lastMessageAt timestamp of the conversation
  const ChatConversation = getChatConversationModel();
  await ChatConversation.updateLastMessageTime(conversationId);

  return message;
};

/**
 * Counts the total number of messages in a conversation
 * @param conversationId - The ID of the conversation to count messages for
 * @returns Promise resolving to the count of messages
 */
ChatMessageSchema.statics.countConversationMessages = async function(
  conversationId: string
): Promise<number> {
  return this.countDocuments({ conversationId }).exec();
};

/**
 * Gets the conversation history for context building
 * @param conversationId - The ID of the conversation to get history for
 * @param limit - Maximum number of messages to retrieve (default: 10)
 * @returns Promise resolving to the most recent messages in the conversation
 */
ChatMessageSchema.statics.getConversationHistory = async function(
  conversationId: string,
  limit: number = 10
): Promise<ChatMessage[]> {
  return this.find({ conversationId })
    .sort({ timestamp: -1 }) // Sort by timestamp in descending order (newest first)
    .limit(limit)
    .exec();
};

// Create the model
export const ChatMessage = mongoose.model<ChatMessage, ChatMessageModel>(
  'ChatMessage',
  ChatMessageSchema
);