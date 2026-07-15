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

  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  alb_arn               = module.ecs.alb_arn
  alb_security_group_id = module.ecs.alb_security_group_id
  target_group_arn      = module.ecs.target_group_arn

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

module "secrets" {
  source = "../../modules/secrets"

  project_name         = var.project_name
  environment          = var.environment
  ecs_task_role_arn    = module.ecs.task_role_arn
  api_base_url         = var.api_base_url
  auth0_domain         = var.auth0_domain
  auth0_audience       = var.auth0_audience
  cors_allowed_origins = var.cors_allowed_origins
  common_tags          = local.common_tags
}

module "messaging" {
  source = "../../modules/messaging"

  project_name      = var.project_name
  environment       = var.environment
  ecs_task_role_arn = module.ecs.task_role_arn
  common_tags       = local.common_tags
}

module "observability" {
  source = "../../modules/observability"

  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  ecs_cluster_name  = module.ecs.cluster_name
  ecs_service_name  = module.ecs.service_name
  ecs_desired_count = var.ecs_desired_count
  api_gateway_id    = module.api_gateway.api_id
  ops_alert_email   = var.ops_alert_email
  common_tags       = local.common_tags
}

module "ecr" {
  source = "../../modules/ecr"

  project_name                = var.project_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  github_repository           = var.github_repository
  create_github_oidc_provider = var.create_github_oidc_provider
  common_tags                 = local.common_tags
}

module "redis" {
  source = "../../modules/redis"

  project_name           = var.project_name
  environment            = var.environment
  vpc_id                 = module.vpc.vpc_id
  private_subnet_ids     = module.vpc.private_subnet_ids
  ecs_security_group_id  = module.ecs.ecs_security_group_id
  num_cache_clusters     = var.redis_num_cache_clusters
  common_tags            = local.common_tags
}
