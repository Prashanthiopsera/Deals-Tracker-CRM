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
