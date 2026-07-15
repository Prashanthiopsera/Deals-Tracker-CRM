terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

resource "aws_kms_key" "platform" {
  description         = "P7VC platform CMK (${var.environment})"
  enable_key_rotation = true
  tags                = merge(var.common_tags, { Name = "p7vc-platform-${var.environment}" })
}

resource "aws_kms_alias" "platform" {
  name          = "alias/p7vc-platform-${var.environment}"
  target_key_id = aws_kms_key.platform.key_id
}

output "platform_kms_key_arn" {
  value = aws_kms_key.platform.arn
}
