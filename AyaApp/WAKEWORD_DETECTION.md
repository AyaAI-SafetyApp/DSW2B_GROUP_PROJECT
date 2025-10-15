# Wakeword Detection - "Hello Aya"

This component enables voice-activated emergency SOS using Picovoice Porcupine for wakeword detection.

## Setup

### Integration
The `WakewordDetection` component has been integrated into `SosScreen.js`:
- Replaces the previous WebView-based speech recognition
- Uses Picovoice Porcupine for offline, on-device wakeword detection
- Triggers SOS alert when "Hello Aya" is detected

## Usage

### In SosScreen.js
```javascript
import WakewordDetection from "../components/WakewordDetection";

<WakewordDetection
  onWakewordDetected={triggerSOS}
  enabled={fallDetectionEnabled}
/>
```

### Component Props
- `onWakewordDetected`: Callback function when "Hello Aya" is detected
- `enabled`: Boolean to enable/disable wakeword detection (default: true)
- `accessKey`: Picovoice access key (optional, has default)

## How It Works

1. **Initialization**: Component requests microphone permission on mount
2. **Listening**: When enabled, Porcupine continuously listens for "Hello Aya"
3. **Detection**: When wakeword is detected, `onWakewordDetected` callback is triggered
4. **Cleanup**: Automatically stops and cleans up when component unmounts

## Features

✅ **Offline Detection**: Works without internet connection  
✅ **Low Power**: Optimized for battery efficiency  
✅ **Privacy**: All processing happens on-device  
✅ **Accurate**: Custom-trained model for "Hello Aya"  
✅ **Permission Handling**: Automatically requests microphone permission  

## Android Configuration

For Android builds, you may need to ensure the model file is included in the APK:

1. The `.ppn` file is in `assets/` folder
2. For EAS builds, it will be automatically bundled
3. For local builds, verify `android/app/src/main/assets/` contains the file

## Troubleshooting

### Wakeword not detected
- Check microphone permissions are granted
- Ensure model file exists in `assets/` folder
- Verify `enabled` prop is `true`
- Check console logs for initialization errors

### Permission errors
- Grant microphone permission when prompted
- On Android, check Settings > Apps > AyaApp > Permissions

### Build errors
- Ensure `@picovoice/porcupine-react-native` is installed
- Run `pnpm install` to sync dependencies
- Clear Metro cache: `npx expo start --clear`

## Testing

To test wakeword detection:
1. Enable "Alerts" toggle in SOS screen
2. Say "Hello Aya" clearly into the microphone
3. SOS alert should be triggered automatically

## Notes

- The wakeword detection only works when the Alerts toggle is enabled
- The component is headless (renders nothing visually)
- All logging is prefixed with `[WakewordDetection]` for easy debugging
