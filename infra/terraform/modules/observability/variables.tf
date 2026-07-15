variable "project_name" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "ecs_cluster_name" { type = string }
variable "ecs_service_name" { type = string }
variable "ecs_desired_count" {
  type    = number
  default = 1
}
variable "api_gateway_id" {
  type    = string
  default = ""
}
variable "ops_alert_email" {
  type    = string
  default = ""
}
variable "common_tags" {
  type    = map(string)
  default = {}
}

variable "auth_denial_alarm_threshold" {
  description = "Authorization denial count per minute before alarm fires."
  type        = number
  default     = 10
}

variable "audit_drift_alarm_threshold_percent" {
  description = "Audit emitted vs persisted drift percentage before alarm fires."
  type        = number
  default     = 1
}
