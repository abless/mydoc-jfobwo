# Authentication API

## Introduction

The Health Advisor application uses JWT (JSON Web Token) based authentication to secure API endpoints. This document provides detailed information about the authentication endpoints, request/response formats, and error handling.

## Base URL

All authentication endpoints are accessible at `/api/authz`.

## Endpoints

### User Registration

Register a new user with email and password.

**Endpoint:** `POST /api/authz/signup`

#### Request

**Content Type:** `application/json`

**Schema:**
- `email` - string (required) - Valid email address
- `password` - string (required) - Password with minimum 8 characters, including at least one letter, one number, and one special character

**Example:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

#### Responses

**201 - User successfully created**

**Content Type:** `application/json`

**Schema:**
- `token` - string - JWT authentication token
- `user` - object
  - `id` - string - User ID
  - `email` - string - User email address

**Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com"
  }
}
```

**400 - Validation error**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message
- `details` - object - Validation error details

**Example:**
```json
{
  "error": "Validation Error",
  "details": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters long"
  }
}
```

**409 - Email already exists**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message
- `type` - string - Error type

**Example:**
```json
{
  "error": "Email already exists",
  "type": "EMAIL_EXISTS"
}
```

**500 - Server error**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message

**Example:**
```json
{
  "error": "Internal server error"
}
```

### User Login

Authenticate a user with email and password.

**Endpoint:** `POST /api/authz/login`

#### Request

**Content Type:** `application/json`

**Schema:**
- `email` - string (required) - User email address
- `password` - string (required) - User password

**Example:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

#### Responses

**200 - Authentication successful**

**Content Type:** `application/json`

**Schema:**
- `token` - string - JWT authentication token
- `user` - object
  - `id` - string - User ID
  - `email` - string - User email address

**Example:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com"
  }
}
```

**400 - Validation error**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message
- `details` - object - Validation error details

**Example:**
```json
{
  "error": "Validation Error",
  "details": {
    "email": "Email is required",
    "password": "Password is required"
  }
}
```

**401 - Authentication failed**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message
- `type` - string - Error type

**Example:**
```json
{
  "error": "Invalid email or password",
  "type": "INVALID_CREDENTIALS"
}
```

**500 - Server error**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message

**Example:**
```json
{
  "error": "Internal server error"
}
```

### Token Validation

Validate an authentication token.

**Endpoint:** `GET /api/authz/validate`

#### Request

**Headers:**
- `Authorization` - Bearer {token} (required) - JWT token to validate

#### Responses

**200 - Token is valid**

**Content Type:** `application/json`

**Schema:**
- `valid` - boolean - Token validity status
- `user` - object
  - `id` - string - User ID
  - `email` - string - User email address

**Example:**
```json
{
  "valid": true,
  "user": {
    "id": "60d21b4667d0d8992e610c85",
    "email": "user@example.com"
  }
}
```

**401 - Invalid or expired token**

**Content Type:** `application/json`

**Schema:**
- `error` - string - Error message
- `type` - string - Error type

**Example:**
```json
{
  "error": "Invalid token",
  "type": "INVALID_TOKEN"
}
```

## Authentication

### JWT Authentication

The Health Advisor application uses JSON Web Tokens (JWT) for authentication.

**Token Format:**
- `Bearer {token}`

**Token Lifetime:**
- 1 hour

**Header Format:**
- `Authorization: Bearer {token}`

**Token Structure (Payload):**
- `userId` - string - User ID
- `email` - string - User email address
- `iat` - number - Issued at timestamp
- `exp` - number - Expiration timestamp

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "type": "Error type identifier (optional)",
  "details": "Additional error details (optional)"
}
```

### Common Error Types

| Type | Status Code | Description |
|------|-------------|-------------|
| INVALID_CREDENTIALS | 401 | Email or password is incorrect |
| EMAIL_EXISTS | 409 | Email address is already registered |
| INVALID_TOKEN | 401 | Token is invalid or malformed |
| TOKEN_EXPIRED | 401 | Token has expired |
| UNAUTHORIZED | 401 | No token provided or authorization header missing |

## Security Considerations

### Password Requirements
- Minimum 8 characters with at least one letter, one number, and one special character

### Rate Limiting
- 5 failed login attempts within 1 minute will trigger a temporary account lockout

### Token Security
- Store tokens securely in AsyncStorage on the client side and never expose them in URLs

### HTTPS Requirement
- All authentication requests must be made over HTTPS

## Client Implementation Examples

### Login Example

```typescript
import { login } from '../api/auth.api';

const handleLogin = async (email: string, password: string) => {
  try {
    const response = await login({ email, password });
    // Store token and user info
    return response;
  } catch (error) {
    // Handle authentication error
    console.error('Login failed:', error);
    throw error;
  }
};
```

### Signup Example

```typescript
import { signup } from '../api/auth.api';

const handleSignup = async (email: string, password: string, confirmPassword: string) => {
  try {
    const response = await signup({ email, password, confirmPassword });
    // Store token and user info
    return response;
  } catch (error) {
    // Handle registration error
    console.error('Signup failed:', error);
    throw error;
  }
};
```

### Token Usage Example

```typescript
import { apiService } from '../services/api.service';

// Set token for all subsequent requests
const setAuthToken = (token: string) => {
  apiService.setAuthToken(token);
};

// Clear token on logout
const clearAuthToken = () => {
  apiService.clearAuthToken();
};
```