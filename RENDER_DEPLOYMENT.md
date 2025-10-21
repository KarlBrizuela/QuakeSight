# 🚀 QuakeSight Render.com Deployment Guide

## Why Render.com?

Render.com is perfect for QuakeSight because:
- ✅ **All-in-One Platform** - Host both backend and frontend
- ✅ **Blueprint Deployment** - One-click deploy from `render.yaml`
- ✅ **Free Tier** - 750 hours/month free for backend
- ✅ **Auto-Deploy** - Push to GitHub, Render auto-deploys
- ✅ **Built-in HTTPS** - Free SSL certificates
- ✅ **Easy Setup** - No complex configuration needed

---

## 📋 Quick Start (5 Minutes)

### **Prerequisites**
- ✅ GitHub account
- ✅ QuakeSight repository on GitHub
- ✅ All changes committed and pushed

### **Step-by-Step Deployment**

#### **1. Sign Up for Render**
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub
4. Authorize Render to access your repositories

#### **2. Deploy Using Blueprint (Recommended)**

**Option A: Automatic Blueprint Detection**
1. Click "New" → "Blueprint"
2. Connect your QuakeSight repository
3. Render will detect `render.yaml` automatically
4. Click "Apply"
5. Both services deploy automatically! 🎉

**Option B: Manual Service Creation**
If blueprint doesn't work, create services manually (see below).

---

## 🔧 Manual Deployment (If Blueprint Fails)

### **Deploy Backend First**

#### **Step 1: Create Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure service:

**Basic Settings:**
- **Name:** `quakesight-backend`
- **Region:** Oregon (or closest to you)
- **Branch:** `main` or `bands`
- **Root Directory:** `backend`
- **Runtime:** `Python 3`

**Build & Deploy:**
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `gunicorn app:app`

**Environment Variables:** (Click "Advanced" → "Add Environment Variable")
```
FLASK_ENV=production
ALLOWED_ORIGINS=https://quakesight-frontend.onrender.com,http://localhost:3000
```

**Plan:**
- Select **Free** plan

4. Click "Create Web Service"
5. Wait for deployment (3-5 minutes)
6. Copy your backend URL (e.g., `https://quakesight-backend.onrender.com`)

#### **Step 2: Test Backend**
Once deployed, test the health endpoint:
```
https://quakesight-backend.onrender.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "QuakeSight XGBoost API"
}
```

---

### **Deploy Frontend**

#### **Step 1: Create Static Site**
1. Click "New +" → "Static Site"
2. Connect your GitHub repository (same repo)
3. Configure site:

**Basic Settings:**
- **Name:** `quakesight-frontend`
- **Branch:** `main` or `bands`
- **Root Directory:** Leave blank (uses repository root)

**Build & Deploy:**
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `build`

**Environment Variables:**
Add these in the "Environment" section:
```
REACT_APP_API_URL=https://quakesight-backend.onrender.com
```

(Add Firebase variables if you have them)

4. Click "Create Static Site"
5. Wait for deployment (3-5 minutes)
6. Your frontend is live at `https://quakesight-frontend.onrender.com`

---

## 🔗 Connect Backend and Frontend

After both services are deployed:

### **Step 1: Update Backend CORS**
1. Go to your backend service on Render
2. Click "Environment"
3. Update `ALLOWED_ORIGINS` to include your frontend URL:
   ```
   https://quakesight-frontend.onrender.com,http://localhost:3000
   ```
4. Click "Save Changes"
5. Render will automatically redeploy

### **Step 2: Verify Connection**
1. Open your frontend URL
2. Navigate to "Prediction History"
3. Click "Predict" on any saved assessment
4. Select timeframe (5 or 10 years)
5. Click "Generate Prediction"
6. Should successfully load XGBoost predictions! ✅

---

## 📁 Important Files for Render

### **`render.yaml` (Blueprint Configuration)**
Already created! This file tells Render how to deploy both services:
```yaml
services:
  - type: web
    name: quakesight-backend
    env: python
    rootDir: backend
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn app:app
    
  - type: web
    name: quakesight-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./build
```

### **`backend/Procfile`**
Backup for platforms that need it:
```
web: gunicorn app:app
```

### **`backend/requirements.txt`**
Includes `gunicorn` for production:
```
flask==3.0.0
xgboost==3.1.0
gunicorn==21.2.0
...
```

---

## 🌐 Environment Variables

### **Backend Environment Variables**
Set these in Render backend service:

| Variable | Value | Description |
|----------|-------|-------------|
| `FLASK_ENV` | `production` | Run in production mode |
| `ALLOWED_ORIGINS` | `https://your-frontend.onrender.com,http://localhost:3000` | CORS allowed origins |
| `PORT` | (auto-set by Render) | Server port |

### **Frontend Environment Variables**
Set these in Render static site:

| Variable | Value | Description |
|----------|-------|-------------|
| `REACT_APP_API_URL` | `https://quakesight-backend.onrender.com` | Backend API URL |
| `REACT_APP_FIREBASE_API_KEY` | Your Firebase key | Firebase config |
| `REACT_APP_FIREBASE_PROJECT_ID` | Your project ID | Firebase config |

---

## 🔍 Monitoring Your Services

### **Backend Logs**
1. Go to Render dashboard
2. Click on `quakesight-backend`
3. Click "Logs" tab
4. View real-time logs

**What to look for:**
- ✅ "XGBoost model trained successfully!"
- ✅ "Starting QuakeSight XGBoost API on port 5000"
- ✅ No Python errors

### **Frontend Build Logs**
1. Go to Render dashboard
2. Click on `quakesight-frontend`
3. Click "Events" tab
4. View deployment history

### **Health Monitoring**
Render automatically monitors your backend:
- Sends requests to `/api/health`
- Shows "Live" status when healthy
- Auto-restarts if service crashes

---

## ⚡ Performance Tips

### **Backend Optimization**
1. **Keep Service Awake:** Free tier services sleep after 15 minutes of inactivity
   - First request after sleep takes ~30 seconds
   - Consider upgrading to Starter plan ($7/month) to keep always-on

2. **Reduce Cold Start Time:**
   - Model loads on startup (~10 seconds)
   - Consider caching model in Redis (advanced)

### **Frontend Optimization**
1. **CDN:** Render automatically serves your frontend via CDN
2. **Caching:** Static files cached at edge locations
3. **Compression:** Automatic Brotli/Gzip compression

---

## 💰 Render Pricing

### **Free Tier**
Perfect for QuakeSight:

**Backend (Web Service):**
- 750 hours/month (enough for always-on)
- 512 MB RAM
- Shared CPU
- **Limitation:** Spins down after 15 min inactivity

**Frontend (Static Site):**
- Unlimited builds
- 100 GB bandwidth/month
- Global CDN
- No sleep/limitations

### **Paid Plans** (Optional)
**Starter ($7/month):**
- No sleep/spin down
- Better for production use
- Faster cold starts

---

## 🐛 Troubleshooting

### **Problem: Backend build fails**
**Solution:**
1. Check logs for Python errors
2. Verify `requirements.txt` is in `backend/` folder
3. Ensure `gunicorn` is in requirements
4. Check Python version compatibility

### **Problem: Frontend can't reach backend**
**Solution:**
1. Verify `REACT_APP_API_URL` is set correctly
2. Check backend CORS settings include frontend URL
3. Ensure backend is showing "Live" status
4. Check browser console for CORS errors

### **Problem: Backend shows "Live" but predictions fail**
**Solution:**
1. Check backend logs for model loading errors
2. Verify memory isn't exhausted (XGBoost needs ~500MB)
3. Test health endpoint directly
4. Check request/response in Network tab

### **Problem: Service spins down too often**
**Solutions:**
1. Upgrade to Starter plan ($7/month)
2. Set up a cron job to ping health endpoint every 10 minutes
3. Use a service like UptimeRobot to keep it alive

---

## 🔄 Auto-Deploy Setup

Enable automatic deployments when you push to GitHub:

### **Backend Auto-Deploy**
1. Go to backend service
2. Click "Settings"
3. Under "Build & Deploy":
   - ✅ "Auto-Deploy" should be **Yes**
   - Set branch to `main` or `bands`
4. Now pushing to GitHub triggers deployment!

### **Frontend Auto-Deploy**
1. Go to frontend static site
2. Click "Settings"
3. Same process as backend

**Workflow:**
```bash
git add .
git commit -m "Update feature"
git push origin main
# Render automatically detects push and deploys!
```

---

## 📊 Deployment Dashboard

### **Backend Service Dashboard**
Shows:
- ✅ Deployment status (Live/Building/Failed)
- ✅ Health check status
- ✅ Resource usage (CPU, Memory)
- ✅ Request metrics
- ✅ Recent logs

### **Frontend Dashboard**
Shows:
- ✅ Build status
- ✅ Deploy history
- ✅ Bandwidth usage
- ✅ Build logs

---

## ✅ Post-Deployment Checklist

After both services are deployed:

- [ ] Backend health check returns 200
- [ ] Frontend loads without errors
- [ ] Can create new risk assessments
- [ ] Can save to Firebase
- [ ] Can view prediction history
- [ ] Future predictions work (5 & 10 years)
- [ ] No CORS errors in browser console
- [ ] All API calls return in < 10 seconds
- [ ] Both services show "Live" status

---

## 🎯 Your Live URLs

After deployment, you'll have:

**Backend API:**
```
https://quakesight-backend.onrender.com
https://quakesight-backend.onrender.com/api/health
https://quakesight-backend.onrender.com/api/predict
```

**Frontend App:**
```
https://quakesight-frontend.onrender.com
```

---

## 🔧 Custom Domain (Optional)

Want to use your own domain?

### **Backend Custom Domain**
1. Go to backend service → Settings → Custom Domains
2. Add your domain (e.g., `api.quakesight.com`)
3. Add CNAME record in your DNS:
   - Name: `api`
   - Value: `quakesight-backend.onrender.com`

### **Frontend Custom Domain**
1. Go to frontend site → Settings → Custom Domains
2. Add your domain (e.g., `quakesight.com`)
3. Add CNAME record:
   - Name: `@` or `www`
   - Value: `quakesight-frontend.onrender.com`

---

## 📱 Testing Your Deployed App

### **1. Health Check (Backend)**
```powershell
Invoke-WebRequest https://quakesight-backend.onrender.com/api/health
```

### **2. Test Prediction API**
```powershell
$body = @{
    fault_proximity = 15.5
    historical_quakes = 25
    max_magnitude = 6.8
    soil_risk = 0.9
    building_age = 0.7
    population_density = 8500
    tsunami_risk = 0.8
    current_risk_score = 65.5
    years_forward = 10
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://quakesight-backend.onrender.com/api/predict" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

### **3. End-to-End Test**
1. Open `https://quakesight-frontend.onrender.com`
2. Go to Prediction History
3. Click "Predict" button
4. Verify XGBoost prediction loads

---

## 🚀 Quick Deployment Summary

1. **Push to GitHub** ✅
2. **Go to Render.com** ✅
3. **New Blueprint** → Select repo ✅
4. **Apply** → Both services deploy ✅
5. **Update CORS** → Add frontend URL ✅
6. **Test** → Verify everything works ✅

**Total time: ~10 minutes**

---

## 📚 Resources

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Render Community:** https://community.render.com
- **Support:** support@render.com

---

**Your QuakeSight app is now live on Render.com! 🎉**

Both backend and frontend run 24/7, automatically deploy on git push, and scale based on traffic!
