# Production Deployment Guide - JEVAL Frontend

คู่มือการ deploy แอปพลิเคชัน JEVAL Frontend ขึ้น Ubuntu server สำหรับ production environment

## ขั้นตอนการ Deploy

### 1. เตรียม Ubuntu Server

#### 1.1 รันสคริปต์ติดตั้งระบบ
```bash
# อัปโหลดโค้ดขึ้นเซิร์ฟเวอร์
git clone <your-repository-url> /opt/jeval-frontend
cd /opt/jeval-frontend

# รันสคริปต์ติดตั้งระบบ (ต้องใช้ sudo)
sudo ./scripts/setup-ubuntu.sh
```

#### 1.2 รีสตาร์ทเซิร์ฟเวอร์
```bash
sudo reboot
```

### 2. กำหนดค่า Environment สำหรับ Production

#### 2.1 แก้ไขไฟล์ environment
```bash
cd /opt/jeval-frontend
cp .env.production .env.local

# แก้ไขค่าต่างๆ ให้ตรงกับเซิร์ฟเวอร์ของคุณ
nano .env.local
```

#### 2.2 ค่าสำคัญที่ต้องปรับแต่ง
```bash
# เปลี่ยน URL ให้ตรงกับโดเมนของคุณ
NEXT_PUBLIC_STRAPI_URL=https://yourdomain.com
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com

# ตั้ง JWT Secret ที่ปลอดภัย
NEXT_PUBLIC_JWT_SECRET=your-super-secure-jwt-secret-256-bits

# ปิด debug mode
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_LOG_LEVEL=error
```

### 3. ตั้งค่า SSL Certificate

#### 3.1 ขออนุญาต SSL จาก Let's Encrypt
```bash
# เปลี่ยน yourdomain.com เป็นโดเมนจริงของคุณ
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# ตั้งค่าการต่ออายุอัตโนมัติ
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### 3.2 ปรับแต่ง Nginx Configuration
```bash
# แก้ไขไฟล์ nginx.conf
sudo nano /etc/nginx/sites-available/default

# หรือใช้ configuration ที่เตรียมไว้
sudo cp nginx/nginx.conf /etc/nginx/sites-available/jeval-frontend
sudo ln -sf /etc/nginx/sites-available/jeval-frontend /etc/nginx/sites-enabled/

# ทดสอบและ reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

### 4. Deploy แอปพลิเคชัน

#### 4.1 รันสคริปต์ deploy
```bash
cd /opt/jeval-frontend
./scripts/deploy.sh
```

#### 4.2 ตรวจสอบสถานะ
```bash
# ตรวจสอบ containers
docker-compose ps

# ดู logs
docker-compose logs -f

# ทดสอบการเชื่อมต่อ
curl -I http://localhost:3000
curl -I https://yourdomain.com
```

### 5. ตั้งค่า Monitoring และ Health Check

#### 5.1 เพิ่ม cron job สำหรับ health check
```bash
# เปิด crontab
crontab -e

# เพิ่มบรรทัดนี้ (รันทุก 5 นาที)
*/5 * * * * /opt/jeval-frontend/scripts/health-check.sh

# สำหรับ backup (รันทุกวันเวลา 2:00 น.)
0 2 * * * /opt/jeval-frontend/scripts/backup.sh
```

#### 5.2 ตั้งค่าการแจ้งเตือน
```bash
# แก้ไขไฟล์ health-check.sh
nano scripts/health-check.sh

# กำหนดอีเมลและ Slack webhook (ถ้ามี)
ALERT_EMAIL="your-admin@domain.com"
SLACK_WEBHOOK_URL="your-slack-webhook-url"
```

## การจัดการและ Maintenance

### การ Update Application

#### 1. Pull โค้ดใหม่
```bash
cd /opt/jeval-frontend
git pull origin main
```

#### 2. Update dependencies (ถ้ามีการเปลี่ยนแปลง)
```bash
npm install
```

#### 3. Rebuild และ redeploy
```bash
./scripts/deploy.sh
```

### การ Backup

#### Manual backup
```bash
# สร้าง backup ด้วยตนเอง
sudo tar -czf /var/backups/jeval-frontend/manual_backup_$(date +%Y%m%d_%H%M%S).tar.gz -C /opt jeval-frontend
```

#### Restore จาก backup
```bash
# หยุดเซอร์วิส
docker-compose down

# Restore ไฟล์
sudo tar -xzf /var/backups/jeval-frontend/backup_file.tar.gz -C /opt

# เริ่มเซอร์วิสใหม่
docker-compose up -d
```

### การแก้ไขปัญหา

#### Container ไม่ทำงาน
```bash
# ตรวจสอบสถานะ
docker-compose ps

# ดู logs
docker-compose logs jeval-frontend

# Restart containers
docker-compose restart
```

#### เว็บไซต์ไม่เปิด
```bash
# ตรวจสอบ nginx
sudo systemctl status nginx
sudo nginx -t

# ตรวจสอบ firewall
sudo ufw status

# ตรวจสอบ SSL certificate
sudo certbot certificates
```

#### Performance ช้า
```bash
# ตรวจสอบ resource usage
htop
df -h
free -h

# ตรวจสอบ logs
docker-compose logs --tail=100 jeval-frontend
```

## Best Practices

### ความปลอดภัย
1. เปลี่ยน default passwords ทั้งหมด
2. ใช้ strong JWT secrets
3. อัปเดท system packages เป็นประจำ
4. Monitor logs สำหรับ suspicious activities
5. ใช้ fail2ban เพื่อป้องกัน brute force attacks

### Performance
1. ใช้ CDN สำหรับ static files
2. ตั้งค่า proper caching headers
3. Monitor และ optimize database queries
4. ใช้ HTTP/2 และ compression
5. Regular cleanup logs และ temporary files

### Monitoring
1. ตั้งค่า alerting สำหรับ downtime
2. Monitor disk space และ memory usage
3. Track application errors และ performance metrics
4. Regular health checks
5. Log rotation เพื่อป้องกัน disk full

## การติดต่อและ Support

หากพบปัญหาในการ deploy:

1. ตรวจสอบ logs ที่ `/var/log/jeval-frontend/`
2. ดู status ของ services: `systemctl status nginx docker`
3. ตรวจสอบ network connectivity: `curl -I localhost:3000`
4. ตรวจสอบ disk space: `df -h`

## Checklist สำหรับ Production Deployment

### ก่อน Deploy
- [ ] Ubuntu server พร้อมใช้งาน (20.04+ LTS)
- [ ] Domain name ชี้ไปยัง server IP
- [ ] SSH access ทำงานปกติ
- [ ] Backup strategy กำหนดแล้ว

### ระหว่าง Setup
- [ ] รัน `setup-ubuntu.sh` สำเร็จ
- [ ] Docker และ Docker Compose ติดตั้งแล้ว
- [ ] Nginx ติดตั้งและทำงานปกติ
- [ ] SSL certificate ได้รับแล้ว
- [ ] Firewall กำหนดค่าแล้ว

### หลัง Deploy
- [ ] Application ทำงานปกติ (HTTP 200)
- [ ] SSL/HTTPS ทำงานปกติ
- [ ] Health check scripts ทำงาน
- [ ] Monitoring และ alerting ตั้งค่าแล้ว
- [ ] Backup schedule กำหนดแล้ว
- [ ] Documentation อัปเดตแล้ว

---

**หมายเหตุ**: คู่มือนี้เขียนสำหรับ Ubuntu Server 20.04+ LTS เป็นหลัก หากใช้ OS อื่นอาจต้องปรับแต่งคำสั่งบางส่วน