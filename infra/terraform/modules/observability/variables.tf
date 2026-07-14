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
