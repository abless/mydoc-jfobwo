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

variable "vpc_id" {
  description = "ID of the VPC where MongoDB resources will be deployed"
  type        = string

  validation {
    condition     = length(var.vpc_id) > 0
    error_message = "VPC ID must not be empty."
  }
}

variable "subnet_ids" {
  description = "List of subnet IDs where MongoDB instances will be deployed (should be private subnets)"
  type        = list(string)

  validation {
    condition     = length(var.subnet_ids) > 0
    error_message = "At least one subnet ID must be provided."
  }
}

variable "security_group_ids" {
  description = "List of security group IDs to attach to MongoDB instances"
  type        = list(string)
  default     = []
}

variable "instance_type" {
  description = "Instance type for MongoDB (AWS DocumentDB) instances"
  type        = string
  default     = "db.t3.medium"
}

variable "storage_size" {
  description = "Storage size in GB for MongoDB"
  type        = number
  default     = 100

  validation {
    condition     = var.storage_size >= 100
    error_message = "Storage size must be at least 100 GB."
  }
}

variable "enable_multi_az" {
  description = "Enable Multi-AZ deployment for high availability"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 30

  validation {
    condition     = var.backup_retention_days >= 1 && var.backup_retention_days <= 35
    error_message = "Backup retention days must be between 1 and 35."
  }
}

variable "enable_encryption" {
  description = "Enable encryption at rest for MongoDB data"
  type        = bool
  default     = true
}

variable "enable_cloudwatch_logs" {
  description = "Enable CloudWatch logging for MongoDB audit logs"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection for MongoDB cluster"
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
  description = "Skip final snapshot when destroying MongoDB resources"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to MongoDB resources"
  type        = map(string)
  default     = {}
}