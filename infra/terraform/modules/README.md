# Terraform Modules

Reusable Terraform modules for the P7VC CRM infrastructure.

Each module encapsulates a self-contained AWS resource group with its own
variables, outputs, and documentation. Modules are consumed by environment
root modules in `environments/dev`, `environments/staging`, and `environments/prod`.

## Modules

| Module | WO | Status | Description |
|--------|----|--------|-------------|
| `vpc` | WO-002 | Implemented | VPC, public/private/isolated subnets, NAT gateways, flow logs, NACLs |
| `aurora` | WO-003 | Implemented | Aurora PostgreSQL Serverless v2, pgvector, KMS, Secrets Manager rotation |
| `ecs` | WO-004 | Planned | ECS Fargate cluster, task definitions, service mesh |
| `api-gateway` | WO-005 | Planned | API Gateway REST/HTTP with WAF and usage plans |
| `s3-kms` | WO-006/007 | Planned | S3 buckets with KMS CMK encryption |
| `sqs-sns` | WO-008 | Planned | SQS queues and SNS topics for async messaging |
| `monitoring` | WO-009 | Planned | CloudWatch dashboards, alarms, and log groups |

## Module Conventions

- Each module directory contains: `main.tf`, `variables.tf`, `outputs.tf`
- All modules accept `project_name`, `environment`, and `aws_region` as inputs
- Tags are merged at the module level using `merge(var.common_tags, {...})`
- No hardcoded account IDs, region names, or ARNs — all parameterized
