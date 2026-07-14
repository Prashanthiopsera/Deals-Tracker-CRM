terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  # Default tags applied to every resource created by this provider.
  # Satisfies SOC 2 CC6.1 (logical access via tagging) and change-management
  # traceability requirements. Individual resources may add additional tags.
  default_tags {
    tags = {
      Project     = "p7vc-crm"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}

# EU-region provider alias — only used when eu_region_deployment = true.
# Provisions a secondary Aurora read replica and S3 replication bucket in
# eu-west-1 to satisfy GDPR Article 46 data residency requirements.
provider "aws" {
  alias  = "eu"
  region = "eu-west-1"

  default_tags {
    tags = {
      Project     = "p7vc-crm"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}
