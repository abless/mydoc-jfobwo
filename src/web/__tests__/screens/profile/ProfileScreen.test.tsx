import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ProfileScreen from '../../../src/screens/profile/ProfileScreen';
import useAuth from '../../../src/hooks/useAuth';
import { formatDisplayDate } from '../../../src/utils/date.utils';

// Mock the necessary modules
jest.mock('../../../src/hooks/useAuth', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('react-native/Libraries/Alert/Alert', () => ({ alert: jest.fn() }));
jest.mock('../../../src/utils/date.utils', () => ({ formatDisplayDate: jest.fn() }));

describe('ProfileScreen', () => {
  // Setup variables used across tests
  const mockNavigation = { navigate: jest.fn() };
  const mockRoute = { key: '', name: 'Profile', params: {} };
  const mockUser = {
    id: '123',
    email: 'test@example.com',
    createdAt: '2023-01-01T00:00:00.000Z'
  };
  const mockLogout = jest.fn();
  
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup useAuth mock to return test values
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      logout: mockLogout
    });
    
    // Setup formatDisplayDate mock to return a predictable date string
    (formatDisplayDate as jest.Mock).mockReturnValue('Jan 1, 2023');
  });

  test('renders correctly with user information', () => {
    render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Verify that the profile header is displayed
    expect(screen.getByText('Profile')).toBeTruthy();
    
    // Verify that user's email is displayed
    expect(screen.getByText(mockUser.email)).toBeTruthy();
    
    // Verify that the account information section is displayed
    expect(screen.getByText('Account Information')).toBeTruthy();
    
    // Verify that the member since text is displayed
    expect(screen.getByText('Member since:')).toBeTruthy();
    
    // Verify that the logout button is present
    expect(screen.getByText('Log Out')).toBeTruthy();
  });

  test('shows loading indicator when loading', () => {
    // Mock loading state
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      logout: mockLogout
    });

    const { UNSAFE_getAllByType } = render(
      <ProfileScreen navigation={mockNavigation} route={mockRoute} />
    );
    
    // Check that the ActivityIndicator is present
    expect(UNSAFE_getAllByType('ActivityIndicator').length).toBeGreaterThan(0);
    
    // Check that user information is not displayed during loading
    expect(screen.queryByText(mockUser.email)).toBeNull();
    expect(screen.queryByText('Account Information')).toBeNull();
  });

  test('handles logout functionality', () => {
    const Alert = require('react-native/Libraries/Alert/Alert');
    
    render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Find and press the logout button
    const logoutButton = screen.getByText('Log Out');
    fireEvent.press(logoutButton);
    
    // Check that Alert.alert was called with the correct arguments
    expect(Alert.alert).toHaveBeenCalledWith(
      'Log Out',
      'Are you sure you want to log out?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel' }),
        expect.objectContaining({ text: 'Log Out', onPress: expect.any(Function) })
      ])
    );
    
    // Simulate pressing the "Log Out" button in the alert
    const alertButtons = Alert.alert.mock.calls[0][2];
    const logoutConfirmButton = alertButtons.find(button => button.text === 'Log Out');
    logoutConfirmButton.onPress();
    
    // Verify that the logout function was called
    expect(mockLogout).toHaveBeenCalled();
  });

  test('displays formatted date correctly', () => {
    render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Verify that the formatted date is displayed
    expect(screen.getByText('Jan 1, 2023')).toBeTruthy();
  });

  test('handles null user data gracefully', () => {
    // Mock null user data
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      logout: mockLogout
    });

    render(<ProfileScreen navigation={mockNavigation} route={mockRoute} />);
    
    // Verify that the component renders without crashing
    expect(screen.getByText('Profile')).toBeTruthy();
    
    // Verify that no user-specific information is displayed
    expect(screen.queryByText(mockUser.email)).toBeNull();
    
    // Verify that a placeholder is shown for missing data
    expect(screen.getByText('N/A')).toBeTruthy();
  });
});