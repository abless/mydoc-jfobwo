import { Types } from 'mongoose'; // mongoose version ^7.0.3
import {
  UserDocument,
  UserRole,
  CreateUserInput,
  UserProfileResponse
} from '../../src/types/user.types';

// Create consistent mock values for testing
export const mockUserId = new Types.ObjectId().toString();
export const mockUserObjectId = new Types.ObjectId();

/**
 * Default mock user document for testing
 */
export const mockUserDocument: UserDocument = {
  _id: mockUserObjectId,
  email: 'test@example.com',
  password: '$2b$10$X/4ykh82JvdCRJt1sKTK8e8U0l5mGDdfVsZ5RxG1FEXDAB0MU14Jq', // hashed 'password123'
  role: UserRole.USER,
  createdAt: new Date('2023-05-01T00:00:00.000Z'),
  updatedAt: new Date('2023-05-01T00:00:00.000Z'),
  comparePassword: async (candidatePassword: string): Promise<boolean> => {
    return candidatePassword === 'password123';
  }
} as UserDocument;

/**
 * Default mock user input for testing
 */
export const mockUserInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123'
};

/**
 * Default mock user profile response for testing
 */
export const mockUserProfileResponse: UserProfileResponse = {
  id: mockUserId,
  email: 'test@example.com',
  createdAt: '2023-05-01T00:00:00.000Z'
};

/**
 * Creates a mock user document with optional overrides for testing
 * @param overrides - Optional property overrides for the user document
 * @returns A mock user document with default values and any provided overrides
 */
export const createMockUserDocument = (overrides?: Partial<UserDocument>): UserDocument => {
  return {
    ...mockUserDocument,
    _id: new Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    comparePassword: mockComparePassword,
    ...overrides
  } as UserDocument;
};

/**
 * Creates mock user input data for testing user creation
 * @param overrides - Optional property overrides for the user input
 * @returns Mock user input with default values and any provided overrides
 */
export const createMockUserInput = (overrides?: Partial<CreateUserInput>): CreateUserInput => {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'password123',
    ...overrides
  };
};

/**
 * Creates a mock user profile response for testing API responses
 * @param overrides - Optional property overrides for the user profile response
 * @returns Mock user profile response with default values and any provided overrides
 */
export const createMockUserProfileResponse = (overrides?: Partial<UserProfileResponse>): UserProfileResponse => {
  return {
    id: new Types.ObjectId().toString(),
    email: `test-${Date.now()}@example.com`,
    createdAt: new Date().toISOString(),
    ...overrides
  };
};

/**
 * Mock implementation of the comparePassword method for user documents
 * @param candidatePassword - The password to compare
 * @returns Promise resolving to true for correct password, false otherwise
 */
export const mockComparePassword = async (candidatePassword: string): Promise<boolean> => {
  return candidatePassword === 'password123';
};

/**
 * Mock implementation of the findByEmail repository function
 * @param email - The email to search for
 * @returns Promise resolving to a mock user document or null
 */
export const mockFindByEmail = async (email: string): Promise<UserDocument | null> => {
  if (email === mockUserDocument.email) {
    return mockUserDocument;
  }
  return null;
};

/**
 * Mock implementation of the getUserById repository function
 * @param userId - The user ID to search for
 * @returns Promise resolving to a mock user document or null
 */
export const mockGetUserById = async (userId: string): Promise<UserDocument | null> => {
  if (userId === mockUserId || userId === mockUserObjectId.toString()) {
    return mockUserDocument;
  }
  return null;
};

/**
 * Mock implementation of the createUser repository function
 * @param userData - The user data to create a new user with
 * @returns Promise resolving to a newly created mock user document
 */
export const mockCreateUser = async (userData: CreateUserInput): Promise<UserDocument> => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    email: userData.email,
    password: '$2b$10$X/4ykh82JvdCRJt1sKTK8e8U0l5mGDdfVsZ5RxG1FEXDAB0MU14Jq', // hashed password
    role: UserRole.USER,
    createdAt: now,
    updatedAt: now,
    comparePassword: mockComparePassword
  } as UserDocument;
};

/**
 * Creates a complete mock user repository for testing
 * @param customImplementations - Optional custom implementations for repository methods
 * @returns A mock user repository object with all required methods
 */
export const mockUserRepository = (customImplementations = {}) => ({
  findByEmail: mockFindByEmail,
  getUserById: mockGetUserById,
  createUser: mockCreateUser,
  ...customImplementations
});