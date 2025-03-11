# Provider requirements
terraform {
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

# Local values for consistent naming and tagging
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Component   = "database"
  }
  name_prefix = "${var.project_name}-${var.environment}"
}

# Generate a secure random password for MongoDB authentication
resource "random_password" "mongodb_password" {
  length      = 16
  special     = false
  min_upper   = 1
  min_lower   = 1
  min_numeric = 1
}

# Create a subnet group for the MongoDB cluster spanning multiple AZs
resource "aws_docdb_subnet_group" "mongodb" {
  name       = "${var.project_name}-${var.environment}-mongodb-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-subnet-group"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create a parameter group to configure MongoDB settings
resource "aws_docdb_cluster_parameter_group" "mongodb" {
  family      = "docdb4.0"
  name        = "${var.project_name}-${var.environment}-mongodb-params"
  description = "Parameter group for ${var.project_name} ${var.environment} MongoDB"
  
  parameter {
    name  = "tls"
    value = "enabled"
  }
  
  parameter {
    name  = "audit_logs"
    value = var.enable_cloudwatch_logs ? "enabled" : "disabled"
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-params"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create the MongoDB-compatible DocumentDB cluster
resource "aws_docdb_cluster" "mongodb" {
  cluster_identifier              = "${var.project_name}-${var.environment}-mongodb"
  engine                          = "docdb"
  master_username                 = "administrator"
  master_password                 = random_password.mongodb_password.result
  db_subnet_group_name            = aws_docdb_subnet_group.mongodb.name
  vpc_security_group_ids          = var.security_group_ids
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.mongodb.name
  backup_retention_period         = var.backup_retention_days
  preferred_backup_window         = var.preferred_backup_window
  preferred_maintenance_window    = var.preferred_maintenance_window
  skip_final_snapshot             = var.skip_final_snapshot
  final_snapshot_identifier       = var.skip_final_snapshot ? null : "${var.project_name}-${var.environment}-mongodb-final-snapshot"
  deletion_protection             = var.deletion_protection
  storage_encrypted               = var.enable_encryption
  enabled_cloudwatch_logs_exports = var.enable_cloudwatch_logs ? ["audit"] : []
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Create DocumentDB instances in multiple AZs if multi-AZ is enabled
resource "aws_docdb_cluster_instance" "mongodb_instances" {
  count              = var.enable_multi_az ? 2 : 1
  identifier         = "${var.project_name}-${var.environment}-mongodb-${count.index}"
  cluster_identifier = aws_docdb_cluster.mongodb.id
  instance_class     = var.instance_type
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-${count.index}"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Store MongoDB credentials securely in AWS Secrets Manager
resource "aws_secretsmanager_secret" "mongodb_credentials" {
  name        = "${var.project_name}-${var.environment}-mongodb-credentials"
  description = "MongoDB credentials for ${var.project_name} ${var.environment}"
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-credentials"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Store the MongoDB connection details and credentials
resource "aws_secretsmanager_secret_version" "mongodb_credentials" {
  secret_id = aws_secretsmanager_secret.mongodb_credentials.id
  secret_string = jsonencode({
    username = "administrator"
    password = random_password.mongodb_password.result
    endpoint = aws_docdb_cluster.mongodb.endpoint
    port     = aws_docdb_cluster.mongodb.port
  })
}

# Create CloudWatch log group for MongoDB audit logs if enabled
resource "aws_cloudwatch_log_group" "mongodb_logs" {
  count = var.enable_cloudwatch_logs ? 1 : 0
  
  name              = "/aws/docdb/${var.project_name}-${var.environment}-mongodb/audit"
  retention_in_days = 30
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-logs"
    Environment = var.environment
    Project     = var.project_name
  }
}

# Set up CloudWatch alarms for MongoDB monitoring
resource "aws_cloudwatch_metric_alarm" "mongodb_cpu_utilization" {
  alarm_name          = "${var.project_name}-${var.environment}-mongodb-cpu-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors MongoDB CPU utilization"
  
  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.mongodb.id
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-cpu-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}

resource "aws_cloudwatch_metric_alarm" "mongodb_memory_utilization" {
  alarm_name          = "${var.project_name}-${var.environment}-mongodb-memory-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FreeableMemory"
  namespace           = "AWS/DocDB"
  period              = 300
  statistic           = "Average"
  threshold           = 100000000  # 100MB in bytes
  alarm_description   = "This metric monitors MongoDB freeable memory"
  
  dimensions = {
    DBClusterIdentifier = aws_docdb_cluster.mongodb.id
  }
  
  tags = {
    Name        = "${var.project_name}-${var.environment}-mongodb-memory-alarm"
    Environment = var.environment
    Project     = var.project_name
  }
}