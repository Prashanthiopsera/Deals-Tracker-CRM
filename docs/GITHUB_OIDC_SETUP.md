# GitHub Actions AWS OIDC Setup

This project uses OpenID Connect (OIDC) federation so GitHub Actions can assume AWS IAM roles without long-lived access keys.

## One-time AWS setup

1. Apply the `ecr` Terraform module for each environment. It creates:
   - ECR repository `p7vc-crm-<env>-api` with scan-on-push and a 30-image lifecycle policy
   - IAM role `p7vc-crm-<env>-github-actions` trusted for `repo:Prashanthiopsera/Deals-Tracker-CRM:*`
   - GitHub OIDC provider (first environment only; set `create_github_oidc_provider = false` afterward)

2. Copy the role ARN from Terraform output `github_actions_role_arn`.

## GitHub repository configuration

1. Open **Settings → Secrets and variables → Actions**.
2. Add repository secret `AWS_GITHUB_ACTIONS_ROLE_ARN` with the IAM role ARN for the target environment.
3. Add `STAGING_API_URL` (e.g. `https://api.staging.p7vc-crm.com`) for post-deploy smoke tests.
4. Create GitHub Environments named `dev`, `staging`, and `prod`.
5. Enable **Required reviewers** on `staging` and `prod` for SOC 2 change management.

## Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `terraform-plan.yml` | PR to `main` | fmt, validate, plan (artifact tagged with commit SHA) |
| `terraform-apply.yml` | Manual dispatch | apply with environment approval gate |
| `build-and-deploy.yml` | Push to `main` / manual | audit, tests, Trivy scan, ECR push, ECS deploy |

All deploy jobs log the Git commit SHA in workflow output for traceability.
