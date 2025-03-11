# Health Advisor Backend Architecture

## Table of Contents
- [Introduction](#introduction)
  - [Purpose](#purpose)
  - [Design Goals](#design-goals)
- [System Architecture](#system-architecture)
  - [Architectural Pattern](#architectural-pattern)
  - [Component Overview](#component-overview)
  - [Request Flow](#request-flow)
- [Core Components](#core-components)
  - [Express Application](#express-application)
  - [Authentication Service](#authentication-service)
  - [Health Data Service](#health-data-service)
  - [Chat Service](#chat-service)
  - [File Service](#file-service)
  - [LLM Service](#llm-service)
- [Data Layer](#data-layer)
  - [Database Configuration](#database-configuration)
  - [Data Models](#data-models)
  - [Repository Pattern](#repository-pattern)
  - [GridFS for File Storage](#gridfs-for-file-storage)
- [API Layer](#api-layer)
  - [Route Organization](#route-organization)
  - [Controller Pattern](#controller-pattern)
  - [Request Validation](#request-validation)
  - [Response Formatting](#response-formatting)
- [Middleware](#middleware)
  - [Authentication Middleware](#authentication-middleware)
  - [Error Handling Middleware](#error-handling-middleware)
  - [File Handling Middleware](#file-handling-middleware)
  - [Rate Limiting Middleware](#rate-limiting-middleware)
  - [Validation Middleware](#validation-middleware)
- [Security](#security)
  - [Authentication and Authorization](#authentication-and-authorization)
  - [Data Protection](#data-protection)
  - [API Security](#api-security)
  - [Error Handling](#error-handling-1)
- [Error Handling](#error-handling)
  - [Error Types](#error-types)
  - [Error Middleware](#error-middleware)
  - [Global Error Handlers](#global-error-handlers)
  - [Service-Specific Error Handling](#service-specific-error-handling)
- [Logging](#logging)
  - [Logging Configuration](#logging-configuration)
  - [Log Categories](#log-categories)
  - [Sensitive Data Handling](#sensitive-data-handling)
- [Configuration Management](#configuration-management)
  - [Environment Variables](#environment-variables)
  - [Configuration Module](#configuration-module)
  - [Feature Flags](#feature-flags)
- [Testing Strategy](#testing-strategy)
  - [Unit Testing](#unit-testing)
  - [Integration Testing](#integration-testing)
  - [Test Environment](#test-environment)
- [Deployment Considerations](#deployment-considerations)
  - [Containerization](#containerization)
  - [Scaling](#scaling)
  - [Monitoring](#monitoring)
- [Future Considerations](#future-considerations)
  - [Microservices Evolution](#microservices-evolution)
  - [Performance Optimizations](#performance-optimizations)
  - [Additional Features](#additional-features)

## Introduction

This document provides a comprehensive overview of the Health Advisor backend architecture. The backend is built as a modular monolith using Express.js and TypeScript, with MongoDB as the primary database. It follows a layered architecture pattern with clear separation of concerns and is designed to be scalable, maintainable, and secure.

### Purpose

The Health Advisor backend serves as the server-side component of the application, providing APIs for user authentication, health data management, and LLM-powered chat functionality. It handles data persistence, business logic, and integration with external services.

### Design Goals

The backend architecture is designed with the following goals in mind:
- **Modularity**: Clear separation of concerns with well-defined interfaces
- **Scalability**: Ability to handle growing user base and data volume
- **Security**: Protection of sensitive health data and user information
- **Maintainability**: Easy to understand, modify, and extend
- **Performance**: Efficient handling of requests and data processing

## System Architecture

The Health Advisor backend follows a modular monolith architecture with clear service boundaries. This approach provides a balance between development simplicity and system scalability.

### Architectural Pattern

The backend uses a layered architecture with the following layers:
- **API Layer**: Express routes and controllers
- **Service Layer**: Business logic and orchestration
- **Repository Layer**: Data access and persistence
- **Utility Layer**: Cross-cutting concerns and helper functions

![Architectural Layers](../images/backend-layers.png)

### Component Overview

The backend consists of the following major components:
- **Express Application**: Web server and API endpoints
- **Authentication Service**: User identity and access control
- **Health Data Service**: Management of user health information
- **Chat Service**: LLM integration and conversation management
- **File Service**: Storage and retrieval of user-uploaded files
- **Database**: MongoDB for data persistence

![Component Diagram](../images/backend-components.png)

### Request Flow

1. Client sends HTTP request to Express server
2. Request passes through middleware stack (authentication, validation, etc.)
3. Router directs request to appropriate controller
4. Controller calls service methods to execute business logic
5. Service interacts with repositories for data access
6. Response flows back through the layers to the client

```
┌─────────┐     ┌───────────┐     ┌────────────┐     ┌─────────┐     ┌────────────┐
│  Client │────▶│ Middleware │────▶│  Controller │────▶│ Service │────▶│ Repository │
└─────────┘     └───────────┘     └────────────┘     └─────────┘     └────────────┘
                                                          │                 │
                                                          │                 ▼
                                                          │           ┌──────────┐
                                                          │           │ Database │
                                                          │           └──────────┘
                                                          ▼
                                                    ┌─────────────┐
                                                    │ LLM Service │
                                                    └─────────────┘
```

## Core Components

The backend is organized into several core components, each with specific responsibilities and interfaces.

### Express Application

The Express application (`app.ts`) serves as the entry point for the backend. It configures middleware, routes, and error handling. Key features include:

- Security middleware configuration (helmet, cors, rate limiting)
- Request parsing and logging
- Database connection management
- API route registration
- Global error handling
- Health check endpoint

```typescript
// Simplified app.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { connectToDatabase } from './database';
import { errorHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';
import chatRoutes from './routes/chat.routes';
import userRoutes from './routes/user.routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Routes
app.use('/api/authz', authRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/user', userRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  await connectToDatabase();
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer().catch(console.error);
```

### Authentication Service

The Authentication Service (`auth.service.ts`) handles user identity management and access control. Key features include:

- User registration with email and password
- Secure password hashing using bcrypt
- JWT token generation and validation
- Login and authentication verification
- Token-based session management

```typescript
// Simplified auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { AuthenticationError } from '../errors/authentication.error';

export class AuthService {
  constructor(private userRepository: UserRepository) {}

  async signup(email: string, password: string) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AuthenticationError('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userRepository.create({
      email,
      password: hashedPassword,
    });

    const token = this.generateToken(user._id);
    return { token, user: { _id: user._id, email: user.email } };
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    const token = this.generateToken(user._id);
    return { token, user: { _id: user._id, email: user.email } };
  }

  private generateToken(userId: string) {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, {
      expiresIn: '1h',
    });
  }

  verifyToken(token: string) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    } catch (error) {
      throw new AuthenticationError('Invalid token');
    }
  }
}
```

### Health Data Service

The Health Data Service (`health.service.ts`) manages user health information. Key features include:

- Creation and storage of health records (meals, lab results, symptoms)
- Retrieval and filtering of health data
- Integration with File Service for handling uploaded images and voice recordings
- Health context generation for LLM interactions
- Data validation and sanitization

```typescript
// Simplified health.service.ts
import { HealthRepository } from '../repositories/health.repository';
import { FileService } from './file.service';
import { HealthDataType, HealthData } from '../models/health-data.model';
import { NotFoundError } from '../errors/not-found.error';

export class HealthService {
  constructor(
    private healthRepository: HealthRepository,
    private fileService: FileService
  ) {}

  async addHealthData(
    userId: string,
    type: HealthDataType,
    data: any,
    files?: Express.Multer.File[]
  ) {
    let fileIds: string[] = [];
    
    if (files && files.length > 0) {
      fileIds = await Promise.all(
        files.map(file => this.fileService.storeFile(file))
      );
    }

    const healthData: Partial<HealthData> = {
      userId,
      type,
      timestamp: new Date(),
      data,
      fileIds,
      metadata: {
        source: files?.length ? 'photo' : 'text',
      },
    };

    return this.healthRepository.create(healthData);
  }

  async getHealthData(userId: string, query: any = {}) {
    const { date, search, page = 1, limit = 20 } = query;
    const filter: any = { userId };

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.timestamp = { $gte: startDate, $lte: endDate };
    }

    if (search) {
      filter.$or = [
        { 'data.description': { $regex: search, $options: 'i' } },
        { 'metadata.tags': { $regex: search, $options: 'i' } },
      ];
    }

    const items = await this.healthRepository.find(filter, page, limit);
    const total = await this.healthRepository.count(filter);

    // Enhance items with file URLs if needed
    const enhancedItems = await Promise.all(
      items.map(async item => {
        if (item.fileIds?.length) {
          const fileUrls = await Promise.all(
            item.fileIds.map(fileId => this.fileService.getFileUrl(fileId))
          );
          return { ...item, fileUrls };
        }
        return item;
      })
    );

    return {
      items: enhancedItems,
      total,
      page: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    };
  }

  async getHealthDataById(userId: string, id: string) {
    const healthData = await this.healthRepository.findById(id);
    
    if (!healthData || healthData.userId !== userId) {
      throw new NotFoundError('Health data not found');
    }

    // Enhance with file URLs if needed
    if (healthData.fileIds?.length) {
      const fileUrls = await Promise.all(
        healthData.fileIds.map(fileId => this.fileService.getFileUrl(fileId))
      );
      return { ...healthData, fileUrls };
    }

    return healthData;
  }

  async deleteHealthData(userId: string, id: string) {
    const healthData = await this.healthRepository.findById(id);
    
    if (!healthData || healthData.userId !== userId) {
      throw new NotFoundError('Health data not found');
    }

    // Delete associated files
    if (healthData.fileIds?.length) {
      await Promise.all(
        healthData.fileIds.map(fileId => this.fileService.deleteFile(fileId))
      );
    }

    return this.healthRepository.deleteById(id);
  }

  async getUserHealthContext(userId: string, limit = 10) {
    // Get recent health data for context
    const recentData = await this.healthRepository.find(
      { userId },
      1,
      limit,
      { timestamp: -1 }
    );

    // Format data for LLM context
    return recentData.map(data => ({
      type: data.type,
      timestamp: data.timestamp,
      description: data.data.description || '',
      // Include other relevant fields based on type
    }));
  }
}
```

### Chat Service

The Chat Service (`chat.service.ts`) handles LLM-powered conversations. Key features include:

- User message processing and storage
- Conversation history management
- Integration with Health Data Service for context enrichment
- LLM request handling and response processing
- Error handling and fallback mechanisms

```typescript
// Simplified chat.service.ts
import { ChatRepository } from '../repositories/chat.repository';
import { LLMService } from './llm.service';
import { HealthService } from './health.service';
import { ServiceUnavailableError } from '../errors/service-unavailable.error';

export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private llmService: LLMService,
    private healthService: HealthService
  ) {}

  async sendMessage(userId: string, message: string, conversationId?: string) {
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.chatRepository.findConversationById(conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found');
      }
    } else {
      conversation = await this.chatRepository.createConversation(userId);
      conversationId = conversation._id;
    }

    // Store user message
    await this.chatRepository.addMessage({
      conversationId,
      userId,
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    try {
      // Get user health context
      const healthContext = await this.healthService.getUserHealthContext(userId);
      
      // Send to LLM service
      const llmResponse = await this.llmService.generateResponse(
        message,
        healthContext,
        conversationId
      );

      // Store LLM response
      await this.chatRepository.addMessage({
        conversationId,
        userId,
        role: 'assistant',
        content: llmResponse,
        timestamp: new Date(),
      });

      // Update conversation lastMessageAt
      await this.chatRepository.updateConversation(conversationId, {
        lastMessageAt: new Date(),
      });

      return {
        response: llmResponse,
        conversationId,
      };
    } catch (error) {
      // Handle LLM service failure
      const fallbackResponse = 'I apologize, but I'm unable to process your request at the moment. Please try again later.';
      
      // Store fallback response
      await this.chatRepository.addMessage({
        conversationId,
        userId,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        metadata: { fallback: true },
      });

      throw new ServiceUnavailableError('LLM service unavailable');
    }
  }

  async getChatHistory(userId: string, query: any = {}) {
    const { conversationId, page = 1, limit = 20 } = query;
    
    if (conversationId) {
      const conversation = await this.chatRepository.findConversationById(conversationId);
      if (!conversation || conversation.userId !== userId) {
        throw new Error('Conversation not found');
      }

      const messages = await this.chatRepository.getMessages(
        conversationId,
        page,
        limit
      );
      const total = await this.chatRepository.countMessages(conversationId);

      return {
        messages,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      };
    } else {
      const conversations = await this.chatRepository.findConversations(
        userId,
        page,
        limit,
        { lastMessageAt: -1 }
      );
      const total = await this.chatRepository.countConversations(userId);

      return {
        conversations,
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      };
    }
  }
}
```

### File Service

The File Service (`file.service.ts`) manages user-uploaded files. Key features include:

- File upload and storage using GridFS
- Image processing and optimization
- Thumbnail generation
- File retrieval and streaming
- File type validation and security checks

```typescript
// Simplified file.service.ts
import { GridFSBucket, ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { BadRequestError } from '../errors/bad-request.error';
import { NotFoundError } from '../errors/not-found.error';
import sharp from 'sharp';

export class FileService {
  private bucket: GridFSBucket;

  constructor() {
    const db = getDatabase();
    this.bucket = new GridFSBucket(db, { bucketName: 'files' });
  }

  async storeFile(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestError('No file provided');
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'audio/wav'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError('Unsupported file type');
    }

    // Process image files
    let fileBuffer = file.buffer;
    let contentType = file.mimetype;

    if (file.mimetype.startsWith('image/')) {
      // Optimize image
      fileBuffer = await sharp(file.buffer)
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      contentType = 'image/jpeg';
    }

    // Store file in GridFS
    const uploadStream = this.bucket.openUploadStream(file.originalname, {
      contentType,
      metadata: {
        originalName: file.originalname,
        size: fileBuffer.length,
        uploadDate: new Date(),
      },
    });

    return new Promise((resolve, reject) => {
      uploadStream.once('finish', function() {
        resolve(uploadStream.id.toString());
      });

      uploadStream.once('error', function(error) {
        reject(error);
      });

      uploadStream.end(fileBuffer);
    });
  }

  async getFile(fileId: string) {
    try {
      const _id = new ObjectId(fileId);
      const file = await this.bucket.find({ _id }).toArray();
      
      if (!file || file.length === 0) {
        throw new NotFoundError('File not found');
      }
      
      return {
        stream: this.bucket.openDownloadStream(_id),
        file: file[0],
      };
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new BadRequestError('Invalid file ID');
    }
  }

  async getFileUrl(fileId: string): Promise<string> {
    // In a real implementation, this might generate a signed URL or a route to the file
    return `/api/files/${fileId}`;
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      const _id = new ObjectId(fileId);
      await this.bucket.delete(_id);
    } catch (error) {
      throw new BadRequestError('Failed to delete file');
    }
  }

  async generateThumbnail(fileId: string): Promise<string> {
    const { stream, file } = await this.getFile(fileId);
    
    if (!file.contentType.startsWith('image/')) {
      throw new BadRequestError('Not an image file');
    }

    // Collect file data
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Generate thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toBuffer();

    // Store thumbnail in GridFS
    const uploadStream = this.bucket.openUploadStream(`thumbnail_${file.filename}`, {
      contentType: 'image/jpeg',
      metadata: {
        originalFileId: fileId,
        type: 'thumbnail',
        uploadDate: new Date(),
      },
    });

    return new Promise((resolve, reject) => {
      uploadStream.once('finish', function() {
        resolve(uploadStream.id.toString());
      });

      uploadStream.once('error', function(error) {
        reject(error);
      });

      uploadStream.end(thumbnailBuffer);
    });
  }
}
```

### LLM Service

The LLM Service (`llm.service.ts`) handles interactions with the Large Language Model provider. Key features include:

- Context building from user health data
- Prompt construction and optimization
- LLM request handling with retry logic
- Response processing and safety filtering
- Fallback mechanisms for service unavailability

```typescript
// Simplified llm.service.ts
import axios from 'axios';
import { ChatRepository } from '../repositories/chat.repository';
import { ServiceUnavailableError } from '../errors/service-unavailable.error';
import { logger } from '../utils/logger';

export class LLMService {
  private apiKey: string;
  private apiUrl: string;
  private maxRetries: number = 3;

  constructor(private chatRepository: ChatRepository) {
    this.apiKey = process.env.LLM_API_KEY!;
    this.apiUrl = process.env.LLM_API_URL!;
  }

  async generateResponse(
    userMessage: string,
    healthContext: any[],
    conversationId?: string
  ): Promise<string> {
    // Get recent conversation history
    let conversationHistory: { role: string; content: string }[] = [];
    
    if (conversationId) {
      const messages = await this.chatRepository.getMessages(conversationId, 1, 5);
      conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
    }

    // Prepare prompt with context
    const systemPrompt = this.buildSystemPrompt(healthContext);
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ];

    // Send request to LLM provider with retry logic
    let attempts = 0;
    let lastError;

    while (attempts < this.maxRetries) {
      try {
        const response = await axios.post(
          this.apiUrl,
          {
            model: 'gpt-4',
            messages,
            temperature: 0.7,
            max_tokens: 500,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${this.apiKey}`,
            },
            timeout: 10000, // 10 seconds
          }
        );

        const llmResponse = response.data.choices[0].message.content;
        return this.processResponse(llmResponse);
      } catch (error) {
        attempts++;
        lastError = error;
        
        if (attempts < this.maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempts) * 500;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        logger.error('LLM request failed', {
          attempt: attempts,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // All retries failed
    throw new ServiceUnavailableError(
      'Failed to get response from LLM service',
      lastError
    );
  }

  private buildSystemPrompt(healthContext: any[]): string {
    // Format health context
    const formattedContext = healthContext
      .map(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        return `${date} - ${item.type}: ${item.description}`;
      })
      .join('\n');

    return `You are a health advisor assistant that provides personalized health guidance.
You have access to the user's health data, which you should reference when appropriate.
Do not diagnose medical conditions or prescribe treatments.
Always include a disclaimer that you are an AI and not a medical professional.
Use the following health context to personalize your responses:

${formattedContext}`;
  }

  private processResponse(response: string): string {
    // Add safety filters and processing logic here
    return response;
  }
}
```

## Data Layer

The data layer handles persistence and retrieval of application data using MongoDB.

### Database Configuration

MongoDB is used as the primary database, with the following configuration:

- Connection pooling for efficient resource utilization
- Retry logic for connection failures
- Graceful disconnection during shutdown
- Health check functionality
- Environment-specific configuration

```typescript
// Simplified database.ts
import { MongoClient, Db } from 'mongodb';
import { logger } from './utils/logger';

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI!;
  const dbName = process.env.DB_NAME || 'healthAdvisor';
  
  try {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 5,
      connectTimeoutMS: 5000,
      serverSelectionTimeoutMS: 5000,
    });
    
    await client.connect();
    db = client.db(dbName);
    
    logger.info('Connected to MongoDB');
    
    // Ensure indexes
    await setupIndexes(db);
  } catch (error) {
    logger.error('Failed to connect to MongoDB', error);
    throw error;
  }
}

async function setupIndexes(db: Db): Promise<void> {
  // User collection indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  
  // Health data indexes
  await db.collection('healthData').createIndex({ userId: 1 });
  await db.collection('healthData').createIndex({ userId: 1, timestamp: -1 });
  await db.collection('healthData').createIndex({ userId: 1, type: 1 });
  
  // Chat indexes
  await db.collection('chatConversations').createIndex({ userId: 1 });
  await db.collection('chatConversations').createIndex({ userId: 1, lastMessageAt: -1 });
  await db.collection('chatMessages').createIndex({ conversationId: 1 });
  await db.collection('chatMessages').createIndex({ conversationId: 1, timestamp: 1 });
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
}

// Health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!db) return false;
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}
```

### Data Models

The application uses the following main data models:

#### User Model

```typescript
// models/user.model.ts
import { ObjectId } from 'mongodb';

export interface User {
  _id: string | ObjectId;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Health Data Model

```typescript
// models/health-data.model.ts
import { ObjectId } from 'mongodb';

export type HealthDataType = 'meal' | 'labResult' | 'symptom';

export interface HealthData {
  _id: string | ObjectId;
  userId: string | ObjectId;
  type: HealthDataType;
  timestamp: Date;
  data: {
    description?: string;
    mealType?: string;
    testType?: string;
    results?: any;
    severity?: 'mild' | 'moderate' | 'severe';
    duration?: string;
    [key: string]: any;
  };
  fileIds: string[];
  metadata: {
    source: 'photo' | 'voice' | 'text';
    tags?: string[];
    location?: {
      latitude: number;
      longitude: number;
    };
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
```

#### Chat Models

```typescript
// models/chat.model.ts
import { ObjectId } from 'mongodb';

export interface ChatConversation {
  _id: string | ObjectId;
  userId: string | ObjectId;
  title: string;
  startedAt: Date;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  _id: string | ObjectId;
  conversationId: string | ObjectId;
  userId: string | ObjectId;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    fallback?: boolean;
    [key: string]: any;
  };
  createdAt: Date;
}
```

### Repository Pattern

The application implements the repository pattern to abstract data access logic:

#### User Repository

```typescript
// repositories/user.repository.ts
import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { User } from '../models/user.model';

export class UserRepository {
  private collection: Collection<User>;

  constructor() {
    this.collection = getDatabase().collection<User>('users');
  }

  async create(userData: Partial<User>): Promise<User> {
    const now = new Date();
    const newUser = {
      ...userData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(newUser as User);
    return {
      ...newUser,
      _id: result.insertedId,
    } as User;
  }

  async findById(id: string): Promise<User | null> {
    const _id = new ObjectId(id);
    return this.collection.findOne({ _id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.collection.findOne({ email });
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const _id = new ObjectId(id);
    const updatedData = {
      ...userData,
      updatedAt: new Date(),
    };

    await this.collection.updateOne(
      { _id },
      { $set: updatedData }
    );

    return this.findById(id);
  }

  async deleteById(id: string): Promise<boolean> {
    const _id = new ObjectId(id);
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount === 1;
  }
}
```

#### Health Repository

```typescript
// repositories/health.repository.ts
import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { HealthData } from '../models/health-data.model';

export class HealthRepository {
  private collection: Collection<HealthData>;

  constructor() {
    this.collection = getDatabase().collection<HealthData>('healthData');
  }

  async create(healthData: Partial<HealthData>): Promise<HealthData> {
    const now = new Date();
    const newHealthData = {
      ...healthData,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.collection.insertOne(newHealthData as HealthData);
    return {
      ...newHealthData,
      _id: result.insertedId,
    } as HealthData;
  }

  async findById(id: string): Promise<HealthData | null> {
    const _id = new ObjectId(id);
    return this.collection.findOne({ _id });
  }

  async find(
    filter: any,
    page: number = 1,
    limit: number = 20,
    sort: any = { timestamp: -1 }
  ): Promise<HealthData[]> {
    const skip = (page - 1) * limit;
    
    return this.collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async count(filter: any): Promise<number> {
    return this.collection.countDocuments(filter);
  }

  async update(id: string, healthData: Partial<HealthData>): Promise<HealthData | null> {
    const _id = new ObjectId(id);
    const updatedData = {
      ...healthData,
      updatedAt: new Date(),
    };

    await this.collection.updateOne(
      { _id },
      { $set: updatedData }
    );

    return this.findById(id);
  }

  async deleteById(id: string): Promise<boolean> {
    const _id = new ObjectId(id);
    const result = await this.collection.deleteOne({ _id });
    return result.deletedCount === 1;
  }
}
```

#### Chat Repository

```typescript
// repositories/chat.repository.ts
import { Collection, ObjectId } from 'mongodb';
import { getDatabase } from '../database';
import { ChatConversation, ChatMessage } from '../models/chat.model';

export class ChatRepository {
  private conversationsCollection: Collection<ChatConversation>;
  private messagesCollection: Collection<ChatMessage>;

  constructor() {
    const db = getDatabase();
    this.conversationsCollection = db.collection<ChatConversation>('chatConversations');
    this.messagesCollection = db.collection<ChatMessage>('chatMessages');
  }

  async createConversation(userId: string): Promise<ChatConversation> {
    const now = new Date();
    const newConversation: Partial<ChatConversation> = {
      userId: new ObjectId(userId),
      title: 'New Conversation',
      startedAt: now,
      lastMessageAt: now,
      createdAt: now,
      updatedAt: now,
    };

    const result = await this.conversationsCollection.insertOne(
      newConversation as ChatConversation
    );
    
    return {
      ...newConversation,
      _id: result.insertedId,
    } as ChatConversation;
  }

  async findConversationById(id: string): Promise<ChatConversation | null> {
    const _id = new ObjectId(id);
    return this.conversationsCollection.findOne({ _id });
  }

  async findConversations(
    userId: string,
    page: number = 1,
    limit: number = 20,
    sort: any = { lastMessageAt: -1 }
  ): Promise<ChatConversation[]> {
    const skip = (page - 1) * limit;
    
    return this.conversationsCollection
      .find({ userId: new ObjectId(userId) })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async countConversations(userId: string): Promise<number> {
    return this.conversationsCollection.countDocuments({
      userId: new ObjectId(userId),
    });
  }

  async updateConversation(
    id: string,
    data: Partial<ChatConversation>
  ): Promise<ChatConversation | null> {
    const _id = new ObjectId(id);
    const updatedData = {
      ...data,
      updatedAt: new Date(),
    };

    await this.conversationsCollection.updateOne(
      { _id },
      { $set: updatedData }
    );

    return this.findConversationById(id);
  }

  async addMessage(message: Partial<ChatMessage>): Promise<ChatMessage> {
    const now = new Date();
    const newMessage: Partial<ChatMessage> = {
      ...message,
      createdAt: now,
    };

    const result = await this.messagesCollection.insertOne(
      newMessage as ChatMessage
    );
    
    return {
      ...newMessage,
      _id: result.insertedId,
    } as ChatMessage;
  }

  async getMessages(
    conversationId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<ChatMessage[]> {
    const skip = (page - 1) * limit;
    
    return this.messagesCollection
      .find({ conversationId: new ObjectId(conversationId) })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  async countMessages(conversationId: string): Promise<number> {
    return this.messagesCollection.countDocuments({
      conversationId: new ObjectId(conversationId),
    });
  }

  async deleteConversation(id: string): Promise<boolean> {
    const _id = new ObjectId(id);
    
    // Delete all messages
    await this.messagesCollection.deleteMany({
      conversationId: _id,
    });
    
    // Delete conversation
    const result = await this.conversationsCollection.deleteOne({ _id });
    return result.deletedCount === 1;
  }
}
```

### GridFS for File Storage

GridFS is used for storing user-uploaded files (images, voice recordings) with the following benefits:

- Efficient storage of large files
- Chunked retrieval for streaming
- Metadata storage alongside file chunks
- Integration with MongoDB for consistent data management

The FileRepository is abstracted in the FileService implementation shown earlier.

## API Layer

The API layer exposes the application functionality through RESTful endpoints.

### Route Organization

API routes are organized by domain:

#### Authentication Routes

```typescript
// routes/auth.routes.ts
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authValidation } from '../validations/auth.validation';

const router = Router();
const authController = new AuthController();

router.post(
  '/signup',
  validate(authValidation.signup),
  authController.signup
);

router.post(
  '/login',
  validate(authValidation.login),
  authController.login
);

router.post(
  '/refresh',
  validate(authValidation.refresh),
  authController.refresh
);

export default router;
```

#### Health Data Routes

```typescript
// routes/health.routes.ts
import { Router } from 'express';
import { HealthController } from '../controllers/health.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { uploadFile } from '../middleware/file.middleware';
import { healthValidation } from '../validations/health.validation';

const router = Router();
const healthController = new HealthController();

router.post(
  '/',
  authenticate,
  uploadFile,
  validate(healthValidation.create),
  healthController.createHealthData
);

router.get(
  '/',
  authenticate,
  validate(healthValidation.getAll),
  healthController.getHealthData
);

router.get(
  '/:id',
  authenticate,
  validate(healthValidation.getById),
  healthController.getHealthDataById
);

router.delete(
  '/:id',
  authenticate,
  validate(healthValidation.delete),
  healthController.deleteHealthData
);

export default router;
```

#### Chat Routes

```typescript
// routes/chat.routes.ts
import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { chatValidation } from '../validations/chat.validation';

const router = Router();
const chatController = new ChatController();

router.post(
  '/',
  authenticate,
  validate(chatValidation.sendMessage),
  chatController.sendMessage
);

router.get(
  '/',
  authenticate,
  validate(chatValidation.getHistory),
  chatController.getChatHistory
);

export default router;
```

#### User Routes

```typescript
// routes/user.routes.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
const userController = new UserController();

router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

export default router;
```

### Controller Pattern

Controllers handle HTTP request processing and response formatting:

#### Auth Controller

```typescript
// controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { catchAsync } from '../utils/catch-async';

export class AuthController {
  private authService: AuthService;

  constructor() {
    const userRepository = new UserRepository();
    this.authService = new AuthService(userRepository);
  }

  signup = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this.authService.signup(email, password);
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  });

  login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await this.authService.login(email, password);
    
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  refresh = catchAsync(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const token = await this.authService.refreshToken(refreshToken);
    
    res.status(200).json({
      status: 'success',
      data: { token },
    });
  });
}
```

#### Health Controller

```typescript
// controllers/health.controller.ts
import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/health.service';
import { HealthRepository } from '../repositories/health.repository';
import { FileService } from '../services/file.service';
import { catchAsync } from '../utils/catch-async';
import { AuthRequest } from '../types/auth-request';

export class HealthController {
  private healthService: HealthService;

  constructor() {
    const healthRepository = new HealthRepository();
    const fileService = new FileService();
    this.healthService = new HealthService(healthRepository, fileService);
  }

  createHealthData = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { type, data } = req.body;
    const files = req.files as Express.Multer.File[];
    
    const result = await this.healthService.addHealthData(userId, type, data, files);
    
    res.status(201).json({
      status: 'success',
      data: result,
    });
  });

  getHealthData = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const result = await this.healthService.getHealthData(userId, req.query);
    
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getHealthDataById = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    const result = await this.healthService.getHealthDataById(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  deleteHealthData = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    
    await this.healthService.deleteHealthData(userId, id);
    
    res.status(200).json({
      status: 'success',
      data: null,
    });
  });
}
```

#### Chat Controller

```typescript
// controllers/chat.controller.ts
import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { ChatRepository } from '../repositories/chat.repository';
import { LLMService } from '../services/llm.service';
import { HealthService } from '../services/health.service';
import { HealthRepository } from '../repositories/health.repository';
import { FileService } from '../services/file.service';
import { catchAsync } from '../utils/catch-async';
import { AuthRequest } from '../types/auth-request';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    const chatRepository = new ChatRepository();
    const healthRepository = new HealthRepository();
    const fileService = new FileService();
    const healthService = new HealthService(healthRepository, fileService);
    const llmService = new LLMService(chatRepository);
    
    this.chatService = new ChatService(chatRepository, llmService, healthService);
  }

  sendMessage = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { message, conversationId } = req.body;
    
    const result = await this.chatService.sendMessage(userId, message, conversationId);
    
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getChatHistory = catchAsync(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    
    const result = await this.chatService.getChatHistory(userId, req.query);
    
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
}
```

### Request Validation

Request validation is implemented using Joi schemas:

```typescript
// validations/auth.validation.ts
import Joi from 'joi';

export const authValidation = {
  signup: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
  
  refresh: Joi.object({
    refreshToken: Joi.string().required(),
  }),
};
```

```typescript
// validations/health.validation.ts
import Joi from 'joi';

export const healthValidation = {
  create: Joi.object({
    type: Joi.string().valid('meal', 'labResult', 'symptom').required(),
    data: Joi.object().required(),
  }),
  
  getAll: Joi.object({
    date: Joi.date().iso(),
    search: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
  
  getById: Joi.object({
    id: Joi.string().required(),
  }),
  
  delete: Joi.object({
    id: Joi.string().required(),
  }),
};
```

```typescript
// validations/chat.validation.ts
import Joi from 'joi';

export const chatValidation = {
  sendMessage: Joi.object({
    message: Joi.string().required().max(1000),
    conversationId: Joi.string(),
  }),
  
  getHistory: Joi.object({
    conversationId: Joi.string(),
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1).max(100),
  }),
};
```

### Response Formatting

Responses follow a consistent format:

```typescript
// Example success response
{
  "status": "success",
  "data": {
    // Response data
  },
  "meta": {
    // Optional metadata (pagination, etc.)
  }
}

// Example error response
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

## Middleware

Middleware components handle cross-cutting concerns in the request processing pipeline.

### Authentication Middleware

The authentication middleware (`auth.middleware.ts`) verifies user identity:

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthenticationError } from '../errors/authentication.error';
import { AuthRequest } from '../types/auth-request';

const userRepository = new UserRepository();
const authService = new AuthService(userRepository);

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Authentication required');
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      throw new AuthenticationError('Authentication required');
    }
    
    const decoded = authService.verifyToken(token);
    
    // Attach user info to request
    (req as AuthRequest).user = decoded;
    
    next();
  } catch (error) {
    next(new AuthenticationError('Invalid or expired token'));
  }
}

export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      
      if (token) {
        const decoded = authService.verifyToken(token);
        (req as AuthRequest).user = decoded;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}
```

### Error Handling Middleware

The error handling middleware (`error.middleware.ts`) provides centralized error processing:

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app.error';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Default error
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong';
  let details = undefined;

  // Handle operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
    details = err.details;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = Object.values((err as any).errors).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'EXPIRED_TOKEN';
    message = 'Token expired';
  }

  // Production vs development error response
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(statusCode).json({
    status: 'error',
    error: {
      code: errorCode,
      message,
      details,
      ...(isProduction ? {} : { stack: err.stack }),
    },
  });
}
```

### File Handling Middleware

The file handling middleware (`file.middleware.ts`) processes file uploads:

```typescript
// middleware/file.middleware.ts
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../errors/bad-request.error';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept images and audio files
  if (
    file.mimetype.startsWith('image/') ||
    file.mimetype.startsWith('audio/')
  ) {
    cb(null, true);
  } else {
    cb(new BadRequestError('Unsupported file type'));
  }
};

// Create multer upload instance
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Middleware function
export const uploadFile = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Use multer to process files
  upload.array('files', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new BadRequestError('File too large (max 10MB)'));
      }
      return next(new BadRequestError(err.message));
    } else if (err) {
      return next(err);
    }
    next();
  });
};
```

### Rate Limiting Middleware

The rate limiting middleware (`rate-limit.middleware.ts`) prevents abuse:

```typescript
// middleware/rate-limit.middleware.ts
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth-request';

// Helper to get client identifier (IP or userId if authenticated)
const getClientIdentifier = (req: Request): string => {
  const user = (req as AuthRequest).user;
  const userId = user?.userId;
  
  // Use userId if authenticated, otherwise use IP
  return userId || (req.ip || 'unknown-ip');
};

// Create different rate limiters
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs per identifier
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  keyGenerator: getClientIdentifier,
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per identifier
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  keyGenerator: getClientIdentifier,
});

export const chatRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 chat requests per minute per identifier
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many chat requests, please try again later',
    },
  },
  keyGenerator: getClientIdentifier,
});
```

### Validation Middleware

The validation middleware (`validation.middleware.ts`) ensures request data integrity:

```typescript
// middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../errors/validation.error';

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Validate request against schema
    const { error, value } = schema.validate(
      {
        ...req.body,
        ...req.params,
        ...req.query,
      },
      { abortEarly: false, stripUnknown: true }
    );

    if (error) {
      // Format validation errors
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ValidationError('Validation failed', details));
    }

    // Update request with validated data
    req.body = value;
    next();
  };
};
```

## Security

Security is a critical aspect of the Health Advisor backend, especially given the sensitive nature of health data.

### Authentication and Authorization

The system implements JWT-based authentication:

- **Secure password hashing**: Passwords are hashed using bcrypt with appropriate salt rounds.
- **JWT tokens**: Authentication tokens with appropriate expiration times.
- **User-specific resource access**: All data access is filtered by user ID to ensure users can only access their own data.
- **Token validation middleware**: Middleware to verify and validate tokens for protected routes.

### Data Protection

Health data is protected through multiple mechanisms:

- **HTTPS for all communications**: All API requests and responses are encrypted in transit.
- **Input validation and sanitization**: All user inputs are validated and sanitized to prevent injection attacks.
- **MongoDB query sanitization**: All database queries are parameterized to prevent NoSQL injection.
- **User-based data isolation**: Data access is strictly controlled by user ID to prevent unauthorized access.

### API Security

API endpoints are secured using:

- **Helmet for security headers**: Sets appropriate HTTP headers to enhance security.
- **CORS configuration**: Restricts cross-origin requests to allowed origins.
- **Rate limiting**: Prevents abuse by limiting request frequency.
- **Request validation**: Validates all input data to prevent injection attacks.

### Error Handling

Secure error handling practices include:

- **Sanitized error messages in production**: Detailed error information is only provided in development environments.
- **Detailed internal logging**: Comprehensive error logging for debugging while keeping sensitive information out of responses.
- **Appropriate HTTP status codes**: Correct status codes help clients understand the nature of errors.
- **No sensitive information in responses**: Error responses never include sensitive data like passwords or tokens.

## Error Handling

The backend implements a comprehensive error handling strategy to ensure reliability and provide meaningful feedback.

### Error Types

The system defines several error types:

```typescript
// errors/app.error.ts - Base error class
export class AppError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// errors/validation.error.ts
import { AppError } from './app.error';

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

// errors/authentication.error.ts
import { AppError } from './app.error';

export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// errors/not-found.error.ts
import { AppError } from './app.error';

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

// errors/bad-request.error.ts
import { AppError } from './app.error';

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'BAD_REQUEST_ERROR', details);
  }
}

// errors/service-unavailable.error.ts
import { AppError } from './app.error';

export class ServiceUnavailableError extends AppError {
  constructor(message: string, originalError?: any) {
    super(message, 503, 'SERVICE_UNAVAILABLE', originalError);
  }
}
```

### Error Middleware

The error middleware provides centralized error handling as shown in the Middleware section above.

### Global Error Handlers

Global handlers catch unhandled errors:

```typescript
// utils/uncaught-exceptions.ts
import { logger } from './logger';

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', {
    message: err.message,
    stack: err.stack,
  });
  
  // Log the error and exit the process
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', {
    message: err.message,
    stack: err.stack,
  });
  
  // Exit gracefully
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully');
  
  server.close(() => {
    logger.info('Process terminated');
  });
});
```

### Service-Specific Error Handling

Each service implements domain-specific error handling:

- **LLM service**: Implements retry logic with exponential backoff and fallback responses when the LLM provider is unavailable.
- **File service**: Handles upload failures and provides appropriate error messages.
- **Database operations**: Implements connection error handling and retry logic.
- **External service integration**: Manages timeouts and service failures with appropriate fallback mechanisms.

## Logging

The backend implements structured logging for monitoring, debugging, and auditing.

### Logging Configuration

The logging system (`logger.ts`) provides:

```typescript
// utils/logger.ts
import winston from 'winston';

const { createLogger, format, transports } = winston;
const { combine, timestamp, json, colorize, printf } = format;

// Custom format for development
const devFormat = printf(({ level, message, timestamp, ...meta }) => {
  return `${timestamp} [${level}]: ${message} ${
    Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
  }`;
});

// Create logger instance
export const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    process.env.NODE_ENV === 'development'
      ? combine(colorize(), devFormat)
      : json()
  ),
  defaultMeta: { service: 'health-advisor-backend' },
  transports: [
    // Console transport for all environments
    new transports.Console(),
    
    // File transport for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new transports.File({ filename: 'logs/error.log', level: 'error' }),
          new transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
});

// Add request ID to log context
export const addRequestId = (requestId: string) => {
  return logger.child({ requestId });
};
```

### Log Categories

The system logs several categories of information:

- **Request/response logging**: HTTP method, path, status code, and duration.
- **Error logging**: Detailed error information including stack traces for debugging.
- **Authentication events**: Login attempts, token validation, and authentication failures.
- **Database operations**: Query performance, connection events, and data operations.
- **External service interactions**: LLM requests, file operations, and third-party service calls.
- **System events**: Application startup, shutdown, and configuration changes.

### Sensitive Data Handling

The logging system protects sensitive information:

```typescript
// utils/sanitize-logs.ts
import { cloneDeep } from 'lodash';

// Fields that should be redacted in logs
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'authorization',
  'apiKey',
  'creditCard',
  'ssn',
];

// Function to sanitize sensitive data
export function sanitizeLogs(data: any): any {
  if (!data) return data;
  
  // Handle non-objects
  if (typeof data !== 'object') return data;
  
  // Clone to avoid mutating original
  const sanitized = cloneDeep(data);
  
  // Handle arrays
  if (Array.isArray(sanitized)) {
    return sanitized.map(item => sanitizeLogs(item));
  }
  
  // Recursively sanitize object
  Object.keys(sanitized).forEach(key => {
    // Check if key is sensitive
    if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeLogs(sanitized[key]);
    }
  });
  
  return sanitized;
}
```

## Configuration Management

The backend uses a flexible configuration system to support different environments and deployment scenarios.

### Environment Variables

Configuration is primarily managed through environment variables:

```
# Server
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/healthAdvisor
DB_NAME=healthAdvisor

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# LLM Service
LLM_API_KEY=your_llm_api_key
LLM_API_URL=https://api.openai.com/v1/chat/completions

# Logging
LOG_LEVEL=info

# Features
ENABLE_RATE_LIMITING=true
ENABLE_FILE_OPTIMIZATION=true
```

### Configuration Module

The configuration module (`config/index.ts`) provides:

```typescript
// config/index.ts
import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';

// Load environment-specific .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Schema for environment variables
const envSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid('development', 'production', 'test')
      .default('development'),
    PORT: Joi.number().default(3000),
    MONGODB_URI: Joi.string().required(),
    DB_NAME: Joi.string().default('healthAdvisor'),
    JWT_SECRET: Joi.string().required(),
    JWT_EXPIRES_IN: Joi.string().default('1h'),
    REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
    LLM_API_KEY: Joi.string().required(),
    LLM_API_URL: Joi.string().required(),
    LOG_LEVEL: Joi.string()
      .valid('error', 'warn', 'info', 'http', 'debug')
      .default('info'),
    ENABLE_RATE_LIMITING: Joi.boolean().default(true),
    ENABLE_FILE_OPTIMIZATION: Joi.boolean().default(true),
  })
  .unknown();

// Validate environment variables
const { value: envVars, error } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

// Export configuration
export default {
  env: envVars.NODE_ENV,
  isProduction: envVars.NODE_ENV === 'production',
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test',
  port: envVars.PORT,
  mongo: {
    uri: envVars.MONGODB_URI,
    dbName: envVars.DB_NAME,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  },
  llm: {
    apiKey: envVars.LLM_API_KEY,
    apiUrl: envVars.LLM_API_URL,
  },
  logging: {
    level: envVars.LOG_LEVEL,
  },
  features: {
    rateLimiting: envVars.ENABLE_RATE_LIMITING,
    fileOptimization: envVars.ENABLE_FILE_OPTIMIZATION,
  },
};
```

### Feature Flags

The system supports feature flags for controlled rollout:

```typescript
// utils/feature-flags.ts
import config from '../config';

// Feature flag definitions
const features = {
  rateLimiting: {
    enabled: config.features.rateLimiting,
    description: 'Rate limiting for API endpoints',
  },
  fileOptimization: {
    enabled: config.features.fileOptimization,
    description: 'Image optimization for uploaded files',
  },
  // Add more features as needed
};

// Check if a feature is enabled
export function isFeatureEnabled(featureName: keyof typeof features): boolean {
  return features[featureName]?.enabled ?? false;
}

// Get all features and their status
export function getAllFeatures() {
  return features;
}
```

## Testing Strategy

The backend implements a comprehensive testing strategy to ensure reliability and correctness.

### Unit Testing

Unit tests focus on individual components:

```typescript
// Example service unit test
import { describe, it, expect, jest } from '@jest/globals';
import { AuthService } from '../services/auth.service';
import { UserRepository } from '../repositories/user.repository';
import { AuthenticationError } from '../errors/authentication.error';

// Mock dependencies
jest.mock('../repositories/user.repository');

describe('AuthService', () => {
  let authService: AuthService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    userRepository = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService(userRepository);
  });

  describe('signup', () => {
    it('should create a new user and return token', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({
        _id: 'user123',
        email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act
      const result = await authService.signup(email, password);

      // Assert
      expect(userRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(userRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('user');
      expect(result.user).toHaveProperty('_id', 'user123');
      expect(result.user).toHaveProperty('email', email);
    });

    it('should throw error if user already exists', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      userRepository.findByEmail.mockResolvedValue({
        _id: 'user123',
        email,
        password: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Act & Assert
      await expect(authService.signup(email, password))
        .rejects
        .toThrow(AuthenticationError);
    });
  });
});
```

### Integration Testing

Integration tests verify component interactions:

```typescript
// Example API integration test
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { app } from '../app';
import { connectToDatabase, closeDatabaseConnection } from '../database';

describe('Auth API', () => {
  let mongoServer: MongoMemoryServer;
  let token: string;

  beforeAll(async () => {
    // Setup in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    await connectToDatabase();
  });

  afterAll(async () => {
    await closeDatabaseConnection();
    await mongoServer.stop();
  });

  it('should register a new user', async () => {
    const res = await supertest(app)
      .post('/api/authz/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('token');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
  });

  it('should login user with valid credentials', async () => {
    const res = await supertest(app)
      .post('/api/authz/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('token');
    
    // Save token for authenticated requests
    token = res.body.data.token;
  });

  it('should access protected route with valid token', async () => {
    const res = await supertest(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body.data).toHaveProperty('user');
  });
});
```

### Test Environment

Tests run in a controlled environment:

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/index.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
};
```

```typescript
// tests/setup.ts
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  
  // Mock external services as needed
  jest.mock('../services/llm.service', () => {
    return {
      LLMService: jest.fn().mockImplementation(() => ({
        generateResponse: jest.fn().mockResolvedValue('LLM test response'),
      })),
    };
  });
});

// Global test teardown
afterAll(() => {
  jest.clearAllMocks();
});
```

## Deployment Considerations

The backend is designed for flexible deployment options.

### Containerization

The application is containerized using Docker:

```dockerfile
# Dockerfile
FROM node:18-slim AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-slim

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run as non-root user
USER node

# Start application
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/healthAdvisor
      - JWT_SECRET=${JWT_SECRET}
      - LLM_API_KEY=${LLM_API_KEY}
      - LLM_API_URL=${LLM_API_URL}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:5.0
    ports:
      - '27017:27017'
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=healthAdvisor
    restart: unless-stopped

volumes:
  mongo-data:
```

### Scaling

The backend can scale horizontally:

- **Stateless design**: The application is designed to be stateless, allowing multiple instances to run behind a load balancer.
- **Database connection pooling**: Connection pooling optimizes database connections across multiple application instances.
- **Load balancing support**: The application can be deployed behind a load balancer for horizontal scaling.
- **Session management via JWT**: Authentication state is maintained via JWT tokens, eliminating the need for server-side session storage.

### Monitoring

The application supports monitoring:

- **Health check endpoint**: The `/health` endpoint provides application health status.
- **Structured logging**: Winston logger provides structured logs for monitoring and troubleshooting.
- **Performance metrics**: Custom metrics can be implemented for monitoring application performance.
- **Error tracking**: Comprehensive error logging and tracking.

## Future Considerations

The backend architecture allows for future enhancements and evolution.

### Microservices Evolution

The modular monolith can evolve into microservices:

- **Service boundaries already defined**: The backend is already organized into distinct service components with clear responsibilities.
- **Clear interfaces between components**: Each service has well-defined interfaces, making it easier to extract into separate microservices.
- **Independent scaling potential**: Different components have different scaling needs, which can be addressed with microservices.
- **Domain-driven design principles**: The backend follows domain-driven design principles, which align well with microservices architecture.

### Performance Optimizations

Future performance improvements could include:

- **Caching layer implementation**: Adding Redis caching for frequently accessed data.
- **Database query optimization**: Further optimization of MongoDB queries for improved performance.
- **Asynchronous processing for long-running tasks**: Implementing a message queue for handling time-consuming operations.
- **Response compression**: Adding compression middleware to reduce response size.

### Additional Features

The architecture supports adding new features:

- **Additional health data types**: The system can be extended to support new types of health data.
- **Enhanced LLM capabilities**: Integration with more advanced LLM features as they become available.
- **User collaboration features**: Adding the ability for users to share health data with healthcare providers or family members.
- **Integration with external health systems**: Connecting with electronic health record systems and other healthcare platforms.