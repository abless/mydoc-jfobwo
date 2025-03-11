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
import LoadingIndicator from '../../components/common/LoadingIndicator';

// Utils and types
import { validateLoginForm } from '../../utils/validation.utils';
import { LoginRequest } from '../../types/auth.types';
import { AuthScreenProps } from '../../types/navigation.types';
import { AUTH_ROUTES } from '../../constants/navigation';

// Constants and theme
import { COLORS } from '../../constants/colors';
import { spacing, typography } from '../../theme';

/**
 * Login screen component for the Health Advisor mobile application that
 * allows users to authenticate with their email and password.
 * 
 * Implements F-001-RQ-002: User login with email and password requirement.
 * 
 * @param props - Component props including navigation
 * @returns Rendered LoginScreen component
 */
const LoginScreen: React.FC<AuthScreenProps<'Login'>> = ({ navigation }) => {
  // Get authentication methods and state from auth hook
  const { login, loading, error } = useAuth();

  // Initialize form with validation
  const initialValues: LoginRequest = { email: '', password: '' };
  const { 
    values, 
    errors, 
    handleChange, 
    handleSubmit 
  } = useForm(
    initialValues,
    validateLoginForm,
    handleLogin
  );

  /**
   * Handle form submission for login
   * @param formValues - The form values to submit
   */
  async function handleLogin(formValues: LoginRequest) {
    try {
      await login(formValues);
      // On successful login, navigation is handled by AuthContext
    } catch (err) {
      // Form-specific errors are handled by the form hook
      console.error('Login error:', err);
    }
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 30}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        accessibilityLabel="Login form"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Health Advisor</Text>
        </View>

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
            secureTextEntry={true}
            error={errors.password}
          />

          {error && <ErrorMessage message={error} />}

          <Button
            label="Log In"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity 
            style={styles.signupContainer}
            onPress={() => navigation.navigate(AUTH_ROUTES.SIGNUP)}
            accessibilityRole="button"
            accessibilityLabel="Sign Up"
            accessibilityHint="Navigate to sign up screen"
          >
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT.BACKGROUND,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.m,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: COLORS.LIGHT.PRIMARY,
    marginTop: spacing.s,
  },
  formContainer: {
    width: '100%',
  },
  loginButton: {
    marginTop: spacing.m,
  },
  signupContainer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  signupText: {
    fontSize: typography.fontSize.m,
    color: COLORS.LIGHT.TEXT,
  },
  signupLink: {
    color: COLORS.LIGHT.PRIMARY,
    fontWeight: 'bold',
  }
});

export default LoginScreen;