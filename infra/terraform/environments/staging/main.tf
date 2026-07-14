# Staging environment root module.
# Mirrors the dev environment with staging-appropriate sizing and isolation.
# All resources share the same remote state bucket but use the staging/ key prefix.

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    ManagedBy   = "terraform"
    Environment = var.environment
  }
}

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
