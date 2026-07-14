terraform {
  backend "s3" {
    # Remote state isolation: each environment has its own state file key under
    # a shared bucket. DynamoDB table provides optimistic locking to prevent
    # concurrent apply operations from corrupting state. Both satisfy SOC 2
    # CC8.1 change management controls for infrastructure changes.
    bucket         = "p7vc-crm-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "p7vc-crm-terraform-lock"
    encrypt        = true

    # KMS encryption at rest for state file — required for SOC 2 CC6.7
    # and GDPR data-at-rest protection (state may contain resource ARNs
    # and configuration values referencing PII-adjacent infrastructure).
    # kms_key_id = "arn:aws:kms:us-east-1:<ACCOUNT_ID>:alias/p7vc-crm-terraform"
  }
}
