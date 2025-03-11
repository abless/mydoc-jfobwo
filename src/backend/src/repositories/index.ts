/**
 * Repository Index Module
 * 
 * This module serves as a central export point for all repository modules in the
 * Health Advisor application. It simplifies imports throughout the application 
 * and promotes a clean architecture pattern by providing a unified interface for
 * accessing different data entities.
 * 
 * @module repositories
 */

// Re-export user repository functions
export { 
  findById, 
  findByEmail, 
  createUser, 
  getUserById 
} from './user.repository';

// Re-export chat repository functions
export { 
  getUserConversations, 
  getConversationById, 
  createConversation, 
  getConversationMessages, 
  createMessage, 
  createUserMessage, 
  createAssistantMessage, 
  createSystemMessage, 
  getConversationHistory 
} from './chat.repository';

// Re-export repository classes
export { HealthRepository } from './health.repository';
export { FileRepository } from './file.repository';