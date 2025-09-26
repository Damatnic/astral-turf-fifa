# ==================================================================
# QUANTUM'S PRODUCTION ENVIRONMENT CONFIGURATION
# High-availability, fault-tolerant production settings
# ==================================================================

# ==================================================================
# PROJECT CONFIGURATION
# ==================================================================
project_name = "astral-turf"
environment  = "production"
aws_region   = "us-east-1"

# ==================================================================
# NETWORKING CONFIGURATION
# ==================================================================
vpc_cidr = "10.0.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]

# ==================================================================
# EKS CLUSTER CONFIGURATION
# ==================================================================
kubernetes_version = "1.28"

eks_node_groups = {
  # Primary node group for general workloads
  general = {
    instance_types = ["c5.2xlarge", "c5.4xlarge"]
    scaling_config = {
      desired_size = 5
      max_size     = 100
      min_size     = 5
    }
    update_config = {
      max_unavailable_percentage = 25
    }
    capacity_type = "ON_DEMAND"
    ami_type     = "AL2_x86_64"
    disk_size    = 200
    labels = {
      role = "general"
      tier = "production"
    }
    taints = []
  }
  
  # High-memory node group for analytics and AI workloads
  memory_optimized = {
    instance_types = ["r5.2xlarge", "r5.4xlarge"]
    scaling_config = {
      desired_size = 2
      max_size     = 20
      min_size     = 2
    }
    update_config = {
      max_unavailable_percentage = 25
    }
    capacity_type = "ON_DEMAND"
    ami_type     = "AL2_x86_64"
    disk_size    = 200
    labels = {
      role = "memory-optimized"
      tier = "production"
    }
    taints = [
      {
        key    = "workload-type"
        value  = "memory-intensive"
        effect = "NO_SCHEDULE"
      }
    ]
  }
  
  # Spot instances for cost optimization
  spot = {
    instance_types = ["c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5a.xlarge", "c5a.2xlarge"]
    scaling_config = {
      desired_size = 3
      max_size     = 50
      min_size     = 0
    }
    update_config = {
      max_unavailable_percentage = 50
    }
    capacity_type = "SPOT"
    ami_type     = "AL2_x86_64"
    disk_size    = 200
    labels = {
      role = "spot"
      tier = "production"
    }
    taints = [
      {
        key    = "spot-instance"
        value  = "true"
        effect = "NO_SCHEDULE"
      }
    ]
  }
  
  # GPU nodes for AI/ML workloads (optional)
  gpu = {
    instance_types = ["g4dn.xlarge", "g4dn.2xlarge"]
    scaling_config = {
      desired_size = 0
      max_size     = 5
      min_size     = 0
    }
    update_config = {
      max_unavailable_percentage = 25
    }
    capacity_type = "ON_DEMAND"
    ami_type     = "AL2_x86_64_GPU"
    disk_size    = 300
    labels = {
      role = "gpu"
      tier = "production"
    }
    taints = [
      {
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NO_SCHEDULE"
      }
    ]
  }
}

# ==================================================================
# DATABASE CONFIGURATION (Production-grade)
# ==================================================================
postgres_version        = "15.3"
rds_instance_class     = "db.r6g.2xlarge"  # High-performance instance
rds_allocated_storage  = 500               # 500 GB initial storage
rds_max_allocated_storage = 5000           # Auto-scale up to 5 TB

# ==================================================================
# REDIS CONFIGURATION (High-availability)
# ==================================================================
redis_node_type        = "cache.r6g.xlarge"
redis_num_cache_nodes  = 3  # Multi-AZ for high availability

# ==================================================================
# MONITORING & ALERTING
# ==================================================================
alert_email           = "production-alerts@astral-turf.com"
log_retention_days    = 365  # 1 year retention for compliance

# ==================================================================
# SECURITY CONFIGURATION
# ==================================================================
enable_waf                = true
enable_shield            = true  # DDoS protection
ssl_certificate_arn      = "arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID"
enable_kms_encryption    = true
enable_secrets_manager   = true
enable_parameter_store   = true

# ==================================================================
# BACKUP & DISASTER RECOVERY
# ==================================================================
backup_retention_period        = 30    # 30 days backup retention
enable_point_in_time_recovery  = true
enable_cross_region_backup     = true
backup_region                  = "us-west-2"
rpo_minutes                    = 60     # 1 hour RPO
rto_minutes                    = 240    # 4 hour RTO

# ==================================================================
# COST MANAGEMENT
# ==================================================================
enable_cost_anomaly_detection = true
cost_budget_limit            = 5000  # $5,000 monthly budget

# ==================================================================
# FEATURE FLAGS
# ==================================================================
enable_container_insights = true
enable_waf               = true
enable_shield           = false  # Set to true if needed