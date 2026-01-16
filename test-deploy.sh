#!/bin/bash

echo "🧪 TEST DEPLOY - Making noticeable changes..."

TO_DIR="/Users/chrisharris/DEV/deploy2"

# Create a test file with timestamp
echo "TEST FILE - Updated at $(date)" > "$TO_DIR/test-deploy.txt"

# Add a comment to package.json
echo "// TEST DEPLOY COMMENT - $(date)" >> "$TO_DIR/package.json"

echo "✅ Test changes made! Check: $TO_DIR/test-deploy.txt"
echo "✅ Check package.json for new comment"
