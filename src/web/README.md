# Health Advisor Mobile Application

React Native mobile application for the Health Advisor system that enables users to interact with an LLM as a personalized health advisor.

## Features

- User authentication via email/password
- Health data input (meals, lab results, symptoms) via photos and voice
- Searchable health history with date filtering
- LLM-powered chat interface for personalized health advice
- User profile management

## Project Structure

- `/src`: Source code directory
  - `/api`: API client functions for backend communication
  - `/assets`: Static assets (images, icons, fonts)
  - `/components`: Reusable UI components
  - `/constants`: Application constants and configuration
  - `/contexts`: React context providers for state management
  - `/hooks`: Custom React hooks
  - `/navigation`: Navigation configuration and components
  - `/screens`: Screen components for each application view
  - `/services`: Service modules for business logic
  - `/theme`: Theming configuration and styles
  - `/types`: TypeScript type definitions
  - `/utils`: Utility functions
- `/android`: Android-specific configuration
- `/ios`: iOS-specific configuration
- `/__tests__`: Test files
- `/e2e`: End-to-end tests

## Prerequisites

- Node.js (v16.x or higher)
- npm (v8.x or higher)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

## Installation

1. Clone the repository
2. Navigate to the project directory: `cd src/web`
3. Install dependencies: `npm install`
4. Install iOS dependencies: `cd ios && pod install && cd ..`
5. Create a `.env` file based on `.env.example`

## Running the Application

### iOS
```bash
npm run ios
```

### Android
```bash
npm run android
```

### Start Metro Bundler only
```bash
npm start
```

## Development

### Code Style
This project uses ESLint and Prettier for code formatting and style enforcement. Run linting with:
```bash
npm run lint
```

Fix linting issues automatically with:
```bash
npm run lint:fix
```

Format code with Prettier:
```bash
npm run format
```

## Testing

### Unit and Integration Tests
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Generate test coverage report:
```bash
npm run test:coverage
```

### End-to-End Tests
```bash
npm run test:e2e
```

## Building for Production

### Android
```bash
npm run build:android
```
The APK will be generated at `android/app/build/outputs/apk/release/app-release.apk`

### iOS
```bash
npm run build:ios
```
This will build the app for iOS in release mode.

## Key Components

### Authentication
Handled by `AuthContext.tsx` which provides authentication state and methods throughout the application. JWT tokens are stored securely using AsyncStorage.

### Navigation
The app uses React Navigation with a structure of:
- `AppNavigator`: Root navigator that switches between authenticated and unauthenticated states
- `AuthNavigator`: Stack navigator for login and signup screens
- `MainNavigator`: Bottom tab navigator for the main application screens (Chat, Health Log, Data Entry, Insights, Profile)

### API Communication
The `api.service.ts` provides a centralized service for all HTTP requests to the backend, handling authentication, error processing, and retries.

### Health Data Management
The `health.service.ts` provides functions for creating, retrieving, and managing health data entries (meals, lab results, symptoms).

### Chat Functionality
The `chat.service.ts` handles communication with the LLM health advisor through the backend API, managing message sending and conversation history.

## Environment Configuration

The application uses environment variables for configuration. Create a `.env` file based on `.env.example` with the following variables:

```
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000
```

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
If you encounter issues with the Metro bundler, try clearing the cache:
```bash
npm start -- --reset-cache
```

#### iOS Build Issues
If you encounter issues building for iOS, try cleaning the project:
```bash
npm run clean:ios
```

#### Android Build Issues
If you encounter issues building for Android, try cleaning the project:
```bash
npm run clean:android
```

## Contributing

Please refer to the main project's CONTRIBUTING.md file for guidelines on contributing to this project.

## License

This project is licensed under the terms specified in the LICENSE file in the root directory.