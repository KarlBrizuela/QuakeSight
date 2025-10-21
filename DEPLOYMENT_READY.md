# QuakeSight - Ready for Deployment! 🚀

## ✅ What's Been Configured

Your QuakeSight project is now **deployment-ready** with all necessary configuration files:

### **Backend Configuration**
- ✅ `backend/Procfile` - Tells hosting platforms how to run your app
- ✅ `backend/runtime.txt` - Specifies Python version
- ✅ `backend/requirements.txt` - Updated with `gunicorn` (production server)
- ✅ `backend/app.py` - Updated with production CORS and debug mode

### **Frontend Configuration**
- ✅ `.env.development` - Local development API URL
- ✅ `.env.production.example` - Template for production variables
- ✅ `PredictionHistory.jsx` - Updated to use environment variables

### **Deployment Configs**
- ✅ `render.yaml` - One-click deployment config for Render
- ✅ `DEPLOYMENT_GUIDE.md` - Complete deployment instructions

---

## 🎯 Quick Deployment (5 Minutes)

### **Option A: Railway + Vercel (Recommended)**

#### **1. Deploy Backend to Railway**
1. Go to https://railway.app and sign in with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your QuakeSight repository
4. Click "Add variables" and set:
   - `ALLOWED_ORIGINS`: `https://your-frontend.vercel.app` (update after frontend deploy)
5. Railway will auto-detect the Procfile and deploy!
6. Copy your backend URL (e.g., `quakesight-production.up.railway.app`)

#### **2. Deploy Frontend to Vercel**
1. Create `.env.production` file:
   ```bash
   REACT_APP_API_URL=https://quakesight-production.up.railway.app
   ```
2. Go to https://vercel.com and sign in with GitHub
3. Click "Add New Project" → Import your repository
4. Add environment variable: `REACT_APP_API_URL` = your Railway URL
5. Click "Deploy"
6. Your app is live! 🎉

#### **3. Update Backend CORS**
1. Go back to Railway
2. Add environment variable: `ALLOWED_ORIGINS` = your Vercel URL
3. Redeploy backend

**Done! Both services are running and connected!**

---

### **Option B: Render (One Platform)**

1. Go to https://render.com
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect `render.yaml` and deploy both services!
5. Update the API URL in the frontend environment variables

---

## 🔧 Environment Variables Setup

### **Backend (Railway/Render)**
Set these in your hosting platform:
```
PORT=5000 (auto-set by most platforms)
FLASK_ENV=production
ALLOWED_ORIGINS=https://your-frontend-url.vercel.app,https://your-domain.com
```

### **Frontend (Vercel/Netlify)**
Set these in your hosting platform or `.env.production`:
```
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_PROJECT_ID=your_project
```

---

## 🎨 How It Works in Production

```
User Browser
     │
     ├─► https://quakesight.vercel.app (React Frontend)
     │    │
     │    └─► Fetch predictions from history
     │    └─► User clicks "Predict"
     │         │
     │         └─► POST https://quakesight.railway.app/api/predict
     │                   │
     │                   ├─► XGBoost Model processes
     │                   └─► Returns JSON prediction
     │
     └─► Display results with feature importance
```

**Both services run 24/7:**
- Frontend: Static files served from CDN (super fast!)
- Backend: Python Flask + Gunicorn (auto-scales, always available)

---

## 🧪 Testing Production Setup Locally

Before deploying, test the production configuration:

### **1. Test Backend with Gunicorn**
```bash
cd backend
.\venv\Scripts\Activate.ps1
gunicorn app:app
```
Visit http://localhost:8000/api/health

### **2. Test Frontend Production Build**
```bash
# Set production API URL
$env:REACT_APP_API_URL="http://localhost:8000"
npm run build
npx serve -s build
```
Visit http://localhost:3000

---

## 🐛 Troubleshooting

### **Backend not starting on Railway:**
- Check logs in Railway dashboard
- Verify `Procfile` exists in backend folder
- Ensure `gunicorn` is in requirements.txt

### **Frontend can't reach backend:**
- Check CORS settings in `app.py`
- Verify `REACT_APP_API_URL` is set correctly
- Check browser console for errors
- Ensure backend URL uses HTTPS (not HTTP)

### **Health check failing:**
```bash
# Test your deployed backend
curl https://your-backend-url.railway.app/api/health
```
Should return: `{"status": "healthy", "model_loaded": true, ...}`

---

## 📊 Free Tier Limits

| Platform | Backend | Frontend | Limits |
|----------|---------|----------|--------|
| **Railway** | 500 hours/month | N/A | $5 free credit/month |
| **Vercel** | N/A | Unlimited | 100GB bandwidth |
| **Render** | 750 hours/month | Unlimited | Services sleep after 15min inactivity |
| **Netlify** | N/A | Unlimited | 100GB bandwidth |

**Recommendation:** Railway (backend) + Vercel (frontend) = Best free tier combination!

---

## 🚀 Next Steps

1. **Deploy Backend** → Railway or Render
2. **Deploy Frontend** → Vercel or Netlify  
3. **Update CORS** → Add frontend URL to backend
4. **Test Application** → Try a prediction end-to-end
5. **Monitor** → Set up UptimeRobot for health checks
6. **Custom Domain** (optional) → Add your own domain

---

## 📚 Need Help?

- **Railway Docs:** https://docs.railway.app/
- **Vercel Docs:** https://vercel.com/docs
- **Render Docs:** https://render.com/docs
- **Deployment Guide:** See `DEPLOYMENT_GUIDE.md` for detailed instructions

---

**Your project is ready to deploy! Just follow the steps above.** 🎉

Both backend and frontend will run independently, communicate via HTTPS, and scale automatically based on traffic!
