# User API

## Introduction

The User API provides endpoints for managing user profile information in the Health Advisor application. These endpoints allow users to retrieve their profile details and manage their account information. All user endpoints require authentication using a valid JWT token.

## Base URL

```
/api/users
```

## Authentication

All User API endpoints require authentication using JWT tokens.

- **Type**: JWT
- **Header Format**: `Authorization: Bearer {token}`
- **Requirement**: All User API endpoints require a valid JWT token obtained through the Authentication API.

## Endpoints

### Get Current User Profile

Retrieves the profile information of the currently authenticated user.

- **URL**: `/me`
- **Method**: `GET`
- **Authentication**: Required

#### Headers

| Name | Value | Description |
|------|-------|-------------|
| Authorization | Bearer {token} | JWT authentication token (required) |

#### Response

##### Success Response (200 OK)

- **Content-Type**: `application/json`

```json
{
  "id": "60d21b4667d0d8992e610c85",
  "email": "user@example.com",
  "createdAt": "2023-05-01T10:30:00.000Z"
}
```

###### Schema

| Field | Type | Description |
|-------|------|-------------|
| id | string | User ID |
| email | string | User email address |
| createdAt | string | ISO 8601 formatted date when the account was created |

##### Error Responses

###### 401 Unauthorized

- **Content-Type**: `application/json`

```json
{
  "error": "Authentication required",
  "type": "UNAUTHORIZED"
}
```

###### 404 Not Found

- **Content-Type**: `application/json`

```json
{
  "error": "User not found",
  "type": "USER_NOT_FOUND"
}
```

###### 500 Server Error

- **Content-Type**: `application/json`

```json
{
  "error": "Internal server error"
}
```

## Error Handling

### Error Response Format

```json
{
  "error": "Human-readable error message",
  "type": "Error type identifier (optional)",
  "details": "Additional error details (optional)"
}
```

### Common Errors

| Type | Status Code | Description |
|------|------------|-------------|
| UNAUTHORIZED | 401 | No token provided or authorization header missing |
| INVALID_TOKEN | 401 | Token is invalid or malformed |
| TOKEN_EXPIRED | 401 | Token has expired |
| USER_NOT_FOUND | 404 | User not found in the database |

## Data Models

### UserProfile

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier for the user |
| email | string | User's email address |
| createdAt | string | ISO 8601 formatted date when the account was created |

## Client Implementation Example

```typescript
import { getCurrentUser } from '../api/user.api';

const fetchUserProfile = async () => {
  try {
    const userProfile = await getCurrentUser();
    // Handle user profile data
    return userProfile;
  } catch (error) {
    // Handle error
    console.error('Failed to fetch user profile:', error);
    throw error;
  }
};
```

## Related Resources

- **Authentication API**: See [Authentication API](auth.md) for details on obtaining and managing authentication tokens.
- **Health Data API**: See [Health Data API](health.md) for endpoints related to managing user health data.
- **Chat API**: See [Chat API](chat.md) for endpoints related to LLM chat interactions.

## Security Considerations

- **Token Security**: Store tokens securely in AsyncStorage on the client side and never expose them in URLs
- **HTTPS Requirement**: All API requests must be made over HTTPS
- **Token Expiration**: Handle token expiration gracefully by redirecting to the login screen when a 401 response is received