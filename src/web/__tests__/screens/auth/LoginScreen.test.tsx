import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../../src/screens/auth/LoginScreen';
import { useAuth } from '../../../src/hooks/useAuth';
import useForm from '../../../src/hooks/useForm';
import { AUTH_ROUTES } from '../../../src/constants/navigation';
import { AuthContext } from '../../../src/contexts/AuthContext';

// Mock the useAuth hook
jest.mock('../../../src/hooks/useAuth', () => ({
  __esModule: true,
  useAuth: jest.fn()
}));

// Mock the useForm hook
jest.mock('../../../src/hooks/useForm', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('LoginScreen', () => {
  let mockNavigation;
  let mockLogin;
  let mockHandleChange;
  let mockHandleSubmit;

  beforeEach(() => {
    // Reset all mocks to ensure clean test environment
    jest.clearAllMocks();

    // Create a mock navigation object
    mockNavigation = {
      navigate: jest.fn()
    };

    // Mock the login function
    mockLogin = jest.fn();

    // Mock the useAuth hook to return controlled test values
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null
    });

    // Mock the useForm hook to return controlled test values
    mockHandleChange = jest.fn(() => jest.fn());
    mockHandleSubmit = jest.fn();
    (useForm as jest.Mock).mockReturnValue({
      values: { email: '', password: '' },
      errors: {},
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });
  });

  test('renders correctly', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Verify app title/logo is displayed
    expect(getByText('Health Advisor')).toBeTruthy();
    
    // Verify email input field is present
    expect(getByPlaceholderText('Enter your email')).toBeTruthy();
    
    // Verify password input field is present
    expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    
    // Verify login button is present
    expect(getByText('Log In')).toBeTruthy();
    
    // Verify signup link is present
    expect(getByText(/Don't have an account\?/)).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  test('validates form inputs', () => {
    // Mock form with validation errors
    (useForm as jest.Mock).mockReturnValue({
      values: { email: 'invalid', password: '123' },
      errors: { 
        email: 'Please enter a valid email address',
        password: 'Password must be at least 8 characters'
      },
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });
    
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Verify email validation error is displayed
    expect(getByText('Please enter a valid email address')).toBeTruthy();
    
    // Verify password validation error is displayed
    expect(getByText('Password must be at least 8 characters')).toBeTruthy();
  });

  test('submits form with valid credentials', async () => {
    // Mock login function to resolve successfully
    mockLogin.mockResolvedValue(undefined);
    
    // Mock form with valid values and no errors
    (useForm as jest.Mock).mockReturnValue({
      values: { email: 'test@example.com', password: 'Password123!' },
      errors: {},
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });
    
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Find and click the login button
    const loginButton = getByText('Log In');
    fireEvent.press(loginButton);
    
    // Verify handleSubmit was called
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  test('displays error message on login failure', () => {
    // Mock useAuth to return an error message
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Invalid credentials'
    });
    
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Verify error message is displayed
    expect(getByText('Invalid credentials')).toBeTruthy();
  });

  test('navigates to signup screen', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Find and click the signup link
    const signupLink = getByText('Sign Up');
    fireEvent.press(signupLink);
    
    // Verify navigation.navigate was called with the correct route
    expect(mockNavigation.navigate).toHaveBeenCalledWith(AUTH_ROUTES.SIGNUP);
  });

  test('shows loading indicator during authentication', () => {
    // Mock useAuth to return loading: true
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null
    });
    
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Verify that the login button is disabled during loading
    const loginButton = getByText('Log In');
    expect(loginButton.props.disabled).toBe(true);
  });
});