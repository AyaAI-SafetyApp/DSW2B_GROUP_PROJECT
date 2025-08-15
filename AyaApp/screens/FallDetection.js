import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Linking from 'expo-linking';

const WHATSAPP_CONTACTS = [
  '+27123456789', // Contact 1 (replace with real number)
  '+27987654321', // Contact 2
];

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

  async function sendLocationToWhatsApp(location) {
    if (!location) return;

    const { latitude, longitude } = location.coords;
    const message = Help me I fell! My location: https://maps.google.com/?q=${latitude},${longitude};

    for (const phoneNumber of WHATSAPP_CONTACTS) {
      const url = whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)};
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('WhatsApp is not installed or cannot open');
      }
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
        await sendLocationToWhatsApp(location);
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