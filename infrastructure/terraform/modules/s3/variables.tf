variable "project_name" {
  description = "Name of the project used for S3 bucket naming and tagging"
  type        = string
  default     = "health-advisor"

  validation {
    condition     = length(var.project_name) > 0
    error_message = "The project_name variable must not be empty."
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod) for S3 bucket naming and tagging"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "versioning_enabled" {
  description = "Whether to enable versioning for the S3 bucket to support point-in-time recovery of health data"
  type        = bool
  default     = true
}

variable "encryption_enabled" {
  description = "Whether to enable server-side encryption for the S3 bucket to protect sensitive health data"
  type        = bool
  default     = true
}

variable "lifecycle_rules_enabled" {
  description = "Whether to enable lifecycle rules for the S3 bucket to optimize storage costs"
  type        = bool
  default     = true
}

variable "standard_ia_transition_days" {
  description = "Number of days after which objects transition to STANDARD_IA storage class for cost optimization"
  type        = number
  default     = 30
}

variable "noncurrent_version_expiration_days" {
  description = "Number of days after which noncurrent object versions are deleted to manage storage costs"
  type        = number
  default     = 90
}

variable "cors_allowed_origins" {
  description = "List of origins allowed for CORS requests to the S3 bucket from the mobile application"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allowed_methods" {
  description = "List of HTTP methods allowed for CORS requests to the S3 bucket"
  type        = list(string)
  default     = ["GET", "PUT", "POST", "DELETE", "HEAD"]
}

variable "cors_allowed_headers" {
  description = "List of headers allowed for CORS requests to the S3 bucket"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "List of headers exposed in CORS responses from the S3 bucket"
  type        = list(string)
  default     = ["ETag", "Content-Length", "Content-Type"]
}

variable "cors_max_age_seconds" {
  description = "Maximum age in seconds for browser caching of CORS preflight responses"
  type        = number
  default     = 3600
}

variable "force_destroy" {
  description = "Whether to allow deletion of non-empty S3 bucket when destroying infrastructure"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Additional tags to apply to the S3 bucket and related resources"
  type        = map(string)
  default     = {}
}