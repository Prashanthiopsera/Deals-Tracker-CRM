terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  log_groups = {
    app            = { path = "/p7vc-crm/app", retention = 90 }
    api_gateway    = { path = "/p7vc-crm/api-gateway", retention = 90 }
    waf            = { path = "/p7vc-crm/waf", retention = 365 }
    vpc_flow       = { path = "/p7vc-crm/vpc-flow-logs", retention = 90 }
    audit_consumer = { path = "/p7vc-crm/audit-consumer", retention = 90 }
  }
}

resource "aws_kms_key" "logs" {
  description         = "CMK for CloudWatch Logs (${local.name_prefix})"
  enable_key_rotation = true
  tags                = merge(var.common_tags, { Name = "${local.name_prefix}-logs-cmk" })
}

resource "aws_cloudwatch_log_group" "ops" {
  for_each          = local.log_groups
  name              = each.value.path
  retention_in_days = each.value.retention
  kms_key_id        = aws_kms_key.logs.arn
  tags              = merge(var.common_tags, { Name = each.value.path })
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${local.name_prefix}-cloudtrail"
  tags   = merge(var.common_tags, { Name = "${local.name_prefix}-cloudtrail" })
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  tags                          = var.common_tags
}

resource "aws_sns_topic" "ops_alerts" {
  name = "${local.name_prefix}-ops-alerts"
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "ops_email" {
  count     = var.ops_alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.ops_alerts.arn
  protocol  = "email"
  endpoint  = var.ops_alert_email
}

resource "aws_cloudwatch_metric_alarm" "ecs_task_count" {
  alarm_name          = "${local.name_prefix}-ecs-task-count-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = 60
  statistic           = "Average"
  threshold           = var.ecs_desired_count
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = var.ecs_service_name
  }
  tags = var.common_tags
}

resource "aws_cloudwatch_dashboard" "operations" {
  dashboard_name = "p7vc-crm-operations-${var.environment}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "ECS CPU/Memory"
          region = var.aws_region
          metrics = [
            ["AWS/ECS", "CPUUtilization", "ClusterName", var.ecs_cluster_name],
            [".", "MemoryUtilization", ".", "."]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "API Gateway 5xx"
          region = var.aws_region
          metrics = [
            ["AWS/ApiGateway", "5xx", "ApiId", var.api_gateway_id]
          ]
        }
      }
    ]
  })
}

resource "aws_cloudwatch_query_definition" "errors" {
  name            = "${local.name_prefix}-error-search"
  log_group_names = [aws_cloudwatch_log_group.ops["app"].name]
  query_string    = "fields @timestamp, @message | filter @message like /ERROR/ | sort @timestamp desc | limit 50"
}
