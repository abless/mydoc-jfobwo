# Terraform backend configuration for production environment
terraform {
  required_version = ">= 1.0.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws" # ~> 4.0
      version = "~> 4.0"
    }
    random = {
      source  = "hashicorp/random" # ~> 3.0
      version = "~> 3.0"
    }
  }
  
  backend "s3" {
    bucket         = "health-advisor-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "health-advisor-terraform-locks-prod"
  }
}

# Configure AWS provider with production-specific settings
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "health-advisor"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

# Production environment variables
locals {
  environment            = "prod"
  project_name           = "health-advisor"
  aws_region             = "us-east-1"
  vpc_cidr               = "10.0.0.0/16"
  availability_zones     = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs   = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
  ecs_task_cpu           = 2048
  ecs_task_memory        = 4096
  ecs_desired_count      = 3
  ecs_max_count          = 10
  mongodb_instance_type  = "db.r5.large"
  mongodb_storage_size   = 100
  s3_versioning_enabled  = true
  s3_encryption_enabled  = true
  enable_cloudfront      = true
  enable_multi_az        = true
  backup_retention_days  = 30
  enable_container_insights = true
  enable_encryption      = true
  enable_https           = true
  logs_retention_days    = 90
  deletion_protection    = true
  skip_final_snapshot    = false
  preferred_backup_window = "02:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:06:00"
}

# Reference to main module with production-specific settings
module "main" {
  source = "../../"
  
  environment                 = "prod"
  project_name                = "health-advisor"
  aws_region                  = "us-east-1"
  vpc_cidr                    = "10.0.0.0/16"
  availability_zones          = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs         = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs        = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
  ecs_task_cpu                = 2048
  ecs_task_memory             = 4096
  ecs_desired_count           = 3
  ecs_max_count               = 10
  mongodb_instance_type       = "db.r5.large"
  mongodb_storage_size        = 100
  s3_versioning_enabled       = true
  s3_encryption_enabled       = true
  enable_cloudfront           = true
  enable_multi_az             = true
  backup_retention_days       = 30
  enable_container_insights   = true
  enable_encryption           = true
  enable_https                = true
  logs_retention_days         = 90
  deletion_protection         = true
  skip_final_snapshot         = false
  preferred_backup_window     = "02:00-04:00"
  preferred_maintenance_window = "sun:04:00-sun:06:00"
  
  tags = {
    Project              = "health-advisor"
    Environment          = "prod"
    ManagedBy            = "terraform"
    DataClassification   = "PHI"
    ComplianceFramework  = "HIPAA"
  }
}

# Data sources
data "aws_route53_zone" "main" {
  name         = "healthadvisor.com"
  private_zone = false
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# Production-specific resources

# Comprehensive CloudWatch dashboard for monitoring production infrastructure
resource "aws_cloudwatch_dashboard" "production_dashboard" {
  dashboard_name = "health-advisor-production"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ServiceName", "${module.main.ecs_service_name}", "ClusterName", "${module.main.ecs_cluster_name}"]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "ECS CPU Utilization"
          alarm  = {
            alarmName = "health-advisor-prod-cpu-alarm"
            visible   = true
          }
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ECS", "MemoryUtilization", "ServiceName", "${module.main.ecs_service_name}", "ClusterName", "${module.main.ecs_cluster_name}"]
          ]
          period = 60
          stat   = "Average"
          region = var.aws_region
          title  = "ECS Memory Utilization"
          alarm  = {
            alarmName = "health-advisor-prod-memory-alarm"
            visible   = true
          }
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "${module.main.alb_arn_suffix}"]
          ]
          period = 60
          stat   = "Sum"
          region = var.aws_region
          title  = "API 5XX Errors"
          alarm  = {
            alarmName = "health-advisor-prod-5xx-errors"
            visible   = true
          }
          view    = "timeSeries"
          stacked = false
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", "${module.main.alb_arn_suffix}", { "stat": "p95" }]
          ]
          period = 60
          region = var.aws_region
          title  = "API Response Time (p95)"
          alarm  = {
            alarmName = "health-advisor-prod-api-latency"
            visible   = true
          }
          view    = "timeSeries"
          stacked = false
        }
      }
    ]
  })
}

# SNS topic for production alerts
resource "aws_sns_topic" "alerts" {
  name              = "health-advisor-prod-alerts"
  kms_master_key_id = "alias/aws/sns"
  tags = {
    Name        = "health-advisor-prod-alerts"
    Environment = "prod"
    Project     = "health-advisor"
  }
}

# Email subscription for production alerts
resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "prod-alerts@healthadvisor.com"
}

# SMS subscription for critical production alerts
resource "aws_sns_topic_subscription" "sms_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "sms"
  endpoint  = "+15551234567"
}

# SSL certificate for the production API endpoint
resource "aws_acm_certificate" "api_cert" {
  domain_name       = "api.healthadvisor.com"
  validation_method = "DNS"
  tags = {
    Name        = "health-advisor-prod-api-cert"
    Environment = "prod"
    Project     = "health-advisor"
  }
  lifecycle {
    create_before_destroy = true
  }
}

# DNS record for validating the API SSL certificate
resource "aws_route53_record" "api_cert_validation" {
  name    = tolist(aws_acm_certificate.api_cert.domain_validation_options)[0].resource_record_name
  type    = tolist(aws_acm_certificate.api_cert.domain_validation_options)[0].resource_record_type
  zone_id = data.aws_route53_zone.main.zone_id
  records = [tolist(aws_acm_certificate.api_cert.domain_validation_options)[0].resource_record_value]
  ttl     = 60
}

# Certificate validation
resource "aws_acm_certificate_validation" "api_cert_validation" {
  certificate_arn         = aws_acm_certificate.api_cert.arn
  validation_record_fqdns = [aws_route53_record.api_cert_validation.fqdn]
}

# DNS record for the production API endpoint
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.healthadvisor.com"
  type    = "A"
  alias {
    name                   = module.main.alb_dns_name
    zone_id                = module.main.alb_zone_id
    evaluate_target_health = true
  }
}

# DNS record for the production CDN endpoint
resource "aws_route53_record" "cdn" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "cdn.healthadvisor.com"
  type    = "A"
  alias {
    name                   = module.main.cloudfront_domain_name
    zone_id                = "Z2FDTNDATAQYW2" # CloudFront hosted zone ID
    evaluate_target_health = false
  }
}

# WAF Web ACL for protecting the production API
resource "aws_wafv2_web_acl" "main" {
  name        = "health-advisor-prod-waf"
  scope       = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2
    
    override_action {
      none {}
    }
    
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "RateLimitRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      rate_based_statement {
        limit              = 3000
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "health-advisor-prod-waf"
    sampled_requests_enabled   = true
  }
  
  tags = {
    Name        = "health-advisor-prod-waf"
    Environment = "prod"
    Project     = "health-advisor"
  }
}

# Associates the WAF Web ACL with the ALB
resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = module.main.alb_arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# CloudWatch alarm for 5xx errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "health-advisor-prod-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "This alarm monitors for 5xx errors from the API"
  
  dimensions = {
    LoadBalancer = module.main.alb_arn_suffix
  }
  
  alarm_actions             = [aws_sns_topic.alerts.arn]
  ok_actions                = [aws_sns_topic.alerts.arn]
  insufficient_data_actions = []
  treat_missing_data        = "notBreaching"
  
  tags = {
    Name        = "health-advisor-prod-5xx-errors"
    Environment = "prod"
    Project     = "health-advisor"
  }
}

# CloudWatch alarm for API latency
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "health-advisor-prod-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  extended_statistic  = "p95"
  threshold           = 2
  alarm_description   = "This alarm monitors for high API latency (p95 > 2s)"
  
  dimensions = {
    LoadBalancer = module.main.alb_arn_suffix
  }
  
  alarm_actions             = [aws_sns_topic.alerts.arn]
  ok_actions                = [aws_sns_topic.alerts.arn]
  insufficient_data_actions = []
  treat_missing_data        = "notBreaching"
  
  tags = {
    Name        = "health-advisor-prod-api-latency"
    Environment = "prod"
    Project     = "health-advisor"
  }
}

# Output values
output "vpc_id" {
  value       = module.main.vpc_id
  description = "ID of the VPC created for the production environment"
}

output "public_subnet_ids" {
  value       = module.main.public_subnet_ids
  description = "IDs of the public subnets created for the production environment"
}

output "private_subnet_ids" {
  value       = module.main.private_subnet_ids
  description = "IDs of the private subnets created for the production environment"
}

output "ecs_cluster_name" {
  value       = module.main.ecs_cluster_name
  description = "Name of the ECS cluster created for the production environment"
}

output "ecs_service_name" {
  value       = module.main.ecs_service_name
  description = "Name of the ECS service created for the production environment"
}

output "mongodb_endpoint" {
  value       = module.main.mongodb_endpoint
  description = "Endpoint of the MongoDB instance created for the production environment"
}

output "s3_bucket_name" {
  value       = module.main.s3_bucket_name
  description = "Name of the S3 bucket created for the production environment"
}

output "cloudfront_domain_name" {
  value       = module.main.cloudfront_domain_name
  description = "Domain name of the CloudFront distribution created for the production environment"
}

output "alb_dns_name" {
  value       = module.main.alb_dns_name
  description = "DNS name of the Application Load Balancer created for the production environment"
}