variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

variable "github_repository" {
  description = "GitHub repository in owner/name format trusted for OIDC."
  type        = string
  default     = "Prashanthiopsera/Deals-Tracker-CRM"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub OIDC provider (set false if already exists in the account)."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN when create_github_oidc_provider is false."
  type        = string
  default     = ""
}

variable "terraform_state_bucket" {
  type    = string
  default = "p7vc-crm-terraform-state"
}

variable "terraform_state_lock_table" {
  type    = string
  default = "p7vc-crm-terraform-lock"
}
