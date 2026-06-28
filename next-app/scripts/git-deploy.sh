#!/bin/bash

# Git-based Deployment Script
# Usage: ./scripts/git-deploy.sh [branch] [environment]

set -e

# Configuration
REPO_URL="https://github.com/jeval-otepc/jeval-app.git"
APP_DIR="/application/jeval-app"
BRANCH="${1:-main}"
ENVIRONMENT="${2:-production}"
BACKUP_DIR="/var/backups/jeval-app"
LOG_FILE="/var/log/jeval-app/git-deploy.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a $LOG_FILE
}

# Check if running with proper permissions
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Use sudo when needed."
    fi
    
    if [ ! -w "$APP_DIR" ]; then
        error "No write permission to $APP_DIR. Check directory permissions."
    fi
}

# Create backup before deployment
create_backup() {
    log "Creating backup before deployment..."
    
    if [ -d "$APP_DIR" ]; then
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        BACKUP_NAME="pre_deploy_${BRANCH}_${TIMESTAMP}"
        
        sudo mkdir -p "$BACKUP_DIR"
        sudo cp -r "$APP_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        sudo chown -R $USER:$USER "$BACKUP_DIR/$BACKUP_NAME"
        
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
        echo "$BACKUP_DIR/$BACKUP_NAME" > /tmp/last_backup
    else
        warning "Application directory not found, skipping backup"
    fi
}

# Clone or update repository
update_repository() {
    log "Updating repository..."
    
    if [ ! -d "$APP_DIR" ]; then
        log "Cloning repository for the first time..."
        sudo mkdir -p "$APP_DIR"
        sudo chown $USER:$USER "$APP_DIR"
        git clone "$REPO_URL" "$APP_DIR"
    else
        log "Updating existing repository..."
        cd "$APP_DIR"
        
        # Fetch latest changes
        git fetch origin
        
        # Check if there are any changes
        LOCAL=$(git rev-parse HEAD)
        REMOTE=$(git rev-parse origin/$BRANCH)
        
        if [ "$LOCAL" = "$REMOTE" ]; then
            log "No changes detected. Deployment skipped."
            return 0
        fi
        
        # Stash any local changes
        if ! git diff-index --quiet HEAD --; then
            warning "Local changes detected. Stashing..."
            git stash push -m "Auto-stash before deploy $(date)"
        fi
        
        # Switch to target branch and pull
        git checkout "$BRANCH"
        git pull origin "$BRANCH"
    fi
    
    success "Repository updated successfully"
}

# Install dependencies
install_dependencies() {
    log "Installing dependencies..."
    
    cd "$APP_DIR"
    
    # Check if package.json changed
    if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
        log "Package.json changed, running fresh install..."
        rm -rf node_modules package-lock.json
        npm install
    else
        log "Package.json unchanged, running ci..."
        npm ci
    fi
    
    success "Dependencies installed"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "$APP_DIR"
    
    # Set environment for build
    export NODE_ENV=production
    
    # Copy environment file
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp ".env.$ENVIRONMENT" ".env.local"
        log "Environment file copied: .env.$ENVIRONMENT"
    else
        warning "Environment file .env.$ENVIRONMENT not found"
    fi
    
    # Build the application
    npm run build
    
    success "Application built successfully"
}

# Stop current services
stop_services() {
    log "Stopping current services..."
    
    cd "$APP_DIR"
    
    if [ -f "docker-compose.yml" ]; then
        docker-compose down --remove-orphans || true
    fi
    
    # Kill any running Node.js processes
    pkill -f "node.*next" || true
    pkill -f "npm.*start" || true
    
    success "Services stopped"
}

# Start services
start_services() {
    log "Starting services..."
    
    cd "$APP_DIR"
    
    if [ -f "docker-compose.yml" ]; then
        # Docker deployment
        docker-compose up -d --build
    else
        # Direct Node.js deployment
        npm start &
        echo $! > /tmp/jeval-app.pid
    fi
    
    success "Services started"
}

# Health check
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for application to start
    sleep 30
    
    # Check if application responds
    for i in {1..5}; do
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $i failed, retrying..."
        sleep 10
    done
    
    error "Health check failed after 5 attempts"
}

# Rollback function
rollback() {
    log "Rolling back deployment..."
    
    if [ -f "/tmp/last_backup" ]; then
        BACKUP_PATH=$(cat /tmp/last_backup)
        
        if [ -d "$BACKUP_PATH" ]; then
            stop_services
            sudo rm -rf "$APP_DIR"
            sudo cp -r "$BACKUP_PATH" "$APP_DIR"
            sudo chown -R $USER:$USER "$APP_DIR"
            start_services
            
            success "Rollback completed"
        else
            error "Backup not found: $BACKUP_PATH"
        fi
    else
        error "No backup information found"
    fi
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # Log to file
    echo "[$(date)] Deployment $status: $message" >> /var/log/jeval-app/deployments.log
    
    # Send email if configured
    if command -v mail &> /dev/null && [ ! -z "$NOTIFICATION_EMAIL" ]; then
        echo "$message" | mail -s "JEVAL Deployment $status" "$NOTIFICATION_EMAIL"
    fi
    
    # Send Slack notification if configured
    if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 JEVAL Deployment $status\\n$message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Cleanup old builds and logs
cleanup() {
    log "Performing cleanup..."
    
    # Remove old Docker images
    docker system prune -f > /dev/null 2>&1 || true
    
    # Clean npm cache
    npm cache clean --force > /dev/null 2>&1 || true
    
    # Remove old backups (keep last 5)
    if [ -d "$BACKUP_DIR" ]; then
        sudo find "$BACKUP_DIR" -maxdepth 1 -type d -name "pre_deploy_*" | \
        sort | head -n -5 | xargs sudo rm -rf
    fi
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting Git-based deployment..."
    log "Branch: $BRANCH, Environment: $ENVIRONMENT"
    
    # Create log directory
    sudo mkdir -p /var/log/jeval-app
    sudo chown $USER:$USER /var/log/jeval-app
    
    # Trap errors for rollback
    trap 'error "Deployment failed. Starting rollback..." && rollback' ERR
    
    check_permissions
    create_backup
    update_repository
    install_dependencies
    build_application
    stop_services
    start_services
    verify_deployment
    cleanup
    
    success "Deployment completed successfully!"
    
    # Send success notification
    COMMIT_MSG=$(cd "$APP_DIR" && git log -1 --pretty=format:"%h - %s (%an)")
    send_notification "SUCCESS" "Deployment completed successfully. Latest commit: $COMMIT_MSG"
}

# Handle command line arguments
case "${3:-deploy}" in
    "deploy")
        main "$@"
        ;;
    "rollback")
        rollback
        ;;
    "status")
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            success "Application is running"
        else
            error "Application is not responding"
        fi
        ;;
    *)
        echo "Usage: $0 [branch] [environment] [action]"
        echo "Actions: deploy (default), rollback, status"
        exit 1
        ;;
esac