# Branch Protection Rules

Configure these rules on the `main` branch in GitHub **Settings → Branches → Branch protection rules**.

## Required settings

- **Require a pull request before merging**
  - Require at least 1 approving review
  - Dismiss stale pull request approvals when new commits are pushed
- **Require status checks to pass before merging**
  - `Terraform Plan / plan (dev)`
  - `Terraform Plan / plan (staging)`
  - `Terraform Plan / plan (prod)`
  - `CI / ci`
  - `Build and Deploy / build`
- **Require conversation resolution before merging**
- **Do not allow bypassing the above settings** (including administrators for production compliance)
- **Require linear history** (optional but recommended)

## Required GitHub Environments

| Environment | Manual approval | Used by |
|-------------|-----------------|---------|
| `dev` | Optional | terraform-apply, build-and-deploy |
| `staging` | Required reviewers | terraform-apply, build-and-deploy |
| `prod` | Required reviewers | terraform-apply, build-and-deploy |

Production deployments must never proceed without an explicit environment approval recorded in GitHub Actions audit logs.

## Traceability

Every workflow run is tied to a Git commit SHA via `${{ github.sha }}`. Plan artifacts and container images are tagged with the same SHA for end-to-end artifact traceability.
