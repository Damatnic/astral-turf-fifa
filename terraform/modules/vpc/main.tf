# ==================================================================
# QUANTUM'S VPC MODULE
# Enterprise-grade networking infrastructure
# ==================================================================

locals {
  vpc_name = "${var.project_name}-${var.environment}"
  
  private_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 10)
  ]
  
  public_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i)
  ]
  
  database_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 20)
  ]
  
  elasticache_subnets = [
    for i, az in var.availability_zones : cidrsubnet(var.vpc_cidr, 8, i + 30)
  ]
}

# ==================================================================
# VPC
# ==================================================================

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = var.enable_dns_hostnames
  enable_dns_support   = var.enable_dns_support
  
  tags = merge(var.tags, {
    Name = local.vpc_name
    "kubernetes.io/cluster/${local.vpc_name}" = "shared"
  })
}

# ==================================================================
# INTERNET GATEWAY
# ==================================================================

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-igw"
  })
}

# ==================================================================
# PUBLIC SUBNETS
# ==================================================================

resource "aws_subnet" "public" {
  count = length(var.availability_zones)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(var.tags, var.public_subnet_tags, {
    Name = "${local.vpc_name}-public-${var.availability_zones[count.index]}"
    Type = "Public"
  })
}

# ==================================================================
# PRIVATE SUBNETS
# ==================================================================

resource "aws_subnet" "private" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, var.private_subnet_tags, {
    Name = "${local.vpc_name}-private-${var.availability_zones[count.index]}"
    Type = "Private"
  })
}

# ==================================================================
# DATABASE SUBNETS
# ==================================================================

resource "aws_subnet" "database" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.database_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-database-${var.availability_zones[count.index]}"
    Type = "Database"
  })
}

# ==================================================================
# ELASTICACHE SUBNETS
# ==================================================================

resource "aws_subnet" "elasticache" {
  count = length(var.availability_zones)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.elasticache_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-elasticache-${var.availability_zones[count.index]}"
    Type = "ElastiCache"
  })
}

# ==================================================================
# ELASTIC IPS FOR NAT GATEWAYS
# ==================================================================

resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0
  
  domain = "vpc"
  
  depends_on = [aws_internet_gateway.main]
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-nat-eip-${var.availability_zones[count.index]}"
  })
}

# ==================================================================
# NAT GATEWAYS
# ==================================================================

resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  depends_on = [aws_internet_gateway.main]
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-nat-${var.availability_zones[count.index]}"
  })
}

# ==================================================================
# ROUTE TABLES
# ==================================================================

# Public route table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-public-rt"
    Type = "Public"
  })
}

# Private route tables
resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-private-rt-${var.availability_zones[count.index]}"
    Type = "Private"
  })
}

# Database route table
resource "aws_route_table" "database" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-database-rt"
    Type = "Database"
  })
}

# ElastiCache route table
resource "aws_route_table" "elasticache" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-elasticache-rt"
    Type = "ElastiCache"
  })
}

# ==================================================================
# ROUTE TABLE ASSOCIATIONS
# ==================================================================

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database.id
}

resource "aws_route_table_association" "elasticache" {
  count = length(aws_subnet.elasticache)
  
  subnet_id      = aws_subnet.elasticache[count.index].id
  route_table_id = aws_route_table.elasticache.id
}

# ==================================================================
# VPC FLOW LOGS
# ==================================================================

resource "aws_flow_log" "vpc" {
  count = var.enable_flow_logs ? 1 : 0
  
  iam_role_arn    = aws_iam_role.flow_log[0].arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log[0].arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-flow-logs"
  })
}

resource "aws_cloudwatch_log_group" "vpc_flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name              = "/aws/vpc/flowlogs/${local.vpc_name}"
  retention_in_days = var.flow_log_retention_days
  
  tags = var.tags
}

resource "aws_iam_role" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${local.vpc_name}-flow-log-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.tags
}

resource "aws_iam_role_policy" "flow_log" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${local.vpc_name}-flow-log-policy"
  role = aws_iam_role.flow_log[0].id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect   = "Allow"
        Resource = "*"
      }
    ]
  })
}

# ==================================================================
# VPN GATEWAY (Optional)
# ==================================================================

resource "aws_vpn_gateway" "main" {
  count = var.enable_vpn_gateway ? 1 : 0
  
  vpc_id = aws_vpc.main.id
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-vpn-gateway"
  })
}

# ==================================================================
# NETWORK ACLs
# ==================================================================

resource "aws_default_network_acl" "default" {
  default_network_acl_id = aws_vpc.main.default_network_acl_id
  
  # Allow all inbound traffic
  ingress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  # Allow all outbound traffic
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = merge(var.tags, {
    Name = "${local.vpc_name}-default-nacl"
  })
}