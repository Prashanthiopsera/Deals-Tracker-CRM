variable "project_name" { type = string }
variable "environment" { type = string }
variable "ecs_task_role_arn" { type = string }
variable "common_tags" {
  type    = map(string)
  default = {}
}
