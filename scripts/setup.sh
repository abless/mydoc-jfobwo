#!/bin/bash
# bash version: 4.0+
# docker version: 20.0+
# docker-compose version: 1.29+
# node version: 16.x+
# npm version: 8.x+
# mongodb version: 6.0+

# A comprehensive setup script that initializes the development environment for the Health Advisor application, including installing dependencies, configuring the database, and setting up Docker containers for local development.

# Source:
# - docker-compose.dev.yml (Docker Compose configuration for development environment)
# - seed.js (Database seeding script for populating test data)
# - src/backend/package.json (Backend dependencies information)
# - src/web/package.json (Mobile app dependencies information)

# Global variables
SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$ROOT_DIR/src/backend"
WEB_DIR="$ROOT_DIR/src/web"
INFRASTRUCTURE_DIR="$ROOT_DIR/infrastructure"
ENV_FILE="$ROOT_DIR/.env.development"
LOG_PREFIX="[SETUP]"

# Function to print a welcome banner
print_banner() {
  cat <<EOF
${LOG_PREFIX} ------------------------------------------------------------------
${LOG_PREFIX}
${LOG_PREFIX}   ███████ ██████  ██████  ██    ██ ███████ ███████
${LOG_PREFIX}   ██      ██   ██ ██   ██ ██    ██ ██      ██
${LOG_PREFIX}   ███████ ██████  ██████  ██    ██ ███████ ███████
${LOG_PREFIX}        ██ ██   ██ ██   ██ ██    ██      ██      ██
${LOG_PREFIX}   ███████ ██   ██ ██   ██ ███████ ███████ ███████
${LOG_PREFIX}
${LOG_PREFIX}   Health Advisor - Development Environment Setup
${LOG_PREFIX} ------------------------------------------------------------------
EOF
  echo "${LOG_PREFIX} Version: 1.0.0"
  echo "${LOG_PREFIX} Description: This script sets up the development environment for the Health Advisor application."
  echo "${LOG_PREFIX} ------------------------------------------------------------------"
}

# Function to print script usage information
print_usage() {
  echo "Usage: $0 [options]"
  echo "Options:"
  echo "  -h | --help    Show this help message"
  echo "  -y             Bypass confirmation prompts (yes to all)"
  echo "Example:"
  echo "  $0 -y"
}

# Function to log informational messages
log_info() {
  local message="$1"
  local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
  echo "${timestamp} ${LOG_PREFIX} INFO: ${message}"
}

# Function to log error messages in red
log_error() {
  local message="$1"
  local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} ${LOG_PREFIX} \033[31mERROR: ${message}\033[0m"
}

# Function to log success messages in green
log_success() {
  local message="$1"
  local timestamp=$(date +'%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} ${LOG_PREFIX} \033[32mSUCCESS: ${message}\033[0m"
}

# Function to check if required tools are installed
check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if Docker is installed
  if ! command -v docker &> /dev/null
  then
    log_error "Docker is not installed. Please install Docker."
    return 1
  fi
  log_success "Docker is installed."

  # Check if Docker Compose is installed
  if ! command -v docker-compose &> /dev/null
  then
    log_error "Docker Compose is not installed. Please install Docker Compose."
    return 1
  fi
  log_success "Docker Compose is installed."

  # Check if Node.js is installed
  if ! command -v node &> /dev/null
  then
    log_error "Node.js is not installed. Please install Node.js."
    return 1
  fi
  log_success "Node.js is installed."

  # Check if npm is installed
  if ! command -v npm &> /dev/null
  then
    log_error "npm is not installed. Please install npm."
    return 1
  fi
  log_success "npm is installed."

    # Check if git is installed
  if ! command -v git &> /dev/null
  then
    log_error "git is not installed. Please install git."
    return 1
  fi
  log_success "git is installed."

  log_success "All prerequisites are met."
  return 0
}

# Function to create the .env.development file
create_env_file() {
  log_info "Creating .env.development file..."

  # Check if the file already exists
  if [ -f "$ENV_FILE" ]; then
    if [ "$bypass_confirmation" = true ]; then
      log_info ".env.development already exists. Overwriting..."
    else
      read -r -p ".env.development already exists. Overwrite? (y/n) " response
      if [[ "$response" =~ ^([yY][eE][sS]|[yY]) ]]
      then
        log_info "Overwriting existing .env.development file."
      else
        log_info "Skipping .env.development creation."
        return
      fi
    fi
  fi

  # Create the .env.development file
  cat > "$ENV_FILE" <<EOL
NODE_ENV=development
PORT=5000
API_PREFIX=/api
MONGODB_URI=mongodb://localhost:27017/health-advisor-dev
JWT_SECRET=dev-jwt-secret
JWT_EXPIRATION=1d
REFRESH_TOKEN_EXPIRATION=7d
LLM_PROVIDER_API_KEY=YOUR_LLM_PROVIDER_API_KEY
LLM_PROVIDER_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo
CORS_ORIGIN=*
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=1000
LOG_LEVEL=debug
EOL

  log_success ".env.development file created."
}

# Function to install backend dependencies
install_backend_dependencies() {
  log_info "Installing backend dependencies..."
  cd "$BACKEND_DIR" || {
    log_error "Could not change directory to $BACKEND_DIR"
    return 1
  }

  if [ ! -f "package.json" ]; then
    log_error "package.json not found in $BACKEND_DIR"
    cd "$ROOT_DIR"
    return 1
  fi

  npm install
  if [ $? -ne 0 ]; then
    log_error "Failed to install backend dependencies."
    cd "$ROOT_DIR"
    return 1
  fi

  log_success "Backend dependencies installed."
  cd "$ROOT_DIR"
  return 0
}

# Function to install web dependencies
install_web_dependencies() {
  log_info "Installing web dependencies..."
  cd "$WEB_DIR" || {
    log_error "Could not change directory to $WEB_DIR"
    return 1
  }

  if [ ! -f "package.json" ]; then
    log_error "package.json not found in $WEB_DIR"
    cd "$ROOT_DIR"
    return 1
  fi

  npm install
  if [ $? -ne 0 ]; then
    log_error "Failed to install web dependencies."
    cd "$ROOT_DIR"
    return 1
  fi

  log_success "Web dependencies installed."
  cd "$ROOT_DIR"
  return 0
}

# Function to set up the Docker environment
setup_docker_environment() {
  log_info "Setting up Docker environment..."
  cd "$INFRASTRUCTURE_DIR" || {
    log_error "Could not change directory to $INFRASTRUCTURE_DIR"
    return 1
  }

  if [ ! -f "docker-compose.dev.yml" ]; then
    log_error "docker-compose.dev.yml not found in $INFRASTRUCTURE_DIR"
    cd "$ROOT_DIR"
    return 1
  fi

  docker-compose -f docker-compose.dev.yml up -d
  if [ $? -ne 0 ]; then
    log_error "Failed to start Docker containers."
    cd "$ROOT_DIR"
    return 1
  fi

  log_success "Docker containers started."
  cd "$ROOT_DIR"
  return 0
}

# Function to seed the database
seed_database() {
  log_info "Seeding database..."
  cd "$BACKEND_DIR" || {
    log_error "Could not change directory to $BACKEND_DIR"
    return 1
  }

  npm run db:seed
  if [ $? -ne 0 ]; then
    log_error "Failed to seed database."
    cd "$ROOT_DIR"
    return 1
  fi

  log_success "Database seeded."
  cd "$ROOT_DIR"
  return 0
}

# Function to set up Git hooks
setup_git_hooks() {
  log_info "Setting up Git hooks..."

  if [ ! -d "$ROOT_DIR/.git" ]; then
    log_error "Not a git repository."
    return 1
  fi

  # Create pre-commit hook
  echo "#!/bin/sh
npm run lint
npm test" > "$ROOT_DIR/.git/hooks/pre-commit"
  chmod +x "$ROOT_DIR/.git/hooks/pre-commit"

  # Create pre-push hook
  echo "#!/bin/sh
npm run lint
npm test
npm run typecheck" > "$ROOT_DIR/.git/hooks/pre-push"
  chmod +x "$ROOT_DIR/.git/hooks/pre-push"

  log_success "Git hooks set up."
  return 0
}

# Function to print next steps after setup
print_next_steps() {
  echo "${LOG_PREFIX} ------------------------------------------------------------------"
  echo "${LOG_PREFIX} Next Steps:"
  echo "${LOG_PREFIX} 1. Start the development server: cd src/backend && npm run dev"
  echo "${LOG_PREFIX} 2. Access the application: Open a web browser and navigate to http://localhost:5000"
  echo "${LOG_PREFIX} 3. Run tests: npm test"
  echo "${LOG_PREFIX} 4. For deployment instructions, refer to the documentation."
  echo "${LOG_PREFIX} ------------------------------------------------------------------"
}

# Function to perform cleanup operations in case of an error
cleanup_on_error() {
  log_info "Performing cleanup operations..."

  # Stop and remove Docker containers
  docker-compose -f "$INFRASTRUCTURE_DIR/docker-compose.dev.yml" down

  # Remove node_modules directories
  rm -rf "$BACKEND_DIR/node_modules"
  rm -rf "$WEB_DIR/node_modules"

  log_success "Cleanup completed."
}

# Main function to orchestrate the setup process
main() {
  print_banner

  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h | --help)
        print_usage
        return 0
        ;;
      -y)
        bypass_confirmation=true
        shift
        ;;
      *)
        echo "Unknown parameter: $1"
        print_usage
        return 1
        ;;
    esac
  done

  # Check prerequisites
  if ! check_prerequisites; then
    cleanup_on_error
    return 1
  fi

  # Create .env.development file
  create_env_file

  # Install backend dependencies
  if ! install_backend_dependencies; then
    cleanup_on_error
    return 1
  fi

  # Install web dependencies
  if ! install_web_dependencies; then
    cleanup_on_error
    return 1
  fi

  # Set up Docker environment
  if ! setup_docker_environment; then
    cleanup_on_error
    return 1
  fi

  # Seed the database
  if ! seed_database; then
    cleanup_on_error
    return 1
  fi

  # Set up Git hooks
  if ! setup_git_hooks; then
    cleanup_on_error
    return 1
  fi

  log_success "Development environment setup completed successfully!"
  print_next_steps

  return 0
}

# Run the main function
main "$@"