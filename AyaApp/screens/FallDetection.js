import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';

const API_BASE = 'https://dsw2b-backend.onrender.com';

export default function FallDetector() {
  const [fallDetected, setFallDetected] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      alert('Accelerometer not supported on web');
      return;
    }

    Accelerometer.setUpdateInterval(200);
    const subscription = Accelerometer.addListener(detectFall);

    return () => subscription && subscription.remove();
  }, []);

  let fallTimestamp = null;

  async function getLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return null;
    }
    return await Location.getCurrentPositionAsync({});
  }

  async function sendFallAlert(location) {
    if (!location) return;

    const { latitude, longitude } = location.coords;
    
    try {
      const response = await fetch(`${API_BASE}/api/send-location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123', // You can make this dynamic
          timestamp: Date.now(),
          coords: { latitude, longitude }
        })
      });
      
      const result = await response.json();
      Alert.alert('✅ Emergency Alert Sent', 'Your emergency contacts have been notified via WhatsApp and voice call.');
      console.log('Fall alert sent:', result);
    } catch (error) {
      console.error('Failed to send fall alert:', error);
      Alert.alert('❌ Alert Failed', 'Could not send emergency alert. Please contact help manually.');
    }
  }

  const detectFall = async ({ x, y, z }) => {
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const HIGH_THRESHOLD = 2.5;
    const LOW_THRESHOLD = 0.5;

    if (magnitude > HIGH_THRESHOLD) {
      fallTimestamp = Date.now();
    }

    if (
      fallTimestamp &&
      Date.now() - fallTimestamp < 1500 &&
      magnitude < LOW_THRESHOLD
    ) {
      if (!fallDetected) {
        setFallDetected(true);
        Alert.alert('⚠ Fall Detected!');
        const location = await getLocation();
        await sendFallAlert(location);
      }
      fallTimestamp = null;
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{fallDetected ? '⚠ Fall Detected!' : 'Monitoring for falls...'}</Text>
    </View>
  );
}