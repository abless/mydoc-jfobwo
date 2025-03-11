import { Request, Response, NextFunction } from 'express'; // ^4.18.2
import * as jest from 'jest'; // ^29.5.0
import {
  signupHandler,
  loginHandler,
  validateSignup,
  validateLogin,
  authenticateToken
} from '../../../src/controllers/auth.controller';
import {
  signup,
  login,
  validateToken,
  formatUserResponse
} from '../../../src/services/auth.service';
import {
  AuthenticationError,
  ValidationError,
  ConflictError
} from '../../../src/utils/error.util';
import {
  sendSuccess,
  sendCreated,
  sendError
} from '../../../src/utils/response.util';
import { AuthErrorType } from '../../../src/types/auth.types';
import { mockUserDocument, mockUserInput } from '../../mocks/user.mock';

// Mock dependencies
jest.mock('../../../src/services/auth.service');
jest.mock('../../../src/utils/response.util');

describe('signupHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: { ...mockUserInput }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should successfully register a new user', async () => {
    // Mock successful signup
    const mockAuthResponse = {
      token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: mockUserInput.email
      }
    };
    (signup as jest.MockedFunction<typeof signup>).mockResolvedValueOnce(mockAuthResponse);

    // Call the handler
    await signupHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct params
    expect(signup).toHaveBeenCalledWith({
      email: mockUserInput.email,
      password: mockUserInput.password
    });

    // Verify response was sent
    expect(sendCreated).toHaveBeenCalledWith(
      mockResponse,
      mockAuthResponse,
      'User registered successfully'
    );

    // Verify next was not called (no error)
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle duplicate email error', async () => {
    // Mock conflict error for duplicate email
    const conflictError = new ConflictError(
      'Email is already registered',
      AuthErrorType.EMAIL_EXISTS
    );
    (signup as jest.MockedFunction<typeof signup>).mockRejectedValueOnce(conflictError);

    // Call the handler
    await signupHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct params
    expect(signup).toHaveBeenCalledWith({
      email: mockUserInput.email,
      password: mockUserInput.password
    });

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(conflictError);
    
    // Verify response utilities were not called
    expect(sendCreated).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    // Mock a generic error
    const unexpectedError = new Error('Unexpected error');
    (signup as jest.MockedFunction<typeof signup>).mockRejectedValueOnce(unexpectedError);

    // Call the handler
    await signupHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    
    // Verify response utilities were not called
    expect(sendCreated).not.toHaveBeenCalled();
  });
});

describe('loginHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: { ...mockUserInput }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should successfully authenticate a user', async () => {
    // Mock successful login
    const mockAuthResponse = {
      token: 'mock-token',
      user: {
        id: 'mock-user-id',
        email: mockUserInput.email
      }
    };
    (login as jest.MockedFunction<typeof login>).mockResolvedValueOnce(mockAuthResponse);

    // Call the handler
    await loginHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct params
    expect(login).toHaveBeenCalledWith({
      email: mockUserInput.email,
      password: mockUserInput.password
    });

    // Verify response was sent
    expect(sendSuccess).toHaveBeenCalledWith(
      mockResponse,
      mockAuthResponse,
      'User logged in successfully'
    );

    // Verify next was not called (no error)
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle invalid credentials error', async () => {
    // Mock authentication error for invalid credentials
    const authError = new AuthenticationError(
      'Invalid email or password',
      AuthErrorType.INVALID_CREDENTIALS
    );
    (login as jest.MockedFunction<typeof login>).mockRejectedValueOnce(authError);

    // Call the handler
    await loginHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify service was called with correct params
    expect(login).toHaveBeenCalledWith({
      email: mockUserInput.email,
      password: mockUserInput.password
    });

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(authError);
    
    // Verify response utilities were not called
    expect(sendSuccess).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors', async () => {
    // Mock a generic error
    const unexpectedError = new Error('Unexpected error');
    (login as jest.MockedFunction<typeof login>).mockRejectedValueOnce(unexpectedError);

    // Call the handler
    await loginHandler(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify error was passed to next
    expect(mockNext).toHaveBeenCalledWith(unexpectedError);
    
    // Verify response utilities were not called
    expect(sendSuccess).not.toHaveBeenCalled();
  });
});

describe('validateSignup', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should validate signup data correctly', () => {
    // Setup request with valid data
    mockRequest = {
      body: {
        email: 'valid@example.com',
        password: 'Password123!'
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with no arguments (success)
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject missing email', () => {
    // Setup request with missing email
    mockRequest = {
      body: {
        password: 'Password123!'
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('email');
  });

  it('should reject invalid email format', () => {
    // Setup request with invalid email
    mockRequest = {
      body: {
        email: 'invalid-email',
        password: 'Password123!'
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('email');
  });

  it('should reject missing password', () => {
    // Setup request with missing password
    mockRequest = {
      body: {
        email: 'valid@example.com'
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('password');
  });

  it('should reject password that is too short', () => {
    // Setup request with short password
    mockRequest = {
      body: {
        email: 'valid@example.com',
        password: 'short'
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('password');
  });

  it('should reject password without required complexity', () => {
    // Setup request with simple password
    mockRequest = {
      body: {
        email: 'valid@example.com',
        password: 'password' // Missing number and special character
      }
    };

    // Call the validation middleware
    validateSignup(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('password');
  });
});

describe('validateLogin', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should validate login data correctly', () => {
    // Setup request with valid data
    mockRequest = {
      body: {
        email: 'valid@example.com',
        password: 'password123'
      }
    };

    // Call the validation middleware
    validateLogin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with no arguments (success)
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject missing email', () => {
    // Setup request with missing email
    mockRequest = {
      body: {
        password: 'password123'
      }
    };

    // Call the validation middleware
    validateLogin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('email');
  });

  it('should reject invalid email format', () => {
    // Setup request with invalid email
    mockRequest = {
      body: {
        email: 'invalid-email',
        password: 'password123'
      }
    };

    // Call the validation middleware
    validateLogin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('email');
  });

  it('should reject missing password', () => {
    // Setup request with missing password
    mockRequest = {
      body: {
        email: 'valid@example.com'
      }
    };

    // Call the validation middleware
    validateLogin(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with ValidationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = mockNext.mock.calls[0][0] as ValidationError;
    expect(error.validationErrors).toHaveProperty('password');
  });
});

describe('authenticateToken', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();
  });

  it('should authenticate valid token', async () => {
    // Setup request with authorization header
    mockRequest = {
      headers: {
        authorization: 'Bearer valid-token'
      }
    };

    // Mock successful token validation
    (validateToken as jest.MockedFunction<typeof validateToken>).mockResolvedValueOnce(mockUserDocument);
    
    // Mock formatUserResponse
    const formattedUser = {
      id: 'mock-user-id',
      email: mockUserDocument.email
    };
    (formatUserResponse as jest.MockedFunction<typeof formatUserResponse>).mockReturnValueOnce(formattedUser);

    // Call the middleware
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify validateToken was called with the token
    expect(validateToken).toHaveBeenCalledWith('valid-token');
    
    // Verify formatUserResponse was called with the user document
    expect(formatUserResponse).toHaveBeenCalledWith(mockUserDocument);
    
    // Verify user was attached to request
    expect(mockRequest.user).toEqual(formattedUser);
    
    // Verify next was called with no arguments (success)
    expect(mockNext).toHaveBeenCalledWith();
  });

  it('should reject missing token', async () => {
    // Setup request with no authorization header
    mockRequest = {
      headers: {}
    };

    // Call the middleware
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with AuthenticationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    const error = mockNext.mock.calls[0][0] as AuthenticationError;
    expect(error.message).toContain('missing');
    expect(error.errorCode).toBe(AuthErrorType.UNAUTHORIZED);
  });

  it('should reject malformed token', async () => {
    // Setup request with malformed authorization header
    mockRequest = {
      headers: {
        authorization: 'InvalidFormat'
      }
    };

    // Call the middleware
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify next was called with AuthenticationError
    expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
    const error = mockNext.mock.calls[0][0] as AuthenticationError;
    expect(error.message).toContain('missing');
    expect(error.errorCode).toBe(AuthErrorType.UNAUTHORIZED);
  });

  it('should reject invalid token', async () => {
    // Setup request with authorization header
    mockRequest = {
      headers: {
        authorization: 'Bearer invalid-token'
      }
    };

    // Mock token validation failure
    const authError = new AuthenticationError(
      'Invalid token',
      AuthErrorType.INVALID_TOKEN
    );
    (validateToken as jest.MockedFunction<typeof validateToken>).mockRejectedValueOnce(authError);

    // Call the middleware
    await authenticateToken(
      mockRequest as Request,
      mockResponse as Response,
      mockNext
    );

    // Verify validateToken was called with the token
    expect(validateToken).toHaveBeenCalledWith('invalid-token');
    
    // Verify next was called with AuthenticationError
    expect(mockNext).toHaveBeenCalledWith(authError);
  });
});