# Ubuntu Server Setup Requirements

## System Requirements

### Minimum Hardware Requirements
- **CPU**: 2 cores (4 recommended)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 20GB available disk space (SSD recommended)
- **Network**: Stable internet connection with public IP

### Operating System
- **Ubuntu Server**: 20.04 LTS or 22.04 LTS
- **Architecture**: x86_64 (AMD64)

## Software Dependencies

### Core Requirements
- **Node.js**: 20.x LTS
- **npm**: Latest version
- **Docker**: 24.x or later
- **Docker Compose**: 2.x or later
- **Nginx**: Latest stable
- **Git**: For code deployment
- **Curl/Wget**: For downloads and health checks

### Security Components
- **UFW**: Firewall management
- **Fail2ban**: Intrusion prevention
- **SSL/TLS**: Let's Encrypt via Certbot
- **Logrotate**: Log management

### Monitoring Tools
- **htop**: Process monitoring
- **iotop**: I/O monitoring  
- **nload**: Network monitoring

## Network Configuration

### Required Ports
- **22**: SSH access
- **80**: HTTP (redirects to HTTPS)
- **443**: HTTPS
- **3000**: Frontend application (internal)
- **1337**: Backend API (internal)
- **5432**: PostgreSQL (internal only)

### DNS Requirements
- Domain name pointing to server IP
- A record: `yourdomain.com` → `SERVER_IP`
- Optional: CNAME record: `www.yourdomain.com` → `yourdomain.com`

## Directory Structure

```
/opt/jeval-frontend/          # Application files
├── app/                      # Next.js application
├── scripts/                  # Deployment scripts
├── nginx/                    # Nginx configuration
├── docker-compose.yml        # Container orchestration
├── .env.production          # Production environment
└── logs/                    # Application logs

/var/log/jeval-frontend/     # Log files
├── deploy.log              # Deployment logs
├── health-check.log        # Health monitoring logs
└── error.log               # Application errors

/var/backups/jeval-frontend/ # Backup storage
└── [dated-backups]/        # Timestamped backups

/etc/nginx/                 # Nginx configuration
├── sites-available/        # Available sites
├── sites-enabled/          # Enabled sites
└── ssl/                   # SSL certificates
```

## User Permissions

### Application User
- Create dedicated user: `jeval`
- Add to docker group
- Sudo privileges for deployment scripts

### File Permissions
```bash
# Application files
chown -R jeval:jeval /opt/jeval-frontend
chmod -R 755 /opt/jeval-frontend

# Scripts
chmod +x /opt/jeval-frontend/scripts/*.sh

# Log directories
chown -R jeval:adm /var/log/jeval-frontend
chmod -R 755 /var/log/jeval-frontend

# Nginx configuration
chown -R root:root /etc/nginx/
chmod 644 /etc/nginx/sites-available/*
```

## Environment Variables

### Required Production Variables
```bash
# Backend services
NEXT_PUBLIC_STRAPI_URL=https://yourdomain.com
STRAPI_API_TOKEN=your-secure-token

# Application settings  
NEXT_PUBLIC_APP_ENV=production
NODE_ENV=production

# Security
NEXT_PUBLIC_JWT_SECRET=your-very-secure-jwt-secret

# Monitoring
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

## Security Configuration

### Firewall Rules
```bash
# Basic rules
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp

# Internal services (optional)
ufw allow from 10.0.0.0/8 to any port 3000
ufw allow from 172.16.0.0/12 to any port 1337
ufw allow from 192.168.0.0/16 to any port 5432
```

### SSL/TLS Configuration
- Use Let's Encrypt for free SSL certificates
- Configure strong cipher suites
- Enable HSTS headers
- Set up automatic certificate renewal

### Fail2ban Rules
- SSH brute force protection
- Nginx bad bot protection
- HTTP authentication failures
- Rate limiting for API endpoints

## Backup Strategy

### What to Backup
- Application files (`/opt/jeval-frontend`)
- Database dumps
- Nginx configuration
- SSL certificates
- Environment files (encrypted)

### Backup Schedule
- **Daily**: Application files and database
- **Weekly**: Full system backup
- **Monthly**: Archive old backups

### Backup Locations
- Local: `/var/backups/jeval-frontend/`
- Remote: Cloud storage (S3, Google Cloud, etc.)

## Monitoring Requirements

### Health Checks
- HTTP endpoint monitoring
- Container status monitoring
- Resource usage monitoring
- Log analysis for errors

### Alerting
- Email notifications for critical issues
- Slack/Discord webhook integration (optional)
- SMS alerts for severe outages (optional)

### Metrics to Monitor
- **Response Time**: < 2 seconds average
- **Uptime**: > 99.5%
- **CPU Usage**: < 80% sustained
- **Memory Usage**: < 90%
- **Disk Usage**: < 85%
- **Error Rate**: < 1% of requests

## Performance Optimization

### Nginx Optimizations
- Gzip compression enabled
- Static file caching
- Connection pooling
- Rate limiting

### Docker Optimizations
- Multi-stage builds
- Minimal base images
- Resource limits
- Health checks

### Application Optimizations
- Next.js production build
- Image optimization
- Code splitting
- CDN integration (optional)

## Maintenance Requirements

### Regular Tasks
- **Daily**: Check health status
- **Weekly**: Review logs and metrics
- **Monthly**: Update system packages
- **Quarterly**: Security audit

### Update Procedures
1. Test updates in staging environment
2. Create backup before updates
3. Schedule maintenance window
4. Apply updates with rollback plan
5. Verify system functionality

## Disaster Recovery

### Recovery Procedures
1. Assess damage and data loss
2. Restore from latest backup
3. Verify data integrity
4. Test all functionality
5. Update DNS if IP changed

### RTO/RPO Targets
- **RTO** (Recovery Time Objective): < 4 hours
- **RPO** (Recovery Point Objective): < 24 hours

## Troubleshooting Common Issues

### Container Issues
```bash
# Check container status
docker-compose ps

# View container logs
docker-compose logs -f

# Restart containers
docker-compose restart
```

### Network Issues
```bash
# Check port availability
netstat -tlnp | grep :3000

# Test internal connectivity
curl -I http://localhost:3000
```

### Performance Issues
```bash
# Monitor resources
htop
iotop
nload

# Check disk space
df -h

# Check memory usage
free -h
```