import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SafetyPreferencesScreen({ navigation }) {
  const [preferences, setPreferences] = useState({
    autoSOS: false,
    locationSharing: true,
    emergencyAlerts: true,
    safeZoneAlerts: false,
    panicMode: true,
    voiceActivation: false,
    silentMode: false,
    shakeToAlert: true,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem('@safety_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (newPreferences) => {
    try {
      await AsyncStorage.setItem('@safety_preferences', JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save preferences');
    }
  };

  const togglePreference = (key) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    savePreferences(newPreferences);
  };

  const renderPreferenceItem = (title, description, key, icon) => (
    <View style={styles.preferenceItem}>
      <View style={styles.preferenceLeft}>
        <Ionicons name={icon} size={24} color="#FF1493" />
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={() => togglePreference(key)}
        trackColor={{ false: '#D3D3D3', true: '#FFB6D9' }}
        thumbColor={preferences[key] ? '#FF1493' : '#f4f3f4'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Emergency Features</Text>
          {renderPreferenceItem(
            'Auto SOS',
            'Automatically send SOS after 3 shakes',
            'autoSOS',
            'alert-circle-outline'
          )}
          {renderPreferenceItem(
            'Panic Mode',
            'Quick access to emergency services',
            'panicMode',
            'warning-outline'
          )}
          {renderPreferenceItem(
            'Shake to Alert',
            'Shake phone to trigger emergency alert',
            'shakeToAlert',
            'phone-portrait-outline'
          )}
          {renderPreferenceItem(
            'Voice Activation',
            'Use voice commands for SOS',
            'voiceActivation',
            'mic-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Tracking</Text>
          {renderPreferenceItem(
            'Location Sharing',
            'Share your location with emergency contacts',
            'locationSharing',
            'location-outline'
          )}
          {renderPreferenceItem(
            'Safe Zone Alerts',
            'Get notified when entering/leaving safe zones',
            'safeZoneAlerts',
            'shield-checkmark-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderPreferenceItem(
            'Emergency Alerts',
            'Receive safety alerts in your area',
            'emergencyAlerts',
            'notifications-outline'
          )}
          {renderPreferenceItem(
            'Silent Mode',
            'Disable sound for discrete alerts',
            'silentMode',
            'volume-mute-outline'
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#FF1493" />
          <Text style={styles.infoText}>
            These settings help customize your safety experience. Enable the features that work best for you.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF1493',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  preferenceText: {
    marginLeft: 15,
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  preferenceDescription: {
    fontSize: 13,
    color: '#999',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F8',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB6D9',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
