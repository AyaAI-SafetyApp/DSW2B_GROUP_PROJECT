# 🧪 Testing Guide - 1 Minute Notification Test

## What's Changed
The scheduler has been modified to send a **TEST notification 1 minute** after the server starts!

## Quick Test Steps

### 1. Start the server
```bash
cd AyaApp/notifications-backend
npm start
```

### 2. Watch the console output
You'll see:
```
🕐 Initializing notification scheduler...

🧪 TEST MODE ACTIVATED
   Current time: 14:35
   Test notification will send at: 14:36

✅ Scheduler initialized with test + 4 daily time phases:
   - 14:36 (TEST - in 1 minute) 🧪
   - 00:00 (Midnight)
   - 06:00 (Morning)
   - 12:00 (Afternoon)
   - 18:00 (Evening)

⏳ Waiting 1 minute for test notification...
```

### 3. Wait 1 minute ⏰
After exactly 1 minute, you'll see:
```
🧪 TEST NOTIFICATION (1 minute delay) - Sending safety tip
[2025-10-24T14:36:00.000Z] Running scheduled time-tip notification...
Selected tip for hour 14: 12:00–18:00
Found 3 tokens to notify
Sent 3 notifications. Result: { ok: true }
Logged notification to database
✅ Time-tip notification completed successfully
```

### 4. Check your phone 📱
- Open your Aya app
- You should receive a push notification
- Tap the notification bell icon
- The safety tip should appear in the modal

## Manual Test (Immediate)

If you don't want to wait 1 minute:
```bash
curl -X POST http://localhost:8888/api/notify/test
```

This sends immediately and shows detailed response:
```json
{
  "ok": true,
  "sentTo": 3,
  "tip": {
    "id": "...",
    "time_range": "12:00–18:00",
    "awareness": "Burglaries, car theft",
    "tip": "Lock your home and car; don't leave items visible."
  },
  "currentHour": 14
}
```

## What to Verify

### ✅ Server Side
- [ ] Console shows "🧪 TEST MODE ACTIVATED"
- [ ] Shows correct test time (current time + 1 minute)
- [ ] After 1 minute, shows "🧪 TEST NOTIFICATION"
- [ ] Shows "Found X tokens to notify"
- [ ] Shows "Sent X notifications"
- [ ] Shows "✅ Time-tip notification completed successfully"

### ✅ Client Side (Your Phone)
- [ ] Push notification appears on device
- [ ] Notification title: "Safety Tip"
- [ ] Notification body contains awareness + tip
- [ ] Tapping opens the app
- [ ] Notification appears in the bell icon modal
- [ ] Badge count increases on notification icon

## Troubleshooting

### No notification after 1 minute?
1. **Check server logs** - Did it actually trigger?
2. **Check tokens registered:**
   ```bash
   # This requires the tokens route to list tokens
   curl http://localhost:8888/api/token/list
   ```
3. **Verify Expo app is running** on your device
4. **Check notification permissions** are granted

### Server not starting?
```bash
# Install dependencies first
npm install node-cron
npm install
```

### Want to test again?
1. Stop the server (Ctrl+C)
2. Start it again: `npm start`
3. It will schedule a new test 1 minute from the new start time

## Disable Test Mode

Once testing is done, remove the test code from `lib/scheduler.js`:
1. Delete the "TEST MODE" section (lines with 🧪)
2. Keep only the 4 scheduled times (00:00, 06:00, 12:00, 18:00)
3. Restart the server

Or just uncomment the immediate test at the bottom:
```javascript
// Send initial notification immediately on startup
console.log("\n📤 Sending initial notification for current time phase...");
sendTimeTipNotification();
```

## Expected Timeline

| Time | Event |
|------|-------|
| 00:00 | Server starts |
| 00:01 | 🧪 TEST notification sent |
| 06:00 | Morning notification (daily) |
| 12:00 | Afternoon notification (daily) |
| 18:00 | Evening notification (daily) |
| 24:00 | Midnight notification (daily) |

## Success! 🎉

If you see the notification on your phone within 1 minute of starting the server, **it's working perfectly!**

The scheduler is now proven to work, and the daily notifications at 00:00, 06:00, 12:00, and 18:00 will work the same way.
