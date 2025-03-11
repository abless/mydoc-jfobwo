import { device, element, by, expect, waitFor } from 'detox'; // detox ^20.0.0

// Test credentials and invalid input constants
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Password123!';
const INVALID_EMAIL = 'invalid-email';
const WEAK_PASSWORD = 'weak';
const MISMATCHED_PASSWORDS = {
  password: 'Password123!',
  confirmPassword: 'Password456!'
};

/**
 * Setup function that runs before all tests
 */
beforeAll(async () => {
  await device.launchApp();
  // Ensure the app is in a clean state for testing
});

/**
 * Setup function that runs before each test
 */
beforeEach(async () => {
  await device.reloadReactNative();
  await ensureLoggedOut();
});

/**
 * Cleanup function that runs after all tests
 */
afterAll(async () => {
  // Clean up any test accounts created during tests
  // Reset the app to its initial state
});

/**
 * Helper function to ensure the user is logged out
 */
async function ensureLoggedOut(): Promise<void> {
  try {
    // Check if profile tab exists (indicating user is logged in)
    const profileTab = element(by.id('profileTab'));
    const isVisible = await profileTab.isVisible();
    
    if (isVisible) {
      // Navigate to profile screen
      await profileTab.tap();
      
      // Find and tap logout button
      const logoutButton = element(by.id('logoutButton'));
      await logoutButton.tap();
      
      // Confirm logout if confirmation dialog appears
      try {
        const confirmLogoutButton = element(by.text('Confirm'));
        await confirmLogoutButton.tap();
      } catch (error) {
        // Confirmation dialog might not appear, ignore error
      }
      
      // Wait for login screen
      await waitFor(element(by.id('loginScreen')))
        .toBeVisible()
        .withTimeout(5000);
    }
  } catch (error) {
    // If profile tab doesn't exist, user is already logged out
  }
}

/**
 * Helper function to navigate to the login screen
 */
async function navigateToLoginScreen(): Promise<void> {
  try {
    await waitFor(element(by.id('loginScreen')))
      .toBeVisible()
      .withTimeout(1000);
  } catch (error) {
    // If not on login screen, ensure logged out
    await ensureLoggedOut();
  }
}

/**
 * Helper function to navigate to the signup screen
 */
async function navigateToSignupScreen(): Promise<void> {
  await navigateToLoginScreen();
  
  // Tap on the signup link
  const signupLink = element(by.id('signupLink'));
  await signupLink.tap();
  
  // Wait for signup screen to appear
  await waitFor(element(by.id('signupScreen')))
    .toBeVisible()
    .withTimeout(2000);
}

/**
 * Helper function to fill the login form
 */
async function fillLoginForm(email: string, password: string): Promise<void> {
  const emailInput = element(by.id('emailInput'));
  const passwordInput = element(by.id('passwordInput'));
  
  await emailInput.clearText();
  await emailInput.typeText(email);
  await passwordInput.clearText();
  await passwordInput.typeText(password);
}

/**
 * Helper function to fill the signup form
 */
async function fillSignupForm(email: string, password: string, confirmPassword: string): Promise<void> {
  const emailInput = element(by.id('emailInput'));
  const passwordInput = element(by.id('passwordInput'));
  const confirmPasswordInput = element(by.id('confirmPasswordInput'));
  
  await emailInput.clearText();
  await emailInput.typeText(email);
  await passwordInput.clearText();
  await passwordInput.typeText(password);
  await confirmPasswordInput.clearText();
  await confirmPasswordInput.typeText(confirmPassword);
}

/**
 * Helper function to submit the login form
 */
async function submitLoginForm(): Promise<void> {
  const loginButton = element(by.id('loginButton'));
  await loginButton.tap();
}

/**
 * Helper function to submit the signup form
 */
async function submitSignupForm(): Promise<void> {
  const signupButton = element(by.id('signupButton'));
  await signupButton.tap();
}

/**
 * Helper function to verify that the user is logged in
 */
async function verifyLoggedIn(): Promise<void> {
  // Wait for main app screen to be visible
  await waitFor(element(by.id('bottomTabNavigator')))
    .toBeVisible()
    .withTimeout(5000);
  
  // Verify that the main app tabs are visible
  await expect(element(by.id('chatTab'))).toBeVisible();
  await expect(element(by.id('profileTab'))).toBeVisible();
}

/**
 * Helper function to verify that a validation error is displayed
 */
async function verifyValidationError(errorMessage: string): Promise<void> {
  // Wait for error message to be visible
  await waitFor(element(by.text(errorMessage)))
    .toBeVisible()
    .withTimeout(2000);
}

describe('Login Screen', () => {
  it('should display login screen with all elements', async () => {
    await navigateToLoginScreen();
    
    await expect(element(by.id('appLogo'))).toBeVisible();
    await expect(element(by.id('emailInput'))).toBeVisible();
    await expect(element(by.id('passwordInput'))).toBeVisible();
    await expect(element(by.id('loginButton'))).toBeVisible();
    await expect(element(by.id('signupLink'))).toBeVisible();
  });
  
  it('should navigate to signup screen when signup link is tapped', async () => {
    await navigateToLoginScreen();
    await element(by.id('signupLink')).tap();
    
    await expect(element(by.id('signupScreen'))).toBeVisible();
    await expect(element(by.id('confirmPasswordInput'))).toBeVisible();
  });
  
  it('should show validation error for invalid email', async () => {
    await navigateToLoginScreen();
    await fillLoginForm(INVALID_EMAIL, TEST_PASSWORD);
    await submitLoginForm();
    
    await verifyValidationError('Please enter a valid email address');
  });
  
  it('should show validation error for empty password', async () => {
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, '');
    await submitLoginForm();
    
    await verifyValidationError('Password is required');
  });
  
  it('should show authentication error for incorrect credentials', async () => {
    await navigateToLoginScreen();
    // Use a valid email format but with a random string to ensure it doesn't exist
    const nonExistentEmail = `test${Date.now()}@example.com`;
    await fillLoginForm(nonExistentEmail, TEST_PASSWORD);
    await submitLoginForm();
    
    await verifyValidationError('Invalid email or password');
  });
  
  it('should login successfully with valid credentials', async () => {
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await submitLoginForm();
    
    // Expect loading state first
    await expect(element(by.id('loginButtonLoading'))).toBeVisible();
    
    // Then expect to be logged in
    await verifyLoggedIn();
  });
  
  it('should show loading state during authentication', async () => {
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await submitLoginForm();
    
    // Verify loading indicator appears
    await expect(element(by.id('loginButtonLoading'))).toBeVisible();
    
    // Wait for login to complete
    await verifyLoggedIn();
    
    // Verify loading indicator is gone
    await expect(element(by.id('loginButtonLoading'))).not.toBeVisible();
  });
});

describe('Signup Screen', () => {
  it('should display signup screen with all elements', async () => {
    await navigateToSignupScreen();
    
    await expect(element(by.id('appLogo'))).toBeVisible();
    await expect(element(by.id('emailInput'))).toBeVisible();
    await expect(element(by.id('passwordInput'))).toBeVisible();
    await expect(element(by.id('confirmPasswordInput'))).toBeVisible();
    await expect(element(by.id('signupButton'))).toBeVisible();
    await expect(element(by.id('loginLink'))).toBeVisible();
  });
  
  it('should navigate to login screen when login link is tapped', async () => {
    await navigateToSignupScreen();
    await element(by.id('loginLink')).tap();
    
    await expect(element(by.id('loginScreen'))).toBeVisible();
    await expect(element(by.id('confirmPasswordInput'))).not.toBeVisible();
  });
  
  it('should show validation error for invalid email', async () => {
    await navigateToSignupScreen();
    await fillSignupForm(INVALID_EMAIL, TEST_PASSWORD, TEST_PASSWORD);
    await submitSignupForm();
    
    await verifyValidationError('Please enter a valid email address');
  });
  
  it('should show validation error for weak password', async () => {
    await navigateToSignupScreen();
    await fillSignupForm(TEST_EMAIL, WEAK_PASSWORD, WEAK_PASSWORD);
    await submitSignupForm();
    
    await verifyValidationError('Password must be at least 8 characters');
  });
  
  it('should show validation error for mismatched passwords', async () => {
    await navigateToSignupScreen();
    await fillSignupForm(
      TEST_EMAIL, 
      MISMATCHED_PASSWORDS.password, 
      MISMATCHED_PASSWORDS.confirmPassword
    );
    await submitSignupForm();
    
    await verifyValidationError('Passwords do not match');
  });
  
  it('should show error for existing email', async () => {
    await navigateToSignupScreen();
    await fillSignupForm(TEST_EMAIL, TEST_PASSWORD, TEST_PASSWORD);
    await submitSignupForm();
    
    await verifyValidationError('An account with this email already exists');
  });
  
  it('should register successfully with valid information', async () => {
    await navigateToSignupScreen();
    
    // Generate a unique email to ensure registration success
    const uniqueEmail = `test${Date.now()}@example.com`;
    await fillSignupForm(uniqueEmail, TEST_PASSWORD, TEST_PASSWORD);
    await submitSignupForm();
    
    // Expect loading state first
    await expect(element(by.id('signupButtonLoading'))).toBeVisible();
    
    // Then expect to be logged in
    await verifyLoggedIn();
  });
  
  it('should show loading state during registration', async () => {
    await navigateToSignupScreen();
    
    // Generate a unique email
    const uniqueEmail = `test${Date.now() + 1}@example.com`;
    await fillSignupForm(uniqueEmail, TEST_PASSWORD, TEST_PASSWORD);
    await submitSignupForm();
    
    // Verify loading indicator appears
    await expect(element(by.id('signupButtonLoading'))).toBeVisible();
    
    // Wait for registration and login to complete
    await verifyLoggedIn();
    
    // Verify loading indicator is gone
    await expect(element(by.id('signupButtonLoading'))).not.toBeVisible();
  });
});

describe('Authentication Flow', () => {
  it('should maintain authentication state after app restart', async () => {
    // Login with valid credentials
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await submitLoginForm();
    await verifyLoggedIn();
    
    // Restart app
    await device.launchApp({ newInstance: false });
    
    // Verify still logged in
    await verifyLoggedIn();
  });
  
  it('should logout successfully', async () => {
    // Login with valid credentials
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    await submitLoginForm();
    await verifyLoggedIn();
    
    // Navigate to profile and logout
    await element(by.id('profileTab')).tap();
    await element(by.id('logoutButton')).tap();
    
    // Verify logged out - login screen should be visible
    await expect(element(by.id('loginScreen'))).toBeVisible();
    
    // Restart app and verify still logged out
    await device.launchApp({ newInstance: false });
    await expect(element(by.id('loginScreen'))).toBeVisible();
  });
  
  it('should handle network errors gracefully during login', async () => {
    // Note: In a real implementation, you would need to use device-specific
    // methods to toggle network connectivity or mock network responses
    
    // Simulate network disconnection
    // For testing purposes, we'll check for a network error message
    await navigateToLoginScreen();
    await fillLoginForm(TEST_EMAIL, TEST_PASSWORD);
    
    // Mock network error by enabling airplane mode
    // This is a placeholder - implementation depends on testing environment
    try {
      // This API may not be available in all Detox environments
      // await device.setStatusBar({ network: 'airplane' });
    } catch (error) {
      console.log('Unable to set airplane mode, continuing test with simulation');
    }
    
    await submitLoginForm();
    
    // Check for network error message
    await verifyValidationError('Network error');
    
    // Simulate network reconnection
    try {
      // await device.setStatusBar({ network: 'wifi' });
    } catch (error) {
      console.log('Unable to reset network mode, continuing test with simulation');
    }
    
    // Find and tap retry button
    await element(by.id('retryButton')).tap();
    
    // Verify login succeeds
    await verifyLoggedIn();
  });
  
  it('should handle network errors gracefully during signup', async () => {
    // Similar to the login network error test
    await navigateToSignupScreen();
    const uniqueEmail = `test${Date.now() + 2}@example.com`;
    await fillSignupForm(uniqueEmail, TEST_PASSWORD, TEST_PASSWORD);
    
    // Mock network error
    try {
      // await device.setStatusBar({ network: 'airplane' });
    } catch (error) {
      console.log('Unable to set airplane mode, continuing test with simulation');
    }
    
    await submitSignupForm();
    
    // Check for network error message
    await verifyValidationError('Network error');
    
    // Restore network
    try {
      // await device.setStatusBar({ network: 'wifi' });
    } catch (error) {
      console.log('Unable to reset network mode, continuing test with simulation');
    }
    
    // Find and tap retry button
    await element(by.id('retryButton')).tap();
    
    // Verify signup succeeds
    await verifyLoggedIn();
  });
});