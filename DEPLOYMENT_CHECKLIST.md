# 🚀 QuakeSight Deployment Checklist

Use this checklist to ensure successful deployment of both backend and frontend.

---

## 📋 Pre-Deployment Checklist

### **Backend Preparation**
- [ ] `backend/Procfile` exists
- [ ] `backend/runtime.txt` specifies Python version
- [ ] `gunicorn` added to `requirements.txt`
- [ ] CORS origins configured in `app.py`
- [ ] Debug mode set to False for production
- [ ] Health check endpoint tested locally
- [ ] All dependencies in `requirements.txt`

### **Frontend Preparation**
- [ ] `.env.production` created with backend URL
- [ ] Firebase production credentials configured
- [ ] API calls use `process.env.REACT_APP_API_URL`
- [ ] Production build tested (`npm run build`)
- [ ] No console errors in production build
- [ ] All routes working correctly

### **Repository**
- [ ] All changes committed to Git
- [ ] Repository pushed to GitHub
- [ ] No sensitive data in repository (.env files in .gitignore)
- [ ] README.md updated with deployment info

---

## 🎯 Render.com Deployment Steps (Recommended)

### **Phase 1: Deploy Both Services to Render**

**Step 1: Create Render Account**
- [ ] Go to https://render.com
- [ ] Sign up with GitHub account
- [ ] Authorize Render to access repositories

**Step 2: Deploy Using Blueprint (Recommended)**
- [ ] Click "New +" → "Blueprint"
- [ ] Select your QuakeSight repository
- [ ] Render detects `render.yaml` automatically
- [ ] Review the two services:
  - `quakesight-backend` (Web Service)
  - `quakesight-frontend` (Static Site)
- [ ] Click "Apply"
- [ ] Wait for both services to deploy (~5 minutes)

**Step 3: Get Your URLs**
- [ ] Backend: `https://quakesight-backend.onrender.com`
- [ ] Frontend: `https://quakesight-frontend.onrender.com`
- [ ] Test backend health: Visit backend URL + `/api/health`
- [ ] Test frontend: Open frontend URL in browser

**Step 4: Configure Environment Variables**
- [ ] Go to backend service dashboard
- [ ] Click "Environment"
- [ ] Verify/Update variables:
  - `FLASK_ENV` = `production`
  - `ALLOWED_ORIGINS` = `https://quakesight-frontend.onrender.com,http://localhost:3000`
- [ ] Save changes (triggers redeploy)

**Step 5: Verify Both Services**
- [ ] Backend health check returns: `{"status": "healthy", "model_loaded": true}`
- [ ] Frontend loads without errors
- [ ] Check logs for both services (no errors)

---

### **Phase 2: Test Connection**

---

**Step 1: Test End-to-End**
- [ ] Open frontend URL
- [ ] Navigate to Prediction History page
- [ ] Click "Predict" on a saved assessment
- [ ] Select 5 or 10 years
- [ ] Click "Generate Prediction"
- [ ] Verify XGBoost prediction loads successfully
- [ ] Check browser console for errors

---

## 🧪 Post-Deployment Testing

### **Backend Tests**
- [ ] Health check responds: `GET https://quakesight-backend.onrender.com/api/health`
- [ ] Prediction API works:
  ```powershell
  $env:REACT_APP_API_URL="https://quakesight-backend.onrender.com"
  .\health-check.ps1
  ```
- [ ] No errors in Render logs
- [ ] Response time < 10 seconds (first request may be slower)

### **Frontend Tests**
- [ ] Homepage loads
- [ ] Dashboard displays
- [ ] Prediction page works
- [ ] History page loads saved assessments
- [ ] Can create new assessments
- [ ] Can save to Firebase
- [ ] Future predictions work
- [ ] No CORS errors in console

### **Integration Tests**
- [ ] Frontend successfully calls backend API
- [ ] Predictions return in < 10 seconds
- [ ] Feature importance displays correctly
- [ ] All risk factors calculated properly
- [ ] Firebase save/load works

---

## 📊 Monitoring Setup

### **Backend Monitoring**
- [ ] Set up UptimeRobot for health checks
  - URL: `https://quakesight-backend.onrender.com/api/health`
  - Interval: Every 10 minutes (keeps free tier alive)
  - Alert: Email when down
- [ ] Check Render logs regularly
- [ ] Monitor response times in Render dashboard

### **Frontend Monitoring**
- [ ] Enable Render analytics
- [ ] Check for runtime errors in browser console
- [ ] Monitor page load times
- [ ] Review deployment events in Render

---

## 🔒 Security Checklist

- [ ] No API keys committed to Git
- [ ] Environment variables set in hosting platforms
- [ ] CORS properly configured (not using `*`)
- [ ] Firebase security rules enabled
- [ ] HTTPS enabled on both services
- [ ] Rate limiting configured (if needed)

---

## 🐛 Common Issues & Solutions

### **Issue: Backend returns 500 error**
- [ ] Check Render logs for Python errors
- [ ] Verify all dependencies installed
- [ ] Ensure `gunicorn` in requirements.txt
- [ ] Check environment variables in Render dashboard

### **Issue: Frontend can't reach backend**
- [ ] Verify `REACT_APP_API_URL` is set correctly
- [ ] Check CORS settings in backend
- [ ] Ensure backend URL uses HTTPS
- [ ] Check browser console for errors

### **Issue: "Model not loaded" error**
- [ ] Check Railway logs for model training errors
- [ ] Verify XGBoost installed correctly
- [ ] Ensure sufficient memory allocated
- [ ] Restart backend service

### **Issue: CORS errors**
- [ ] Add frontend URL to `ALLOWED_ORIGINS` in backend
- [ ] Include `http://localhost:3000` for development
- [ ] Redeploy backend after changes
- [ ] Clear browser cache

---

## 📈 Performance Optimization

### **Backend**
- [ ] Consider upgrading to Render Starter ($7/month) to avoid cold starts
- [ ] Enable caching for model predictions
- [ ] Optimize model loading time
- [ ] Request compression (automatic on Render)

### **Frontend**
- [ ] Render automatically uses CDN
- [ ] Optimize images
- [ ] Lazy load components
- [ ] Brotli compression (automatic)

---

## 🎉 Launch Checklist

Final checks before announcing your app:

- [ ] ✅ Backend deployed and healthy
- [ ] ✅ Frontend deployed and accessible
- [ ] ✅ End-to-end testing complete
- [ ] ✅ Monitoring enabled
- [ ] ✅ Custom domain configured (optional)
- [ ] ✅ Documentation updated
- [ ] ✅ Demo video/screenshots ready
- [ ] ✅ Share links tested

---

## 📞 Support Resources

- **Render Community:** https://community.render.com
- **Render Docs:** https://render.com/docs
- **Render Support:** support@render.com
- **Stack Overflow:** Tag questions with `render`, `xgboost`, `flask`
- **GitHub Issues:** Report bugs in your repository

---

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Backend health check returns 200 OK
2. ✅ Frontend loads without errors
3. ✅ Predictions generate successfully
4. ✅ Data saves to Firebase
5. ✅ No CORS errors
6. ✅ Response times < 10 seconds
7. ✅ Both services accessible 24/7

---

**Congratulations! Your QuakeSight app is now live on Render! 🎉**

Share your deployed URLs:
- **Frontend:** https://quakesight-frontend.onrender.com
- **Backend API:** https://quakesight-backend.onrender.com

Both services are running independently on Render and will scale automatically based on traffic!
