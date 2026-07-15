resource "aws_cloudwatch_metric_alarm" "failed_login_spike" {
  alarm_name          = "${local.name_prefix}-failed-login-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "auth.login.failed"
  namespace           = "P7VC/Auth"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]
  tags                = var.common_tags
}

resource "aws_cloudwatch_dashboard" "security_ops" {
  dashboard_name = "P7VC-Security-Ops-${var.environment}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          title  = "WAF Block Rate"
          region = var.aws_region
          metrics = [
            ["AWS/WAFV2", "BlockedRequests"]
          ]
        }
      }
    ]
  })
}
