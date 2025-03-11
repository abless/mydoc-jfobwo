terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

locals {
  bucket_name = "${var.project_name}-${var.environment}-health-data"
  common_tags = {
    Name        = "${var.project_name}-${var.environment}-health-data"
    Project     = "${var.project_name}"
    Environment = "${var.environment}"
    ManagedBy   = "terraform"
  }
}

# S3 bucket for storing health data files including meal photos, lab results, and voice recordings
resource "aws_s3_bucket" "main" {
  bucket        = local.bucket_name
  force_destroy = var.force_destroy
  tags          = merge(local.common_tags, var.tags)
}

# Enables versioning for the S3 bucket to support point-in-time recovery of health data
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id
  versioning_configuration {
    status = var.versioning_enabled ? "Enabled" : "Disabled"
  }
}

# Configures server-side encryption for the S3 bucket to protect sensitive health data
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  count  = var.encryption_enabled ? 1 : 0
  
  bucket = aws_s3_bucket.main.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# Configures lifecycle rules for the S3 bucket to optimize storage costs
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count  = var.lifecycle_rules_enabled ? 1 : 0
  
  bucket = aws_s3_bucket.main.id
  
  rule {
    id     = "transition-to-standard-ia"
    status = "Enabled"
    
    transition {
      days          = var.standard_ia_transition_days
      storage_class = "STANDARD_IA"
    }
  }
  
  rule {
    id     = "noncurrent-version-expiration"
    status = "Enabled"
    
    noncurrent_version_expiration {
      noncurrent_days = var.noncurrent_version_expiration_days
    }
  }
}

# Configures CORS for the S3 bucket to allow access from the mobile application
resource "aws_s3_bucket_cors_configuration" "main" {
  bucket = aws_s3_bucket.main.id
  
  cors_rule {
    allowed_headers = var.cors_allowed_headers
    allowed_methods = var.cors_allowed_methods
    allowed_origins = var.cors_allowed_origins
    expose_headers  = var.cors_expose_headers
    max_age_seconds = var.cors_max_age_seconds
  }
}

# Blocks public access to the S3 bucket to ensure health data privacy
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Applies a bucket policy to enforce HTTPS-only access to the S3 bucket
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "EnforceHTTPS",
        Effect    = "Deny",
        Principal = "*",
        Action    = "s3:*",
        Resource = [
          "${aws_s3_bucket.main.arn}",
          "${aws_s3_bucket.main.arn}/*"
        ],
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}

# Get current AWS region
data "aws_region" "current" {}

# Module outputs
output "bucket_id" {
  description = "ID of the created S3 bucket for health data storage"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket for IAM policy references"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "Regional domain name of the S3 bucket for URL construction"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

output "bucket_name" {
  description = "Name of the created S3 bucket for reference in application configuration"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_region" {
  description = "AWS region where the S3 bucket is located"
  value       = data.aws_region.current.name
}