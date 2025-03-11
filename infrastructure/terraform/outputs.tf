# Network Infrastructure Outputs
output "vpc_id" {
  description = "ID of the VPC where all resources are deployed"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

# ECS Cluster and Service Outputs
output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service running the backend application"
  value       = module.ecs.service_name
}

output "backend_url" {
  description = "URL of the backend service load balancer"
  value       = "https://${module.ecs.alb_dns_name}"
}

# MongoDB Database Outputs
output "mongodb_endpoint" {
  description = "Endpoint for the MongoDB database"
  value       = module.mongodb.endpoint
}

output "mongodb_connection_string" {
  description = "Connection string for the MongoDB database"
  value       = module.mongodb.connection_string
  sensitive   = true
}

output "mongodb_secret_arn" {
  description = "ARN of the secret containing MongoDB credentials"
  value       = module.mongodb.secret_arn
}

# S3 Storage Outputs
output "s3_bucket_name" {
  description = "Name of the S3 bucket for health data storage"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for health data storage"
  value       = module.s3.bucket_arn
}

# CloudFront Content Delivery Outputs
output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution for content delivery"
  value       = var.enable_cloudfront ? module.cloudfront.distribution_domain_name : null
}

# Environment Information
output "environment" {
  description = "Deployment environment (dev, staging, prod)"
  value       = var.environment
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

# Security Group Outputs
output "security_groups" {
  description = "Map of security group IDs for different components"
  value = {
    ecs     = aws_security_group.ecs.id
    alb     = aws_security_group.alb.id
    mongodb = aws_security_group.mongodb.id
  }
}