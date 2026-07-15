terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_verifiedpermissions_policy_store" "this" {
  validation_settings {
    mode = "STRICT"
  }
  description = "P7VC CRM Cedar policy store (${local.name_prefix})"
}

resource "aws_verifiedpermissions_schema" "this" {
  policy_store_id = aws_verifiedpermissions_policy_store.this.policy_store_id
  definition {
    value = file("${path.module}/../../../policies/cedar/schema.cedar")
  }
}

resource "aws_verifiedpermissions_policy" "rbac" {
  policy_store_id = aws_verifiedpermissions_policy_store.this.policy_store_id
  definition {
    static {
      statement   = file("${path.module}/../../../policies/cedar/rbac.cedar")
      description = "P7VC RBAC baseline policies"
    }
  }
}

resource "aws_iam_policy" "ecs_is_authorized" {
  name = "${local.name_prefix}-verified-permissions"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "verifiedpermissions:IsAuthorized",
          "verifiedpermissions:IsAuthorizedWithToken"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "avp_errors" {
  alarm_name          = "${local.name_prefix}-avp-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrorCount"
  namespace           = "AWS/VerifiedPermissions"
  period              = 300
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Verified Permissions error rate above 1%"
  treat_missing_data  = "notBreaching"
}

resource "aws_cloudwatch_metric_alarm" "avp_latency" {
  alarm_name          = "${local.name_prefix}-avp-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  metric_name         = "Latency"
  namespace           = "AWS/VerifiedPermissions"
  period              = 60
  extended_statistic  = "p99"
  threshold           = 100
  alarm_description   = "Verified Permissions p99 latency above 100ms"
  treat_missing_data  = "notBreaching"
}

output "policy_store_id" {
  value = aws_verifiedpermissions_policy_store.this.policy_store_id
}

output "ecs_is_authorized_policy_arn" {
  value = aws_iam_policy.ecs_is_authorized.arn
}
