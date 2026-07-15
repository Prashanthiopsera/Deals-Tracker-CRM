resource "aws_cloudwatch_metric_alarm" "audit_emitted_persisted_drift" {
  alarm_name          = "${local.name_prefix}-audit-completeness-drift"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = var.audit_drift_alarm_threshold_percent
  alarm_description   = "Audit emitted vs persisted operation drift exceeded threshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.ops_alerts.arn]

  metric_query {
    id          = "drift"
    expression  = "100 * ABS((emitted - persisted) / IF(emitted > 0, emitted, 1))"
    label       = "AuditDriftPercent"
    return_data = true
  }

  metric_query {
    id = "emitted"
    metric {
      metric_name = "audit.operations.emitted"
      namespace   = "P7VC/Audit"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id = "persisted"
    metric {
      metric_name = "audit.operations.persisted"
      namespace   = "P7VC/Audit"
      period      = 300
      stat        = "Sum"
    }
  }
}

resource "aws_cloudwatch_dashboard" "audit_health" {
  dashboard_name = "P7VC-Audit-Health-${var.environment}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 24
        height = 6
        properties = {
          title  = "Audit Emitted vs Persisted"
          region = var.aws_region
          metrics = [
            ["P7VC/Audit", "audit.operations.emitted"],
            [".", "audit.operations.persisted"]
          ]
        }
      }
    ]
  })
}
