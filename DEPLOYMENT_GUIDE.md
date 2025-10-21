# 🚀 QuakeSight Deployment Guide

## Deployment Strategy Overview

Since QuakeSight has **two separate services** (React frontend + Python backend), you need to ensure both are running and can communicate with each other in production.

---

## ✅ Recommended Deployment Options

### **Option 1: Separate Hosting (Recommended for Production)**

Deploy frontend and backend on different platforms, each optimized for their technology.

```
Frontend (React)          Backend (Python)
    │                          │
    ├─► Vercel                 ├─► Railway
    ├─► Netlify                ├─► Render
    ├─► GitHub Pages           ├─► PythonAnywhere
    └─► Firebase Hosting       ├─► Heroku
                               ├─► AWS Lambda
                               └─► Google Cloud Run
```

**Pros:**
- ✅ Optimal performance for each service
- ✅ Independent scaling
- ✅ Easy to update each part separately
- ✅ Most platforms have free tiers

**Cons:**
- ⚠️ Need to manage CORS
- ⚠️ Two separate deployments

---

### **Option 2: Single Server (Simpler Setup)**

Host both frontend and backend on the same server.

```
Single Server (e.g., DigitalOcean, AWS EC2)
    │
    ├─► Backend (Python Flask on port 5000)
    └─► Frontend (React build served by Flask or Nginx)
```

**Pros:**
- ✅ Simpler deployment
- ✅ No CORS issues
- ✅ Single domain

**Cons:**
- ⚠️ Need to manage a server
- ⚠️ More expensive
- ⚠️ Requires DevOps knowledge

---

## 📦 Deployment Instructions

### **Option 1A: Railway (Backend) + Vercel (Frontend)**

This is the **easiest and recommended** approach with generous free tiers.

#### **Step 1: Deploy Backend to Railway**

1. **Create `Procfile` in backend folder:**
```bash
cd backend
echo "web: gunicorn app:app" > Procfile
```

2. **Update `requirements.txt` to include production server:**
```bash
echo "gunicorn==21.2.0" >> requirements.txt
```

3. **Update `app.py` for production:**
```python
# Add at the top of app.py
import os

# Update CORS configuration
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://your-frontend-url.vercel.app"  # Add your Vercel URL
        ]
    }
})

# Update Flask run for production
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)  # debug=False for production
```

4. **Deploy to Railway:**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your QuakeSight repository
   - Set **Root Directory**: `backend`
   - Railway auto-detects Python and deploys
   - Copy your Railway backend URL (e.g., `https://quakesight-backend.railway.app`)

#### **Step 2: Deploy Frontend to Vercel**

1. **Update API URL in frontend:**

Create `.env.production` file in root:
```bash
REACT_APP_API_URL=https://quakesight-backend.railway.app
```

2. **Update `PredictionHistory.jsx` to use environment variable:**
```javascript
// Replace hardcoded URL
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const response = await fetch(`${apiUrl}/api/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody)
});
```

3. **Deploy to Vercel:**
   - Go to https://vercel.com
   - Sign up with GitHub
   - Click "Add New Project"
   - Import your QuakeSight repository
   - Vercel auto-detects React
   - Click "Deploy"
   - Your app is live at `https://quakesight.vercel.app`

---

### **Option 1B: Render (Full Stack Hosting)**

Render can host both backend and frontend on one platform.

#### **Backend Deployment:**

1. **Create `render.yaml` in root:**
```yaml
services:
  - type: web
    name: quakesight-backend
    env: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && gunicorn app:app
    envVars:
      - key: PORT
        value: 5000
```

2. **Deploy:**
   - Go to https://render.com
   - Create "New Web Service"
   - Connect GitHub repo
   - Select Python environment
   - Build command: `cd backend && pip install -r requirements.txt`
   - Start command: `cd backend && gunicorn app:app`
   - Click "Create Web Service"

#### **Frontend Deployment:**

1. **Create static site on Render:**
   - Click "New Static Site"
   - Connect same repo
   - Build command: `npm install && npm run build`
   - Publish directory: `build`
   - Add environment variable: `REACT_APP_API_URL=https://quakesight-backend.onrender.com`

---

### **Option 2: Single Server (DigitalOcean/AWS EC2)**

For full control, deploy both on a VPS.

#### **Setup Script:**

```bash
#!/bin/bash
# QuakeSight Deployment Script for Ubuntu Server

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python
sudo apt install python3 python3-pip python3-venv -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs -y

# Install Nginx
sudo apt install nginx -y

# Clone repository
cd /var/www
sudo git clone https://github.com/KarlBrizuela/QuakeSight.git
cd QuakeSight

# Setup Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn

# Setup Frontend
cd ..
npm install
npm run build

# Configure Nginx (see nginx config below)
sudo nano /etc/nginx/sites-available/quakesight
```

#### **Nginx Configuration:**

```nginx
# /etc/nginx/sites-available/quakesight

server {
    listen 80;
    server_name your-domain.com;

    # Serve React frontend
    location / {
        root /var/www/QuakeSight/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Flask backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### **Create Systemd Service for Backend:**

```ini
# /etc/systemd/system/quakesight-backend.service

[Unit]
Description=QuakeSight XGBoost Backend
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/QuakeSight/backend
Environment="PATH=/var/www/QuakeSight/backend/venv/bin"
ExecStart=/var/www/QuakeSight/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start service:**
```bash
sudo systemctl enable quakesight-backend
sudo systemctl start quakesight-backend
sudo systemctl status quakesight-backend
```

---

## 🔧 Production Checklist

### **Backend Configuration**

- [ ] Change `debug=False` in Flask
- [ ] Use production WSGI server (Gunicorn/uWSGI)
- [ ] Set proper CORS origins
- [ ] Use environment variables for secrets
- [ ] Enable HTTPS
- [ ] Set up error logging
- [ ] Configure rate limiting
- [ ] Add health check endpoint

### **Frontend Configuration**

- [ ] Build production bundle (`npm run build`)
- [ ] Update API URLs to production backend
- [ ] Configure Firebase production keys
- [ ] Enable minification
- [ ] Set up CDN (optional)
- [ ] Configure error tracking (Sentry)

### **Database & APIs**

- [ ] Firebase: Switch to production project
- [ ] Update Firestore security rules
- [ ] Add API rate limiting
- [ ] Set up monitoring

---

## 🌐 Environment Variables

### **Backend (.env)**
```bash
PORT=5000
FLASK_ENV=production
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### **Frontend (.env.production)**
```bash
REACT_APP_API_URL=https://your-backend.railway.app
REACT_APP_FIREBASE_API_KEY=your_production_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

---

## 🔍 Monitoring & Health Checks

### **Backend Health Check**

Already implemented in `app.py`:
```python
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'service': 'QuakeSight XGBoost API',
        'timestamp': datetime.now().isoformat(),
        'model_loaded': predictor.model is not None
    })
```

### **Monitoring Services**

Free options:
- **UptimeRobot** - Monitor backend health
- **Vercel Analytics** - Frontend monitoring
- **Railway Logs** - Backend logs
- **Sentry** - Error tracking

---

## 💰 Cost Comparison

| Platform | Frontend | Backend | Cost/Month |
|----------|----------|---------|------------|
| **Vercel + Railway** | Free tier | Free tier* | $0 |
| **Netlify + Render** | Free tier | Free tier* | $0 |
| **Render (Both)** | Free tier | Free tier* | $0 |
| **DigitalOcean VPS** | Included | Included | $6-12 |
| **AWS/GCP** | ~$1 | ~$5-20 | $6-21 |

*Free tiers have usage limits but sufficient for development/small projects

---

## 🚀 Quick Start: Render.com (5 Minutes) - RECOMMENDED

### **1. Prepare for Deployment**
```bash
git add .
git commit -m "Ready for Render deployment"
git push
```

### **2. Deploy to Render (Both Services)**
1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Blueprint"
4. Select your QuakeSight repository
5. Render detects `render.yaml` automatically
6. Click "Apply"
7. Both services deploy! ✅

### **3. Get Your URLs**
After deployment (~5 minutes):
- Backend: `https://quakesight-backend.onrender.com`
- Frontend: `https://quakesight-frontend.onrender.com`

### **4. Update CORS**
1. Go to backend service → Environment
2. Update `ALLOWED_ORIGINS` with your frontend URL
3. Save (auto-redeploys)

**Done! Both services running! 🎉**

See `RENDER_DEPLOYMENT.md` for detailed instructions.

---

## 🛠️ Troubleshooting

### **Backend not responding:**
- Check Railway/Render logs
- Verify `Procfile` exists
- Ensure `gunicorn` in requirements.txt
- Check PORT environment variable

### **CORS errors:**
- Update CORS origins in `app.py`
- Include production frontend URL
- Restart backend service

### **Frontend can't reach backend:**
- Verify `REACT_APP_API_URL` is set
- Check browser console for errors
- Confirm backend is running (health check)
- Check HTTPS/HTTP mismatch

---

## 📚 Additional Resources

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Flask Deployment](https://flask.palletsprojects.com/en/2.3.x/deploying/)
- [React Deployment](https://create-react-app.dev/docs/deployment/)

---

**Recommended for QuakeSight:**
- **Production:** Render.com (Both Backend + Frontend) ⭐ BEST CHOICE
- **Alternative:** Railway (Backend) + Vercel (Frontend)
- **Development/Testing:** Local servers (Flask + React)
- **Enterprise:** AWS/GCP with Docker containers

Both services will run independently, communicate via HTTPS, and scale automatically! 🚀
