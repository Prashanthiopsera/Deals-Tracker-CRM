terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = ">= 5.0" }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_verifiedpermissions_policy_store" "this" {
  validation_settings {
    mode = "STRICT"
  }
  description = "P7VC CRM Cedar policy store (${local.name_prefix})"
}

resource "aws_verifiedpermissions_schema" "this" {
  policy_store_id = aws_verifiedpermissions_policy_store.this.policy_store_id
  definition {
    value = file("${path.module}/../../../policies/cedar/schema.cedar")
  }
}

resource "aws_verifiedpermissions_policy" "rbac" {
  policy_store_id = aws_verifiedpermissions_policy_store.this.policy_store_id
  definition {
    static {
      statement   = file("${path.module}/../../../policies/cedar/rbac.cedar")
      description = "P7VC RBAC baseline policies"
    }
  }
}

output "policy_store_id" {
  value = aws_verifiedpermissions_policy_store.this.policy_store_id
}
