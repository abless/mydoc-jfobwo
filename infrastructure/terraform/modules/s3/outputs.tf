output "bucket_id" {
  description = "ID of the created S3 bucket for health data storage"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket for IAM policy references"
  value       = aws_s3_bucket.main.arn
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket for URL construction"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_name" {
  description = "Name of the created S3 bucket for reference in application configuration"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_region" {
  description = "AWS region where the S3 bucket is located"
  value       = data.aws_region.current.name
}