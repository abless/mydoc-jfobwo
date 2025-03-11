/**
 * Services Index Module
 * 
 * This module exports all service functions and classes from the services directory,
 * providing a centralized entry point for importing service functionality throughout
 * the Health Advisor application.
 * 
 * @module services
 */

// Authentication Service exports
import { login, signup, validateToken, formatUserResponse } from './auth.service';

// Chat Service exports
import { ChatService } from './chat.service';

// File Service exports
import { FileService } from './file.service';

// Health Service exports
import { HealthService } from './health.service';

// LLM Service exports
import { LLMService } from './llm.service';

// User Service exports
import { getUserProfile, formatUserProfile } from './user.service';

// Re-export all service functions and classes
export {
  // Authentication
  login,
  signup,
  validateToken,
  formatUserResponse,
  
  // Chat
  ChatService,
  
  // File
  FileService,
  
  // Health
  HealthService,
  
  // LLM
  LLMService,
  
  // User
  getUserProfile,
  formatUserProfile
};