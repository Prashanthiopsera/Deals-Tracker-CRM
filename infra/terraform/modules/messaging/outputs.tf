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
