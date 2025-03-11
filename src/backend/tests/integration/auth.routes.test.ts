/**
 * Authentication Routes Integration Tests
 * 
 * This module contains integration tests for authentication routes, verifying the
 * functionality of signup, login, and token validation endpoints. These tests
 * ensure that the authentication flow works correctly from request to response,
 * including validation, error handling, and successful authentication scenarios.
 * 
 * @module tests/integration/auth.routes.test
 */

import supertest from 'supertest'; // ^6.3.3
import express from 'express'; // ^4.18.2
import jwt from 'jsonwebtoken'; // ^9.0.0

import { 
  setupTestDatabase, 
  teardownTestDatabase, 
  resetCollections 
} from '../setup';
import createApp from '../../src/app';
import { 
  mockUserInput,
  createMockUserInput,
} from '../mocks/user.mock';
import User from '../../src/models/user.model';
import { hashPassword } from '../../src/utils/encryption.util';

// Define global variables for the Express app and API prefix
let app: express.Application;
const apiPrefix = '/api/authz';

/**
 * Extracts JWT token from authentication response
 * @param response - The response object from the authentication request
 * @returns JWT token string
 */
function extractTokenFromResponse(response: supertest.Response): string {
  return response.body.data.token;
}

describe('Authentication Routes', () => {
  /**
   * Setup test environment before all tests
   * - Set up in-memory MongoDB
   * - Create Express app instance
   */
  beforeAll(async () => {
    await setupTestDatabase();
    app = await createApp();
  });

  /**
   * Teardown test environment after all tests
   * - Tear down test database
   */
  afterAll(async () => {
    await teardownTestDatabase();
  });

  /**
   * Reset database collections before each test
   * - Clear all data from collections to ensure test isolation
   */
  beforeEach(async () => {
    await resetCollections();
  });

  it('POST /signup - should create a new user and return token', async () => {
    // Send POST request to /api/authz/signup with valid user data
    const response = await supertest(app)
      .post(`${apiPrefix}/signup`)
      .send(mockUserInput);

    // Expect 201 status code
    expect(response.statusCode).toBe(201);

    // Verify response contains token and user data
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(mockUserInput.email);

    // Verify user exists in database
    const user = await User.findOne({ email: mockUserInput.email });
    expect(user).toBeDefined();
    expect(user?.email).toBe(mockUserInput.email);

    // Verify password is hashed in database
    expect(user?.password).not.toBe(mockUserInput.password);
  });

  it('POST /signup - should return 400 with invalid email', async () => {
    // Send POST request to /api/authz/signup with invalid email format
    const response = await supertest(app)
      .post(`${apiPrefix}/signup`)
      .send({ ...mockUserInput, email: 'invalid-email' });

    // Expect 400 status code
    expect(response.statusCode).toBe(400);

    // Verify response contains validation error message
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.email).toBe('Please provide a valid email address');
  });

  it('POST /signup - should return 400 with invalid password', async () => {
    // Send POST request to /api/authz/signup with short password
    const response = await supertest(app)
      .post(`${apiPrefix}/signup`)
      .send({ ...mockUserInput, password: 'short' });

    // Expect 400 status code
    expect(response.statusCode).toBe(400);

    // Verify response contains validation error message about password requirements
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.password).toBe('Password must be at least 8 characters long');
  });

  it('POST /signup - should return 409 when email already exists', async () => {
    // Create user in database with test email
    const hashedPassword = await hashPassword(mockUserInput.password);
    await User.create({ ...mockUserInput, password: hashedPassword });

    // Send POST request to /api/authz/signup with same email
    const response = await supertest(app)
      .post(`${apiPrefix}/signup`)
      .send(mockUserInput);

    // Expect 409 status code
    expect(response.statusCode).toBe(409);

    // Verify response contains duplicate email error message
    expect(response.body.message).toBe('Email is already registered');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('Email is already registered');
  });

  it('POST /login - should authenticate user and return token', async () => {
    // Create user in database with test credentials
    const hashedPassword = await hashPassword(mockUserInput.password);
    await User.create({ ...mockUserInput, password: hashedPassword });

    // Send POST request to /api/authz/login with valid credentials
    const response = await supertest(app)
      .post(`${apiPrefix}/login`)
      .send(mockUserInput);

    // Expect 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains token and user data
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(mockUserInput.email);

    // Verify token is valid JWT
    const token = extractTokenFromResponse(response);
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    expect(decoded).toBeDefined();
  });

  it('POST /login - should return 401 with invalid credentials', async () => {
    // Create user in database with test credentials
    const hashedPassword = await hashPassword(mockUserInput.password);
    await User.create({ ...mockUserInput, password: hashedPassword });

    // Send POST request to /api/authz/login with wrong password
    const response = await supertest(app)
      .post(`${apiPrefix}/login`)
      .send({ ...mockUserInput, password: 'wrong-password' });

    // Expect 401 status code
    expect(response.statusCode).toBe(401);

    // Verify response contains authentication error message
    expect(response.body.message).toBe('Invalid email or password');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('Invalid email or password');
  });

  it('POST /login - should return 401 with non-existent user', async () => {
    // Send POST request to /api/authz/login with email that doesn't exist
    const response = await supertest(app)
      .post(`${apiPrefix}/login`)
      .send(mockUserInput);

    // Expect 401 status code
    expect(response.statusCode).toBe(401);

    // Verify response contains authentication error message
    expect(response.body.message).toBe('Invalid email or password');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('Invalid email or password');
  });

  it('POST /login - should return 400 with invalid request format', async () => {
    // Send POST request to /api/authz/login with missing email field
    const response = await supertest(app)
      .post(`${apiPrefix}/login`)
      .send({ password: mockUserInput.password });

    // Expect 400 status code
    expect(response.statusCode).toBe(400);

    // Verify response contains validation error message
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details.email).toBe('Please provide a valid email address');
  });

  it('GET /validate - should validate token and return user data', async () => {
    // Create user in database with test credentials
    const hashedPassword = await hashPassword(mockUserInput.password);
    await User.create({ ...mockUserInput, password: hashedPassword });

    // Obtain valid token by logging in
    const loginResponse = await supertest(app)
      .post(`${apiPrefix}/login`)
      .send(mockUserInput);
    const token = extractTokenFromResponse(loginResponse);

    // Send GET request to /api/authz/validate with token in Authorization header
    const response = await supertest(app)
      .get(`${apiPrefix}/validate`)
      .set('Authorization', `Bearer ${token}`);

    // Expect 200 status code
    expect(response.statusCode).toBe(200);

    // Verify response contains user data matching the authenticated user
    expect(response.body.data.user).toBeDefined();
    expect(response.body.data.user.email).toBe(mockUserInput.email);
  });

  it('GET /validate - should return 401 with invalid token', async () => {
    // Send GET request to /api/authz/validate with invalid token in Authorization header
    const response = await supertest(app)
      .get(`${apiPrefix}/validate`)
      .set('Authorization', 'Bearer invalid-token');

    // Expect 401 status code
    expect(response.statusCode).toBe(401);

    // Verify response contains token validation error message
    expect(response.body.message).toBe('Invalid token');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('Invalid token');
  });

  it('GET /validate - should return 401 with missing token', async () => {
    // Send GET request to /api/authz/validate without Authorization header
    const response = await supertest(app)
      .get(`${apiPrefix}/validate`);

    // Expect 401 status code
    expect(response.statusCode).toBe(401);

    // Verify response contains missing token error message
    expect(response.body.message).toBe('Authentication token is missing');
    expect(response.body.error).toBeDefined();
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});