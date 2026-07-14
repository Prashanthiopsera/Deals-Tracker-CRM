variable "project_name" {
  description = "Project identifier used in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment name (dev, staging, prod)."
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "vpc_id" {
  description = "VPC ID for ECS and ALB resources."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for ECS Fargate tasks."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "private_subnet_ids must contain at least 2 subnet IDs."
  }
}

variable "public_subnet_ids" {
  description = "Public subnet IDs for the Application Load Balancer."
  type        = list(string)

  validation {
    condition     = length(var.public_subnet_ids) >= 2
    error_message = "public_subnet_ids must contain at least 2 subnet IDs."
  }
}

variable "app_port" {
  description = "Application container port."
  type        = number
  default     = 3000
}

variable "container_cpu" {
  description = "Fargate task CPU units."
  type        = number
  default     = 1024
}

variable "container_memory" {
  description = "Fargate task memory in MiB."
  type        = number
  default     = 2048
}

variable "desired_count" {
  description = "Desired number of ECS tasks."
  type        = number
  default     = 2
}

variable "deployment_minimum_healthy_percent" {
  description = "Minimum healthy percent during deployments."
  type        = number
  default     = 100
}

variable "deployment_maximum_percent" {
  description = "Maximum percent during deployments."
  type        = number
  default     = 200
}

variable "autoscaling_min_capacity" {
  description = "Minimum task count for auto-scaling."
  type        = number
  default     = 2
}

variable "autoscaling_max_capacity" {
  description = "Maximum task count for auto-scaling."
  type        = number
  default     = 10
}

variable "cpu_target_utilization" {
  description = "Target CPU utilization percentage for auto-scaling."
  type        = number
  default     = 70
}

variable "requests_per_target" {
  description = "Target ALB request count per target for auto-scaling."
  type        = number
  default     = 1000
}

variable "health_check_path" {
  description = "ALB target group health check path."
  type        = string
  default     = "/api/health"
}

variable "health_check_interval" {
  description = "Health check interval in seconds."
  type        = number
  default     = 30
}

variable "healthy_threshold" {
  description = "Consecutive successful health checks before healthy."
  type        = number
  default     = 3
}

variable "container_image" {
  description = "ECR image URI for the NestJS API container."
  type        = string
  default     = "public.ecr.aws/docker/library/nginx:stable-alpine"
}

variable "container_name" {
  description = "Primary container name in the task definition."
  type        = string
  default     = "p7vc-api"
}

variable "aurora_secret_arn" {
  description = "Secrets Manager ARN for Aurora master credentials."
  type        = string
  default     = ""
}

variable "auth0_domain" {
  description = "Auth0 tenant domain for JWT validation."
  type        = string
  default     = "p7vc.auth0.com"
}

variable "auth0_audience" {
  description = "Auth0 API audience identifier."
  type        = string
  default     = "https://api.p7vc-crm.com"
}

variable "aws_region" {
  description = "AWS region for service endpoint environment variables."
  type        = string
}

variable "common_tags" {
  description = "Common tags merged onto every resource."
  type        = map(string)
  default     = {}
}
