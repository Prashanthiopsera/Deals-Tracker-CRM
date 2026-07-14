# Terraform Modules

Reusable Terraform modules for the P7VC CRM infrastructure.

Each module encapsulates a self-contained AWS resource group with its own
variables, outputs, and documentation. Modules are consumed by environment
root modules in `environments/dev`, `environments/staging`, and `environments/prod`.

## Planned Modules (upcoming work orders)

| Module | WO | Description |
|--------|----|-------------|
| `networking` | WO-002 | VPC, subnets, NAT gateways, security groups |
| `aurora` | WO-003 | Aurora PostgreSQL Serverless v2 cluster with RLS |
| `ecs` | WO-004 | ECS Fargate cluster, task definitions, service mesh |
| `api-gateway` | WO-005 | API Gateway REST/HTTP with WAF and usage plans |
| `s3-kms` | WO-006/007 | S3 buckets with KMS CMK encryption |
| `sqs-sns` | WO-008 | SQS queues and SNS topics for async messaging |
| `monitoring` | WO-009 | CloudWatch dashboards, alarms, and log groups |

## Module Conventions

- Each module directory contains: `main.tf`, `variables.tf`, `outputs.tf`
- All modules accept `project_name`, `environment`, and `aws_region` as inputs
- Tags are merged at the module level using `merge(var.common_tags, {...})`
- No hardcoded account IDs, region names, or ARNs — all parameterized
