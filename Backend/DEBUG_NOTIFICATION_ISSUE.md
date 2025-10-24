# 🔧 Debugging Notification System Issue

## Problem
The scheduler is getting a "TypeError: fetch failed" when trying to access Supabase.

## Root Causes Identified
1. **Supabase connection issue** - The fetch is failing to connect to Supabase
2. **Possible table doesn't exist** - The `time_based_safety_tips` table might not be created in Supabase

## What I Added

### 1. Enhanced Error Logging
- Added detailed error logging in `lib/scheduler.js`
- Shows exactly what error Supabase returns

### 2. Debug Endpoint
Added `/api/debug/supabase` endpoint to test the connection

### 3. Better Error Messages
All endpoints now show detailed error information

---

## 🧪 How to Debug

### Step 1: Restart the Server
```bash
cd Backend
npm start
```

### Step 2: Test Supabase Connection
Open in browser or use curl:
```bash
curl http://localhost:3001/api/debug/supabase
```

**Expected Response if Working:**
```json
{
  "success": true,
  "message": "Supabase connection OK",
  "rowsFound": 5,
  "sampleData": [...]
}
```

**Expected Response if Table Missing:**
```json
{
  "success": false,
  "error": "relation \"public.time_based_safety_tips\" does not exist",
  "hint": "..."
}
```

### Step 3: Test the Tips Endpoint
```bash
curl http://localhost:3001/api/time-based-safety-tips
```

---

## 🗄️ Database Setup Required

### Check if Table Exists in Supabase

Go to your Supabase dashboard:
1. Navigate to: https://mcjjabajtfodvmixklfj.supabase.co
2. Go to **Table Editor**
3. Look for `time_based_safety_tips` table

### If Table Doesn't Exist - Create It

Run this SQL in Supabase SQL Editor:

```sql
-- Create time_based_safety_tips table
CREATE TABLE IF NOT EXISTS public.time_based_safety_tips (
    id SERIAL PRIMARY KEY,
    time_range TEXT NOT NULL,
    hour_start INTEGER NOT NULL,
    hour_end INTEGER NOT NULL,
    awareness TEXT NOT NULL,
    tip TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for testing
INSERT INTO public.time_based_safety_tips (time_range, hour_start, hour_end, awareness, tip) VALUES
('Night (00:00–06:00)', 0, 6, 'Break-ins, night theft', 'Lock everything and avoid late-night movement.'),
('Morning (06:00–12:00)', 6, 12, 'Phone snatching, muggings', 'Stay alert on commute; keep valuables hidden.'),
('Afternoon (12:00–18:00)', 12, 18, 'Burglaries, car theft', 'Lock your home and car; don''t leave items visible.'),
('Evening (18:00–24:00)', 18, 24, 'Hijackings, robberies', 'Stay alert when driving; avoid dark, quiet areas.');

-- Grant access
ALTER TABLE public.time_based_safety_tips ENABLE ROW LEVEL SECURITY;

-- Create policy to allow read access
CREATE POLICY "Allow public read access" ON public.time_based_safety_tips
    FOR SELECT USING (true);
```

### Create user_push_tokens Table

```sql
-- Create user_push_tokens table
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    user_id TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Grant access
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public insert" ON public.user_push_tokens
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.user_push_tokens
    FOR SELECT USING (true);
```

### Create notifications_log Table

```sql
-- Create notifications_log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
    id SERIAL PRIMARY KEY,
    tip_id INTEGER,
    time_range TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    recipients INTEGER
);

-- Grant access
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert" ON public.notifications_log
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read" ON public.notifications_log
    FOR SELECT USING (true);
```

---

## 🔍 Check Server Logs

When you restart the server, look for:

```
✅ Scheduler initialized with test + 4 daily time phases
```

Then after 1 minute:

```
🧪 TEST NOTIFICATION (1 minute delay) - Sending safety tip
[2025-10-24T...] Running scheduled time-tip notification...
✓ Supabase client is available
Fetching tips from time_based_safety_tips table...
✓ Found 4 tips in database
Selected tip for hour XX: ...
✓ Found X tokens to notify
```

---

## ✅ Expected Flow

1. **Server starts** → Scheduler initializes
2. **After 1 minute** → Test notification triggers
3. **Scheduler fetches tips** from Supabase
4. **Scheduler fetches tokens** from Supabase
5. **Sends notifications** via Expo Push API
6. **Logs to database** in notifications_log table

---

## 🐛 Common Issues

### Issue 1: "relation does not exist"
**Solution:** Create the tables in Supabase (see SQL above)

### Issue 2: "permission denied"
**Solution:** Enable RLS and create policies (see SQL above)

### Issue 3: "fetch failed"
**Solution:** 
- Check your internet connection
- Verify Supabase URL and KEY are correct
- Make sure Supabase project is active

### Issue 4: "No tokens to notify"
**Solution:** The app hasn't registered any push tokens yet. This is normal if you haven't run the app.

---

## 🎯 Next Steps

1. ✅ Run the debug endpoint to verify connection
2. ✅ Create missing tables in Supabase
3. ✅ Restart the server
4. ✅ Wait 1 minute for test notification
5. ✅ Check server logs for success

Once tables are created and connection works, the scheduler will run successfully! 🚀
