#!/bin/bash
# bash version: 4.0+
# docker version: 20.10+
# aws-cli version: 2.0+
# terraform version: 1.3.0+
# jq version: 1.6+
# curl version: 7.0+

# Script directory
SCRIPT_DIR="$(dirname "$0")"
# Root directory
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
# Backend directory
BACKEND_DIR="$ROOT_DIR/src/backend"
# Terraform directory
TERRAFORM_DIR="$ROOT_DIR/infrastructure/terraform"

# Build ID (timestamp + short git hash)
BUILD_ID="$(date +'%Y%m%d%H%M%S')-$(git rev-parse --short HEAD)"
# Backend version from package.json
VERSION="$(node -p "require('$BACKEND_DIR/package.json').version")"

# AWS Region
AWS_REGION="us-east-1"
# ECR Repository name
ECR_REPOSITORY="health-advisor-backend"

# Function to print usage information
print_usage() {
  echo "Usage: $0 <environment> <deployment_type> [options]"
  echo ""
  echo "  Deploys the Health Advisor Express backend application."
  echo ""
  echo "Arguments:"
  echo "  <environment>      Deployment environment (dev, staging, prod)"
  echo "  <deployment_type>  Deployment type (terraform, docker-compose)"
  echo ""
  echo "Options:"
  echo "  -h | --help        Show this help message"
  echo ""
  echo "Example:"
  echo "  $0 prod terraform"
}

# Function to check prerequisites
check_prerequisites() {
  echo "Checking prerequisites..."

  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed. Please install Docker."
    return 1
  fi

  # Check if AWS CLI is installed
  if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed. Please install AWS CLI."
    return 1
  fi

  # Check if Terraform is installed
  if ! command -v terraform &> /dev/null; then
    echo "Error: Terraform is not installed. Please install Terraform."
    return 1
  fi

  # Check if jq is installed
  if ! command -v jq &> /dev/null; then
    echo "Error: jq is not installed. Please install jq."
    return 1
  fi

  # Check if AWS credentials are configured
  if ! aws sts get-caller-identity &> /dev/null; then
    echo "Error: AWS credentials are not configured. Please configure AWS CLI with your credentials."
    return 1
  fi

  echo "All prerequisites are met."
  return 0
}

# Function to setup environment
setup_environment() {
  local environment="$1"

  echo "Setting up environment: $environment"

  # Set environment-specific variables
  case "$environment" in
    "dev")
      echo "Using development environment"
      ;;
    "staging")
      echo "Using staging environment"
      ;;
    "prod")
      echo "Using production environment"
      ;;
    *)
      echo "Error: Invalid environment: $environment"
      print_usage
      exit 1
      ;;
  esac

  # Configure AWS credentials for the target environment
  echo "Configuring AWS credentials for region: $AWS_REGION"
  aws configure set region "$AWS_REGION"

  # Login to Amazon ECR
  echo "Logging in to Amazon ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "public.ecr.aws"

  # Prepare build directories
  echo "Preparing build directories..."
  mkdir -p "$BACKEND_DIR/dist"

  echo "Environment setup complete."
  return 0
}

# Function to build the backend
build_backend() {
  local environment="$1"

  echo "Building backend for environment: $environment"

  # Navigate to the backend directory
  cd "$BACKEND_DIR" || exit 1

  # Build TypeScript code
  echo "Building TypeScript code..."
  npm run build || exit 1

  # Build Docker image with appropriate tags
  local image_uri="public.ecr.aws/$ECR_REPOSITORY:$VERSION-$BUILD_ID"
  echo "Building Docker image: $image_uri"
  docker build -t "$image_uri" . || exit 1

  # Verify image was built successfully
  docker inspect "$image_uri" &> /dev/null || {
    echo "Error: Docker image build failed."
    exit 1
  }

  echo "Backend build complete. Image URI: $image_uri"
  echo "$image_uri"
}

# Function to push the image
push_image() {
  local image_uri="$1"

  echo "Pushing Docker image: $image_uri"

  # Push Docker image to ECR repository
  docker push "$image_uri" || {
    echo "Error: Docker image push failed."
    return 1
  }

  # Tag image as latest
  local latest_image_uri="public.ecr.aws/$ECR_REPOSITORY:latest"
  echo "Tagging image as latest: $latest_image_uri"
  docker tag "$image_uri" "$latest_image_uri" || {
    echo "Error: Docker image tag failed."
    return 1
  }

  # Push latest tag
  docker push "$latest_image_uri" || {
    echo "Error: Docker image push (latest) failed."
    return 1
  }

  echo "Docker image pushed successfully."
  return 0
}

# Function to deploy using Terraform
deploy_terraform() {
  local environment="$1"
  local image_uri="$2"

  echo "Deploying using Terraform for environment: $environment"

  # Navigate to the appropriate Terraform environment directory
  local terraform_env_dir="$TERRAFORM_DIR/$environment"
  cd "$terraform_env_dir" || exit 1

  # Initialize Terraform
  echo "Initializing Terraform..."
  terraform init || exit 1

  # Apply Terraform with appropriate variables
  echo "Applying Terraform..."
  terraform apply -auto-approve \
    -var="container_image=$ECR_REPOSITORY" \
    -var="container_image_tag=$VERSION-$BUILD_ID" || exit 1

  echo "Terraform deployment complete."
  return 0
}

# Function to deploy using Docker Compose
deploy_docker_compose() {
  local environment="$1"
  local image_uri="$2"

  echo "Deploying using Docker Compose for environment: $environment"

  # Navigate to the infrastructure directory
  cd "$ROOT_DIR/infrastructure" || exit 1

  # Set environment variables for Docker Compose
  echo "Setting environment variables for Docker Compose..."
  export DOCKER_IMAGE="$image_uri"

  # Run Docker Compose with appropriate configuration file
  echo "Running Docker Compose..."
  docker-compose up --build -d || exit 1

  echo "Docker Compose deployment complete."
  return 0
}

# Function to verify deployment
verify_deployment() {
  local environment="$1"

  echo "Verifying deployment in environment: $environment"

  # Determine API URL based on environment
  local api_url=""
  case "$environment" in
    "dev")
      api_url="http://localhost:5000/api/health"
      ;;
    "staging")
      api_url="https://staging.health-advisor.example.com/api/health"
      ;;
    "prod")
      api_url="https://health-advisor.example.com/api/health"
      ;;
    *)
      echo "Error: Invalid environment: $environment"
      exit 1
      ;;
  esac

  # Wait for service to be available
  echo "Waiting for service to be available at: $api_url"
  local max_attempts=10
  local attempt=0
  while true; do
    attempt=$((attempt + 1))
    if curl -s "$api_url" | jq -e '.status == "ok"' &> /dev/null; then
      echo "Service is available."
      break
    else
      echo "Service not yet available (attempt $attempt/$max_attempts). Waiting..."
      if [ $attempt -ge $max_attempts ]; then
        echo "Error: Service verification failed after $max_attempts attempts."
        return 1
      fi
      sleep 10
    fi
  done

  # Send HTTP request to health endpoint
  echo "Sending HTTP request to health endpoint..."
  if curl -s "$api_url" | jq -e '.status == "ok"' &> /dev/null; then
    echo "Health check passed."
    return 0
  else
    echo "Error: Health check failed."
    return 1
  fi
}

# Function to perform post-deployment tasks
post_deployment_tasks() {
  local environment="$1"

  echo "Performing post-deployment tasks for environment: $environment"

  # Create git tag for deployment
  echo "Creating git tag: deployment-$environment-$BUILD_ID"
  git tag "deployment-$environment-$BUILD_ID"

  # Push git tag to repository
  echo "Pushing git tag to repository..."
  git push origin "deployment-$environment-$BUILD_ID"

  # Send deployment notification if webhook URL is configured
  if [ -n "$WEBHOOK_URL" ]; then
    echo "Sending deployment notification to webhook: $WEBHOOK_URL"
    curl -X POST -H "Content-Type: application/json" -d "{\"text\":\"New deployment to $environment environment: $BUILD_ID\"}" "$WEBHOOK_URL"
  fi

  # Log deployment information
  echo "Deployment information:"
  echo "  Environment: $environment"
  echo "  Build ID: $BUILD_ID"
  echo "  Version: $VERSION"

  echo "Post-deployment tasks complete."
}

# Main function
main() {
  local environment="$1"
  local deployment_type="$2"

  # Validate number of arguments
  if [ $# -lt 2 ]; then
    echo "Error: Missing arguments."
    print_usage
    exit 1
  fi

  # Handle help option
  if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    print_usage
    exit 0
  fi

  # Validate environment parameter
  case "$environment" in
    "dev"|"staging"|"prod")
      ;;
    *)
      echo "Error: Invalid environment: $environment"
      print_usage
      exit 1
      ;;
  esac

  # Validate deployment_type parameter
  case "$deployment_type" in
    "terraform"|"docker-compose")
      ;;
    *)
      echo "Error: Invalid deployment type: $deployment_type"
      print_usage
      exit 1
      ;;
  esac

  # Call check_prerequisites function
  if [ $(check_prerequisites) -ne 0 ]; then
    exit 1
  fi

  # Call setup_environment function
  if [ $(setup_environment "$environment") -ne 0 ]; then
    exit 1
  fi

  # Call build_backend function
  local image_uri=$(build_backend "$environment")

  # Call push_image function if deployment_type is terraform
  if [ "$deployment_type" == "terraform" ]; then
    if [ $(push_image "$image_uri") -ne 0 ]; then
      exit 1
    fi
  fi

  # Call deploy_terraform function if deployment_type is terraform
  if [ "$deployment_type" == "terraform" ]; then
    if [ $(deploy_terraform "$environment" "$image_uri") -ne 0 ]; then
      exit 1
    fi
  fi

  # Call deploy_docker_compose function if deployment_type is docker-compose
  if [ "$deployment_type" == "docker-compose" ]; then
    if [ $(deploy_docker_compose "$environment" "$image_uri") -ne 0 ]; then
      exit 1
    fi
  fi

  # Call verify_deployment function
  if [ $(verify_deployment "$environment") -ne 0 ]; then
    exit 1
  fi

  # Call post_deployment_tasks function if deployment successful
  post_deployment_tasks "$environment"

  echo "Deployment completed successfully."
  exit 0
}

# Call main function with command line arguments
main "$@"