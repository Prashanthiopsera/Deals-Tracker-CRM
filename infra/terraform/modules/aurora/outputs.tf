output "cluster_id" {
  description = "Aurora cluster identifier."
  value       = aws_rds_cluster.aurora.id
}

output "cluster_arn" {
  description = "Aurora cluster ARN."
  value       = aws_rds_cluster.aurora.arn
}

output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster."
  value       = aws_rds_cluster.aurora.endpoint
}

output "reader_endpoint" {
  description = "Reader endpoint for read-heavy RAG queries."
  value       = aws_rds_cluster.aurora.reader_endpoint
}

output "cluster_port" {
  description = "Database port."
  value       = aws_rds_cluster.aurora.port
}

output "database_name" {
  description = "Initial database name."
  value       = aws_rds_cluster.aurora.database_name
}

output "master_username" {
  description = "Master database username."
  value       = aws_rds_cluster.aurora.master_username
  sensitive   = true
}

output "master_user_secret_arn" {
  description = "Secrets Manager ARN for master credentials."
  value       = aws_rds_cluster.aurora.master_user_secret[0].secret_arn
}

output "kms_key_arn" {
  description = "KMS CMK ARN used for Aurora encryption."
  value       = aws_kms_key.aurora.arn
}

output "kms_key_id" {
  description = "KMS CMK ID used for Aurora encryption."
  value       = aws_kms_key.aurora.key_id
}

output "security_group_id" {
  description = "Security group ID attached to the Aurora cluster."
  value       = aws_security_group.aurora.id
}

output "db_subnet_group_name" {
  description = "DB subnet group name."
  value       = aws_db_subnet_group.aurora.name
}

output "init_sql_path" {
  description = "Relative path to the SQL seed script for pgvector and RLS verification."
  value       = "${path.module}/scripts/init.sql"
}
