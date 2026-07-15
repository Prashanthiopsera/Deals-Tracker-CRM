output "audit_queue_name" {
  value       = aws_sqs_queue.main["audit"].name
  description = "Primary audit queue (crm-audit-queue pattern: {project}-{env}-audit-queue)"
}

output "audit_dlq_name" {
  value       = aws_sqs_queue.dlq["audit"].name
  description = "Audit dead-letter queue with maxReceiveCount=3 redrive policy"
}

output "queue_urls" {
  value = { for k, q in aws_sqs_queue.main : k => q.url }
}

output "workflow_events_topic_arn" {
  value = aws_sns_topic.workflow_events.arn
}

output "consumer_role_arn" {
  value = aws_iam_role.consumer.arn
}

output "kms_key_arn" {
  value = aws_kms_key.messaging.arn
}
