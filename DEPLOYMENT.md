# 🚀 Deployment Guide - parkflow

Complete guide for deploying the parkflow Dashboard to production.

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Local Docker Deployment](#local-docker-deployment)
- [Cloud Deployment Options](#cloud-deployment-options)
- [Environment Variables](#environment-variables)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

- [ ] All `.env` files are configured with production values
- [ ] API keys are secured and NOT in version control
- [ ] Backend has CORS configured for frontend domain
- [ ] Frontend environment variables are set for production server
- [ ] SSL/HTTPS certificate obtained (for production)
- [ ] Database backups exist (if using persistent data)
- [ ] Performance tested with expected load
- [ ] Error monitoring set up (logging service)
- [ ] All build processes tested locally first

---

## Local Docker Deployment

### Prerequisites

```bash
# Install Docker
# Windows: Download Docker Desktop from https://www.docker.com/products/docker-desktop
# macOS: brew install docker
# Linux: Follow Docker installation guide

# Verify installation
docker --version
docker-compose --version
```

### Step 1: Set Up Environment Variables

```powershell
# Windows PowerShell
$env = @"
OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here
"@
$env | Set-Content .env
```

```bash
# macOS/Linux
echo "OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here" > .env
```

### Step 2: Build and Start Containers

```bash
# Navigate to project root
cd "e:\Water park"

# Build images
docker-compose build

# Start services (runs in background)
docker-compose up -d

# View logs (optional)
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Step 3: Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/crowd

### Step 4: Stop Containers

```bash
# Stop all services
docker-compose down

# Stop and remove all data
docker-compose down -v
```

---

## Cloud Deployment Options

### Option 1: Heroku Deployment

#### Create `Procfile` in root directory:

```
web: cd backend && node server.js
```

#### Deploy:

```bash
# Install Heroku CLI
# Windows: https://devcenter.heroku.com/articles/heroku-cli#download-and-install

# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Add environment variable
heroku config:set OPENROUTER_API_KEY=sk-or-v1-your_key_here

# Deploy
git push heroku main
```

#### For Frontend (Static Site):

```bash
# Build frontend
cd waterpark-frontend
npm run build

# Deploy to Netlify, Vercel, or GitHub Pages
# See platform-specific instructions
```

---

### Option 2: AWS Deployment (ECS + CloudFront)

#### Backend (ECS):

1. Create ECR repository
2. Push Docker image: `docker push <aws_account>.dkr.ecr.<region>.amazonaws.com/waterpark-backend`
3. Create ECS task definition using Dockerfile
4. Launch ECS service with Application Load Balancer

#### Frontend (S3 + CloudFront):

1. Build: `npm run build`
2. Upload `dist/` folder to S3 bucket
3. Create CloudFront distribution pointing to S3
4. Configure domain in Route 53

---

### Option 3: DigitalOcean App Platform

```bash
# Create app.yaml in root:
```yaml
name: waterpark-dashboard
services:
  - name: backend
    github:
      repo: your-username/waterpark-repo
      branch: main
    build_command: npm ci
    run_command: cd backend && node server.js
    source_dir: backend
    envs:
      - key: OPENROUTER_API_KEY
        value: ${OPENROUTER_API_KEY}
  
  - name: frontend
    github:
      repo: your-username/waterpark-repo
      branch: main
    build_command: npm ci && npm run build
    source_dir: waterpark-frontend
    http_port: 5173
```

---

### Option 4: Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway init

# Deploy
railway up
```

---

## Environment Variables

### Required Variables

```
OPENROUTER_API_KEY=sk-or-v1-...your_key...  # Get from https://openrouter.ai
```

### Optional Variables

```
# Backend
PORT=5000                              # Default: 5000
NODE_ENV=production                    # Default: development
CORS_ORIGIN=https://yourdomain.com     # Domain for frontend

# Frontend (Vite)
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Setting Variables by Platform

**Docker Compose:**
```yaml
environment:
  - OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
```

**Heroku:**
```bash
heroku config:set OPENROUTER_API_KEY=your_key
heroku config:view
```

**DigitalOcean/Railway:**
Use dashboard UI to set environment variables

**Linux Server:**
```bash
export OPENROUTER_API_KEY="your_key"
node backend/server.js
```

---

## Security Best Practices

### 1. API Key Protection

```javascript
// ✅ DO: Use environment variables
const apiKey = process.env.OPENROUTER_API_KEY;

// ❌ DON'T: Hardcode keys
// const apiKey = "sk-or-v1-...";
```

### 2. CORS Configuration

```javascript
// backend/server.js
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 3. HTTPS/SSL

```bash
# For Docker on Linux with Let's Encrypt
docker run -it --rm --name certbot \
  -v "/etc/letsencrypt:/etc/letsencrypt" \
  -v "/var/lib/letsencrypt:/var/lib/letsencrypt" \
  certbot/certbot certonly --standalone -d yourdomain.com
```

### 4. Environment-Specific Configs

```bash
# Production .env file
NODE_ENV=production
PORT=5000
OPENROUTER_API_KEY=sk-or-v1-...
CORS_ORIGIN=https://yourdomain.com

# Never commit .env files!
```

### 5. Error Logging (Production)

```javascript
// Add to backend/server.js
const logger = (err) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err);
  // Send to external logging service (DataDog, LogRocket, etc.)
};
```

---

## Performance Optimization

### Frontend Build

```bash
# Create optimized production build
cd waterpark-frontend
npm run build

# Check bundle size
ls -lh dist/
```

### Backend Optimization

```bash
# Use production mode
export NODE_ENV=production

# Install production dependencies only
npm ci --only=production

# Use PM2 for process management
npm install -g pm2
pm2 start backend/server.js --name "waterpark"
```

### Caching Strategy

1. **Static Assets**: Cache forever (Vite adds hashes)
2. **API Responses**: Cache crowd data for 5-10 seconds
3. **Database Queries**: Use Redis for ML model caching

---

## Monitoring & Maintenance

### Health Checks

```bash
# Test backend
curl http://localhost:5000/crowd

# Test frontend
curl http://localhost:5173
```

### Logs

```bash
# Docker logs
docker-compose logs backend
docker logs waterpark-backend --tail 100

# System logs
tail -f /var/log/app.log
```

### Updates

```bash
# Update dependencies
npm update

# Test updates locally first
npm audit
npm audit fix
```

---

## Troubleshooting

### Frontend shows blank screen

**Solution:**
- Check browser console for errors
- Verify `VITE_API_BASE_URL` is set correctly
- Ensure backend is running and accessible

### CORS errors in console

**Solution:**
```javascript
// backend/server.js - Update CORS origin
app.use(cors({
  origin: 'https://yourdomain.com',  // Use your actual frontend URL
  credentials: true
}));
```

### Backend won't start

**Solution:**
```bash
# Check port is available
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Use different port
PORT=3000 node server.js
```

### Docker build fails

**Solution:**
```bash
# Clear build cache
docker-compose build --no-cache

# Check Docker daemon is running
docker ps
```

### Out of memory errors

**Solution:**
```bash
# Increase Node.js heap
NODE_OPTIONS=--max-old-space-size=4096 node server.js

# Or in docker-compose.yml
environment:
  - NODE_OPTIONS=--max-old-space-size=2048
```

---

## Support & Resources

- **Docker Documentation**: https://docs.docker.com
- **OpenRouter API**: https://openrouter.ai/docs
- **React/Vite**: https://vitejs.dev
- **Express.js**: https://expressjs.com
- **Deployment Platforms**: 
  - Heroku: https://www.heroku.com
  - DigitalOcean: https://www.digitalocean.com
  - Railway: https://railway.app
  - Vercel: https://vercel.com

---

**Last Updated**: 2024
**Status**: Production Ready
