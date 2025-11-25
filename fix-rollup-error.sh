#!/bin/bash

# Fix for persistent Rollup module error in Svelte projects
# This script clears all caches and reinstalls dependencies

echo "🧹 Cleaning npm cache..."
npm cache clean --force

echo "🗑️  Removing node_modules and lock files..."
rm -rf node_modules package-lock.json .svelte-kit .vite

echo "📦 Reinstalling dependencies..."
npm install

echo "🔄 Syncing SvelteKit..."
npx svelte-kit sync

echo "✅ Done! Now restart your code editor completely (Quit and reopen)."
echo ""
echo "If the error persists after restarting your editor:"
echo "1. In VS Code/Cursor: Press Cmd+Shift+P"
echo "2. Type: 'Svelte: Restart Language Server'"
echo "3. Select it and press Enter"
