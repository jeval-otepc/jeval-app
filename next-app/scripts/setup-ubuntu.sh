#!/bin/bash

# Ubuntu Server Setup Script for JEVAL Frontend
# This script prepares Ubuntu server for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo -e "${RED}[INSTALLATION FAILED]${NC} Installation failed at step: $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root (use sudo)"
    fi
}

# Check if service is active
is_service_active() {
    systemctl is-active --quiet "$1" 2>/dev/null
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Update system
update_system() {
    log "Updating system packages..."
    apt-get update || error "Failed to update package list"
    apt-get upgrade -y || error "Failed to upgrade system packages"
    success "System updated successfully"
}

# Install required packages
install_packages() {
    log "Installing required packages..."
    
    # Basic tools
    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        logrotate \
        htop \
        nano \
        vim || error "Failed to install basic packages"
    
    success "Basic packages installed"
}

# Install NVM and Node.js
install_nvm() {
    log "Installing NVM and Node.js 20..."
    
    # Check if NVM is already installed
    if command_exists nvm || [ -s "$HOME/.nvm/nvm.sh" ]; then
        warning "NVM is already installed, skipping installation"
        return 0
    fi
    
    # Install NVM
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || error "Failed to install NVM"
    
    # Load NVM
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install Node.js 20
    nvm install 20 || error "Failed to install Node.js via NVM"
    nvm use 20
    nvm alias default 20
    
    # Update npm
    npm install -g npm@latest || error "Failed to update npm"
    
    # Verify installation
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    
    success "NVM installed with Node.js $NODE_VERSION and npm $NPM_VERSION"
}

# Install Docker
install_docker() {
    log "Installing Docker..."
    
    # Check if Docker is already active
    if is_service_active docker; then
        warning "Docker service is already active, skipping installation"
        return 0
    fi
    
    # Check if Docker is already installed
    if command_exists docker; then
        warning "Docker is already installed, starting service"
        systemctl start docker || error "Failed to start Docker service"
        systemctl enable docker || error "Failed to enable Docker service"
        return 0
    fi
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg || error "Failed to add Docker GPG key"
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null || error "Failed to add Docker repository"
    
    # Install Docker
    apt-get update || error "Failed to update package list for Docker"
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin || error "Failed to install Docker packages"
    
    # Start and enable Docker
    systemctl start docker || error "Failed to start Docker service"
    systemctl enable docker || error "Failed to enable Docker service"
    
    # Add otepcdev user to docker group
    if id "otepcdev" &>/dev/null; then
        usermod -aG docker otepcdev || error "Failed to add otepcdev to docker group"
    fi
    
    success "Docker installed successfully"
}

# Install Docker Compose
install_docker_compose() {
    log "Installing Docker Compose..."
    
    # Check if Docker Compose is already installed
    if command_exists docker-compose; then
        COMPOSE_VER=$(docker-compose --version)
        warning "Docker Compose is already installed: $COMPOSE_VER"
        return 0
    fi
    
    # Download and install Docker Compose
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4) || error "Failed to get Docker Compose version"
    curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose || error "Failed to download Docker Compose"
    chmod +x /usr/local/bin/docker-compose || error "Failed to make Docker Compose executable"
    
    # Create symlink for easier access
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose || error "Failed to create Docker Compose symlink"
    
    # Verify installation
    COMPOSE_VER=$(docker-compose --version) || error "Failed to verify Docker Compose installation"
    success "Docker Compose installed: $COMPOSE_VER"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    # Reset UFW to defaults
    ufw --force reset
    
    # Set default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH (be careful not to lock yourself out!)
    ufw allow ssh
    ufw allow 22/tcp
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow application ports
    ufw allow 3000/tcp  # Frontend
    ufw allow 1337/tcp  # Backend (Strapi)
    ufw allow 5432/tcp  # PostgreSQL (only if needed externally)
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Setup Nginx
install_nginx() {
    log "Installing and configuring Nginx..."
    
    # Check if Nginx is already active
    if is_service_active nginx; then
        warning "Nginx service is already active, skipping installation"
        return 0
    fi
    
    # Check if Nginx is already installed
    if command_exists nginx; then
        warning "Nginx is already installed, starting service"
        systemctl start nginx || error "Failed to start Nginx service"
        systemctl enable nginx || error "Failed to enable Nginx service"
        return 0
    fi
    
    apt-get install -y nginx || error "Failed to install Nginx"
    
    # Create Nginx configuration directory
    mkdir -p /etc/nginx/sites-available || error "Failed to create Nginx sites-available directory"
    mkdir -p /etc/nginx/sites-enabled || error "Failed to create Nginx sites-enabled directory"
    mkdir -p /etc/nginx/ssl || error "Failed to create Nginx SSL directory"
    mkdir -p /var/log/nginx || error "Failed to create Nginx log directory"
    
    # Start and enable Nginx
    systemctl start nginx || error "Failed to start Nginx service"
    systemctl enable nginx || error "Failed to enable Nginx service"
    
    success "Nginx installed and configured"
}

# Setup SSL with Let's Encrypt or existing certificates
setup_ssl() {
    log "Setting up SSL certificates..."
    
    # Check if existing SSL certificates are available
    if [ -f "/ssl/server.crt" ] && [ -f "/ssl/server.key" ]; then
        success "Existing SSL certificates found at /ssl/server.crt and /ssl/server.key"
        success "You can use these existing SSL certificates in your Nginx configuration"
        return 0
    fi
    
    # Check if Certbot is already installed
    if command_exists certbot; then
        warning "Certbot is already installed"
        success "Run 'sudo certbot --nginx -d yourdomain.com' to get SSL certificate"
        return 0
    fi
    
    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx || error "Failed to install Certbot"
    
    success "Certbot installed. Run 'sudo certbot --nginx -d yourdomain.com' to get SSL certificate"
}

# Create application directories
setup_app_directories() {
    log "Setting up application directories..."
    
    # Ensure otepcdev user exists
    if ! id "otepcdev" &>/dev/null; then
        useradd -m -s /bin/bash otepcdev || error "Failed to create otepcdev user"
        success "Created otepcdev user"
    fi
    
    # Create application directories
    mkdir -p /application/jeval/frontend || error "Failed to create frontend directory"
    mkdir -p /application/jeval/api || error "Failed to create API directory"
    mkdir -p /var/log/jeval-frontend || error "Failed to create log directory"
    mkdir -p /var/backups/jeval-frontend || error "Failed to create backup directory"
    
    # Set permissions for otepcdev user
    chown -R otepcdev:otepcdev /application/jeval || error "Failed to set ownership of application directory"
    chown -R otepcdev:otepcdev /var/log/jeval-frontend || error "Failed to set ownership of log directory"
    chown -R otepcdev:otepcdev /var/backups/jeval-frontend || error "Failed to set ownership of backup directory"
    
    # Set proper permissions
    chmod -R 755 /application/jeval || error "Failed to set permissions on application directory"
    
    success "Application directories created with otepcdev ownership"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring and logging..."
    
    # Install monitoring tools
    apt-get install -y htop iotop nload
    
    # Setup log rotation for application
    cat > /etc/logrotate.d/jeval-frontend <<EOF
/var/log/jeval-frontend/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        systemctl reload nginx
    endscript
}
EOF
    
    success "Monitoring and logging configured"
}

# Create systemd service for the application
create_systemd_service() {
    log "Creating systemd service..."
    
    # Check if service already exists and is active
    if is_service_active jeval-frontend; then
        warning "jeval-frontend service is already active, skipping creation"
        return 0
    fi
    
    cat > /etc/systemd/system/jeval-frontend.service <<EOF || error "Failed to create systemd service file"
[Unit]
Description=JEVAL Frontend Application
After=docker.service
Requires=docker.service

[Service]
Type=forking
User=otepcdev
Group=otepcdev
WorkingDirectory=/application/jeval/frontend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    # Reload systemd and enable service
    systemctl daemon-reload || error "Failed to reload systemd"
    systemctl enable jeval-frontend || error "Failed to enable jeval-frontend service"
    
    success "Systemd service created with otepcdev user"
}

# Setup fail2ban for security
setup_fail2ban() {
    log "Configuring fail2ban..."
    
    # Check if fail2ban is already active
    if is_service_active fail2ban; then
        warning "Fail2ban service is already active, skipping configuration"
        return 0
    fi
    
    # Create jail configuration for nginx
    cat > /etc/fail2ban/jail.d/nginx.conf <<EOF || error "Failed to create fail2ban nginx configuration"
[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-noscript]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 6

[nginx-badbots]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2

[nginx-noproxy]
enabled = true
port = http,https
logpath = /var/log/nginx/access.log
maxretry = 2
EOF
    
    # Restart fail2ban
    systemctl restart fail2ban || error "Failed to restart fail2ban service"
    systemctl enable fail2ban || error "Failed to enable fail2ban service"
    
    success "Fail2ban configured"
}

# Final security hardening
security_hardening() {
    log "Applying security hardening..."
    
    # Disable unused services
    systemctl disable bluetooth || true
    systemctl stop bluetooth || true
    
    # Set up automatic security updates
    apt-get install -y unattended-upgrades
    echo 'Unattended-Upgrade::Automatic-Reboot "false";' >> /etc/apt/apt.conf.d/20auto-upgrades
    
    # Secure shared memory
    echo 'tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0' >> /etc/fstab
    
    success "Security hardening completed"
}

# Main execution
main() {
    log "Starting Ubuntu server setup for JEVAL Frontend..."
    
    check_root
    update_system
    install_packages
    install_nvm
    install_docker
    install_docker_compose
    setup_firewall
    install_nginx
    setup_ssl
    setup_app_directories
    setup_monitoring
    create_systemd_service
    setup_fail2ban
    security_hardening
    
    success "Ubuntu server setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Reboot the server: sudo reboot"
    echo "2. Clone your frontend code to /application/jeval/frontend"
    echo "   Clone your backend code to /application/jeval/api"
    echo "3. Configure your domain and get SSL certificate: sudo certbot --nginx -d yourdomain.com"
    echo "4. Update environment variables in .env.production"
    echo "5. Run deployment script: ./scripts/deploy.sh"
    echo ""
    warning "Don't forget to configure your domain DNS to point to this server!"
}

# Execute main function
main "$@"