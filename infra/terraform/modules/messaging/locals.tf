locals {
  ecs_task_role_name = element(split("/", var.ecs_task_role_arn), 1)
}
