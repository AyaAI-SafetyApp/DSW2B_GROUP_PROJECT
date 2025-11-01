# 📸 Camera-Based AR Training System - Complete Implementation Guide

## 🎯 Overview

**FREE FEATURE** - Available to all users without subscription!

The Aya app now features an advanced **Camera-Based AR Training System** that combines:
- 📹 **Front-facing camera** for visual feedback
- 📱 **Motion sensors** (Accelerometer + Gyroscope) for movement detection  
- 🎯 **Real-time accuracy scoring** (Perfect/Good ratings)
- 💾 **Database storage** of all training sessions in Supabase
- 📊 **Detailed analytics** with sensor data (movement intensity, angles, timestamps)

---

## ✨ Key Features

### 1. **Visual AR Experience**
- Camera opens after 3-second countdown
- See yourself performing moves in real-time
- Overlay graphics show:
  - Current move name
  - Rep counter (e.g., "3/5 reps")
  - Movement intensity bar
  - Body outline guide
  - Score badge

### 2. **Movement Detection**
- **Accelerometer**: Detects movement intensity and direction
- **Gyroscope**: Measures rotation and angular velocity
- **Thresholds**:
  - Defense moves: `magnitude > 1.5` (Good), `> 2.0` (Perfect)
  - Fall safety: `magnitude > 2.0` (Good), `> 2.5` (Perfect)
  - Reaction moves: `magnitude > 1.8` (Good), `> 2.3` (Perfect)

### 3. **Accuracy Scoring**
- **Perfect**: 15 points + Heavy haptic feedback (magnitude >= threshold)
- **Good**: 10 points + Medium haptic feedback  (magnitude > base)
- Real-time feedback: Green glow for Perfect, Yellow for Good

### 4. **Database Storage**
Every training session saves to Supabase `training_sessions` table:

```javascript
{
  user_id: "uuid",
  user_email: "email@example.com",
  training_type: "defense" | "fall" | "reaction",
  training_title: "AR Self-Defense Training",
  score: 145,
  reps_completed: 15,
  total_reps: 15,
  duration_seconds: 180,
  accuracy_percentage: 87,
  perfect_moves: 13,
  good_moves: 2,
  movements_data: [
    {
      moveIndex: 0,
      moveName: "Punch",
      accuracy: "Perfect",
      magnitude: 2.4,
      timestamp: "2025-11-01T10:30:15.000Z",
      gyro: { x: 0.5, y: -0.3, z: 0.1 },
      accelerometer: { x: 1.2, y: 0.8, z: -0.3 }
    },
    // ... more movements
  ],
  completed_at: "2025-11-01T10:33:15.000Z"
}
```

---

## 🚀 How It Works

### User Flow

1. **Navigate to Training**
   - User opens Learning screen
   - Taps on any tutorial (Basic Self-Defense, Fall Safety, etc.)

2. **Camera Permission**
   - App requests camera permission if not granted
   - Shows permission screen with "Grant Permission" button

3. **Camera Opens**
   - Front-facing camera activates
   - User sees themselves on screen with AR overlay

4. **Countdown (3... 2... 1...)**
   - Large animated countdown in center
   - "Get Ready..." instruction
   - "Position yourself in the camera" subtitle
   - Heavy haptic feedback on each count

5. **Training Starts**
   - Move card appears showing current move
   - Movement intensity bar shows live feedback
   - Body outline guide shows proper positioning
   - Rep counter updates (e.g., "2/5 reps")

6. **Perform Moves**
   - User performs physical movement (punch, block, etc.)
   - Sensors detect magnitude of movement
   - If threshold met:
     - Haptic feedback (Heavy or Medium)
     - Flash animation (green glow)
     - Score increases (+15 or +10)
     - Rep counter increments
     - Movement data recorded to `sessionData.movements[]`

7. **Progress Through Moves**
   - After 5 reps of current move → advance to next move
   - Success haptic notification
   - New move card appears

8. **Training Complete**
   - After all moves completed:
     - Calculate statistics (duration, accuracy%, perfect/good counts)
     - Save to Supabase `training_sessions` table
     - Show completion alert with detailed stats
     - Options: "Train Again" or "Done"

---

## 📁 File Structure

### New Files Created

1. **`CameraARTrainingScreen.js`**
   - Location: `AyaApp/screens/Learning/CameraARTrainingScreen.js`
   - Purpose: Main AR training screen with camera integration
   - Key Components:
     - Camera view with front-facing mode
     - Motion sensor listeners (Accelerometer, Gyroscope)
     - Movement detection algorithm
     - Real-time UI overlays
     - Database save function

2. **`training_sessions_schema.sql`**
   - Location: `Backend/training_sessions_schema.sql`
   - Purpose: Supabase database schema for training data
   - Contents:
     - `training_sessions` table definition
     - Indexes for performance
     - Row Level Security (RLS) policies
     - `training_stats` view for analytics

### Modified Files

1. **`LearningScreen.js`**
   - Changed: `navigation.navigate("CameraARTraining")` instead of `ARTraining`
   - Tutorials array remains the same (no premium locks)

2. **`App.js`**
   - Added: Import for `CameraARTrainingScreen`
   - Added: Stack.Screen route for "CameraARTraining"

3. **`newsService.js`**
   - Fixed: Mediastack API 429 error with 1-hour cache
   - Added: Cache timestamp checking

4. **`package.json`**
   - Added: `expo-camera` dependency

---

## 🎨 UI Components

### Camera Overlay Elements

1. **Header Bar** (Top)
   - Back button (left)
   - Training title with 📸 emoji (center)
   - Score badge (right, purple background)

2. **Progress Bar** (Below header)
   - Green fill showing completion percentage
   - Text: "12/15 reps"

3. **Countdown Screen** (Before training)
   - Large animated number (120px font)
   - "Get Ready..." label
   - "Position yourself in the camera" instruction
   - Black semi-transparent background

4. **Move Card** (During training)
   - Animated glow background (changes with accuracy)
   - "Move 2/3" label
   - Large move name (e.g., "Punch")
   - Rep counter "3/5 reps"

5. **Movement Intensity Bar**
   - Label: "Movement Intensity"
   - Progress bar (green for Perfect, yellow for Good)
   - Text feedback: "Perfect!" / "Good!" / "Move more!"

6. **Body Outline Guide**
   - Simple body shape outline
   - Purple border
   - Joint dots showing key positions

7. **Control Buttons** (Bottom)
   - Pause button (red, during training)
   - Play button (green, when paused)
   - Large circular buttons with icons

---

## 🗄️ Database Schema

### training_sessions Table

```sql
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  training_type TEXT, -- 'defense', 'fall', 'reaction'
  training_title TEXT,
  score INTEGER,
  reps_completed INTEGER,
  total_reps INTEGER,
  duration_seconds INTEGER,
  accuracy_percentage INTEGER,
  perfect_moves INTEGER,
  good_moves INTEGER,
  movements_data JSONB, -- Detailed sensor readings
  completed_at TIMESTAMP,
  created_at TIMESTAMP
);
```

### Indexes
- `idx_training_sessions_user_id` - Fast user queries
- `idx_training_sessions_training_type` - Filter by type
- `idx_training_sessions_completed_at` - Sort by date

### RLS Policies
- Users can only SELECT/INSERT/UPDATE/DELETE their own sessions
- Policy checks: `auth.uid() = user_id`

### training_stats View
Aggregated statistics per user and training type:
- Total sessions
- Total/average score
- Total reps
- Average accuracy
- Total perfect moves
- Total duration
- Last training date

---

## 🔧 Setup Instructions

### 1. Install Dependencies
```bash
cd AyaApp
npx expo install expo-camera
```

### 2. Create Database Table
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `Backend/training_sessions_schema.sql`
4. Paste and run the SQL

### 3. Test Permissions
- Run app on physical device (camera doesn't work in simulators)
- Navigate to Learning → Any tutorial
- Grant camera permission when prompted

### 4. Configure Camera (Android)
Add to `app.json`:
```json
{
  "expo": {
    "android": {
      "permissions": [
        "CAMERA"
      ]
    }
  }
}
```

---

## 📊 Data Analytics Queries

### Get User Training History
```sql
SELECT 
  training_title,
  score,
  accuracy_percentage,
  duration_seconds,
  completed_at
FROM training_sessions
WHERE user_email = 'user@example.com'
ORDER BY completed_at DESC;
```

### Get Average Performance by Training Type
```sql
SELECT 
  training_type,
  AVG(score) as avg_score,
  AVG(accuracy_percentage) as avg_accuracy,
  COUNT(*) as total_sessions
FROM training_sessions
GROUP BY training_type;
```

### Get Movement Details for Analysis
```sql
SELECT 
  training_title,
  movements_data
FROM training_sessions
WHERE user_id = 'user-uuid'
ORDER BY completed_at DESC
LIMIT 1;
```

---

## 🎯 Movement Detection Algorithm

### How It Works

1. **Sensor Listeners**
   ```javascript
   Accelerometer.addListener((data) => {
     const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
     if (magnitude > threshold) {
       onMoveDetected(accuracy, magnitude);
     }
   });
   ```

2. **Threshold Calculation**
   - Base threshold varies by training type
   - Defense: 1.5 (Good), 2.0 (Perfect)
   - Fall: 2.0 (Good), 2.5 (Perfect)
   - Reaction: 1.8 (Good), 2.3 (Perfect)

3. **Accuracy Determination**
   ```javascript
   const accuracy = magnitude >= accuracyThreshold ? "Perfect" : "Good";
   ```

4. **Data Recording**
   ```javascript
   const movementRecord = {
     moveIndex: currentMoveIndex,
     moveName: training.moves[currentMoveIndex],
     accuracy,
     magnitude,
     timestamp: new Date().toISOString(),
     gyro: { ...gyroData },
     accelerometer: { ...motionData }
   };
   ```

---

## 🐛 Troubleshooting

### Issue: Camera not opening
**Solution**: 
- Check camera permissions in device settings
- Restart app after granting permission
- Verify expo-camera is installed: `npx expo install expo-camera`

### Issue: Movements not detected
**Solution**:
- Move phone more vigorously
- Check sensor availability: Some emulators don't support sensors
- Test on physical device

### Issue: Database save fails
**Solution**:
- Check Supabase connection
- Verify training_sessions table exists
- Check RLS policies are enabled
- Verify user is authenticated

### Issue: Countdown doesn't start
**Solution**:
- Check `cameraReady` state
- Verify `useEffect` dependency on `cameraReady`
- Look for console errors

---

## 🚀 Future Enhancements

### Potential Features

1. **AI Pose Detection**
   - Use TensorFlow.js PoseNet
   - Detect body keypoints (shoulders, elbows, wrists, etc.)
   - Validate move correctness based on pose
   - Score based on form accuracy

2. **Video Recording**
   - Record training sessions as videos
   - Save to Supabase Storage
   - Review technique later
   - Share with instructors

3. **Multiplayer Training**
   - Real-time training with friends
   - Leaderboards and challenges
   - Social features

4. **AR Opponent**
   - Virtual opponent on screen
   - Practice timing and distance
   - Reactive AI behavior

5. **Personalized Training Plans**
   - Based on performance analytics
   - Adaptive difficulty
   - Focus on weak areas

---

## 📚 Additional Resources

### Expo Camera Docs
https://docs.expo.dev/versions/latest/sdk/camera/

### Expo Sensors Docs
https://docs.expo.dev/versions/latest/sdk/sensors/

### Supabase JSONB Guide
https://supabase.com/docs/guides/database/json

### Motion Sensor Calibration
https://developer.android.com/guide/topics/sensors/sensors_motion

---

## ✅ Testing Checklist

- [ ] Camera permission granted
- [ ] Front camera opens correctly
- [ ] Countdown starts after 1 second
- [ ] Move card displays current move
- [ ] Movement intensity bar updates in real-time
- [ ] Reps increment when threshold met
- [ ] Haptic feedback works (vibration)
- [ ] Score increases correctly (15 or 10 points)
- [ ] Progress bar fills accurately
- [ ] Training completes after all moves
- [ ] Completion alert shows correct stats
- [ ] Data saves to Supabase successfully
- [ ] Can view training history in database
- [ ] Can train again after completion
- [ ] Back button returns to Learning screen
- [ ] Pause/Resume buttons work correctly

---

## 📝 Credits

**Developed by**: Mbongeni Qwabe & Team
**Date**: November 1, 2025
**Version**: 1.0.0
**Feature Status**: ✅ FREE for all users

---

**Happy Training! Stay Safe with Aya! 💪🥊📸**
