variable "project_name" { type = string }
variable "environment" {
  type = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "vpc_id" { type = string }
variable "private_subnet_ids" {
  type = list(string)
  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "At least 2 private subnets required for VPC Link."
  }
}

variable "alb_arn" { type = string }
variable "alb_security_group_id" { type = string }
variable "target_group_arn" { type = string }

variable "api_domain_name" {
  description = "Custom API domain (e.g. api.dev.p7vc-crm.com)."
  type        = string
  default     = "api.example.com"
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for the API domain."
  type        = string
  default     = ""
}

variable "allowed_country_codes" {
  description = "ISO country codes allowed by geo-restriction WAF rule."
  type        = list(string)
  default     = ["US"]
}

variable "rate_limit" {
  description = "WAF rate limit per IP per 5-minute window."
  type        = number
  default     = 2000
}

variable "common_tags" {
  type    = map(string)
  default = {}
}

variable "ops_alert_topic_arn" {
  type    = string
  default = ""
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}
