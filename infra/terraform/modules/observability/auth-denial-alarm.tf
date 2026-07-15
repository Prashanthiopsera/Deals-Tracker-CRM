resource "aws_cloudwatch_metric_alarm" "authorization_denial_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-auth-denial-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "AuthorizationDecision"
  namespace           = "P7VC/Authorization"
  period              = 60
  statistic           = "Sum"
  threshold           = var.auth_denial_alarm_threshold
  alarm_description   = "Authorization denial rate exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    Decision = "deny"
  }
}
