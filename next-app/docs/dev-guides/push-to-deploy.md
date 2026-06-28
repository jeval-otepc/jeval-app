# 🚀 Push to Deploy Guide

คู่มือการ Deploy โดยการ Push Code จากเครื่อง Dev

## 🎯 Overview

หลังจากตั้งค่า automated deployment แล้ว คุณสามารถ deploy โดยการ push code ไปยัง GitHub ได้เลย

## 📋 Pre-requisites

✅ **ตรวจสอบก่อน Push:**
- [ ] Server ติดตั้งและตั้งค่าเรียบร้อยแล้ว
- [ ] Webhook service ทำงานอยู่บน server  
- [ ] GitHub webhook ตั้งค่าถูกต้องแล้ว
- [ ] Code ผ่าน tests และ linting แล้ว

## 🔄 Step-by-Step Deployment

### Step 1: เตรียม Code บนเครื่อง Dev

```bash
# ตรวจสอบสถานะ Git
git status

# ดู changes ที่จะ commit
git diff

# ตรวจสอบ TypeScript errors
npx tsc --noEmit

# รัน linter
npm run lint

# ทดสอบ build
npm run build

# รัน tests (ถ้ามี)
npm test
```

### Step 2: Commit Changes

```bash
# Add files to staging
git add .

# หรือ add specific files
git add src/components/NewComponent.tsx
git add src/pages/new-page.tsx

# Commit with descriptive message
git commit -m "Add new feature: user authentication

- Add login/logout components
- Implement JWT token handling  
- Update middleware for auth protection
- Add user context provider"
```

**💡 Tips สำหรับ Commit Messages:**
- ใช้ present tense ("Add" ไม่ใช่ "Added")
- เขียนสั้นๆ แต่ชัดเจน
- ใส่รายละเอียดเพิ่มเติมได้
- ใช้ conventional commits format

### Step 3: Push to GitHub

```bash
# Push to main branch (triggers deployment)
git push origin main

# ตรวจสอบว่า push สำเร็จ
git log --oneline -3
```

### Step 4: Monitor Deployment

#### 4.1 ตรวจสอบ GitHub Webhook
```bash
# ไปดูที่ GitHub Repository
# Settings → Webhooks → Recent Deliveries
# ควรเห็น delivery ใหม่พร้อม status 200
```

#### 4.2 ตรวจสอบ GitHub Actions (ถ้าใช้ CI/CD)
```bash
# ไปดูที่ GitHub Repository  
# Actions tab
# ควรเห็น workflow ใหม่ running/completed
```

#### 4.3 ตรวจสอบการ Deploy บน Server

**Option 1: SSH เข้า Server**
```bash
# SSH to server
ssh user@your-server-ip

# ดู webhook logs
sudo journalctl -u jeval-webhook -f

# ดู deployment logs  
tail -f /var/log/jeval-frontend/git-deploy.log

# ตรวจสอบสถานะ
jeval-status
```

**Option 2: Remote Health Check**
```bash
# ทดสอบจากเครื่อง dev (ไม่ต้อง SSH)
curl -I https://yourdomain.com
curl https://yourdomain.com/api/health
```

### Step 5: Verify Deployment

```bash
# ทดสอบ website
curl -I https://yourdomain.com

# ทดสอบ API health  
curl https://yourdomain.com/api/health

# ทดสอบ specific features
curl https://yourdomain.com/api/your-new-endpoint
```

## 🔍 Monitoring Deployment Progress

### Real-time Logs

**Webhook Activity:**
```bash
# SSH to server
sudo journalctl -u jeval-webhook -f
```

**Deployment Progress:**
```bash  
# SSH to server
tail -f /var/log/jeval-frontend/git-deploy.log
```

**Container Logs:**
```bash
# SSH to server
cd /opt/jeval-frontend
docker-compose logs -f
```

### Deployment Timeline

```
Push Code → GitHub → Webhook → Server → Deploy
   ↓           ↓         ↓         ↓         ↓
  30s        10s       5s       2-5min    30s
```

**Expected Timeline:**
- **0-30s:** Push to GitHub completes
- **30-40s:** GitHub webhook triggers
- **40-45s:** Server receives webhook
- **45s-5min:** Code pull, build, and deploy
- **5-6min:** Health check and verification

## 🚨 Troubleshooting

### ❌ Push แล้วไม่ Deploy

**1. ตรวจสอบ Webhook Status**
```bash
# SSH to server
sudo systemctl status jeval-webhook

# ถ้า service ไม่ทำงาน
sudo systemctl start jeval-webhook
```

**2. ตรวจสอบ GitHub Webhook**
- ไปที่ GitHub → Settings → Webhooks
- ดู Recent Deliveries
- ตรวจสอบ Response status

**3. ตรวจสอบ Webhook Logs**
```bash
sudo journalctl -u jeval-webhook -n 50
```

### ❌ Deployment ล้มเหลว

**1. ดู Error Logs**
```bash
tail -50 /var/log/jeval-frontend/git-deploy.log
```

**2. ตรวจสอบ Container Status**
```bash
cd /opt/jeval-frontend
docker-compose ps
docker-compose logs
```

**3. Manual Rollback**
```bash
./scripts/git-deploy.sh main production rollback
```

### ❌ Health Check ล้มเหลว

**1. ตรวจสอบ Application**
```bash
curl -v http://localhost:3000/api/health
```

**2. ตรวจสอบ Port และ Network**
```bash
sudo netstat -tlnp | grep :3000
sudo ss -tlnp | grep :3000
```

**3. ตรวจสอบ Nginx**
```bash
sudo nginx -t
sudo systemctl status nginx
```

## 🎛️ Advanced Deployment Options

### Deploy Specific Branch

```bash
# Deploy จาก branch อื่น (ต้องตั้งค่า webhook ให้รับ branch นั้น)
git checkout feature/new-feature
git push origin feature/new-feature
```

### Manual Trigger

```bash
# SSH to server แล้วรัน manual deployment
ssh user@your-server
cd /opt/jeval-frontend
./scripts/git-deploy.sh main production
```

### Deploy to Staging

```bash
# ถ้าตั้งค่า staging environment
git push origin staging
```

## 📊 Deployment Best Practices

### 🕐 Timing
- Deploy ในช่วงที่ traffic น้อย
- หลีกเลี่ยงเวลา peak hours
- แจ้ง users ก่อนถ้ามี downtime

### 🧪 Testing
- ทดสอบบน staging ก่อน production
- รัน automated tests ก่อน push
- Manual testing สำหรับ critical features

### 📝 Documentation  
- เขียน commit messages ที่ดี
- อัปเดต CHANGELOG
- แจ้ง team members เกี่ยวกับการเปลี่ยนแปลง

### 🔄 Rollback Strategy
- เก็บ backup ก่อน deploy
- มี rollback plan พร้อม
- ทดสอบ rollback procedure

## ✅ Deployment Checklist

**Pre-deployment:**
- [ ] Code review completed
- [ ] Tests passing
- [ ] No TypeScript/lint errors
- [ ] Environment variables updated (ถ้าจำเป็น)
- [ ] Database migrations ready (ถ้าจำเป็น)

**During deployment:**
- [ ] Push code to main branch
- [ ] Monitor webhook delivery
- [ ] Check deployment logs
- [ ] Verify health checks

**Post-deployment:**
- [ ] Test critical functionality  
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Notify team of completion

## 🏆 Success Indicators

✅ **Successful Deployment:**
- GitHub webhook shows 200 response
- Deployment logs show success message
- Health check returns 200 status
- Website loads correctly
- New features work as expected

🎉 **You're done!** Your code is now live in production!

---

**หมายเหตุ:** หลังจากตั้งค่า automated deployment แล้ว การ deploy จะง่ายมาก เพียงแค่ push code ไป GitHub!