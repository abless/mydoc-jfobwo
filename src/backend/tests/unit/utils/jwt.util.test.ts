/**
 * JWT Utility Tests
 * 
 * This file contains unit tests for the JWT utility functions that handle token
 * generation, verification, payload creation, and token extraction for the
 * Health Advisor application's authentication system.
 */

import jwt from 'jsonwebtoken'; // ^9.0.0
import { Request } from 'express';
import { 
  generateToken, 
  verifyToken, 
  createTokenPayload, 
  extractTokenFromHeader, 
  decodeToken 
} from '../../../src/utils/jwt.util';
import { environment } from '../../../src/config/environment';
import { 
  JwtPayload, 
  TokenType, 
  AuthErrorType 
} from '../../../src/types/auth.types';
import { AuthenticationError } from '../../../src/utils/error.util';

// Mock the jsonwebtoken library
jest.mock('jsonwebtoken');

// Test data used across multiple test suites
const mockUserId = '123456789abc';
const mockEmail = 'test@example.com';
const mockToken = 'mock.jwt.token';
const mockPayload: JwtPayload = {
  userId: mockUserId,
  email: mockEmail,
  iat: Math.floor(Date.now() / 1000)
};

describe('generateToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (jwt.sign as jest.Mock).mockReturnValue(mockToken);
  });

  it('should generate a valid JWT token', () => {
    const token = generateToken(mockPayload, TokenType.ACCESS);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token).toBe(mockToken);
    expect(jwt.sign).toHaveBeenCalledTimes(1);
  });

  it('should use ACCESS token expiration time for ACCESS tokens', () => {
    generateToken(mockPayload, TokenType.ACCESS);
    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      environment.JWT_SECRET,
      { expiresIn: environment.JWT_EXPIRATION }
    );
  });

  it('should use REFRESH token expiration time for REFRESH tokens', () => {
    generateToken(mockPayload, TokenType.REFRESH);
    expect(jwt.sign).toHaveBeenCalledWith(
      mockPayload,
      environment.JWT_SECRET,
      { expiresIn: environment.REFRESH_TOKEN_EXPIRATION }
    );
  });

  it('should include the correct payload in the token', () => {
    generateToken(mockPayload, TokenType.ACCESS);
    const [payloadArg] = (jwt.sign as jest.Mock).mock.calls[0];
    expect(payloadArg).toEqual(mockPayload);
  });

  it('should throw an error when signing fails', () => {
    (jwt.sign as jest.Mock).mockImplementation(() => {
      throw new Error('Signing failed');
    });
    
    expect(() => {
      generateToken(mockPayload, TokenType.ACCESS);
    }).toThrow('Signing failed');
  });
});

describe('verifyToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully verify a valid token', async () => {
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, mockPayload);
    });

    await expect(verifyToken(mockToken)).resolves.toEqual(mockPayload);
    expect(jwt.verify).toHaveBeenCalledWith(
      mockToken,
      environment.JWT_SECRET,
      expect.any(Function)
    );
  });

  it('should return the correct payload for a valid token', async () => {
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, mockPayload);
    });

    const result = await verifyToken(mockToken);
    expect(result).toEqual(mockPayload);
    expect(result.userId).toBe(mockUserId);
    expect(result.email).toBe(mockEmail);
  });

  it('should throw AuthenticationError with INVALID_TOKEN for invalid tokens', async () => {
    const verifyError = new Error('Invalid token');
    verifyError.name = 'JsonWebTokenError';
    
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(verifyError, null);
    });

    await expect(verifyToken(mockToken)).rejects.toThrow(AuthenticationError);
    await expect(verifyToken(mockToken)).rejects.toMatchObject({
      errorCode: AuthErrorType.INVALID_TOKEN,
      message: 'Invalid token'
    });
  });

  it('should throw AuthenticationError with TOKEN_EXPIRED for expired tokens', async () => {
    const expiredError = new Error('jwt expired');
    expiredError.name = 'TokenExpiredError';
    
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(expiredError, null);
    });

    await expect(verifyToken(mockToken)).rejects.toThrow(AuthenticationError);
    await expect(verifyToken(mockToken)).rejects.toMatchObject({
      errorCode: AuthErrorType.TOKEN_EXPIRED,
      message: 'Token has expired'
    });
  });

  it('should reject tokens signed with a different secret', async () => {
    const invalidSignatureError = new Error('invalid signature');
    invalidSignatureError.name = 'JsonWebTokenError';
    
    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(invalidSignatureError, null);
    });

    await expect(verifyToken(mockToken)).rejects.toThrow(AuthenticationError);
    await expect(verifyToken(mockToken)).rejects.toMatchObject({
      errorCode: AuthErrorType.INVALID_TOKEN
    });
  });
});

describe('createTokenPayload', () => {
  it('should create a payload with the correct structure', () => {
    const payload = createTokenPayload(mockUserId, mockEmail);
    expect(payload).toHaveProperty('userId');
    expect(payload).toHaveProperty('email');
    expect(payload).toHaveProperty('iat');
  });

  it('should include userId and email in the payload', () => {
    const payload = createTokenPayload(mockUserId, mockEmail);
    expect(payload.userId).toBe(mockUserId);
    expect(payload.email).toBe(mockEmail);
  });

  it('should include a timestamp (iat) in the payload', () => {
    const now = Math.floor(Date.now() / 1000);
    const payload = createTokenPayload(mockUserId, mockEmail);
    
    // Allow 1 second difference for test execution time
    expect(payload.iat).toBeGreaterThanOrEqual(now - 1);
    expect(payload.iat).toBeLessThanOrEqual(now + 1);
  });

  it('should reject invalid inputs', () => {
    // TypeScript would normally catch these at compile time,
    // but we test to ensure runtime validation works
    // @ts-ignore - deliberately passing invalid types for testing
    expect(() => createTokenPayload(null, mockEmail)).toThrow();
    
    // @ts-ignore - deliberately passing invalid types for testing
    expect(() => createTokenPayload(mockUserId, null)).toThrow();
  });
});

describe('extractTokenFromHeader', () => {
  it('should extract token from valid Authorization header', () => {
    const mockRequest = {
      headers: {
        authorization: `Bearer ${mockToken}`
      }
    } as Request;

    const token = extractTokenFromHeader(mockRequest);
    expect(token).toBe(mockToken);
  });

  it('should return null for missing Authorization header', () => {
    const mockRequest = {
      headers: {}
    } as Request;

    const token = extractTokenFromHeader(mockRequest);
    expect(token).toBeNull();
  });

  it('should return null for malformed Authorization header', () => {
    const mockRequest = {
      headers: {
        authorization: mockToken // Missing Bearer prefix
      }
    } as Request;

    const token = extractTokenFromHeader(mockRequest);
    expect(token).toBeNull();
  });

  it('should handle different header formats correctly', () => {
    // Wrong scheme
    const mockRequest1 = {
      headers: {
        authorization: `Basic ${mockToken}`
      }
    } as Request;
    
    // Extra spaces
    const mockRequest2 = {
      headers: {
        authorization: `Bearer  ${mockToken}`
      }
    } as Request;
    
    // Case-sensitive check
    const mockRequest3 = {
      headers: {
        authorization: `bearer ${mockToken}`
      }
    } as Request;

    expect(extractTokenFromHeader(mockRequest1)).toBeNull();
    expect(extractTokenFromHeader(mockRequest2)).toBeNull();
    expect(extractTokenFromHeader(mockRequest3)).toBeNull();
  });
});

describe('decodeToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should decode a valid token without verification', () => {
    (jwt.decode as jest.Mock).mockReturnValue(mockPayload);
    
    const result = decodeToken(mockToken);
    expect(result).toEqual(mockPayload);
    expect(jwt.decode).toHaveBeenCalledWith(mockToken);
  });

  it('should return the correct payload from a token', () => {
    (jwt.decode as jest.Mock).mockReturnValue({
      ...mockPayload,
      exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
    });
    
    const result = decodeToken(mockToken);
    expect(result).toBeTruthy();
    expect(result?.userId).toBe(mockUserId);
    expect(result?.email).toBe(mockEmail);
  });

  it('should return null for invalid tokens', () => {
    (jwt.decode as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    const result = decodeToken(mockToken);
    expect(result).toBeNull();
  });

  it("should not throw for expired tokens (unlike verifyToken)", () => {
    const expiredPayload = {
      ...mockPayload,
      exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
    };
    
    (jwt.decode as jest.Mock).mockReturnValue(expiredPayload);
    
    expect(() => {
      const result = decodeToken(mockToken);
      expect(result).toEqual(expiredPayload);
    }).not.toThrow();
  });
});