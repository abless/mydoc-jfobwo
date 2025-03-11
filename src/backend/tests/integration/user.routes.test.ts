import request from 'supertest'; // ^6.3.3
import * as Express from 'express'; // ^4.18.2
import mongoose from 'mongoose'; // ^7.0.3
import bcrypt from 'bcrypt'; // ^5.1.0

import {
  setupTestDatabase,
  teardownTestDatabase,
  resetCollections,
  setupTestApp
} from '../setup';
import {
  mockUserDocument,
  mockUserProfileResponse,
  createMockUserDocument
} from '../mocks/user.mock';
import User from '../../src/models/user.model';
import {
  generateToken,
  createTokenPayload
} from '../../src/utils/jwt.util';
import { TokenType } from '../../src/types/auth.types';
import { UserRole } from '../../src/types/user.types';

// Global test variables
let app: Express.Application;
let testUser: any;
let authToken: string;

/**
 * Creates a test user in the database for integration testing
 * @returns Created test user document
 */
async function createTestUser(): Promise<any> {
  // Hash the password
  const hashedPassword = await bcrypt.hash('testpassword123', 10);
  
  // Create a user document
  const user = await User.create({
    email: 'testuser@example.com',
    password: hashedPassword,
    role: UserRole.USER
  });
  
  return user;
}

describe('User Routes Integration Tests', () => {
  // Set up test environment before all tests
  beforeAll(async () => {
    // Set up the test database
    await setupTestDatabase();
    
    // Set up the Express app
    app = await setupTestApp();
  });
  
  // Clean up after all tests
  afterAll(async () => {
    // Tear down the test database
    await teardownTestDatabase();
  });
  
  // Reset collections and create test user before each test
  beforeEach(async () => {
    // Reset all collections
    await resetCollections();
    
    // Create a new test user for this test
    testUser = await createTestUser();
    
    // Generate an auth token for the test user
    const payload = createTokenPayload(testUser._id.toString(), testUser.email);
    authToken = generateToken(payload, TokenType.ACCESS);
  });
  
  test('GET /api/users/me - should return user profile when authenticated', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    // Verify response structure
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('createdAt');
    
    // Verify user data
    expect(response.body.id).toBe(testUser._id.toString());
    expect(response.body.email).toBe(testUser.email);
    
    // Verify data types
    expect(typeof response.body.id).toBe('string');
    expect(typeof response.body.email).toBe('string');
    expect(typeof response.body.createdAt).toBe('string');
    
    // Verify there's no sensitive data
    expect(response.body).not.toHaveProperty('password');
    expect(response.body).not.toHaveProperty('__v');
  });
  
  test('GET /api/users/me - should return 401 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .expect(401);
    
    // Verify error response
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('code', 'UNAUTHORIZED');
  });
  
  test('GET /api/users/me - should return 401 with invalid token', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', 'Bearer invalidtoken')
      .expect(401);
    
    // Verify error response
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('code', 'INVALID_TOKEN');
  });
  
  test('GET /api/users/me - should return 404 when user not found', async () => {
    // Generate a token for a non-existent user
    const nonExistentUserId = new mongoose.Types.ObjectId();
    const payload = createTokenPayload(nonExistentUserId.toString(), 'nonexistent@example.com');
    const tokenForNonExistentUser = generateToken(payload, TokenType.ACCESS);
    
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${tokenForNonExistentUser}`)
      .expect(404);
    
    // Verify error response
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('code', 'NOT_FOUND');
  });
});