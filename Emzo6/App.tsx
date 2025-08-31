/**
 * Wakeword Detection App using Picovoice Porcupine
 * @format
 */

import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  TouchableOpacity,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

// Import Porcupine components
import { PorcupineManager } from '@picovoice/porcupine-react-native';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [porcupineManager, setPorcupineManager] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [detectionCount, setDetectionCount] = useState(0);
  const [lastDetection, setLastDetection] = useState<string>('');

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // First check if permission is already granted
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        
        if (hasPermission) {
          console.log('Microphone permission already granted');
          return true;
        }

        // Request permission if not already granted
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone for wakeword detection',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        console.log('Permission request result:', granted, 'isGranted:', isGranted);
        return isGranted;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  // Initialize Porcupine
  const initPorcupine = async () => {
    try {
      console.log('Requesting microphone permission...');
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Microphone permission is required for wakeword detection. Please grant permission in Settings.');
        return;
      }

      console.log('Initializing Porcupine...');
 
      const accessKey = 'kCsrJ/Pm9rT2SHwbfmZyLANxyk9W17W3OOf924XqkSNdXBBODAog7g==';
      const keywordPath = 'Hello-Aya_en_android_v3_0_0.ppn';

      const manager = await PorcupineManager.fromKeywordPaths(
        accessKey,
        [keywordPath],
        (keywordIndex: number) => {
          console.log('Wakeword detected!', keywordIndex);
          setDetectionCount(prev => prev + 1);
          setLastDetection(new Date().toLocaleTimeString());
          Alert.alert('Wakeword Detected!', 'Hello Aya was detected!');
        }
      );

      setPorcupineManager(manager);
      console.log('Porcupine initialized successfully');
    } catch (error) {
      console.error('Error initializing Porcupine:', error);
      Alert.alert('Initialization Error', 'Failed to initialize wakeword detection: ' + String(error));
    }
  };

  // Start listening
  const startListening = async () => {
    if (porcupineManager) {
      try {
        await porcupineManager.start();
        setIsListening(true);
      } catch (error) {
        console.error('Error starting Porcupine:', error);
        Alert.alert('Error', 'Failed to start listening: ' + error);
      }
    }
  };

  // Stop listening
  const stopListening = async () => {
    if (porcupineManager) {
      try {
        await porcupineManager.stop();
        setIsListening(false);
      } catch (error) {
        console.error('Error stopping Porcupine:', error);
      }
    }
  };

  // Cleanup
  const cleanup = async () => {
    if (porcupineManager) {
      try {
        await porcupineManager.delete();
        setPorcupineManager(null);
        setIsListening(false);
      } catch (error) {
        console.error('Error cleaning up Porcupine:', error);
      }
    }
  };

  useEffect(() => {
    initPorcupine();
    return () => {
      cleanup();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Wakeword Detection App</Text>
        <Text style={styles.subtitle}>Say "Hello Aya" to trigger detection</Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Status: {isListening ? '🎤 Listening...' : '⏸️ Stopped'}
        </Text>
        <Text style={styles.countText}>Detections: {detectionCount}</Text>
        {lastDetection && (
          <Text style={styles.lastDetectionText}>
            Last detection: {lastDetection}
          </Text>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isListening && styles.buttonActive]}
          onPress={isListening ? stopListening : startListening}
          disabled={!porcupineManager}
        >
          <Text style={styles.buttonText}>
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={initPorcupine}
        >
          <Text style={styles.buttonText}>Reinitialize</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
      
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  statusContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  countText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  lastDetectionText: {
    fontSize: 14,
    color: '#888',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#8E8E93',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});

export default App;

