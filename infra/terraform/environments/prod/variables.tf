variable "aws_region" {
  description = "Primary AWS region for resource deployment. Defaults to us-east-1 (US data residency). Set to eu-west-1 or eu-central-1 when eu_region_deployment is true for GDPR data residency."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "aws_region must be a valid AWS region identifier (e.g. us-east-1, eu-west-1)."
  }
}

variable "environment" {
  description = "Deployment environment name. Controls resource naming, tagging, and environment-specific configuration."
  type        = string
  default     = "prod"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Project identifier used in resource names and tags. Must be lowercase alphanumeric with hyphens."
  type        = string
  default     = "p7vc-crm"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must be lowercase alphanumeric characters and hyphens only."
  }
}

variable "eu_region_deployment" {
  description = "When true, enables EU-region-specific configuration for GDPR Article 46 data residency compliance."
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Explicit AZ names for VPC subnets. Empty list auto-selects available AZs."
  type        = list(string)
  default     = []
}

variable "vpc_az_count" {
  description = "Number of AZs for VPC subnet placement (minimum 2)."
  type        = number
  default     = 2
}

variable "aurora_engine_version" {
  description = "Aurora PostgreSQL engine version."
  type        = string
  default     = "16.4"
}

variable "aurora_database_name" {
  description = "Initial Aurora database name."
  type        = string
  default     = "p7vc_crm"
}

variable "aurora_serverless_min_capacity" {
  description = "Aurora Serverless v2 minimum ACU."
  type        = number
  default     = 0.5
}

variable "aurora_serverless_max_capacity" {
  description = "Aurora Serverless v2 maximum ACU."
  type        = number
  default     = 16
}

variable "aurora_deletion_protection" {
  description = "Enable deletion protection on Aurora."
  type        = bool
  default     = true
}
