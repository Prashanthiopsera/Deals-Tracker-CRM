terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  buckets = {
    documents        = "${local.name_prefix}-documents"
    audit_logs       = "${local.name_prefix}-audit-logs"
    frontend_assets  = "${local.name_prefix}-frontend-assets"
    application_logs = "${local.name_prefix}-application-logs"
  }
}

resource "aws_kms_key" "s3" {
  description         = "CMK for S3 bucket encryption (${local.name_prefix})"
  enable_key_rotation = true
  tags                = merge(var.common_tags, { Name = "${local.name_prefix}-s3-cmk" })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${local.name_prefix}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

resource "aws_s3_bucket" "this" {
  for_each = local.buckets
  bucket   = each.value
  tags     = merge(var.common_tags, { Name = each.value, Purpose = each.key })
}

resource "aws_s3_bucket_public_access_block" "this" {
  for_each                = aws_s3_bucket.this
  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  for_each = aws_s3_bucket.this
  bucket   = each.value.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.this["documents"].id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.this["documents"].id
  rule {
    id     = "documents-tiering"
    status = "Enabled"
    transition {
      days          = 90
      storage_class = "INTELLIGENT_TIERING"
    }
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.this["audit_logs"].id
  rule {
    id     = "audit-retention"
    status = "Enabled"
    transition {
      days          = 365
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "application_logs" {
  bucket = aws_s3_bucket.this["application_logs"].id
  rule {
    id     = "app-logs-expiry"
    status = "Enabled"
    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_cors_configuration" "frontend_assets" {
  bucket = aws_s3_bucket.this["frontend_assets"].id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "HEAD"]
    allowed_origins = var.cors_allowed_origins
    max_age_seconds = 3600
  }
}

data "aws_iam_policy_document" "documents" {
  statement {
    sid    = "EcsTaskRoleAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [var.ecs_task_role_arn]
    }
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.this["documents"].arn, "${aws_s3_bucket.this["documents"].arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "documents" {
  bucket = aws_s3_bucket.this["documents"].id
  policy = data.aws_iam_policy_document.documents.json
}

data "aws_iam_policy_document" "audit_logs" {
  count = var.audit_consumer_role_arn != "" ? 1 : 0
  statement {
    sid    = "AuditConsumerAccess"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [var.audit_consumer_role_arn]
    }
    actions   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.this["audit_logs"].arn, "${aws_s3_bucket.this["audit_logs"].arn}/*"]
  }
}

resource "aws_s3_bucket_policy" "audit_logs" {
  count  = var.audit_consumer_role_arn != "" ? 1 : 0
  bucket = aws_s3_bucket.this["audit_logs"].id
  policy = data.aws_iam_policy_document.audit_logs[0].json
}
