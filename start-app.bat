@echo off
title i-SOFTZONE Startup Launcher
echo ===================================================
echo 🚀 i-SOFTZONE: Starting Enterprise Application...
echo ===================================================

:: 1. Launch Backend Server
echo 📂 Launching Backend API Server (Port 4000)...
start "i-SOFTZONE Backend API" cmd /k "cd I-soft-Project\backend && npm run dev"

:: 2. Launch Frontend Server
echo 📂 Launching Frontend React App (Port 5182)...
start "i-SOFTZONE Frontend Web" cmd /k "cd I-soft-Project\frontend && npm run dev"

echo ===================================================
echo 🎉 Both servers triggered!
echo 🔗 Access the application at: http://localhost:5182/
echo ===================================================
timeout /t 5
