import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';

// Hooks
import { useAuth } from '../../hooks/useAuth';
import useForm from '../../hooks/useForm';

// Components
import TextInput from '../../components/forms/TextInput';
import Button from '../../components/buttons/Button';
import ErrorMessage from '../../components/common/ErrorMessage';

// Utilities and types
import { validateSignupForm } from '../../utils/validation.utils';
import { SignupRequest } from '../../types/auth.types';
import { AuthScreenProps } from '../../types/navigation.types';
import { AUTH_ROUTES } from '../../constants/navigation';
import NavigationService from '../../navigation/NavigationService';

/**
 * SignupScreen component that allows new users to create an account 
 * with email and password for the Health Advisor application.
 * 
 * Implements F-001-RQ-001: User signup with email and password requirement.
 */
const SignupScreen: React.FC<AuthScreenProps> = ({ navigation }) => {
  // Get authentication state and methods from useAuth hook
  const { signup, loading, error } = useAuth();
  
  // Initialize form with empty values
  const initialValues: SignupRequest = {
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  // Form submission handler
  async function onSubmit(formValues: SignupRequest): Promise<void> {
    try {
      await signup(formValues);
      // Navigation will be handled by the auth context after successful signup
    } catch (error) {
      // Error handling is done by the useAuth hook
      console.error('Signup error:', error);
    }
  }
  
  // Initialize form with validation and submission handler
  const { 
    values, 
    errors, 
    handleChange, 
    handleSubmit 
  } = useForm(
    initialValues,
    validateSignupForm,
    onSubmit
  );
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* App Title */}
        <Text style={styles.title}>Health Advisor</Text>
        
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.logo}
            accessibilityLabel="Health Advisor Logo"
          />
        </View>
        
        {/* Signup Form */}
        <View style={styles.formContainer}>
          <TextInput
            label="Email"
            value={values.email}
            onChangeText={handleChange('email')}
            placeholder="Enter your email"
            error={errors.email}
          />
          
          <TextInput
            label="Password"
            value={values.password}
            onChangeText={handleChange('password')}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />
          
          <TextInput
            label="Confirm Password"
            value={values.confirmPassword}
            onChangeText={handleChange('confirmPassword')}
            placeholder="Confirm your password"
            secureTextEntry
            error={errors.confirmPassword}
          />
          
          <Button
            label="Sign Up"
            onPress={handleSubmit}
            loading={loading}
            style={styles.submitButton}
          />
          
          {error && <ErrorMessage message={error} />}
        </View>
        
        {/* Login Link */}
        <View style={styles.loginLinkContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity 
            onPress={() => NavigationService.navigateToLogin()}
            accessibilityLabel="Log in"
            accessibilityHint="Navigate to login screen"
          >
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // COLORS.LIGHT.BACKGROUND
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333', // COLORS.LIGHT.TEXT
    marginBottom: 16,
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  submitButton: {
    marginTop: 24,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'center',
  },
  loginText: {
    color: '#333333', // COLORS.LIGHT.TEXT
  },
  loginLink: {
    color: '#4A90E2', // COLORS.LIGHT.PRIMARY
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignupScreen;