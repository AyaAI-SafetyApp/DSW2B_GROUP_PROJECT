import React, { useState, useEffect } from 'react';
import { View, Text, Alert, Platform, SafeAreaView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Accelerometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { hasFeatureAccess, showUpgradePrompt, FEATURES } from '../utils/subscriptionUtils';
import { useNavigation } from '@react-navigation/native';

const API_BASE = 'https://dsw2b-backend.onrender.com';

export default function FallDetector() {
  const navigation = useNavigation();
  const [fallDetected, setFallDetected] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Check feature access
  useEffect(() => {
    checkAccess();
  }, []);

  // Re-check access when screen gains focus (after returning from subscription)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      checkAccess();
    });
    return unsubscribe;
  }, [navigation]);

  const checkAccess = async () => {
    try {
      const access = await hasFeatureAccess(FEATURES.FALL_DETECTION);
      setHasAccess(access);
    } catch (error) {
      console.error('Error checking access:', error);
      setHasAccess(false);
    } finally {
      setCheckingAccess(false);
    }
  };

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
          userId: 'user123',
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

  // Show loading or locked screen
  if (checkingAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#de0973ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.lockedContainer}>
          <Ionicons name="lock-closed" size={80} color="#de0973ff" />
          <Text style={styles.lockedTitle}>Premium Feature</Text>
          <Text style={styles.lockedDescription}>
            Fall Detection requires a Personal subscription (R49.99/month).
            Automatically detect falls and alert emergency contacts.
          </Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => showUpgradePrompt(navigation, 'Fall Detection')}
          >
            <Ionicons name="star" size={20} color="#FFFFFF" />
            <Text style={styles.upgradeButtonText}>Upgrade to Personal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{fallDetected ? '⚠ Fall Detected!' : 'Monitoring for falls...'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  lockedDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#de0973ff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backButtonText: {
    fontSize: 16,
    color: '#de0973ff',
    fontWeight: '600',
  },
});