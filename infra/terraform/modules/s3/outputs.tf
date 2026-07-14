output "bucket_names" {
  value = { for k, b in aws_s3_bucket.this : k => b.id }
}

output "documents_bucket_arn" {
  value = aws_s3_bucket.this["documents"].arn
}

output "kms_key_arn" {
  value = aws_kms_key.s3.arn
}
