#!/usr/bin/env bash
set -e

# Render Build Script for parkflow
# This script builds both backend and frontend

echo "=========================================="
echo "🌊 parkflow - Render Build Starting"
echo "=========================================="

# Build Backend
echo ""
echo "📦 Building Backend..."
cd backend
npm install
echo "✓ Backend dependencies installed"
cd ..

# Build Frontend
echo ""
echo "📦 Building Frontend..."
cd waterpark-frontend
npm install
echo "✓ Frontend dependencies installed"

npm run build
echo "✓ Frontend built successfully"
cd ..

echo ""
echo "=========================================="
echo "✅ Build Complete!"
echo "=========================================="
echo ""
echo "Frontend output: waterpark-frontend/dist/"
echo "Ready for deployment on Render!"
