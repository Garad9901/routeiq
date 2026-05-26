# ==============================================================================
# ROUTEIQ LOCAL AUTOMATION STARTUP SYSTEM (POWERSHELL)
# ==============================================================================

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "      ROUTEIQ ENTERPRISE SMART ROAD INTELLIGENCE PLATFORM  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Check Prerequisite commands
$prereqs = @("npm", "node", "python")
foreach ($cmd in $prereqs) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        Write-Error "Required system tool '$cmd' is not installed or missing in your PATH environment."
        exit
    }
}

$hasDocker = $null -ne (Get-Command "docker" -ErrorAction SilentlyContinue)
if (-not $hasDocker) {
    Write-Host "WARNING: Docker was not found in your PATH environment." -ForegroundColor Yellow
    Write-Host "Containerized database startup will be skipped. Ensure PostgreSQL, MongoDB, and Redis are running locally." -ForegroundColor Yellow
} else {
    Write-Host "All system prerequisites validated successfully." -ForegroundColor Green
}

# 2. Setup local environment file
if (-not (Test-Path .env)) {
    Write-Host "No local .env file found. Creating default template from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

# 3. Spin up core databases inside Docker (if available)
if ($hasDocker) {
    Write-Host "Starting PostgreSQL+PostGIS, MongoDB, and Redis via Docker..." -ForegroundColor Yellow
    docker-compose up -d postgres mongodb redis
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to start database containers."
        exit
    }
    # Wait for database health check approvals
    Write-Host "Waiting for database services to pass health probes..." -ForegroundColor Yellow
    Start-Sleep -Seconds 8
} else {
    Write-Host "Skipping Docker database container startup. Connecting to local services..." -ForegroundColor Yellow
}

# 5. Install seed script dependencies locally and run seeder
if (-not (Test-Path node_modules)) {
    Write-Host "Installing root database seeding dependencies..." -ForegroundColor Yellow
    npm install bcryptjs pg mongodb dotenv --no-audit --no-fund
} else {
    Write-Host "Root node_modules already exists. Skipping installer..." -ForegroundColor Green
}

Write-Host "Running database seeding engine..." -ForegroundColor Yellow
node scripts/seed.js
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Database seeding failed. Please check connection logs."
}

# 6. Launch services in dedicated terminal windows for logs visibility
Write-Host "Spawning RouteIQ services in dedicated terminals..." -ForegroundColor Cyan

# Start FastAPI AI service
Write-Host "Starting Python FastAPI AI Service (Port: 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; if (-not (Test-Path .venv)) { Write-Host 'Creating virtual env...'; python -m venv .venv; .venv\Scripts\activate; Write-Host 'Installing dependencies (this may take a few minutes)...'; pip install -r requirements.txt; } else { .venv\Scripts\activate; }; uvicorn app.main:app --reload --port 8000"

# Start NestJS API Gateway
Write-Host "Starting NestJS API Gateway (Port: 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend-gateway; if (-not (Test-Path node_modules)) { Write-Host 'Installing backend dependencies...'; npm install; }; npm run start:dev"

# Start Next.js Frontend
Write-Host "Starting Next.js Frontend Client (Port: 3000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; if (-not (Test-Path node_modules)) { Write-Host 'Installing frontend dependencies...'; npm install; }; npm run dev"

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "   RouteIQ Platform Successfully Launched!" -ForegroundColor Green
Write-Host "   - Live GIS Map Dashboard: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   - API Gateway OpenAPI Documentation: http://localhost:5000/api-docs" -ForegroundColor Cyan
Write-Host "   - FastAPI ML Swagger Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Green
