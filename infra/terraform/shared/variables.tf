# Common variable definitions shared across all environments.
# Each environment's variables.tf imports these definitions by declaring
# the same variables — Terraform does not support cross-directory variable
# inheritance, so definitions are kept consistent via this reference file.

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
  description = "When true, enables EU-region-specific configuration (secondary region eu-west-1 for Aurora read replica, S3 replication to EU bucket) to satisfy GDPR Article 46 data residency requirements. Set to false for US-only deployment."
  type        = bool
  default     = false
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC. Default 10.0.0.0/16 supports three subnet tiers across multiple AZs."
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Explicit AZ names for VPC subnet placement. Empty list auto-selects the first vpc_az_count available AZs."
  type        = list(string)
  default     = []
}

variable "vpc_az_count" {
  description = "Number of availability zones to span for VPC subnets. Minimum 2 for high availability."
  type        = number
  default     = 2
}
