# Aurora PostgreSQL cluster — KMS, networking, parameters, monitoring, and instances.

resource "aws_kms_key" "aurora" {
  description             = "Dedicated CMK for Aurora PostgreSQL encryption at rest (${local.name_prefix})"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  tags = merge(var.common_tags, {
    Name    = "${local.name_prefix}-aurora-cmk"
    Purpose = "aurora-encryption"
  })
}

resource "aws_kms_alias" "aurora" {
  name          = "alias/${local.name_prefix}-aurora"
  target_key_id = aws_kms_key.aurora.key_id
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${local.name_prefix}-aurora"
  subnet_ids = var.isolated_subnet_ids

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-subnet-group"
  })
}

resource "aws_security_group" "aurora" {
  name        = "${local.name_prefix}-aurora"
  description = "Restrict Aurora PostgreSQL access to ECS private subnet CIDRs on port 5432"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_private" {
  for_each = toset(var.private_subnet_cidrs)

  security_group_id = aws_security_group.aurora.id
  description       = "PostgreSQL from ECS private subnet ${each.value}"
  ip_protocol       = "tcp"
  from_port         = 5432
  to_port           = 5432
  cidr_ipv4         = each.value
}

resource "aws_vpc_security_group_egress_rule" "aurora_all" {
  security_group_id = aws_security_group.aurora.id
  description       = "Allow outbound within VPC for Aurora cluster communication"
  ip_protocol       = "-1"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_security_group" "rotation_lambda" {
  name        = "${local.name_prefix}-aurora-rotation"
  description = "Security group for Secrets Manager RDS rotation Lambda"
  vpc_id      = var.vpc_id

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-rotation-sg"
  })
}

resource "aws_vpc_security_group_egress_rule" "rotation_lambda_to_aurora" {
  security_group_id            = aws_security_group.rotation_lambda.id
  description                  = "PostgreSQL to Aurora cluster"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.aurora.id
}

resource "aws_vpc_security_group_ingress_rule" "aurora_from_rotation_lambda" {
  security_group_id            = aws_security_group.aurora.id
  description                  = "PostgreSQL from Secrets Manager rotation Lambda"
  ip_protocol                  = "tcp"
  from_port                    = 5432
  to_port                      = 5432
  referenced_security_group_id = aws_security_group.rotation_lambda.id
}

resource "aws_rds_cluster_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-cluster-pg"
  family      = local.parameter_group_family
  description = "Cluster parameters for pgvector, SSL enforcement, and pg_stat_statements"

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "pending-reboot"
  }

  parameter {
    name         = "shared_preload_libraries"
    value        = "pg_stat_statements"
    apply_method = "pending-reboot"
  }

  # Allow pgvector extension creation (Aurora PostgreSQL 15.4+/16.x).
  parameter {
    name         = "rds.allowed_extensions"
    value        = "vector,pg_stat_statements"
    apply_method = "immediate"
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-cluster-pg"
  })
}

resource "aws_db_parameter_group" "aurora" {
  name        = "${local.name_prefix}-aurora-instance-pg"
  family      = local.parameter_group_family
  description = "Instance parameters for Aurora PostgreSQL"

  parameter {
    name         = "log_statement"
    value        = "ddl"
    apply_method = "immediate"
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-instance-pg"
  })
}

resource "aws_iam_role" "enhanced_monitoring" {
  name = "${local.name_prefix}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-rds-enhanced-monitoring"
  })
}

resource "aws_iam_role_policy_attachment" "enhanced_monitoring" {
  role       = aws_iam_role.enhanced_monitoring.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

resource "aws_rds_cluster" "aurora" {
  cluster_identifier = "${local.name_prefix}-aurora"
  engine             = "aurora-postgresql"
  engine_mode        = "provisioned"
  engine_version     = var.engine_version
  database_name      = var.database_name

  master_username                 = var.master_username
  manage_master_user_password     = true
  master_user_secret_kms_key_id   = aws_kms_key.aurora.arn

  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora.id]

  storage_encrypted = true
  kms_key_id        = aws_kms_key.aurora.arn

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.aurora.name

  backup_retention_period      = var.backup_retention_period
  preferred_backup_window      = var.preferred_backup_window
  preferred_maintenance_window = var.preferred_maintenance_window
  copy_tags_to_snapshot        = true
  deletion_protection          = var.deletion_protection
  skip_final_snapshot          = var.environment == "dev" ? true : false
  final_snapshot_identifier    = var.environment == "dev" ? null : "${local.name_prefix}-aurora-final"

  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    min_capacity = var.serverless_min_capacity
    max_capacity = var.serverless_max_capacity
  }

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora"
  })
}

resource "aws_rds_cluster_instance" "writer" {
  identifier         = "${local.name_prefix}-aurora-writer"
  cluster_identifier = aws_rds_cluster.aurora.id
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  instance_class     = "db.serverless"

  db_parameter_group_name = aws_db_parameter_group.aurora.name

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = aws_iam_role.enhanced_monitoring.arn

  performance_insights_enabled          = true
  performance_insights_kms_key_id         = aws_kms_key.aurora.arn
  performance_insights_retention_period = var.performance_insights_retention_period

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-writer"
    Role = "writer"
  })
}

resource "aws_rds_cluster_instance" "reader" {
  identifier         = "${local.name_prefix}-aurora-reader"
  cluster_identifier = aws_rds_cluster.aurora.id
  engine             = aws_rds_cluster.aurora.engine
  engine_version     = aws_rds_cluster.aurora.engine_version
  instance_class     = "db.serverless"

  db_parameter_group_name = aws_db_parameter_group.aurora.name

  monitoring_interval = var.monitoring_interval
  monitoring_role_arn = aws_iam_role.enhanced_monitoring.arn

  performance_insights_enabled          = true
  performance_insights_kms_key_id         = aws_kms_key.aurora.arn
  performance_insights_retention_period = var.performance_insights_retention_period

  tags = merge(var.common_tags, {
    Name = "${local.name_prefix}-aurora-reader"
    Role = "reader"
  })
}

# AWS-managed Secrets Manager rotation Lambda for single-user PostgreSQL credentials.
resource "aws_serverlessapplicationrepository_cloudformation_stack" "secret_rotation" {
  name             = "${local.name_prefix}-aurora-rotation"
  application_id   = "arn:${data.aws_partition.current.partition}:serverlessrepo:${data.aws_region.current.id}:297356697633:applications/SecretsManagerRDSPostgreSQLRotationSingleUser"
  semantic_version = "1.1.621"

  capabilities = ["CAPABILITY_IAM", "CAPABILITY_RESOURCE_POLICY"]

  parameters = {
    functionName        = "${local.name_prefix}-aurora-rotation"
    endpoint            = "https://secretsmanager.${data.aws_region.current.id}.${data.aws_partition.current.dns_suffix}"
    vpcSubnetIds        = join(",", var.private_subnet_ids)
    vpcSecurityGroupIds = aws_security_group.rotation_lambda.id
  }
}

resource "aws_secretsmanager_secret_rotation" "aurora_master" {
  secret_id = aws_rds_cluster.aurora.master_user_secret[0].secret_arn

  rotation_rules {
    automatically_after_days = var.secret_rotation_days
  }

  rotation_lambda_arn = aws_serverlessapplicationrepository_cloudformation_stack.secret_rotation.outputs["RotationLambdaARN"]

  depends_on = [
    aws_rds_cluster_instance.writer,
    aws_serverlessapplicationrepository_cloudformation_stack.secret_rotation
  ]
}
