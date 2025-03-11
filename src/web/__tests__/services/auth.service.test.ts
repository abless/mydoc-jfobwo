/**
 * Unit tests for the authentication service.
 * 
 * These tests verify the correct functionality of all authentication operations
 * including login, signup, token management, and session validation.
 * 
 * The tests are designed to achieve high code coverage and verify all edge cases
 * and error handling scenarios.
 */

import { authService } from '../../src/services/auth.service';
import { 
  login, 
  signup, 
  setAuthToken, 
  clearAuthToken 
} from '../../src/api/auth.api';
import { 
  storeAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  storeUserInfo, 
  getUserInfo 
} from '../../src/services/storage.service';
import { 
  validateLoginForm, 
  validateSignupForm, 
  isFormValid 
} from '../../src/utils/validation.utils';
import {
  parseApiError,
  isAuthenticationError
} from '../../src/utils/error.utils';
import { 
  LoginRequest, 
  SignupRequest, 
  UserResponse, 
  AuthResponse 
} from '../../src/types/auth.types';

// Mock dependencies to isolate unit tests
jest.mock('../../src/api/auth.api');
jest.mock('../../src/services/storage.service');
jest.mock('../../src/utils/validation.utils');
jest.mock('../../src/utils/error.utils');

/**
 * Creates a mock authentication response object for testing
 * @param overrides Optional properties to override in the mock auth response
 * @returns Mock authentication response object
 */
const createMockAuthResponse = (overrides: Partial<AuthResponse> = {}): AuthResponse => {
  return {
    token: 'mock-jwt-token',
    user: createMockUser(),
    ...overrides
  };
};

/**
 * Creates a mock user object for testing
 * @param overrides Optional properties to override in the mock user
 * @returns Mock user object
 */
const createMockUser = (overrides: Partial<UserResponse> = {}): UserResponse => {
  return {
    id: 'user-123',
    email: 'test@example.com',
    ...overrides
  };
};

describe('AuthService', () => {
  test('should be defined', () => {
    expect(authService).toBeDefined();
  });
});

describe('login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate login credentials', async () => {
    // Mock validation to pass
    (validateLoginForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    (login as jest.Mock).mockResolvedValue(createMockAuthResponse());
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    await authService.login(credentials);
    
    expect(validateLoginForm).toHaveBeenCalledWith(credentials);
    expect(isFormValid).toHaveBeenCalledWith({});
  });

  test('should throw error if validation fails', async () => {
    const validationErrors = { email: 'Invalid email', password: 'Invalid password' };
    (validateLoginForm as jest.Mock).mockReturnValue(validationErrors);
    (isFormValid as jest.Mock).mockReturnValue(false);
    
    const credentials: LoginRequest = {
      email: 'invalid-email',
      password: 'weak'
    };
    
    await expect(authService.login(credentials)).rejects.toThrow(/Validation failed/);
  });

  test('should call login API with credentials', async () => {
    // Mock validation to pass
    (validateLoginForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const mockResponse = createMockAuthResponse();
    (login as jest.Mock).mockResolvedValue(mockResponse);
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    const result = await authService.login(credentials);
    
    expect(login).toHaveBeenCalledWith(credentials);
    expect(result).toEqual(mockResponse);
  });

  test('should store authentication data on successful login', async () => {
    // Mock validation to pass
    (validateLoginForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const mockResponse = createMockAuthResponse();
    (login as jest.Mock).mockResolvedValue(mockResponse);
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    await authService.login(credentials);
    
    expect(storeAuthToken).toHaveBeenCalledWith(mockResponse.token);
    expect(storeUserInfo).toHaveBeenCalledWith(mockResponse.user);
    expect(setAuthToken).toHaveBeenCalledWith(mockResponse.token);
  });

  test('should handle API errors', async () => {
    // Mock validation to pass
    (validateLoginForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const apiError = new Error('API error');
    (login as jest.Mock).mockRejectedValue(apiError);
    
    const parsedError = new Error('Parsed API error');
    (parseApiError as jest.Mock).mockReturnValue(parsedError);
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'Password123!'
    };
    
    await expect(authService.login(credentials)).rejects.toThrow('Parsed API error');
    expect(parseApiError).toHaveBeenCalledWith(apiError);
  });
});

describe('signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should validate signup credentials', async () => {
    // Mock validation to pass
    (validateSignupForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    (signup as jest.Mock).mockResolvedValue(createMockAuthResponse());
    
    const credentials: SignupRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    await authService.signup(credentials);
    
    expect(validateSignupForm).toHaveBeenCalledWith(credentials);
    expect(isFormValid).toHaveBeenCalledWith({});
  });

  test('should throw error if validation fails', async () => {
    const validationErrors = { 
      email: 'Invalid email', 
      password: 'Invalid password',
      confirmPassword: 'Passwords do not match'
    };
    (validateSignupForm as jest.Mock).mockReturnValue(validationErrors);
    (isFormValid as jest.Mock).mockReturnValue(false);
    
    const credentials: SignupRequest = {
      email: 'invalid-email',
      password: 'weak',
      confirmPassword: 'different'
    };
    
    await expect(authService.signup(credentials)).rejects.toThrow(/Validation failed/);
  });

  test('should call signup API with credentials', async () => {
    // Mock validation to pass
    (validateSignupForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const mockResponse = createMockAuthResponse();
    (signup as jest.Mock).mockResolvedValue(mockResponse);
    
    const credentials: SignupRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    const result = await authService.signup(credentials);
    
    expect(signup).toHaveBeenCalledWith(credentials);
    expect(result).toEqual(mockResponse);
  });

  test('should store authentication data on successful signup', async () => {
    // Mock validation to pass
    (validateSignupForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const mockResponse = createMockAuthResponse();
    (signup as jest.Mock).mockResolvedValue(mockResponse);
    
    const credentials: SignupRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    await authService.signup(credentials);
    
    expect(storeAuthToken).toHaveBeenCalledWith(mockResponse.token);
    expect(storeUserInfo).toHaveBeenCalledWith(mockResponse.user);
    expect(setAuthToken).toHaveBeenCalledWith(mockResponse.token);
  });

  test('should handle API errors', async () => {
    // Mock validation to pass
    (validateSignupForm as jest.Mock).mockReturnValue({});
    (isFormValid as jest.Mock).mockReturnValue(true);
    
    const apiError = new Error('API error');
    (signup as jest.Mock).mockRejectedValue(apiError);
    
    const parsedError = new Error('Parsed API error');
    (parseApiError as jest.Mock).mockReturnValue(parsedError);
    
    const credentials: SignupRequest = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    };
    
    await expect(authService.signup(credentials)).rejects.toThrow('Parsed API error');
    expect(parseApiError).toHaveBeenCalledWith(apiError);
  });
});

describe('logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should clear authentication token', async () => {
    await authService.logout();
    
    expect(clearAuthToken).toHaveBeenCalled();
    expect(removeAuthToken).toHaveBeenCalled();
  });

  test('should handle errors during logout', async () => {
    const error = new Error('Logout error');
    (clearAuthToken as jest.Mock).mockRejectedValue(error);
    
    await expect(authService.logout()).rejects.toThrow('Logout error');
  });
});

describe('checkAuthStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return true when token and user info exist', async () => {
    (getAuthToken as jest.Mock).mockResolvedValue('existing-token');
    (getUserInfo as jest.Mock).mockResolvedValue(createMockUser());
    
    const result = await authService.checkAuthStatus();
    
    expect(getAuthToken).toHaveBeenCalled();
    expect(setAuthToken).toHaveBeenCalledWith('existing-token');
    expect(getUserInfo).toHaveBeenCalled();
    expect(result).toBe(true);
  });

  test("should return false when token doesn't exist", async () => {
    (getAuthToken as jest.Mock).mockResolvedValue(null);
    
    const result = await authService.checkAuthStatus();
    
    expect(getAuthToken).toHaveBeenCalled();
    expect(getUserInfo).not.toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test("should return false when user info doesn't exist", async () => {
    (getAuthToken as jest.Mock).mockResolvedValue('existing-token');
    (getUserInfo as jest.Mock).mockResolvedValue(null);
    
    const result = await authService.checkAuthStatus();
    
    expect(getAuthToken).toHaveBeenCalled();
    expect(getUserInfo).toHaveBeenCalled();
    expect(result).toBe(false);
  });

  test('should handle errors during status check', async () => {
    const error = new Error('Status check error');
    (getAuthToken as jest.Mock).mockRejectedValue(error);
    
    const result = await authService.checkAuthStatus();
    
    expect(result).toBe(false);
  });
});

describe('getCurrentUser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return user info when it exists', async () => {
    const mockUser = createMockUser();
    (getUserInfo as jest.Mock).mockResolvedValue(mockUser);
    
    const result = await authService.getCurrentUser();
    
    expect(getUserInfo).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  test("should return null when user info doesn't exist", async () => {
    (getUserInfo as jest.Mock).mockResolvedValue(null);
    
    const result = await authService.getCurrentUser();
    
    expect(getUserInfo).toHaveBeenCalled();
    expect(result).toBe(null);
  });

  test('should handle errors when retrieving user info', async () => {
    const error = new Error('Get user error');
    (getUserInfo as jest.Mock).mockRejectedValue(error);
    
    const result = await authService.getCurrentUser();
    
    expect(result).toBe(null);
  });
});

describe('handleAuthError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse API errors', async () => {
    const originalError = new Error('Original error');
    const parsedError = new Error('Parsed error');
    
    (parseApiError as jest.Mock).mockReturnValue(parsedError);
    (isAuthenticationError as jest.Mock).mockReturnValue(false);
    
    await expect(authService.handleAuthError(originalError)).rejects.toThrow('Parsed error');
    
    expect(parseApiError).toHaveBeenCalledWith(originalError);
    expect(isAuthenticationError).toHaveBeenCalledWith(parsedError);
  });

  test('should logout user on authentication error', async () => {
    const originalError = new Error('Auth error');
    const parsedError = new Error('Parsed auth error');
    
    (parseApiError as jest.Mock).mockReturnValue(parsedError);
    (isAuthenticationError as jest.Mock).mockReturnValue(true);
    
    await expect(authService.handleAuthError(originalError)).rejects.toThrow('Parsed auth error');
    
    expect(parseApiError).toHaveBeenCalledWith(originalError);
    expect(isAuthenticationError).toHaveBeenCalledWith(parsedError);
    expect(clearAuthToken).toHaveBeenCalled();
    expect(removeAuthToken).toHaveBeenCalled();
  });

  test('should rethrow the error after handling', async () => {
    const originalError = new Error('Original error');
    const parsedError = new Error('Parsed error');
    
    (parseApiError as jest.Mock).mockReturnValue(parsedError);
    (isAuthenticationError as jest.Mock).mockReturnValue(false);
    
    try {
      await authService.handleAuthError(originalError);
      // Should not reach here
      expect(true).toBe(false); // Force fail if we get here
    } catch (thrownError) {
      expect(thrownError).toBe(parsedError);
    }
  });
});