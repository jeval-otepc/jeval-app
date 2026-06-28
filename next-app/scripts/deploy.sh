#!/bin/bash

# Production Deployment Script for Ubuntu Server
# Usage: ./scripts/deploy.sh [environment]

set -e  # Exit on any error

# Configuration
APP_NAME="jeval-app"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/var/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as root or with sudo
check_permissions() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root. Use sudo when needed."
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."
    sudo mkdir -p $BACKUP_DIR
    sudo mkdir -p /var/log/$APP_NAME
    sudo chown $USER:$USER /var/log/$APP_NAME
}

# Backup current deployment
backup_deployment() {
    log "Creating backup..."
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="${APP_NAME}_backup_${TIMESTAMP}"
    
    if [ -f $DOCKER_COMPOSE_FILE ]; then
        sudo cp -r . "$BACKUP_DIR/$BACKUP_NAME"
        success "Backup created: $BACKUP_DIR/$BACKUP_NAME"
    else
        warning "No existing deployment found to backup"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check available disk space (at least 2GB)
    AVAILABLE_SPACE=$(df / | tail -1 | awk '{print $4}')
    REQUIRED_SPACE=2097152  # 2GB in KB
    
    if [ $AVAILABLE_SPACE -lt $REQUIRED_SPACE ]; then
        error "Insufficient disk space. Required: 2GB, Available: $(($AVAILABLE_SPACE/1024/1024))GB"
    fi
    
    success "System requirements check passed"
}

# Setup environment
setup_environment() {
    log "Setting up environment..."
    
    if [ ! -f ".env.production" ]; then
        error ".env.production file not found. Please create it first."
    fi
    
    # Copy production env to .env.local
    cp .env.production .env.local
    success "Environment configuration ready"
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    
    # Remove old images
    log "Cleaning up old images..."
    docker system prune -f
    
    # Build new images
    log "Building new images..."
    docker-compose build --no-cache
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    success "Deployment completed"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check if frontend is responding
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend service is healthy"
    else
        error "Frontend service health check failed"
    fi
    
    # Check if backend is responding (if configured)
    if curl -f http://localhost:1337 > /dev/null 2>&1; then
        success "Backend service is healthy"
    else
        warning "Backend service health check failed or not configured"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."
    
    # Create log rotation
    sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
/var/log/$APP_NAME/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    
    success "Monitoring setup completed"
}

# Main execution
main() {
    log "Starting deployment process..."
    
    check_permissions
    setup_directories
    backup_deployment
    check_requirements
    setup_environment
    deploy
    health_check
    setup_monitoring
    
    success "Deployment process completed successfully!"
    log "Application is now running at: http://localhost:3000"
    log "Logs can be found at: /var/log/$APP_NAME/"
}

# Execute main function
main "$@"