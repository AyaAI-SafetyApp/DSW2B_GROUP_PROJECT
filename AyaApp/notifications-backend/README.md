# Time-Based Safety Notifications System

## Overview
Automated notification system that sends time-based safety tips to users at the start of each time phase throughout the day.

## Time Phases
The system sends notifications at:
- **00:00** (Midnight) - Night safety tips about break-ins and theft
- **06:00** (Morning) - Commute safety tips about muggings and phone snatching
- **12:00** (Afternoon) - Daytime safety tips about burglaries and car theft
- **18:00** (Evening) - Evening safety tips about hijackings and robberies

## Setup

### 1. Install Dependencies
```bash
cd notifications-backend
npm install
```

### 2. Configure Environment
Create a `.env` file with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
PORT=8888
```

### 3. Seed the Database
Run the seed script to populate time-based safety tips:
```bash
npm run seed
```

### 4. Start the Server
```bash
npm start
# or for development with auto-reload
npm run dev
```

## How It Works

### Scheduler
- Uses `node-cron` to schedule notifications at 00:00, 06:00, 12:00, and 18:00 daily
- Automatically runs when the server starts
- Uses Africa/Johannesburg timezone
- Sends an initial notification on server startup

### Notification Flow
1. **Scheduler triggers** at the start of each time phase
2. **Fetch tips** from `time_based_safety_tips` table
3. **Select appropriate tip** based on current hour
4. **Fetch user tokens** from `user_push_tokens` table
5. **Send push notifications** via Expo Push API
6. **Log notification** in `notifications_log` table

## API Endpoints

### GET `/api/time-based-safety-tips`
Fetch all time-based safety tips
```bash
curl http://localhost:8888/api/time-based-safety-tips
```

### POST `/api/notify/time-tip`
Manually trigger a notification (for testing)
```bash
curl -X POST http://localhost:8888/api/notify/time-tip
```

### POST `/api/notify/test`
Test notification with detailed response
```bash
curl -X POST http://localhost:8888/api/notify/test
```

### POST `/api/token/register`
Register a device push token
```json
{
  "token": "ExponentPushToken[xxxxx]",
  "user_id": "user123"
}
```

## Database Tables

### `time_based_safety_tips`
Stores safety tips for each time phase
```sql
- id (uuid)
- time_range (text) e.g., "00:00–06:00"
- hour_start (integer) e.g., 0
- hour_end (integer) e.g., 6
- awareness (text) e.g., "Break-ins, night theft"
- tip (text) e.g., "Lock everything and avoid late-night movement."
- icon (text) e.g., "moon"
- created_at (timestamp)
```

### `user_push_tokens`
Stores Expo push tokens for registered users
```sql
- id (uuid)
- user_id (text)
- token (text)
- created_at (timestamp)
- updated_at (timestamp)
```

### `notifications_log`
Logs sent notifications
```sql
- id (uuid)
- tip_id (uuid)
- time_range (text)
- sent_at (timestamp)
- recipients (integer)
```

## Testing

### Test Immediate Notification
```bash
curl -X POST http://localhost:8888/api/notify/test
```

### Check Server Health
```bash
curl http://localhost:8888/health
```

### View Logs
The scheduler outputs detailed logs:
```
🕐 Initializing notification scheduler...
✅ Scheduler initialized with 4 daily time phases:
   - 00:00 (Midnight)
   - 06:00 (Morning)
   - 12:00 (Afternoon)
   - 18:00 (Evening)
⏰ Morning (06:00) - Sending morning safety tip
Selected tip for hour 6: 06:00–12:00
Found 5 tokens to notify
Sent 5 notifications.
✅ Time-tip notification completed successfully
```

## Troubleshooting

### No notifications received?
1. Check server logs for errors
2. Verify tokens are registered: `curl http://localhost:8888/api/token/list`
3. Test manually: `curl -X POST http://localhost:8888/api/notify/test`
4. Ensure Expo app is running and has notification permissions

### Wrong time zone?
Update the timezone in `lib/scheduler.js`:
```javascript
cron.schedule("0 6 * * *", () => {
  sendTimeTipNotification();
}, {
  timezone: "Your/Timezone" // Change this
});
```

### Scheduler not running?
- Check that `initializeScheduler()` is called in `server.js`
- Verify node-cron is installed: `npm install node-cron`
- Check server logs for initialization messages

## Client Integration

The HomeScreen in the Aya app already includes notification handling:
- Requests notification permissions on mount
- Registers Expo push token with backend
- Displays notifications in the notification modal
- Shows badge count on notification bell icon

### Client-side Code
```javascript
// Register token
await fetch(`${API_BASE_URL}/api/token/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    token: pushToken, 
    user_id: userId 
  })
});

// Handle received notifications
Notifications.addNotificationReceivedListener((notification) => {
  const body = notification.request.content.body;
  setNotifications((prev) => [body, ...prev]);
});
```

## Production Deployment

1. Set environment variables on your hosting platform
2. Ensure server runs continuously (use PM2, Docker, or similar)
3. Monitor logs for notification delivery
4. Set up error alerting for failed notifications

## License
MIT
