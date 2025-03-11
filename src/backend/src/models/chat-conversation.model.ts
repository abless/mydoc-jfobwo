import mongoose, { Schema, Model } from 'mongoose'; // ^7.0.3
import { ChatConversation } from '../types/chat.types';

/**
 * MongoDB schema for chat conversations between users and the LLM health advisor
 * Defines the structure and validation for conversation documents
 */
const ChatConversationSchema = new Schema<ChatConversation>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries by userId
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true // Index for sorting by last message time
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Add compound index for more efficient queries with sorting
ChatConversationSchema.index({ userId: 1, lastMessageAt: -1 });

/**
 * Interface for the ChatConversation model with static methods
 */
interface ChatConversationModel extends Model<ChatConversation> {
  findByUserId(userId: string, options?: { page?: number; limit?: number }): Promise<ChatConversation[]>;
  findById(conversationId: string, userId: string): Promise<ChatConversation | null>;
  createConversation(userId: string, title: string): Promise<ChatConversation>;
  updateLastMessageTime(conversationId: string): Promise<ChatConversation | null>;
  updateTitle(conversationId: string, userId: string, title: string): Promise<ChatConversation | null>;
  countUserConversations(userId: string): Promise<number>;
}

/**
 * Finds all conversations for a specific user with pagination
 * @param userId - The ID of the user to find conversations for
 * @param options - Pagination options (page, limit)
 * @returns Promise resolving to an array of conversation documents
 */
ChatConversationSchema.statics.findByUserId = async function(
  userId: string,
  options: { page?: number; limit?: number } = {}
): Promise<ChatConversation[]> {
  const query = { userId };
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  return this.find(query)
    .sort({ lastMessageAt: -1 }) // Sort by most recent message
    .skip(skip)
    .limit(limit)
    .exec();
};

/**
 * Finds a conversation by ID and verifies user access
 * @param conversationId - The ID of the conversation to find
 * @param userId - The ID of the user who should own the conversation
 * @returns Promise resolving to the conversation document if found and accessible
 */
ChatConversationSchema.statics.findById = async function(
  conversationId: string,
  userId: string
): Promise<ChatConversation | null> {
  return this.findOne({
    _id: conversationId,
    userId
  }).exec();
};

/**
 * Creates a new conversation for a user
 * @param userId - The ID of the user creating the conversation
 * @param title - The title of the conversation
 * @returns Promise resolving to the newly created conversation document
 */
ChatConversationSchema.statics.createConversation = async function(
  userId: string,
  title: string
): Promise<ChatConversation> {
  const now = new Date();
  return this.create({
    userId,
    title,
    startedAt: now,
    lastMessageAt: now
  });
};

/**
 * Updates the lastMessageAt timestamp of a conversation
 * @param conversationId - The ID of the conversation to update
 * @returns Promise resolving to the updated conversation document
 */
ChatConversationSchema.statics.updateLastMessageTime = async function(
  conversationId: string
): Promise<ChatConversation | null> {
  return this.findByIdAndUpdate(
    conversationId,
    { lastMessageAt: new Date() },
    { new: true } // Return the updated document
  ).exec();
};

/**
 * Updates the title of a conversation
 * @param conversationId - The ID of the conversation to update
 * @param userId - The ID of the user who owns the conversation
 * @param title - The new title for the conversation
 * @returns Promise resolving to the updated conversation document
 */
ChatConversationSchema.statics.updateTitle = async function(
  conversationId: string,
  userId: string,
  title: string
): Promise<ChatConversation | null> {
  return this.findOneAndUpdate(
    { _id: conversationId, userId },
    { title },
    { new: true } // Return the updated document
  ).exec();
};

/**
 * Counts the total number of conversations for a user
 * @param userId - The ID of the user to count conversations for
 * @returns Promise resolving to the count of conversations
 */
ChatConversationSchema.statics.countUserConversations = async function(
  userId: string
): Promise<number> {
  return this.countDocuments({ userId }).exec();
};

// Create the model
const ChatConversation = mongoose.model<ChatConversation, ChatConversationModel>(
  'ChatConversation',
  ChatConversationSchema
);

export { ChatConversationSchema, ChatConversation };