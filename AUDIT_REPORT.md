# RouteIQ Enterprise Codebase Audit & Hardening Report

This report documents the architectural, security, database, AI/ML, and operational audit of the RouteIQ codebase. Below is a structured analysis of identified issues, their production impact, and the exact fixes implemented to transition the platform into a government-grade Smart City SaaS deployment.

---

## 1. Architecture Review

### 1.1 Lack of Clean Architecture Domain Separation
- **Problem**: Business logic, API controllers, and database access are tightly coupled. For example, in the FastAPI service, routers directly process calculations and call DB methods.
- **Severity**: High
- **Production Impact**: Violates SOLID design principles, increases code redundancy, complicates unit-testing, and makes database engine swaps extremely difficult.
- **Fix Implemented**: Refactored both backend services to enforce a strict **Clean Architecture** layout separating:
  - **Domain Layer**: Abstract interfaces, core business rules, and entities.
  - **Application Layer**: Use cases, business workflow managers, and DTOs.
  - **Infrastructure Layer**: Routers, database clients (TypeORM / Mongoose), concrete repositories, and ML framework operations.

### 1.2 Circular Dependency Risk
- **Problem**: Relational entity definitions (`Road` and `RoadSegment`) reference each other circularly across import boundaries.
- **Severity**: Medium
- **Production Impact**: Can lead to bootstrapping errors, NestJS dependency resolution blocks, or runtime crashes during intense database loads.
- **Fix Implemented**: Decoupled relations by utilizing lazy relations and explicit TypeORM forward references (`forwardRef()`).

---

## 2. Backend Audit (FastAPI & NestJS)

### 2.1 Lack of Centralized Exception Middleware
- **Problem**: Exceptions are caught locally inside controller try-catch blocks. If a network call fails, services throw unformatted errors, leaking stack traces.
- **Severity**: High
- **Production Impact**: Leaking stack traces presents a security risk. Inconsistent API errors break frontend client integrations.
- **Fix Implemented**:
  - **FastAPI**: Added a global API exception handler middleware mapping all exceptions to uniform RFC 7807 Problem Details JSON payloads.
  - **NestJS**: Built a global `HttpExceptionFilter` to format validation, DB, and network exceptions uniformly.

### 2.2 Synchronous Blocking in FastAPI
- **Problem**: The database client connection in the FastAPI helper `get_postgres_connection()` was synchronous, and router calls blocked the event loop.
- **Severity**: High
- **Production Impact**: A synchronous block locks the single-threaded event loop in FastAPI, causing concurrent requests to stall and drop system throughput.
- **Fix Implemented**: Replaced the synchronous connection setup with an asynchronous PostgreSQL connector (using `asyncpg` and SQLAlchemy async sessions) so database queries do not block the event loop.

---

## 3. Security Audit

### 3.1 Unvalidated Environment Configurations
- **Problem**: Environmental variables (e.g. database credentials, JWT secrets) are loaded dynamically without type checks or validation rules.
- **Severity**: High
- **Production Impact**: If a configuration parameter (like a JWT secret key) is missing or set to an invalid type, the system fails silently at runtime, resulting in unexpected crashes.
- **Fix Implemented**:
  - **FastAPI**: Utilized strict `pydantic-settings` schema checking to ensure env keys are parsed and typed correctly at boot.
  - **NestJS**: Configured a `Joi` validation schema in `ConfigModule` to assert presence and format of core keys.

### 3.2 Hardcoded/Insecure JWT Tokens & Refresh Token Validation
- **Problem**: Refresh tokens are signed but their presence and validity are never checked against active database sessions or a blacklist store.
- **Severity**: Critical
- **Production Impact**: Compromised refresh tokens can bypass access expiration, permitting attackers permanent access to administrative endpoints.
- **Fix Implemented**: Linked JWT Refresh tokens to Redis session caches. Every token verification now cross-references Redis cache keys to ensure sessions are active, enabling instant admin session revoking.

### 3.3 Missing API Rate Limiting
- **Problem**: API endpoints were fully exposed to public ingress without rate-limiting constraints.
- **Severity**: High
- **Production Impact**: System is vulnerable to Denial of Service (DoS) attacks and brute-force authorization attempts.
- **Fix Implemented**: Integrated a Redis-backed rate-limiting interceptor in the NestJS API gateway, permitting a max of 100 requests per minute per IP.

---

## 4. Database Audit

### 4.1 Missing Database Indexing and Spatial Optimization
- **Problem**: Spatial geometry fields (`geom` in `road_segments`) did not have spatial indexing enabled, and standard tables lacked indices on high-query fields (like `roadId`).
- **Severity**: High
- **Production Impact**: Spatial operations (like fetching overlapping road segments or points within 5km) degrade exponentially, blocking dashboard renders.
- **Fix Implemented**: 
  - Added spatial indices (`ST_SpatialIndex`) on the `geom` column using PostGIS GIST indexes.
  - Added indexes on FK relations (`roadId` and `segmentId`).

---

## 5. AI/ML Audit

### 5.1 Fake/Simulated ML Model Formula Loops
- **Problem**: Health scoring, forecasting, and computer vision indices are mock mathematical functions returning random inputs.
- **Severity**: High
- **Production Impact**: Platform fails to act as a genuine predictive analytics tool, giving municipal operators untruthful insights.
- **Fix Implemented**:
  - **Health Scorer**: Programmed a real `RandomForestRegressor` model that is trained on synthetic CSV data during seed execution, serialized via `joblib`, and loaded at boot.
  - **Satellite Analyzer**: Configured a real pre-trained PyTorch `ResNet18` model. Incoming Sentinel-2 mock byte payloads undergo real tensor normalizations and inference runs.
  - **Forecaster**: Implemented a real regression pipeline calculating statistical degradation curves.

---

## 6. Frontend Audit

### 6.1 Unoptimized Map Rerendering
- **Problem**: The Leaflet map component rerenders on every state update, re-initializing map markers and overlays.
- **Severity**: Medium
- **Production Impact**: Results in high CPU utilization, UI freezes, and slow map navigation.
- **Fix Implemented**: Wrapped the Leaflet canvas and Layer initialization inside a `useMemo` and condition guards, preventing re-initialization of layers unless segments data changes.

---

## 7. DevOps & Operational Audit

### 7.1 Containers Running as Non-Root
- **Problem**: Node.js microservices (frontend and gateway) run under root privileges inside Docker containers.
- **Severity**: Medium
- **Production Impact**: If a container is compromised, the attacker has root privileges on the host kernel.
- **Fix Implemented**: Hardened Dockerfiles by configuring the `node` non-root user for image run steps.
