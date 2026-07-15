resource "aws_sns_topic" "analytics_alerts" {
  name = "p7vc-analytics-alerts-${var.environment}"
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "analytics_p95_latency" {
  alarm_name          = "${local.name_prefix}-analytics-p95-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 3
  threshold           = 500
  alarm_description   = "Analytics endpoint p95 latency exceeded 500ms for 3 consecutive 5-minute periods"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.analytics_alerts.arn]

  metric_query {
    id          = "p95"
    return_data = true
    metric {
      metric_name = "analytics.query.duration"
      namespace   = "P7VC/Analytics"
      period      = 300
      stat        = "p95"
      dimensions = {
        endpoint = "pipeline-summary"
      }
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "analytics_5xx_error_rate" {
  alarm_name          = "${local.name_prefix}-analytics-5xx-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  threshold           = 5
  alarm_description   = "Analytics endpoint 5xx error rate exceeded 5%"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.analytics_alerts.arn]

  metric_query {
    id          = "error_rate"
    expression  = "100 * errors / IF(total > 0, total, 1)"
    label       = "Analytics5xxRate"
    return_data = true
  }

  metric_query {
    id = "errors"
    metric {
      metric_name = "analytics.requests.5xx"
      namespace   = "P7VC/Analytics"
      period      = 300
      stat        = "Sum"
    }
  }

  metric_query {
    id = "total"
    metric {
      metric_name = "analytics.requests.total"
      namespace   = "P7VC/Analytics"
      period      = 300
      stat        = "Sum"
    }
  }
}

resource "aws_cloudwatch_metric_alarm" "stage_transitions_stale" {
  alarm_name          = "${local.name_prefix}-stage-transitions-stale"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  threshold           = 1
  alarm_description   = "No stage_transitions rows inserted in 24 hours on weekdays"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.analytics_alerts.arn]

  metric_query {
    id          = "inserts"
    return_data = true
    metric {
      metric_name = "stage_transitions.inserts"
      namespace   = "P7VC/Analytics"
      period      = 86400
      stat        = "Sum"
    }
  }
}

resource "aws_cloudwatch_dashboard" "analytics_slos" {
  dashboard_name = "P7VC-Analytics-SLOs-${var.environment}"
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "Analytics Latency p50/p95/p99"
          region = var.aws_region
          metrics = [
            ["P7VC/Analytics", "analytics.query.duration", "endpoint", "pipeline-summary", { stat = "p50" }],
            ["...", { stat = "p95" }],
            ["...", { stat = "p99" }]
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
          title  = "Analytics Error Rate"
          region = var.aws_region
          metrics = [
            ["P7VC/Analytics", "analytics.requests.4xx"],
            [".", "analytics.requests.5xx"]
          ]
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Analytics Throughput"
          region = var.aws_region
          metrics = [
            ["P7VC/Analytics", "analytics.requests.total"]
          ]
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        properties = {
          title  = "Stage Transitions Row Growth"
          region = var.aws_region
          metrics = [
            ["P7VC/Analytics", "stage_transitions.inserts"]
          ]
        }
      }
    ]
  })
}
