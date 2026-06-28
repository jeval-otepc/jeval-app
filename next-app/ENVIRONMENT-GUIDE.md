# Environment Configuration Guide

## ภาพรวม (Overview)

ระบบได้รับการปรับปรุงให้สามารถเปลี่ยน Backend URL โดยอัตโนมัติตาม environment mode:

- **Development Mode**: ใช้ `http://jeval-strapi-app:1337` (Docker internal - HTTP)
- **Production Mode**: ใช้ `https://jeval.otepc.go.th/admin` (Public domain - HTTPS with SSL)

## HTTP/HTTPS Strategy

### 🐳 Docker Internal Services (HTTP)
- ใช้ `http://` สำหรับ communication ภายใน Docker network
- ไม่ต้อง SSL certificate ภายใน container network
- เร็วกว่าและง่ายต่อการ debug

### 🌐 Public Domain Services (HTTPS)
- ใช้ `https://` สำหรับ public domain access
- SSL Certificate ถูกจัดการโดย reverse proxy (nginx/cloudflare)
- ความปลอดภัยสำหรับ production environment

## การตั้งค่า Environment Files

### 1. Development (.env.local)
```bash
# สำหรับ Development Mode
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development

# Backend URLs (Development)
NEXT_PUBLIC_BACKEND_SERVICES_URL=http://jeval-strapi-app:1337
NEXT_PUBLIC_BACKEND_SERVICES_API_URL=http://jeval-strapi-app:1337/api
NEXT_PUBLIC_BACKEND_SERVICES_DEV_URL=http://jeval-strapi-app:1337

# Strapi Admin URL (if different)
NEXT_PUBLIC_STRAPI_URL=http://jeval-strapi-app:1337
```

### 2. Production (.env.production)
```bash
# สำหรับ Production Mode
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# Backend URLs (Production - OTEPC with /admin sub-path)
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://jeval.otepc.go.th/admin
NEXT_PUBLIC_BACKEND_SERVICES_API_URL=https://jeval.otepc.go.th/admin/api
NEXT_PUBLIC_BACKEND_SERVICES_PROD_URL=https://jeval.otepc.go.th/admin

# Strapi URLs
NEXT_PUBLIC_STRAPI_URL=https://jeval.otepc.go.th/admin
NEXT_PUBLIC_STRAPI_ADMIN_URL=https://jeval.otepc.go.th/admin

# Security Settings
NEXTAUTH_URL=https://jeval.otepc.go.th
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

## การใช้งาน

### Development Mode
```bash
# Local development
npm run dev

# หรือ Docker development
docker-compose up -d
```

### Production Mode
```bash
# Build for production
npm run build

# Start production server
npm start

# หรือ Docker production
NODE_ENV=production docker-compose up -d
```

## Environment Detection Logic

ระบบจะตรวจสอบ environment ตามลำดับ:

1. **NODE_ENV** environment variable
2. **NEXT_PUBLIC_APP_ENV** configuration
3. **Auto-detection** จาก build context

### URL Selection Priority:

#### Development Mode:
```
http://jeval-strapi-app:1337  # Docker container name
↓
http://localhost:1337         # Fallback
```

#### Production Mode:
```
https://jeval.otepc.go.th/admin      # OTEPC Official with /admin sub-path
https://jeval.otepc.go.th/admin/api  # API Endpoint
↓
Environment variables                # Custom override
```

## API Usage Examples

### ในโค้ด Application

```typescript
import { config } from '@/lib/config';

// Auto-detect environment and use appropriate URL
const apiUrl = config.getBackendServicesUrl(); // จะเลือก URL ตาม environment อัตโนมัติ
const apiEndpoint = config.getApiUrl();        // จะเพิ่ม /api ให้อัตโนมัติ

// Environment checks
if (config.isProduction()) {
  // Production-specific code
  console.log('Running in production mode');
} else if (config.isDevelopment()) {
  // Development-specific code
  console.log('Running in development mode');
}
```

### API Service Usage

```typescript
import { ApiService } from '@/lib/api';

// API service จะใช้ URL ที่ถูกต้องตาม environment อัตโนมัติ
const users = await ApiService.getCurrentUser();
const forms = await ApiService.getForms();
```

## Troubleshooting

### 1. ตรวจสอบ Environment
```javascript
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('App Environment:', config.app.env);
console.log('Backend URL:', config.getBackendServicesUrl());
console.log('Is Production:', config.isProduction());
```

### 2. Override URL (หากจำเป็น)
```bash
# ใน .env.local หรือ .env.production
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://custom-url.com
```

### 3. Docker Network Issues
```bash
# ตรวจสอบ container networks
docker network ls
docker inspect jeval-network

# ตรวจสอบ container connectivity
docker exec jeval-app curl http://jeval-strapi-app:1337/api/health
```

## การ Deploy

### Development Deploy
```bash
# ใช้ Docker Compose กับ development configuration
docker-compose up -d

# หรือ manual
NODE_ENV=development npm run build
npm start
```

### Production Deploy
```bash
# สร้าง production build
NODE_ENV=production npm run build

# Start production server
NODE_ENV=production npm start

# หรือ Docker production
NODE_ENV=production docker-compose -f docker-compose.prod.yml up -d
```

## สรุป

✅ **Development**: ใช้ `http://jeval-strapi-app:1337` (Docker internal)
✅ **Production**: ใช้ `https://jeval.otepc.go.th/admin` (OTEPC Official with /admin sub-path)
✅ **API Endpoints**:
   - Development: `http://jeval-strapi-app:1337/api`
   - Production: `https://jeval.otepc.go.th/admin/api`
✅ **Auto-Detection**: ระบบเลือก URL อัตโนมัติตาม `NODE_ENV`
✅ **Configurable**: สามารถ override ด้วย environment variables
✅ **Type-Safe**: TypeScript support เต็มรูปแบบ

## URL Structure

### Production URLs:
- **Strapi Admin Panel**: `https://jeval.otepc.go.th/admin`
- **Strapi API Endpoint**: `https://jeval.otepc.go.th/admin/api`
- **Frontend App**: `https://jeval.otepc.go.th`

### Development URLs (Docker Internal - HTTP):
- **Strapi Admin Panel**: `http://jeval-strapi-app:1337/admin`
- **Strapi API Endpoint**: `http://jeval-strapi-app:1337/api`
- **Frontend App**: `http://localhost:3000`

## Protocol Selection Logic

ระบบใช้ protocol ตามกฎเกณฑ์ดังนี้:

### Internal Docker Services → HTTP
```
jeval-strapi-app:1337          # HTTP (internal network)
localhost:3000                 # HTTP (development)
localhost:5432                 # HTTP (database)
```

### Public Domains → HTTPS
```
jeval.otepc.go.th             # HTTPS (with SSL)
staging.jeval.otepc.go.th     # HTTPS (with SSL)
```

### Environment Variable Examples

#### Development (.env.local)
```bash
# Docker internal services - use HTTP
NEXT_PUBLIC_BACKEND_SERVICES_URL=http://jeval-strapi-app:1337
NEXTAUTH_URL=http://localhost:3000
```

#### Production (.env.production)
```bash
# Public domain - use HTTPS
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://jeval.otepc.go.th/admin
NEXTAUTH_URL=https://jeval.otepc.go.th
```