# 🚀 ReachInbox Hiring Assignment – Full-stack Email Job Scheduler

Production-grade, distributed email job scheduler service and interactive dashboard built for **ReachInbox.ai** (Outbox Labs).

Designed for high-throughput, reliable scheduling and sending of cold outreach emails at scale using persistent delayed queues and dedicated background workers — **strictly without cron jobs**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [System Architecture](#-system-architecture)
- [Core Implemented Features](#-core-implemented-features)
- [Tech Stack](#-tech-stack)
- [Email Delivery Lifecycle](#-email-delivery-lifecycle)
- [Project Structure](#-project-structure)
- [Local Setup & Quick Start](#-local-setup--quick-start)
- [Environment Configuration](#-environment-configuration)
- [Concurrency, Rate Limiting & Reliability](#-concurrency-rate-limiting--reliability)
- [Persistence & Restart Safety](#-persistence--restart-safety)
- [API Reference & Health Endpoints](#-api-reference--health-endpoints)
- [Testing & Verification](#-testing--verification)
- [Assumptions & Design Trade-offs](#-assumptions--design-trade-offs)

---

## 🎯 Overview

At ReachInbox, reliable email dispatching at scale is mission-critical. This service solves the challenges of cold outreach scheduling:

1. **Zero Cron Dependency**: All scheduling is handled natively via **BullMQ delayed jobs** backed by **Redis** persistence.
2. **Survives Infrastructure Restarts**: When the server or worker crashes and restarts, future scheduled emails still fire at their exact timestamps without losing state or duplicating sends.
3. **Worker Concurrency**: Multi-threaded background worker processes jobs in parallel with configurable concurrency (`WORKER_CONCURRENCY=5`).
4. **Per-Sender Atomic Rate Limiting**: Enforces strict hourly limits per sender across multiple worker instances using atomic Redis Lua scripts without dropping jobs.
5. **Real SMTP Delivery**: Live dispatch via **Nodemailer** using **Ethereal Email** with clickable audit preview URLs.
6. **Modern Public Landing & Dashboard**: A public landing page with Canvas 2D animations, Clerk Google OAuth authentication, CSV lead parser, and live 3s polling telemetry.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Client ["Client Layer"]
        User(["Visitor / Operator"])
        LP["Public Landing Page (/)"]
        Auth["Clerk Google OAuth (/sign-in)"]
        Dash["Interactive Dashboard (/dashboard)"]
    end

    subgraph Backend ["Backend API Layer (Express + TypeScript)"]
        API["Express REST API (:5000)"]
        AuthMid["Clerk JWT Authentication Middleware"]
        CampService["Campaign Service (Zod Validation)"]
        QueueService["BullMQ Queue Service (addBulk)"]
    end

    subgraph Data ["State & Storage Layer"]
        PG[("PostgreSQL 16\n(Prisma ORM)")]
        Redis[("Redis 7\n(BullMQ Delayed Jobs + Lua Rate Limits)")]
    end

    subgraph WorkerLayer ["Execution Layer (Dedicated Process)"]
        Worker["Dedicated Email Worker (:npm run worker)"]
        RateLimiter["Redis Lua Token-Bucket Rate Limiter"]
        SMTPPool["Nodemailer Pooled Transport"]
        Ethereal["Ethereal SMTP Server"]
    end

    User --> LP
    LP -->|Sign In| Auth
    Auth -->|JWT Token| Dash
    Dash -->|REST API Requests| API
    API --> AuthMid
    AuthMid --> CampService
    CampService -->|Persist Campaign & Emails| PG
    CampService -->|Atomic Bulk Enqueue| QueueService
    QueueService -->|Delayed Jobs| Redis

    Worker -->|Consume Delayed Jobs| Redis
    Worker -->|Check Per-Sender Quota| RateLimiter
    RateLimiter -->|Atomic Lua Check| Redis
    Worker -->|If Quota Exceeded| Redis
    Worker -->|If Allowed: Send Mail| SMTPPool
    SMTPPool -->|SMTP TLS| Ethereal
    Worker -->|Update Status: SENT / FAILED| PG
    Dash -.->|Live Polling (3s)| API
```

---

## ✨ Core Implemented Features

### 1. Public Landing Page & Experience
- **Hero Particle Engine**: Pure 2D Canvas animated sphere/wave with rotating typography (`The engine to schedule / to scale / to dispatch / to deliver`).
- **Interactive Capabilities & Process**: SVG-animated feature cards and interactive 4-step execution lifecycle with code terminal syntax reveal.
- **Real-Time Telemetry & Tech Marquees**: Live synchronized clock, split-border animated counters, and bidirectional infinite tech stack marquee.

### 2. Campaign Creation & Audience Parsing
- **CSV Drag-and-Drop Parser**: Automatic column discovery (`email`, `recipient`, `mail`), regex email validation, and deduplication.
- **Manual Multiline Input**: Paste raw email lists with instant validity counting.
- **Dynamic Schedule Math**: Real-time calculator projecting total duration in minutes/seconds and estimated completion time ($T_{\text{end}}$).
- **Multi-Sender Identity**: Flexible sender profiles (e.g. `ReachInbox Sales <sales@reachinbox.ai>`).

### 3. Queue Management & Scheduling Engine
- **Delayed BullMQ Jobs**: Enqueued via `queue.addBulk()` with millisecond-precision delays (`delay = scheduledAt - now`).
- **Configurable Stagger Delay**: Custom per-email spacing (e.g. 5s) to prevent spam flags.
- **Per-Sender Hourly Limits**: Configurable quota (e.g. 100/hr) per sender email address.

### 4. Background Worker & SMTP Delivery
- **Dedicated Worker Process**: Runs in a separate process (`npm run worker`) isolated from the HTTP server.
- **Configurable Concurrency**: Processes up to $N$ emails in parallel (default: `5`).
- **Nodemailer Pooled Transport**: Connection pooling with burst throttling (`maxConnections: 3`, `rateLimit: 3/sec`) preventing SMTP provider rate limits.
- **Exponential Retry Backoff**: Failed transient dispatches retry up to 4 times with exponential delay (`5s -> 10s -> 20s`).
- **Idempotency**: Every BullMQ job uses `jobId = Email.id`, preventing duplicate dispatches.

### 5. Interactive Dashboard & Monitoring
- **Live Polling (3s / 4s)**: Automatic UI updates when viewing active campaigns, terminating cleanly when all emails reach terminal states (`SENT` or `FAILED`).
- **Status Filtering & Search**: Filter by `ALL`, `PENDING`, `PROCESSING`, `SENT`, `FAILED` with live pagination and search.
- **Native Browser Tooltips**: Full error diagnostics displayed on hover (`title={email.errorMessage}`).
- **BullMQ Telemetry Dashboard**: Live Redis job counts (`Delayed`, `Active`, `Waiting`, `Completed`, `Failed`, `Concurrency`).

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript | Single-page application and fast HMR |
| **Styling** | Tailwind CSS, Lucide Icons | Responsive modern dark theme and icons |
| **Authentication** | Clerk React, Google OAuth | Secure JWT session management |
| **Backend** | Node.js, Express, TypeScript | RESTful API server with Zod validation |
| **Database** | PostgreSQL 16, Prisma ORM | Relational persistence with ACID safety |
| **Queue & Store**| BullMQ 5, Redis 7 (ioredis) | Persistent delayed queue & Lua rate limiting |
| **Worker** | Dedicated BullMQ Worker | Background asynchronous email processor |
| **Email Testing**| Nodemailer, Ethereal SMTP | SMTP pooled transport & live web previews |
| **Infra** | Docker Compose | Containerized PostgreSQL and Redis services |

---

---

## 🔄 Email Delivery Lifecycle & Provider Abstraction

```
[ POST /api/campaigns (CSV + Timing) ]
                ↓
    1. Validate Payload (Zod)
                ↓
    2. Persist in PostgreSQL (Campaign + N Email records with status: PENDING)
                ↓
    3. Enqueue BullMQ Delayed Jobs in Redis (delay = scheduledAt - now, jobId = Email.id)
                ↓
[ Redis BullMQ Delayed Queue ] (Timer expires at scheduledAt)
                ↓
[ Dedicated Worker Process ] (Picks up active job)
                ↓
    4. Update DB status -> PROCESSING
                ↓
    5. Evaluate Per-Sender Hourly Limit (Atomic Redis Lua Script)
        ├── If Limit Exceeded: Reschedule to next hour window (Delay = nextWindow - now) -> DB status stays PENDING
        └── If Allowed: Proceed to Step 6
                ↓
    6. Email Delivery Layer (Provider Abstraction)
        ├── Ethereal SMTP (Default / Assignment Compliant): Nodemailer pooled transport + preview URLs
        └── Resend HTTP (Optional Deployment Adapter): HTTPS API delivery
                ↓
    7. Status Resolution:
        ├── If Success: Update DB -> SENT (save sentAt, previewUrl)
        ├── If Transient Failure: Retry up to 4x (Exponential backoff 5s) -> DB status stays PENDING
        └── If Retries Exhausted: Update DB -> FAILED (save errorMessage)
```

### Email Provider Abstraction Architecture

The application uses an explicit **Email Provider Abstraction** (`IEmailProvider`):
- **Ethereal SMTP (Default & Assignment-Compliant)**: Uses Nodemailer with SMTP connection pooling (`maxConnections: 3`, `rateLimit: 3/sec`) and test message URL generation. This is the official testing provider required for evaluating the hiring assessment.
- **Resend HTTP (Optional Cloud Adapter)**: Configurable via `EMAIL_PROVIDER=resend` and `RESEND_API_KEY=...` for cloud deployments where outbound SMTP ports (587/465) may be restricted.

> **Important**: Ethereal SMTP remains the default provider for evaluating this assignment. The provider abstraction exists to allow deployment-specific adapters without altering scheduling, persistence, rate limiting, worker concurrency, or idempotency logic.


---

## 📁 Project Structure

```
outbox-email-scheduler/
├── docker-compose.yml              # PostgreSQL 16 & Redis 7 Docker setup
├── .env.example                    # Root environment variable template
├── README.md                       # Public project documentation
├── backend/
│   ├── prisma/
│   │   └── schema.prisma           # Prisma PostgreSQL schema (Campaign, Email)
│   ├── src/
│   │   ├── config/index.ts         # Environment validation and configurations
│   │   ├── controllers/            # Express request controllers (campaign, email)
│   │   ├── lib/                    # Database (Prisma) and Redis clients
│   │   ├── middleware/             # Clerk JWT auth & error middlewares
│   │   ├── queues/                 # BullMQ queue definition & bulk enqueue logic
│   │   ├── routes/                 # Express API routes (auth, campaign, email, queue, health)
│   │   ├── scripts/                # Automated verification and load testing scripts
│   │   ├── services/               # Core business services (campaign, email, rate-limiter)
│   │   ├── workers/                # Dedicated BullMQ email worker daemon
│   │   └── index.ts                # Express server entry point
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── campaign/           # Campaign wizard, lists, and audit details modal
    │   │   ├── common/             # Stat cards, status badges, spinners, error alerts
    │   │   ├── dashboard/          # KPI metrics, recent campaigns, queue strip
    │   │   ├── emails/             # Delivery logs, status filter tabs, pagination
    │   │   ├── landing/            # Public animated landing page components
    │   │   ├── layout/             # Application shell (Header, Sidebar, AppLayout)
    │   │   └── queue/              # BullMQ queue telemetry monitor
    │   ├── lib/utils.ts            # Class merging utilities (clsx + tailwind-merge)
    │   ├── services/api.ts         # Centralized API client with Clerk token support
    │   ├── types/index.ts          # TypeScript interfaces and data models
    │   ├── App.tsx                 # Main routing (Landing -> Clerk Auth -> Dashboard)
    │   └── main.tsx                # React DOM root with Clerk Provider
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 🚀 Local Setup & Quick Start

### Prerequisites
- **Node.js**: `v18+` or `v20+`
- **Docker & Docker Compose**: Installed and running
- **npm** or **pnpm**

---

### Step 1: Clone Repository
```bash
git clone https://github.com/chakradhar91085/outbox-email-scheduler.git
cd outbox-email-scheduler
```

---

### Step 2: Start Infrastructure (PostgreSQL & Redis)
```bash
docker compose up -d
docker compose ps
```

---

### Step 3: Configure Environment Variables

**Backend (`backend/.env`)**:
```bash
cp backend/.env.example backend/.env
```
Fill in the backend `.env` variables:
```env
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/email_scheduler?schema=public"
REDIS_URL="redis://localhost:6379"
WORKER_CONCURRENCY=5
RATE_LIMIT_WINDOW_MS=3600000

# Clerk Authentication Keys
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# SMTP Configuration (Auto-generates Ethereal credentials if blank)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM="ReachInbox Outreach <noreply@reachinbox.ai>"
```

**Frontend (`frontend/.env`)**:
```bash
cp frontend/.env.example frontend/.env
```
Fill in the frontend `.env` variables:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:5000
```

---

### Step 4: Setup & Start Backend Server
In your first terminal:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
> Backend API will be running at: `http://localhost:5000`

---

### Step 5: Start Dedicated Background Worker
In a second terminal:
```bash
cd backend
npm run worker
```
> Dedicated BullMQ worker will start listening to the `email-sending` queue with `5` concurrent threads.

---

### Step 6: Setup & Start Frontend Application
In a third terminal:
```bash
cd frontend
npm install
npm run dev
```
> Frontend application will be running at: `http://localhost:5173`

---

---

## ☁️ Cloud Deployment Guide (Vercel & Render)

### 1. Database & Queue (Managed PostgreSQL & Redis)
- **PostgreSQL**: Create a managed PostgreSQL database (e.g. Render PostgreSQL, Supabase, Neon) and copy the connection string (`DATABASE_URL`).
- **Redis**: Create a managed Redis instance (e.g. Render Redis, Upstash, Redis Cloud) and copy the connection string (`REDIS_URL`).

### 2. Backend API Deployment (Render Web Service)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build && npx prisma db push`
- **Start Command**: `npm start` (runs `node dist/index.js`)
- **Health Check Path**: `/health`

### 3. Dedicated Worker Deployment (Render Background Worker)
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run worker:prod` (runs `node dist/workers/email.worker.js`)

### 4. Frontend Deployment (Vercel)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**:
  - `VITE_CLERK_PUBLISHABLE_KEY`: `pk_test_...`
  - `VITE_API_URL`: `https://your-render-backend.onrender.com`

---

## 🔒 Environment Configuration

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `PORT` | Backend | Port on which Express API listens (default: `5000`) |
| `DATABASE_URL` | Backend / Worker | PostgreSQL connection string for Prisma ORM |
| `REDIS_URL` | Backend / Worker | Redis connection string for BullMQ and Lua rate limiting |
| `FRONTEND_URL` | Backend | Allowed CORS origin (e.g. `https://your-app.vercel.app`) |
| `WORKER_CONCURRENCY` | Backend / Worker | Number of parallel worker threads (default: `5`) |
| `RATE_LIMIT_WINDOW_MS` | Backend / Worker | Rate limiting window size (default: `3600000` ms / 1 hour) |
| `CLERK_SECRET_KEY` | Backend | Clerk backend API secret key for JWT verification |
| `CLERK_PUBLISHABLE_KEY`| Frontend / Backend | Clerk public publishable key |
| `SMTP_HOST` / `PORT` | Worker | SMTP host (e.g. `smtp.ethereal.email`, `587`) |
| `SMTP_USER` / `PASS` | Worker | Ethereal SMTP credentials (auto-generated if left blank) |
| `VITE_API_URL` | Frontend | Backend API base URL (default: `http://localhost:5000`) |

---

## ⚡ Concurrency, Rate Limiting & Reliability

### 1. Configurable Worker Concurrency
- Configured via `WORKER_CONCURRENCY=5` in `backend/src/workers/email.worker.ts`.
- BullMQ allocates 5 parallel job threads without blocking the event loop.

### 2. Multi-Sender Atomic Rate Limiting (Redis Lua)
- Enforces hourly sending limits partitioned **per sender** (`ratelimit:sender:{normalizedEmail}:{windowTimestamp}`).
- Rate check and token increment are executed atomically in Redis via a Lua script:
  ```lua
  local current = redis.call('GET', KEYS[1])
  if current and tonumber(current) >= tonumber(ARGV[1]) then
      return 0 -- Rate limit exceeded
  else
      local new_val = redis.call('INCR', KEYS[1])
      if new_val == 1 then
          redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
      end
      return 1 -- Allowed
  end
  ```
- When a sender's hourly limit is reached, jobs are **not dropped**. The worker automatically reschedules the job with a delay pointing into the next hour window (`delay = nextWindowStart - now`), keeping the email status as `PENDING`.

### 3. SMTP Connection Pooling & Burst Throttling
- Nodemailer is configured with a pooled transport (`pool: true`, `maxConnections: 3`, `rateLimit: 3/sec`).
- This buffers outgoing emails and prevents Ethereal SMTP `429 Too Many Requests` burst rejection errors during high worker concurrency.

### 4. Exponential Retry Backoff
- Queue options: `attempts: 4`, `backoff: { type: 'exponential', delay: 5000 }`.
- First retry occurs at +5s, second at +10s, third at +20s.
- During retries, the email status remains `PENDING` with the latest error message noted. Only after exhausting all 4 attempts is the email marked `FAILED`.

---

## 🛡️ Persistence & Restart Safety

- **Zero In-Memory Volatility**: Job definitions, scheduled timestamps, and payload parameters are serialized directly into Redis sorted sets (`bull:email-sending:delayed`).
- **Crash Recovery**: If the API server or worker process terminates, Redis preserves all delayed jobs. When restarted, the worker immediately resumes processing future emails at their exact scheduled time.
- **Idempotency**: BullMQ jobs are enqueued with explicit job IDs matching the PostgreSQL primary key:
  ```typescript
  jobId: email.id
  ```
  This prevents duplicate jobs from ever being enqueued for the same email record.

---

## 📡 API Reference & Health Endpoints

### Health Check Endpoints (Public)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/health` | `GET` | API server status check |
| `/health/db` | `GET` | PostgreSQL connection health verification |
| `/health/redis` | `GET` | Redis ping-pong health verification |

### Protected API Endpoints (Requires Clerk JWT Bearer)
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/me` | `GET` | Returns authenticated user profile and session info |
| `/api/campaigns` | `POST` | Create a campaign, persist emails, and bulk enqueue delayed jobs |
| `/api/campaigns` | `GET` | List all campaigns with aggregate progress counts |
| `/api/campaigns/:id` | `GET` | Get detailed campaign audit trail and recipient timeline |
| `/api/emails` | `GET` | Paginated query of email logs with status and search filters |
| `/api/queue/status` | `GET` | Real-time BullMQ queue metrics and worker configuration |

---

## 🧪 Testing & Verification

### 1. Static Type & Build Checks
```bash
# Backend TypeScript Check
cd backend && npx tsc --noEmit

# Frontend TypeScript Check & Production Build
cd frontend && npx tsc --noEmit && npm run build
```

### 2. Automated Test Scripts
```bash
# Concurrency and Rate Limit Verification
cd backend && npx tsx src/scripts/test-phase5.ts

# Multi-Sender Compliance & Spacing Delay Test
cd backend && npx tsx src/scripts/test-phase6a-compliance.ts

# Retry & Failure Handling Test
cd backend && npx tsx src/scripts/test-failure.ts
```

---

## 💡 Assumptions & Design Trade-offs

1. **Ethereal Test SMTP**: Used for test isolation and preview link generation. In production, Nodemailer transports can be swapped for Amazon SES, SendGrid, or Resend by changing environment variables.
2. **Fixed 1-Hour Sliding Windows**: Per-sender hourly rate limiting uses hourly boundary buckets (`floor(now / 3600000) * 3600000`) for atomic Redis Lua performance and minimal memory overhead.
3. **Dedicated Worker Architecture**: The worker is executed as a standalone Node.js process to ensure CPU/network heavy email dispatches never degrade HTTP API response times.

---

## 👤 Author & Submission Details

- **Candidate**: Chakradhar Reddy
- **Repository**: [https://github.com/chakradhar91085/outbox-email-scheduler](https://github.com/chakradhar91085/outbox-email-scheduler)
- **Target Company**: ReachInbox.ai / Outbox Labs
