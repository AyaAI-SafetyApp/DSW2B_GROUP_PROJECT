# Time-Based Safety Tips Feature

## Overview
This feature stores time-based safety tips in Supabase and displays them as notifications in the app when entering a new time phase (00:00-06:00, 06:00-12:00, 12:00-18:00, 18:00-24:00).

## Setup Instructions

### 1. Create Supabase Table

Go to your Supabase project dashboard:
1. Navigate to **SQL Editor**
2. Copy and paste the contents of `supabase_schema.sql`
3. Click **Run** to create the table

Alternatively, you can create the table manually:
- Go to **Table Editor**
- Click **New Table**
- Name: `time_based_safety_tips`
- Add columns:
  - `id` (int8, primary key, auto-increment)
  - `time_range` (text, required)
  - `hour_start` (int4, required)
  - `hour_end` (int4, required)
  - `awareness` (text, required)
  - `tip` (text, required)
  - `icon` (text, required)
  - `created_at` (timestamptz, default: now())

### 2. Backend Setup

The backend will automatically initialize the tips when the server starts. Just restart your backend server:

```bash
cd Backend
npm start
```

You should see this log message:
```
✅ Time-based safety tips initialized in Supabase
```

### 3. API Endpoints

**Get current time-based tip:**
```
GET /api/time-based-tip
```
Returns the tip for the current hour.

**Get all time-based tips:**
```
GET /api/time-based-tips/all
```
Returns all tips ordered by time.

### 4. Frontend Behavior

The HomeScreen will:
1. Fetch the current time-based tip on mount
2. Check every minute for a new time phase
3. Add a notification when entering a new time phase (e.g., transitioning from 05:59 to 06:00)
4. Store the last time phase in AsyncStorage to avoid duplicate notifications
5. Display notifications in the notification modal

## Notification Format

Notifications will appear like:
```
00:00–06:00: Be aware of Break-ins, night theft. Lock everything and avoid late-night movement.
```

## Time Phases

| Time Range | Icon | Awareness | Tip |
|------------|------|-----------|-----|
| 00:00–06:00 | moon | Break-ins, night theft | Lock everything and avoid late-night movement. |
| 06:00–12:00 | sunny-outline | Phone snatching, muggings | Stay alert on commute; keep valuables hidden. |
| 12:00–18:00 | partly-sunny | Burglaries, car theft | Lock your home and car; don't leave items visible. |
| 18:00–24:00 | moon-outline | Hijackings, robberies | Stay alert when driving; avoid dark, quiet areas. |

## Testing

To test the feature:
1. Restart the backend server
2. Open the app
3. Check notifications - you should see the current time phase tip
4. Wait for the next time phase change (e.g., if it's 05:59, wait 1 minute)
5. A new notification should appear

## Database Structure

```sql
time_based_safety_tips
├── id (PRIMARY KEY)
├── time_range (UNIQUE, e.g., "00:00–06:00")
├── hour_start (e.g., 0)
├── hour_end (e.g., 6)
├── awareness (e.g., "Break-ins, night theft")
├── tip (e.g., "Lock everything and avoid late-night movement.")
├── icon (e.g., "moon")
└── created_at (TIMESTAMP)
```
