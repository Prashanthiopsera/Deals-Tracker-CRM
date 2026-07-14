variable "project_name" { type = string }
variable "environment" { type = string }
variable "ecs_task_role_arn" {
  description = "ECS task role allowed to access documents bucket."
  type        = string
}
variable "audit_consumer_role_arn" {
  description = "Audit consumer role for audit-logs bucket."
  type        = string
  default     = ""
}
variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://app.p7vc-crm.com"]
}
variable "common_tags" {
  type    = map(string)
  default = {}
}
