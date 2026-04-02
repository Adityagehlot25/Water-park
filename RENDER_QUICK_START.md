# ⚡ Quick parkflow Deployment - 5 Steps

Deploy your parkflow app on Render in 15 minutes.

---

## Step 1: Prepare GitHub Repository

```powershell
# Navigate to project
cd "e:\Water park"

# Initialize git (if not already done)
git init

# Add changes
git add .

# Commit
git commit -m "Ready for Render deployment"

# Push to GitHub (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

---

## Step 2: Create Backend Service on Render

1. Go to https://render.com
2. **Sign in with GitHub** (authorize if prompted)
3. Click **New +** → **Web Service**
4. Select your repo and branch
5. Fill in:
   - **Name**: `waterpark-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && node server.js`
   - **Plan**: Free

6. Click **Advanced** and add **Environment Variables**:
   ```
   NODE_ENV = production
   PORT = 5000
   OPENROUTER_API_KEY = sk-or-v1-YOUR_ACTUAL_KEY_HERE
   CORS_ORIGIN = https://waterpark-frontend.onrender.com
   ```

7. Click **Create Web Service**

8. ⏳ Wait for deployment (2-3 minutes)

9. ✅ When it shows "Live ✓", note your backend URL
   - Example: `https://waterpark-backend.onrender.com`

---

## Step 3: Create Frontend Service on Render

1. In Render dashboard, click **New +** → **Web Service**
2. Select same repo and branch
3. Fill in:
   - **Name**: `waterpark-frontend`
   - **Environment**: `Node`
   - **Build Command**: `cd waterpark-frontend && npm install && npm run build`
   - **Start Command**: `npm install -g serve && serve -s dist -l 5173`
   - **Plan**: Free

4. Click **Advanced** and add **Environment Variables**:
   ```
   VITE_API_BASE_URL = https://waterpark-backend.onrender.com
   ```
   (Replace with your actual backend URL from Step 2)

5. Click **Create Web Service**

6. ⏳ Wait for deployment (3-5 minutes)

- Open: `https://waterpark-frontend.onrender.com`
- You should see the parkflow Dashboard

---

## Step 4: Test Your Deployment

### Frontend Test
- Open: `https://waterpark-frontend.onrender.com`
- You should see the parkflow Dashboard
- Should see rides, crowd data updating

### Backend Test
```bash
curl https://waterpark-backend.onrender.com/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Chat Test
- Click chat icon in app
- Send a message
- Should get AI response

### If Something's Wrong
- Check backend logs: Service → Logs
- Check frontend logs: Service → Logs
- Verify environment variables are set correctly

---

## Step 5: Deploy Updates (In the Future)

That's it! Future deployments are automatic:

```bash
# Make changes locally
# Then just push to GitHub:
git add .
git commit -m "Description of changes"
git push origin main

# Render automatically rebuilds and deploys!
# (Takes 1-2 minutes)
```

---

## Important Notes

### 🔑 Your API Key
**Important!** Don't commit your `.env` file with the real API key to GitHub.

In Render dashboard:
- Go to Backend service → **Settings** → **Environment**
- Only the API key should be visible
- Never put it in your code!

### 🌐 CORS Configuration
If frontend can't reach backend, check:
1. Backend service settings
2. `CORS_ORIGIN` should be your frontend URL
3. Should look like: `https://waterpark-frontend.onrender.com`

### ⏰ Free Tier Cold Starts
- Free tier services sleep after 15 min of no activity
- First request wakes them (takes ~30 seconds)
- For production, upgrade to Starter plan ($7/month)

### 📞 Need Help?
Full guide: See **RENDER_DEPLOYMENT.md** for complete instructions

---

## Cost Estimate

| Plan | Backend | Frontend | Total |
|------|---------|----------|-------|
| Free | $0 | $0 | **$0/month** ✓ |
| Starter | $7 | $7 | **$14/month** |

Free tier is perfect for testing!

---

**Deployment time: 15-20 minutes ⏱️**

You're done! 🎉
