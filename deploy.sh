#!/bin/bash

echo "🚀 Deploying AI-Powered Git Activity Monitor to Render..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not initialized. Please run:"
    echo "   git init"
    echo "   git remote add origin <your-repo-url>"
    exit 1
fi

# Add all files
git add .

# Commit changes
git commit -m "Deploy to Render - $(date)"

# Push to remote
git push origin main

echo "✅ Code pushed to repository!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://dashboard.render.com/"
echo "2. Create new Web Service"
echo "3. Connect your repository"
echo "4. Set environment variables:"
echo "   - GITHUB_TOKEN=your_token"
echo "   - GEMINI_API_KEY=your_key"
echo "   - NODE_ENV=production"
echo "   - PORT=10000"
echo "5. Deploy!"
echo ""
echo "🔗 Your app will be available at: https://your-app-name.onrender.com" 