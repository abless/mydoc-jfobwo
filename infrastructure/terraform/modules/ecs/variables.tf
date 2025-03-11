variable "project_name" {
  type        = string
  description = "Name of the project used for resource naming and tagging"
  default     = "health-advisor"
  
  validation {
    condition     = length(var.project_name) > 0
    error_message = "The project_name variable must not be empty."
  }
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "vpc_id" {
  type        = string
  description = "ID of the VPC where ECS resources will be deployed"
  
  validation {
    condition     = length(var.vpc_id) > 0
    error_message = "VPC ID must not be empty."
  }
}

variable "subnet_ids" {
  type        = list(string)
  description = "List of subnet IDs where ECS tasks will be deployed (should be private subnets)"
  
  validation {
    condition     = length(var.subnet_ids) > 0
    error_message = "At least one subnet ID must be provided."
  }
}

variable "security_group_ids" {
  type        = list(string)
  description = "List of security group IDs to attach to ECS tasks"
  default     = []
}

variable "task_cpu" {
  type        = number
  description = "CPU units for the ECS task (1 vCPU = 1024 units)"
  default     = 1024
  
  validation {
    condition     = contains([256, 512, 1024, 2048, 4096], var.task_cpu)
    error_message = "Task CPU must be one of the allowed values: 256, 512, 1024, 2048, 4096."
  }
}

variable "task_memory" {
  type        = number
  description = "Memory for the ECS task in MiB"
  default     = 2048
  
  validation {
    condition     = contains([512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192], var.task_memory)
    error_message = "Task memory must be one of the allowed values: 512, 1024, 2048, 3072, 4096, 5120, 6144, 7168, 8192."
  }
}

variable "desired_count" {
  type        = number
  description = "Desired number of ECS tasks running"
  default     = 2
  
  validation {
    condition     = var.desired_count > 0
    error_message = "Desired count must be greater than 0."
  }
}

variable "max_count" {
  type        = number
  description = "Maximum number of ECS tasks for auto-scaling"
  default     = 10
  
  validation {
    condition     = var.max_count >= var.desired_count
    error_message = "Maximum count must be greater than or equal to desired count."
  }
}

variable "health_check_path" {
  type        = string
  description = "Path for health check endpoint"
  default     = "/health"
}

variable "container_port" {
  type        = number
  description = "Port exposed by the container"
  default     = 3000
  
  validation {
    condition     = var.container_port > 0 && var.container_port < 65536
    error_message = "Container port must be between 1 and 65535."
  }
}

variable "container_image" {
  type        = string
  description = "Docker image for the container (without tag)"
  default     = "health-advisor-backend"
}

variable "container_image_tag" {
  type        = string
  description = "Tag for the Docker image"
  default     = "latest"
}

variable "cpu_scaling_target" {
  type        = number
  description = "Target CPU utilization percentage for auto-scaling"
  default     = 70
  
  validation {
    condition     = var.cpu_scaling_target > 0 && var.cpu_scaling_target <= 100
    error_message = "CPU scaling target must be between 1 and 100."
  }
}

variable "memory_scaling_target" {
  type        = number
  description = "Target memory utilization percentage for auto-scaling"
  default     = 80
  
  validation {
    condition     = var.memory_scaling_target > 0 && var.memory_scaling_target <= 100
    error_message = "Memory scaling target must be between 1 and 100."
  }
}

variable "request_scaling_target" {
  type        = number
  description = "Target request count per target for auto-scaling"
  default     = 1000
  
  validation {
    condition     = var.request_scaling_target > 0
    error_message = "Request scaling target must be greater than 0."
  }
}

variable "scale_in_cooldown" {
  type        = number
  description = "Cooldown period in seconds after a scale in activity"
  default     = 60
}

variable "scale_out_cooldown" {
  type        = number
  description = "Cooldown period in seconds after a scale out activity"
  default     = 60
}

variable "enable_https" {
  type        = bool
  description = "Enable HTTPS for the load balancer"
  default     = true
}

variable "logs_retention_days" {
  type        = number
  description = "Number of days to retain CloudWatch logs"
  default     = 30
  
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.logs_retention_days)
    error_message = "Logs retention days must be one of the allowed values: 1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653."
  }
}

variable "enable_container_insights" {
  type        = bool
  description = "Enable Container Insights for the ECS cluster"
  default     = true
}