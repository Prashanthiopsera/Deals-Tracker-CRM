output "vpc_id" {
  description = "ID of the VPC."
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC."
  value       = aws_vpc.main.cidr_block
}

output "availability_zones" {
  description = "Availability zones used by the VPC subnets."
  value       = local.azs
}

output "public_subnet_ids" {
  description = "IDs of public subnets (NAT Gateway / ALB tier)."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of private subnets (ECS Fargate tier)."
  value       = aws_subnet.private[*].id
}

output "isolated_subnet_ids" {
  description = "IDs of isolated subnets (Aurora / ElastiCache tier)."
  value       = aws_subnet.isolated[*].id
}

output "public_subnet_cidrs" {
  description = "CIDR blocks of public subnets."
  value       = local.public_subnet_cidrs
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets."
  value       = local.private_subnet_cidrs
}

output "isolated_subnet_cidrs" {
  description = "CIDR blocks of isolated subnets."
  value       = local.isolated_subnet_cidrs
}

output "nat_gateway_ids" {
  description = "IDs of NAT Gateways (one per AZ)."
  value       = aws_nat_gateway.main[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway."
  value       = aws_internet_gateway.main.id
}

output "vpc_flow_log_id" {
  description = "ID of the VPC flow log."
  value       = aws_flow_log.main.id
}

output "vpc_flow_log_group_name" {
  description = "CloudWatch log group name for VPC flow logs."
  value       = aws_cloudwatch_log_group.vpc_flow_logs.name
}
