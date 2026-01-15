#!/bin/bash

# Chris Deploy Script - Clean deployment without submodule artifacts
# Usage: ./chrisDeploy.sh

set -e  # Exit on any error

echo "🚀 Starting Chris Deploy Script..."

# Define paths
BASE_DIR="/Users/chrisharris/DEV/fetch"
RETRIEVER_DIR="$BASE_DIR/ReTreever"
DEPLOY_DIR="$BASE_DIR/deploy2"

echo "📁 Working in: $BASE_DIR"

# Ensure deploy directory exists and clean its contents (preserving connections)
if [ ! -d "$DEPLOY_DIR" ]; then
    echo "📂 Creating deploy directory..."
    mkdir -p "$DEPLOY_DIR"
else
    echo "🧹 Cleaning deploy directory contents (preserving Git and Vercel connections)..."
    find "$DEPLOY_DIR" -mindepth 1 -not -name ".git" -not -name ".vercel" -not -path "*/.git/*" -not -path "*/.vercel/*" -exec rm -rf {} + 2>/dev/null || true
fi
 
# Copy ReTreever content excluding git artifacts and OSEM submodule
echo "📋 Copying ReTreever files (excluding git artifacts)..."
rsync -av \
    --exclude='.gitmodules' \
    --exclude='OSEM/.git' \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='deploy2' \
    --exclude='vercel.json' \
    "$RETRIEVER_DIR/" "$DEPLOY_DIR/"

echo "✅ Files copied successfully!"

# Remove the prebuild line from package.json in deploy directory
echo "🔧 Removing prebuild script from deployed package.json..."
sed -i '' '/prebuild.*git submodule update --init --recursive/d' "$DEPLOY_DIR/package.json"

# Install dependencies and build project
echo "📦 Installing dependencies..."
cd "$DEPLOY_DIR"
npm install

echo "🔨 Building project..."
npm run build

echo "� Pushing to Git repository..."
# Initialize Git if not already done
if [ ! -d ".git" ]; then
    git init
    git remote add origin https://github.com/Ground-Truth-Data/ReTreeverDeploy.git
fi

# Add all files and commit
git add .
git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')"

# Push to repository (force push to overwrite history)
git push origin main --force

echo "📊 Deployment complete!"
echo "🚀 Vercel will auto-deploy when the push is processed."

# Show final status
echo ""
echo "🎉 Deployment complete!"
echo "📍 Location: $DEPLOY_DIR"
echo "📦 Files: $(find . -type f | wc -l) files copied"

echo ""
echo "✅ Your ReTreever app is now live on Vercel!"