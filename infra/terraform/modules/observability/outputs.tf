output "ops_alerts_topic_arn" {
  value = aws_sns_topic.ops_alerts.arn
}

output "log_group_names" {
  value = { for k, lg in aws_cloudwatch_log_group.ops : k => lg.name }
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.main.arn
}
