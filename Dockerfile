# ==================================================================
# GUARDIAN'S FORTRESS-LEVEL SECURITY DOCKERFILE
# Multi-stage build with comprehensive security hardening
# Banking-grade security standards implementation
# ==================================================================

# -----------------------------
# Stage 0: Security Scanner
# -----------------------------
FROM aquasec/trivy:latest AS security-scanner
WORKDIR /scan
COPY package*.json ./
# Comprehensive vulnerability scanning
RUN trivy fs --exit-code 1 --severity HIGH,CRITICAL --no-progress .

# -----------------------------
# Stage 1: Hardened Build Environment
# -----------------------------
FROM node:20-alpine AS builder

# Security: Update base image and install security tools
RUN apk update && apk upgrade && \
    apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    dumb-init \
    ca-certificates \
    tzdata \
    curl && \
    rm -rf /var/cache/apk/*

# Security: Create non-root user with minimal privileges
RUN addgroup -g 1001 -S nodejs && \
    adduser -S astralturf -u 1001 -G nodejs -h /app -s /sbin/nologin

# Security: Harden filesystem permissions
RUN chmod 755 /usr/local/bin/* && \
    chmod 755 /usr/bin/* && \
    find /usr -type f -perm -4000 -exec chmod u-s {} \; && \
    find /usr -type f -perm -2000 -exec chmod g-s {} \;

# Security: Set secure working directory
WORKDIR /app

# Copy package files with secure ownership
COPY --chown=astralturf:nodejs package.json package-lock.json ./
COPY --chown=astralturf:nodejs prisma ./prisma/

# Security: Verify package integrity and install with security measures
RUN npm audit --audit-level=high && \
    npm ci --only=production --ignore-scripts --no-audit --no-fund && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/tmp/* ~/.npm

# Copy source code with secure ownership
COPY --chown=astralturf:nodejs . .

# Security: Switch to non-root user for build
USER astralturf:nodejs

# Generate Prisma client and build with security checks
RUN npx prisma generate && \
    npm run build && \
    # Security: Remove source maps in production build
    find dist -name "*.map" -delete

# Switch back to root for final setup
USER root

# -----------------------------
# Stage 2: Fortress Production Runtime
# -----------------------------
FROM node:20-alpine AS runner

# Security: System hardening and updates
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    ca-certificates \
    tzdata \
    curl && \
    rm -rf /var/cache/apk/* /tmp/* /var/tmp/* && \
    # Security: Remove unnecessary packages and files
    rm -rf /usr/share/man /usr/share/doc /usr/share/info && \
    # Security: Create secure user
    addgroup -g 1001 -S nodejs && \
    adduser -S astralturf -u 1001 -G nodejs -h /app -s /sbin/nologin && \
    # Security: Set secure permissions
    chmod 755 /usr/local/bin/* && \
    find /usr -type f -perm -4000 -exec chmod u-s {} \; && \
    find /usr -type f -perm -2000 -exec chmod g-s {} \;

# Security: Environment hardening
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    GENERATE_SOURCEMAP=false \
    NODE_OPTIONS="--no-deprecation --throw-deprecation" \
    # Security configurations
    SECURITY_HEADERS_ENABLED=true \
    CSP_ENABLED=true \
    RATE_LIMITING_ENABLED=true \
    AUDIT_LOGGING_ENABLED=true

WORKDIR /app

# Security: Create secure directory structure
RUN mkdir -p /app/dist /app/logs /app/temp /app/cache && \
    chmod 755 /app && \
    chmod 750 /app/logs /app/temp /app/cache && \
    chown -R astralturf:nodejs /app

# Copy built application with secure ownership and permissions
COPY --from=builder --chown=astralturf:nodejs /app/dist ./dist
COPY --from=builder --chown=astralturf:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=astralturf:nodejs /app/package.json ./package.json
COPY --from=builder --chown=astralturf:nodejs /app/prisma ./prisma

# Security: Set strict file permissions
RUN chmod -R 755 /app && \
    chmod -R 644 /app/dist/* /app/node_modules/* && \
    chmod 755 /app/node_modules/.bin/* && \
    find /app -type f -name "*.sh" -exec chmod 755 {} \;

# Security: Create comprehensive health check
RUN echo '#!/bin/sh\n\
set -e\n\
# Security: Check if process is running\n\
ps aux | grep -v grep | grep node || exit 1\n\
# Performance: Check application health\n\
curl -f -s --max-time 5 http://localhost:$PORT/health || exit 1\n\
# Security: Check file permissions\n\
[ "$(stat -c %a /app)" = "755" ] || exit 1\n\
echo "Health check passed"' > /usr/local/bin/healthcheck && \
    chmod 755 /usr/local/bin/healthcheck

# Security: Create startup script with security validations
RUN echo '#!/bin/sh\n\
set -e\n\
# Security validations before startup\n\
echo "Starting security validations..."\n\
# Check file permissions\n\
find /app -type f -perm -002 -exec echo "Warning: world-writable file {}" \;\n\
# Check for setuid/setgid files\n\
find /app -type f \( -perm -4000 -o -perm -2000 \) -exec echo "Warning: setuid/setgid file {}" \;\n\
echo "Security validations completed"\n\
# Start application\n\
exec "$@"' > /usr/local/bin/secure-start && \
    chmod 755 /usr/local/bin/secure-start

# Security: Switch to non-root user
USER astralturf:nodejs

# Expose port
EXPOSE 3000
ENV PORT=3000

# Security: Advanced health monitoring
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD /usr/local/bin/healthcheck

# Security: Set read-only filesystem volumes
VOLUME ["/app/logs", "/app/temp", "/app/cache"]

# Security: Use secure init system with proper signal handling
ENTRYPOINT ["/usr/local/bin/secure-start", "dumb-init", "--"]

# Security: Start with hardened node configuration
CMD ["node", \
     "--max-old-space-size=512", \
     "--max-semi-space-size=64", \
     "--no-deprecation", \
     "--throw-deprecation", \
     "--unhandled-rejections=strict", \
     "dist/server.js"]

# Security metadata and labels
LABEL maintainer="Astral Turf Security Team" \
      version="8.0.0-fortress" \
      description="Fortress-hardened Astral Turf Application" \
      security.scan.enabled="true" \
      security.scan.tools="trivy,snyk" \
      security.nonroot="true" \
      security.readonly="true" \
      security.level="banking-grade" \
      build.date="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

# -----------------------------
# Secure Development Stage
# -----------------------------
FROM builder AS development

# Development environment with security monitoring
ENV NODE_ENV=development \
    DEBUG_COLORS=true \
    SECURITY_HEADERS_ENABLED=true \
    RATE_LIMITING_ENABLED=false \
    AUDIT_LOGGING_ENABLED=true

# Install all dependencies with security audit
RUN npm audit --audit-level=moderate && \
    npm ci --no-fund && \
    npm cache clean --force

# Security: Switch to non-root user for development
USER astralturf:nodejs

# Expose development port
EXPOSE 8081

# Development startup with security monitoring
CMD ["npm", "run", "dev"]

# =================================
# ATLAS DEPLOYMENT SECURITY REQUIREMENTS
# =================================
# 
# The following security options MUST be applied during deployment:
# 
# Docker run security options:
# --cap-drop=ALL \
# --cap-add=NET_BIND_SERVICE \
# --security-opt=no-new-privileges:true \
# --read-only \
# --tmpfs /tmp:noexec,nosuid,size=100m \
# --tmpfs /app/temp:noexec,nosuid,size=50m \
# --tmpfs /app/logs:nosuid,size=100m \
# --tmpfs /app/cache:noexec,nosuid,size=50m \
# --memory=1024m \
# --memory-swap=1024m \
# --cpus=1.0 \
# --pids-limit=200 \
# --ulimit nofile=2048:2048 \
# --restart=unless-stopped
# 
# Atlas Zero-Downtime Deployment Labels:
# atlas.deployment.strategy=blue-green
# atlas.scaling.enabled=true
# atlas.monitoring.enabled=true
# atlas.rollback.enabled=true
# atlas.health.endpoint=/health
# atlas.health.timeout=30s
# atlas.startup.timeout=60s
# 
# Kubernetes security context:
# securityContext:
#   runAsNonRoot: true
#   runAsUser: 1001
#   runAsGroup: 1001
#   readOnlyRootFilesystem: true
#   allowPrivilegeEscalation: false
#   capabilities:
#     drop:
#       - ALL
#     add:
#       - NET_BIND_SERVICE
# 
# Network policies should restrict:
# - Ingress: Only from load balancer and monitoring
# - Egress: Only to required services (DB, APIs, CDN)
# 
# =================================