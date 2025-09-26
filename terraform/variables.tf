# ==================================================================
# QUANTUM'S TERRAFORM VARIABLES
# Comprehensive variable definitions for all environments
# ==================================================================

# ==================================================================
# PROJECT CONFIGURATION
# ==================================================================

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "astral-turf"
  
  validation {
    condition     = length(var.project_name) <= 20 && can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, max 20 characters."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be one of: development, staging, production."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# ==================================================================
# NETWORKING CONFIGURATION
# ==================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
  
  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid IPv4 CIDR block."
  }
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = []
}

# ==================================================================
# EKS CLUSTER CONFIGURATION
# ==================================================================

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "eks_node_groups" {
  description = "EKS node group configurations"
  type = map(object({
    instance_types = list(string)
    scaling_config = object({
      desired_size = number
      max_size     = number
      min_size     = number
    })
    update_config = object({
      max_unavailable_percentage = number
    })
    capacity_type = string
    ami_type     = string
    disk_size    = number
    labels       = map(string)
    taints = list(object({
      key    = string
      value  = string
      effect = string
    }))
  }))
  
  default = {
    general = {
      instance_types = ["c5.xlarge", "c5.2xlarge"]
      scaling_config = {
        desired_size = 3
        max_size     = 20
        min_size     = 3
      }
      update_config = {
        max_unavailable_percentage = 25
      }
      capacity_type = "ON_DEMAND"
      ami_type     = "AL2_x86_64"
      disk_size    = 100
      labels = {
        role = "general"
      }
      taints = []
    }
    
    spot = {
      instance_types = ["c5.large", "c5.xlarge", "c5.2xlarge"]
      scaling_config = {
        desired_size = 2
        max_size     = 50
        min_size     = 0
      }
      update_config = {
        max_unavailable_percentage = 50
      }
      capacity_type = "SPOT"
      ami_type     = "AL2_x86_64"
      disk_size    = 100
      labels = {
        role = "spot"
      }
      taints = [
        {
          key    = "spot"
          value  = "true"
          effect = "NO_SCHEDULE"
        }
      ]
    }
  }
}

# ==================================================================
# DATABASE CONFIGURATION
# ==================================================================

variable "postgres_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15.3"
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.r6g.large"
}

variable "rds_allocated_storage" {
  description = "Initial allocated storage in GB"
  type        = number
  default     = 100
  
  validation {
    condition     = var.rds_allocated_storage >= 20
    error_message = "Allocated storage must be at least 20 GB."
  }
}

variable "rds_max_allocated_storage" {
  description = "Maximum allocated storage in GB for autoscaling"
  type        = number
  default     = 1000
}

# ==================================================================
# REDIS CONFIGURATION
# ==================================================================

variable "redis_node_type" {
  description = "Redis node type"
  type        = string
  default     = "cache.r6g.large"
}

variable "redis_num_cache_nodes" {
  description = "Number of Redis cache nodes"
  type        = number
  default     = 3
  
  validation {
    condition     = var.redis_num_cache_nodes >= 1
    error_message = "Number of cache nodes must be at least 1."
  }
}

# ==================================================================
# MONITORING CONFIGURATION
# ==================================================================

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = "alerts@astral-turf.com"
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([
      1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653
    ], var.log_retention_days)
    error_message = "Log retention days must be a valid CloudWatch retention period."
  }
}

# ==================================================================
# SECURITY CONFIGURATION
# ==================================================================

variable "enable_waf" {
  description = "Enable AWS WAF"
  type        = bool
  default     = true
}

variable "enable_shield" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}

variable "ssl_certificate_arn" {
  description = "ARN of SSL certificate"
  type        = string
  default     = ""
}

# ==================================================================
# BACKUP CONFIGURATION
# ==================================================================

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 30
  
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

# ==================================================================
# COST OPTIMIZATION
# ==================================================================

variable "enable_cost_anomaly_detection" {
  description = "Enable AWS Cost Anomaly Detection"
  type        = bool
  default     = true
}

variable "cost_budget_limit" {
  description = "Monthly cost budget limit in USD"
  type        = number
  default     = 1000
  
  validation {
    condition     = var.cost_budget_limit > 0
    error_message = "Cost budget limit must be greater than 0."
  }
}

# ==================================================================
# FEATURE FLAGS
# ==================================================================

variable "enable_container_insights" {
  description = "Enable Container Insights for EKS"
  type        = bool
  default     = true
}

variable "enable_secrets_manager" {
  description = "Enable AWS Secrets Manager"
  type        = bool
  default     = true
}

variable "enable_parameter_store" {
  description = "Enable AWS Systems Manager Parameter Store"
  type        = bool
  default     = true
}

variable "enable_kms_encryption" {
  description = "Enable KMS encryption for all resources"
  type        = bool
  default     = true
}

# ==================================================================
# DISASTER RECOVERY
# ==================================================================

variable "enable_cross_region_backup" {
  description = "Enable cross-region backup"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Region for cross-region backups"
  type        = string
  default     = "us-west-2"
}

variable "rpo_minutes" {
  description = "Recovery Point Objective in minutes"
  type        = number
  default     = 60
  
  validation {
    condition     = var.rpo_minutes >= 15
    error_message = "RPO must be at least 15 minutes."
  }
}

variable "rto_minutes" {
  description = "Recovery Time Objective in minutes"
  type        = number
  default     = 240
  
  validation {
    condition     = var.rto_minutes >= 60
    error_message = "RTO must be at least 60 minutes."
  }
}