# Multi-stage Docker build for Health Advisor React Native mobile application
# This Dockerfile provides a development environment for building and testing the mobile app

# Base development stage using Node.js 18 slim image
FROM node:18-slim AS base

# Set working directory for the container
WORKDIR /app

# Configure environment variables for development
ENV NODE_ENV=development
# Allow Expo DevTools to be accessible from outside the container
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
# Configure React Native packager to be accessible from outside the container
ENV REACT_NATIVE_PACKAGER_HOSTNAME=0.0.0.0

# Install system dependencies required for React Native development
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# Install React Native CLI globally
RUN npm install -g react-native-cli

# Copy package.json and package-lock.json for dependency installation
# This is done before copying the rest of the code for better layer caching
COPY package*.json ./

# Install Node.js dependencies using clean install for reproducible builds
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Expose Metro bundler port
EXPOSE 8081
# Expose Expo development server port
EXPOSE 19000
# Expose Expo development server manifest port
EXPOSE 19001
# Expose Expo DevTools port
EXPOSE 19002

# Start the React Native development server
CMD ["npm", "start"]