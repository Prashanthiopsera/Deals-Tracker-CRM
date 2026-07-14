output "environment" {
  description = "The deployment environment name."
  value       = var.environment
}

output "aws_region" {
  description = "The primary AWS region for this environment."
  value       = var.aws_region
}

output "project_name" {
  description = "The project name used for resource naming and tagging."
  value       = var.project_name
}

output "eu_region_deployment" {
  description = "Whether EU-region deployment is enabled for GDPR data residency."
  value       = var.eu_region_deployment
}
