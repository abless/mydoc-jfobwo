# Basic Project Information
variable "project_name" {
  description = "Name of the project used for resource naming and tagging"
  type        = string
  default     = "health-advisor"
  
  validation {
    condition     = length(var.project_name) > 0
    error_message = "The project_name variable must not be empty."
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

# AWS Region
variable "aws_region" {
  description = "AWS region where resources will be deployed"
  type        = string
  default     = "us-east-1"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones for high availability deployment"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (one per AZ)"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

# ECS Configuration
variable "ecs_task_cpu" {
  description = "CPU units for the ECS task (1 vCPU = 1024 units)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for the ECS task in MiB"
  type        = number
  default     = 2048
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks running"
  type        = number
  default     = 2
}

variable "ecs_max_count" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 10
}

# MongoDB Configuration
variable "mongodb_instance_type" {
  description = "Instance type for MongoDB (AWS DocumentDB)"
  type        = string
  default     = "db.t3.medium"
}

variable "mongodb_storage_size" {
  description = "Storage size in GB for MongoDB"
  type        = number
  default     = 100
}

# S3 Configuration
variable "s3_versioning_enabled" {
  description = "Whether to enable versioning for the S3 bucket to support point-in-time recovery"
  type        = bool
  default     = true
}

variable "s3_encryption_enabled" {
  description = "Whether to enable server-side encryption for the S3 bucket to protect sensitive health data"
  type        = bool
  default     = true
}

# Feature Flags
variable "enable_cloudfront" {
  description = "Whether to enable CloudFront distribution for content delivery"
  type        = bool
  default     = true
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

# Backup and Maintenance
variable "backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30
}

variable "enable_container_insights" {
  description = "Enable Container Insights for the ECS cluster"
  type        = bool
  default     = true
}

variable "enable_encryption" {
  description = "Enable encryption at rest for sensitive data"
  type        = bool
  default     = true
}

variable "enable_https" {
  description = "Enable HTTPS for the load balancer"
  type        = bool
  default     = true
}

variable "logs_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "preferred_backup_window" {
  description = "Preferred backup window for automated backups (format: hh24:mi-hh24:mi)"
  type        = string
  default     = "02:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Preferred maintenance window (format: ddd:hh24:mi-ddd:hh24:mi)"
  type        = string
  default     = "sun:04:00-sun:06:00"
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying database resources"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}