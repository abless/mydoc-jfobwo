# CloudFront module for Health Advisor application
# Provides a content delivery network for static assets and health data images
# Uses AWS Provider version ~> 4.0

locals {
  # Unique identifier for the S3 origin in the CloudFront distribution
  s3_origin_id = "${var.project_name}-${var.environment}-s3-origin"
  
  # Common tags to apply to all CloudFront resources
  common_tags = {
    Name        = "${var.project_name}-${var.environment}-cloudfront"
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Create CloudFront Origin Access Identity for secure S3 access
# This ensures that S3 content can only be accessed through CloudFront
resource "aws_cloudfront_origin_access_identity" "main" {
  comment = "Origin Access Identity for ${var.project_name}-${var.environment} S3 bucket"
}

# Create CloudFront distribution for content delivery
# This distribution serves static assets and health data images with proper caching
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CloudFront distribution for ${var.project_name}-${var.environment}"
  default_root_object = "index.html"
  price_class         = var.price_class
  wait_for_deployment = false
  tags                = local.common_tags

  # Configure S3 as the origin for this distribution
  origin {
    domain_name = var.s3_bucket_domain_name
    origin_id   = local.s3_origin_id

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
    }
  }

  # Configure default caching behavior
  default_cache_behavior {
    allowed_methods        = var.allowed_methods
    cached_methods         = var.cached_methods
    target_origin_id       = local.s3_origin_id
    viewer_protocol_policy = var.viewer_protocol_policy
    compress               = var.enable_compression
    min_ttl                = var.min_ttl
    default_ttl            = var.default_ttl
    max_ttl                = var.max_ttl

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  # No geographical restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use default CloudFront certificate
  # For production, this should be replaced with a custom SSL certificate
  viewer_certificate {
    cloudfront_default_certificate = true
  }
}

# Set S3 bucket policy to allow CloudFront access
# This implements the principle of least privilege by only allowing specific access
resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = var.s3_bucket_id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipal",
        Effect    = "Allow",
        Principal = {
          Service = "cloudfront.amazonaws.com"
        },
        Action    = "s3:GetObject",
        Resource  = "${var.s3_bucket_arn}/*",
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.main.arn
          }
        }
      },
      {
        Sid       = "AllowCloudFrontOAI",
        Effect    = "Allow",
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.main.iam_arn
        },
        Action    = "s3:GetObject",
        Resource  = "${var.s3_bucket_arn}/*"
      }
    ]
  })
}

# Output CloudFront distribution ID for reference in other resources
output "distribution_id" {
  description = "ID of the created CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

# Output CloudFront domain name for use in application configuration
output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

# Output CloudFront origin access identity path for S3 bucket policy configuration
output "origin_access_identity" {
  description = "CloudFront origin access identity path for S3 bucket policy"
  value       = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
}