# Quick Start Guide - Time-Based Notifications

## What's Fixed
✅ Notifications now automatically send at the START of each time phase:
- **00:00** - Midnight safety tips
- **06:00** - Morning safety tips  
- **12:00** - Afternoon safety tips
- **18:00** - Evening safety tips

## Installation Steps

### 1. Navigate to notifications backend
```bash
cd AyaApp/notifications-backend
```

### 2. Install the new dependency
```bash
npm install node-cron
```

### 3. Start the server
```bash
npm start
```

You should see:
```
Notifications backend listening on port 8888
🕐 Initializing notification scheduler...
✅ Scheduler initialized with 4 daily time phases:
   - 00:00 (Midnight)
   - 06:00 (Morning)
   - 12:00 (Afternoon)
   - 18:00 (Evening)
📤 Sending initial notification for current time phase...
```

## How It Works

### Automatic Scheduling
The system uses `node-cron` to run at specific times:
```javascript
// Runs at 6:00 AM every day
cron.schedule("0 6 * * *", () => {
  console.log("⏰ Morning (06:00) - Sending morning safety tip");
  sendTimeTipNotification();
}, {
  timezone: "Africa/Johannesburg"
});
```

### Notification Flow
1. Scheduler triggers at hour boundary (e.g., 6:00 AM)
2. Fetches all safety tips from database
3. Selects tip for current hour (6:00-12:00)
4. Gets all registered user tokens
5. Sends push notifications to all users
6. Logs the notification event

## Testing

### Test Immediately
```bash
curl -X POST http://localhost:8888/api/notify/test
```

This will:
- Send a notification right now
- Show you how many users received it
- Display the selected tip
- Show the current hour

### Check Health
```bash
curl http://localhost:8888/health
```

### View All Tips
```bash
curl http://localhost:8888/api/time-based-safety-tips
```

## Files Modified

### ✅ Created Files
1. `lib/scheduler.js` - Cron scheduler for automated notifications
2. `README.md` - Full documentation
3. `QUICKSTART.md` - This guide

### ✅ Updated Files
1. `server.js` - Added scheduler initialization
2. `routes/notify.js` - Added test endpoint
3. `package.json` - Added node-cron dependency

## What Happens Next

### On Server Start
- Scheduler initializes with 4 time-based cron jobs
- Sends immediate notification for current time phase
- Waits for next scheduled time

### At Each Time Phase
```
⏰ Morning (06:00) - Sending morning safety tip
[2025-10-24T06:00:00.000Z] Running scheduled time-tip notification...
Selected tip for hour 6: 06:00–12:00
Found 15 tokens to notify
Sent 15 notifications. Result: { ok: true }
Logged notification to database
✅ Time-tip notification completed successfully
```

### Users Receive
- Push notification on their device
- Title: "Safety Tip"
- Body: "Phone snatching, muggings: Stay alert on commute; keep valuables hidden."
- Notification appears in app's notification modal

## Troubleshooting

### Notifications not sending?
1. Check server is running: `curl http://localhost:8888/health`
2. Verify users are registered: Check `user_push_tokens` table
3. Test manually: `curl -X POST http://localhost:8888/api/notify/test`
4. Check server logs for errors

### Wrong timezone?
Edit `lib/scheduler.js` and change:
```javascript
timezone: "Africa/Johannesburg" // Update this
```

### Want different times?
Edit cron expressions in `lib/scheduler.js`:
```javascript
cron.schedule("0 8 * * *", ...) // 8:00 AM instead of 6:00 AM
```

## Production Checklist

- [ ] Install node-cron: `npm install node-cron`
- [ ] Start server: `npm start`
- [ ] Verify scheduler initialized in logs
- [ ] Test with: `curl -X POST http://localhost:8888/api/notify/test`
- [ ] Check notifications arrive on mobile device
- [ ] Monitor logs at next scheduled time (00:00, 06:00, 12:00, 18:00)

## Success! 🎉

Your notifications will now automatically send at:
- **Midnight** (00:00)
- **Morning** (06:00)  
- **Noon** (12:00)
- **Evening** (18:00)

Users will receive timely safety tips throughout the day!
