# DevOps Deployment Guide

คู่มือการ Deploy ตามหลัก DevOps สำหรับ JEVAL Frontend Application

## 🚀 วิธีการ Deploy Code ขึ้น Server

### วิธีที่ 1: Git-based Deployment (เริ่มต้น)

#### 🔧 Manual Deployment
```bash
# บน production server
cd /opt/jeval-frontend
git pull origin main
./scripts/deploy.sh
```

#### ⚡ Automated Git Deployment
```bash
# ติดตั้งระบบ automated deployment
sudo ./scripts/setup-systemd.sh

# เริ่มใช้งาน webhook server
sudo systemctl start jeval-webhook

# ตั้งค่า GitHub webhook ไปที่:
# http://your-server:9000/webhook
```

### วิธีที่ 2: CI/CD Pipeline (แนะนำสำหรับ Production)

#### 🏗️ GitHub Actions Pipeline
```yaml
# ใช้ไฟล์ .github/workflows/deploy.yml ที่สร้างไว้แล้ว
# Pipeline จะทำงานอัตโนมัติเมื่อ push ไปยัง main branch
```

#### 📋 Pipeline Stages:
1. **Test & Build** - รัน tests และ build application
2. **Security Scan** - ตรวจสอบ vulnerabilities
3. **Build Docker Image** - สร้าง container image
4. **Deploy to Production** - deploy ขึ้น production server
5. **Health Check** - ตรวจสอบว่า application ทำงานปกติ

### วิธีที่ 3: Container Registry (สำหรับ Scale)

#### 🐳 Docker Registry Workflow
```bash
# Build image locally
docker build -t jeval-frontend:latest .

# Push to registry
docker push ghcr.io/jeval-otepc/jeval-app:latest

# Pull และ deploy บน server
docker pull ghcr.io/jeval-otepc/jeval-app:latest
docker-compose up -d
```

## 📊 เปรียบเทียบวิธีการ Deploy

| วิธีการ | ความซับซ้อน | เวลาที่ใช้ | ความปลอดภัย | Auto Rollback | เหมาะกับ |
|---------|------------|-----------|-------------|---------------|----------|
| Manual Git | ต่ำ | นาน | ปานกลาง | ❌ | Development |
| Git Webhook | ปานกลาง | เร็ว | ดี | ✅ | Small Team |
| CI/CD Pipeline | สูง | เร็วมาก | ดีมาก | ✅ | Production |
| Container Registry | สูง | เร็วมาก | ดีมาก | ✅ | Enterprise |

## 🛠️ ขั้นตอนการตั้งค่าแต่ละวิธี

### วิธีที่ 1: Setup Git Webhook

```bash
# 1. ติดตั้งระบบบน Ubuntu server
sudo ./scripts/setup-ubuntu.sh
sudo ./scripts/setup-systemd.sh

# 2. Clone repository
sudo -u jeval git clone https://github.com/jeval-otepc/jeval-app.git /opt/jeval-frontend

# 3. ตั้งค่า environment
cd /opt/jeval-frontend
sudo -u jeval cp .env.production .env.local

# 4. ตั้งค่า webhook secret
sudo nano /opt/jeval-frontend/.env.webhook
# แก้ไข WEBHOOK_SECRET

# 5. เริ่มใช้งาน services
sudo systemctl start jeval-webhook
sudo systemctl enable jeval-webhook

# 6. ตั้งค่า GitHub webhook
# ไปที่ GitHub Repository Settings → Webhooks
# Payload URL: http://your-server:9000/webhook
# Content type: application/json
# Secret: ใส่ค่าเดียวกับใน .env.webhook
# Events: Just the push event
```

### วิธีที่ 2: Setup CI/CD Pipeline

```bash
# 1. ตั้งค่า GitHub Secrets
# ไปที่ Repository Settings → Secrets and variables → Actions

# Required secrets:
DEPLOY_SSH_KEY=<private-ssh-key-for-server>
DEPLOY_USER=<username-on-server>
DEPLOY_HOST=<server-ip-or-domain>
STAGING_SSH_KEY=<private-ssh-key-for-staging>

# 2. ตั้งค่า GitHub Container Registry
# ให้สิทธิ์ GitHub Actions ใน Package settings

# 3. ปรับแต่ง workflow file
# แก้ไข .github/workflows/deploy.yml ให้ตรงกับ environment ของคุณ

# 4. Push code → Pipeline จะทำงานอัตโนมัติ
git push origin main
```

### วิธีที่ 3: Container Registry

```bash
# 1. ตั้งค่า GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USERNAME --password-stdin

# 2. Build และ push image
docker build -t ghcr.io/jeval-otepc/jeval-app:latest .
docker push ghcr.io/jeval-otepc/jeval-app:latest

# 3. Deploy บน server
# แก้ไข docker-compose.yml ให้ใช้ image จาก registry
```

## 🔄 Blue-Green Deployment

สำหรับ zero-downtime deployment:

```bash
# สร้าง blue-green deployment script
./scripts/blue-green-deploy.sh
```

## 📈 Monitoring และ Alerting

### Health Checks
```bash
# ตรวจสอบ application health
curl http://localhost:3000/api/health

# ตรวจสอบ services status
jeval-status

# ดู logs
journalctl -u jeval-webhook -f
docker-compose logs -f
```

### Automated Monitoring
```bash
# ตั้งค่า cron job สำหรับ health check
crontab -e

# เพิ่มบรรทัดนี้ (รันทุก 5 นาที)
*/5 * * * * /opt/jeval-frontend/scripts/health-check.sh
```

## 🔙 Rollback Procedures

### Quick Rollback
```bash
# วิธีที่ 1: ใช้ git
cd /opt/jeval-frontend
git checkout <previous-commit-hash>
./scripts/deploy.sh

# วิธีที่ 2: ใช้ backup
./scripts/git-deploy.sh main production rollback

# วิธีที่ 3: ใช้ Docker tags
docker-compose down
# แก้ไข docker-compose.yml ใช้ tag เก่า
docker-compose up -d
```

### Automated Rollback
```bash
# Rollback จะเกิดขึ้นอัตโนมัติถ้า health check ล้มเหลว
# ตามที่กำหนดไว้ใน deployment scripts
```

## 🔧 Helper Commands

```bash
# เริ่ม services
jeval-start

# หยุด services
jeval-stop

# ตรวจสอบสถานะ
jeval-status

# Deploy manual
jeval-deploy [branch] [environment]

# ดู logs
sudo journalctl -u jeval-webhook -f
sudo journalctl -u jeval-frontend -f
```

## 🚨 Troubleshooting

### ปัญหาที่พบบ่อย

#### 1. Webhook ไม่ทำงาน
```bash
# ตรวจสอบ service status
sudo systemctl status jeval-webhook

# ตรวจสอบ logs
sudo journalctl -u jeval-webhook -f

# ตรวจสอบ firewall
sudo ufw status | grep 9000
```

#### 2. Deployment ล้มเหลว
```bash
# ตรวจสอบ deployment logs
tail -f /var/log/jeval-frontend/git-deploy.log

# ตรวจสอบ Docker containers
docker-compose ps
docker-compose logs
```

#### 3. Health Check ล้มเหลว
```bash
# ตรวจสอบ application
curl -v http://localhost:3000/api/health

# ตรวจสอบ Docker networks
docker network ls
docker network inspect jeval-network
```

## 📝 Best Practices

### Security
- ใช้ SSH keys แทน passwords
- ตั้งค่า webhook secrets ที่แข็งแกร่ง
- ใช้ HTTPS สำหรับ webhooks
- อัปเดท dependencies เป็นประจำ

### Performance
- ใช้ Docker multi-stage builds
- ตั้งค่า proper caching
- Monitor resource usage
- ใช้ CDN สำหรับ static files

### Reliability
- ตั้งค่า automated backups
- มี rollback strategy
- ทดสอบ deployment process
- Monitor application health

### Scalability
- ใช้ container orchestration (Kubernetes)
- ตั้งค่า load balancing
- ใช้ microservices architecture
- Implement horizontal scaling

## 🎯 Recommended Approach

**สำหรับทีมเล็ก (1-5 คน):**
- ใช้ Git Webhook deployment
- ตั้งค่า automated health checks
- มี basic rollback procedure

**สำหรับทีมกลาง (5-20 คน):**
- ใช้ CI/CD Pipeline (GitHub Actions)
- ตั้งค่า staging environment
- ใช้ automated testing

**สำหรับองค์กรใหญ่ (20+ คน):**
- ใช้ Container Registry + Kubernetes
- ตั้งค่า multiple environments
- ใช้ advanced monitoring และ alerting
- มี comprehensive testing strategy