# Configure Terraform providers for Health Advisor infrastructure

terraform {
  # Specify the required Terraform version
  required_version = ">= 1.0.0"
  
  # Configure the required providers with their sources and versions
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
  
  # Local backend configuration for development
  # This will be overridden in environment-specific configurations
  backend "local" {
    path = "terraform.tfstate"
  }
}

# AWS provider configuration
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project   = "health-advisor"
      ManagedBy = "terraform"
      Environment = var.environment
    }
  }
}

# Configure other providers
provider "random" {
  # No specific configuration needed for random provider
}

provider "null" {
  # No specific configuration needed for null provider
}

provider "archive" {
  # No specific configuration needed for archive provider
}