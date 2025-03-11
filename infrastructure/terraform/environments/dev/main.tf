# Terraform configuration for Health Advisor development environment
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
  
  backend "s3" {
    bucket         = "health-advisor-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "health-advisor-terraform-locks-dev"
  }
}

# Configure AWS provider with default tags for development environment
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "health-advisor"
      Environment = "dev"
      ManagedBy   = "terraform"
    }
  }
}

# Development environment-specific module configuration
module "main" {
  source = "../../"
  
  # Environment identification
  environment               = "dev"
  project_name              = "health-advisor"
  aws_region                = "us-east-1"
  
  # Network configuration
  vpc_cidr                 = "10.0.0.0/16"
  availability_zones       = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs      = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs     = ["10.0.3.0/24", "10.0.4.0/24"]
  
  # ECS configuration - development-sized for cost optimization
  ecs_task_cpu             = 1024   # 1 vCPU
  ecs_task_memory          = 2048   # 2GB RAM
  ecs_desired_count        = 2      # Minimum for high availability
  ecs_max_count            = 4      # Limited max scaling for dev environment
  
  # MongoDB configuration - smaller instance for development
  mongodb_instance_type    = "db.t3.medium"  # Cost-effective instance size
  mongodb_storage_size     = 25              # Reduced storage for development
  
  # S3 configuration
  s3_versioning_enabled    = true
  s3_encryption_enabled    = true
  
  # Feature flags
  enable_cloudfront        = true
  enable_multi_az          = true
  
  # Maintenance and backup - reduced retention for development
  backup_retention_days    = 7  # 7 days instead of 30 for production
  
  # Monitoring and security 
  enable_container_insights = true
  enable_encryption         = true
  enable_https              = true
  logs_retention_days       = 14  # Reduced log retention for development
  
  # Development-specific settings
  deletion_protection      = false  # Allow easy cleanup of development resources
  skip_final_snapshot      = true   # Skip final snapshot when destroying resources
}

# Output important resource identifiers
output "vpc_id" {
  value       = module.main.vpc_id
  description = "ID of the VPC created for the development environment"
}

output "public_subnet_ids" {
  value       = module.main.public_subnet_ids
  description = "IDs of the public subnets created for the development environment"
}

output "private_subnet_ids" {
  value       = module.main.private_subnet_ids
  description = "IDs of the private subnets created for the development environment"
}

output "ecs_cluster_name" {
  value       = module.main.ecs_cluster_name
  description = "Name of the ECS cluster created for the development environment"
}

output "ecs_service_name" {
  value       = module.main.ecs_service_name
  description = "Name of the ECS service created for the development environment"
}

output "mongodb_endpoint" {
  value       = module.main.mongodb_endpoint
  description = "Endpoint of the MongoDB instance created for the development environment"
}

output "s3_bucket_name" {
  value       = module.main.s3_bucket_name
  description = "Name of the S3 bucket created for the development environment"
}

output "cloudfront_domain_name" {
  value       = module.main.cloudfront_domain_name
  description = "Domain name of the CloudFront distribution created for the development environment"
}

output "alb_dns_name" {
  value       = module.main.alb_dns_name
  description = "DNS name of the Application Load Balancer created for the development environment"
}