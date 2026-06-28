# 🏗️ System Flow Process Diagram

แสดงการทำงานของระบบตั้งแต่การ deploy code จนถึงการทำงานของ services ทั้งหมด

## 🚀 Deployment Flow Process

```mermaid
graph TD
    A[👨‍💻 Developer<br/>เขียน Code] --> B[🔍 Local Testing<br/>npm run dev<br/>npm run build<br/>npm run lint]
    
    B --> C[📤 Git Push<br/>git push origin main]
    
    C --> D[🌐 GitHub Repository<br/>Code Updated]
    
    D --> E[🎯 Webhook Trigger<br/>GitHub → Server<br/>POST /webhook]
    
    E --> F[🖥️ Production Server<br/>Webhook Received]
    
    F --> G[📥 Git Pull<br/>git pull origin main]
    
    G --> H[📦 Install Dependencies<br/>npm ci]
    
    H --> I[🏗️ Build Application<br/>npm run build]
    
    I --> J[🐳 Docker Build<br/>docker-compose build]
    
    J --> K[🚀 Deploy Containers<br/>docker-compose up -d]
    
    K --> L[✅ Health Check<br/>curl /api/health]
    
    L --> M{🔍 Health Check Pass?}
    
    M -->|✅ Success| N[🎉 Deployment Complete<br/>Website Live]
    M -->|❌ Fail| O[🔄 Auto Rollback<br/>Previous Version]
    
    O --> P[📧 Send Alert<br/>Deployment Failed]
    N --> Q[📊 Monitoring Active<br/>Logs & Metrics]
```

## 🏛️ System Architecture Flow

```mermaid
graph TB
    subgraph "🌐 Internet"
        U[👥 Users]
        D[🌍 Domain<br/>yourdomain.com]
    end
    
    subgraph "🖥️ Production Server"
        subgraph "🔒 Nginx (Port 80/443)"
            N[Nginx<br/>Reverse Proxy<br/>SSL Termination]
        end
        
        subgraph "🐳 Docker Network"
            subgraph "Frontend Container"
                F[Next.js Frontend<br/>Port: 3000<br/>Node.js 20]
            end
            
            subgraph "Backend Container"
                B[Strapi Backend<br/>Port: 1337<br/>API Services]
            end
            
            subgraph "Database Container"
                DB[(PostgreSQL<br/>Port: 5432<br/>Data Storage)]
            end
        end
        
        subgraph "🛠️ System Services"
            W[Webhook Server<br/>Port: 9000<br/>Auto Deploy]
            M[Health Monitor<br/>System Check]
            L[Log Manager<br/>Rotate & Archive]
        end
        
        subgraph "💾 File System"
            APP[/opt/jeval-frontend<br/>Application Files]
            LOG[/var/log/jeval-frontend<br/>Log Files]
            BAK[/var/backups<br/>Backup Files]
        end
    end
    
    U --> D
    D --> N
    N --> F
    F --> B
    B --> DB
    
    W --> APP
    M --> F
    M --> B
    L --> LOG
```

## 🔄 Service Interaction Flow

```mermaid
sequenceDiagram
    participant U as 👥 User
    participant N as 🔒 Nginx
    participant F as ⚛️ Frontend
    participant B as 🚀 Backend
    participant DB as 🗄️ Database
    participant M as 📊 Monitor
    
    Note over U,DB: User Request Flow
    U->>N: HTTPS Request
    N->>F: Proxy to Frontend
    F->>B: API Call
    B->>DB: Database Query
    DB-->>B: Data Response
    B-->>F: API Response
    F-->>N: HTML/JSON
    N-->>U: HTTPS Response
    
    Note over M,DB: Health Monitoring
    loop Every 5 minutes
        M->>F: Health Check
        M->>B: Health Check
        M->>DB: Connection Check
        alt All Healthy
            M->>M: Log Success
        else Any Unhealthy
            M->>M: Send Alert
            M->>F: Restart if needed
        end
    end
```

## 🚀 Deployment Process Detail

```mermaid
flowchart TD
    subgraph "💻 Development Phase"
        A1[Code Changes] --> A2[Local Testing]
        A2 --> A3[Git Commit]
        A3 --> A4[Git Push]
    end
    
    subgraph "🌐 GitHub Actions"
        B1[Trigger Webhook] --> B2[Run CI Tests]
        B2 --> B3[Build Docker Image]
        B3 --> B4[Push to Registry]
    end
    
    subgraph "🖥️ Server Deployment"
        C1[Receive Webhook] --> C2[Backup Current]
        C2 --> C3[Pull New Code]
        C3 --> C4[Install Dependencies]
        C4 --> C5[Build Application]
        C5 --> C6[Update Containers]
        C6 --> C7[Health Check]
        
        C7 --> C8{Success?}
        C8 -->|Yes| C9[Go Live]
        C8 -->|No| C10[Rollback]
    end
    
    subgraph "📊 Post-Deployment"
        D1[Monitor Metrics] --> D2[Log Analysis]
        D2 --> D3[Performance Check]
        D3 --> D4[User Feedback]
    end
    
    A4 --> B1
    B4 --> C1
    C9 --> D1
    C10 --> D1
```

## 🏗️ Container Architecture

```mermaid
graph TB
    subgraph "🐳 Docker Compose Network"
        subgraph "Frontend Service"
            F1[jeval-frontend:latest<br/>├── Next.js App<br/>├── Static Assets<br/>├── API Routes<br/>└── Middleware]
            F2[Volume Mounts<br/>├── /app/.next<br/>├── /app/public<br/>└── Environment Files]
        end
        
        subgraph "Backend Service"
            B1[jeval-backend:latest<br/>├── Strapi CMS<br/>├── API Endpoints<br/>├── Auth System<br/>└── File Upload]
            B2[Volume Mounts<br/>├── /opt/app/public<br/>├── Database Config<br/>└── Environment Files]
        end
        
        subgraph "Database Service"
            D1[postgres:15-alpine<br/>├── PostgreSQL DB<br/>├── User Data<br/>├── Content Data<br/>└── Session Data]
            D2[Volume Mounts<br/>├── /var/lib/postgresql<br/>├── Init Scripts<br/>└── Backup Location]
        end
        
        subgraph "Reverse Proxy"
            N1[nginx:alpine<br/>├── SSL Termination<br/>├── Load Balancing<br/>├── Static Files<br/>└── Rate Limiting]
            N2[Config Mounts<br/>├── /etc/nginx/conf.d<br/>├── /etc/ssl/certs<br/>└── Log Directory]
        end
    end
    
    F1 --> F2
    B1 --> B2
    D1 --> D2
    N1 --> N2
    
    N1 --> F1
    F1 --> B1
    B1 --> D1
```

## 📡 Data Flow Process

```mermaid
graph LR
    subgraph "📱 Client Side"
        C1[Browser] --> C2[React Components]
        C2 --> C3[API Calls]
        C3 --> C4[State Management]
    end
    
    subgraph "🔗 Network Layer"
        N1[HTTPS Request] --> N2[Nginx Proxy]
        N2 --> N3[Load Balancing]
        N3 --> N4[Rate Limiting]
    end
    
    subgraph "⚛️ Frontend Server"
        F1[Next.js Router] --> F2[Page Components]
        F2 --> F3[API Routes]
        F3 --> F4[Middleware]
        F4 --> F5[Authentication]
    end
    
    subgraph "🚀 Backend Server"
        B1[Strapi Router] --> B2[Controllers]
        B2 --> B3[Services]
        B3 --> B4[Models]
        B4 --> B5[Database Layer]
    end
    
    subgraph "🗄️ Database"
        D1[PostgreSQL] --> D2[Tables]
        D2 --> D3[Indexes]
        D3 --> D4[Relations]
    end
    
    C4 --> N1
    N4 --> F1
    F5 --> B1
    B5 --> D1
    
    D4 --> B5
    B5 --> F5
    F5 --> N4
    N4 --> C4
```

## 🔧 Configuration Flow

```mermaid
graph TD
    subgraph "⚙️ Configuration Sources"
        E1[.env.production<br/>Environment Variables]
        E2[docker-compose.yml<br/>Container Config]
        E3[nginx.conf<br/>Web Server Config]
        E4[next.config.ts<br/>App Config]
    end
    
    subgraph "🏗️ Build Process"
        B1[Environment Setup] --> B2[Docker Build]
        B2 --> B3[Asset Optimization]
        B3 --> B4[Container Creation]
    end
    
    subgraph "🚀 Runtime"
        R1[Container Start] --> R2[Service Discovery]
        R2 --> R3[Health Checks]
        R3 --> R4[Load Balancing]
        R4 --> R5[Request Handling]
    end
    
    E1 --> B1
    E2 --> B1
    E3 --> B1
    E4 --> B1
    
    B4 --> R1
```

## 📊 Monitoring & Logging Flow

```mermaid
graph TB
    subgraph "📈 Data Collection"
        M1[Application Logs] --> M2[System Metrics]
        M2 --> M3[Performance Data]
        M3 --> M4[Error Tracking]
    end
    
    subgraph "🔍 Processing"
        P1[Log Aggregation] --> P2[Metric Analysis]
        P2 --> P3[Anomaly Detection]
        P3 --> P4[Alert Generation]
    end
    
    subgraph "📢 Alerting"
        A1[Email Notifications] --> A2[Slack Messages]
        A2 --> A3[SMS Alerts]
        A3 --> A4[Dashboard Updates]
    end
    
    subgraph "🔄 Actions"
        AC1[Auto Restart] --> AC2[Scale Resources]
        AC2 --> AC3[Rollback Deploy]
        AC3 --> AC4[Emergency Stop]
    end
    
    M4 --> P1
    P4 --> A1
    A4 --> AC1
```

## 🚨 Failure & Recovery Flow

```mermaid
graph TD
    F1[Service Failure Detected] --> F2{Type of Failure?}
    
    F2 -->|Application Error| F3[Restart Container]
    F2 -->|Database Error| F4[Check DB Connection]
    F2 -->|Network Error| F5[Check Network Config]
    F2 -->|Resource Error| F6[Check System Resources]
    
    F3 --> F7{Restart Success?}
    F4 --> F8{DB Recovery?}
    F5 --> F9{Network Fixed?}
    F6 --> F10{Resources Available?}
    
    F7 -->|Yes| F11[Resume Normal Operation]
    F7 -->|No| F12[Rollback to Previous Version]
    
    F8 -->|Yes| F11
    F8 -->|No| F13[Manual Intervention Required]
    
    F9 -->|Yes| F11
    F9 -->|No| F13
    
    F10 -->|Yes| F11
    F10 -->|No| F14[Scale Resources/Alert Admin]
    
    F12 --> F15[Verify Rollback Success]
    F15 --> F11
    
    F11 --> F16[Send Recovery Notification]
    F13 --> F17[Send Critical Alert]
    F14 --> F18[Send Resource Alert]
```

## 📋 Summary

### 🎯 **Key Components:**
- **Frontend:** Next.js application (Port 3000)
- **Backend:** Strapi API services (Port 1337)  
- **Database:** PostgreSQL (Port 5432)
- **Proxy:** Nginx (Port 80/443)
- **Automation:** Webhook server (Port 9000)

### 🔄 **Process Flow:**
1. **Development:** Code → Test → Push
2. **Deployment:** Webhook → Pull → Build → Deploy
3. **Runtime:** User Request → Frontend → Backend → Database
4. **Monitoring:** Health Check → Metrics → Alerts → Actions

### ⚡ **Performance Characteristics:**
- **Deployment Time:** 2-5 minutes
- **Recovery Time:** < 2 minutes (auto rollback)
- **Health Check:** Every 5 minutes
- **Zero Downtime:** Blue-green deployment support

---

**หมายเหตุ:** Diagrams เหล่านี้แสดงการทำงานของระบบทั้งหมด ตั้งแต่การ deploy จนถึงการให้บริการผู้ใช้