# 🚀 Deployment Guide

## Render Deployment

### 1. Push to Git Repository
```bash
git add .
git commit -m "Add Render deployment config"
git push origin main
```

### 2. Deploy on Render

1. **Go to [Render Dashboard](https://dashboard.render.com/)**
2. **Click "New +" → "Web Service"**
3. **Connect your Git repository**
4. **Configure the service:**
   - **Name**: `ai-powered-git-activity-monitor`
   - **Environment**: `Node`
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/api/health`

### 3. Set Environment Variables

In Render dashboard, go to **Environment** tab and add:

```
GITHUB_TOKEN=ghp_your_github_token_here
GEMINI_API_KEY=your_gemini_api_key_here
NODE_ENV=production
PORT=10000
```

### 4. Update CORS Origin

After deployment, update the CORS origin in `server.js`:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-actual-app-name.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));
```

### 5. Deploy

Click **"Create Web Service"** and wait for deployment.

## ⚠️ Important Notes

- **Free Tier Limitations**: Render free tier has sleep after 15 minutes of inactivity
- **Rate Limits**: GitHub API has rate limits (60/hour without token, 5000/hour with token)
- **API Keys**: Keep your API keys secure and never commit them to Git
- **Database**: SQLite file will be reset on each deployment (use external database for production)

## 🔧 Troubleshooting

- **Build Failures**: Check if all dependencies are in `package.json`
- **Runtime Errors**: Check Render logs for environment variable issues
- **CORS Errors**: Update the origin URL in `server.js` to match your Render URL 