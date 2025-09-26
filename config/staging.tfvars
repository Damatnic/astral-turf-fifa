# ==================================================================
# QUANTUM'S STAGING ENVIRONMENT CONFIGURATION
# Cost-optimized staging environment for testing
# ==================================================================

# ==================================================================
# PROJECT CONFIGURATION
# ==================================================================
project_name = "astral-turf"
environment  = "staging"
aws_region   = "us-east-1"

# ==================================================================
# NETWORKING CONFIGURATION
# ==================================================================
vpc_cidr = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

# ==================================================================
# EKS CLUSTER CONFIGURATION
# ==================================================================
kubernetes_version = "1.28"

eks_node_groups = {
  general = {
    instance_types = ["c5.large", "c5.xlarge"]
    scaling_config = {
      desired_size = 2
      max_size     = 10
      min_size     = 2
    }
    update_config = {
      max_unavailable_percentage = 50
    }
    capacity_type = "SPOT"  # Use spot instances for cost savings
    ami_type     = "AL2_x86_64"
    disk_size    = 100
    labels = {
      role = "general"
      tier = "staging"
    }
    taints = []
  }
  
  spot = {
    instance_types = ["c5.large", "c5.xlarge", "c5a.large"]
    scaling_config = {
      desired_size = 1
      max_size     = 20
      min_size     = 0
    }
    update_config = {
      max_unavailable_percentage = 75
    }
    capacity_type = "SPOT"
    ami_type     = "AL2_x86_64"
    disk_size    = 100
    labels = {
      role = "spot"
      tier = "staging"
    }
    taints = [
      {
        key    = "spot-instance"
        value  = "true"
        effect = "NO_SCHEDULE"
      }
    ]
  }
}

# ==================================================================
# DATABASE CONFIGURATION (Cost-optimized)
# ==================================================================
postgres_version        = "15.3"
rds_instance_class     = "db.t3.medium"  # Smaller instance for staging
rds_allocated_storage  = 100             # 100 GB storage
rds_max_allocated_storage = 500          # Auto-scale up to 500 GB

# ==================================================================
# REDIS CONFIGURATION (Single-node)
# ==================================================================
redis_node_type        = "cache.t3.micro"
redis_num_cache_nodes  = 1  # Single node for cost savings

# ==================================================================
# MONITORING & ALERTING
# ==================================================================
alert_email           = "staging-alerts@astral-turf.com"
log_retention_days    = 30  # 30 days retention

# ==================================================================
# SECURITY CONFIGURATION
# ==================================================================
enable_waf                = false  # Disabled for cost savings
enable_shield            = false
ssl_certificate_arn      = ""      # Use self-signed or Let's Encrypt
enable_kms_encryption    = true
enable_secrets_manager   = true
enable_parameter_store   = true

# ==================================================================
# BACKUP & DISASTER RECOVERY
# ==================================================================
backup_retention_period        = 7      # 7 days backup retention
enable_point_in_time_recovery  = true
enable_cross_region_backup     = false  # Disabled for cost savings
backup_region                  = "us-west-2"
rpo_minutes                    = 120     # 2 hour RPO
rto_minutes                    = 480     # 8 hour RTO

# ==================================================================
# COST MANAGEMENT
# ==================================================================
enable_cost_anomaly_detection = true
cost_budget_limit            = 500   # $500 monthly budget

# ==================================================================
# FEATURE FLAGS
# ==================================================================
enable_container_insights = true
enable_waf               = false
enable_shield           = false