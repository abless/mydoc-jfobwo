# Use official Node.js 18 image as the base image for the build stage
FROM node:18-slim AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies using npm ci for a clean and reproducible build
RUN npm ci

# Copy the entire application source code to the working directory
COPY . .

# Build the TypeScript application
RUN npm run build

# Use official Node.js 18 image as the base image for the production stage
FROM node:18-slim AS production

# Set the environment to production
ENV NODE_ENV=production

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json from the builder stage
COPY --from=builder /app/package*.json ./

# Install only production dependencies using npm ci
RUN npm ci --only=production

# Copy the compiled JavaScript files from the builder stage
COPY --from=builder /app/dist ./dist

# Switch to a non-root user for security best practices
USER node

# Expose the port the app runs on
EXPOSE 5000

# Configure container health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 CMD [ "node", "-e", "require('http').get('http://localhost:5000/health', (res) => res.statusCode === 200 ? process.exit(0) : process.exit(1))" ]

# Define the command to start the application
CMD ["node", "dist/server.js"]