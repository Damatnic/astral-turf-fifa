#!/bin/bash

# ==================================================================
# QUANTUM'S DATABASE BACKUP SCRIPT
# Automated PostgreSQL backup with encryption and compression
# ==================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/astral-turf"
BACKUP_DIR="/var/backups/astral-turf"
S3_BUCKET="astral-turf-database-backups"
GPG_KEY_ID="backup@astral-turf.com"
RETENTION_DAYS=30
MAX_PARALLEL_UPLOADS=3

# Database connection
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-astral_turf}"
DB_USER="${DB_USER:-astral}"
PGPASSWORD="${POSTGRES_PASSWORD}"

# Timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="astral_turf_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
ENCRYPTED_FILE="${COMPRESSED_FILE}.gpg"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_DIR}/backup.log"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    exit 1
}

# Cleanup function
cleanup() {
    log "Cleaning up temporary files..."
    rm -f "${BACKUP_DIR}/${BACKUP_FILE}"
    rm -f "${BACKUP_DIR}/${COMPRESSED_FILE}"
}

# Trap cleanup on exit
trap cleanup EXIT

# Create directories
mkdir -p "${LOG_DIR}" "${BACKUP_DIR}"

# Start backup process
log "Starting database backup for ${DB_NAME}"

# Check database connectivity
log "Testing database connectivity..."
pg_isready -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" || error_exit "Cannot connect to database"

# Create backup
log "Creating database dump..."
pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --verbose \
    --no-password \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_DIR}/${BACKUP_FILE}" || error_exit "Database dump failed"

# Verify backup file
if [[ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]]; then
    error_exit "Backup file was not created"
fi

BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log "Backup created successfully. Size: ${BACKUP_SIZE}"

# Compress backup
log "Compressing backup..."
gzip -9 "${BACKUP_DIR}/${BACKUP_FILE}" || error_exit "Compression failed"

# Encrypt backup
log "Encrypting backup..."
gpg --trust-model always --encrypt \
    --recipient "${GPG_KEY_ID}" \
    --output "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    "${BACKUP_DIR}/${COMPRESSED_FILE}" || error_exit "Encryption failed"

# Verify encrypted file
if [[ ! -f "${BACKUP_DIR}/${ENCRYPTED_FILE}" ]]; then
    error_exit "Encrypted backup file was not created"
fi

ENCRYPTED_SIZE=$(du -h "${BACKUP_DIR}/${ENCRYPTED_FILE}" | cut -f1)
log "Backup encrypted successfully. Size: ${ENCRYPTED_SIZE}"

# Upload to S3
log "Uploading backup to S3..."
aws s3 cp "${BACKUP_DIR}/${ENCRYPTED_FILE}" \
    "s3://${S3_BUCKET}/$(date +%Y)/$(date +%m)/$(date +%d)/${ENCRYPTED_FILE}" \
    --storage-class STANDARD_IA \
    --metadata "source=automated-backup,database=${DB_NAME},timestamp=${TIMESTAMP}" || error_exit "S3 upload failed"

# Cross-region replication
log "Replicating backup to DR region..."
aws s3 cp "s3://${S3_BUCKET}/$(date +%Y)/$(date +%m)/$(date +%d)/${ENCRYPTED_FILE}" \
    "s3://${S3_BUCKET}-dr/$(date +%Y)/$(date +%m)/$(date +%d)/${ENCRYPTED_FILE}" \
    --storage-class GLACIER \
    --region us-west-2 || log "WARNING: Cross-region replication failed"

# Cleanup old backups locally
log "Cleaning up old local backups..."
find "${BACKUP_DIR}" -name "astral_turf_backup_*.sql.gz.gpg" -mtime +7 -delete

# Cleanup old S3 backups
log "Cleaning up old S3 backups..."
CUTOFF_DATE=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
aws s3 ls "s3://${S3_BUCKET}/" --recursive | \
    awk '$1 < "'${CUTOFF_DATE}'" {print $4}' | \
    while read -r file; do
        if [[ -n "$file" ]]; then
            log "Deleting old backup: ${file}"
            aws s3 rm "s3://${S3_BUCKET}/${file}"
        fi
    done

# Verify backup integrity
log "Verifying backup integrity..."
TEMP_RESTORE_DIR="/tmp/backup_verify_${TIMESTAMP}"
mkdir -p "${TEMP_RESTORE_DIR}"

# Decrypt and decompress for verification
gpg --decrypt "${BACKUP_DIR}/${ENCRYPTED_FILE}" | gunzip > "${TEMP_RESTORE_DIR}/verify.sql" 2>/dev/null

if [[ -f "${TEMP_RESTORE_DIR}/verify.sql" ]]; then
    VERIFY_SIZE=$(du -h "${TEMP_RESTORE_DIR}/verify.sql" | cut -f1)
    log "Backup integrity verified. Uncompressed size: ${VERIFY_SIZE}"
    rm -rf "${TEMP_RESTORE_DIR}"
else
    error_exit "Backup integrity verification failed"
fi

# Generate backup report
log "Generating backup report..."
cat > "${BACKUP_DIR}/backup_report_${TIMESTAMP}.json" << EOF
{
    "timestamp": "${TIMESTAMP}",
    "database": "${DB_NAME}",
    "host": "${DB_HOST}",
    "backup_file": "${ENCRYPTED_FILE}",
    "backup_size": "${ENCRYPTED_SIZE}",
    "s3_location": "s3://${S3_BUCKET}/$(date +%Y)/$(date +%m)/$(date +%d)/${ENCRYPTED_FILE}",
    "status": "success",
    "duration_seconds": $SECONDS,
    "retention_days": ${RETENTION_DAYS}
}
EOF

# Send notification
if [[ -n "${WEBHOOK_URL:-}" ]]; then
    log "Sending backup notification..."
    curl -X POST "${WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"Database backup completed successfully\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [{
                    \"title\": \"Database\",
                    \"value\": \"${DB_NAME}\",
                    \"short\": true
                }, {
                    \"title\": \"Size\",
                    \"value\": \"${ENCRYPTED_SIZE}\",
                    \"short\": true
                }, {
                    \"title\": \"Duration\",
                    \"value\": \"${SECONDS}s\",
                    \"short\": true
                }]
            }]
        }" || log "WARNING: Notification webhook failed"
fi

log "Database backup completed successfully in ${SECONDS} seconds"

# Cleanup compressed file (keep encrypted version temporarily)
rm -f "${BACKUP_DIR}/${COMPRESSED_FILE}"

exit 0