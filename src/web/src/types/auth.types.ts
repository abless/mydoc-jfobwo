/**
 * Type definitions for authentication-related data structures.
 * Includes request/response interfaces, authentication state,
 * context types, and action types for the authentication reducer.
 */

/**
 * Interface for login request payload sent to the backend API
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface for signup request payload sent to the backend API
 */
export interface SignupRequest {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Interface for user data returned from the backend API
 */
export interface UserResponse {
  id: string;
  email: string;
}

/**
 * Interface for authentication response from the backend API
 */
export interface AuthResponse {
  token: string;
  user: UserResponse;
}

/**
 * Interface for authentication state in the application
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: UserResponse | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Interface for the authentication context providing state and methods
 */
export interface AuthContextType {
  state: AuthState;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (credentials: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<boolean>;
}

/**
 * Enum for authentication action types used in the reducer
 */
export enum AuthActionType {
  LOGIN_REQUEST = 'LOGIN_REQUEST',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  SIGNUP_REQUEST = 'SIGNUP_REQUEST',
  SIGNUP_SUCCESS = 'SIGNUP_SUCCESS',
  SIGNUP_FAILURE = 'SIGNUP_FAILURE',
  LOGOUT = 'LOGOUT',
  RESTORE_TOKEN = 'RESTORE_TOKEN'
}

/**
 * Union type for all possible authentication actions in the reducer
 */
export type AuthAction =
  | { type: AuthActionType.LOGIN_REQUEST }
  | { type: AuthActionType.LOGIN_SUCCESS; payload: { user: UserResponse; token: string } }
  | { type: AuthActionType.LOGIN_FAILURE; payload: string }
  | { type: AuthActionType.SIGNUP_REQUEST }
  | { type: AuthActionType.SIGNUP_SUCCESS; payload: { user: UserResponse; token: string } }
  | { type: AuthActionType.SIGNUP_FAILURE; payload: string }
  | { type: AuthActionType.LOGOUT }
  | { type: AuthActionType.RESTORE_TOKEN; payload: { user: UserResponse | null; token: string | null } };