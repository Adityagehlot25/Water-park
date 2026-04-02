# 🚀 Render Deployment Guide

Complete step-by-step guide to deploy parkflow on Render.

---

## Prerequisites

1. ✅ GitHub account (free)
2. ✅ Render account (sign up at https://render.com - free tier available)
3. ✅ Your project pushed to GitHub
4. ✅ OpenRouter API key (get free key at https://openrouter.ai)

---

## Step 1: Prepare Your Project for Render

### 1.1 Create `render.yaml` File

This file tells Render how to build and deploy your services.

```yaml
# render.yaml - Add to project root
services:
  - type: web
    name: waterpark-backend
    runtime: node
    plan: free
    buildCommand: cd backend && npm install
    startCommand: cd backend && node server.js
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        defaultValue: "5000"
      - key: OPENROUTER_API_KEY
        sync: false
      - key: CORS_ORIGIN
        value: https://waterpark-frontend.onrender.com

  - type: web
    name: waterpark-frontend
    runtime: node
    plan: free
    buildCommand: cd waterpark-frontend && npm install && npm run build
    startCommand: cd waterpark-frontend && npm install -g serve && serve -s dist -l 5173
    envVars:
      - key: VITE_API_BASE_URL
        value: https://waterpark-backend.onrender.com
```

Save this as `render.yaml` in your project root.

### 1.2 Create `render-build.sh` (Optional - for complex builds)

This is optional but recommended for better control:

```bash
#!/usr/bin/env bash
set -e

echo "Building backend..."
cd backend
npm install
npm run build 2>/dev/null || true
cd ..

echo "Building frontend..."
cd waterpark-frontend
npm install
npm run build
cd ..

echo "Build complete!"
```

Save as `render-build.sh` and make executable.

### 1.3 Push Code to GitHub

```bash
# Initialize git (if not already done)
git init

# Add files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Push to GitHub (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Backend on Render

### 2.1 Sign In to Render

1. Go to https://render.com
2. Click "Sign in with GitHub" or "Sign up"
3. Accept permissions to access your GitHub account

### 2.2 Create Backend Service

1. Click **New +** → **Web Service**
2. Select your repository: `REPO_NAME` / `main`
3. Configure:
   - **Name**: `waterpark-backend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     cd backend && npm install
     ```
   - **Start Command**: 
     ```
     cd backend && node server.js
     ```
   - **Plan**: Free (or Starter for better performance)

### 2.3 Set Backend Environment Variables

1. Scroll down to **Environment Variables**
2. Add these variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `OPENROUTER_API_KEY` | `sk-or-v1-your_actual_key` |
| `CORS_ORIGIN` | `https://waterpark-frontend.onrender.com` |

3. Click **Create Web Service**

### 2.4 Wait for Backend Deploy

- Render will automatically:
  - Clone your repository
  - Install dependencies
  - Build and deploy
  - Assign you a domain like: `https://waterpark-backend.onrender.com`

- **Status page**: Shows "Live ✓" when ready (2-3 minutes)

### 2.5 Test Backend

```bash
# Check if backend is live
curl https://waterpark-backend.onrender.com/health

# Should return: {"status":"ok","timestamp":"..."}
```

---

## Step 3: Create Frontend on Render

### 3.1 Start Frontend Service

1. Go to https://dashboard.render.com
2. Click **New +** → **Web Service**
3. Select same repository
4. Configure:
   - **Name**: `waterpark-frontend`
   - **Environment**: `Node`
   - **Build Command**: 
     ```
     cd waterpark-frontend && npm install && npm run build
     ```
   - **Start Command**: 
     ```
     npm install -g serve && serve -s dist -l 5173
     ```
   - **Plan**: Free

### 3.2 Set Frontend Environment Variables

1. Scroll to **Environment Variables**
2. Add:

| Key | Value |
|-----|-------|
| `VITE_API_BASE_URL` | `https://waterpark-backend.onrender.com` |

3. Click **Create Web Service**

### 3.3 Wait for Frontend Deploy

- Render deploys automatically
- You'll get a domain: `https://waterpark-frontend.onrender.com`
- Takes 3-5 minutes

### 3.4 Test Frontend

Open in browser: `https://waterpark-frontend.onrender.com`

---

## Step 4: Configure Custom Domain (Optional)

### 4.1 Link Your Domain

1. Go to your Render service dashboard
2. Click service name → **Settings**
3. Scroll to **Custom Domain**
4. Enter your domain: `myapp.com`
5. Note the CNAME: `myapp.com.onrender.com`

### 4.2 Update DNS

1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add CNAME record:
   - **Name**: `myapp` (or `@` for root)
   - **Value**: `myapp.com.onrender.com`
3. Wait 24-48 hours for DNS propagation

---

## Step 5: Enable Auto-Deploy from GitHub

### 5.1 Set Up Auto-Deployments

Each service should deploy automatically when you push to GitHub.

**To verify auto-deploy is enabled:**

1. Go to service dashboard
2. Click **Settings**
3. Under "Deploy settings", confirm:
   - **Auto-deploy** is "Yes"
   - Branch is "main"

### 5.2 Deploy Future Changes

Just push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render automatically rebuilds and deploys within 1-2 minutes!

---

## Step 6: Monitor & Troubleshoot

### 6.1 View Logs

1. Go to service dashboard
2. Click **Logs** tab
3. See real-time deployment and runtime logs

### 6.2 Common Issues & Fixes

**❌ Frontend shows blank screen**
```
Solution:
1. Check browser console (F12) for errors
2. Verify VITE_API_BASE_URL is set correctly
3. Check backend is actually running
4. Go to backend logs and look for errors
```

**❌ "CORS error" or API not connecting**
```
Solution:
1. Go to backend service → Environment
2. Verify CORS_ORIGIN matches frontend URL
3. If changed, rebuild frontend
4. Frontend URL is like: https://waterpark-frontend.onrender.com
```

**❌ Backend crashes or shows "Render unexpectedly shut down"**
```
Solution:
1. Check backend logs for error messages
2. Verify OPENROUTER_API_KEY is set (not empty)
3. Free tier has memory limits - check memory usage
4. If issue persists, upgrade to Starter plan
```

**❌ Deployment takes too long**
```
Solution:
1. This is normal on free tier (3-5 min)
2. Free tier has slower build servers
3. Upgrade to Starter plan for faster builds
```

**❌ "Build failed" or npm errors**
```
Solution:
1. Check logs for exact error
2. Verify package.json has all dependencies
3. Run locally: npm install && npm run build
4. Fix any errors locally first
5. Push to GitHub again
```

---

## Step 7: Production Checklist

Before considering deployment complete:

- [ ] ✅ Backend service shows "Live ✓"
- [ ] ✅ Frontend service shows "Live ✓"
- [ ] ✅ Can access frontend URL in browser
- [ ] ✅ Frontend connects to backend (no blank screen)
- [ ] ✅ Chat feature works (shows bot messages)
- [ ] ✅ Park map loads with rides
- [ ] ✅ Crowd data updates in real-time
- [ ] ✅ Itinerary planner creates plans
- [ ] ✅ Health endpoint responds: `curl https://waterpark-backend.onrender.com/health`
- [ ] ✅ No console errors in browser (F12)
- [ ] ✅ No error 500s in backend logs

---

## Step 8: Post-Deployment

### 8.1 Set Up Alerts (Optional)

1. Go to service → **Settings**
2. Scroll to "Notifications"
3. Enable email alerts for service crashes

### 8.2 Monitor Performance

Free tier Render services go to sleep after 15 min of inactivity. They wake up on first request (takes 30s).

To keep service always active, upgrade to Starter plan ($7/month).

### 8.3 Keep Updated

When you make changes to code:

```bash
# Push to GitHub - Render automatically deploys!
git add .
git commit -m "description"
git push origin main
```

### 8.4 View Render Dashboard

Monitor both services at: https://dashboard.render.com

---

## Alternative: Deploy with render.yaml from UI

Instead of manual setup, you can use the `render.yaml` file:

### Option A: Using Infrastructure as Code

1. Create `render.yaml` in project root (see Step 1.1)
2. Go to https://render.com/new
3. Select "Blueprint" 
4. Connect your GitHub repository
5. Name the blueprint: `aqua-imagicaa`
6. Click "Create Blueprint Instance"
7. Render creates both services automatically!

---

## Scaling Guide

### Free Tier Limitations
- Sleep after 15 min inactivity
- 0.5 CPU, 512MB RAM
- 100GB outbound bandwidth/month
- Good for: Testing, low-traffic demo

### Starter Plan ($7/month each service)
- Always on (no sleep)
- 0.5 CPU, 512MB RAM
- Great for: Low-traffic production
- No inactivity downtime

### Pro Plan ($25+/month)
- Higher resources
- Better for: Medium traffic
- Custom domains included

---

## Estimate Your Costs

| Component | Plan | Cost |
|-----------|------|------|
| Backend | Free | $0 |
| Frontend | Free | $0 |
| **Total** | | **$0/month** |

Free tier is good for testing! When ready for production:

| Component | Plan | Cost |
|-----------|------|------|
| Backend | Starter | $7 |
| Frontend | Starter | $7 |
| **Total** | | **$14/month** |

---

## Links & Resources

- **Render Docs**: https://render.com/docs
- **Render Dashboard**: https://dashboard.render.com
- **Get API Key**: https://openrouter.ai
- **GitHub**: https://github.com

---

## Quick Reference: Top 5 Things to Remember

1. 🔑 Set `OPENROUTER_API_KEY` in backend environment
2. 🌐 Set `CORS_ORIGIN` to your frontend URL
3. 📍 Copy backend URL → set as frontend's `VITE_API_BASE_URL`
4. 🚀 Auto-deploy works! Just `git push` to deploy
5. 🆓 Free tier services sleep - upgrade to Starter for production

---

**Estimated time to deploy: 15-20 minutes**

Good luck! 🎉
