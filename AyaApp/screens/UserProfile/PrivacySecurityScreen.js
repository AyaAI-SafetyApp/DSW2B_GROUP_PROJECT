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

export default function PrivacySecurityScreen({ navigation }) {
  const [settings, setSettings] = useState({
    biometricAuth: true,
    twoFactorAuth: false,
    locationHistory: true,
    dataSharing: false,
    analyticsTracking: true,
    profileVisibility: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('@privacy_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      await AsyncStorage.setItem('@privacy_settings', JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const renderSettingItem = (title, description, key, icon) => (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#FF1493" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#D3D3D3', true: '#FFB6D9' }}
        thumbColor={settings[key] ? '#FF1493' : '#f4f3f4'}
      />
    </View>
  );

  const renderActionItem = (title, description, icon, onPress) => (
    <TouchableOpacity style={styles.actionItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={24} color="#FF1493" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          <Text style={styles.settingDescription}>{description}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication</Text>
          {renderSettingItem(
            'Biometric Login',
            'Use fingerprint or face ID to login',
            'biometricAuth',
            'finger-print-outline'
          )}
          {renderSettingItem(
            'Two-Factor Authentication',
            'Add extra layer of security',
            'twoFactorAuth',
            'shield-checkmark-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Privacy</Text>
          {renderSettingItem(
            'Location History',
            'Save your location history for safety',
            'locationHistory',
            'map-outline'
          )}
          {renderSettingItem(
            'Data Sharing',
            'Share anonymous data to improve safety',
            'dataSharing',
            'share-social-outline'
          )}
          {renderSettingItem(
            'Analytics Tracking',
            'Help us improve the app',
            'analyticsTracking',
            'analytics-outline'
          )}
          {renderSettingItem(
            'Profile Visibility',
            'Make your profile visible to trusted contacts',
            'profileVisibility',
            'eye-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Management</Text>
          {renderActionItem(
            'Change Password',
            'Update your account password',
            'key-outline',
            () => Alert.alert('Change Password', 'Password change feature coming soon!')
          )}
          {renderActionItem(
            'Connected Devices',
            'Manage devices with access to your account',
            'phone-portrait-outline',
            () => Alert.alert('Connected Devices', 'View and manage your devices')
          )}
          {renderActionItem(
            'Download My Data',
            'Request a copy of your personal data',
            'download-outline',
            () => Alert.alert('Download Data', 'Your data will be emailed to you within 24 hours')
          )}
          {renderActionItem(
            'Delete Account',
            'Permanently delete your account',
            'trash-outline',
            () => Alert.alert(
              'Delete Account',
              'Are you sure? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {} }
              ]
            )
          )}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="lock-closed-outline" size={24} color="#FF1493" />
          <Text style={styles.infoText}>
            Your privacy is important to us. We use industry-standard encryption to protect your data.
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  settingDescription: {
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