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

output "vpc_id" {
  description = "ID of the VPC."
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC."
  value       = module.vpc.vpc_cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs (NAT / ALB tier)."
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs (ECS Fargate tier)."
  value       = module.vpc.private_subnet_ids
}

output "isolated_subnet_ids" {
  description = "Isolated subnet IDs (Aurora / ElastiCache tier)."
  value       = module.vpc.isolated_subnet_ids
}

output "availability_zones" {
  description = "Availability zones used by the VPC."
  value       = module.vpc.availability_zones
}

output "aurora_cluster_endpoint" {
  description = "Aurora writer endpoint."
  value       = module.aurora.cluster_endpoint
}

output "aurora_reader_endpoint" {
  description = "Aurora reader endpoint for RAG queries."
  value       = module.aurora.reader_endpoint
}

output "aurora_master_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials."
  value       = module.aurora.master_user_secret_arn
}
