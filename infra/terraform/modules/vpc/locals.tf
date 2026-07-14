locals {
  name_prefix = "${var.project_name}-${var.environment}"

  azs = length(var.availability_zones) > 0 ? slice(var.availability_zones, 0, var.az_count) : slice(
    data.aws_availability_zones.available.names,
    0,
    var.az_count
  )

  # /24 subnets carved from the VPC /16 using non-overlapping indices.
  public_subnet_cidrs   = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i)]
  private_subnet_cidrs  = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 10)]
  isolated_subnet_cidrs = [for i in range(var.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 20)]
}
