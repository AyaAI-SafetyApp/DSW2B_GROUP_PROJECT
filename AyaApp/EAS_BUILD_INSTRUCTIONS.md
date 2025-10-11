# 🎤 Porcupine Wakeword Detection - EAS Build Setup

## Problem
You've installed `@picovoice/porcupine-react-native` which is a **native module**. Native modules need to be compiled into your app binary. Your current development build doesn't include Porcupine yet.

## Solution: Create a New Development Build

Since you're using EAS Build, you need to rebuild your development client with the new native module.

### Step 1: Build a New Development Client

Run this command to create a new development build with Porcupine included:

```bash
# For Android
eas build --profile development --platform android

# For iOS (if needed)
eas build --profile development --platform ios
```

This will:
- Compile the Porcupine native modules
- Include the wakeword model file from assets
- Create a new APK/IPA with native support

### Step 2: Install the New Build

1. Wait for the EAS build to complete (check https://expo.dev)
2. Download and install the new development APK on your device
3. The new build will include Porcupine native modules

### Step 3: Run Your App

After installing the new development build:

```bash
npx expo start --dev-client
```

This connects to the new development build which has Porcupine compiled in.

## Why This Is Needed

**Before:** Your app was built before Porcupine was added
- Porcupine native code: ❌ Not compiled
- Result: `Cannot read property 'fromKeywordPaths' of null`

**After rebuilding:** New development client includes Porcupine
- Porcupine native code: ✅ Compiled and included
- Result: Wakeword detection works! 🎉

## Alternative: Test Without Rebuilding

If you want to test the app without waiting for a rebuild, you can temporarily:

1. Comment out the WakewordDetection component
2. Use the old WebView approach for now
3. Wait for the development build to complete
4. Switch back to WakewordDetection

## Quick Commands

```bash
# 1. Build new development client
eas build --profile development --platform android

# 2. After build completes, install APK on device

# 3. Start development server
npx expo start --dev-client

# 4. Test "Hello Aya" wakeword!
```

## Verify It's Working

After installing the new build, you should see:

```
LOG  [WakewordDetection] Requesting microphone permission...
LOG  [WakewordDetection] Microphone permission already granted
LOG  [WakewordDetection] Initializing Porcupine...
LOG  [WakewordDetection] Porcupine initialized successfully ✅
LOG  [WakewordDetection] Started listening
```

Then say "Hello Aya" and it should trigger the SOS!

## Notes

- Development builds take ~10-20 minutes to compile
- You only need to rebuild when adding/removing native modules
- After rebuilding once, normal code changes use Fast Refresh (no rebuild needed)
- Your EAS build will automatically include the `.ppn` file from assets folder
