#!/bin/bash

# Health check script for JEVAL Frontend
# This script monitors the application health and sends alerts if issues are detected

set -e

# Configuration
APP_NAME="jeval-app"
FRONTEND_URL="http://localhost:3000"
BACKEND_URL="http://localhost:1337"
LOG_FILE="/var/log/$APP_NAME/health-check.log"
ALERT_EMAIL="admin@yourdomain.com"
SLACK_WEBHOOK_URL=""  # Optional: Add your Slack webhook URL

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Check if service is running
check_service() {
    local service_name=$1
    local url=$2
    
    log "Checking $service_name at $url..."
    
    # Check HTTP response
    if curl -f -s -o /dev/null -w "%{http_code}" $url | grep -q "200\|301\|302"; then
        log "${GREEN}✓${NC} $service_name is responding"
        return 0
    else
        log "${RED}✗${NC} $service_name is not responding"
        return 1
    fi
}

# Check Docker containers
check_containers() {
    log "Checking Docker containers..."
    
    # Get container status
    FRONTEND_STATUS=$(docker-compose ps -q jeval-frontend | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "not found")
    BACKEND_STATUS=$(docker-compose ps -q jeval-backend | xargs docker inspect -f '{{.State.Status}}' 2>/dev/null || echo "not found")
    
    if [ "$FRONTEND_STATUS" = "running" ]; then
        log "${GREEN}✓${NC} Frontend container is running"
        FRONTEND_OK=true
    else
        log "${RED}✗${NC} Frontend container is not running (Status: $FRONTEND_STATUS)"
        FRONTEND_OK=false
    fi
    
    if [ "$BACKEND_STATUS" = "running" ]; then
        log "${GREEN}✓${NC} Backend container is running"
        BACKEND_OK=true
    else
        log "${RED}✗${NC} Backend container is not running (Status: $BACKEND_STATUS)"
        BACKEND_OK=false
    fi
}

# Check system resources
check_resources() {
    log "Checking system resources..."
    
    # Check disk space
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log "${RED}✗${NC} High disk usage: ${DISK_USAGE}%"
        DISK_OK=false
    else
        log "${GREEN}✓${NC} Disk usage: ${DISK_USAGE}%"
        DISK_OK=true
    fi
    
    # Check memory usage
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $MEMORY_USAGE -gt 90 ]; then
        log "${RED}✗${NC} High memory usage: ${MEMORY_USAGE}%"
        MEMORY_OK=false
    else
        log "${GREEN}✓${NC} Memory usage: ${MEMORY_USAGE}%"
        MEMORY_OK=true
    fi
    
    # Check CPU load
    LOAD_AVG=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | sed 's/^[ \t]*//')
    CPU_CORES=$(nproc)
    if (( $(echo "$LOAD_AVG > $CPU_CORES" | bc -l) )); then
        log "${RED}✗${NC} High CPU load: $LOAD_AVG (cores: $CPU_CORES)"
        CPU_OK=false
    else
        log "${GREEN}✓${NC} CPU load: $LOAD_AVG (cores: $CPU_CORES)"
        CPU_OK=true
    fi
}

# Check logs for errors
check_logs() {
    log "Checking application logs for errors..."
    
    # Check for recent errors in application logs
    ERROR_COUNT=$(docker-compose logs --since="5m" | grep -i "error\|exception\|fatal" | wc -l)
    
    if [ $ERROR_COUNT -gt 10 ]; then
        log "${RED}✗${NC} High error count in logs: $ERROR_COUNT errors in last 5 minutes"
        LOGS_OK=false
    elif [ $ERROR_COUNT -gt 0 ]; then
        log "${YELLOW}⚠${NC} Some errors found in logs: $ERROR_COUNT errors in last 5 minutes"
        LOGS_OK=true
    else
        log "${GREEN}✓${NC} No recent errors in logs"
        LOGS_OK=true
    fi
}

# Send alert
send_alert() {
    local message=$1
    
    # Send email alert (if mail is configured)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "JEVAL Frontend Alert - $(hostname)" $ALERT_EMAIL
        log "Email alert sent to $ALERT_EMAIL"
    fi
    
    # Send Slack notification (if webhook is configured)
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 JEVAL Frontend Alert\\n$message\"}" \
            $SLACK_WEBHOOK_URL
        log "Slack notification sent"
    fi
}

# Restart services if needed
restart_services() {
    log "Attempting to restart services..."
    
    # Try graceful restart first
    docker-compose restart
    
    # Wait for services to start
    sleep 30
    
    # Check if restart was successful
    if check_service "Frontend" $FRONTEND_URL && check_service "Backend" $BACKEND_URL; then
        log "${GREEN}✓${NC} Services restarted successfully"
        send_alert "Services were automatically restarted and are now healthy"
        return 0
    else
        log "${RED}✗${NC} Service restart failed"
        send_alert "CRITICAL: Service restart failed. Manual intervention required."
        return 1
    fi
}

# Main health check function
main() {
    log "Starting health check for $APP_NAME..."
    
    # Initialize status variables
    OVERALL_OK=true
    FRONTEND_OK=true
    BACKEND_OK=true
    DISK_OK=true
    MEMORY_OK=true
    CPU_OK=true
    LOGS_OK=true
    
    # Run checks
    check_containers
    check_resources
    check_logs
    
    # Test service endpoints
    if ! check_service "Frontend" $FRONTEND_URL; then
        FRONTEND_OK=false
        OVERALL_OK=false
    fi
    
    if ! check_service "Backend" $BACKEND_URL; then
        BACKEND_OK=false
        OVERALL_OK=false
    fi
    
    # Evaluate overall health
    if [ "$FRONTEND_OK" = false ] || [ "$BACKEND_OK" = false ]; then
        OVERALL_OK=false
    fi
    
    if [ "$DISK_OK" = false ] || [ "$MEMORY_OK" = false ] || [ "$CPU_OK" = false ]; then
        OVERALL_OK=false
    fi
    
    # Take action based on health status
    if [ "$OVERALL_OK" = true ]; then
        log "${GREEN}✓${NC} All health checks passed"
        exit 0
    else
        log "${RED}✗${NC} Health check failed"
        
        # If services are down, try to restart
        if [ "$FRONTEND_OK" = false ] || [ "$BACKEND_OK" = false ]; then
            log "Attempting automatic service recovery..."
            if restart_services; then
                exit 0
            else
                exit 1
            fi
        else
            # System resource issues - just alert
            send_alert "Health check failed: System resources are critical"
            exit 1
        fi
    fi
}

# Create log directory if it doesn't exist
mkdir -p /var/log/$APP_NAME

# Run main function
main "$@"