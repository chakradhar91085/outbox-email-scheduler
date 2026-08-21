# Email Scheduler Assessment — Phase 1: Foundation

Production-grade email job scheduler project foundation.

---

## 🚀 Quick Start

### 1. Start Infrastructure (PostgreSQL & Redis)
Ensure Docker is running, then start the containers:
```bash
docker compose up -d
```

### 2. Verify Containers
```bash
docker compose ps
```

### 3. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
Backend runs at: `http://localhost:5000`

### 4. Frontend Setup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

---

## 🔍 Verification Endpoints

Test the health endpoints using curl or your browser:

- **General Health**: `GET http://localhost:5000/health`
  ```json
  { "status": "ok", "message": "Backend is running" }
  ```

- **PostgreSQL Database Health**: `GET http://localhost:5000/health/db`
  ```json
  { "status": "ok", "message": "PostgreSQL database connected successfully via Prisma" }
  ```

- **Redis Health**: `GET http://localhost:5000/health/redis`
  ```json
  { "status": "ok", "message": "Redis connected successfully", "response": "PONG" }
  ```
