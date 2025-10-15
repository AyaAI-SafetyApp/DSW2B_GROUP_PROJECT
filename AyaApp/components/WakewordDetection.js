/**
 * Wakeword Detection Component using Picovoice Porcupine
 * Detects "Hello Aya" wakeword and triggers callback
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { PorcupineManager } from '@picovoice/porcupine-react-native';
import { Asset } from 'expo-asset';

const WakewordDetection = ({ 
  onWakewordDetected, 
  enabled = true,
  accessKey = 'CHhz+LlAbLm5TIb7n2ROngHTZc2yrfvLMlwbOkB4piPJFoz9hoUHsg==',
}) => {
  const [porcupineManager, setPorcupineManager] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const porcupineRef = useRef(null);

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (hasPermission) {
          console.log('[WakewordDetection] Microphone permission already granted');
          return true;
        }

        // Request permission if not already granted
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Aya needs access to your microphone for wakeword detection',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('[WakewordDetection] Permission request result:', granted);
        return isGranted;
      } catch (err) {
        console.warn('[WakewordDetection] Permission request error:', err);
        return false;
      }
    }
    // iOS permissions handled by info.plist
    return true;
  };

  // Initialize Porcupine
  const initPorcupine = async () => {
    try {
      // Check if PorcupineManager is available (native module compiled)
      if (!PorcupineManager || !PorcupineManager.fromKeywordPaths) {
        console.warn('[WakewordDetection] ⚠️  Porcupine native module not available yet.');
        console.warn('[WakewordDetection] 📱 You need to rebuild your development client with EAS:');
        console.warn('[WakewordDetection] 💡 Run: eas build --profile development --platform android');
        console.warn('[WakewordDetection] 📖 See EAS_BUILD_INSTRUCTIONS.md for details');
        return;
      }

      console.log('[WakewordDetection] Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      
      if (!hasPermission) {
        console.error('[WakewordDetection] Microphone permission denied');
        Alert.alert(
          'Permission Required', 
          'Microphone permission is required for "Hello Aya" voice detection. Please grant permission in Settings.'
        );
        setHasPermission(false);
        return;
      }

      setHasPermission(true);
      console.log('[WakewordDetection] Initializing Porcupine...');
 
      const keywordPath = 'Hello-Aya_en_android_v3_0_0.ppn';
      console.log('[WakewordDetection] Using model:', keywordPath);

      const manager = await PorcupineManager.fromKeywordPaths(
        accessKey,
        [keywordPath],
        (keywordIndex) => {
          console.log('[WakewordDetection] Wakeword detected! Index:', keywordIndex);
          if (onWakewordDetected) {
            onWakewordDetected();
          }
        }
      );

      setPorcupineManager(manager);
      porcupineRef.current = manager;
      console.log('[WakewordDetection] ✅ Porcupine initialized successfully');
      
      // Auto-start if enabled
      if (enabled) {
        await manager.start();
        setIsListening(true);
        console.log('[WakewordDetection] 🎤 Started listening for "Hello Aya"');
      }
    } catch (error) {
      console.error('[WakewordDetection] Error initializing Porcupine:', error);
      
      // Check if it's a native module error
      if (error.message && error.message.includes('null')) {
        console.error('[WakewordDetection] ❌ Native module not compiled in current build');
        console.error('[WakewordDetection] 📱 Rebuild with: eas build --profile development --platform android');
      } else {
        Alert.alert(
          'Initialization Error', 
          'Failed to initialize wakeword detection. Make sure you have rebuilt your development client with the native Porcupine module.'
        );
      }
    }
  };

  // Start listening
  const startListening = async () => {
    if (porcupineManager && !isListening) {
      try {
        await porcupineManager.start();
        setIsListening(true);
        console.log('[WakewordDetection] Started listening');
      } catch (error) {
        console.error('[WakewordDetection] Error starting:', error);
      }
    }
  };

  // Stop listening
  const stopListening = async () => {
    if (porcupineManager && isListening) {
      try {
        await porcupineManager.stop();
        setIsListening(false);
        console.log('[WakewordDetection] Stopped listening');
      } catch (error) {
        console.error('[WakewordDetection] Error stopping:', error);
      }
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (porcupineRef.current) {
      try {
        await porcupineRef.current.delete();
        setPorcupineManager(null);
        porcupineRef.current = null;
        setIsListening(false);
        console.log('[WakewordDetection] Cleaned up successfully');
      } catch (error) {
        console.error('[WakewordDetection] Error cleaning up:', error);
      }
    }
  };

  // Initialize on mount
  useEffect(() => {
    initPorcupine();
    return () => {
      cleanup();
    };
  }, []);

  // Handle enabled prop changes
  useEffect(() => {
    if (!porcupineManager || !hasPermission) return;

    if (enabled && !isListening) {
      startListening();
    } else if (!enabled && isListening) {
      stopListening();
    }
  }, [enabled, porcupineManager, hasPermission]);

  // This component doesn't render anything
  return null;
};

export default WakewordDetection;
