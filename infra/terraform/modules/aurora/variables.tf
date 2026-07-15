variable "project_name" {
  description = "Project identifier used in resource names and tags."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric characters and hyphens only."
  }
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod)."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "vpc_id" {
  description = "VPC ID where the Aurora cluster is deployed."
  type        = string
}

variable "isolated_subnet_ids" {
  description = "Isolated subnet IDs for the DB subnet group (minimum 2 AZs)."
  type        = list(string)

  validation {
    condition     = length(var.isolated_subnet_ids) >= 2
    error_message = "isolated_subnet_ids must contain at least 2 subnet IDs."
  }
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks allowed to connect on port 5432 (ECS Fargate tier)."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_cidrs) >= 1
    error_message = "private_subnet_cidrs must contain at least one CIDR block."
  }
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for the Secrets Manager rotation Lambda ENI placement."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "private_subnet_ids must contain at least 2 subnet IDs for Lambda HA."
  }
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version (15.x or 16.x with pgvector support)."
  type        = string
  default     = "16.4"
}

variable "database_name" {
  description = "Initial database name created in the cluster."
  type        = string
  default     = "p7vc_crm"
}

variable "master_username" {
  description = "Master database username stored in Secrets Manager."
  type        = string
  default     = "p7vc_admin"
}

variable "backup_retention_period" {
  description = "Automated backup retention in days."
  type        = number
  default     = 35
}

variable "preferred_backup_window" {
  description = "Daily UTC backup window during off-peak hours."
  type        = string
  default     = "03:00-04:00"
}

variable "preferred_maintenance_window" {
  description = "Weekly UTC maintenance window."
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "serverless_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU."
  type        = number
  default     = 0.5
}

variable "serverless_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU."
  type        = number
  default     = 16
}

variable "monitoring_interval" {
  description = "Enhanced Monitoring interval in seconds."
  type        = number
  default     = 60
}

variable "performance_insights_retention_period" {
  description = "Performance Insights retention in days."
  type        = number
  default     = 7
}

variable "secret_rotation_days" {
  description = "Automatic master credential rotation interval in days."
  type        = number
  default     = 30
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster."
  type        = bool
  default     = true
}

variable "common_tags" {
  description = "Common tags merged onto every resource created by this module."
  type        = map(string)
  default     = {}
}
