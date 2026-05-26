@echo off
title RouteIQ Enterprise Startup Launcher
echo ==========================================================
echo       ROUTEIQ ENTERPRISE SMART ROAD INTELLIGENCE PLATFORM  
echo ==========================================================
echo.
echo Launching PowerShell Automation Script...
powershell -ExecutionPolicy Bypass -File "%~dp0start-routeiq.ps1"
pause
