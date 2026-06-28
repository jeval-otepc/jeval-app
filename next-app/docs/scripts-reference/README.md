# 📜 Scripts Reference Guide

คู่มืออ้างอิงสำหรับ Scripts ทั้งหมด

## 📁 โครงสร้าง Scripts

### 🖥️ **Scripts สำหรับเครื่อง Dev**
```
📂 Development Scripts
├── package.json (npm scripts)
├── jest.config.js
├── next.config.ts
└── .github/workflows/deploy.yml (CI/CD)
```

### 🖥️ **Scripts สำหรับเครื่อง Server**
```  
📂 Production Scripts
├── scripts/setup-ubuntu.sh
├── scripts/setup-systemd.sh
├── scripts/deploy.sh
├── scripts/git-deploy.sh
├── scripts/webhook-server.js
└── scripts/health-check.sh
```

---

## 🔧 **Scripts Categories**

### 🛠️ **System Setup Scripts (ครั้งเดียว)**
| Script | Location | Purpose | Usage |
|--------|----------|---------|-------|
| `setup-ubuntu.sh` | Server | ติดตั้งระบบ Ubuntu | `sudo ./scripts/setup-ubuntu.sh` |
| `setup-systemd.sh` | Server | ติดตั้ง services | `sudo ./scripts/setup-systemd.sh` |

### 🚀 **Deployment Scripts**
| Script | Location | Purpose | Usage |
|--------|----------|---------|-------|
| `deploy.sh` | Server | Manual deployment | `./scripts/deploy.sh` |
| `git-deploy.sh` | Server | Git-based deployment | `./scripts/git-deploy.sh [branch] [env]` |
| `webhook-server.js` | Server | Auto deployment listener | `node scripts/webhook-server.js` |

### 📊 **Monitoring Scripts**
| Script | Location | Purpose | Usage |
|--------|----------|---------|-------|
| `health-check.sh` | Server | Health monitoring | `./scripts/health-check.sh` |

### 🔄 **CI/CD Scripts**
| Script | Location | Purpose | Usage |
|--------|----------|---------|-------|
| `deploy.yml` | GitHub Actions | Automated pipeline | Auto-triggered |

---

## 📋 **Detailed Scripts Reference**

### 1. **setup-ubuntu.sh** 🛠️
**Location:** Run on Ubuntu Server  
**Frequency:** Once only  
**Purpose:** Complete Ubuntu server setup

**What it does:**
- Install Node.js 20, Docker, Nginx
- Configure firewall (UFW)  
- Install SSL tools (Certbot)
- Setup security (fail2ban)
- Create directories and users

**Usage:**
```bash
# SSH to server first
ssh user@your-server
sudo ./scripts/setup-ubuntu.sh
sudo reboot
```

---

### 2. **setup-systemd.sh** 🔧
**Location:** Run on Ubuntu Server  
**Frequency:** Once only  
**Purpose:** Setup application services

**What it does:**
- Create application user
- Setup webhook service
- Create helper commands
- Configure log rotation

**Usage:**
```bash  
sudo ./scripts/setup-systemd.sh
```

**Creates these commands:**
- `jeval-start` - Start services
- `jeval-stop` - Stop services  
- `jeval-status` - Check status
- `jeval-deploy` - Manual deploy

---

### 3. **deploy.sh** 🚀
**Location:** Run on Ubuntu Server  
**Frequency:** As needed  
**Purpose:** Manual deployment with Docker

**What it does:**
- Create backup
- Stop old containers
- Build new images  
- Start new containers
- Health check
- Rollback on failure

**Usage:**
```bash
cd /opt/jeval-frontend
./scripts/deploy.sh
```

---

### 4. **git-deploy.sh** 🔄
**Location:** Run on Ubuntu Server  
**Frequency:** Automated or manual  
**Purpose:** Git-based deployment

**What it does:**
- Pull latest code from Git
- Install dependencies
- Build application
- Deploy with health checks
- Send notifications

**Usage:**
```bash
# Manual usage
./scripts/git-deploy.sh main production

# Automated usage (via webhook)
# Triggered automatically when code is pushed
```

**Parameters:**
- `branch` - Git branch to deploy (default: main)
- `environment` - Target environment (default: production)
- `action` - deploy/rollback/status (default: deploy)

---

### 5. **webhook-server.js** 🔗
**Location:** Run on Ubuntu Server  
**Frequency:** Always running as service  
**Purpose:** Listen for GitHub webhooks

**What it does:**
- Listen for GitHub push events
- Verify webhook signatures  
- Trigger automatic deployment
- Log all activities

**Usage:**
```bash
# Start as service (recommended)
sudo systemctl start jeval-webhook

# Or run directly for testing
cd /opt/jeval-frontend
node scripts/webhook-server.js
```

**Endpoints:**
- `POST /webhook` - Receive GitHub webhooks
- `GET /health` - Health check

---

### 6. **health-check.sh** 📊
**Location:** Run on Ubuntu Server  
**Frequency:** Every 5 minutes (cron)  
**Purpose:** Monitor application health

**What it does:**
- Check container status
- Test HTTP endpoints
- Monitor system resources
- Send alerts on issues
- Auto-restart on failure

**Usage:**
```bash
# Manual check
./scripts/health-check.sh

# Setup cron job
crontab -e
# Add: */5 * * * * /opt/jeval-frontend/scripts/health-check.sh
```

---

### 7. **GitHub Actions (deploy.yml)** ⚙️
**Location:** GitHub (triggered from dev machine)  
**Frequency:** On push to main branch  
**Purpose:** Full CI/CD pipeline

**What it does:**
- Run tests and linting
- Build Docker images
- Security scanning  
- Deploy to production
- Health verification

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch
- Pull request merge

---

## 🎯 **Quick Reference by Task**

### 🏗️ **First Time Setup**
```bash
# On Server:
sudo ./scripts/setup-ubuntu.sh      # System setup
sudo reboot                          # Restart
sudo ./scripts/setup-systemd.sh     # Services setup
```

### 🚀 **Manual Deployment**
```bash
# On Server:
cd /opt/jeval-frontend
git pull origin main                 # Get latest code
./scripts/deploy.sh                  # Deploy
```

### 🔄 **Automated Deployment**
```bash
# On Dev Machine:
git push origin main                 # Webhook triggers deployment

# On Server (automatic):
# webhook-server.js receives trigger
# git-deploy.sh runs automatically
```

### 📊 **Monitoring**
```bash
# On Server:
jeval-status                         # Quick status
./scripts/health-check.sh           # Detailed health check
journalctl -u jeval-webhook -f      # Webhook logs
docker-compose logs -f              # Container logs
```

### 🚨 **Emergency**
```bash  
# On Server:
jeval-stop                           # Stop all services
./scripts/git-deploy.sh main production rollback  # Rollback
jeval-start                          # Start services
```

---

## 📝 **Scripts Execution Summary**

| Phase | Dev Machine | Server | GitHub |
|-------|-------------|---------|---------|
| **Setup** | ❌ | `setup-ubuntu.sh`<br>`setup-systemd.sh` | ❌ |
| **Deploy** | `git push` | `deploy.sh`<br>`git-deploy.sh` | `deploy.yml` |
| **Monitor** | View logs | `health-check.sh`<br>`jeval-status` | Actions logs |
| **Maintain** | Update docs | System updates<br>Backups | ❌ |

**หมายเหตุ:** ไฟล์นี้เป็นคู่มืออ้างอิงเท่านั้น ดูรายละเอียดในโฟลเดอร์ `dev-guides/` และ `server-guides/`