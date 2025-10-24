#!/bin/bash
# Quick Setup Script for Merged Notification System

echo "🚀 Setting up notification system..."
echo ""

# 1. Install dependencies
echo "📦 Step 1: Installing dependencies..."
cd Backend
npm install node-cron node-fetch@2

echo ""
echo "✅ Dependencies installed!"
echo ""

# 2. Instructions
echo "📋 Next steps:"
echo ""
echo "1. Update HomeScreen.js API_BASE_URL to port 3001:"
echo "   export const API_BASE_URL = 'http://192.168.137.1:3001';"
echo ""
echo "2. Start the backend server:"
echo "   cd Backend"
echo "   npm start"
echo ""
echo "3. Start the Expo app (in a new terminal):"
echo "   cd AyaApp"
echo "   npx expo start"
echo ""
echo "4. Wait 1 minute for the test notification!"
echo ""
echo "🎉 Setup complete! Check NOTIFICATION_MERGE_COMPLETE.md for full details."
