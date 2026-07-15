terraform {
  backend "s3" {
    bucket         = "p7vc-crm-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "p7vc-crm-terraform-lock"
    encrypt        = true
  }
}
