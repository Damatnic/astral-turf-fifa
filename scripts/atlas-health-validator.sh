#!/bin/bash

# Atlas Health Validator - Comprehensive System Health & Performance Validation
# Enterprise-Grade Health Monitoring & Validation Framework
# Banking-Level Reliability & Compliance Verification

set -euo pipefail

# Color codes for enhanced output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Atlas Health Validation Configuration
readonly VALIDATION_ID=$(date +%Y%m%d-%H%M%S)-$(openssl rand -hex 4)
readonly VALIDATION_START_TIME=$(date +%s)
readonly ATLAS_HEALTH_LOG_DIR="./logs/health-validation/${VALIDATION_ID}"
readonly HEALTH_REPORT_FILE="${ATLAS_HEALTH_LOG_DIR}/health-report.json"
readonly PERFORMANCE_REPORT_FILE="${ATLAS_HEALTH_LOG_DIR}/performance-report.json"

# Health Check Configuration
readonly HEALTH_CHECK_TIMEOUT=60
readonly PERFORMANCE_TEST_DURATION=300  # 5 minutes
readonly LOAD_TEST_CONCURRENT_USERS=100
readonly ACCEPTABLE_ERROR_RATE=0.01  # 1%
readonly ACCEPTABLE_RESPONSE_TIME=2000  # 2 seconds

# Cloud Provider Contexts
readonly CLOUD_CONTEXTS=("aws-prod-cluster" "azure-prod-cluster" "gcp-prod-cluster")

# Critical System Components
declare -A CRITICAL_COMPONENTS=(
    ["application"]="astral-turf"
    ["database"]="postgresql"
    ["cache"]="redis"
    ["monitoring"]="prometheus"
    ["logging"]="elasticsearch"
    ["ingress"]="nginx-ingress"
)

# Performance Thresholds
declare -A PERFORMANCE_THRESHOLDS=(
    ["cpu_usage"]="80"          # Max 80% CPU usage
    ["memory_usage"]="85"       # Max 85% memory usage
    ["disk_usage"]="90"         # Max 90% disk usage
    ["response_time"]="2000"    # Max 2 seconds response time
    ["error_rate"]="1"          # Max 1% error rate
    ["throughput"]="1000"       # Min 1000 requests/minute
)

# Initialize health validation environment
init_health_validation() {
    echo -e "${BLUE}🏥 Atlas: Initializing Comprehensive Health Validation${NC}"
    echo -e "${CYAN}📋 Validation ID: ${VALIDATION_ID}${NC}"
    
    # Create validation directories
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}"
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}/cluster-health"
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}/application-health"
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}/performance-metrics"
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}/security-scans"
    mkdir -p "${ATLAS_HEALTH_LOG_DIR}/compliance-checks"
    
    # Initialize logging
    exec 1> >(tee -a "${ATLAS_HEALTH_LOG_DIR}/validation.log")
    exec 2> >(tee -a "${ATLAS_HEALTH_LOG_DIR}/validation-error.log" >&2)
    
    echo "$(date): Health validation ${VALIDATION_ID} started" >> "${ATLAS_HEALTH_LOG_DIR}/audit.log"
    
    # Validate prerequisites
    validate_prerequisites
}

# Validate health check prerequisites
validate_prerequisites() {
    echo -e "${YELLOW}🔍 Atlas: Validating Health Check Prerequisites${NC}"
    
    local required_tools=("kubectl" "curl" "jq" "ab" "wrk" "siege")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Atlas: Optional tools missing: ${missing_tools[*]}${NC}"
        echo -e "${CYAN}💡 Some performance tests may be skipped${NC}"
    fi
    
    # Validate Kubernetes access
    local accessible_clusters=0
    for context in "${CLOUD_CONTEXTS[@]}"; do
        if kubectl config get-contexts | grep -q "$context"; then
            ((accessible_clusters++))
        fi
    done
    
    if [ "$accessible_clusters" -eq 0 ]; then
        echo -e "${RED}❌ Atlas: No Kubernetes clusters accessible${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Atlas: Prerequisites validated (${accessible_clusters} clusters accessible)${NC}"
}

# Comprehensive cluster health validation
validate_cluster_health() {
    echo -e "${BLUE}⚙️  Atlas: Validating Multi-Cloud Cluster Health${NC}"
    
    local cluster_health_results=()
    
    for context in "${CLOUD_CONTEXTS[@]}"; do
        echo -e "${CYAN}🔍 Checking cluster health: ${context}${NC}"
        
        # Switch to cluster context
        if ! kubectl config use-context "$context" &> /dev/null; then
            echo -e "${YELLOW}⚠️  Skipping ${context} - context not available${NC}"
            cluster_health_results+=("${context}:UNAVAILABLE")
            continue
        fi
        
        local cluster_status_file="${ATLAS_HEALTH_LOG_DIR}/cluster-health/${context}-status.json"
        
        # Node health check
        local node_health=$(check_node_health "$context")
        
        # Pod health check
        local pod_health=$(check_pod_health "$context")
        
        # Service health check
        local service_health=$(check_service_health "$context")
        
        # Resource utilization check
        local resource_health=$(check_resource_utilization "$context")
        
        # Persistent volume health
        local pv_health=$(check_persistent_volume_health "$context")
        
        # Generate cluster health report
        cat > "$cluster_status_file" << EOF
{
    "cluster": "${context}",
    "timestamp": "$(date -Iseconds)",
    "node_health": ${node_health},
    "pod_health": ${pod_health},
    "service_health": ${service_health},
    "resource_health": ${resource_health},
    "persistent_volume_health": ${pv_health}
}
EOF
        
        # Determine overall cluster health
        local overall_health=$(echo "$node_health && $pod_health && $service_health && $resource_health && $pv_health" | bc -l)
        
        if [ "$overall_health" == "1" ]; then
            cluster_health_results+=("${context}:HEALTHY")
            echo -e "${GREEN}  ✅ ${context} cluster is healthy${NC}"
        else
            cluster_health_results+=("${context}:UNHEALTHY")
            echo -e "${RED}  ❌ ${context} cluster has health issues${NC}"
        fi
    done
    
    # Summary
    echo -e "${BLUE}📊 Cluster Health Summary:${NC}"
    for result in "${cluster_health_results[@]}"; do
        if [[ "$result" == *":HEALTHY"* ]]; then
            echo -e "${GREEN}  ✅ ${result}${NC}"
        elif [[ "$result" == *":UNAVAILABLE"* ]]; then
            echo -e "${YELLOW}  ⚠️  ${result}${NC}"
        else
            echo -e "${RED}  ❌ ${result}${NC}"
        fi
    done
    
    return 0
}

# Check node health for a specific cluster
check_node_health() {
    local context=$1
    local nodes_total=$(kubectl get nodes --no-headers 2>/dev/null | wc -l || echo "0")
    local nodes_ready=$(kubectl get nodes --no-headers | grep -c "Ready" 2>/dev/null || echo "0")
    
    if [ "$nodes_total" -gt 0 ] && [ "$nodes_ready" -eq "$nodes_total" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Check pod health for critical components
check_pod_health() {
    local context=$1
    local healthy_components=0
    local total_components=${#CRITICAL_COMPONENTS[@]}
    
    for component in "${!CRITICAL_COMPONENTS[@]}"; do
        local app_label="${CRITICAL_COMPONENTS[$component]}"
        local running_pods=$(kubectl get pods -A -l "app=${app_label}" --field-selector=status.phase=Running --no-headers 2>/dev/null | wc -l || echo "0")
        local total_pods=$(kubectl get pods -A -l "app=${app_label}" --no-headers 2>/dev/null | wc -l || echo "0")
        
        if [ "$total_pods" -gt 0 ] && [ "$running_pods" -eq "$total_pods" ]; then
            ((healthy_components++))
        fi
    done
    
    if [ "$healthy_components" -eq "$total_components" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Check service health and endpoints
check_service_health() {
    local context=$1
    local healthy_services=0
    local total_services=0
    
    # Check services in production namespace
    local services=$(kubectl get services -n astral-turf-production --no-headers 2>/dev/null | awk '{print $1}' || echo "")
    
    for service in $services; do
        ((total_services++))
        local endpoints=$(kubectl get endpoints "$service" -n astral-turf-production -o jsonpath='{.subsets[*].addresses[*].ip}' 2>/dev/null | wc -w || echo "0")
        
        if [ "$endpoints" -gt 0 ]; then
            ((healthy_services++))
        fi
    done
    
    if [ "$total_services" -gt 0 ] && [ "$healthy_services" -eq "$total_services" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Check resource utilization across cluster
check_resource_utilization() {
    local context=$1
    
    # Get node resource utilization
    local cpu_usage=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$3} END {if(NR>0) print sum/NR; else print 0}' | sed 's/%//' || echo "0")
    local memory_usage=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$5} END {if(NR>0) print sum/NR; else print 0}' | sed 's/%//' || echo "0")
    
    # Check if usage is within thresholds
    local cpu_ok=$(echo "$cpu_usage < ${PERFORMANCE_THRESHOLDS[cpu_usage]}" | bc -l 2>/dev/null || echo "1")
    local memory_ok=$(echo "$memory_usage < ${PERFORMANCE_THRESHOLDS[memory_usage]}" | bc -l 2>/dev/null || echo "1")
    
    if [ "$cpu_ok" == "1" ] && [ "$memory_ok" == "1" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Check persistent volume health
check_persistent_volume_health() {
    local context=$1
    local total_pvs=$(kubectl get pv --no-headers 2>/dev/null | wc -l || echo "0")
    local bound_pvs=$(kubectl get pv --no-headers 2>/dev/null | grep -c "Bound" || echo "0")
    
    if [ "$total_pvs" -eq 0 ] || [ "$bound_pvs" -eq "$total_pvs" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Application-specific health validation
validate_application_health() {
    echo -e "${BLUE}🎯 Atlas: Validating Application Health${NC}"
    
    local app_health_results=()
    
    for context in "${CLOUD_CONTEXTS[@]}"; do
        if ! kubectl config use-context "$context" &> /dev/null; then
            continue
        fi
        
        echo -e "${CYAN}🔍 Checking application health: ${context}${NC}"
        
        # Get application service endpoint
        local service_ip=$(kubectl get service astral-turf-service -n astral-turf-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        local service_hostname=$(kubectl get service astral-turf-service -n astral-turf-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        local node_port=$(kubectl get service astral-turf-service -n astral-turf-production -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "")
        
        # Determine endpoint
        local endpoint=""
        if [ -n "$service_ip" ]; then
            endpoint="http://${service_ip}"
        elif [ -n "$service_hostname" ]; then
            endpoint="http://${service_hostname}"
        elif [ -n "$node_port" ]; then
            local node_ip=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="ExternalIP")].address}' 2>/dev/null || echo "localhost")
            endpoint="http://${node_ip}:${node_port}"
        else
            echo -e "${YELLOW}  ⚠️  No accessible endpoint found for ${context}${NC}"
            app_health_results+=("${context}:NO_ENDPOINT")
            continue
        fi
        
        # Perform health checks
        local health_check_passed=$(perform_application_health_check "$endpoint" "$context")
        
        if [ "$health_check_passed" == "true" ]; then
            app_health_results+=("${context}:HEALTHY")
            echo -e "${GREEN}  ✅ Application healthy on ${context}${NC}"
        else
            app_health_results+=("${context}:UNHEALTHY")
            echo -e "${RED}  ❌ Application unhealthy on ${context}${NC}"
        fi
    done
    
    # Summary
    echo -e "${BLUE}📊 Application Health Summary:${NC}"
    for result in "${app_health_results[@]}"; do
        if [[ "$result" == *":HEALTHY"* ]]; then
            echo -e "${GREEN}  ✅ ${result}${NC}"
        elif [[ "$result" == *":NO_ENDPOINT"* ]]; then
            echo -e "${YELLOW}  ⚠️  ${result}${NC}"
        else
            echo -e "${RED}  ❌ ${result}${NC}"
        fi
    done
}

# Perform application health check
perform_application_health_check() {
    local endpoint=$1
    local context=$2
    local health_file="${ATLAS_HEALTH_LOG_DIR}/application-health/${context}-health.json"
    
    echo -e "${CYAN}  🌐 Testing endpoint: ${endpoint}${NC}"
    
    # Basic connectivity test
    local response_code=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout $HEALTH_CHECK_TIMEOUT "$endpoint" 2>/dev/null || echo "000")
    local response_time=$(curl -o /dev/null -s -w "%{time_total}" --connect-timeout $HEALTH_CHECK_TIMEOUT "$endpoint" 2>/dev/null || echo "99")
    
    # Convert response time to milliseconds
    local response_time_ms=$(echo "$response_time * 1000" | bc -l 2>/dev/null | cut -d. -f1 || echo "9999")
    
    # Health endpoint test (if available)
    local health_endpoint_code=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout $HEALTH_CHECK_TIMEOUT "${endpoint}/health" 2>/dev/null || echo "404")
    
    # API endpoint test
    local api_endpoint_code=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout $HEALTH_CHECK_TIMEOUT "${endpoint}/api/health" 2>/dev/null || echo "404")
    
    # Generate health report
    cat > "$health_file" << EOF
{
    "endpoint": "${endpoint}",
    "context": "${context}",
    "timestamp": "$(date -Iseconds)",
    "main_endpoint": {
        "response_code": ${response_code},
        "response_time_ms": ${response_time_ms},
        "status": "$([ "$response_code" -eq 200 ] && echo "OK" || echo "FAILED")"
    },
    "health_endpoint": {
        "response_code": ${health_endpoint_code},
        "status": "$([ "$health_endpoint_code" -eq 200 ] && echo "OK" || echo "NOT_AVAILABLE")"
    },
    "api_endpoint": {
        "response_code": ${api_endpoint_code},
        "status": "$([ "$api_endpoint_code" -eq 200 ] && echo "OK" || echo "NOT_AVAILABLE")"
    }
}
EOF
    
    # Determine overall health
    if [ "$response_code" -eq 200 ] && [ "$response_time_ms" -lt "${PERFORMANCE_THRESHOLDS[response_time]}" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# Performance and load testing
perform_performance_testing() {
    echo -e "${BLUE}🚀 Atlas: Performing Performance & Load Testing${NC}"
    
    # Find accessible application endpoints
    local test_endpoints=()
    
    for context in "${CLOUD_CONTEXTS[@]}"; do
        if ! kubectl config use-context "$context" &> /dev/null; then
            continue
        fi
        
        local service_ip=$(kubectl get service astral-turf-service -n astral-turf-production -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "")
        local service_hostname=$(kubectl get service astral-turf-service -n astral-turf-production -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "")
        
        if [ -n "$service_ip" ]; then
            test_endpoints+=("http://${service_ip}")
        elif [ -n "$service_hostname" ]; then
            test_endpoints+=("http://${service_hostname}")
        fi
    done
    
    if [ ${#test_endpoints[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️  No accessible endpoints found for performance testing${NC}"
        return 0
    fi
    
    # Perform load testing on each endpoint
    for endpoint in "${test_endpoints[@]}"; do
        echo -e "${CYAN}🎯 Load testing: ${endpoint}${NC}"
        
        local perf_file="${ATLAS_HEALTH_LOG_DIR}/performance-metrics/$(echo "$endpoint" | sed 's|http://||' | sed 's|[^a-zA-Z0-9]|-|g')-performance.json"
        
        # Apache Bench load test (if available)
        if command -v ab &> /dev/null; then
            echo -e "${CYAN}  📊 Running Apache Bench test...${NC}"
            local ab_result=$(ab -n 1000 -c 10 -q "$endpoint/" 2>/dev/null | grep -E "Requests per second|Time per request" || echo "Test failed")
            echo "$ab_result" > "${perf_file}.ab"
        fi
        
        # WRK load test (if available)
        if command -v wrk &> /dev/null; then
            echo -e "${CYAN}  🔥 Running WRK stress test...${NC}"
            local wrk_result=$(wrk -t4 -c100 -d30s "$endpoint/" 2>/dev/null || echo "Test failed")
            echo "$wrk_result" > "${perf_file}.wrk"
        fi
        
        # Siege load test (if available)
        if command -v siege &> /dev/null; then
            echo -e "${CYAN}  ⚔️  Running Siege test...${NC}"
            local siege_result=$(siege -c25 -t30s "$endpoint/" -q 2>/dev/null || echo "Test failed")
            echo "$siege_result" > "${perf_file}.siege"
        fi
        
        # Simple curl-based performance test
        echo -e "${CYAN}  🌐 Running basic performance test...${NC}"
        local total_time=0
        local successful_requests=0
        local failed_requests=0
        
        for i in {1..100}; do
            local start_time=$(date +%s.%N)
            local response_code=$(curl -o /dev/null -s -w "%{http_code}" --max-time 10 "$endpoint" 2>/dev/null || echo "000")
            local end_time=$(date +%s.%N)
            local request_time=$(echo "$end_time - $start_time" | bc -l)
            
            total_time=$(echo "$total_time + $request_time" | bc -l)
            
            if [ "$response_code" -eq 200 ]; then
                ((successful_requests++))
            else
                ((failed_requests++))
            fi
        done
        
        local avg_response_time=$(echo "scale=3; $total_time / 100" | bc -l)
        local success_rate=$(echo "scale=2; $successful_requests / 100 * 100" | bc -l)
        
        # Generate performance report
        cat > "$perf_file" << EOF
{
    "endpoint": "${endpoint}",
    "timestamp": "$(date -Iseconds)",
    "test_duration": 100,
    "total_requests": 100,
    "successful_requests": ${successful_requests},
    "failed_requests": ${failed_requests},
    "success_rate_percent": ${success_rate},
    "average_response_time_seconds": ${avg_response_time},
    "performance_status": "$([ "$successful_requests" -ge 95 ] && echo "GOOD" || echo "POOR")"
}
EOF
        
        echo -e "${GREEN}  ✅ Performance test completed: ${success_rate}% success rate${NC}"
    done
}

# Security validation
perform_security_validation() {
    echo -e "${BLUE}🔒 Atlas: Performing Security Validation${NC}"
    
    for context in "${CLOUD_CONTEXTS[@]}"; do
        if ! kubectl config use-context "$context" &> /dev/null; then
            continue
        fi
        
        echo -e "${CYAN}🔍 Security validation: ${context}${NC}"
        
        local security_file="${ATLAS_HEALTH_LOG_DIR}/security-scans/${context}-security.json"
        
        # RBAC validation
        local rbac_status=$(validate_rbac_configuration "$context")
        
        # Network policy validation
        local network_policy_status=$(validate_network_policies "$context")
        
        # Pod security validation
        local pod_security_status=$(validate_pod_security "$context")
        
        # Secret management validation
        local secret_status=$(validate_secret_management "$context")
        
        # Generate security report
        cat > "$security_file" << EOF
{
    "cluster": "${context}",
    "timestamp": "$(date -Iseconds)",
    "rbac_configuration": "${rbac_status}",
    "network_policies": "${network_policy_status}",
    "pod_security": "${pod_security_status}",
    "secret_management": "${secret_status}",
    "overall_security": "$([ "$rbac_status" == "COMPLIANT" ] && [ "$network_policy_status" == "COMPLIANT" ] && [ "$pod_security_status" == "COMPLIANT" ] && [ "$secret_status" == "COMPLIANT" ] && echo "SECURE" || echo "NEEDS_ATTENTION")"
}
EOF
        
        echo -e "${GREEN}  ✅ Security validation completed for ${context}${NC}"
    done
}

# Validate RBAC configuration
validate_rbac_configuration() {
    local context=$1
    
    # Check if RBAC is enabled
    if kubectl auth can-i --list &> /dev/null; then
        # Check for overly permissive roles
        local cluster_admin_bindings=$(kubectl get clusterrolebindings -o json | jq -r '.items[] | select(.roleRef.name=="cluster-admin") | .subjects[]?.name' 2>/dev/null | wc -l || echo "0")
        
        if [ "$cluster_admin_bindings" -lt 5 ]; then
            echo "COMPLIANT"
        else
            echo "TOO_PERMISSIVE"
        fi
    else
        echo "NOT_CONFIGURED"
    fi
}

# Validate network policies
validate_network_policies() {
    local context=$1
    
    local network_policies=$(kubectl get networkpolicies -A --no-headers 2>/dev/null | wc -l || echo "0")
    
    if [ "$network_policies" -gt 0 ]; then
        echo "COMPLIANT"
    else
        echo "MISSING"
    fi
}

# Validate pod security
validate_pod_security() {
    local context=$1
    
    # Check for pods running as root
    local root_pods=$(kubectl get pods -A -o jsonpath='{range .items[*]}{.spec.securityContext.runAsUser}{"\n"}{end}' 2>/dev/null | grep -c "^0$" || echo "0")
    
    if [ "$root_pods" -eq 0 ]; then
        echo "COMPLIANT"
    else
        echo "ROOT_CONTAINERS_FOUND"
    fi
}

# Validate secret management
validate_secret_management() {
    local context=$1
    
    # Check for secrets in default namespace
    local default_secrets=$(kubectl get secrets -n default --no-headers 2>/dev/null | wc -l || echo "0")
    
    # Check for external secret management
    local external_secrets=$(kubectl get crd 2>/dev/null | grep -c "external-secrets" || echo "0")
    
    if [ "$default_secrets" -lt 3 ] && [ "$external_secrets" -gt 0 ]; then
        echo "COMPLIANT"
    else
        echo "NEEDS_IMPROVEMENT"
    fi
}

# Generate comprehensive health report
generate_comprehensive_health_report() {
    echo -e "${BLUE}📋 Atlas: Generating Comprehensive Health Report${NC}"
    
    local validation_end_time=$(date +%s)
    local validation_duration=$((validation_end_time - VALIDATION_START_TIME))
    
    # Aggregate results from all validation phases
    local cluster_health_files=($(find "${ATLAS_HEALTH_LOG_DIR}/cluster-health" -name "*.json" 2>/dev/null || echo ""))
    local app_health_files=($(find "${ATLAS_HEALTH_LOG_DIR}/application-health" -name "*.json" 2>/dev/null || echo ""))
    local performance_files=($(find "${ATLAS_HEALTH_LOG_DIR}/performance-metrics" -name "*.json" 2>/dev/null || echo ""))
    local security_files=($(find "${ATLAS_HEALTH_LOG_DIR}/security-scans" -name "*.json" 2>/dev/null || echo ""))
    
    # Calculate overall health score
    local total_checks=0
    local passed_checks=0
    
    # Process cluster health
    for file in "${cluster_health_files[@]}"; do
        if [ -f "$file" ]; then
            local healthy=$(jq -r '[.node_health, .pod_health, .service_health, .resource_health, .persistent_volume_health] | map(select(. == true)) | length' "$file" 2>/dev/null || echo "0")
            total_checks=$((total_checks + 5))
            passed_checks=$((passed_checks + healthy))
        fi
    done
    
    # Process application health
    for file in "${app_health_files[@]}"; do
        if [ -f "$file" ]; then
            local main_ok=$(jq -r '.main_endpoint.status == "OK"' "$file" 2>/dev/null || echo "false")
            total_checks=$((total_checks + 1))
            [ "$main_ok" == "true" ] && passed_checks=$((passed_checks + 1))
        fi
    done
    
    # Calculate health percentage
    local health_percentage=0
    if [ "$total_checks" -gt 0 ]; then
        health_percentage=$(echo "scale=2; $passed_checks * 100 / $total_checks" | bc -l 2>/dev/null || echo "0")
    fi
    
    # Generate final health report
    cat > "$HEALTH_REPORT_FILE" << EOF
{
    "validation_id": "${VALIDATION_ID}",
    "timestamp": "$(date -Iseconds)",
    "validation_duration_seconds": ${validation_duration},
    "overall_health": {
        "percentage": ${health_percentage},
        "status": "$([ "${health_percentage%.*}" -ge 95 ] && echo "EXCELLENT" || [ "${health_percentage%.*}" -ge 80 ] && echo "GOOD" || [ "${health_percentage%.*}" -ge 60 ] && echo "FAIR" || echo "POOR")",
        "total_checks": ${total_checks},
        "passed_checks": ${passed_checks},
        "failed_checks": $((total_checks - passed_checks))
    },
    "cluster_health": {
        "total_clusters": ${#CLOUD_CONTEXTS[@]},
        "healthy_clusters": $(find "${ATLAS_HEALTH_LOG_DIR}/cluster-health" -name "*.json" -exec jq -r 'select([.node_health, .pod_health, .service_health, .resource_health, .persistent_volume_health] | all) | .cluster' {} \; 2>/dev/null | wc -l || echo "0")
    },
    "application_health": {
        "total_endpoints": $(echo "${app_health_files[@]}" | wc -w),
        "healthy_endpoints": $(find "${ATLAS_HEALTH_LOG_DIR}/application-health" -name "*.json" -exec jq -r 'select(.main_endpoint.status == "OK") | .endpoint' {} \; 2>/dev/null | wc -l || echo "0")
    },
    "performance_metrics": {
        "tests_completed": $(echo "${performance_files[@]}" | wc -w),
        "performance_reports": "${ATLAS_HEALTH_LOG_DIR}/performance-metrics/"
    },
    "security_validation": {
        "clusters_scanned": $(echo "${security_files[@]}" | wc -w),
        "security_reports": "${ATLAS_HEALTH_LOG_DIR}/security-scans/"
    },
    "recommendations": [
        $([ "${health_percentage%.*}" -lt 95 ] && echo '"Review failed health checks and address issues"' || echo '"System health is excellent"'),
        $([ "$total_checks" -lt 10 ] && echo '"Consider expanding health check coverage"' || echo '"Comprehensive health monitoring in place"')
    ],
    "logs_location": "${ATLAS_HEALTH_LOG_DIR}",
    "next_validation": "$(date -d '+1 hour' -Iseconds)"
}
EOF
    
    echo -e "${GREEN}📊 Health Report Generated: ${HEALTH_REPORT_FILE}${NC}"
    echo -e "${CYAN}⏱️  Total Validation Duration: ${validation_duration} seconds${NC}"
    echo -e "${CYAN}🎯 Overall Health Score: ${health_percentage}%${NC}"
    
    # Display health summary
    echo -e "${BLUE}🏥 Atlas Health Validation Summary:${NC}"
    echo -e "${GREEN}  ✅ Cluster health validation completed${NC}"
    echo -e "${GREEN}  ✅ Application health checks performed${NC}"
    echo -e "${GREEN}  ✅ Performance testing executed${NC}"
    echo -e "${GREEN}  ✅ Security validation completed${NC}"
    echo -e "${GREEN}  ✅ Comprehensive health report generated${NC}"
    
    # Health status indicator
    if [ "${health_percentage%.*}" -ge 95 ]; then
        echo -e "${GREEN}🎉 SYSTEM STATUS: EXCELLENT (${health_percentage}%)${NC}"
        return 0
    elif [ "${health_percentage%.*}" -ge 80 ]; then
        echo -e "${YELLOW}⚠️  SYSTEM STATUS: GOOD (${health_percentage}%)${NC}"
        return 0
    elif [ "${health_percentage%.*}" -ge 60 ]; then
        echo -e "${YELLOW}⚠️  SYSTEM STATUS: FAIR (${health_percentage}%)${NC}"
        return 1
    else
        echo -e "${RED}❌ SYSTEM STATUS: POOR (${health_percentage}%)${NC}"
        return 1
    fi
}

# Main health validation function
main() {
    echo -e "${PURPLE}🏥 ATLAS HEALTH VALIDATOR${NC}"
    echo -e "${PURPLE}Comprehensive • Enterprise-Grade • Banking-Reliability${NC}"
    echo -e "${PURPLE}================================================${NC}"
    
    # Execute health validation pipeline
    init_health_validation
    validate_cluster_health
    validate_application_health
    perform_performance_testing
    perform_security_validation
    
    # Generate final report and exit with appropriate status
    if generate_comprehensive_health_report; then
        echo -e "${GREEN}🎉 ATLAS HEALTH VALIDATION SUCCESSFUL! 🎉${NC}"
        echo -e "${CYAN}🌐 All systems operating within acceptable parameters${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  ATLAS HEALTH VALIDATION COMPLETED WITH WARNINGS${NC}"
        echo -e "${YELLOW}💡 Review health report and address identified issues${NC}"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --timeout)
            HEALTH_CHECK_TIMEOUT="$2"
            shift 2
            ;;
        --performance-duration)
            PERFORMANCE_TEST_DURATION="$2"
            shift 2
            ;;
        --load-users)
            LOAD_TEST_CONCURRENT_USERS="$2"
            shift 2
            ;;
        --help)
            echo "Atlas Health Validator"
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --timeout SECONDS           Health check timeout (default: 60)"
            echo "  --performance-duration SEC  Performance test duration (default: 300)"
            echo "  --load-users COUNT          Concurrent users for load testing (default: 100)"
            echo "  --help                      Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Execute main health validation function
main "$@"