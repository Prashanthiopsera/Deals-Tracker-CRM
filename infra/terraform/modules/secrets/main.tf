terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  kms_purposes = toset(["sqs", "cloudwatch-logs", "secrets-manager"])
}

resource "aws_kms_key" "purpose" {
  for_each            = local.kms_purposes
  description         = "CMK for ${each.key} (${local.name_prefix})"
  enable_key_rotation = true
  tags                = merge(var.common_tags, { Name = "${local.name_prefix}-${each.key}" })
}

resource "aws_kms_alias" "purpose" {
  for_each      = local.kms_purposes
  name          = "alias/p7vc-crm/${each.key}/${var.environment}"
  target_key_id = aws_kms_key.purpose[each.key].key_id
}

resource "aws_secretsmanager_secret" "auth0" {
  name       = "${local.name_prefix}/auth0"
  kms_key_id = aws_kms_key.purpose["secrets-manager"].arn
  tags       = merge(var.common_tags, { Name = "${local.name_prefix}-auth0-secret" })
}

resource "aws_secretsmanager_secret" "connectors" {
  for_each   = toset(["zoominfo", "apollo", "granola", "slack"])
  name       = "${local.name_prefix}/connectors/${each.key}"
  kms_key_id = aws_kms_key.purpose["secrets-manager"].arn
  tags       = merge(var.common_tags, { Name = "${local.name_prefix}-connector-${each.key}" })
}

resource "aws_ssm_parameter" "config" {
  for_each = {
    environment     = var.environment
    api_base_url    = var.api_base_url
    auth0_domain    = var.auth0_domain
    auth0_audience  = var.auth0_audience
    cors_origins    = join(",", var.cors_allowed_origins)
  }
  name  = "/${var.project_name}/${var.environment}/${each.key}"
  type  = each.key == "cors_origins" ? "StringList" : "String"
  value = each.value
  tags  = var.common_tags
}

data "aws_iam_policy_document" "ecs_secrets" {
  statement {
    effect = "Allow"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:DescribeSecret"
    ]
    resources = concat(
      [aws_secretsmanager_secret.auth0.arn],
      [for s in aws_secretsmanager_secret.connectors : s.arn]
    )
  }
  statement {
    effect = "Allow"
    actions = ["kms:Decrypt", "kms:DescribeKey"]
    resources = [aws_kms_key.purpose["secrets-manager"].arn]
  }
}

resource "aws_iam_role_policy" "ecs_secrets" {
  name   = "${local.name_prefix}-ecs-secrets-read"
  role   = local.ecs_task_role_name
  policy = data.aws_iam_policy_document.ecs_secrets.json
}
