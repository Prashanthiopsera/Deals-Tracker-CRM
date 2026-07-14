locals {
  name_prefix = "${var.project_name}-${var.environment}"
  log_group   = "/ecs/${local.name_prefix}-api"
}
