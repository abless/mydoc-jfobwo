## Introduction

This document provides comprehensive instructions for deploying the Health Advisor Express backend service to AWS ECS Fargate. It covers both automated CI/CD pipelines and manual deployment procedures, with environment-specific configurations and best practices.

## Prerequisites

Before deploying the backend service, ensure the following prerequisites are met:

*   An AWS account with appropriate permissions to create and manage ECS, ECR, IAM, and other required resources.
*   The AWS CLI // 2.0+ is installed and configured with valid credentials.
*   Docker // 20.0+ is installed on your local machine or build server.
*   Terraform // 1.3.0+ is installed for infrastructure provisioning.
*   GitHub account with access to the Health Advisor repository.
*   jq // 1.6+ is installed for command-line JSON processing.
*   Node.js // 16.x+ is installed for running the deployment scripts.

## Deployment Environments

The Health Advisor backend service is deployed to three distinct environments:

*   **Development (dev)**: Used for local development and testing.
    *   API Endpoint: `https://api-dev.healthadvisor.com/health`
*   **Staging**: Used for integration testing and pre-production validation.
    *   API Endpoint: `https://api-staging.healthadvisor.com/health`
*   **Production (prod)**: The live environment serving end-users.
    *   API Endpoint: `https://api.healthadvisor.com/health`

Each environment has its own dedicated AWS resources, including ECS clusters, databases, and load balancers, to ensure isolation and prevent conflicts.

## CI/CD Pipeline

The automated CI/CD pipeline uses GitHub Actions to build, test, and deploy the backend service to each environment. The pipeline consists of two main workflows:

1.  **Backend Build Workflow** (.github/workflows/backend-build.yml):
    *   Triggered on push events to the `main` branch for files in the `src/backend/**` directory.
    *   Lints the code using ESLint.
    *   Performs static type checking using TypeScript.
    *   Runs unit tests with Jest and checks code coverage.
    *   Performs a security scan using CodeQL and `npm audit`.
    *   Runs integration tests against a MongoDB instance.
    *   Builds the TypeScript code.
    *   Uploads build artifacts (backend-dist) and build information (build-info.txt).
2.  **Backend Deploy Workflow** (.github/workflows/backend-deploy.yml):
    *   Triggered on successful completion of the Backend Build Workflow.
    *   Checks out the code.
    *   Downloads the build artifacts and build information.
    *   Builds and pushes the Docker image to Amazon ECR.
    *   Deploys the image to the development, staging, and production environments using Terraform.
    *   Verifies the deployment by checking the health endpoint.
    *   Creates a deployment tag in Git.
    *   Notifies deployment success to a Slack webhook URL.

## Manual Deployment

In cases where the automated CI/CD pipeline is not suitable, you can manually deploy the backend service using the `deploy-backend.sh` script.

1.  Clone the Health Advisor repository to your local machine.
2.  Install the required dependencies using `npm install` in the `src/backend` directory.
3.  Configure your AWS credentials using the AWS CLI.
4.  Run the `deploy-backend.sh` script with the desired environment and deployment type:

    ```bash
    ./scripts/deploy-backend.sh <environment> terraform
    ```

    Replace `<environment>` with the target environment (`dev`, `staging`, or `prod`).
5.  The script will build the Docker image, push it to Amazon ECR, and deploy the service using Terraform.

## Infrastructure Configuration

The infrastructure for the backend service is defined using Terraform. The main Terraform configuration files are located in the `infrastructure/terraform` directory.

*   `infrastructure/terraform/modules/ecs/main.tf`: Defines the ECS cluster, task definition, service, load balancer, and other required resources.
*   `infrastructure/terraform/modules/ecs/variables.tf`: Defines the input variables for the ECS module.
*   `infrastructure/terraform/environments/<environment>/main.tf`: Defines the environment-specific configuration for each environment.

The ECS task definition uses the Docker image built by the CI/CD pipeline or manual deployment script. The task definition also defines the environment variables and secrets required by the backend service.

## Environment Variables

The backend service requires the following environment variables to be configured:

*   `NODE_ENV`: The deployment environment (`dev`, `staging`, or `prod`).
*   `PORT`: The port the backend service listens on (default: 5000).
*   `API_PREFIX`: The API prefix for all routes (default: `/api`).
*   `MONGODB_URI`: The MongoDB connection string.
*   `JWT_SECRET`: The secret key used to sign JWT tokens.
*   `JWT_EXPIRATION`: The expiration time for JWT tokens (e.g., `1h`, `7d`).
*   `REFRESH_TOKEN_EXPIRATION`: The expiration time for refresh tokens (e.g., `7d`, `30d`).
*   `LLM_PROVIDER_API_KEY`: The API key for the LLM provider (e.g., OpenAI, Azure OpenAI).
*   `LLM_PROVIDER_URL`: The base URL for the LLM provider API.
*   `LLM_MODEL`: The LLM model to use (e.g., `gpt-3.5-turbo`, `gpt-4`).
*   `CORS_ORIGIN`: The allowed origins for CORS (default: `*`).
*   `LOG_LEVEL`: The logging level for the backend service (default: `info`).
*   `RATE_LIMIT_WINDOW_MS`: The time window for rate limiting in milliseconds (default: 60000).
*   `RATE_LIMIT_MAX`: The maximum number of requests per window (default: 100).

These environment variables are configured in the ECS task definition using AWS Secrets Manager for sensitive values like `MONGODB_URI` and `JWT_SECRET`.

## Monitoring and Verification

After deployment, it's crucial to monitor the backend service to ensure it's running correctly and performing as expected.

*   Check the ECS service events in the AWS console for any deployment errors.
*   Monitor the CloudWatch logs for application startup messages and any errors.
*   Verify the health endpoint (`/health`) returns a 200 OK status code.
*   Monitor CloudWatch metrics for CPU utilization, memory usage, and error rates.
*   Verify the load balancer target group health status in the AWS console.

## Rollback Procedures

If a deployment fails or introduces issues, you can roll back to the previous stable version.

1.  Identify the previous stable deployment image tag from the Git history or deployment logs.
2.  Update the Terraform variables with the previous image tag.
3.  Apply the Terraform configuration to revert the ECS service.
4.  Wait for the rollback to complete and the service to stabilize.
5.  Verify the rollback by checking the health endpoint.
6.  Log the rollback completion with relevant details.
```
# .github/workflows/backend-build.yml
```

```yaml
name: Backend Build

on:
  push:
    branches: [ main ]
    paths:
      - 'src/backend/**'
  pull_request:
    branches: [ main ]
    paths:
      - 'src/backend/**'

env:
  NODE_VERSION: '18.x'
  MONGODB_VERSION: '5.0'
  COVERAGE_THRESHOLD: '85'

jobs:
  lint-and-test:
    name: Lint and Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'src/backend/package-lock.json'
      
      - name: Install dependencies
        working-directory: src/backend
        run: npm ci
      
      - name: Lint code
        working-directory: src/backend
        run: npm run lint
      
      - name: Type check
        working-directory: src/backend
        run: npx tsc --noEmit
      
      - name: Run unit tests
        working-directory: src/backend
        run: npm run test:coverage
      
      - name: Check test coverage
        working-directory: src/backend
        run: npx jest --coverage --coverageThreshold='{"global":{"lines":${{ env.COVERAGE_THRESHOLD }},"functions":${{ env.COVERAGE_THRESHOLD }},"branches":${{ env.COVERAGE_THRESHOLD }},"statements":${{ env.COVERAGE_THRESHOLD }}}}'
      
      - name: Upload test coverage
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: src/backend/coverage

  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
      
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v2 # github/codeql-action/init@v2
        with:
          languages: javascript
      
      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v2 # github/codeql-action/analyze@v2
      
      - name: Check for vulnerabilities
        working-directory: src/backend
        run: npm audit --production

  integration-tests:
    name: Integration Tests
    needs: lint-and-test
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:${{ env.MONGODB_VERSION }}
        ports:
          - 27017:27017
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'src/backend/package-lock.json'
      
      - name: Install dependencies
        working-directory: src/backend
        run: npm ci
      
      - name: Run integration tests
        working-directory: src/backend
        run: npm run test:integration
        env:
          MONGODB_URI: mongodb://localhost:27017/health-advisor-test

  build:
    name: Build
    needs: [lint-and-test, integration-tests, security-scan]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
          cache-dependency-path: 'src/backend/package-lock.json'
      
      - name: Install dependencies
        working-directory: src/backend
        run: npm ci
      
      - name: Build TypeScript
        working-directory: src/backend
        run: npm run build
      
      - name: Generate build ID
        id: build-id
        run: echo "id=build-$(date +'%Y%m%d%H%M%S')-${GITHUB_SHA::8}" >> $GITHUB_OUTPUT
      
      - name: Save build ID
        run: echo ${{ steps.build-id.outputs.id }} > build-info.txt
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: backend-dist
          path: src/backend/dist
      
      - name: Upload build info
        uses: actions/upload-artifact@v3
        with:
          name: build-info
          path: build-info.txt
    
    outputs:
      build_id: ${{ steps.build-id.outputs.id }}
```
# .github/workflows/backend-deploy.yml
```yaml
name: Backend Deploy # Backend Deploy Workflow

on:
  workflow_run:
    workflows: ["Backend Build"]
    branches: [main]
    types: [completed]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: health-advisor-backend
  TF_VERSION: 1.3.0
  NODE_VERSION: 18.x

jobs:
  prepare-deployment:
    name: Prepare Deployment
    runs-on: ubuntu-latest
    if: "${{ github.event.workflow_run.conclusion == 'success' }}"
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Download backend dist # actions/download-artifact@v3
        uses: actions/download-artifact@v3 # actions/download-artifact@v3
        with:
          name: backend-dist
          github-token: ${{ secrets.GITHUB_TOKEN }}
          run-id: ${{ github.event.workflow_run.id }}
          path: src/backend/dist
      - name: Download build info # actions/download-artifact@v3
        uses: actions/download-artifact@v3 # actions/download-artifact@v3
        with:
          name: build-info
          github-token: ${{ secrets.GITHUB_TOKEN }}
          run-id: ${{ github.event.workflow_run.id }}
          path: build-info
      - name: Read build ID
        id: build-info
        run: echo "id=$(cat build-info/build-info.txt)" >> $GITHUB_OUTPUT
    outputs:
      build_id: ${{ steps.build-info.outputs.id }}

  build-and-push-image:
    name: Build and Push Docker Image
    needs: prepare-deployment
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Set up Docker Buildx # docker/setup-buildx-action@v2
        uses: docker/setup-buildx-action@v2 # docker/setup-buildx-action@v2
      - name: Configure AWS credentials # aws-actions/configure-aws-credentials@v2
        uses: aws-actions/configure-aws-credentials@v2 # aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Login to Amazon ECR # aws-actions/amazon-ecr-login@v1
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1 # aws-actions/amazon-ecr-login@v1
      - name: Build and push Docker image # docker/build-push-action@v4
        uses: docker/build-push-action@v4 # docker/build-push-action@v4
        with:
          context: src/backend
          push: true
          tags: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ needs.prepare-deployment.outputs.build_id }},${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
    outputs:
      image_uri: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ needs.prepare-deployment.outputs.build_id }}

  deploy-to-development:
    name: Deploy to Development
    needs: [prepare-deployment, build-and-push-image]
    runs-on: ubuntu-latest
    environment: development
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Configure AWS credentials # aws-actions/configure-aws-credentials@v2
        uses: aws-actions/configure-aws-credentials@v2 # aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Setup Terraform # hashicorp/setup-terraform@v2
        uses: hashicorp/setup-terraform@v2 # hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      - name: Terraform Init
        working-directory: infrastructure/terraform/environments/dev
        run: terraform init
      - name: Terraform Apply
        working-directory: infrastructure/terraform/environments/dev
        run: terraform apply -auto-approve -var="backend_image=${{ needs.build-and-push-image.outputs.image_uri }}" -var="build_id=${{ needs.prepare-deployment.outputs.build_id }}"
      - name: Verify Deployment
        run: curl --retry 5 --retry-delay 10 --retry-connrefused https://api-dev.healthadvisor.com/health

  deploy-to-staging:
    name: Deploy to Staging
    needs: [prepare-deployment, build-and-push-image, deploy-to-development]
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Configure AWS credentials # aws-actions/configure-aws-credentials@v2
        uses: aws-actions/configure-aws-credentials@v2 # aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Setup Terraform # hashicorp/setup-terraform@v2
        uses: hashicorp/setup-terraform@v2 # hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      - name: Terraform Init
        working-directory: infrastructure/terraform/environments/staging
        run: terraform init
      - name: Terraform Apply
        working-directory: infrastructure/terraform/environments/staging
        run: terraform apply -auto-approve -var="backend_image=${{ needs.build-and-push-image.outputs.image_uri }}" -var="build_id=${{ needs.prepare-deployment.outputs.build_id }}"
      - name: Verify Deployment
        run: curl --retry 5 --retry-delay 10 --retry-connrefused https://api-staging.healthadvisor.com/health

  deploy-to-production:
    name: Deploy to Production
    needs: [prepare-deployment, build-and-push-image, deploy-to-staging]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Configure AWS credentials # aws-actions/configure-aws-credentials@v2
        uses: aws-actions/configure-aws-credentials@v2 # aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Setup Terraform # hashicorp/setup-terraform@v2
        uses: hashicorp/setup-terraform@v2 # hashicorp/setup-terraform@v2
        with:
          terraform_version: ${{ env.TF_VERSION }}
      - name: Terraform Init
        working-directory: infrastructure/terraform/environments/prod
        run: terraform init
      - name: Terraform Apply
        working-directory: infrastructure/terraform/environments/prod
        run: terraform apply -auto-approve -var="backend_image=${{ needs.build-and-push-image.outputs.image_uri }}" -var="build_id=${{ needs.prepare-deployment.outputs.build_id }}"
      - name: Verify Deployment
        run: curl --retry 5 --retry-delay 10 --retry-connrefused https://api.healthadvisor.com/health

  post-deployment:
    name: Post-Deployment Tasks
    needs: [deploy-to-production]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code # actions/checkout@v3
        uses: actions/checkout@v3 # actions/checkout@v3
      - name: Create deployment tag
        run: git tag backend-deployment-$(date +'%Y%m%d%H%M%S') && git push --tags
      - name: Notify deployment success
        run: curl -X POST -H 'Content-Type: application/json' -d '{"text":"Backend deployment successful: ${{ needs.prepare-deployment.outputs.build_id }}"}' ${{ secrets.SLACK_WEBHOOK_URL }}
```
# src/backend/Dockerfile
```dockerfile
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
```
# infrastructure/terraform/modules/ecs/main.tf