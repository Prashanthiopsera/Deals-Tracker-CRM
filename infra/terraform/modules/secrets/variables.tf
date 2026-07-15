variable "project_name" { type = string }
variable "environment" { type = string }
variable "ecs_task_role_arn" { type = string }
variable "api_base_url" {
  type    = string
  default = "https://api.example.com"
}
variable "auth0_domain" {
  type    = string
  default = "p7vc.auth0.com"
}
variable "auth0_audience" {
  type    = string
  default = "https://api.p7vc-crm.com"
}
variable "cors_allowed_origins" {
  type    = list(string)
  default = ["https://app.p7vc-crm.com"]
}
variable "common_tags" {
  type    = map(string)
  default = {}
}
