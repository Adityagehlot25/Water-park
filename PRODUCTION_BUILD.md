# 🏗️ Production Build & Deployment

Quick reference for building and deploying parkflow.

---

## Quick Commands

### Local Development Build

```bash
# Install dependencies
cd backend && npm install && cd ..
cd waterpark-frontend && npm install && cd ..

# Create .env with API key
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE" > backend/.env
echo "VITE_API_BASE_URL=http://localhost:5000" > waterpark-frontend/.env.local

# Run
cd backend && npm start &
cd waterpark-frontend && npm run dev
```

### Production Build (Local)

```bash
# Frontend production build
cd waterpark-frontend
npm run build
# Output: dist/ folder ready for deployment

# Backend: No build needed, uses npm dependencies directly
cd ../backend
npm ci --only=production
```

---

## Docker Build

### Build Images

```bash
# Build both images
docker-compose build

# Build specific service
docker-compose build backend     # or frontend
```

### Run with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Push to Docker Hub

```bash
# Tag image
docker tag waterpark-backend:latest YourUsername/waterpark-backend:1.0.0

# Login to Docker Hub
docker login

# Push
docker push YourUsername/waterpark-backend:1.0.0
```

---

## Environment Variables

### Required

```
OPENROUTER_API_KEY=sk-or-v1-your_actual_key
```

### Optional (Frontend)

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Optional (Backend)

```
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://yourdomain.com
```

---

## Frontend Deployment Platforms

### Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
# Or use: netlify deploy --prod --dir=dist
```

### Vercel

```bash
npm i -g vercel
vercel
```

### AWS S3 + CloudFront

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name/
```

---

## Backend Deployment Platforms

### Railway

```bash
railway login
railway init
railway up
```

### Render

```
1. Connect GitHub repo to Render
2. Set environment variables
3. Deploy
```

### AWS

- ECS for containers
- Lambda for serverless
- RDS for database (if needed)

---

## Verification

### Health Checks

```bash
# Backend alive?
curl http://localhost:5000/health

# Frontend accessible?
curl http://localhost:5173
```

### Test API Endpoints

```bash
curl http://localhost:5000/rides
curl http://localhost:5000/crowd
curl http://localhost:5000/wait-times
```

---

## Performance Tips

- Minify frontend: `npm run build` (Vite handles this)
- Use Node production mode: `NODE_ENV=production`
- Enable gzip compression in frontend build
- Cache static assets (Vite adds hashes automatically)
- Monitor API response times: `X-Response-Time` header

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Port already in use | Change PORT in .env or stop existing process |
| Frontend blank screen | Check VITE_API_BASE_URL matches backend URL |
| CORS errors | Verify CORS_ORIGIN matches frontend domain |
| Out of memory | Increase Node heap: `NODE_OPTIONS=--max-old-space-size=2048` |
| Docker build fails | `docker-compose build --no-cache` |

---

## See Also

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment guide
- [README.md](./README.md) - Project overview
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
