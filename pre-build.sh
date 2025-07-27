#!/bin/bash

echo "🔧 Pre-build setup..."
echo "Current directory: $(pwd)"
echo "Directory contents: $(ls -la)"

# Ensure we're in the right directory
if [ ! -d "client" ]; then
    echo "❌ Client directory not found!"
    exit 1
fi

echo "✅ Client directory found"
echo "Client contents: $(ls -la client/)"

# Check if client has package.json
if [ ! -f "client/package.json" ]; then
    echo "❌ client/package.json not found!"
    exit 1
fi

echo "✅ client/package.json found"
echo "Pre-build setup complete!" 