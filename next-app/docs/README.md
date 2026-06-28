# 📚 JEVAL Frontend Documentation

คู่มือการใช้งานและการ Deploy สำหรับ JEVAL Frontend Application

## 📁 โครงสร้าง Documentation

```
📂 docs/
├── 📂 dev-guides/          # คู่มือสำหรับเครื่อง Development
├── 📂 server-guides/       # คู่มือสำหรับเครื่อง Production Server
├── 📂 scripts-reference/   # คู่มืออ้างอิง Scripts
└── 📄 README.md           # ไฟล์นี้
```

## 🎯 เลือกคู่มือตามหน้าที่

### 🖥️ **สำหรับ Developer (เครื่อง Dev)**
คุณทำงานบนเครื่อง development และต้องการ deploy code:

👉 **[dev-guides/](./dev-guides/README.md)**
- การ setup environment
- การทดสอบ code
- วิธี push code เพื่อ deploy
- การ monitor deployment

### 🖥️ **สำหรับ DevOps/Admin (เครื่อง Server)**  
คุณดูแลเซิร์ฟเวอร์และระบบ production:

👉 **[server-guides/](./server-guides/README.md)**
- การติดตั้ง Ubuntu server
- การตั้งค่า deployment system
- การ monitor และ maintain
- การแก้ไขปัญหา

### 📜 **สำหรับทุกคน (Scripts Reference)**
ต้องการดู reference ของ scripts ทั้งหมด:

👉 **[scripts-reference/](./scripts-reference/README.md)**
- รายการ scripts ทั้งหมด
- วิธีใช้งานแต่ละ script
- ตัวอย่างการใช้งาน

## 🚀 Quick Start Guide

### สำหรับ Developer ที่เพิ่งเข้าโปรเจค

1. **Setup Development Environment**
   ```bash
   npm install
   npm run dev
   ```

2. **การ Deploy Code**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main  # Auto deploy!
   ```

3. **ดู Deploy Status**
   - ตรวจสอบใน GitHub Actions
   - หรือ SSH เข้า server ดู logs

### สำหรับ DevOps ที่ต้องตั้งค่า Server ใหม่

1. **Initial Server Setup**
   ```bash
   sudo ./scripts/setup-ubuntu.sh
   sudo reboot
   ```

2. **Application Setup**
   ```bash
   sudo ./scripts/setup-systemd.sh
   git clone <repo> /opt/jeval-frontend
   ```

3. **Enable Auto Deploy**
   ```bash
   sudo systemctl start jeval-webhook
   # ตั้งค่า GitHub webhook
   ```

## 📖 Core Documents

### 🔥 **หลักสูตรสำคัญ (Must Read)**

| Document | Audience | Purpose |
|----------|----------|---------|
| [STEP-BY-STEP-DEPLOY.md](../STEP-BY-STEP-DEPLOY.md) | ทุกคน | ขั้นตอนการ deploy แบบละเอียด |
| [DEVOPS-GUIDE.md](../DEVOPS-GUIDE.md) | DevOps | วิธีการ deploy ตามหลัก DevOps |
| [DEPLOYMENT-GUIDE.md](../DEPLOYMENT-GUIDE.md) | ทุกคน | คู่มือ deployment ฉบับสมบูรณ์ |

### 📋 **Technical References**

| Document | Purpose |
|----------|---------|
| [PRODUCTION-SETUP.md](../PRODUCTION-SETUP.md) | System requirements |
| [CLAUDE.md](../CLAUDE.md) | Project overview |
| [package.json](../package.json) | Dependencies และ scripts |

## 🏗️ Architecture Overview

```
🖥️ Dev Machine          🌐 GitHub          🖥️ Production Server
     │                      │                       │
     │ 1. git push          │                       │
     │─────────────────────▶│                       │
     │                      │ 2. webhook trigger    │
     │                      │──────────────────────▶│
     │                      │                       │ 3. git pull
     │                      │◀──────────────────────│
     │                      │                       │ 4. build & deploy
     │                      │                       │
     │ 5. deployment done   │◀──────────────────────│
     │◀─────────────────────┼───────────────────────┼
```

## 🛠️ Technology Stack

- **Frontend Framework:** Next.js 15.5.2
- **Runtime:** Node.js 20
- **Package Manager:** npm
- **Styling:** TailwindCSS v4
- **TypeScript:** Strict mode enabled
- **Deployment:** Docker + Docker Compose
- **Web Server:** Nginx (reverse proxy)
- **CI/CD:** GitHub Actions + Webhooks
- **Operating System:** Ubuntu Server 20.04+

## 📊 Deployment Methods Comparison

| Method | Complexity | Speed | Automation | Rollback | Best For |
|--------|------------|-------|------------|----------|----------|
| **Manual Git** | Low | Slow | ❌ | Manual | Development |
| **Webhook** | Medium | Fast | ✅ | Auto | Small Teams |
| **CI/CD Pipeline** | High | Very Fast | ✅ | Auto | Production |

## 🎯 Recommended Workflow

### 1. **Development Phase**
- Work on feature branches
- Test locally with `npm run dev`
- Create pull requests for review

### 2. **Testing Phase**  
- Merge to `main` branch
- Automated deployment to staging
- Manual testing on staging environment

### 3. **Production Phase**
- Deploy to production via webhook/CI/CD
- Monitor health checks
- Rollback if issues detected

## 🚨 Emergency Procedures

### Quick Rollback
```bash
# SSH to server
ssh deploy@your-server
cd /opt/jeval-frontend
./scripts/git-deploy.sh main production rollback
```

### Service Control
```bash
# Stop all services
jeval-stop

# Start all services
jeval-start

# Check status
jeval-status
```

### Health Checks
```bash
# Application health
curl https://yourdomain.com/api/health

# Server health  
./scripts/health-check.sh
```

## 📞 Getting Help

### 🐛 **Bug Reports และ Issues**
- Create issue ใน GitHub repository
- ใส่รายละเอียดข้อผิดพลาด
- แนบ error logs และ steps to reproduce

### 📖 **Documentation**
- อ่านคู่มือในโฟลเดอร์ที่เกี่ยวข้อง
- ตรวจสอบ FAQ ใน troubleshooting guides
- ดู examples ใน scripts-reference

### 🔧 **Technical Support**
- ดู logs: `journalctl -u jeval-webhook -f`
- ตรวจสอบ system: `jeval-status`
- Monitor resources: `htop`, `df -h`

## 📝 Contributing

### การแก้ไข Documentation
1. Edit ไฟล์ใน `docs/` directory
2. Test การเปลี่ยนแปลง
3. Create pull request
4. Review และ merge

### การเพิ่ม Features
1. อ่าน development guides
2. Create feature branch
3. Implement และ test
4. Update documentation
5. Create pull request

---

## 🏆 Success Indicators

✅ **Setup สำเร็จ:**
- Server รับ webhook ได้
- Code push → deploy อัตโนมัติ
- Health checks ผ่าน
- Website accessible ผ่าน HTTPS

✅ **Development Workflow ดี:**
- Push code → deploy ใน 2-5 นาที
- มี rollback strategy พร้อม
- Monitor และ alerting ทำงาน
- Documentation up-to-date

---

**🎉 พร้อมใช้งาน!** เลือกคู่มือที่เหมาะกับบทบาทของคุณและเริ่มต้นได้เลย