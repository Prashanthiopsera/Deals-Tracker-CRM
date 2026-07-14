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
