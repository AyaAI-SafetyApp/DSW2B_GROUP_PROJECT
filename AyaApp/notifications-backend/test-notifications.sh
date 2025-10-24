#!/bin/bash

# Test script for notifications system
# This will show you what will happen when the notification triggers

echo "🧪 Testing Notification System"
echo "=============================="
echo ""

# Get current time
CURRENT_TIME=$(date +"%H:%M:%S")
TEST_TIME=$(date -d "+1 minute" +"%H:%M:%S" 2>/dev/null || date -v+1M +"%H:%M:%S" 2>/dev/null)

echo "📅 Current time: $CURRENT_TIME"
echo "⏰ Test notification will trigger at: $TEST_TIME"
echo ""

# Check if server is running
echo "🔍 Checking if notifications server is running..."
if curl -s http://localhost:8888/health > /dev/null 2>&1; then
    echo "✅ Server is running on port 8888"
else
    echo "❌ Server is NOT running"
    echo "   Start it with: cd AyaApp/notifications-backend && npm start"
    exit 1
fi

echo ""
echo "📊 Fetching time-based safety tips..."
curl -s http://localhost:8888/api/time-based-safety-tips | json_pp 2>/dev/null || curl -s http://localhost:8888/api/time-based-safety-tips

echo ""
echo ""
echo "🎯 What will happen in 1 minute:"
echo "   1. Scheduler triggers at $TEST_TIME"
echo "   2. Fetches appropriate safety tip for current hour"
echo "   3. Gets all registered push tokens"
echo "   4. Sends push notifications to all devices"
echo "   5. Logs the event to database"
echo ""
echo "📱 Check your mobile device for the notification!"
echo "⏳ Waiting for notification at $TEST_TIME..."
echo ""
echo "💡 You can also trigger it manually with:"
echo "   curl -X POST http://localhost:8888/api/notify/test"
