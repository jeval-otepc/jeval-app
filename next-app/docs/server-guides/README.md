# 🖥️ Production Server Guides

คู่มือสำหรับเครื่อง Production Server (Ubuntu)

## 📁 ไฟล์ในโฟลเดอร์นี้

### 🛠️ Server Setup (ทำครั้งเดียว)
- **[initial-setup.md](./initial-setup.md)** - ติดตั้งและตั้งค่า Ubuntu server
- **[system-configuration.md](./system-configuration.md)** - กำหนดค่าระบบ
- **[security-setup.md](./security-setup.md)** - ตั้งค่าความปลอดภัย

### 🚀 Deployment Setup
- **[deployment-setup.md](./deployment-setup.md)** - ตั้งค่าระบบ deployment
- **[webhook-configuration.md](./webhook-configuration.md)** - ตั้งค่า webhook
- **[ssl-certificates.md](./ssl-certificates.md)** - จัดการ SSL certificates

### 📊 Operations & Maintenance  
- **[server-maintenance.md](./server-maintenance.md)** - การดูแลรักษาเซิร์ฟเวอร์
- **[monitoring-setup.md](./monitoring-setup.md)** - ตั้งค่าระบบ monitoring
- **[backup-restore.md](./backup-restore.md)** - การสำรองข้อมูลและกู้คืน

### 🚨 Troubleshooting
- **[troubleshooting.md](./troubleshooting.md)** - แก้ไขปัญหาที่พบบ่อย
- **[emergency-procedures.md](./emergency-procedures.md)** - ขั้นตอนเฉุกเฉิน

---

## 🎯 สิ่งที่เครื่อง Server ต้องทำ

✅ **System Administration**
- ติดตั้ง Node.js, Docker, Nginx
- จัดการ firewall (UFW)
- ติดตั้ง SSL certificates
- ตั้งค่า system services

✅ **Application Deployment**
- Clone repository จาก GitHub
- Build และ run Docker containers
- จัดการ environment variables
- Monitor application health

✅ **Security & Maintenance**
- อัปเดต system packages
- จัดการ logs และ backups  
- Monitor system resources
- Handle security incidents

✅ **Networking & Web Server**
- กำหนดค่า Nginx reverse proxy
- จัดการ domain และ DNS
- ตั้งค่า load balancing (ถ้ามี)

---

## ⚠️ สิ่งที่เครื่อง Server ไม่ควรทำ

❌ **Development Activities**
- ไม่ควรใช้เป็นเครื่อง development
- ไม่ควรแก้ไขโค้ดโดยตรงบน server
- ไม่ควรติดตั้ง development tools

❌ **Manual Code Changes**
- ไม่ควรแก้ไขไฟล์โค้ดโดยตรง
- ไม่ควร commit changes จาก server
- ใช้ automated deployment เท่านั้น

---

## 🚀 Quick Commands for Server Admin

```bash
# System Status
jeval-status              # ดูสถานะ services
systemctl status nginx    # ดูสถานะ nginx
docker-compose ps         # ดูสถานะ containers

# Deployment
jeval-deploy              # Deploy manually
jeval-start               # Start services
jeval-stop                # Stop services

# Monitoring  
tail -f /var/log/jeval-frontend/deploy.log
journalctl -u jeval-webhook -f
docker-compose logs -f

# Maintenance
sudo apt update && sudo apt upgrade
docker system prune -f
certbot renew --dry-run
```

---

## 📋 Server Setup Checklist

### ✅ **Phase 1: System Setup**
- [ ] Run `setup-ubuntu.sh`
- [ ] Reboot server
- [ ] Verify all services running

### ✅ **Phase 2: Application Setup**  
- [ ] Clone repository
- [ ] Configure environment files
- [ ] Run initial deployment

### ✅ **Phase 3: Automation Setup**
- [ ] Setup webhook service
- [ ] Configure GitHub webhook
- [ ] Test automated deployment

### ✅ **Phase 4: Production Ready**
- [ ] Configure SSL certificates
- [ ] Setup monitoring
- [ ] Configure backups
- [ ] Document emergency procedures

---

**หมายเหตุ:** ไฟล์ทั้งหมดในโฟลเดอร์นี้เป็นคู่มือสำหรับการทำงานบนเครื่อง production server เท่านั้น