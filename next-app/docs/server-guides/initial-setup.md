# 🛠️ Initial Server Setup Guide

คู่มือการติดตั้งและตั้งค่า Ubuntu Server ครั้งแรก

## 🎯 Overview

คู่มือนี้จะพาคุณติดตั้งระบบบน Ubuntu Server ตั้งแต่ต้นจนพร้อม deploy application

## 📋 Pre-requisites

### Server Requirements
- **OS:** Ubuntu Server 20.04 LTS หรือ 22.04 LTS
- **CPU:** 2 cores ขึ้นไป (4 cores แนะนำ)
- **RAM:** 4GB ขึ้นไป (8GB แนะนำ)
- **Storage:** 20GB ว่างขึ้นไป (SSD แนะนำ)
- **Network:** Public IP address
- **Domain:** Domain name pointing to server IP

### Access Requirements
- SSH access เป็น root หรือ user ที่มี sudo
- Basic Linux command line knowledge

## 🚀 Step-by-Step Setup

### Step 1: เข้าถึง Server

```bash
# SSH เข้า server
ssh root@your-server-ip
# หรือ
ssh username@your-server-ip
```

### Step 2: อัปเดตระบบ

```bash
# อัปเดต package list
sudo apt update

# อัปเกรดระบบ
sudo apt upgrade -y

# ติดตั้ง essential tools
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 3: สร้าง User สำหรับ Application

```bash
# สร้าง user สำหรับ deploy (ถ้ายังไม่มี)
sudo adduser deploy

# เพิ่ม sudo privileges
sudo usermod -aG sudo deploy

# Switch เป็น deploy user
sudo su - deploy
```

### Step 4: ดาวน์โหลดและเตรียม Scripts

```bash
# Clone repository หรือดาวน์โหลด scripts
git clone https://github.com/jeval-otepc/jeval-app.git /tmp/jeval-setup
cd /tmp/jeval-setup

# หรือดาวน์โหลด script โดยตรง
wget https://raw.githubusercontent.com/jeval-otepc/jeval-app/main/scripts/setup-ubuntu.sh
chmod +x setup-ubuntu.sh
```

### Step 5: รัน System Setup Script

```bash
# รัน Ubuntu setup script
sudo ./scripts/setup-ubuntu.sh
```

**Script นี้จะทำการติดตั้ง:**

#### 5.1 Node.js และ npm
- Node.js 20.x LTS
- npm latest version
- Global npm packages

#### 5.2 Docker และ Docker Compose
- Docker CE latest
- Docker Compose V2
- เพิ่ม user เข้า docker group

#### 5.3 Nginx Web Server
- Nginx latest stable
- Basic configuration
- ตั้งค่า sites-available/sites-enabled

#### 5.4 Security Tools
- UFW (Uncomplicated Firewall)
- Fail2ban (intrusion prevention)
- SSL tools (Certbot)

#### 5.5 System Tools
- htop, iotop, nload (monitoring)
- logrotate configuration
- Backup directories

### Step 6: รีสตาร์ทเซิร์ฟเวอร์

```bash
# รีสตาร์ทเพื่อให้การตั้งค่าทั้งหมดมีผล
sudo reboot
```

### Step 7: ตรวจสอบการติดตั้ง

```bash
# SSH กลับเข้าไปหลัง reboot
ssh deploy@your-server-ip

# ตรวจสอบ Node.js
node --version
npm --version

# ตรวจสอบ Docker
docker --version
docker-compose --version
docker ps

# ตรวจสอบ Nginx
sudo systemctl status nginx
curl -I http://localhost

# ตรวจสอบ Firewall
sudo ufw status
```

## 🔧 Manual Configuration (ถ้าไม่ใช้ Script)

### ติดตั้ง Node.js

```bash
# ติดตั้ง NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# ติดตั้ง Node.js
sudo apt install -y nodejs

# ตรวจสอบเวอร์ชัน
node --version
npm --version
```

### ติดตั้ง Docker

```bash
# Remove old versions
sudo apt remove docker docker-engine docker.io containerd runc

# Add Docker's GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER
```

### ติดตั้ง Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### ตั้งค่า Firewall

```bash
# Enable UFW
sudo ufw enable

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow application ports
sudo ufw allow 3000/tcp  # Next.js
sudo ufw allow 1337/tcp  # Strapi (if needed)

# Check status
sudo ufw status
```

## 📁 Directory Structure Setup

```bash
# Create application directories
sudo mkdir -p /opt/jeval-frontend
sudo mkdir -p /var/log/jeval-frontend  
sudo mkdir -p /var/backups/jeval-frontend

# Set ownership
sudo chown deploy:deploy /opt/jeval-frontend
sudo chown deploy:deploy /var/log/jeval-frontend
sudo chown deploy:deploy /var/backups/jeval-frontend

# Set permissions
sudo chmod 755 /opt/jeval-frontend
sudo chmod 755 /var/log/jeval-frontend
sudo chmod 755 /var/backups/jeval-frontend
```

## 🔒 Security Hardening

### SSH Security

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# Port 22 (or change to custom port)
# PermitRootLogin no
# PasswordAuthentication yes (change to 'no' after setting up keys)
# AllowUsers deploy

# Restart SSH
sudo systemctl restart ssh
```

### Setup SSH Keys (Recommended)

**On your local machine:**
```bash
# Generate SSH key pair (if not exists)
ssh-keygen -t rsa -b 4096 -C "your-email@domain.com"

# Copy public key to server
ssh-copy-id deploy@your-server-ip
```

**On server:**
```bash
# Disable password authentication after setting up keys
sudo nano /etc/ssh/sshd_config
# Change: PasswordAuthentication no
sudo systemctl restart ssh
```

### Setup Fail2ban

```bash
# Install fail2ban
sudo apt install -y fail2ban

# Create local configuration
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edit configuration
sudo nano /etc/fail2ban/jail.local

# Enable and start
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🌐 Domain และ DNS Setup

### DNS Configuration
ตั้งค่า DNS records ที่ domain provider:

```
Type: A Record
Name: @
Value: your-server-ip
TTL: 300

Type: A Record  
Name: www
Value: your-server-ip
TTL: 300
```

### SSL Certificate Setup

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run

# Setup auto-renewal
sudo systemctl enable certbot.timer
```

## ✅ Verification Checklist

### System Services
- [ ] Node.js และ npm ติดตั้งแล้ว
- [ ] Docker และ Docker Compose ใช้งานได้
- [ ] Nginx running และ accessible
- [ ] UFW firewall enabled และกำหนดค่าแล้ว
- [ ] Fail2ban running

### Network และ Security  
- [ ] SSH access ทำงานปกติ
- [ ] Domain pointing to server
- [ ] SSL certificate installed
- [ ] Ports 80, 443 accessible

### File System
- [ ] Application directories created
- [ ] Proper permissions set  
- [ ] Log rotation configured
- [ ] Backup directories ready

## 🚨 Troubleshooting

### Common Issues

**1. Package installation fails**
```bash
sudo apt update
sudo apt install -f
sudo dpkg --configure -a
```

**2. Docker permission denied**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

**3. Nginx fails to start**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo journalctl -u nginx
```

**4. UFW conflicts**
```bash
sudo ufw --force reset
sudo ufw enable
# Reconfigure rules
```

## 🎯 Next Steps

หลังจาก initial setup เสร็จแล้ว:

1. **Application Setup** - ไปที่ [deployment-setup.md](./deployment-setup.md)
2. **Webhook Configuration** - ไปที่ [webhook-configuration.md](./webhook-configuration.md)  
3. **SSL Setup** - ไปที่ [ssl-certificates.md](./ssl-certificates.md)
4. **Monitoring Setup** - ไปที่ [monitoring-setup.md](./monitoring-setup.md)

---

**หมายเหตุ:** การ setup ครั้งแรกอาจใช้เวลา 30-60 นาที ขึ้นอยู่กับความเร็วของ network และ server