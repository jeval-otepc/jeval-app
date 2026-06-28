# 🚀 ขั้นตอนการ Deploy แบบละเอียด

## 📍 แบ่ง Scripts ตาม Location

### 🖥️ **เครื่อง Dev (เครื่องนี้)**
ไฟล์ที่ทำงานบนเครื่อง development:

```
📂 เครื่อง Dev
├── 🔨 Development & Testing
│   ├── package.json (npm scripts)
│   ├── jest.config.js (testing)
│   └── next.config.ts (build config)
│
├── 🐳 Docker Testing (optional)
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── .dockerignore
│
├── 🔄 Git Management
│   ├── .gitignore
│   └── Git commands
│
└── 📋 Documentation
    ├── DEPLOYMENT-GUIDE.md
    ├── DEVOPS-GUIDE.md
    └── STEP-BY-STEP-DEPLOY.md
```

### 🖥️ **เครื่อง Server (Ubuntu)**
Scripts ที่ต้องรันบน production server:

```
📂 เครื่อง Server
├── 🛠️ System Setup (รันครั้งเดียว)
│   ├── scripts/setup-ubuntu.sh
│   └── scripts/setup-systemd.sh
│
├── 🚀 Deployment Scripts
│   ├── scripts/deploy.sh
│   ├── scripts/git-deploy.sh
│   └── scripts/webhook-server.js
│
├── 📊 Monitoring & Health
│   └── scripts/health-check.sh
│
├── 🌐 Web Server Config
│   └── nginx/nginx.conf
│
└── 🔧 Environment Config
    └── .env.production
```

---

## 📋 **PART 1: เตรียมเครื่อง Dev**

### ขั้นตอนที่ 1.1: ตรวจสอบโค้ดและ Build
```bash
# รันบนเครื่อง Dev
cd /path/to/your/project

# ตรวจสอบ TypeScript
npx tsc --noEmit

# รัน linter
npm run lint

# ทดสอบ build
npm run build

# ทดสอบรัน production mode (optional)
npm start
```

### ขั้นตอนที่ 1.2: ทดสอบ Docker (Optional)
```bash
# รันบนเครื่อง Dev
# ทดสอบ Docker build
docker build -t jeval-frontend-test .

# ทดสอบรัน container
docker run -p 3000:3000 jeval-frontend-test

# ทดสอบ docker-compose
docker-compose up --build
```

### ขั้นตอนที่ 1.3: Push Code ไป Git
```bash
# รันบนเครื่อง Dev
git add .
git commit -m "Ready for production deployment"
git push origin main
```

---

## 📋 **PART 2: เตรียมเครื่อง Server**

### ขั้นตอนที่ 2.1: Setup Ubuntu Server (ครั้งแรก)
```bash
# รันบนเครื่อง Server
# SSH เข้า server ก่อน
ssh user@your-server-ip

# ดาวน์โหลด setup script
wget https://raw.githubusercontent.com/jeval-otepc/jeval-app/main/scripts/setup-ubuntu.sh
chmod +x setup-ubuntu.sh

# รัน system setup (ต้องใช้ sudo)
sudo ./setup-ubuntu.sh
```

**Script นี้จะติดตั้ง:**
- Node.js 20
- Docker & Docker Compose
- Nginx
- Firewall (UFW)
- SSL (Certbot)
- Security tools (fail2ban)
- Monitoring tools

### ขั้นตอนที่ 2.2: รีสตาร์ทเซิร์ฟเวอร์
```bash
# รันบนเครื่อง Server
sudo reboot

# รอ server boot แล้ว SSH กลับเข้ามา
ssh user@your-server-ip
```

### ขั้นตอนที่ 2.3: Clone Repository
```bash
# รันบนเครื่อง Server
# สร้างโฟลเดอร์สำหรับ application
sudo mkdir -p /opt/jeval-frontend
sudo chown $USER:$USER /opt/jeval-frontend

# Clone repository จาก GitHub
git clone https://github.com/jeval-otepc/jeval-app.git /opt/jeval-frontend

# เข้าไปในโฟลเดอร์
cd /opt/jeval-frontend
```

---

## 📋 **PART 3: ตั้งค่าการ Deploy**

### ขั้นตอนที่ 3.1: Setup Automated Deployment
```bash
# รันบนเครื่อง Server
cd /opt/jeval-frontend

# ติดตั้ง systemd services สำหรับ automation
sudo ./scripts/setup-systemd.sh
```

**Script นี้จะสร้าง:**
- User สำหรับ application
- Webhook service
- Log rotation
- Helper commands (jeval-start, jeval-stop, jeval-status)

### ขั้นตอนที่ 3.2: ตั้งค่า Environment
```bash
# รันบนเครื่อง Server
cd /opt/jeval-frontend

# คัดลอก environment template
cp .env.production .env.local

# แก้ไขค่าต่างๆ
nano .env.local
```

**แก้ไขค่าเหล่านี้:**
```bash
NEXT_PUBLIC_STRAPI_URL=https://yourdomain.com
NEXT_PUBLIC_BACKEND_SERVICES_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_JWT_SECRET=your-super-secure-jwt-secret
```

### ขั้นตอนที่ 3.3: ตั้งค่า SSL Certificate
```bash
# รันบนเครื่อง Server
# ขอ SSL certificate จาก Let's Encrypt
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# ตั้งค่า auto-renewal
sudo systemctl enable certbot.timer
```

---

## 📋 **PART 4: Deploy แอปพลิเคชัน**

### ขั้นตอนที่ 4.1: Manual Deployment (ครั้งแรก)
```bash
# รันบนเครื่อง Server
cd /opt/jeval-frontend

# รัน deployment script
./scripts/deploy.sh
```

**Script นี้จะ:**
1. สร้าง backup
2. Build Docker images
3. Start containers
4. ตรวจสอบ health
5. ตั้งค่า monitoring

### ขั้นตอนที่ 4.2: ตรวจสอบการทำงาน
```bash
# รันบนเครื่อง Server
# ตรวจสอบ container status
docker-compose ps

# ตรวจสอบ logs
docker-compose logs -f

# ทดสอบ health check
curl http://localhost:3000/api/health

# ทดสอบผ่าน domain
curl https://yourdomain.com/api/health
```

---

## 📋 **PART 5: ตั้งค่า Automated Deployment**

### ขั้นตอนที่ 5.1: ตั้งค่า Webhook Secret
```bash
# รันบนเครื่อง Server
# แก้ไขไฟล์ webhook config
nano /opt/jeval-frontend/.env.webhook

# เปลี่ยนค่า secret
WEBHOOK_SECRET=your-strong-webhook-secret-here
```

### ขั้นตอนที่ 5.2: เริ่ม Webhook Service
```bash
# รันบนเครื่อง Server
# เริ่ม webhook service
sudo systemctl start jeval-webhook
sudo systemctl enable jeval-webhook

# ตรวจสอบสถานะ
sudo systemctl status jeval-webhook
```

### ขั้นตอนที่ 5.3: ตั้งค่า GitHub Webhook
```bash
# ทำบนเว็บ GitHub (ใช้เบราว์เซอร์บนเครื่อง Dev หรือเครื่องไหนก็ได้)
```

**ไปที่ GitHub Repository:**
1. Settings → Webhooks → Add webhook
2. **Payload URL:** `http://your-server-ip:9000/webhook`
3. **Content type:** `application/json`
4. **Secret:** ใส่ค่าเดียวกับใน `.env.webhook`
5. **Events:** Just the push event
6. **Active:** ✅

---

## 📋 **PART 6: ทดสอบ Automated Deployment**

### ขั้นตอนที่ 6.1: ทดสอบจากเครื่อง Dev
```bash
# รันบนเครื่อง Dev
# แก้ไขไฟล์อะไรก็ได้
echo "// Test deployment" >> README.md

# Commit และ push
git add .
git commit -m "Test automated deployment"
git push origin main
```

### ขั้นตอนที่ 6.2: ตรวจสอบการ Deploy
```bash
# รันบนเครื่อง Server
# ดู webhook logs
sudo journalctl -u jeval-webhook -f

# ดู deployment logs
tail -f /var/log/jeval-frontend/git-deploy.log

# ตรวจสอบสถานะ
jeval-status
```

---

## 🔄 **Git Workflow ระหว่าง Dev และ Server**

### 📊 **Flow Diagram:**
```
เครื่อง Dev          GitHub          เครื่อง Server
    |                   |                    |
    | git push origin   |                    |
    |------------------>|                    |
    |                   |   webhook trigger  |
    |                   |------------------->|
    |                   |                    |
    |                   |   git pull origin  |
    |                   |<-------------------|
    |                   |                    |
    |                   |                    | build & deploy
    |                   |                    |
    |                   |   deployment done  |
    |<------------------------------------ |
```

### 📝 **Git Commands Usage:**

**บนเครื่อง Dev:**
```bash
git add .
git commit -m "message"
git push origin main        # ส่งโค้ดไป GitHub
```

**บนเครื่อง Server (อัตโนมัติผ่าน webhook):**
```bash
git fetch origin           # ดึงข้อมูลล่าสุด
git checkout main          # เปลี่ยนไป main branch
git pull origin main       # ดึงโค้ดล่าสุด
```

**Manual Git บน Server (ถ้าต้องการ):**
```bash
# SSH เข้า server
ssh user@your-server-ip

# ไปที่โฟลเดอร์ app
cd /opt/jeval-frontend

# Pull โค้ดล่าสุด
git pull origin main

# Deploy manually
./scripts/deploy.sh
```

---

## 🎯 **สรุปขั้นตอน**

### ✅ **เครื่อง Dev ทำได้:**
1. เขียนโค้ด, test, build
2. Git commit & push
3. Monitor deployment ผ่าน GitHub
4. ทดสอบ Docker locally

### ✅ **เครื่อง Server ต้องทำ:**
1. Setup Ubuntu (ครั้งเดียว)
2. Clone repository
3. ตั้งค่า environment
4. Deploy application
5. Monitor & maintain

### ✅ **GitHub ทำหน้าที่:**
1. เก็บ source code
2. ส่ง webhook ไป server เมื่อมี push
3. Trigger automated deployment

### 🚀 **หลังจากตั้งค่าเสร็จ:**
- Push code จากเครื่อง Dev → Deploy อัตโนมัติบน Server
- ไม่ต้อง SSH เข้า server ทุกครั้ง
- มี health check และ rollback อัตโนมัติ