# Chat API

## Introduction

The Chat API enables interaction with the LLM health advisor, allowing users to send messages, receive personalized health advice, and manage their conversation history. The LLM responses are enriched with the user's health context, providing personalized guidance based on their health data.

## Base URL

```
/api/chat
```

## Endpoints

### Send Message

**POST /message**

Send a message to the LLM health advisor and receive a personalized response.

**Authentication Required**

#### Request Body

Content-Type: application/json

| Field | Type | Description |
|-------|------|-------------|
| message | string | **Required.** User message text |
| conversationId | string | **Optional.** Existing conversation ID. If not provided, a new conversation will be created. |

Example:
```json
{
  "message": "I've been having headaches after meals lately. What could be causing this?",
  "conversationId": "60d21b4667d0d8992e610c85"
}
```

#### Responses

**200 OK: Message successfully processed**

Content-Type: application/json

```json
{
  "success": true,
  "data": {
    "response": "Based on your recent meal logs, I notice you've been consuming foods high in processed sugars. This could potentially trigger headaches in some people. Consider tracking when these headaches occur in relation to specific meals to identify potential triggers. It might also be helpful to stay well-hydrated throughout the day, as dehydration can also contribute to headaches.",
    "conversationId": "60d21b4667d0d8992e610c85"
  },
  "error": null
}
```

**400 Bad Request: Invalid request**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_MESSAGE",
    "message": "Message cannot be empty",
    "details": null
  }
}
```

**401 Unauthorized: Authentication required**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found: Conversation not found**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found or access denied"
  }
}
```

**503 Service Unavailable: LLM service unavailable**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LLM_SERVICE_ERROR",
    "message": "LLM service is currently unavailable. Please try again later."
  }
}
```

### Create Conversation

**POST /conversations**

Create a new conversation with an optional initial message.

**Authentication Required**

#### Request Body

Content-Type: application/json

| Field | Type | Description |
|-------|------|-------------|
| message | string | **Optional.** Initial message to start the conversation |

Example:
```json
{
  "message": "Hello, I'd like to discuss my recent lab results."
}
```

#### Responses

**201 Created: Conversation successfully created**

Content-Type: application/json

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "title": "Discussion about lab results",
    "startedAt": "2023-05-15T10:30:00.000Z",
    "lastMessageAt": "2023-05-15T10:30:00.000Z",
    "response": "Hello! I'd be happy to discuss your lab results. What specific results would you like to talk about?"
  },
  "error": null
}
```

**400 Bad Request: Invalid request**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request parameters",
    "details": {
      "message": "Message is too long (maximum 1000 characters)"
    }
  }
}
```

**401 Unauthorized: Authentication required**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**503 Service Unavailable: LLM service unavailable**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "LLM_SERVICE_ERROR",
    "message": "LLM service is currently unavailable. Please try again later."
  }
}
```

### Get Conversations

**GET /conversations**

Retrieve a list of the user's conversations with pagination.

**Authentication Required**

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of conversations per page (max 100) |

#### Responses

**200 OK: Conversations successfully retrieved**

Content-Type: application/json

```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": "60d21b4667d0d8992e610c85",
        "title": "Discussion about headaches",
        "startedAt": "2023-05-15T10:30:00.000Z",
        "lastMessageAt": "2023-05-15T10:45:00.000Z"
      },
      {
        "id": "60d21b4667d0d8992e610c86",
        "title": "Meal planning advice",
        "startedAt": "2023-05-14T14:20:00.000Z",
        "lastMessageAt": "2023-05-14T14:35:00.000Z"
      }
    ],
    "total": 5,
    "page": 1
  },
  "error": null
}
```

**401 Unauthorized: Authentication required**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request: Invalid request parameters**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid request parameters",
    "details": {
      "page": "Page must be a positive number",
      "limit": "Limit must be between 1 and 100"
    }
  }
}
```

### Get Conversation

**GET /conversations/:id**

Retrieve a specific conversation by ID.

**Authentication Required**

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Conversation ID |

#### Responses

**200 OK: Conversation successfully retrieved**

Content-Type: application/json

```json
{
  "success": true,
  "data": {
    "id": "60d21b4667d0d8992e610c85",
    "title": "Discussion about headaches",
    "startedAt": "2023-05-15T10:30:00.000Z",
    "lastMessageAt": "2023-05-15T10:45:00.000Z"
  },
  "error": null
}
```

**401 Unauthorized: Authentication required**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found: Conversation not found**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found or access denied"
  }
}
```

### Get Chat Messages

**GET /conversations/:id/messages**

Retrieve messages from a specific conversation with pagination.

**Authentication Required**

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Conversation ID |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| page | number | No | 1 | Page number for pagination |
| limit | number | No | 20 | Number of messages per page (max 100) |

#### Responses

**200 OK: Messages successfully retrieved**

Content-Type: application/json

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "60d21b4667d0d8992e610c87",
        "conversationId": "60d21b4667d0d8992e610c85",
        "role": "user",
        "content": "I've been having headaches after meals lately. What could be causing this?",
        "timestamp": "2023-05-15T10:30:00.000Z"
      },
      {
        "id": "60d21b4667d0d8992e610c88",
        "conversationId": "60d21b4667d0d8992e610c85",
        "role": "assistant",
        "content": "Based on your recent meal logs, I notice you've been consuming foods high in processed sugars. This could potentially trigger headaches in some people. Consider tracking when these headaches occur in relation to specific meals to identify potential triggers. It might also be helpful to stay well-hydrated throughout the day, as dehydration can also contribute to headaches.",
        "timestamp": "2023-05-15T10:30:15.000Z"
      }
    ],
    "total": 2,
    "page": 1
  },
  "error": null
}
```

**401 Unauthorized: Authentication required**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**404 Not Found: Conversation not found**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "CONVERSATION_NOT_FOUND",
    "message": "Conversation not found or access denied"
  }
}
```

**400 Bad Request: Invalid request parameters**

Content-Type: application/json

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid request parameters",
    "details": {
      "page": "Page must be a positive number",
      "limit": "Limit must be between 1 and 100"
    }
  }
}
```

## Data Models

### ChatMessage

Represents a message in a conversation.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the message |
| conversationId | string | ID of the conversation this message belongs to |
| role | string (enum: user, assistant, system) | Role of the message sender (user, assistant, or system) |
| content | string | Message text content |
| timestamp | string (ISO date) | Time when the message was sent |

### Conversation

Represents a chat conversation.

| Property | Type | Description |
|----------|------|-------------|
| id | string | Unique identifier for the conversation |
| title | string | Title of the conversation, typically derived from the first message |
| startedAt | string (ISO date) | Time when the conversation was started |
| lastMessageAt | string (ISO date) | Time when the last message was sent |

## Error Handling

### Error Response Format

All error responses follow this format:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  }
}
```

### Common Errors

| Code | Status Code | Description |
|------|------------|-------------|
| UNAUTHORIZED | 401 | Authentication required or invalid token |
| CONVERSATION_NOT_FOUND | 404 | Requested conversation does not exist or user does not have access |
| INVALID_MESSAGE | 400 | Message is empty, too long, or contains inappropriate content |
| LLM_SERVICE_ERROR | 503 | LLM service is temporarily unavailable |
| INVALID_PARAMETERS | 400 | Invalid request parameters (e.g., pagination values) |

## Rate Limiting

To ensure fair usage and system stability, the Chat API implements rate limiting on message sending.

| Endpoint | Limit | Response |
|----------|-------|----------|
| POST /message | 30 requests per minute per user | 429 Too Many Requests with Retry-After header |
| GET endpoints | 60 requests per minute per user | 429 Too Many Requests with Retry-After header |

## Client Implementation Examples

### Send Message Example

```typescript
import { sendMessage } from '../api/chat.api';

const handleSendMessage = async (message: string, conversationId?: string) => {
  try {
    const response = await sendMessage(message, conversationId);
    // Handle successful response
    return response;
  } catch (error) {
    // Handle error
    console.error('Failed to send message:', error);
    throw error;
  }
};
```

### Get Conversations Example

```typescript
import { getConversations } from '../api/chat.api';

const handleGetConversations = async (page = 1, limit = 20) => {
  try {
    const response = await getConversations({ page, limit });
    // Handle successful response
    return response;
  } catch (error) {
    // Handle error
    console.error('Failed to get conversations:', error);
    throw error;
  }
};
```

### Get Messages Example

```typescript
import { getMessages } from '../api/chat.api';

const handleGetMessages = async (conversationId: string, page = 1, limit = 20) => {
  try {
    const response = await getMessages({ conversationId, page, limit });
    // Handle successful response
    return response;
  } catch (error) {
    // Handle error
    console.error('Failed to get messages:', error);
    throw error;
  }
};
```

## Health Context Integration

The Chat API automatically integrates the user's health data to provide context-aware responses. The LLM is provided with relevant health information such as:

- **Recent meals**: Information about the user's recently logged meals
- **Lab results**: Recent lab test results the user has logged
- **Symptoms**: Recently reported symptoms and their details

**Privacy Note**: Health data is only used to provide context for the current user's chat session and is never shared with other users or used for training the LLM.

## Limitations

Important limitations of the Chat API to be aware of:

- The LLM provides health information and suggestions, not medical diagnosis or treatment
- All responses include appropriate medical disclaimers
- Maximum message length is 1000 characters
- Conversations older than 1 year may be archived and require additional time to access
- The LLM service may occasionally be unavailable for maintenance or updates