#!/bin/bash

echo "🔍 Debug Build Script"
echo "===================="

echo "📋 Environment Info:"
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

echo ""
echo "📦 Installing root dependencies..."
npm install

echo ""
echo "📁 Checking client directory..."
if [ ! -d "client" ]; then
    echo "❌ Client directory not found!"
    exit 1
fi

echo "✅ Client directory exists"
echo "Client contents:"
ls -la client/

echo ""
echo "📦 Installing client dependencies..."
cd client
npm install

echo ""
echo "🔨 Running client build..."
npm run build

echo ""
echo "🔍 Build verification..."
if [ -d "dist" ]; then
    echo "✅ Dist directory created"
    echo "Dist contents:"
    ls -la dist/
    
    if [ -f "dist/index.html" ]; then
        echo "✅ index.html exists"
    else
        echo "❌ index.html missing"
    fi
else
    echo "❌ Dist directory not created"
fi

echo ""
echo "📁 Final check..."
cd ..
if [ -d "client/dist" ]; then
    echo "✅ client/dist exists"
    echo "client/dist contents:"
    ls -la client/dist/
else
    echo "❌ client/dist missing"
fi

echo ""
echo "🎯 Build debug complete!" 