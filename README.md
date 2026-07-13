# RouteIQ – AI-Powered Smart Road Intelligence Platform

RouteIQ is a fully production-ready, enterprise-grade, scalable AI-powered smart infrastructure ecosystem. Designed for municipalities and Department of Transportation (DOT) agencies worldwide, RouteIQ aggregates satellite feeds, weather patterns, traffic loads, and citizen grievances to forecast asphalt/base degradation up to 90 days in advance and auto-schedule budget-optimized maintenance routines.

---

## System Architecture

RouteIQ is engineered as a microservices-inspired monorepo, orchestrating distinct specialized runtime environments:

```
                  ┌──────────────────────────────┐
                  │      Next.js 15 Client       │
                  │ (React 19, Zustand, Leaflet) │
                  └──────────────┬───────────────┘
                                 │ HTTP / WebSockets
                                 ▼
                  ┌──────────────────────────────┐
                  │            Nginx             │ (Reverse Proxy)
                  └──────────────┬───────────────┘
                                 │
         ┌───────────────────────┴───────────────────────┐
         ▼ /api                                          ▼ /api/ai
┌──────────────────┐                            ┌──────────────────┐
│  NestJS Gateway  │                            │ FastAPI AI/ML    │
│ (Node.js Biz API)│ ◄────────────────────────  │ (Python Engine)  │
└────────┬─────────┘        Internode HTTP      └────────┬─────────┘
         │                                               │
         ├──────────────┬──────────────┐                 │
         ▼              ▼              ▼                 ▼
  ┌────────────┐ ┌────────────┐ ┌────────────┐    ┌────────────┐
  │ PostgreSQL │ │  MongoDB   │ │   Redis    │    │   Models   │ (XGBoost,
  │ (+PostGIS) │ │(Complaints)│ │  (Caching) │    │  Registry  │  PyTorch)
  └────────────┘ └────────────┘ └────────────┘    └────────────┘
```

1. **Next.js 15 (App Router)**: Fully responsive dark executive panel. Uses Zustand for reactive state control, Leaflet + CartoDB Dark Matter tiles for GIS mapping, and Recharts for real-time traffic/complaint analytics.
2. **Nginx Reverse Proxy**: Single ingress point routing traffic:
   - `/`: Next.js Frontend
   - `/api/`: NestJS Gateway
   - `/api/ai/`: FastAPI Service
   - `/socket.io/`: WebSocket streams
3. **NestJS API Gateway (Node 20)**: Exposes business logic API, manages relational operations on Postgres, logs complaints on MongoDB, and maintains real-time socket connections with clients.
4. **FastAPI ML Service (Python 3.10)**: Core computation backend. Runs PyTorch Convolutional nets for Sentinel-2 satellite image diagnostics, XGBoost regression models for road scoring, and LSTM arrays for time-series forecasting.

---

## Technology Stack & Core Modules

### 1. Data Aggregation Engine
Handles asynchronous ETL pipelines fetching traffic rates, weather parameters, and satellite records. Integrates a centralized seeder to populate mock spatial layers.

### 2. Road Health Scoring Engine (FastAPI)
Predicts a `0-100` health index for every LineString road segment using XGBoost based on:
- Traffic volume, weather precipitation, complaints count, and days elapsed since last repair.
- Exposes **Explainable AI (XAI)** metrics, printing SHAP feature weights directly in the client panel.

### 3. Satellite Image Analysis CV Pipeline
Runs a PyTorch CNN model to process raw Sentinel-2 satellite images. Detects surface cracks, pit depressions, and flooding likelihood with cloud cover filtering.

### 4. Predictive Forecasting Engine
Utilizes time-series regressions to output health scores at 30, 60, and 90-day intervals. Flags estimated days to structural failure.

### 5. Maintenance Optimization Planner (NestJS)
Solves a budget-constrained repair scheduling pipeline:
- Filters degraded segments and prioritizes them based on cost, urgency, and ROI coefficient.
- Evaluates cost: Reconstruction ($120/m), Resurfacing ($45/m), Patching ($15/m).
- Exposes budget-slider and approved/deferred listings.

### 6. Real-Time Alert System
Fires high-priority WebSocket events on socket channels when a new critical complaint (e.g. "sinkhole", "accident") is ingested or a segment drops below the safety threshold.

---

## Database Schemas

### PostgreSQL (PostGIS Relational)
- **`users`**: Auth credentials mapping roles (`Admin`, `Engineer`, `Operator`).
- **`roads`**: Catalog of municipal streets and highway categories.
- **`road_segments`**: Geospatial LineStrings (srid 4326), current health scores, length metrics, and daily traffic counts.
- **`risk_predictions`**: 30/60/90-day future health scores, prediction confidence, and SHAP weights.
- **`maintenance_history`**: Audit logs of executed repairs, cost details, and contractor agencies.

### MongoDB (Event Logs / Grievances)
- **`citizen_complaints`**: Citizen reports with GeoJSON point coordinates, NLP sentiment markers (Negative/Neutral), and severity indices (Critical/High/Medium/Low).
- **`weather_logs`**: Historical precipitation, temperature and freeze-thaw cycles.
- **`satellite_records`**: Sentinel-2 telemetry metrics.

---

## Local Development Setup

### Prerequisites
- Docker & Docker Compose (v2.x)
- Node.js (v20) installed locally (if running dev gateway/frontend without containers)
- Python (3.10) with `pip` (if running dev AI models locally)

### Step 1: Clone & Configure Environments
Copy the template configuration file:
```bash
cp .env.example .env
```
Ensure secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`) and database URLs are adjusted if needed.

### Step 2: Spin Up Infrastructure Containers
You can start the full stack (databases + apps) inside Docker:
```bash
docker-compose up --build
```
Alternatively, to start only the database instances (Postgres, MongoDB, Redis) and run applications locally:
```bash
docker-compose up postgres mongodb redis
```

### Step 3: Run Database Migrations and Seeding
With your databases running, populate the spatial datasets:
```bash
# In the root workspace directory
npm install bcrypt pg mongodb
node scripts/seed.js
```

### Step 4: Run Applications Locally (Alternative to Docker)
If you want to run code outside Docker containers for fast compilation:

- **AI Service (FastAPI)**:
  ```bash
  cd ai-service
  python -m venv .venv
  source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000
  ```

- **Backend Gateway (NestJS)**:
  ```bash
  cd backend-gateway
  npm install
  npm run start:dev
  ```

- **Frontend App (Next.js)**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
  Open [http://localhost:3000](http://localhost:3000) inside your web browser.

---

## Running Verification Tests

### AI Python Service (Pytest)
Validate calculations and computer vision endpoints:
```bash
cd ai-service
pytest tests/
```

### Gateway Service (Jest)
Validate routing logic and authentication layers:
```bash
cd backend-gateway
npm run test
```

---

## DevOps & Kubernetes Deployments

All Kubernetes deployment configs are localized in the `/k8s` directory:
- Apply database services: `kubectl apply -f k8s/pg-deployment.yaml -f k8s/mongo-deployment.yaml -f k8s/redis-deployment.yaml`
- Apply applications: `kubectl apply -f k8s/ai-deployment.yaml -f k8s/gateway-deployment.yaml -f k8s/frontend-deployment.yaml`
- Access RouteIQ Dashboard via: `http://<node-ip>:30080`

---

## Authentication Prefills (Local Testing)
- **City Admin**:
  - Email: `admin@routeiq.com`
  - Access Key: `admin_routeiq_2026`
- **DOT Engineer**:
  - Email: `engineer@routeiq.com`
  - Access Key: `engineer_routeiq_2026`

---

## ⚡ Vercel Deployment (Frontend)

The Next.js 15 client dashboard is fully compatible with Vercel deployment. Since it is nested inside the `/frontend` directory of the repository, follow these deployment steps:

### Step-by-Step Deployment
1. Go to your [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
2. Import this GitHub repository.
3. In the **Configure Project** settings:
   * **Root Directory**: Click *Edit* and select the `frontend` directory.
   * **Framework Preset**: Select **Next.js**.
   * **Build & Development Settings**: Keep defaults (Vercel will detect and run the build scripts configured in `frontend/vercel.json` and `frontend/package.json`).
4. Click **Deploy**. Vercel will compile the Next.js application and deploy it.

