#!/bin/bash

# ==================================================================
# QUANTUM'S DISASTER RECOVERY SCRIPT
# Complete infrastructure restoration automation
# ==================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/astral-turf"
BACKUP_S3_BUCKET="astral-turf-database-backups"
VELERO_BACKUP_LOCATION="astral-turf-backup-storage"
TARGET_REGION="${TARGET_REGION:-us-west-2}"
CLUSTER_NAME="${CLUSTER_NAME:-astral-turf-dr}"
RTO_TARGET_MINUTES=240  # 4 hours RTO

# Timestamp for this recovery
RECOVERY_TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RECOVERY_LOG="${LOG_DIR}/disaster_recovery_${RECOVERY_TIMESTAMP}.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${RECOVERY_LOG}"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    send_alert "critical" "Disaster recovery failed: $1"
    exit 1
}

# Send alert function
send_alert() {
    local severity="$1"
    local message="$2"
    
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        local color="danger"
        [[ "$severity" == "warning" ]] && color="warning"
        [[ "$severity" == "info" ]] && color="good"
        
        curl -X POST "${WEBHOOK_URL}" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"Disaster Recovery Alert\",
                \"attachments\": [{
                    \"color\": \"${color}\",
                    \"title\": \"${severity^^} Alert\",
                    \"text\": \"${message}\",
                    \"ts\": $(date +%s)
                }]
            }" || log "WARNING: Alert webhook failed"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking disaster recovery prerequisites..."
    
    # Check required tools
    for tool in aws kubectl terraform velero helm; do
        if ! command -v "$tool" &> /dev/null; then
            error_exit "Required tool not found: $tool"
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error_exit "AWS credentials not configured"
    fi
    
    # Check Terraform state
    if [[ ! -f "terraform/environments/production/terraform.tfstate" ]]; then
        log "WARNING: Local Terraform state not found, will fetch from S3"
    fi
    
    log "Prerequisites check completed"
}

# Create disaster recovery infrastructure
provision_dr_infrastructure() {
    log "Provisioning disaster recovery infrastructure in ${TARGET_REGION}..."
    
    cd terraform/environments/dr
    
    # Initialize Terraform for DR environment
    terraform init \
        -backend-config="bucket=astral-turf-terraform-state-dr" \
        -backend-config="key=dr/terraform.tfstate" \
        -backend-config="region=${TARGET_REGION}"
    
    # Plan infrastructure
    terraform plan \
        -var-file="../../../config/dr.tfvars" \
        -var="aws_region=${TARGET_REGION}" \
        -out=dr.tfplan
    
    # Apply infrastructure
    terraform apply dr.tfplan || error_exit "Failed to provision DR infrastructure"
    
    # Extract outputs
    DR_CLUSTER_NAME=$(terraform output -raw eks_cluster_name)
    DR_RDS_ENDPOINT=$(terraform output -raw rds_endpoint)
    DR_REDIS_ENDPOINT=$(terraform output -raw redis_endpoint)
    
    log "DR infrastructure provisioned successfully"
    log "DR Cluster: ${DR_CLUSTER_NAME}"
    log "DR RDS: ${DR_RDS_ENDPOINT}"
    log "DR Redis: ${DR_REDIS_ENDPOINT}"
    
    cd - > /dev/null
}

# Configure kubectl for DR cluster
configure_kubectl() {
    log "Configuring kubectl for DR cluster..."
    
    aws eks update-kubeconfig \
        --region "${TARGET_REGION}" \
        --name "${DR_CLUSTER_NAME}" \
        --alias "dr-cluster"
    
    # Verify cluster connectivity
    kubectl --context=dr-cluster cluster-info || error_exit "Cannot connect to DR cluster"
    
    log "kubectl configured for DR cluster"
}

# Restore database from backup
restore_database() {
    log "Restoring database from latest backup..."
    
    # Find latest database backup
    LATEST_BACKUP=$(aws s3 ls "s3://${BACKUP_S3_BUCKET}-dr/" --recursive | \
        grep "astral_turf_backup_.*\.sql\.gz\.gpg" | \
        sort | tail -1 | awk '{print $4}')
    
    if [[ -z "$LATEST_BACKUP" ]]; then
        error_exit "No database backup found in DR region"
    fi
    
    log "Found latest backup: ${LATEST_BACKUP}"
    
    # Download backup
    BACKUP_FILE=$(basename "$LATEST_BACKUP")
    aws s3 cp "s3://${BACKUP_S3_BUCKET}-dr/${LATEST_BACKUP}" "/tmp/${BACKUP_FILE}" \
        --region "${TARGET_REGION}"
    
    # Decrypt and decompress
    gpg --decrypt "/tmp/${BACKUP_FILE}" | gunzip > "/tmp/restore.sql"
    
    # Wait for RDS to be available
    log "Waiting for RDS instance to be available..."
    aws rds wait db-instance-available \
        --region "${TARGET_REGION}" \
        --db-instance-identifier "astral-turf-dr"
    
    # Restore database
    log "Restoring database to DR RDS instance..."
    PGPASSWORD="${POSTGRES_PASSWORD}" psql \
        -h "${DR_RDS_ENDPOINT}" \
        -p 5432 \
        -U astral \
        -d astral_turf \
        -f "/tmp/restore.sql" || error_exit "Database restoration failed"
    
    # Cleanup
    rm -f "/tmp/${BACKUP_FILE}" "/tmp/restore.sql"
    
    log "Database restoration completed"
}

# Install required operators and tools
install_cluster_tools() {
    log "Installing cluster tools and operators..."
    
    # Install NGINX Ingress Controller
    helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
    helm repo update
    
    helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
        --namespace ingress-nginx \
        --create-namespace \
        --values k8s/ingress/nginx-values.yaml \
        --set controller.service.annotations."service\.beta\.kubernetes\.io/aws-load-balancer-type"="nlb" \
        --wait --timeout=600s
    
    # Install cert-manager
    helm repo add jetstack https://charts.jetstack.io
    helm repo update
    
    helm upgrade --install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --version v1.13.0 \
        --set installCRDs=true \
        --wait --timeout=600s
    
    # Install monitoring stack
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values k8s/monitoring/prometheus-values.yaml \
        --wait --timeout=600s
    
    log "Cluster tools installed successfully"
}

# Restore application from Velero backup
restore_application() {
    log "Restoring application from Velero backup..."
    
    # Install Velero in DR cluster
    velero install \
        --provider aws \
        --plugins velero/velero-plugin-for-aws:v1.7.1 \
        --bucket astral-turf-velero-backups-dr \
        --backup-location-config region="${TARGET_REGION}" \
        --snapshot-location-config region="${TARGET_REGION}" \
        --secret-file credentials-velero
    
    # Wait for Velero to be ready
    kubectl wait --for=condition=available deployment/velero --timeout=300s -n velero
    
    # Find latest backup
    LATEST_VELERO_BACKUP=$(velero backup get -o json | jq -r '.items | sort_by(.metadata.creationTimestamp) | last | .metadata.name')
    
    if [[ "$LATEST_VELERO_BACKUP" == "null" ]]; then
        error_exit "No Velero backup found"
    fi
    
    log "Found latest Velero backup: ${LATEST_VELERO_BACKUP}"
    
    # Create restore
    RESTORE_NAME="dr-restore-${RECOVERY_TIMESTAMP}"
    velero create restore "$RESTORE_NAME" \
        --from-backup "$LATEST_VELERO_BACKUP" \
        --wait
    
    # Check restore status
    RESTORE_STATUS=$(velero describe restore "$RESTORE_NAME" -o json | jq -r '.status.phase')
    
    if [[ "$RESTORE_STATUS" != "Completed" ]]; then
        error_exit "Velero restore failed with status: ${RESTORE_STATUS}"
    fi
    
    log "Application restoration completed successfully"
}

# Update DNS and routing
update_dns_routing() {
    log "Updating DNS routing to DR environment..."
    
    # Get DR load balancer endpoint
    DR_LB_HOSTNAME=$(kubectl get service ingress-nginx-controller \
        -n ingress-nginx \
        -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    
    if [[ -z "$DR_LB_HOSTNAME" ]]; then
        error_exit "Could not get DR load balancer hostname"
    fi
    
    log "DR Load Balancer: ${DR_LB_HOSTNAME}"
    
    # Update Route53 records (if using AWS Route53)
    if [[ "${USE_ROUTE53:-true}" == "true" ]]; then
        # Update main domain
        aws route53 change-resource-record-sets \
            --hosted-zone-id "${ROUTE53_ZONE_ID}" \
            --change-batch "{
                \"Changes\": [{
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                        \"Name\": \"astral-turf.com\",
                        \"Type\": \"CNAME\",
                        \"TTL\": 60,
                        \"ResourceRecords\": [{\"Value\": \"${DR_LB_HOSTNAME}\"}]
                    }
                }]
            }"
        
        # Update app subdomain
        aws route53 change-resource-record-sets \
            --hosted-zone-id "${ROUTE53_ZONE_ID}" \
            --change-batch "{
                \"Changes\": [{
                    \"Action\": \"UPSERT\",
                    \"ResourceRecordSet\": {
                        \"Name\": \"app.astral-turf.com\",
                        \"Type\": \"CNAME\",
                        \"TTL\": 60,
                        \"ResourceRecords\": [{\"Value\": \"${DR_LB_HOSTNAME}\"}]
                    }
                }]
            }"
        
        log "DNS records updated to point to DR environment"
    else
        log "Manual DNS update required: Point domains to ${DR_LB_HOSTNAME}"
    fi
}

# Validate disaster recovery
validate_dr_environment() {
    log "Validating disaster recovery environment..."
    
    # Check all pods are running
    log "Checking pod status..."
    kubectl get pods --all-namespaces --field-selector=status.phase!=Running,status.phase!=Succeeded
    
    # Test application connectivity
    log "Testing application connectivity..."
    APP_URL="https://app.astral-turf.com"
    
    for i in {1..10}; do
        if curl -f -s "$APP_URL/health" > /dev/null; then
            log "Application health check successful"
            break
        else
            log "Attempt $i: Application not yet responding, waiting 30s..."
            sleep 30
        fi
        
        if [[ $i -eq 10 ]]; then
            error_exit "Application health check failed after 10 attempts"
        fi
    done
    
    # Test database connectivity
    log "Testing database connectivity..."
    kubectl run db-test --rm -i --restart=Never \
        --image=postgres:15 \
        --env="PGPASSWORD=${POSTGRES_PASSWORD}" \
        -- psql -h "${DR_RDS_ENDPOINT}" -U astral -d astral_turf -c "SELECT version();" || \
        error_exit "Database connectivity test failed"
    
    log "Disaster recovery validation completed successfully"
}

# Generate recovery report
generate_recovery_report() {
    log "Generating disaster recovery report..."
    
    RECOVERY_DURATION=$(($(date +%s) - $(date -d "$(head -1 "$RECOVERY_LOG" | cut -d']' -f1 | tr -d '[')" +%s)))
    RECOVERY_DURATION_MINUTES=$((RECOVERY_DURATION / 60))
    
    REPORT_FILE="${LOG_DIR}/dr_report_${RECOVERY_TIMESTAMP}.json"
    
    cat > "$REPORT_FILE" << EOF
{
    "recovery_timestamp": "${RECOVERY_TIMESTAMP}",
    "target_region": "${TARGET_REGION}",
    "cluster_name": "${DR_CLUSTER_NAME}",
    "rds_endpoint": "${DR_RDS_ENDPOINT}",
    "redis_endpoint": "${DR_REDIS_ENDPOINT}",
    "recovery_duration_seconds": ${RECOVERY_DURATION},
    "recovery_duration_minutes": ${RECOVERY_DURATION_MINUTES},
    "rto_target_minutes": ${RTO_TARGET_MINUTES},
    "rto_achieved": $(( RECOVERY_DURATION_MINUTES <= RTO_TARGET_MINUTES )),
    "status": "success",
    "validation_results": {
        "application_health": "ok",
        "database_connectivity": "ok",
        "dns_routing": "updated"
    }
}
EOF
    
    log "Recovery report generated: ${REPORT_FILE}"
    
    # Send success notification
    send_alert "info" "Disaster recovery completed successfully in ${RECOVERY_DURATION_MINUTES} minutes (RTO target: ${RTO_TARGET_MINUTES} minutes)"
}

# Main disaster recovery procedure
main() {
    log "=== STARTING DISASTER RECOVERY PROCEDURE ==="
    log "Recovery timestamp: ${RECOVERY_TIMESTAMP}"
    log "Target region: ${TARGET_REGION}"
    log "RTO target: ${RTO_TARGET_MINUTES} minutes"
    
    START_TIME=$(date +%s)
    
    # Create log directory
    mkdir -p "${LOG_DIR}"
    
    # Send initial alert
    send_alert "warning" "Disaster recovery procedure initiated for region ${TARGET_REGION}"
    
    # Execute recovery steps
    check_prerequisites
    provision_dr_infrastructure
    configure_kubectl
    install_cluster_tools
    restore_database
    restore_application
    update_dns_routing
    validate_dr_environment
    generate_recovery_report
    
    END_TIME=$(date +%s)
    TOTAL_DURATION=$(( (END_TIME - START_TIME) / 60 ))
    
    log "=== DISASTER RECOVERY COMPLETED SUCCESSFULLY ==="
    log "Total recovery time: ${TOTAL_DURATION} minutes"
    log "RTO target: ${RTO_TARGET_MINUTES} minutes"
    
    if [[ $TOTAL_DURATION -le $RTO_TARGET_MINUTES ]]; then
        log "✅ RTO TARGET ACHIEVED"
    else
        log "⚠️  RTO TARGET MISSED"
    fi
}

# Trap errors
trap 'error_exit "Script failed at line $LINENO"' ERR

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi