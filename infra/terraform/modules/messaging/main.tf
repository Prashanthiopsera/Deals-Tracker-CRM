terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  queues      = toset(["audit", "agent", "activity", "notification"])
}

resource "aws_kms_key" "messaging" {
  description         = "CMK for SQS/SNS (${local.name_prefix})"
  enable_key_rotation = true
  tags                = merge(var.common_tags, { Name = "${local.name_prefix}-messaging-cmk" })
}

resource "aws_sqs_queue" "dlq" {
  for_each                  = local.queues
  name                      = "${local.name_prefix}-${each.key}-dlq"
  kms_master_key_id         = aws_kms_key.messaging.arn
  message_retention_seconds = 1209600
  tags                      = merge(var.common_tags, { Name = "${local.name_prefix}-${each.key}-dlq" })
}

resource "aws_sqs_queue" "main" {
  for_each = local.queues
  name     = "${local.name_prefix}-${each.key}-queue"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq[each.key].arn
    maxReceiveCount     = 3
  })
  kms_master_key_id         = aws_kms_key.messaging.arn
  visibility_timeout_seconds = each.key == "audit" ? 60 : 30
  message_retention_seconds  = each.key == "audit" ? 1209600 : 345600
  tags = merge(var.common_tags, { Name = "${local.name_prefix}-${each.key}-queue" })
}

resource "aws_sns_topic" "workflow_events" {
  name              = "${local.name_prefix}-workflow-events"
  kms_master_key_id = aws_kms_key.messaging.arn
  tags              = merge(var.common_tags, { Name = "${local.name_prefix}-workflow-events" })
}

resource "aws_sns_topic_subscription" "notification" {
  topic_arn = aws_sns_topic.workflow_events.arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.main["notification"].arn
}

resource "aws_iam_role" "consumer" {
  name = "${local.name_prefix}-messaging-consumer"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = "sts:AssumeRole", Principal = { Service = "ecs-tasks.amazonaws.com" } }]
  })
  tags = var.common_tags
}

data "aws_iam_policy_document" "ecs_producer" {
  statement {
    effect    = "Allow"
    actions   = ["sqs:SendMessage", "sqs:GetQueueUrl", "sns:Publish"]
    resources = concat([for q in aws_sqs_queue.main : q.arn], [aws_sns_topic.workflow_events.arn])
  }
}

resource "aws_iam_role_policy" "ecs_producer" {
  name   = "${local.name_prefix}-ecs-messaging-producer"
  role   = local.ecs_task_role_name
  policy = data.aws_iam_policy_document.ecs_producer.json
}

data "aws_iam_policy_document" "consumer" {
  statement {
    effect    = "Allow"
    actions   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes", "sqs:ChangeMessageVisibility"]
    resources = [for q in aws_sqs_queue.main : q.arn]
  }
}

resource "aws_iam_role_policy" "consumer" {
  role   = aws_iam_role.consumer.id
  policy = data.aws_iam_policy_document.consumer.json
}

resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  for_each            = local.queues
  alarm_name          = "${local.name_prefix}-${each.key}-dlq-messages"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Critical: messages in DLQ"
  dimensions          = { QueueName = aws_sqs_queue.dlq[each.key].name }
  tags                = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "queue_depth" {
  for_each            = local.queues
  alarm_name          = "${local.name_prefix}-${each.key}-queue-depth"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 1000
  alarm_description   = "Warning: queue depth high"
  dimensions          = { QueueName = aws_sqs_queue.main[each.key].name }
  tags                = var.common_tags
}
