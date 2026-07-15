# KMS encryption at rest smoke test (WO-120)

Verifies Terraform-provisioned resources expose encryption attributes via AWS CLI.

```bash
./infra/scripts/kms-encryption-smoke.sh dev
```

Expected checks:
- Aurora cluster `StorageEncrypted=true` with CMK ARN
- S3 buckets default encryption `aws:kms`
- SQS/SNS encrypted with messaging CMK
- ElastiCache at-rest encryption enabled
- CloudWatch log groups have `kmsKeyId`
