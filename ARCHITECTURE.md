# RouteIQ Architecture Guide

This document describes the design systems, databases, and communication protocols of the RouteIQ smart road intelligence platform.

## Clean Architecture Layers

RouteIQ enforces a decoupled Clean Architecture layout to separate business domains from external frameworks:

1. **Domain Layer**: Contains fundamental entities (like `User`, `RoadSegment`, `Complaint`) and mathematical/statistical interfaces. It remains independent of any database engine or API server framework.
2. **Application Layer**: Implements use-cases, core ML schedulers, query handlers, and DTO structures. 
3. **Infrastructure Layer**: Enforces the actual implementations:
   - Database operations (TypeORM PostgreSQL PostGIS, Mongoose MongoDB).
   - Core ML models pipelines execution (PyTorch ResNet, XGBoost regressor).
   - Ingress web routing controllers (NestJS and FastAPI routers).

## Data Flow Diagrams

```
[ Next.js Client ]
       │  (1) Triggers road segment CV/Scoring analysis
       ▼
[ Nginx Ingress ] 
       │  (2) Proxies `/api/v1/roads/:id/analyze`
       ▼
[ NestJS Gateway ] (HTTP request validator)
       │  (3) Queries Postgres for segment metadata
       │  (4) Posts normalized attributes to ML service
       ▼
[ FastAPI ML Service ] (Runs models)
       │  (5) Loads XGBoost regressor, runs inference
       │  (6) Formulates SHAP explanation array
       │  (7) Returns predictions to NestJS Gateway
       ▼
[ NestJS Gateway ] 
       │  (8) Updates PostgreSQL road health values
       │  (9) Emits real-time Websocket notification
       ▼
[ Next.js Client ] (Dynamic map overlay neon rerender)
```

## Databases Division

- **PostgreSQL + PostGIS (Spatial)**: Maintains geo-referenced road coordinates, LineStrings, and structured audit logs. Spatial queries utilize GIST indices.
- **MongoDB (Semi-Structured)**: Stores citizen complaint tickets, image metadata, and weather condition metrics. Exposes geospatial 2dsphere indexes.
- **Redis (Cache & Sessions)**: Caches session authorization states, revoking compromised JWT keys, and holds active rate-limiting statistics.
