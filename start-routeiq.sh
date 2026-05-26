#!/bin/bash

# ==============================================================================
# ROUTEIQ LOCAL AUTOMATION STARTUP SYSTEM (BASH)
# ==============================================================================

echo -e "\e[36m==========================================================\e[0m"
echo -e "\e[36m      ROUTEIQ ENTERPRISE SMART ROAD INTELLIGENCE PLATFORM  \e[0m"
echo -e "\e[36m==========================================================\e[0m"

# 1. Check Prerequisite commands
prereqs=("npm" "node" "python3")
for cmd in "${prereqs[@]}"; do
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "\e[31mError: Required system tool '$cmd' is not installed or missing in PATH.\e[0m"
        exit 1
    fi
done

if ! command -v docker &> /dev/null; then
    echo -e "\e[33mWARNING: Docker was not found in your PATH environment.\e[0m"
    echo -e "\e[33mContainerized database startup will be skipped. Ensure PostgreSQL, MongoDB, and Redis are running locally.\e[0m"
    has_docker=false
else
    echo -e "\e[32mAll system prerequisites validated successfully.\e[0m"
    has_docker=true
fi

# 2. Setup local environment file
if [ ! -f .env ]; then
    echo -e "\e[33mNo local .env file found. Creating default template from .env.example...\e[0m"
    cp .env.example .env
fi

# 3. Spin up core databases inside Docker (if available)
if [ "$has_docker" = true ]; then
    echo -e "\e[33mStarting PostgreSQL+PostGIS, MongoDB, and Redis via Docker...\e[0m"
    docker-compose up -d postgres mongodb redis
    if [ $? -ne 0 ]; then
        echo -e "\e[31mError: Failed to start database containers.\e[0m"
        exit 1
    fi
    # Wait for database health check approvals
    echo -e "\e[33mWaiting for database services to pass health probes...\e[0m"
    sleep 8
else
    echo -e "\e[33mSkipping Docker database container startup. Connecting to local services...\e[0m"
fi

# 5. Install seed script dependencies locally and run seeder
if [ ! -d "node_modules" ]; then
    echo -e "\e[33mInstalling root database seeding dependencies...\e[0m"
    npm install bcryptjs pg mongodb dotenv --no-audit --no-fund
else
    echo -e "\e[32mRoot node_modules already exists. Skipping installer...\e[0m"
fi

echo -e "\e[33mRunning database seeding engine...\e[0m"
node scripts/seed.js

# 6. Launch services in background
echo -e "\e[36mStarting RouteIQ microservices in background...\e[0m"

# Start FastAPI AI service
echo -e "\e[32mStarting Python FastAPI AI Service (Port: 8000)...\e[0m"
cd ai-service
if [ ! -d ".venv" ]; then
    echo -e "\e[33mCreating virtual env and installing dependencies (this may take a few minutes)...\e[0m"
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi
uvicorn app.main:app --port 8000 > ../fastapi.log 2>&1 &
cd ..

# Start NestJS API Gateway
echo -e "\e[32mStarting NestJS API Gateway (Port: 5000)...\e[0m"
cd backend-gateway
if [ ! -d "node_modules" ]; then
    echo -e "\e[33mInstalling backend dependencies...\e[0m"
    npm install
fi
npm run start:dev > ../nestjs.log 2>&1 &
cd ..

# Start Next.js Frontend
echo -e "\e[32mStarting Next.js Frontend Client (Port: 3000)...\e[0m"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "\e[33mInstalling frontend dependencies...\e[0m"
    npm install
fi
npm run dev > ../nextjs.log 2>&1 &
cd ..

echo -e "\e[32m==========================================================\e[0m"
echo -e "\e[32m   RouteIQ Platform Successfully Launched in Background!\e[0m"
echo -e "\e[36m   - Logs captured in root *.log files\e[0m"
echo -e "\e[36m   - Live GIS Map Dashboard: http://localhost:3000\e[0m"
echo -e "\e[36m   - API Gateway OpenAPI Documentation: http://localhost:5000/api-docs\e[0m"
echo -e "\e[36m   - FastAPI ML Swagger Docs: http://localhost:8000/docs\e[0m"
echo -e "\e[32m==========================================================\e[0m"
echo "Press Ctrl+C to stop this shell. (Background processes will continue to run)"
