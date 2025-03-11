# Health Advisor Backend

## Introduction

Health Advisor Backend is an Express TypeScript backend service that powers the Health Advisor mobile application. It enables personalized health insights by integrating user health data with Large Language Models (LLMs), providing context-aware health advice through a secure API.

## Features

- User authentication with JWT tokens
- Health data storage and retrieval with filtering and search
- LLM-powered health chat functionality with context from user health data
- File upload for health data images (meals, lab results)
- Voice input transcription for symptom reporting
- RESTful API design with comprehensive validation
- Secure data storage with user isolation

## Technology Stack

- **Language**: TypeScript 4.9+
- **Framework**: Express.js 4.18+
- **Database**: MongoDB 6.0+
- **ODM**: Mongoose 7.0+
- **Authentication**: JWT 9.0+ with Passport.js 0.6+
- **File Storage**: GridFS (MongoDB)
- **LLM Integration**: OpenAI/Azure OpenAI
- **Validation**: Joi 17.9+
- **Logging**: Winston 3.8+
- **Security**: Helmet 6.0+

## Getting Started

### Prerequisites

- Node.js 16.x or higher
- MongoDB 5.0+ (local or Atlas)
- LLM provider API key (OpenAI or Azure OpenAI)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the backend directory:
   ```bash
   cd health-advisor/src/backend
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your configuration values.

5. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| PORT | Server port | 3000 | No |
| MONGODB_URI | MongoDB connection string | - | Yes |
| JWT_SECRET | Secret for signing JWT tokens | - | Yes |
| JWT_EXPIRES_IN | Token expiration time | 1h | No |
| REFRESH_TOKEN_EXPIRES_IN | Refresh token expiration | 7d | No |
| LLM_API_KEY | API key for LLM provider | - | Yes |
| LLM_API_URL | Endpoint URL for LLM provider | - | Yes |
| NODE_ENV | Environment (development/production) | development | No |
| LOG_LEVEL | Winston logger level | info | No |

## API Endpoints

### Authentication

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| POST | /api/authz/signup | Create a new user account | { email, password } | { token, user } |
| POST | /api/authz/login | Authenticate user and get token | { email, password } | { token, user } |

### Health Data

| Method | Endpoint | Description | Request Body/Params | Response |
|--------|----------|-------------|---------------------|----------|
| GET | /api/health | Get user health data with filtering | query: date, search, page, limit | { items, total, page } |
| POST | /api/health | Add new health data entry | { type, data, metadata } + files | { id, success } |
| GET | /api/health/:id | Get specific health data entry | path: id | { item } |
| DELETE | /api/health/:id | Delete health data entry | path: id | { success } |

### Chat

| Method | Endpoint | Description | Request Body/Params | Response |
|--------|----------|-------------|---------------------|----------|
| GET | /api/chat | Get chat history | query: page, limit | { messages, total, page } |
| POST | /api/chat | Send message to LLM | { message } | { response, conversationId } |

### User

| Method | Endpoint | Description | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| GET | /api/user/profile | Get user profile information | - | { user } |

## Development

### Scripts

| Command | Description |
|---------|-------------|
| npm run dev | Start development server with hot reload |
| npm run build | Build for production |
| npm start | Start production server |
| npm test | Run tests |
| npm run test:watch | Run tests in watch mode |
| npm run lint | Run linter |
| npm run lint:fix | Run linter and fix issues |
| npm run typecheck | Run TypeScript type checking |

### Testing

The project uses Jest for unit and integration testing:

- Unit tests for services and utilities
- Integration tests for API endpoints
- MongoDB memory server for database testing

Run tests with:
```bash
npm test
```

### Linting

ESLint is configured for code quality with TypeScript support:

```bash
# Check for issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

## Deployment

### Docker

A Dockerfile is provided for containerization:

```bash
# Build the image
docker build -t health-advisor-backend .

# Run the container
docker run -p 3000:3000 --env-file .env health-advisor-backend
```

### Environment Setup

For production deployment:

1. Ensure all environment variables are properly configured
2. Set NODE_ENV=production
3. Use a process manager like PM2 or containerized deployment
4. Configure MongoDB with authentication and replication
5. Implement proper logging and monitoring

## Project Structure

```
src/
├── config/           # Application configuration files
├── controllers/      # Request handlers for routes
├── middlewares/      # Express middlewares
├── models/           # MongoDB schema definitions
├── repositories/     # Data access layer
├── routes/           # API route definitions
├── services/         # Business logic layer
│   ├── auth/         # Authentication services
│   ├── chat/         # LLM integration services
│   ├── health/       # Health data services
│   └── file/         # File handling services
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── validators/       # Request validation schemas
├── app.ts            # Express application setup
└── server.ts         # Server entry point
```

## Contributing

1. Follow the project's coding standards
2. Write tests for new features
3. Ensure all tests pass before submitting pull requests
4. Update documentation as needed
5. Submit pull requests for review

## License

Proprietary - All rights reserved