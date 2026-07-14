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

output "terraform_state_bucket" {
  description = "S3 bucket name used for remote Terraform state storage."
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_lock_table" {
  description = "DynamoDB table name used for Terraform state locking."
  value       = aws_dynamodb_table.terraform_lock.name
}
