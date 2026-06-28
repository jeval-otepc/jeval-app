# SSL Configuration Guide

## Overview

ระบบใช้ mixed protocol strategy เพื่อความปลอดภัยและประสิทธิภาพ:

- **HTTP**: สำหรับ Docker internal communication
- **HTTPS**: สำหรับ public domain access

## Protocol Usage

### ✅ HTTP (Docker Internal)

```bash
# Services ภายใน Docker network
http://jeval-strapi-app:1337      # Strapi backend
http://jeval-db:5432              # PostgreSQL database
http://localhost:3000             # Development frontend
```

**ข้อดี:**
- ไม่ต้องจัดการ SSL certificate ภายใน container
- การเชื่อมต่อเร็วกว่า (ไม่มี SSL handshake)
- ง่ายต่อการ debug และ development
- ปลอดภัยเพราะอยู่ใน isolated Docker network

### ✅ HTTPS (Public Domain)

```bash
# Public accessible services
https://jeval.otepc.go.th         # Production frontend
https://jeval.otepc.go.th/admin   # Production Strapi
```

**ข้อดี:**
- ความปลอดภัยสำหรับ public internet
- SEO และ browser security compliance
- Data encryption in transit
- Trust และ credibility สำหรับผู้ใช้

## SSL Certificate Management

### Production Setup

#### Nginx Reverse Proxy (Recommended)
```nginx
# /etc/nginx/sites-available/jeval.otepc.go.th
server {
    listen 443 ssl http2;
    server_name jeval.otepc.go.th;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Frontend (Next.js)
    location / {
        proxy_pass http://jeval-app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Strapi Admin & API
    location /admin {
        proxy_pass http://jeval-strapi-app:1337;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name jeval.otepc.go.th;
    return 301 https://$server_name$request_uri;
}
```

#### Cloudflare (Alternative)
```bash
# If using Cloudflare as SSL proxy
# Set Cloudflare SSL mode to "Full" or "Full (strict)"
# Point DNS A record to your server IP
# Cloudflare handles SSL termination automatically
```

### Development Setup

```yaml
# docker-compose.yml
version: '3.8'
services:
  jeval-app:
    build: .
    ports:
      - "3000:3000"    # HTTP for development
    environment:
      - NODE_ENV=development
      - NEXTAUTH_URL=http://localhost:3000

  jeval-strapi-app:
    image: strapi:latest
    ports:
      - "1337:1337"    # HTTP for development
    environment:
      - NODE_ENV=development
```

## Environment Configuration

### Development (.env.local)
```bash
# All internal services use HTTP
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Internal Docker services
NEXT_PUBLIC_BACKEND_SERVICES_URL=http://jeval-strapi-app:1337
NEXT_PUBLIC_STRAPI_URL=http://jeval-strapi-app:1337
NEXTAUTH_URL=http://localhost:3000
```

### Production (.env.production)
```bash
# Public services use HTTPS
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Public domain with SSL
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://jeval.otepc.go.th/admin
NEXT_PUBLIC_STRAPI_URL=https://jeval.otepc.go.th/admin
NEXTAUTH_URL=https://jeval.otepc.go.th
```

## Security Considerations

### Docker Network Security
```bash
# Create isolated network
docker network create --internal jeval-internal

# Services communicate via internal network (HTTP is safe)
services:
  jeval-app:
    networks:
      - jeval-internal    # Internal communication
      - default          # External access via proxy

  jeval-strapi-app:
    networks:
      - jeval-internal    # Internal only

  jeval-db:
    networks:
      - jeval-internal    # Internal only
```

### Nginx Security Headers
```nginx
# Add security headers
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## Troubleshooting

### Common Issues

#### Mixed Content Errors
```javascript
// Fix: Ensure all external resources use HTTPS in production
const imageUrl = process.env.NODE_ENV === 'production'
  ? 'https://secure-cdn.com/image.jpg'
  : 'http://localhost:3000/image.jpg';
```

#### Certificate Verification
```bash
# Check SSL certificate
openssl s_client -connect jeval.otepc.go.th:443 -servername jeval.otepc.go.th

# Check certificate expiry
echo | openssl s_client -connect jeval.otepc.go.th:443 2>/dev/null | openssl x509 -noout -dates
```

#### Docker Internal Connectivity
```bash
# Test internal service connectivity
docker exec jeval-app curl -I http://jeval-strapi-app:1337/api/health

# Check DNS resolution
docker exec jeval-app nslookup jeval-strapi-app
```

## Best Practices

### 1. Protocol Selection
- ✅ **HTTP**: Docker internal communication
- ✅ **HTTPS**: Public internet access
- ❌ **Mixed**: Avoid HTTP public APIs in production

### 2. Certificate Management
- Use Let's Encrypt for free SSL certificates
- Set up automatic renewal
- Monitor certificate expiry

### 3. Network Architecture
```
Internet (HTTPS) → Nginx Proxy → Docker Network (HTTP)
```

### 4. Environment Variables
- Never hardcode protocols in source code
- Use environment-specific configuration
- Validate URLs in runtime

## Monitoring

### SSL Certificate Monitoring
```bash
# Add to crontab for certificate expiry alerts
0 6 * * * /usr/local/bin/ssl-check.sh jeval.otepc.go.th
```

### Health Checks
```bash
# Production health check (HTTPS)
curl -f https://jeval.otepc.go.th/api/health

# Development health check (HTTP)
curl -f http://localhost:3000/api/health
```