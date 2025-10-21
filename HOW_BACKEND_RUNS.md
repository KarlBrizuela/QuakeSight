# 🌍 How QuakeSight Backend Stays Running in Production

## The Challenge

When you host a web application, you need **both** the frontend (React) and backend (Python) to run simultaneously and communicate with each other.

---

## ✅ The Solution: Separate Hosting Services

Instead of running on one computer, we deploy them separately:

```
┌─────────────────────────────────────────────────────────┐
│                     PRODUCTION                          │
└─────────────────────────────────────────────────────────┘

    Frontend (React)              Backend (Python)
    ┌──────────────┐             ┌──────────────┐
    │   Vercel     │◄────────────┤   Railway    │
    │ Static Files │   API Call  │ Flask+XGBoost│
    │              │   (HTTPS)   │              │
    │ Port: 443    │             │ Port: 443    │
    └──────────────┘             └──────────────┘
         │                             │
         │                             │
         └─────────┬───────────────────┘
                   │
                   ▼
            ┌──────────────┐
            │   Firebase   │
            │  (Database)  │
            └──────────────┘
```

---

## 🔄 How It Works

### **Railway (Backend)**
Railway runs your Python backend 24/7:

1. **Detects Python** - Railway sees your `Procfile` and knows to run Python
2. **Installs Dependencies** - Automatically runs `pip install -r requirements.txt`
3. **Starts Server** - Runs `gunicorn app:app` (production WSGI server)
4. **Always Running** - Backend stays online, responding to API requests
5. **Auto-Restarts** - If it crashes, Railway automatically restarts it
6. **Gives You a URL** - `https://quakesight-backend.railway.app`

### **Vercel (Frontend)**
Vercel hosts your React app:

1. **Builds React** - Runs `npm run build` to create optimized files
2. **Serves Static Files** - Distributes your app via global CDN
3. **Fast Loading** - Users get files from nearest server
4. **Gives You a URL** - `https://quakesight.vercel.app`

### **Communication**
When a user clicks "Predict":

```javascript
// Frontend (JavaScript)
fetch('https://quakesight-backend.railway.app/api/predict', {
    method: 'POST',
    body: JSON.stringify(data)
})
```

The frontend makes an HTTPS request to the backend, which:
1. Receives the request
2. Runs XGBoost prediction
3. Returns JSON response
4. Frontend displays results

**Both services run independently, 24/7!**

---

## 📁 Key Files That Make It Work

### **1. `backend/Procfile`**
Tells Railway how to start your backend:
```
web: gunicorn app:app
```

### **2. `backend/requirements.txt`**
Lists Python packages (now includes `gunicorn`):
```
flask==3.0.0
xgboost==3.1.0
gunicorn==21.2.0
...
```

### **3. `.env.production`**
Tells frontend where backend is:
```
REACT_APP_API_URL=https://quakesight-backend.railway.app
```

### **4. `backend/app.py`**
Updated with production settings:
```python
# CORS for production
allowed_origins = os.environ.get('ALLOWED_ORIGINS').split(',')
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

# Production mode
debug_mode = os.environ.get('FLASK_ENV') == 'development'
app.run(host='0.0.0.0', port=port, debug=debug_mode)
```

---

## 🚀 Deployment Process

### **Step 1: Push to GitHub**
```bash
git add .
git commit -m "Ready for deployment"
git push
```

### **Step 2: Deploy Backend to Railway**
1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select your repo
4. Railway automatically:
   - Detects Python
   - Installs packages
   - Starts gunicorn
   - Gives you a URL ✅

### **Step 3: Deploy Frontend to Vercel**
1. Go to https://vercel.com
2. "New Project" → Import your repo
3. Add environment variable: `REACT_APP_API_URL` = Railway URL
4. Vercel automatically:
   - Runs `npm install`
   - Runs `npm run build`
   - Hosts static files
   - Gives you a URL ✅

### **Step 4: Connect Them**
Update Railway environment variables:
- `ALLOWED_ORIGINS` = your Vercel URL

**Done! Both services running 24/7!** 🎉

---

## 🔍 How to Verify Both Are Running

### **Check Backend:**
```bash
# PowerShell
Invoke-WebRequest https://quakesight-backend.railway.app/api/health
```
Should return:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "service": "QuakeSight XGBoost API"
}
```

### **Check Frontend:**
Open: `https://quakesight.vercel.app`
- Should load the app
- Go to Prediction History
- Click "Predict" on any assessment
- Should generate predictions ✅

### **Use Health Check Script:**
```bash
.\health-check.ps1
```
This tests both services automatically!

---

## 💰 Cost (It's Free!)

### **Free Tier Benefits:**

**Railway:**
- $5 free credit/month
- ~500 hours of runtime
- Perfect for development/small projects

**Vercel:**
- Unlimited deployments
- 100GB bandwidth/month
- Global CDN included

**Total Cost: $0/month for most use cases!**

---

## 🔧 Monitoring (Ensuring Backend Stays Running)

### **1. Health Checks**
Railway automatically monitors your backend:
- Sends requests to `/api/health` endpoint
- Restarts if service becomes unresponsive

### **2. UptimeRobot (Optional)**
Free service that checks if your backend is up:
1. Go to https://uptimerobot.com
2. Add monitor: `https://your-backend.railway.app/api/health`
3. Get alerts via email if it goes down

### **3. Railway Dashboard**
- View logs in real-time
- Check resource usage
- Monitor response times

---

## 🛠️ What Happens If Backend Crashes?

Railway handles it automatically:

1. **Detects Crash** - Health check fails
2. **Logs Error** - Records what went wrong
3. **Auto-Restarts** - Starts service again
4. **Notifies You** - Email/Discord notification (if configured)
5. **Back Online** - Usually within 30 seconds

**Your backend is resilient and self-healing!**

---

## 📊 Architecture Comparison

### **Development (Your Computer)**
```
localhost:3000 (React) ──► localhost:5000 (Python)
     ↑                           ↑
     └───── Both running on your machine ─────┘
```

### **Production (Cloud)**
```
vercel.app (React) ──HTTPS──► railway.app (Python)
     ↑                              ↑
  Global CDN                   Always Running
     ↑                              ↑
  Worldwide                    Auto-Scaling
```

---

## ✅ Summary

**Question:** How do we ensure backend keeps running?

**Answer:** We use a **cloud hosting platform** (Railway/Render) that:

✅ Runs your backend 24/7  
✅ Auto-restarts if it crashes  
✅ Scales based on traffic  
✅ Provides health monitoring  
✅ Handles HTTPS/security  
✅ Gives you logs & metrics  

**You don't need to keep your computer on!**

The backend runs on Railway's servers, and the frontend is distributed globally on Vercel's CDN. Both services are:
- ✅ Always available
- ✅ Automatically maintained
- ✅ Globally accessible
- ✅ Free (for most use cases)

---

## 📚 Next Steps

1. ✅ Read: `DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
2. ✅ Follow: `DEPLOYMENT_CHECKLIST.md` - Step-by-step deployment
3. ✅ Run: `health-check.ps1` - Verify both services work
4. ✅ Deploy: Push to GitHub → Railway → Vercel → Done!

---

**Your QuakeSight app will run 24/7 in the cloud, accessible from anywhere! 🌍**
