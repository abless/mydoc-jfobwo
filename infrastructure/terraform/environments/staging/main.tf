# Configure Terraform backend for state management
terraform {
  backend "s3" {
    bucket         = "health-advisor-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "health-advisor-terraform-locks-staging"
  }

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
}

# Configure AWS provider
provider "aws" {
  region = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "health-advisor"
      Environment = "staging"
      ManagedBy   = "terraform"
    }
  }
}

# Import main module with staging-specific parameters
module "main" {
  source = "../../"

  # Environment settings
  environment = "staging"
  project_name = "health-advisor"
  aws_region = "us-east-1"
  
  # Networking configuration - similar to production for accurate testing
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  private_subnet_cidrs = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
  
  # ECS configuration - balanced for staging
  ecs_task_cpu = 1024        # 1 vCPU
  ecs_task_memory = 2048     # 2 GB
  ecs_desired_count = 2      # High availability with 2 tasks
  ecs_max_count = 6          # Higher than dev, lower than prod
  
  # MongoDB configuration - balanced for staging
  mongodb_instance_type = "db.t3.large"
  mongodb_storage_size = 50   # GB
  
  # S3 configuration
  s3_versioning_enabled = true
  s3_encryption_enabled = true
  
  # Feature flags
  enable_cloudfront = true
  enable_multi_az = true        # Enable Multi-AZ for high availability
  
  # Backup and maintenance
  backup_retention_days = 14    # 2 weeks retention for staging
  
  # Monitoring and security
  enable_container_insights = true
  enable_encryption = true
  enable_https = true
  logs_retention_days = 30
  
  # Protection
  deletion_protection = true
  skip_final_snapshot = false
  
  # Additional tags
  tags = {
    Project             = "health-advisor"
    Environment         = "staging"
    ManagedBy           = "terraform"
    DataClassification  = "PHI"
    ComplianceFramework = "HIPAA"
  }
}

# Data sources for integration with existing resources
data "aws_route53_zone" "main" {
  name         = "healthadvisor.com"
  private_zone = false
}

data "aws_caller_identity" "current" {}

data "aws_region" "current" {}

# DNS record for the staging API
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api-staging.healthadvisor.com"
  type    = "A"
  
  alias {
    name                   = module.main.alb_dns_name
    zone_id                = module.main.alb_zone_id
    evaluate_target_health = true
  }
}

# CloudWatch dashboard for staging environment monitoring
resource "aws_cloudwatch_dashboard" "staging_dashboard" {
  dashboard_name = "health-advisor-staging"
  
  dashboard_body = <<EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ECS", "CPUUtilization", "ServiceName", "${module.main.ecs_service_name}", "ClusterName", "${module.main.ecs_cluster_name}" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS CPU Utilization"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ECS", "MemoryUtilization", "ServiceName", "${module.main.ecs_service_name}", "ClusterName", "${module.main.ecs_cluster_name}" ]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Memory Utilization"
      }
    },
    {
      "type": "metric",
      "x": 0,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${module.main.alb_arn_suffix}" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "ALB Request Count"
      }
    },
    {
      "type": "metric",
      "x": 12,
      "y": 6,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/ApplicationELB", "HTTPCode_Target_4XX_Count", "LoadBalancer", "${module.main.alb_arn_suffix}" ],
          [ "AWS/ApplicationELB", "HTTPCode_Target_5XX_Count", "LoadBalancer", "${module.main.alb_arn_suffix}" ]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "ALB Error Codes"
      }
    }
  ]
}
EOF
}

# SNS topic for staging alerts
resource "aws_sns_topic" "alerts" {
  name              = "health-advisor-staging-alerts"
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = "staging-alerts@healthadvisor.com"
}

# Output important resource identifiers
output "vpc_id" {
  description = "ID of the VPC created for the staging environment"
  value       = module.main.vpc_id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets created for the staging environment"
  value       = module.main.public_subnet_ids
}

output "private_subnet_ids" {
  description = "IDs of the private subnets created for the staging environment"
  value       = module.main.private_subnet_ids
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster created for the staging environment"
  value       = module.main.ecs_cluster_name
}

output "ecs_service_name" {
  description = "Name of the ECS service created for the staging environment"
  value       = module.main.ecs_service_name
}

output "mongodb_endpoint" {
  description = "Endpoint of the MongoDB instance created for the staging environment"
  value       = module.main.mongodb_endpoint
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket created for the staging environment"
  value       = module.main.s3_bucket_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution created for the staging environment"
  value       = module.main.cloudfront_domain_name
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer created for the staging environment"
  value       = module.main.alb_dns_name
}