#!/bin/bash

set -e  # Exit on any error

echo "🚀 Starting build process..."
echo "Current directory: $(pwd)"

# Step 1: Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Step 2: Check client directory
echo "🔍 Checking client directory..."
if [ ! -d "client" ]; then
    echo "❌ Client directory not found!"
    exit 1
fi

# Step 3: Install client dependencies
echo "📦 Installing client dependencies..."
cd client
npm install

# Step 4: Build client
echo "🔨 Building client..."
npm run build

# Step 5: Verify build
echo "✅ Verifying build..."
if [ ! -d "dist" ]; then
    echo "❌ Dist directory not created!"
    exit 1
fi

echo "📁 Dist contents:"
ls -la dist/

# Step 6: Return to root
cd ..

# Step 7: Run verification
echo "🔍 Running build verification..."
node build-verify.js

echo "🎉 Build completed successfully!" 