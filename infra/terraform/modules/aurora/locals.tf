locals {
  name_prefix = "${var.project_name}-${var.environment}"

  # Aurora PostgreSQL 16.x parameter group family for engine 16.x.
  parameter_group_family = startswith(var.engine_version, "15.") ? "aurora-postgresql15" : "aurora-postgresql16"
}
