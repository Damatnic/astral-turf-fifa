# ==================================================================
# QUANTUM'S TERRAFORM OUTPUTS
# Infrastructure information for external systems
# ==================================================================

# ==================================================================
# VPC OUTPUTS
# ==================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of private subnet IDs"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of public subnet IDs"
  value       = module.vpc.public_subnets
}

output "database_subnets" {
  description = "List of database subnet IDs"
  value       = module.vpc.database_subnets
}

output "nat_gateway_ips" {
  description = "List of NAT Gateway IPs"
  value       = module.vpc.nat_public_ips
}

# ==================================================================
# EKS CLUSTER OUTPUTS
# ==================================================================

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
  sensitive   = true
}

output "eks_cluster_version" {
  description = "EKS cluster Kubernetes version"
  value       = module.eks.cluster_version
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = module.eks.cluster_security_group_id
}

output "eks_node_security_group_id" {
  description = "EKS node security group ID"
  value       = module.eks.node_security_group_id
}

output "eks_cluster_certificate_authority_data" {
  description = "EKS cluster certificate authority data"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_cluster_oidc_issuer_url" {
  description = "EKS cluster OIDC issuer URL"
  value       = module.eks.cluster_oidc_issuer_url
}

output "eks_node_groups" {
  description = "EKS node group information"
  value = {
    for k, v in module.eks.eks_managed_node_groups : k => {
      arn           = v.node_group_arn
      status        = v.node_group_status
      capacity_type = v.capacity_type
      instance_types = v.instance_types
      scaling_config = v.scaling_config
    }
  }
}

# ==================================================================
# DATABASE OUTPUTS
# ==================================================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "rds_username" {
  description = "RDS master username"
  value       = module.rds.db_instance_username
  sensitive   = true
}

output "rds_security_group_id" {
  description = "RDS security group ID"
  value       = module.rds.security_group_id
}

output "rds_subnet_group_name" {
  description = "RDS subnet group name"
  value       = module.rds.db_subnet_group_name
}

output "rds_parameter_group_name" {
  description = "RDS parameter group name"
  value       = module.rds.db_parameter_group_name
}

# ==================================================================
# REDIS OUTPUTS
# ==================================================================

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = module.redis.cache_cluster_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis cluster port"
  value       = module.redis.cache_cluster_port
}

output "redis_security_group_id" {
  description = "Redis security group ID"
  value       = module.redis.security_group_id
}

output "redis_subnet_group_name" {
  description = "Redis subnet group name"
  value       = module.redis.cache_subnet_group_name
}

# ==================================================================
# MONITORING OUTPUTS
# ==================================================================

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = module.monitoring.dashboard_url
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "log_group_names" {
  description = "CloudWatch log group names"
  value       = module.monitoring.log_group_names
}

# ==================================================================
# SECURITY OUTPUTS
# ==================================================================

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = module.monitoring.kms_key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = module.monitoring.kms_key_arn
}

# ==================================================================
# LOAD BALANCER OUTPUTS
# ==================================================================

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = try(module.eks.aws_load_balancer_controller_targetgroupbinding_dns_name, null)
}

output "alb_zone_id" {
  description = "ALB zone ID"
  value       = try(module.eks.aws_load_balancer_controller_targetgroupbinding_zone_id, null)
}

# ==================================================================
# COST TRACKING OUTPUTS
# ==================================================================

output "cost_budget_name" {
  description = "Cost budget name"
  value       = module.monitoring.cost_budget_name
}

output "cost_anomaly_detector_arn" {
  description = "Cost anomaly detector ARN"
  value       = module.monitoring.cost_anomaly_detector_arn
}

# ==================================================================
# ENVIRONMENT INFORMATION
# ==================================================================

output "environment_info" {
  description = "Environment information"
  value = {
    project_name = var.project_name
    environment  = var.environment
    region       = var.aws_region
    cluster_name = local.cluster_name
    deployment_time = timestamp()
  }
}

# ==================================================================
# CONNECTION STRINGS (SENSITIVE)
# ==================================================================

output "database_url" {
  description = "Database connection URL"
  value = format(
    "postgresql://%s:%s@%s:%s/%s",
    module.rds.db_instance_username,
    module.rds.db_instance_password,
    module.rds.db_instance_endpoint,
    module.rds.db_instance_port,
    module.rds.db_instance_name
  )
  sensitive = true
}

output "redis_url" {
  description = "Redis connection URL"
  value = format(
    "redis://%s:%s",
    module.redis.cache_cluster_address,
    module.redis.cache_cluster_port
  )
  sensitive = true
}

# ==================================================================
# KUBERNETES CONFIG
# ==================================================================

output "kubectl_config" {
  description = "kubectl configuration"
  value = {
    cluster_name = module.eks.cluster_name
    endpoint     = module.eks.cluster_endpoint
    region       = var.aws_region
    update_command = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
  }
  sensitive = true
}

# ==================================================================
# INFRASTRUCTURE SUMMARY
# ==================================================================

output "infrastructure_summary" {
  description = "Complete infrastructure summary"
  value = {
    # Network
    vpc = {
      id         = module.vpc.vpc_id
      cidr       = module.vpc.vpc_cidr_block
      azs        = data.aws_availability_zones.available.names
    }
    
    # Compute
    kubernetes = {
      cluster_name = module.eks.cluster_name
      version      = module.eks.cluster_version
      endpoint     = module.eks.cluster_endpoint
      node_groups  = length(keys(var.eks_node_groups))
    }
    
    # Storage
    database = {
      engine   = "postgres"
      version  = var.postgres_version
      instance = var.rds_instance_class
      multi_az = var.environment == "production"
    }
    
    cache = {
      engine = "redis"
      nodes  = var.redis_num_cache_nodes
      type   = var.redis_node_type
    }
    
    # Monitoring
    observability = {
      logs_retention = var.log_retention_days
      monitoring     = "cloudwatch"
      alerting       = "sns"
    }
    
    # Security
    security = {
      encryption   = var.enable_kms_encryption
      waf_enabled  = var.enable_waf
      vpc_flow_logs = true
    }
    
    # Backup & DR
    backup = {
      retention_days = var.backup_retention_period
      cross_region   = var.enable_cross_region_backup
      rpo_minutes    = var.rpo_minutes
      rto_minutes    = var.rto_minutes
    }
  }
}