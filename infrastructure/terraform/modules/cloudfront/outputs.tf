# Output values from the CloudFront module
# These outputs expose important CloudFront distribution details for use by other modules
# and for application configuration to enable content delivery for the Health Advisor app

output "distribution_id" {
  description = "ID of the created CloudFront distribution"
  value       = aws_cloudfront_distribution.main.id
}

output "distribution_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main.arn
}

output "origin_access_identity" {
  description = "CloudFront origin access identity path"
  value       = aws_cloudfront_origin_access_identity.main.cloudfront_access_identity_path
}

output "origin_access_identity_iam_arn" {
  description = "IAM ARN of the CloudFront origin access identity"
  value       = aws_cloudfront_origin_access_identity.main.iam_arn
}