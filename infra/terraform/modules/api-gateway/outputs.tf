output "api_endpoint" {
  description = "Default API Gateway invoke URL."
  value       = aws_apigatewayv2_stage.default.invoke_url
}

output "api_id" {
  description = "HTTP API ID."
  value       = aws_apigatewayv2_api.main.id
}

output "custom_domain_name" {
  description = "Configured custom domain."
  value       = var.api_domain_name
}

output "waf_web_acl_arn" {
  description = "WAF WebACL ARN."
  value       = aws_wafv2_web_acl.main.arn
}

output "vpc_link_id" {
  description = "VPC Link ID."
  value       = aws_apigatewayv2_vpc_link.alb.id
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN for the API domain."
  value       = aws_acm_certificate.api.arn
}
