# Output values from the ECS module
# These values are exposed to parent modules for cross-module references
# They enable integration with other infrastructure components

output "cluster_name" {
  description = "Name of the created ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "cluster_id" {
  description = "ID of the created ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ARN of the created ECS cluster"
  value       = aws_ecs_cluster.main.arn
}

output "service_name" {
  description = "Name of the created ECS service"
  value       = aws_ecs_service.backend.name
}

output "service_id" {
  description = "ID of the created ECS service"
  value       = aws_ecs_service.backend.id
}

output "task_definition_arn" {
  description = "ARN of the created ECS task definition"
  value       = aws_ecs_task_definition.backend.arn
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of the ALB target group"
  value       = aws_lb_target_group.backend.arn
}