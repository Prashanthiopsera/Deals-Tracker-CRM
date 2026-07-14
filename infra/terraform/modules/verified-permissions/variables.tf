variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "ecs_task_role_name" {
  description = "ECS task role name to attach Verified Permissions policy."
  type        = string
  default     = ""
}
