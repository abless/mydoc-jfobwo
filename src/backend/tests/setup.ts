/**
 * Test Environment Setup
 * 
 * This module provides utilities for setting up a test environment with MongoDB Memory Server.
 * It offers functions for database connection management and collection reset capabilities
 * to ensure test isolation between test runs.
 * 
 * @module tests/setup
 */

import { MongoMemoryServer } from 'mongodb-memory-server'; // ^8.12.2
import mongoose from 'mongoose'; // ^7.0.3
import { Application } from 'express'; // ^4.18.2
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import User from '../src/models/user.model';
import { ChatConversation } from '../src/models/chat-conversation.model';
import { ChatMessage } from '../src/models/chat-message.model';
import { HealthDataModel as HealthData } from '../src/models/health-data.model';

// Global instance of MongoDB Memory Server
let mongoServer: MongoMemoryServer;

/**
 * Initializes MongoDB Memory Server and connects Mongoose to it
 * 
 * Creates an in-memory MongoDB server for isolated testing without affecting
 * any external databases. Sets the connection URI in environment variables
 * and establishes a connection.
 * 
 * @returns Promise that resolves when database is set up
 */
export async function setupTestDatabase(): Promise<void> {
  // Create a new MongoDB Memory Server instance
  mongoServer = await MongoMemoryServer.create();
  
  // Get the connection URI from the memory server
  const uri = mongoServer.getUri();
  
  // Set environment variable for MongoDB URI
  process.env.MONGODB_URI = uri;
  
  // Connect to the in-memory database
  await connectToDatabase();
  
  console.log('Connected to in-memory MongoDB server for testing');
}

/**
 * Disconnects from MongoDB and stops the Memory Server
 * 
 * Properly closes the database connection and shuts down the in-memory
 * MongoDB server to free resources after testing.
 * 
 * @returns Promise that resolves when database is torn down
 */
export async function teardownTestDatabase(): Promise<void> {
  // Disconnect from MongoDB
  await disconnectFromDatabase();
  
  // Stop the MongoDB Memory Server
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('Test database torn down successfully');
}

/**
 * Clears all collections in the database to ensure test isolation
 * 
 * Removes all documents from all collections to provide a clean slate
 * between tests, preventing test interference.
 * 
 * @returns Promise that resolves when collections are reset
 */
export async function resetCollections(): Promise<void> {
  // Check if we have an active connection
  if (mongoose.connection.readyState === 0) {
    throw new Error('Database connection not established. Call setupTestDatabase first.');
  }
  
  // Delete all documents from collections
  await User.deleteMany({});
  await ChatConversation.deleteMany({});
  await ChatMessage.deleteMany({});
  await HealthData.deleteMany({});
  
  console.log('Collections reset for test isolation');
}

/**
 * Creates and configures an Express application instance for testing
 * 
 * Dynamically imports the application creation function to avoid circular
 * dependencies and returns a configured Express app for integration tests.
 * 
 * @returns Promise that resolves to configured Express app
 */
export async function setupTestApp(): Promise<Application> {
  // Import createApp dynamically to avoid circular dependencies
  const { default: createApp } = await import('../src/app');
  
  // Create and return the configured Express app
  return createApp();
}