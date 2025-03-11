import { renderHook, act, waitFor } from '@testing-library/react-hooks'; // ^8.0.1
import { useAuth } from '../../src/hooks/useAuth';
import { authService } from '../../src/services/auth.service';
import { 
  LoginRequest, 
  SignupRequest, 
  UserResponse, 
  AuthState 
} from '../../src/types/auth.types';

// Mock the auth service
jest.mock('../../src/services/auth.service', () => ({ 
  authService: { 
    login: jest.fn(), 
    signup: jest.fn(), 
    logout: jest.fn(), 
    checkAuthStatus: jest.fn(), 
    getCurrentUser: jest.fn(), 
    handleAuthError: jest.fn() 
  } 
}));

// Mock the AuthContext
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuthContext: jest.fn().mockReturnValue({
    state: {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null
    }
  })
}));

describe('useAuth', () => {
  // Store the original console.error to restore after tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock console.error to prevent noise in test output
    console.error = jest.fn();
    
    // Setup default mock implementations
    (authService.login as jest.Mock).mockResolvedValue({
      token: 'test-token',
      user: { id: '123', email: 'test@example.com' }
    });
    
    (authService.signup as jest.Mock).mockResolvedValue({
      token: 'test-token',
      user: { id: '123', email: 'test@example.com' }
    });
    
    (authService.logout as jest.Mock).mockResolvedValue(undefined);
    (authService.checkAuthStatus as jest.Mock).mockResolvedValue(true);
    (authService.getCurrentUser as jest.Mock).mockResolvedValue({
      id: '123',
      email: 'test@example.com'
    });
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    await act(async () => {
      await result.current.login(credentials);
    });
    
    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuth());
    
    const credentials: LoginRequest = {
      email: 'test@example.com',
      password: 'wrong-password'
    };
    
    await act(async () => {
      await expect(result.current.login(credentials)).rejects.toThrow(errorMessage);
    });
    
    expect(authService.login).toHaveBeenCalledWith(credentials);
  });

  it('should signup successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    const credentials: SignupRequest = {
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    await act(async () => {
      await result.current.signup(credentials);
    });
    
    expect(authService.signup).toHaveBeenCalledWith(credentials);
  });

  it('should handle signup failure', async () => {
    const errorMessage = 'Email already exists';
    (authService.signup as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuth());
    
    const credentials: SignupRequest = {
      email: 'existing@example.com',
      password: 'password123',
      confirmPassword: 'password123'
    };
    
    await act(async () => {
      await expect(result.current.signup(credentials)).rejects.toThrow(errorMessage);
    });
    
    expect(authService.signup).toHaveBeenCalledWith(credentials);
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    await act(async () => {
      await result.current.logout();
    });
    
    expect(authService.logout).toHaveBeenCalled();
  });

  it('should check authentication status successfully', async () => {
    const { result } = renderHook(() => useAuth());
    
    let isAuthenticated = false;
    
    await act(async () => {
      isAuthenticated = await result.current.checkAuth();
    });
    
    expect(isAuthenticated).toBe(true);
    expect(authService.checkAuthStatus).toHaveBeenCalled();
  });

  it('should handle authentication check failure', async () => {
    (authService.checkAuthStatus as jest.Mock).mockRejectedValue(new Error('Token expired'));
    
    const { result } = renderHook(() => useAuth());
    
    let isAuthenticated = true;
    
    await act(async () => {
      isAuthenticated = await result.current.checkAuth();
    });
    
    expect(isAuthenticated).toBe(false);
    expect(authService.checkAuthStatus).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});