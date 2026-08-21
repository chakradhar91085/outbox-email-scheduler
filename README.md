# 🚀 ReachInbox Hiring Assignment – Full-stack Email Job Scheduler

Production-grade, distributed email job scheduler service and interactive dashboard built for **ReachInbox.ai** (Outbox Labs).

Designed for high-throughput, reliable scheduling and sending of cold outreach emails at scale using persistent delayed queues and dedicated background workers — **strictly without cron jobs**.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Implemented Features](#-implemented-features)
  - [Backend Features](#backend-features)
  - [Frontend Features](#frontend-features)
- [Architecture Overview](#-architecture-overview)
- [How Scheduling Works](#-how-scheduling-works)
- [Persistence Across Restart](#-persistence-across-restart)
- [Rate Limiting and Concurrency](#-rate-limiting-and-concurrency)
- [Prerequisites](#-prerequisites)
- [Environment Variables](#-environment-variables)
- [Ethereal Email Setup](#-ethereal-email-setup)
- [Running Locally](#-running-locally)
- [Cloud Deployment Guide (Vercel & Render)](#-cloud-deployment-guide-vercel--render)
- [Demo Instructions](#-demo-instructions)
- [Demo Video](#-demo-video)
- [Assumptions, Shortcuts, and Trade-offs](#-assumptions-shortcuts-and-trade-offs)

---

## 🎯 Overview

At ReachInbox, reliable email dispatching at scale is mission-critical. This application addresses the core challenges of cold outreach job scheduling:

1. **Zero Cron Dependency**: All scheduling is handled natively via **BullMQ delayed jobs** backed by **Redis** persistence.
2. **Survives Infrastructure Restarts**: When the server or worker crashes and restarts, future scheduled emails still fire at their exact timestamps without losing state or duplicating sends.
3. **Worker Concurrency**: Multi-threaded background worker processes jobs in parallel with configurable concurrency (`WORKER_CONCURRENCY=5`).
4. **Per-Sender Atomic Rate Limiting**: Enforces strict hourly limits per sender across multiple worker instances using atomic Redis Lua scripts without dropping jobs.
5. **Real SMTP Delivery**: Live dispatch via **Nodemailer** using **Ethereal Email** with clickable audit preview URLs.
6. **Modern Public Landing & Dashboard**: A public landing page with Canvas 2D animations, Clerk Google OAuth authentication, CSV lead parser, and live 3s polling telemetry.

---

## ✨ Implemented Features

### Backend Features
- **Scheduler**: BullMQ delayed jobs with millisecond-precision timing (`delay = scheduledAt - now`), completely free of cron polling.
- **Relational Persistence**: PostgreSQL schema managed via Prisma ORM with relational models for `Campaign` and `Email` records.
- **Per-Sender Rate Limiting**: Atomic token-bucket algorithm executed in Redis via Lua scripts, partitioning quotas per sender address across hourly windows.
- **Worker Concurrency**: Dedicated worker daemon supporting configurable parallel execution threads (`WORKER_CONCURRENCY=5`).
- **Retry Handling & Backoff**: Automatic exponential backoff (`attempts: 4`, `5s -> 10s -> 20s`) for transient SMTP failures.
- **Bulk Queue Processing**: High-throughput `emailQueue.addBulk()` pipeline scheduling 1,000+ recipients in a single atomic database & queue transaction.
- **Email Provider Abstraction**: Pluggable `IEmailProvider` architecture with **Ethereal SMTP** as the required default, and an optional HTTP adapter for cloud environments.

### Frontend Features
- **Authentication / Login**: Seamless Google OAuth login powered by Clerk with JWT session tokens securing backend API calls.
- **Public Landing Page (`/`)**: Canvas 2D particle sphere, dynamic rotating headline, interactive process diagrams, live telemetry, and bidirectional tech stack marquees.
- **Interactive Dashboard (`/dashboard`)**: KPI metric cards, recent campaign progress, real-time BullMQ queue strip, and quick navigation.
- **Campaign Creation Wizard**:
  - Manual multiline email input with instant count validation.
  - CSV Drag-and-Drop parser with automatic column mapping (`email`, `recipient`, `mail`), regex email verification, and deduplication.
  - Real-time schedule timing calculator projecting completion time ($T_{\text{end}}$) based on lead count, start time, and stagger delay.
- **Email Delivery Logs & Audit**: Paginated delivery table with status filtering (`ALL`, `PENDING`, `PROCESSING`, `SENT`, `FAILED`), search, clickable Ethereal preview URLs, and full error tooltips.
- **Campaign Inspector Modal**: Detailed audit timeline displaying sent/pending/failed progress bars and per-recipient status history.
- **BullMQ Queue Monitor**: Live Redis job counters (`Active`, `Delayed`, `Waiting`, `Completed`, `Failed`, `Concurrency`).
- **Live Frontend Polling**: 3-second automatic UI refetching for active campaigns that cleanly terminates when all emails reach terminal states.

---

## 🏗️ Architecture Overview

```mermaid
flowchart TD
    subgraph Client ["Client Layer (React + Vite)"]
        Visitor(["Visitor / Operator"])
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

    subgraph Storage ["State & Storage Layer"]
        PG[("PostgreSQL 16\n(Prisma ORM)")]
        Redis[("Redis 7\n(BullMQ Delayed Jobs + Lua Rate Limits)")]
    end

    subgraph WorkerLayer ["Execution Layer (Dedicated Process)"]
        Worker["Dedicated Email Worker (:npm run worker)"]
        RateLimiter["Redis Lua Token-Bucket Rate Limiter"]
        EmailService["EmailService Facade"]
        Factory["EmailProviderFactory"]
        Ethereal["EtherealEmailProvider (Default SMTP)"]
        Resend["ResendEmailProvider (Optional HTTP)"]
    end

    Visitor --> LP
    LP -->|Sign In| Auth
    Auth -->|JWT Session| Dash
    Dash -->|REST API Calls| API
    API --> AuthMid
    AuthMid --> CampService
    CampService -->|Persist Campaign & Emails| PG
    CampService -->|Atomic Bulk Enqueue| QueueService
    QueueService -->|Delayed Jobs| Redis

    Worker -->|Consume Due Jobs| Redis
    Worker -->|Check Per-Sender Quota| RateLimiter
    RateLimiter -->|Atomic Lua Check| Redis
    Worker -->|If Limit Exceeded: Reschedule| Redis
    Worker -->|If Allowed: Dispatch Mail| EmailService
    EmailService --> Factory
    Factory -->|EMAIL_PROVIDER=ethereal| Ethereal
    Factory -.->|EMAIL_PROVIDER=resend| Resend
    Ethereal -->|Pooled SMTP TLS| EtherealServer["Ethereal SMTP Server"]
    Worker -->|Update Status: SENT / FAILED| PG
    Dash -.->|Live Polling (3s)| API
```

---

## 🔄 How Scheduling Works

```
[ User Submits Campaign via UI / API ]
                 ↓
    1. Express Controller validates payload schema with Zod.
                 ↓
    2. CampaignService persists Campaign and N Email records into PostgreSQL with status = PENDING.
                 ↓
    3. CampaignService calculates per-email scheduled timestamp:
       scheduledAt = startTime + (index * delaySeconds * 1000)
                 ↓
    4. Enqueues all jobs atomically into BullMQ via emailQueue.addBulk() with:
       - delay = scheduledAt - Date.now()
       - jobId = email.id (ensures strict idempotency)
                 ↓
[ Redis BullMQ Delayed Sorted Set ] (bull:email-sending:delayed)
                 ↓
[ Timestamp Reached: Job transitions from Delayed -> Waiting ]
                 ↓
[ Dedicated BullMQ Worker Process ] (Consumes job with active concurrency slot)
                 ↓
    5. Updates PostgreSQL email status -> PROCESSING.
                 ↓
    6. Executes Atomic Redis Lua script to check per-sender hourly quota.
       ├── If Limit Exceeded: Reschedules job to next hour window (+delayUntilResetMs) -> status remains PENDING.
       └── If Quota Available: Consumes token and proceeds.
                 ↓
    7. Dispatches email via Nodemailer Pooled SMTP to Ethereal Email.
       ├── Success: Updates DB status -> SENT (stores sentAt and previewUrl).
       └── Failure: BullMQ retries up to 4x with exponential backoff (5s, 10s, 20s).
           If all 4 retries fail -> DB status marked FAILED (stores errorMessage).
```

---

## 🛡️ Persistence Across Restart

The system is architected for **zero in-memory state loss** across server or worker crashes:

1. **PostgreSQL Relational State**: Every email record is persisted to disk upon campaign creation. The state (`PENDING`, `PROCESSING`, `SENT`, `FAILED`) is permanently tracked in the relational database.
2. **Redis BullMQ Delayed Sets**: BullMQ serializes delayed jobs into Redis sorted sets (`zset`) with the scheduled execution timestamp as the score. Redis persists this data structure to disk (RDB/AOF).
3. **Server Crash / Restart Scenario**: If the Express API server crashes or restarts, all existing scheduled emails remain in Redis and will execute normally.
4. **Worker Crash / Restart Scenario**: If the worker daemon is stopped (e.g. during deployment or unexpected termination) and restarted:
   - Any job scheduled for the future remains in the Redis delayed set and will fire at its exact timestamp.
   - Any job whose scheduled time passed while the worker was offline is picked up immediately upon worker restart as an overdue job and processed safely.
5. **Idempotency Protection**: BullMQ jobs are assigned an explicit `jobId = email.id`. Even if an enqueue operation is re-attempted, BullMQ deduplicates the job key, preventing duplicate sends. Additionally, the worker performs a status check (`if (email.status === SENT) return;`) before dispatching SMTP traffic.

---

## ⚡ Rate Limiting and Concurrency

### 1. Application-Level Per-Sender Rate Limiting (Redis Lua)
- Rate limiting is enforced **per sender email address** across all active campaigns created by that sender.
- The state is partitioned into 1-hour window buckets: `ratelimit:sender:{normalizedEmail}:{windowTimestamp}`.
- Evaluation and token increments are executed atomically in a single Redis round-trip via a custom Lua script:
  ```lua
  local current = redis.call('GET', KEYS[1])
  if current and tonumber(current) >= tonumber(ARGV[1]) then
      return 0 -- Limit exceeded
  else
      local new_val = redis.call('INCR', KEYS[1])
      if new_val == 1 then
          redis.call('EXPIRE', KEYS[1], tonumber(ARGV[2]))
      end
      return 1 -- Allowed
  end
  ```
- **Zero Dropped Jobs**: When a sender hits their limit (e.g. 100/hr), jobs are **not failed**. The worker calculates the exact millisecond delay until the next hour window (`delayUntilResetMs`) and re-enqueues the job with that delay, keeping the email in `PENDING` status.

### 2. Dedicated Worker Concurrency
- Configured via `WORKER_CONCURRENCY=5` in `backend/src/workers/email.worker.ts`.
- BullMQ spawns 5 parallel asynchronous job consumers within the dedicated worker process without blocking the Node.js event loop.

### 3. SMTP Transport-Level Pooling & Burst Throttling
- Nodemailer is configured with connection pooling (`pool: true`, `maxConnections: 3`, `maxMessages: 100`, `rateDelta: 1000`, `rateLimit: 3`).
- This buffers outgoing emails and prevents Ethereal SMTP `429 Too Many Requests` burst errors during high worker concurrency.

---

## 📋 Prerequisites

- **Node.js**: `v18.0.0+` or `v20.0.0+`
- **Docker & Docker Compose**: Installed and running (for local PostgreSQL & Redis)
- **npm** or **pnpm**

---

## 🔒 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | Express API server listening port | `5000` |
| `DATABASE_URL` | **Required** | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/email_scheduler?schema=public` |
| `REDIS_URL` | **Required** | Redis connection string | `redis://localhost:6379` |
| `FRONTEND_URL` | Optional | Allowed CORS origin | `http://localhost:5173` |
| `WORKER_CONCURRENCY` | Optional | Worker concurrency threads | `5` |
| `RATE_LIMIT_WINDOW_MS`| Optional | Rate limit window in milliseconds | `3600000` (1 hour) |
| `CLERK_PUBLISHABLE_KEY`| **Required** | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | **Required** | Clerk secret key | `sk_test_...` |
| `EMAIL_PROVIDER` | Optional | Active email provider (`ethereal` / `resend`) | `ethereal` (Default) |
| `SMTP_HOST` | Optional | Ethereal SMTP host | `smtp.ethereal.email` |
| `SMTP_PORT` | Optional | Ethereal SMTP port | `587` |
| `SMTP_SECURE` | Optional | TLS secure flag | `false` |
| `SMTP_USER` | Optional | Ethereal username (auto-generated if empty)| `your_user@ethereal.email` |
| `SMTP_PASS` | Optional | Ethereal password (auto-generated if empty)| `your_password` |
| `SMTP_FROM` | Optional | Default from address | `"ReachInbox Scheduler <noreply@reachinbox.ai>"` |
| `RESEND_API_KEY` | Optional | Optional Resend API key (if `EMAIL_PROVIDER=resend`)| `re_...` |

### Frontend (`frontend/.env`)
| Variable | Required | Description | Example / Default |
| :--- | :--- | :--- | :--- |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Required** | Clerk publishable key for Google OAuth | `pk_test_...` |
| `VITE_API_URL` | **Required** | Backend API base URL | `http://localhost:5000` |

---

## 📧 Ethereal Email Setup

> **Important**: **Ethereal SMTP is the default email provider used for assignment evaluation and demonstration.**

### Option A: Automatic Test Account Generation (Zero-Config Default)
If you leave `SMTP_USER` and `SMTP_PASS` blank in `backend/.env`, the worker automatically creates a new Ethereal test account on startup via `nodemailer.createTestAccount()` and logs the credentials:
```
📧 Ethereal Test Account Generated Automatically:
   User: csxgoopfit2e6l5k@ethereal.email
   Host: smtp.ethereal.email:587
```

### Option B: Persistent Ethereal Account (Recommended for Multi-Day Testing)
To accumulate all sent emails in one permanent test inbox across restarts:
1. Visit [https://ethereal.email/create](https://ethereal.email/create) to generate a free test account.
2. Add the generated credentials to `backend/.env`:
   ```env
   SMTP_USER=your_username@ethereal.email
   SMTP_PASS=your_password
   ```
3. Keep `EMAIL_PROVIDER=ethereal`.
4. Inspect sent test emails using the preview URLs logged in the worker console or clickable directly from the Frontend Delivery Logs table.

---

## 🚀 Running Locally

### 1. Clone & Start Infrastructure (PostgreSQL & Redis)
```bash
git clone https://github.com/chakradhar91085/outbox-email-scheduler.git
cd outbox-email-scheduler

# Start Docker containers
docker compose up -d
docker compose ps
```

### 2. Configure Environment Files
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Add your Clerk credentials to backend/.env and frontend/.env
```

### 3. Start Backend API Server
In Terminal 1:
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
> API running at: `http://localhost:5000`

### 4. Start Dedicated Email Worker
In Terminal 2:
```bash
cd backend
npm run worker
```
> Worker running with `5` concurrent threads.

### 5. Start Frontend Application
In Terminal 3:
```bash
cd frontend
npm install
npm run dev
```
> Frontend running at: `http://localhost:5173`

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

## 📹 Demo Instructions

Follow these steps to record the 5-minute assignment demo video:

1. **Sign In**: Navigate to `http://localhost:5173`, click **Start Free Trial** / **Sign In**, and sign in via Google OAuth with Clerk.
2. **Create Scheduled Campaign**:
   - Go to **Schedule Campaign**.
   - Paste 3–5 recipient emails (or upload a CSV).
   - Set a start time **1–2 minutes in the future** with a **5-second delay**.
   - Click **Schedule Campaign**.
3. **Demonstrate Scheduled State**:
   - View the **All Campaigns** and **Delivery Logs** tabs.
   - Show all emails in `PENDING` status with their exact future scheduled timestamps.
4. **Demonstrate Restart Persistence**:
   - In Terminal 2, stop the worker process (`Ctrl + C`).
   - Show that the API server and Redis remain healthy while the worker is offline.
   - Wait until the scheduled start time is reached.
   - Restart the worker daemon (`npm run worker`).
   - Observe that the worker immediately resumes, processes the due jobs, and dispatches them sequentially with the 5s delay.
5. **Demonstrate Sent State & Previews**:
   - Show the dashboard updating live via 3s polling as emails move from `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `SENT`.
   - Click an Ethereal preview link in the Delivery Logs table to view the rendered HTML email in Ethereal's web viewer.
6. **Bonus (Rate Limiting Demonstration)**:
   - Create a campaign with an hourly limit of `2` emails/hr for a specific sender.
   - Observe that the first 2 emails send immediately, and subsequent emails are automatically rescheduled to the next hourly window without failing.

---

## 🎥 Demo Video

> **Demo video**: To be added before final submission.

---

## 💡 Assumptions, Shortcuts, and Trade-offs

1. **Ethereal Test SMTP**: Used for safe email testing and preview URL generation without spamming real inboxes. In enterprise production, the provider abstraction allows switching to Amazon SES, SendGrid, or Resend.
2. **Live Polling over WebSockets**: The dashboard uses a 3-second polling interval for active campaigns. Polling was chosen to minimize WebSocket connection state complexity and ensure 100% resilience across serverless/container restarts.
3. **Hourly Window Buckets**: Per-sender hourly rate limiting uses hourly boundary buckets (`floor(now / 3600000) * 3600000`) for atomic Redis Lua execution with $O(1)$ memory overhead per sender.
4. **Standalone Worker Architecture**: The worker is decoupled into a dedicated Node.js process so that heavy SMTP and queue workloads never block HTTP API request throughput.
5. **Provider Abstraction**: Ethereal SMTP remains the primary default implementation required for evaluating this assessment; optional providers exist solely for deployment portability on cloud hosts where outbound SMTP ports are blocked.

---

## 👤 Author & Submission Details

- **Candidate**: Chakradhar Reddy
- **Repository**: [https://github.com/chakradhar91085/outbox-email-scheduler](https://github.com/chakradhar91085/outbox-email-scheduler) (Private)
- **Collaborators Invited**: `Mitrajit`, `Yadav036`
- **Target Company**: ReachInbox.ai / Outbox Labs
