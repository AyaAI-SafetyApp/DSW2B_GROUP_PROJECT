# 🎤 Porcupine Wakeword Detection - EAS Build Setup

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
- EAS build will automatically include the `.ppn` file from assets folder
