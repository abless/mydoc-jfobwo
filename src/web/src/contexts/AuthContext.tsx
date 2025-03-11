/**
 * Authentication Context Provider for the Health Advisor mobile application.
 * Manages user authentication state, provides login/signup/logout functionality,
 * and handles token persistence across app sessions.
 * 
 * Implements F-001: User Authentication requirements for email and password-based
 * authentication with JWT token implementation.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useMemo,
  useCallback
} from 'react'; // ^18.2.0

import {
  AuthState,
  AuthContextType,
  AuthActionType,
  AuthAction,
  LoginRequest,
  SignupRequest,
  UserResponse
} from '../types/auth.types';

import { authService } from '../services/auth.service';
import { getAuthToken, getUserInfo } from '../services/storage.service';
import { parseApiError, isAuthenticationError } from '../utils/error.utils';
import NavigationService from '../navigation/NavigationService';

// Initial authentication state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: true,
  error: null
};

/**
 * Reducer function for managing authentication state
 * 
 * @param state Current authentication state
 * @param action Action to perform on the state
 * @returns New authentication state
 */
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case AuthActionType.LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case AuthActionType.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case AuthActionType.LOGIN_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case AuthActionType.SIGNUP_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case AuthActionType.SIGNUP_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case AuthActionType.SIGNUP_FAILURE:
      return {
        ...state,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case AuthActionType.LOGOUT:
      return {
        ...initialState,
        loading: false
      };
    case AuthActionType.RESTORE_TOKEN:
      return {
        ...state,
        isAuthenticated: !!action.payload.token && !!action.payload.user,
        user: action.payload.user,
        token: action.payload.token,
        loading: false
      };
    default:
      return state;
  }
};

// Create the authentication context with a default value
const AuthContext = createContext<AuthContextType>({
  state: initialState,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  checkAuthStatus: async () => false
});

/**
 * Authentication Provider component that wraps the application to provide
 * authentication context and functionality.
 * 
 * @param props.children - Child components that will have access to the auth context
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Initializes the authentication state by checking for stored token and user data
   */
  const bootstrapAuthState = useCallback(async (): Promise<void> => {
    try {
      const token = await getAuthToken();
      const user = await getUserInfo();

      dispatch({
        type: AuthActionType.RESTORE_TOKEN,
        payload: { token, user }
      });

      // Set token for API requests if it exists
      if (token) {
        await authService.checkAuthStatus();
      }
    } catch (error) {
      console.error('Error bootstrapping auth state:', error);
      dispatch({
        type: AuthActionType.RESTORE_TOKEN,
        payload: { token: null, user: null }
      });
    }
  }, []);

  // Bootstrap authentication state on component mount
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      await bootstrapAuthState();

      // Navigate to the appropriate screen based on authentication status
      if (isMounted) {
        if (state.isAuthenticated) {
          NavigationService.navigateToMain();
        } else {
          NavigationService.navigateToAuth();
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [bootstrapAuthState, state.isAuthenticated]);

  /**
   * Authenticates a user with email and password
   * 
   * Implements F-001-RQ-002: User login with email and password
   * 
   * @param credentials - Object containing email and password
   */
  const login = useCallback(async (credentials: LoginRequest): Promise<void> => {
    dispatch({ type: AuthActionType.LOGIN_REQUEST });

    try {
      const authResponse = await authService.login(credentials);
      
      dispatch({
        type: AuthActionType.LOGIN_SUCCESS,
        payload: {
          user: authResponse.user,
          token: authResponse.token
        }
      });

      NavigationService.navigateToMain();
    } catch (error) {
      const parsedError = parseApiError(error);
      
      dispatch({
        type: AuthActionType.LOGIN_FAILURE,
        payload: parsedError.message
      });

      throw parsedError;
    }
  }, []);

  /**
   * Registers a new user with email and password
   * 
   * Implements F-001-RQ-001: User signup with email and password
   * 
   * @param credentials - Object containing email, password, and confirmPassword
   */
  const signup = useCallback(async (credentials: SignupRequest): Promise<void> => {
    dispatch({ type: AuthActionType.SIGNUP_REQUEST });

    try {
      const authResponse = await authService.signup(credentials);
      
      dispatch({
        type: AuthActionType.SIGNUP_SUCCESS,
        payload: {
          user: authResponse.user,
          token: authResponse.token
        }
      });

      NavigationService.navigateToMain();
    } catch (error) {
      const parsedError = parseApiError(error);
      
      dispatch({
        type: AuthActionType.SIGNUP_FAILURE,
        payload: parsedError.message
      });

      throw parsedError;
    }
  }, []);

  /**
   * Logs out the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: AuthActionType.LOGOUT });
      NavigationService.navigateToAuth();
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if there's an error, we should still clear the local state
      dispatch({ type: AuthActionType.LOGOUT });
      NavigationService.navigateToAuth();
    }
  }, []);

  /**
   * Checks if the user is authenticated by verifying stored token
   * 
   * @returns Promise that resolves with true if authenticated, false otherwise
   */
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    try {
      const isAuthenticated = await authService.checkAuthStatus();
      
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        const token = await getAuthToken();
        
        dispatch({
          type: AuthActionType.RESTORE_TOKEN,
          payload: { user, token }
        });
        
        return true;
      } else {
        dispatch({
          type: AuthActionType.RESTORE_TOKEN,
          payload: { user: null, token: null }
        });
        
        return false;
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      
      if (isAuthenticationError(error)) {
        await logout();
      }
      
      return false;
    }
  }, [logout]);

  // Create a memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      state,
      login,
      signup,
      logout,
      checkAuthStatus
    }),
    [state, login, signup, logout, checkAuthStatus]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook for accessing the authentication context
 * @returns Authentication context with state and methods
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Export the auth context for use in tests or special cases
export { AuthContext };