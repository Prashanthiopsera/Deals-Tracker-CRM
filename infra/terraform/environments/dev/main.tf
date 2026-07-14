# Dev environment root module.
#
# Phase 1 (Foundation) — this configuration provisions only the Terraform
# state infrastructure (S3 + DynamoDB) and foundational IAM baseline.
# All application resources (Aurora, ECS, API Gateway, etc.) are added
# in subsequent work orders that depend on this scaffold.
#
# The state bucket and lock table are bootstrapped once using a local
# backend and then migrated to the S3 remote backend via:
#   terraform init -migrate-state
#
# See docs/TERRAFORM_BOOTSTRAP.md for the one-time bootstrap procedure.

locals {
  # Derived resource name prefix — used consistently across all modules
  # to ensure globally unique, identifiable resource names.
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags merged with provider default_tags on every resource.
  common_tags = {
    Project     = var.project_name
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Remote State Infrastructure
# ─────────────────────────────────────────────────────────────────────────────
# Bootstrap: these resources must exist before the S3 backend can be used.
# On first run, use a local backend and migrate state after apply:
#   1. Comment out backend.tf
#   2. terraform init && terraform apply -target=aws_s3_bucket.terraform_state ...
#   3. Uncomment backend.tf and run terraform init -migrate-state

resource "aws_s3_bucket" "terraform_state" {
  bucket = "p7vc-crm-terraform-state"

  # Prevent accidental deletion of the state bucket.
  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.common_tags, {
    Name    = "p7vc-crm-terraform-state"
    Purpose = "terraform-remote-state"
  })
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      # SSE-S3 for bootstrap simplicity; switch to aws:kms once the KMS
      # key WO (WO-007) provisions the CMK for p7vc-crm-terraform.
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "p7vc-crm-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  # Point-in-time recovery satisfies SOC 2 A1.3 (availability via backup).
  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name    = "p7vc-crm-terraform-lock"
    Purpose = "terraform-state-locking"
  })
}

# ─────────────────────────────────────────────────────────────────────────────
# VPC Network Foundation (WO-002)
# ─────────────────────────────────────────────────────────────────────────────

module "vpc" {
  source = "../../modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  az_count           = var.vpc_az_count

  common_tags = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# Aurora PostgreSQL Cluster (WO-003)
# ─────────────────────────────────────────────────────────────────────────────

module "aurora" {
  source = "../../modules/aurora"

  project_name = var.project_name
  environment  = var.environment

  vpc_id               = module.vpc.vpc_id
  isolated_subnet_ids  = module.vpc.isolated_subnet_ids
  private_subnet_cidrs = module.vpc.private_subnet_cidrs
  private_subnet_ids   = module.vpc.private_subnet_ids

  engine_version          = var.aurora_engine_version
  database_name           = var.aurora_database_name
  serverless_min_capacity = var.aurora_serverless_min_capacity
  serverless_max_capacity = var.aurora_serverless_max_capacity
  deletion_protection     = var.aurora_deletion_protection

  common_tags = local.common_tags
}

# ─────────────────────────────────────────────────────────────────────────────
# ECS Fargate Cluster (WO-004)
# ─────────────────────────────────────────────────────────────────────────────

module "ecs" {
  source = "../../modules/ecs"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids
  public_subnet_ids  = module.vpc.public_subnet_ids

  container_cpu    = var.ecs_container_cpu
  container_memory = var.ecs_container_memory
  desired_count    = var.ecs_desired_count

  autoscaling_min_capacity = var.ecs_autoscaling_min_capacity
  autoscaling_max_capacity = var.ecs_autoscaling_max_capacity

  container_image   = var.ecs_container_image
  aurora_secret_arn = module.aurora.master_user_secret_arn

  common_tags = local.common_tags
}

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name = var.project_name
  environment  = var.environment

  vpc_id               = module.vpc.vpc_id
  private_subnet_ids   = module.vpc.private_subnet_ids
  alb_arn              = module.ecs.alb_arn
  alb_security_group_id = module.ecs.alb_security_group_id
  target_group_arn     = module.ecs.target_group_arn

  api_domain_name       = var.api_domain_name
  route53_zone_id       = var.route53_zone_id
  allowed_country_codes = var.allowed_country_codes

  common_tags = local.common_tags
}

module "s3" {
  source = "../../modules/s3"

  project_name         = var.project_name
  environment          = var.environment
  ecs_task_role_arn    = module.ecs.task_role_arn
  cors_allowed_origins = var.cors_allowed_origins
  common_tags          = local.common_tags
}
