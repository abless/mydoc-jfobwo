import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react-native'; // ^12.0.0
import { View, Text, TouchableOpacity } from 'react-native';

import { AuthContext, AuthProvider, useAuth } from '../../src/contexts/AuthContext';
import { LoginRequest, SignupRequest, UserResponse } from '../../src/types/auth.types';
import { authService } from '../../src/services/auth.service';
import { getAuthToken, getUserInfo } from '../../src/services/storage.service';
import NavigationService from '../../src/navigation/NavigationService';

// Mock the services
jest.mock('../../src/services/auth.service');
jest.mock('../../src/services/storage.service');
jest.mock('../../src/navigation/NavigationService');

// Setup function to reset mocks before each test
const setup = () => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup default mock implementations
  (authService.login as jest.Mock).mockResolvedValue({ token: 'test-token', user: { id: '123', email: 'test@example.com' } });
  (authService.signup as jest.Mock).mockResolvedValue({ token: 'test-token', user: { id: '123', email: 'test@example.com' } });
  (authService.logout as jest.Mock).mockResolvedValue(undefined);
  (authService.checkAuthStatus as jest.Mock).mockResolvedValue(false);
  (authService.getCurrentUser as jest.Mock).mockResolvedValue(null);
  
  (getAuthToken as jest.Mock).mockResolvedValue(null);
  (getUserInfo as jest.Mock).mockResolvedValue(null);
  
  (NavigationService.navigateToAuth as jest.Mock).mockImplementation(() => {});
  (NavigationService.navigateToMain as jest.Mock).mockImplementation(() => {});
};

// Helper function to render a component with AuthProvider
const renderWithAuthProvider = (children: React.ReactNode) => {
  return render(<AuthProvider>{children}</AuthProvider>);
};

// Test component that uses the useAuth hook
const TestComponent = () => {
  const { state, login, signup, logout, checkAuthStatus } = useAuth();
  
  return (
    <View>
      <Text testID="auth-state">
        {state.isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
      </Text>
      <Text testID="user-data">{state.user ? JSON.stringify(state.user) : 'No user'}</Text>
      <Text testID="token-data">{state.token || 'No token'}</Text>
      <Text testID="loading-state">{state.loading ? 'Loading' : 'Not Loading'}</Text>
      <Text testID="error-state">{state.error || 'No error'}</Text>
      
      <TouchableOpacity
        testID="login-button"
        onPress={() => login({ email: 'test@example.com', password: 'password123' })}
      >
        <Text>Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        testID="signup-button"
        onPress={() => signup({
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        })}
      >
        <Text>Signup</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        testID="logout-button"
        onPress={() => logout()}
      >
        <Text>Logout</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        testID="check-auth-button"
        onPress={() => checkAuthStatus()}
      >
        <Text>Check Auth</Text>
      </TouchableOpacity>
    </View>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    setup();
  });
  
  it('should initialize with default unauthenticated state', async () => {
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Verify initial state
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('No user');
    expect(screen.getByTestId('token-data')).toHaveTextContent('No token');
    expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
  });
  
  it('should handle successful login', async () => {
    // Setup mock for successful login
    const userResponse = { id: '123', email: 'test@example.com' };
    const tokenResponse = 'test-token';
    (authService.login as jest.Mock).mockResolvedValue({ 
      token: tokenResponse, 
      user: userResponse 
    });
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    fireEvent.press(screen.getByTestId('login-button'));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({ 
        email: 'test@example.com', 
        password: 'password123' 
      });
    });
    
    // Verify state updates
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent(JSON.stringify(userResponse));
    expect(screen.getByTestId('token-data')).toHaveTextContent(tokenResponse);
    expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
    
    // Verify navigation
    expect(NavigationService.navigateToMain).toHaveBeenCalled();
  });
  
  it('should handle login failure', async () => {
    // Setup mock for failed login
    const errorMessage = 'Invalid credentials';
    (authService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Click login button
    fireEvent.press(screen.getByTestId('login-button'));
    
    // Wait for login failure to be processed
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalled();
    });
    
    // Verify error state
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('error-state')).toHaveTextContent(errorMessage);
    
    // Verify navigation was not called
    expect(NavigationService.navigateToMain).not.toHaveBeenCalled();
  });
  
  it('should handle successful signup', async () => {
    // Setup mock for successful signup
    const userResponse = { id: '123', email: 'test@example.com' };
    const tokenResponse = 'test-token';
    (authService.signup as jest.Mock).mockResolvedValue({ 
      token: tokenResponse, 
      user: userResponse 
    });
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Click signup button
    fireEvent.press(screen.getByTestId('signup-button'));
    
    // Wait for signup to complete
    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith({ 
        email: 'test@example.com', 
        password: 'password123',
        confirmPassword: 'password123'
      });
    });
    
    // Verify state updates
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent(JSON.stringify(userResponse));
    expect(screen.getByTestId('token-data')).toHaveTextContent(tokenResponse);
    expect(screen.getByTestId('error-state')).toHaveTextContent('No error');
    
    // Verify navigation
    expect(NavigationService.navigateToMain).toHaveBeenCalled();
  });
  
  it('should handle signup failure', async () => {
    // Setup mock for failed signup
    const errorMessage = 'Email already exists';
    (authService.signup as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Click signup button
    fireEvent.press(screen.getByTestId('signup-button'));
    
    // Wait for signup failure to be processed
    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalled();
    });
    
    // Verify error state
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('error-state')).toHaveTextContent(errorMessage);
    
    // Verify navigation was not called
    expect(NavigationService.navigateToMain).not.toHaveBeenCalled();
  });
  
  it('should handle logout', async () => {
    // First set authenticated state
    const userResponse = { id: '123', email: 'test@example.com' };
    const tokenResponse = 'test-token';
    (authService.login as jest.Mock).mockResolvedValue({ 
      token: tokenResponse, 
      user: userResponse 
    });
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for initial loading state to resolve
    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent('Not Loading');
    });
    
    // Login first
    fireEvent.press(screen.getByTestId('login-button'));
    
    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    });
    
    // Now logout
    fireEvent.press(screen.getByTestId('logout-button'));
    
    // Wait for logout to complete
    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });
    
    // Verify state resets
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('No user');
    expect(screen.getByTestId('token-data')).toHaveTextContent('No token');
    
    // Verify navigation
    expect(NavigationService.navigateToAuth).toHaveBeenCalled();
  });
  
  it('should restore authentication state on mount', async () => {
    // Setup mocks for stored token and user
    const storedToken = 'stored-token';
    const storedUser = { id: '123', email: 'stored@example.com' };
    (getAuthToken as jest.Mock).mockResolvedValue(storedToken);
    (getUserInfo as jest.Mock).mockResolvedValue(storedUser);
    (authService.checkAuthStatus as jest.Mock).mockResolvedValue(true);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for auth state to be restored
    await waitFor(() => {
      expect(authService.checkAuthStatus).toHaveBeenCalled();
    });
    
    // Verify state is restored
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent(JSON.stringify(storedUser));
    expect(screen.getByTestId('token-data')).toHaveTextContent(storedToken);
  });
  
  it('should handle authentication restoration failure', async () => {
    // Setup mocks for stored token and user but with failed validation
    const storedToken = 'stored-token';
    const storedUser = { id: '123', email: 'stored@example.com' };
    (getAuthToken as jest.Mock).mockResolvedValue(storedToken);
    (getUserInfo as jest.Mock).mockResolvedValue(storedUser);
    (authService.checkAuthStatus as jest.Mock).mockResolvedValue(false);
    
    renderWithAuthProvider(<TestComponent />);
    
    // Wait for auth state check to complete
    await waitFor(() => {
      expect(authService.checkAuthStatus).toHaveBeenCalled();
    });
    
    // Verify state remains unauthenticated
    expect(screen.getByTestId('auth-state')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('user-data')).toHaveTextContent('No user');
    expect(screen.getByTestId('token-data')).toHaveTextContent('No token');
  });
  
  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Mock console.error to prevent output during test
    const originalConsoleError = console.error;
    console.error = jest.fn();
    
    // Expect error when rendering TestComponent without AuthProvider
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    // Restore console.error
    console.error = originalConsoleError;
  });
});