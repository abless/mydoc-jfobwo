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
  description = "Deployment environment (dev, staging, prod) for resource naming and tagging"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "s3_bucket_id" {
  description = "ID of the S3 bucket to use as the CloudFront origin"
  type        = string
}

variable "s3_bucket_domain_name" {
  description = "Domain name of the S3 bucket to use as the CloudFront origin"
  type        = string
}

variable "s3_bucket_arn" {
  description = "ARN of the S3 bucket for bucket policy configuration"
  type        = string
}

variable "price_class" {
  description = "CloudFront price class to control distribution edge locations and cost"
  type        = string
  default     = "PriceClass_100"
  
  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "Price class must be one of: PriceClass_100, PriceClass_200, PriceClass_All."
  }
}

variable "enable_compression" {
  description = "Whether to enable compression for CloudFront distribution"
  type        = bool
  default     = true
}

variable "default_ttl" {
  description = "Default TTL for CloudFront cache in seconds"
  type        = number
  default     = 86400  # 1 day
}

variable "min_ttl" {
  description = "Minimum TTL for CloudFront cache in seconds"
  type        = number
  default     = 0
}

variable "max_ttl" {
  description = "Maximum TTL for CloudFront cache in seconds"
  type        = number
  default     = 31536000  # 1 year
}

variable "allowed_methods" {
  description = "HTTP methods that CloudFront processes and forwards to the origin"
  type        = list(string)
  default     = ["GET", "HEAD", "OPTIONS"]
}

variable "cached_methods" {
  description = "HTTP methods that CloudFront caches responses for"
  type        = list(string)
  default     = ["GET", "HEAD"]
}

variable "viewer_protocol_policy" {
  description = "Protocol policy for viewer connections (HTTP to HTTPS redirect, HTTPS only, etc.)"
  type        = string
  default     = "redirect-to-https"
  
  validation {
    condition     = contains(["allow-all", "redirect-to-https", "https-only"], var.viewer_protocol_policy)
    error_message = "Viewer protocol policy must be one of: allow-all, redirect-to-https, https-only."
  }
}

variable "tags" {
  description = "Additional tags to apply to CloudFront resources"
  type        = map(string)
  default     = {}
}