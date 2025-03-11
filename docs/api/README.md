# Health Advisor API Documentation

Welcome to the Health Advisor API documentation. This documentation provides comprehensive information about the RESTful API endpoints available for integrating with the Health Advisor application.

## API Overview

The Health Advisor API is organized into the following main sections:

- [Authentication API](auth.md) - Endpoints for user registration, login, and token management
- [Health Data API](health.md) - Endpoints for managing health data including meals, lab results, and symptoms
- [Chat API](chat.md) - Endpoints for interacting with the LLM health advisor and managing conversations
- [User Profile API](user.md) - Endpoints for retrieving and managing user profile information

## Base URL

All API requests should be made to the following base URL:

```
https://api.healthadvisor.com
```

## Authentication

Most API endpoints require authentication using JSON Web Tokens (JWT). After registering or logging in through the Authentication API, you will receive a JWT token that must be included in the Authorization header of subsequent requests:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*Note: See the [Authentication API](auth.md) documentation for detailed information on obtaining and using JWT tokens.*

## Response Format

All API responses follow a consistent format:

### Success Response

Successful responses include a success flag set to true and the requested data:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Error Response

Error responses include a success flag set to false, null data, and error details:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": null or object with additional details
  }
}
```

## HTTP Status Codes

The API uses standard HTTP status codes to indicate the success or failure of requests:

| Status Code | Description |
|-------------|-------------|
| 200 OK | The request was successful |
| 201 Created | A new resource was successfully created |
| 204 No Content | The request was successful but returns no content (e.g., after deletion) |
| 400 Bad Request | The request was invalid or cannot be served |
| 401 Unauthorized | Authentication is required or the provided credentials are invalid |
| 403 Forbidden | The authenticated user does not have permission to access the requested resource |
| 404 Not Found | The requested resource does not exist |
| 413 Payload Too Large | The request payload (e.g., file upload) exceeds the maximum allowed size |
| 415 Unsupported Media Type | The request contains an unsupported file format |
| 429 Too Many Requests | Rate limit exceeded |
| 500 Internal Server Error | An unexpected error occurred on the server |
| 503 Service Unavailable | The service is temporarily unavailable (e.g., LLM service down) |

## Rate Limiting

To ensure fair usage and system stability, the API implements rate limiting. Rate limits vary by endpoint and are specified in the individual API documentation. When a rate limit is exceeded, the API returns a 429 Too Many Requests status code with a Retry-After header indicating when the client can make the next request.

## Pagination

Endpoints that return lists of items support pagination through the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | number | 1 | The page number to retrieve |
| limit | number | 20 | The number of items per page (maximum 100) |

Example:
```
GET /api/health?page=2&limit=50
```

Paginated responses include the total count of items and the current page number:

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 2
  },
  "error": null
}
```

## Data Privacy and Security

The Health Advisor API handles sensitive health information and implements several security measures:

- **HTTPS** - All API requests must use HTTPS to ensure encrypted data transmission
- **Authentication** - JWT-based authentication with token expiration
- **Authorization** - Users can only access their own data
- **Rate Limiting** - Protection against brute force and denial-of-service attacks
- **Input Validation** - Strict validation of all input data to prevent injection attacks

*Note: Health data is stored securely and is never shared with other users or used for training the LLM without explicit consent.*

## API Versioning

The current version of the API is v1. The version is included in the URL path:

```
https://api.healthadvisor.com/api/v1/health
```

*Note: This documentation describes the v1 API. Future versions will be announced with appropriate migration guides.*

## Getting Started

To get started with the Health Advisor API:

1. Register a user account using the Authentication API
2. Obtain a JWT token by logging in
3. Use the token to authenticate requests to other API endpoints
4. Explore the specific API documentation for the functionality you need

## API Documentation

Detailed documentation for each API section:

- [Authentication API](auth.md) - User registration, login, and token management
- [Health Data API](health.md) - Managing health data (meals, lab results, symptoms)
- [Chat API](chat.md) - Interacting with the LLM health advisor
- [User Profile API](user.md) - Managing user profile information

## Support

If you encounter any issues or have questions about the API, please contact our support team at api-support@healthadvisor.com.