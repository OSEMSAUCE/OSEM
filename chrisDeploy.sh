#!/bin/bash

# Chris Deploy Script - Clean deployment without submodule artifacts
# Usage: ./chrisDeploy.sh
# 🌏️ on deploy2?
set -e  # Exit on any error

echo "🚀 Starting Chris Deploy Script..."

# Define paths
FROM_DIR=/Users/chrisharris/DEV/fetch/ReTreever
TO_DIR=/Users/chrisharris/DEV/deploy2

echo "📁 Working in: $FROM_DIR"

# Clean deploy directory contents (preserving Git and Vercel connections)
echo "🧹 Cleaning deploy directory contents..."
find "$TO_DIR" -mindepth 1 -not -path "$TO_DIR/.git" -not -path "$TO_DIR/.git/*" -not -path "$TO_DIR/.vercel" -not -path "$TO_DIR/.vercel/*" -not -path "$TO_DIR/vercel.json" -exec rm -rf {} + 2>/dev/null || true
 
# Copy ReTreever content excluding git artifacts and OSEM submodule
echo "📋 Copying ReTreever files (excluding git artifacts)..."
# Copy each item individually, excluding specified files/directories
for item in "$FROM_DIR"/*; do
    basename_item=$(basename "$item")
    case "$basename_item" in
        '.gitmodules'|'.git'|'node_modules'|'vercel.json')
            echo "Skipping: $basename_item"
            ;;
        *)
            echo "Copying: $basename_item"
            cp -r "$item" "$TO_DIR/"
            ;;
    esac
done

echo "✅ Files copied successfully!"

# # Remove OSEM tsconfig.json to fix path issues (use main tsconfig)
# echo "🔧 Removing OSEM tsconfig.json to use main configuration..."
# rm -f "$TO_DIR/OSEM/tsconfig.json"
# # Copy environment file from ReTreever for build variables
# echo "🔧 Copying environment file for build..."
# cp "$FROM_DIR/.env" "$TO_DIR/.env" 2>/dev/null || echo "No .env file found in ReTreever"

# # Install dependencies and build project
# echo "📦 Installing dependencies..."
# cd "$TO_DIR"
# npm install

# echo "🔨 Building project..."
# npm run build

# echo "🚀 Pushing to Git repository..."
# # Initialize Git if not already done
# if [[ ! -d ".git" ]]; then
#     git init
#     git remote add origin https://github.com/Ground-Truth-Data/ReTreeverDeploy.git
# fi

# # Add all files and commit
# git add .
# git commit -m "Deploy $(date '+%Y-%m-%d %H:%M:%S')"

# # Push to repository (force push to overwrite history)
# git push origin main --force

# echo "📊 Deployment complete!"
# echo "🚀 Vercel will auto-deploy when the push is processed."

# # Show final status
# echo ""
# echo "🎉 Deployment complete!"
# echo "📍 Location: $DEPLOY_DIR"
# echo "📦 Files: $(find . -type f | wc -l) files copied"

# echo ""
# echo "✅ Your ReTreever app is now live on Vercel!"
