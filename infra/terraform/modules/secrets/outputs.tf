output "kms_key_arns" {
  value = { for k, v in aws_kms_key.purpose : k => v.arn }
}

output "auth0_secret_arn" {
  value = aws_secretsmanager_secret.auth0.arn
}

output "connector_secret_arns" {
  value = { for k, s in aws_secretsmanager_secret.connectors : k => s.arn }
}
