# MongoDB Cluster Connection Information
output "endpoint" {
  description = "Endpoint of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.endpoint
}

output "port" {
  description = "Port of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.port
}

# Complete Connection String (sensitive as it contains credentials)
output "connection_string" {
  description = "MongoDB connection string for application configuration"
  value       = "mongodb://administrator:${random_password.mongodb_password.result}@${aws_docdb_cluster.mongodb.endpoint}:${aws_docdb_cluster.mongodb.port}/?tls=true&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive   = true
}

# Secrets Manager Reference Information
output "secret_arn" {
  description = "ARN of the secret containing MongoDB credentials"
  value       = aws_secretsmanager_secret.mongodb_credentials.arn
}

output "secret_name" {
  description = "Name of the secret containing MongoDB credentials"
  value       = aws_secretsmanager_secret.mongodb_credentials.name
}

# Cluster Reference Information
output "cluster_identifier" {
  description = "Identifier of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.cluster_identifier
}

output "cluster_arn" {
  description = "ARN of the MongoDB cluster"
  value       = aws_docdb_cluster.mongodb.arn
}

# Instance Reference Information
output "instance_identifiers" {
  description = "List of MongoDB instance identifiers"
  value       = aws_docdb_cluster_instance.mongodb_instances[*].identifier
}