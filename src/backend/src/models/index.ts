/**
 * Central Model Index
 * 
 * This file exports all MongoDB models used in the Health Advisor application,
 * providing a centralized import point for other modules. This approach simplifies 
 * imports and helps prevent circular dependencies by providing getter functions
 * for models that might be involved in circular references.
 * 
 * @module models
 */

import mongoose from 'mongoose'; // ^7.0.0
import User from './user.model';
import { ChatConversation } from './chat-conversation.model';
import { HealthDataModel } from './health-data.model';

/**
 * Function to get the User model, preventing circular dependencies
 * @returns The User model
 */
export function getUserModel(): typeof User {
  return User;
}

/**
 * Function to get the ChatConversation model, preventing circular dependencies
 * @returns The ChatConversation model
 */
export function getChatConversationModel(): typeof ChatConversation {
  return ChatConversation;
}

/**
 * Function to get the ChatMessage model, preventing circular dependencies
 * by using dynamic import
 * @returns Promise resolving to the ChatMessage model
 */
export async function getChatMessageModel(): Promise<mongoose.Model<any>> {
  try {
    const module = await import('./chat-message.model');
    return module.default;
  } catch (error) {
    throw new Error(`Failed to load ChatMessage model: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Function to get the HealthDataModel, preventing circular dependencies
 * @returns The HealthDataModel
 */
export function getHealthDataModel(): typeof HealthDataModel {
  return HealthDataModel;
}

// Direct exports of models for standard use cases
export { User };
export { ChatConversation };
export { HealthDataModel as HealthData };