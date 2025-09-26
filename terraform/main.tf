# ==================================================================
# QUANTUM'S TERRAFORM MAIN CONFIGURATION
# Multi-cloud enterprise infrastructure
# ==================================================================

terraform {
  required_version = ">= 1.6.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4.0"
    }
  }

  backend "s3" {
    bucket         = "astral-turf-terraform-state"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "astral-turf-terraform-locks"
    
    # State versioning and backup
    versioning = true
  }
}

# ==================================================================
# PROVIDER CONFIGURATIONS
# ==================================================================

provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
      Owner       = "quantum-infrastructure"
      CostCenter  = "engineering"
    }
  }
}

provider "kubernetes" {
  host                   = module.eks.cluster_endpoint
  cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
  
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    command     = "aws"
    args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
  }
}

provider "helm" {
  kubernetes {
    host                   = module.eks.cluster_endpoint
    cluster_ca_certificate = base64decode(module.eks.cluster_certificate_authority_data)
    
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      command     = "aws"
      args        = ["eks", "get-token", "--cluster-name", module.eks.cluster_name]
    }
  }
}

# ==================================================================
# DATA SOURCES
# ==================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_availability_zones" "available" {
  state = "available"
}

# ==================================================================
# LOCAL VALUES
# ==================================================================

locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Owner       = "quantum-infrastructure"
    CostCenter  = "engineering"
  }
  
  cluster_name = "${var.project_name}-${var.environment}"
  
  vpc_cidr = var.environment == "production" ? "10.0.0.0/16" : "10.1.0.0/16"
  
  azs = slice(data.aws_availability_zones.available.names, 0, 3)
}

# ==================================================================
# VPC MODULE
# ==================================================================

module "vpc" {
  source = "./modules/vpc"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_cidr             = local.vpc_cidr
  availability_zones   = local.azs
  enable_nat_gateway   = true
  enable_vpn_gateway   = var.environment == "production"
  enable_flow_logs     = true
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # Kubernetes specific tags
  public_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/elb"                      = "1"
  }
  
  private_subnet_tags = {
    "kubernetes.io/cluster/${local.cluster_name}" = "shared"
    "kubernetes.io/role/internal-elb"             = "1"
  }
  
  tags = local.common_tags
}

# ==================================================================
# EKS CLUSTER MODULE
# ==================================================================

module "eks" {
  source = "./modules/eks"
  
  project_name = var.project_name
  environment  = var.environment
  
  cluster_name    = local.cluster_name
  cluster_version = var.kubernetes_version
  
  vpc_id                    = module.vpc.vpc_id
  subnet_ids               = module.vpc.private_subnets
  control_plane_subnet_ids = module.vpc.private_subnets
  
  # Security
  cluster_endpoint_private_access = true
  cluster_endpoint_public_access  = var.environment == "production" ? false : true
  cluster_endpoint_public_access_cidrs = var.environment == "production" ? [] : ["0.0.0.0/0"]
  
  # Node groups
  node_groups = var.eks_node_groups
  
  # Add-ons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }
  
  # Logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
  
  tags = local.common_tags
}

# ==================================================================
# RDS DATABASE MODULE
# ==================================================================

module "rds" {
  source = "./modules/rds"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.database_subnets
  
  # Database configuration
  engine         = "postgres"
  engine_version = var.postgres_version
  instance_class = var.rds_instance_class
  
  allocated_storage     = var.rds_allocated_storage
  max_allocated_storage = var.rds_max_allocated_storage
  storage_encrypted     = true
  
  database_name = "astral_turf"
  username      = "astral"
  
  # High availability
  multi_az               = var.environment == "production"
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Performance monitoring
  performance_insights_enabled = true
  monitoring_interval         = 60
  
  # Security
  deletion_protection = var.environment == "production"
  skip_final_snapshot = var.environment != "production"
  
  allowed_security_groups = [module.eks.node_security_group_id]
  
  tags = local.common_tags
}

# ==================================================================
# REDIS CLUSTER MODULE
# ==================================================================

module "redis" {
  source = "./modules/redis"
  
  project_name = var.project_name
  environment  = var.environment
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.elasticache_subnets
  
  # Redis configuration
  node_type                = var.redis_node_type
  num_cache_nodes          = var.environment == "production" ? 3 : 1
  parameter_group_name     = "default.redis7"
  port                     = 6379
  
  # Security
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  # Backup
  snapshot_retention_limit = var.environment == "production" ? 7 : 1
  snapshot_window         = "05:00-06:00"
  
  allowed_security_groups = [module.eks.node_security_group_id]
  
  tags = local.common_tags
}

# ==================================================================
# MONITORING MODULE
# ==================================================================

module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  
  cluster_name = module.eks.cluster_name
  vpc_id       = module.vpc.vpc_id
  
  # CloudWatch
  create_cloudwatch_dashboard = true
  log_retention_days          = var.environment == "production" ? 365 : 30
  
  # Alarms
  cpu_threshold    = 80
  memory_threshold = 85
  disk_threshold   = 90
  
  # SNS for alerts
  alert_email = var.alert_email
  
  tags = local.common_tags
}