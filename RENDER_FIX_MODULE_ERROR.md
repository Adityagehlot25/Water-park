# 🔧 Render Deployment - Module Not Found Error Fix

If you see this error during Render deployment:

```
Error: Cannot find module '../services/dataLoader'
Require stack:
- /opt/render/project/src/backend/routes/itinerary.js
```

This guide will help you fix it.

---

## 🎯 The Problem

Render was using an incorrect directory configuration in `render.yaml`, causing module paths to break.

---

## ✅ The Solution

### Step 1: Update `render.yaml`

I've already fixed your `render.yaml` file. The key changes:

**OLD (Broken):**
```yaml
buildCommand: cd backend && npm install
startCommand: cd backend && node server.js
```

**NEW (Fixed):**
```yaml
root: backend
buildCommand: npm install
startCommand: node server.js
```

The `root: backend` property tells Render to use the `backend` directory as the working directory, which fixes the module resolution.

### Step 2: Push Updated Files to GitHub

```bash
cd "e:\Water park"

# Add the updated files
git add render.yaml RENDER_DEPLOYMENT.md RENDER_QUICK_START.md

# Commit
git commit -m "Fix Render deployment configuration with root directory"

# Push
git push origin main
```

### Step 3: Redeploy on Render

1. Go to https://dashboard.render.com
2. Click your `parkflow-backend` service
3. Click **Deploys** tab
4. Click **"Deploy latest commit"** button
5. Wait 2-3 minutes for redeployment

### Step 4: Verify Success

```bash
# Check backend health
curl https://parkflow-backend.onrender.com/health

# Should see: {"status":"ok","timestamp":"2026-04-02T..."}
```

---

## 📋 What Changed in render.yaml

Each service now uses the `root` property:

```yaml
services:
  - type: web
    name: parkflow-backend
    runtime: node
    plan: free
    root: backend                    # ← This tells Render the working directory
    buildCommand: npm install         # ← No more "cd backend"
    startCommand: node server.js      # ← Works from backend/ directory

  - type: web
    name: parkflow-frontend
    runtime: node
    plan: free
    root: waterpark-frontend          # ← Frontend root directory
    buildCommand: npm install && npm run build
    startCommand: npm install -g serve && serve -s dist -l 5173
```

---

## Why This Fixes the Error

**Before (Broken):**
1. Render uploads code to `/opt/render/project/`
2. Build command does: `cd backend && npm install`
3. But Render's working directory becomes `/opt/render/project/src/backend/`
4. Module paths like `../services/dataLoader` break

**After (Fixed):**
1. Render uploads code to `/opt/render/project/`
2. Specifying `root: backend` sets that as working directory
3. Build runs from the correct location
4. Module paths resolve correctly: `../services/dataLoader` ✅

---

## If It Still Doesn't Work

Check these things:

### Issue 1: Old deploy still running
- Go to service → **Settings** → **Environment**
- Verify all variables are set correctly:
  - `OPENROUTER_API_KEY` should be set
  - `CORS_ORIGIN` should be `https://parkflow-frontend.onrender.com`

### Issue 2: Cache issue
- Go to service → **Settings**
- Click **"Clear Build Cache"**
- Then click **"Deploy Latest Commit"**

### Issue 3: Check logs for details
- Go to service → **Logs**
- Look for any error messages
- Share those logs for further debugging

### Issue 3: Manual redeploy
- Click **"Deploy"** dropdown
- Select **"Clear build cache and deploy"**
- This forces a complete fresh build

---

## Common Solution Checklist

- [ ] Updated `render.yaml` locally
- [ ] Pushed changes to GitHub (`git push`)
- [ ] Clicked "Deploy Latest Commit" on Render dashboard
- [ ] Waited 3-5 minutes for deployment
- [ ] Checked backend health: `curl https://parkflow-backend.onrender.com/health`
- [ ] Verified `OPENROUTER_API_KEY` environment variable is set
- [ ] Frontend `VITE_API_BASE_URL` points to correct backend URL

---

## Verification Steps

Once deployment completes:

```bash
# 1. Check backend is alive
curl https://parkflow-backend.onrender.com/health
# Response: {"status":"ok","timestamp":"..."}

# 2. Check rides endpoint
curl https://parkflow-backend.onrender.com/rides
# Response: JSON with ride data

# 3. Check frontend
open https://parkflow-frontend.onrender.com
# Should show: Aqua Imagicaa Live Dashboard with map and rides
```

---

## Need More Help?

- **Check logs**: Service Dashboard → Logs tab
- **Render docs**: https://render.com/docs
- **GitHub**: Verify `render.yaml` is at repo root (not in a subfolder)

---

**Your issue is now fixed!** Next deployment should work. 🚀
