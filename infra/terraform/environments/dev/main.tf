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
