# 🖥️ Developer Machine Guides

คู่มือสำหรับเครื่อง Development (เครื่องนี้)

## 📁 ไฟล์ในโฟลเดอร์นี้

### 🔧 Development Setup

- **[development-setup.md](./development-setup.md)** - ตั้งค่าเครื่อง dev
- **[local-testing.md](./local-testing.md)** - ทดสอบบนเครื่อง dev
- **[docker-local.md](./docker-local.md)** - ใช้ Docker บนเครื่อง dev

### 🔄 Git Workflow  

- **[git-workflow.md](./git-workflow.md)** - การใช้ Git สำหรับ deployment
- **[code-review.md](./code-review.md)** - Code review process

### 🚀 Deployment From Dev

- **[push-to-deploy.md](./push-to-deploy.md)** - วิธี push code เพื่อ deploy
- **[monitoring-deployment.md](./monitoring-deployment.md)** - ตรวจสอบ deployment จากเครื่อง dev

---

## 🎯 สิ่งที่เครื่อง Dev ทำได้

✅ **Development & Testing**

- เขียนโค้ดและทดสอบ
- รัน `npm run dev`, `npm run build`, `npm run lint`
- ทดสอบ Docker locally
- รัน unit tests และ integration tests

✅ **Git Management**

- `git add`, `git commit`, `git push`
- สร้าง branches, merge, rebase
- ตรวจสอบ commit history

✅ **CI/CD Trigger**

- Push code เพื่อ trigger deployment
- Monitor GitHub Actions
- ดู deployment status

✅ **Documentation**

- อัปเดต documentation
- สร้าง README และ guides

---

## ⚠️ สิ่งที่เครื่อง Dev ไม่ควรทำ

❌ **Production Operations**

- ไม่ควร SSH เข้า production server โดยตรง
- ไม่ควรรัน production commands บนเครื่อง dev
- ไม่ควรแก้ไข production configs โดยตรง

❌ **Server Management**

- ไม่ควรติดตั้ง system packages บน production
- ไม่ควรจัดการ nginx, SSL certificates
- ไม่ควรแก้ไข firewall rules

---

## 🚀 Quick Start สำหรับ Developer

```bash
# 1. Setup development environment
npm install
npm run dev

# 2. Test your changes
npm run lint
npm run build
npm test

# 3. Deploy to production
git add .
git commit -m "Your changes"
git push origin main

# 4. Monitor deployment
# ดูที่ GitHub Actions หรือ webhook logs
```

---

**หมายเหตุ:** ไฟล์ทั้งหมดในโฟลเดอร์นี้เป็นคู่มือสำหรับการทำงานบนเครื่อง development เท่านั้น
