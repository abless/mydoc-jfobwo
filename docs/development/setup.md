# Health Advisor Development Setup

This guide provides comprehensive instructions for setting up the development environment for the Health Advisor application. It covers both the backend Express service and the React Native mobile application.

# Table of Contents
<!-- toc will be generated here -->

# 1. Prerequisites

Before setting up the development environment, ensure you have the following prerequisites installed on your system:

## 1.1 Common Requirements
- **Git**: Latest version
- **Node.js**: v16.x or higher
- **npm**: v8.x or higher (comes with Node.js)
- **Docker**: Latest version
- **Docker Compose**: Latest version

## 1.2 Mobile Development Requirements
For mobile application development:

- **React Native CLI**: Latest version (`npm install -g react-native-cli`)

**For iOS Development (macOS only):**
- **Xcode**: Latest version from the Mac App Store
- **CocoaPods**: Latest version (`sudo gem install cocoapods`)

**For Android Development:**
- **Android Studio**: Latest version
- **Java Development Kit (JDK)**: Version 11
- **Android SDK**: API level 33 (Android 13)
- **Android SDK Build Tools**: Latest version
- **Android Virtual Device (AVD)**: For emulation

# 2. Getting Started

Follow these steps to set up the development environment for the Health Advisor application.

## 2.1 Clone the Repository
```bash
# Clone the repository
git clone https://github.com/organization/health-advisor.git

# Navigate to the project directory
cd health-advisor
```

## 2.2 Docker-based Setup (Recommended)

The recommended approach is to use Docker for development, which provides a consistent environment across all platforms.

```bash
# Start the development environment
docker-compose -f infrastructure/docker-compose.dev.yml up -d

# View logs
docker-compose -f infrastructure/docker-compose.dev.yml logs -f
```

This will start the following services:
- Backend API server (Express) at http://localhost:5000
- MongoDB database at localhost:27017
- React Native development server at http://localhost:8081

You can access the backend API at http://localhost:5000/api and the React Native dev server at http://localhost:8081.

## 2.3 Manual Setup (Alternative)

If you prefer not to use Docker, you can set up the development environment manually.

### 2.3.1 Backend Setup
```bash
# Navigate to the backend directory
cd src/backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start MongoDB (install locally if not using Docker)
# For macOS/Linux: brew install mongodb-community@6.0 or use package manager
# For Windows: download and install from MongoDB website

# Start the development server
npm run dev
```

The backend server will be available at http://localhost:5000/api.

### 2.3.2 Mobile App Setup
```bash
# Navigate to the web (mobile app) directory
cd src/web

# Install dependencies
npm install

# For iOS (macOS only)
cd ios && pod install && cd ..

# Start the development server
npm start

# In a new terminal, run the app on iOS (macOS only)
npm run ios

# Or run on Android
npm run android
```

This will start the Metro bundler and launch the app in the iOS Simulator or Android Emulator.

# 3. Configuration

The Health Advisor application requires various configuration settings for development.

## 3.1 Backend Configuration

The backend service uses environment variables for configuration. Copy the `.env.example` file to `.env` in the `src/backend` directory and update the values as needed:

```bash
# Server settings
NODE_ENV=development
PORT=5000
API_PREFIX=/api

# Database settings
MONGODB_URI=mongodb://localhost:27017/health-advisor

# Authentication settings
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRATION=1h
REFRESH_TOKEN_EXPIRATION=7d

# LLM Provider settings
LLM_PROVIDER_API_KEY=your-llm-provider-api-key-here
LLM_PROVIDER_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4

# Security settings
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Logging settings
LOG_LEVEL=debug
```

**Important:** You will need to obtain an API key from the LLM provider (e.g., OpenAI) to use the chat functionality.

## 3.2 Mobile App Configuration

The mobile app configuration is primarily managed through the `src/web/src/constants/config.ts` file. For local development, ensure the API URL points to your backend server:

```typescript
// For Docker setup
export const API_URL = 'http://localhost:5000/api';

// For device testing (use your machine's IP address)
// export const API_URL = 'http://192.168.1.100:5000/api';
```

When testing on physical devices, you'll need to use your machine's IP address instead of localhost.

## 3.3 Docker Configuration

The Docker development environment is configured in `infrastructure/docker-compose.dev.yml`. You can modify this file to adjust port mappings, environment variables, or add additional services as needed.

If you need to override specific settings without modifying the main file, create a `docker-compose.override.yml` file in the same directory.

# 4. Development Workflow

Once your development environment is set up, you can start working on the Health Advisor application.

## 4.1 Backend Development

The backend service is built with Express and TypeScript. Key directories include:

- `src/backend/src/controllers`: Request handlers
- `src/backend/src/services`: Business logic
- `src/backend/src/models`: MongoDB schemas
- `src/backend/src/routes`: API route definitions
- `src/backend/src/middlewares`: Express middlewares
- `src/backend/src/utils`: Utility functions

To run tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 4.2 Mobile App Development

The mobile app is built with React Native and TypeScript. Key directories include:

- `src/web/src/screens`: Screen components
- `src/web/src/components`: Reusable UI components
- `src/web/src/navigation`: Navigation configuration
- `src/web/src/hooks`: Custom React hooks
- `src/web/src/contexts`: React context providers
- `src/web/src/services`: API and device services
- `src/web/src/utils`: Utility functions

To run tests:
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

To run end-to-end tests (requires Detox setup):
```bash
# Build for E2E testing
npm run e2e:build

# Run E2E tests
npm run e2e:test
```

## 4.3 Git Workflow

We follow a feature branch workflow for development. The process includes:

- Creating feature branches from `main` or `develop`
- Following the naming convention `feature/feature-name` or `bugfix/issue-description`
- Writing descriptive commit messages
- Creating pull requests for code review before merging
- Using continuous integration checks before merging

Refer to our internal development guidelines for detailed information on our development process, including branching strategy, code reviews, and continuous integration.

# 5. Database Management

The Health Advisor application uses MongoDB for data storage.

## 5.1 Database Setup

When using Docker, MongoDB is automatically set up and configured. For manual setup, you'll need to install MongoDB locally and ensure it's running on the default port (27017).

## 5.2 Seeding Data

To seed the database with sample data for development:

```bash
# Using Docker
docker-compose -f infrastructure/docker-compose.dev.yml exec backend npm run db:seed

# Manual setup
cd src/backend
npm run db:seed
```

## 5.3 Database Tools

For database management, you can use:

- **MongoDB Compass**: A GUI for MongoDB (https://www.mongodb.com/products/compass)
- **MongoDB Shell**: Command-line interface for MongoDB

Connect to the development database using:
- Connection string: `mongodb://localhost:27017/health-advisor-dev`
- When using Docker: `mongodb://localhost:27017/health-advisor-dev`

# 6. Testing

The Health Advisor application includes comprehensive testing for both backend and mobile components.

## 6.1 Backend Testing

The backend uses Jest for testing. Test files are located in the `src/backend/tests` directory, organized into:

- `unit`: Unit tests for individual functions and components
- `integration`: Tests for API endpoints and service interactions

Mocks and test utilities are available in the `src/backend/tests/mocks` directory.

## 6.2 Mobile App Testing

The mobile app uses Jest and React Testing Library for testing. Test files are located in the `src/web/__tests__` directory, mirroring the source code structure.

End-to-end testing uses Detox, with test files in the `src/web/e2e` directory.

## 6.3 Test Coverage

We aim for high test coverage, with minimum thresholds defined in the respective Jest configurations:

- Backend: 80% branches, 85% functions, 85% lines
- Mobile App: Similar targets, focusing on critical components

# 7. Troubleshooting

Common issues and their solutions for the development environment.

## 7.1 Docker Issues

**Issue**: Container fails to start
**Solution**: Check Docker logs with `docker-compose -f infrastructure/docker-compose.dev.yml logs`

**Issue**: Port conflicts
**Solution**: Change the port mappings in `docker-compose.dev.yml` if ports are already in use

**Issue**: Volume mounting issues
**Solution**: Ensure Docker has permission to access the project directory

## 7.2 Backend Issues

**Issue**: MongoDB connection errors
**Solution**: Verify MongoDB is running and the connection string is correct

**Issue**: TypeScript compilation errors
**Solution**: Run `npm run lint` to identify and fix issues

**Issue**: Missing environment variables
**Solution**: Ensure all required variables are defined in the `.env` file

## 7.3 Mobile App Issues

**Issue**: Metro bundler errors
**Solution**: Clear Metro cache with `npm start -- --reset-cache`

**Issue**: iOS build fails
**Solution**: Verify CocoaPods is installed and run `pod install` in the `ios` directory

**Issue**: Android build fails
**Solution**: Check Android SDK setup and ensure JAVA_HOME is correctly set

**Issue**: Cannot connect to development server
**Solution**: Ensure the correct IP address is used in the API configuration

## 7.4 LLM Integration Issues

**Issue**: LLM API errors
**Solution**: Verify the API key is correct and has sufficient permissions

**Issue**: Rate limiting
**Solution**: Be aware of rate limits on the LLM provider's free tier

# 8. Additional Resources

- **Development Guidelines**: Refer to our internal development guidelines document for details on our development process
- **Backend Architecture**: Overview of the backend architecture can be found in the architecture documentation
- **Mobile Architecture**: Overview of the mobile app architecture is available in the architecture documentation
- **API Documentation**: API reference documentation is maintained in the api directory
- **Express.js Documentation**: Official Express.js documentation at https://expressjs.com/
- **React Native Documentation**: Official React Native documentation at https://reactnative.dev/docs/getting-started
- **MongoDB Documentation**: Official MongoDB documentation at https://docs.mongodb.com/