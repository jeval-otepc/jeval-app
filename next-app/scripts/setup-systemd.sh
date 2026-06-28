#!/bin/bash

# Setup systemd services for automated deployment

set -e

# Configuration
SERVICE_NAME="jeval-webhook"
WEBHOOK_PORT=9000
APP_USER="jeval"
APP_DIR="/opt/jeval-frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    error "This script must be run as root (use sudo)"
fi

# Create application user
create_app_user() {
    log "Creating application user: $APP_USER"
    
    if ! id "$APP_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d /home/$APP_USER -m $APP_USER
        usermod -aG docker $APP_USER
        success "User $APP_USER created"
    else
        log "User $APP_USER already exists"
    fi
}

# Setup webhook service
setup_webhook_service() {
    log "Setting up webhook service..."
    
    # Create webhook service file
    cat > /etc/systemd/system/$SERVICE_NAME.service <<EOF
[Unit]
Description=JEVAL Webhook Server
After=network.target docker.service
Wants=docker.service

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/node $APP_DIR/scripts/webhook-server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=WEBHOOK_PORT=$WEBHOOK_PORT
Environment=WEBHOOK_SECRET=your-webhook-secret-change-this
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR /var/log/jeval-frontend /var/backups/jeval-frontend
CapabilityBoundingSet=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd and enable service
    systemctl daemon-reload
    systemctl enable $SERVICE_NAME
    
    success "Webhook service created"
}

# Setup deployment service
setup_deployment_service() {
    log "Setting up deployment service..."
    
    # Create deployment service file
    cat > /etc/systemd/system/jeval-deploy.service <<EOF
[Unit]
Description=JEVAL Application Deployment
After=docker.service
Wants=docker.service

[Service]
Type=oneshot
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR
ExecStart=$APP_DIR/scripts/git-deploy.sh main production
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jeval-deploy

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$APP_DIR /var/log/jeval-frontend /var/backups/jeval-frontend

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    success "Deployment service created"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation..."
    
    cat > /etc/logrotate.d/jeval-frontend <<EOF
/var/log/jeval-frontend/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
    su $APP_USER $APP_USER
    postrotate
        systemctl reload $SERVICE_NAME || true
    endscript
}
EOF

    success "Log rotation configured"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall for webhook..."
    
    # Allow webhook port
    ufw allow $WEBHOOK_PORT/tcp comment "JEVAL Webhook"
    
    success "Firewall configured"
}

# Create directories and set permissions
setup_directories() {
    log "Setting up directories..."
    
    # Create necessary directories
    mkdir -p $APP_DIR
    mkdir -p /var/log/jeval-frontend
    mkdir -p /var/backups/jeval-frontend
    
    # Set ownership
    chown -R $APP_USER:$APP_USER $APP_DIR
    chown -R $APP_USER:$APP_USER /var/log/jeval-frontend
    chown -R $APP_USER:$APP_USER /var/backups/jeval-frontend
    
    # Set permissions
    chmod 755 $APP_DIR
    chmod 755 /var/log/jeval-frontend
    chmod 755 /var/backups/jeval-frontend
    
    success "Directories configured"
}

# Create environment file template
create_env_template() {
    log "Creating environment template..."
    
    cat > $APP_DIR/.env.webhook <<EOF
# Webhook Configuration
WEBHOOK_PORT=$WEBHOOK_PORT
WEBHOOK_SECRET=your-webhook-secret-change-this

# Notification Settings (optional)
NOTIFICATION_EMAIL=admin@yourdomain.com
SLACK_WEBHOOK_URL=

# GitHub Settings
GITHUB_TOKEN=your-github-token-here
EOF

    chown $APP_USER:$APP_USER $APP_DIR/.env.webhook
    chmod 600 $APP_DIR/.env.webhook
    
    success "Environment template created"
}

# Create helper scripts
create_helper_scripts() {
    log "Creating helper scripts..."
    
    # Create start script
    cat > /usr/local/bin/jeval-start <<EOF
#!/bin/bash
systemctl start $SERVICE_NAME
systemctl start jeval-frontend
systemctl status $SERVICE_NAME
systemctl status jeval-frontend
EOF

    # Create stop script
    cat > /usr/local/bin/jeval-stop <<EOF
#!/bin/bash
systemctl stop $SERVICE_NAME
systemctl stop jeval-frontend
EOF

    # Create status script
    cat > /usr/local/bin/jeval-status <<EOF
#!/bin/bash
echo "=== JEVAL Services Status ==="
systemctl status $SERVICE_NAME --no-pager -l
echo ""
systemctl status jeval-frontend --no-pager -l
echo ""
echo "=== Docker Containers ==="
cd $APP_DIR && docker-compose ps
echo ""
echo "=== Application Health ==="
curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"
EOF

    # Create deploy script
    cat > /usr/local/bin/jeval-deploy <<EOF
#!/bin/bash
sudo -u $APP_USER $APP_DIR/scripts/git-deploy.sh \${1:-main} \${2:-production}
EOF

    # Make scripts executable
    chmod +x /usr/local/bin/jeval-*
    
    success "Helper scripts created"
}

# Main setup function
main() {
    log "Starting systemd setup for JEVAL Frontend..."
    
    create_app_user
    setup_directories
    create_env_template
    setup_webhook_service
    setup_deployment_service
    setup_log_rotation
    setup_firewall
    create_helper_scripts
    
    success "Systemd setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Edit $APP_DIR/.env.webhook with your actual webhook secret"
    echo "2. Clone your repository to $APP_DIR"
    echo "3. Start services: jeval-start"
    echo "4. Check status: jeval-status"
    echo "5. Configure GitHub webhook: http://your-server:$WEBHOOK_PORT/webhook"
    echo ""
    echo "Helper commands:"
    echo "- jeval-start    - Start all services"
    echo "- jeval-stop     - Stop all services"
    echo "- jeval-status   - Check services status"
    echo "- jeval-deploy   - Manual deployment"
}

# Execute main function
main "$@"