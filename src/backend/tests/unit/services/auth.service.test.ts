import {
  signup,
  login,
  validateToken,
  formatUserResponse
} from '../../../src/services/auth.service';
import {
  findByEmail,
  createUser,
  getUserById
} from '../../../src/repositories/user.repository';
import {
  hashPassword,
  verifyPassword
} from '../../../src/utils/encryption.util';
import {
  generateToken,
  verifyToken,
  createTokenPayload
} from '../../../src/utils/jwt.util';
import {
  AuthenticationError,
  ConflictError
} from '../../../src/utils/error.util';
import {
  AuthErrorType,
  TokenType
} from '../../../src/types/auth.types';
import {
  mockUserDocument,
  mockUserInput,
  mockUserId,
  createMockUserDocument
} from '../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/utils/encryption.util');
jest.mock('../../../src/utils/jwt.util');

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    (findByEmail as jest.Mock).mockResolvedValue(null);
    (hashPassword as jest.Mock).mockResolvedValue('hashedPassword');
    (createUser as jest.Mock).mockResolvedValue(mockUserDocument);
    (getUserById as jest.Mock).mockResolvedValue(mockUserDocument);
    (generateToken as jest.Mock).mockReturnValue('mockedToken');
    (verifyToken as jest.Mock).mockResolvedValue({ userId: mockUserId });
    (createTokenPayload as jest.Mock).mockReturnValue({ 
      userId: mockUserDocument._id.toString(), 
      email: mockUserDocument.email,
      iat: Math.floor(Date.now() / 1000)
    });
  });

  describe('signup', () => {
    it('should register a new user and return token and user data', async () => {
      // Execute
      const result = await signup(mockUserInput);
      
      // Assert
      expect(findByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(createUser).toHaveBeenCalledWith({
        email: mockUserInput.email,
        password: mockUserInput.password
      });
      expect(createTokenPayload).toHaveBeenCalledWith(
        mockUserDocument._id.toString(),
        mockUserDocument.email
      );
      expect(generateToken).toHaveBeenCalledWith(
        expect.any(Object), 
        TokenType.ACCESS
      );
      expect(result).toEqual({
        token: expect.any(String),
        user: {
          id: mockUserDocument._id.toString(),
          email: mockUserDocument.email
        }
      });
    });

    it('should throw a conflict error if email already exists', async () => {
      // Setup
      (findByEmail as jest.Mock).mockResolvedValue(mockUserDocument);
      
      // Execute & Assert
      await expect(signup(mockUserInput)).rejects.toThrow(ConflictError);
      expect(findByEmail).toHaveBeenCalledWith(mockUserInput.email);
      expect(createUser).not.toHaveBeenCalled();
      expect(generateToken).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should authenticate a user and return token and user data', async () => {
      // Setup
      const mockUser = {
        ...mockUserDocument,
        comparePassword: jest.fn().mockResolvedValue(true)
      };
      (findByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      const loginInput = { 
        email: mockUserDocument.email, 
        password: 'password123' 
      };
      
      // Execute
      const result = await login(loginInput);
      
      // Assert
      expect(findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginInput.password);
      expect(createTokenPayload).toHaveBeenCalledWith(
        mockUserDocument._id.toString(),
        mockUserDocument.email
      );
      expect(generateToken).toHaveBeenCalledWith(
        expect.any(Object), 
        TokenType.ACCESS
      );
      expect(result).toEqual({
        token: expect.any(String),
        user: {
          id: mockUserDocument._id.toString(),
          email: mockUserDocument.email
        }
      });
    });

    it('should throw an authentication error if user is not found', async () => {
      // Setup - findByEmail already returns null from beforeEach
      const loginInput = { 
        email: 'nonexistent@example.com', 
        password: 'password123' 
      };
      
      // Execute & Assert
      await expect(login(loginInput)).rejects.toThrow(AuthenticationError);
      expect(findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(generateToken).not.toHaveBeenCalled();
    });

    it('should throw an authentication error if password is invalid', async () => {
      // Setup
      const mockUser = {
        ...mockUserDocument,
        comparePassword: jest.fn().mockResolvedValue(false)
      };
      (findByEmail as jest.Mock).mockResolvedValue(mockUser);
      
      const loginInput = { 
        email: mockUserDocument.email, 
        password: 'wrongpassword' 
      };
      
      // Execute & Assert
      await expect(login(loginInput)).rejects.toThrow(AuthenticationError);
      expect(findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginInput.password);
      expect(generateToken).not.toHaveBeenCalled();
    });
  });

  describe('validateToken', () => {
    it('should validate a token and return user data', async () => {
      // Setup
      const token = 'valid-token';
      (verifyToken as jest.Mock).mockResolvedValue({ 
        userId: mockUserId,
        email: mockUserDocument.email,
        iat: Math.floor(Date.now() / 1000)
      });
      
      // Execute
      const result = await validateToken(token);
      
      // Assert
      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(getUserById).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUserDocument);
    });

    it('should throw an authentication error if token is invalid', async () => {
      // Setup
      const token = 'invalid-token';
      const authError = new AuthenticationError('Invalid token', AuthErrorType.INVALID_TOKEN);
      (verifyToken as jest.Mock).mockRejectedValue(authError);
      
      // Execute & Assert
      await expect(validateToken(token)).rejects.toThrow(AuthenticationError);
      expect(verifyToken).toHaveBeenCalledWith(token);
      expect(getUserById).not.toHaveBeenCalled();
    });
  });

  describe('formatUserResponse', () => {
    it('should format user document into user response', () => {
      // Execute
      const result = formatUserResponse(mockUserDocument);
      
      // Assert
      expect(result).toEqual({
        id: mockUserDocument._id.toString(),
        email: mockUserDocument.email
      });
    });
  });
});