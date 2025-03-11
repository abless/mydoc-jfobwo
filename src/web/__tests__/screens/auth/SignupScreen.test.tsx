import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import SignupScreen from '../../../src/screens/auth/SignupScreen';
import { AUTH_ROUTES } from '../../../src/constants/navigation';
import { validateSignupForm } from '../../../src/utils/validation.utils';

// Mock the hooks and navigation service
jest.mock('../../../src/hooks/useAuth', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../src/hooks/useForm', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('../../../src/navigation/NavigationService', () => ({ __esModule: true, default: { navigateToLogin: jest.fn() } }));

// Import mocked modules after mocking
import useAuth from '../../../src/hooks/useAuth';
import useForm from '../../../src/hooks/useForm';
import NavigationService from '../../../src/navigation/NavigationService';

describe('SignupScreen', () => {
  // Common test variables
  const mockNavigation = { navigate: jest.fn() };
  const mockSignup = jest.fn();
  const mockHandleChange = jest.fn();
  const mockHandleSubmit = jest.fn();
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useAuth hook
    (useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
      loading: false,
      error: null
    });
    
    // Mock useForm hook
    (useForm as jest.Mock).mockReturnValue({
      values: {
        email: '',
        password: '',
        confirmPassword: '',
      },
      errors: {},
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });
  });

  test('renders correctly', () => {
    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Check that all required elements are displayed
    expect(screen.getByText('Health Advisor')).toBeTruthy();
    expect(screen.getByLabelText('Health Advisor Logo')).toBeTruthy();
    expect(screen.getByLabelText('Email')).toBeTruthy();
    expect(screen.getByLabelText('Password')).toBeTruthy();
    expect(screen.getByLabelText('Confirm Password')).toBeTruthy();
    expect(screen.getByText('Sign Up')).toBeTruthy();
    expect(screen.getByText('Already have an account?')).toBeTruthy();
    expect(screen.getByText('Log In')).toBeTruthy();
  });

  test('validates form inputs', () => {
    // Mock form with validation errors
    (useForm as jest.Mock).mockReturnValue({
      values: {
        email: 'invalid-email',
        password: 'short',
        confirmPassword: 'different',
      },
      errors: {
        email: 'Please enter a valid email address',
        password: 'Password must be at least 8 characters',
        confirmPassword: 'Passwords do not match',
      },
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });

    render(<SignupScreen navigation={mockNavigation as any} />);

    // Verify that error messages are displayed
    expect(screen.getByText('Please enter a valid email address')).toBeTruthy();
    expect(screen.getByText('Password must be at least 8 characters')).toBeTruthy();
    expect(screen.getByText('Passwords do not match')).toBeTruthy();

    // Mock form with corrected values
    (useForm as jest.Mock).mockReturnValue({
      values: {
        email: 'valid@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
      errors: {},
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });

    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Verify that no error messages are displayed
    expect(screen.queryByText('Please enter a valid email address')).toBeNull();
    expect(screen.queryByText('Password must be at least 8 characters')).toBeNull();
    expect(screen.queryByText('Passwords do not match')).toBeNull();
  });

  test('submits form with valid credentials', async () => {
    // Mock successful signup
    mockSignup.mockResolvedValue(undefined);

    // Mock form with valid values
    (useForm as jest.Mock).mockReturnValue({
      values: {
        email: 'test@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
      },
      errors: {},
      handleChange: mockHandleChange,
      handleSubmit: mockHandleSubmit
    });

    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Find and click the signup button
    const signupButton = screen.getByText('Sign Up');
    fireEvent.press(signupButton);

    // Verify form submission
    expect(mockHandleSubmit).toHaveBeenCalled();
    
    // Simulate the form submission calling onSubmit
    const { onSubmit } = useForm.mock.calls[0][2];
    await onSubmit({
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });

    // Verify signup was called with correct credentials
    expect(mockSignup).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!'
    });
  });

  test('displays error message on signup failure', async () => {
    // Mock signup failure
    const errorMessage = 'Email already exists';
    mockSignup.mockRejectedValue(new Error(errorMessage));
    
    // Mock useAuth with error
    (useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
      loading: false,
      error: errorMessage
    });

    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Verify error message is displayed
    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  test('validates password confirmation', () => {
    // Mock validateSignupForm to simulate different passwords
    const mockValidateSignupForm = jest.fn().mockReturnValue({
      confirmPassword: 'Passwords do not match'
    });
    
    // Use the real validateSignupForm for implementation details
    const realValidateSignupForm = validateSignupForm;
    
    (useForm as jest.Mock).mockImplementation((initialValues, validateFn, onSubmit) => {
      // Return the form with validation errors
      return {
        values: {
          email: 'test@example.com',
          password: 'Password123!',
          confirmPassword: 'DifferentPassword!',
        },
        errors: {
          confirmPassword: 'Passwords do not match'
        },
        handleChange: mockHandleChange,
        handleSubmit: () => {
          const errors = realValidateSignupForm({
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'DifferentPassword!'
          });
          if (errors.confirmPassword) {
            // Don't submit if passwords don't match
            return;
          }
          onSubmit({
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'DifferentPassword!'
          });
        }
      };
    });

    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Find and click the signup button
    const signupButton = screen.getByText('Sign Up');
    fireEvent.press(signupButton);
    
    // Verify error message is displayed
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    
    // Verify signup was not called due to validation error
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('navigates to login screen', () => {
    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Find and click the login link
    const loginLink = screen.getByText('Log In');
    fireEvent.press(loginLink);
    
    // Verify navigation was called
    expect(NavigationService.navigateToLogin).toHaveBeenCalled();
  });

  test('shows loading indicator during authentication', () => {
    // Mock useAuth with loading state
    (useAuth as jest.Mock).mockReturnValue({
      signup: mockSignup,
      loading: true,
      error: null
    });

    render(<SignupScreen navigation={mockNavigation as any} />);
    
    // Verify loading indicator is displayed
    expect(screen.getByLabelText('Loading content')).toBeTruthy();
    
    // Verify signup button is disabled during loading
    const signupButton = screen.getByText('Sign Up');
    expect(signupButton.props.accessibilityState.disabled).toBe(true);
  });
});