/**
 * Unit tests for encryption utilities
 * 
 * Tests the password hashing, verification, and token generation functionality
 * to ensure security requirements are met for the Health Advisor application.
 */

import {
  hashPassword,
  verifyPassword,
  generateRandomBytes,
  generateSecureToken,
} from '../../../src/utils/encryption.util';
import bcrypt from 'bcrypt'; // ^5.1.0
import crypto from 'crypto'; // ^1.0.1
import { environment } from '../../../src/config/environment';
import { InternalServerError } from '../../../src/utils/error.util';

// Mock the external dependencies
jest.mock('bcrypt');
jest.mock('crypto');

describe('hashPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock bcrypt methods
    (bcrypt.genSalt as jest.Mock).mockResolvedValue('mockedSalt');
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword123');
  });

  it('should hash a password correctly', async () => {
    const password = 'testPassword';
    const result = await hashPassword(password);
    
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith(password, 'mockedSalt');
    expect(result).toBe('hashedPassword123');
  });

  it('should use different salt for each hash', async () => {
    await hashPassword('password1');
    await hashPassword('password2');
    
    expect(bcrypt.genSalt).toHaveBeenCalledTimes(2);
  });

  it('should use higher salt rounds in production environment', async () => {
    // Mock environment to production mode
    const originalIsProduction = environment.IS_PRODUCTION;
    Object.defineProperty(environment, 'IS_PRODUCTION', { get: () => true });
    
    await hashPassword('testPassword');
    
    // Should use SALT_ROUNDS + 2 in production
    expect(bcrypt.genSalt).toHaveBeenCalledWith(12); // 10 + 2
    
    // Restore the original value
    Object.defineProperty(environment, 'IS_PRODUCTION', { get: () => originalIsProduction });
  });

  it('should throw InternalServerError when bcrypt.hash fails', async () => {
    // Mock bcrypt.hash to throw an error
    (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));
    
    await expect(hashPassword('testPassword')).rejects.toThrow(InternalServerError);
    await expect(hashPassword('testPassword')).rejects.toThrow('Failed to hash password');
  });

  it('should reject empty or invalid passwords', async () => {
    await expect(hashPassword('')).rejects.toThrow(InternalServerError);
    await expect(hashPassword(123 as any)).rejects.toThrow(InternalServerError);
    await expect(hashPassword(null as any)).rejects.toThrow(InternalServerError);
    await expect(hashPassword(undefined as any)).rejects.toThrow(InternalServerError);
  });
});

describe('verifyPassword', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true for matching password and hash', async () => {
    // Mock bcrypt.compare to return true (passwords match)
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
    
    const result = await verifyPassword('testPassword', 'hashedPassword');
    
    expect(bcrypt.compare).toHaveBeenCalledWith('testPassword', 'hashedPassword');
    expect(result).toBe(true);
  });

  it('should return false for non-matching password and hash', async () => {
    // Mock bcrypt.compare to return false (passwords don't match)
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    
    const result = await verifyPassword('wrongPassword', 'hashedPassword');
    
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    expect(result).toBe(false);
  });

  it('should throw InternalServerError when bcrypt.compare fails', async () => {
    // Mock bcrypt.compare to throw an error
    (bcrypt.compare as jest.Mock).mockRejectedValue(new Error('Bcrypt error'));
    
    await expect(verifyPassword('testPassword', 'hashedPassword'))
      .rejects.toThrow(InternalServerError);
    await expect(verifyPassword('testPassword', 'hashedPassword'))
      .rejects.toThrow('Failed to verify password');
  });

  it('should reject empty passwords or hashes', async () => {
    await expect(verifyPassword('', 'hashedPassword'))
      .rejects.toThrow(InternalServerError);
    await expect(verifyPassword('testPassword', ''))
      .rejects.toThrow(InternalServerError);
    await expect(verifyPassword('', ''))
      .rejects.toThrow(InternalServerError);
  });
});

describe('generateRandomBytes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation for crypto.randomBytes
    (crypto.randomBytes as jest.Mock).mockImplementation((length, callback) => {
      const buffer = Buffer.alloc(length, 'a'); // Buffer filled with 'a' bytes
      callback(null, buffer);
      return buffer;
    });
  });

  it('should generate random bytes of specified length', async () => {
    const length = 16;
    const result = await generateRandomBytes(length);
    
    expect(crypto.randomBytes).toHaveBeenCalledWith(length, expect.any(Function));
    expect(result.length).toBe(length * 2); // Hex encoding doubles the length
  });

  it('should return a hex string of expected length', async () => {
    const byteLength = 16;
    const result = await generateRandomBytes(byteLength);
    
    // Hex encoding makes each byte 2 characters
    expect(result.length).toBe(byteLength * 2);
    expect(result).toMatch(/^[0-9a-f]+$/); 
  });

  it('should generate different values on each call', async () => {
    // Mock crypto.randomBytes to return different buffers on consecutive calls
    let callCount = 0;
    (crypto.randomBytes as jest.Mock).mockImplementation((length, callback) => {
      callCount++;
      const buffer = Buffer.alloc(length, callCount.toString()); // Different buffer each time
      callback(null, buffer);
      return buffer;
    });
    
    const result1 = await generateRandomBytes(16);
    const result2 = await generateRandomBytes(16);
    
    expect(result1).not.toBe(result2);
    expect(crypto.randomBytes).toHaveBeenCalledTimes(2);
  });

  it('should throw InternalServerError when crypto.randomBytes fails', async () => {
    // Mock crypto.randomBytes to call the callback with an error
    (crypto.randomBytes as jest.Mock).mockImplementation((length, callback) => {
      callback(new Error('Crypto error'), null);
    });
    
    await expect(generateRandomBytes(16)).rejects.toThrow(InternalServerError);
    await expect(generateRandomBytes(16)).rejects.toThrow('Failed to generate random bytes');
  });

  it('should reject invalid length parameters', async () => {
    await expect(generateRandomBytes(0)).rejects.toThrow(InternalServerError);
    await expect(generateRandomBytes(-1)).rejects.toThrow(InternalServerError);
    await expect(generateRandomBytes(NaN)).rejects.toThrow(InternalServerError);
  });
});

describe('generateSecureToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock generateRandomBytes to return a predictable value
    jest.spyOn(require('../../../src/utils/encryption.util'), 'generateRandomBytes')
      .mockResolvedValue('mockedRandomBytes');
  });

  afterEach(() => {
    // Restore the original implementation
    jest.restoreAllMocks();
  });

  it('should generate a token of expected length', async () => {
    const byteLength = 8;
    const result = await generateSecureToken(byteLength);
    
    // Check that generateRandomBytes was called with the specified length
    expect(require('../../../src/utils/encryption.util').generateRandomBytes)
      .toHaveBeenCalledWith(byteLength);
    
    expect(result).toBe('mockedRandomBytes');
  });

  it('should use default length when not specified', async () => {
    const result = await generateSecureToken();
    
    // Default length is 32
    expect(require('../../../src/utils/encryption.util').generateRandomBytes)
      .toHaveBeenCalledWith(32);
    
    expect(result).toBe('mockedRandomBytes');
  });

  it('should delegate to generateRandomBytes correctly', async () => {
    const byteLength = 16;
    
    // We'll use a special mock implementation to track the parameters
    const mockGenerateRandomBytes = jest.spyOn(
      require('../../../src/utils/encryption.util'), 
      'generateRandomBytes'
    );
    mockGenerateRandomBytes.mockImplementation(async (length: number) => {
      // Verify the correct length was passed
      expect(length).toBe(byteLength);
      return 'trackedMockBytes';
    });
    
    const result = await generateSecureToken(byteLength);
    
    expect(result).toBe('trackedMockBytes');
    expect(mockGenerateRandomBytes).toHaveBeenCalledWith(byteLength);
  });

  it('should propagate errors from generateRandomBytes', async () => {
    // Mock generateRandomBytes to throw an error
    jest.spyOn(require('../../../src/utils/encryption.util'), 'generateRandomBytes')
      .mockRejectedValue(new Error('Random bytes error'));
    
    await expect(generateSecureToken()).rejects.toThrow(InternalServerError);
    await expect(generateSecureToken()).rejects.toThrow('Failed to generate secure token');
  });
});