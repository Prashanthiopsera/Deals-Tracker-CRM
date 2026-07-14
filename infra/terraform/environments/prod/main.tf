# Production environment root module.
# Prod applies the strictest security controls, deletion protection, and
# multi-AZ configurations. The eu_region_deployment flag provisions a
# secondary Aurora read replica in eu-west-1 when GDPR data residency is required.

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
