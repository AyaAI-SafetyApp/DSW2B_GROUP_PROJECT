import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get emoji for icon names
const getIconEmoji = (iconName) => {
  const emojiMap = {
    'person-outline': '👤',
    'settings-outline': '⚙️',
    'help-circle-outline': '❓',
    'information-circle-outline': 'ℹ️',
    'chevron-forward-outline': '➡️',
    'warning-outline': '⚠️',
    'notifications-outline': '🔔',
    'moon-outline': '🌙',
    'volume-high-outline': '🔊',
    'language-outline': '🌐',
    'delete-forever': '🗑️',
    'info': 'ℹ️'
  };
  return emojiMap[iconName] || '❓';
};

export default function ProfileScreen() {
  const [userStats, setUserStats] = useState({
    totalLessons: 0,
    currentStreak: 0,
    totalPoints: 0,
    badges: 0
  });
  const [settings, setSettings] = useState({
    notifications: true,
    soundEffects: true,
    hapticFeedback: true,
    dataSaving: false
  });
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      // Load user stats
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        setUserStats(JSON.parse(stats));
      }

      // Load settings
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      setSettings(newSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const resetProgress = async () => {
    try {
      await AsyncStorage.multiRemove(['userStats', 'lessonHistory', 'completedLessons']);
      setUserStats({
        totalLessons: 0,
        currentStreak: 0,
        totalPoints: 0,
        badges: 0
      });
      setShowResetModal(false);
      Alert.alert('Success', 'Your progress has been reset successfully.');
    } catch (error) {
      console.error('Error resetting progress:', error);
      Alert.alert('Error', 'Failed to reset progress. Please try again.');
    }
  };

  const ProfileHeader = () => (
    <Animatable.View animation="fadeInDown" duration={800} style={styles.profileHeader}>
      <View style={styles.avatarContainer}>
        <Text style={{ fontSize: 60, color: '#FFFFFF' }}>
          {getIconEmoji('person-outline')}
        </Text>
      </View>
      <Text style={styles.userName}>Self-Defense Trainee</Text>
      <Text style={styles.userLevel}>Level {Math.floor(userStats.totalPoints / 100) + 1}</Text>
      <View style={styles.levelProgress}>
        <View 
          style={[
            styles.levelProgressFill, 
            { width: `${(userStats.totalPoints % 100)}%` }
          ]} 
        />
      </View>
    </Animatable.View>
  );

  const StatsCard = ({ icon, title, value, color, delay = 0 }) => (
    <Animatable.View animation="fadeInUp" delay={delay} duration={600} style={styles.statsCard}>
      <View style={[styles.statsIcon, { backgroundColor: color }]}>
        <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
          {getIconEmoji(icon)}
        </Text>
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </Animatable.View>
  );

  const SettingItem = ({ icon, title, subtitle, value, onToggle, type = 'switch' }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIconContainer}>
        <Text style={{ fontSize: 24, color: '#3498DB' }}>
          {getIconEmoji(icon)}
        </Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: '#BDC3C7', true: '#3498DB' }}
          thumbColor={value ? '#FFFFFF' : '#ECF0F1'}
        />
      )}
      {type === 'arrow' && (
        <Text style={{ fontSize: 24, color: '#BDC3C7' }}>
          {getIconEmoji('chevron-forward-outline')}
        </Text>
      )}
    </View>
  );

  const ActionButton = ({ icon, title, subtitle, color, onPress, delay = 0 }) => (
    <Animatable.View animation="fadeInRight" delay={delay} duration={600}>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
        <View style={styles.actionIconContainer}>
          <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
            {getIconEmoji(icon)}
          </Text>
        </View>
        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
          {getIconEmoji('chevron-forward-outline')}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileHeader />

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <StatsCard 
            icon="school-outline" 
            title="Lessons" 
            value={userStats.totalLessons} 
            color="#3498DB"
            delay={0}
          />
          <StatsCard 
            icon="flame-outline" 
            title="Streak" 
            value={`${userStats.currentStreak}d`} 
            color="#E74C3C"
            delay={100}
          />
          <StatsCard 
            icon="star-outline" 
            title="Points" 
            value={userStats.totalPoints.toLocaleString()} 
            color="#F39C12"
            delay={200}
          />
          <StatsCard 
            icon="medal-outline" 
            title="Badges" 
            value={userStats.badges} 
            color="#27AE60"
            delay={300}
          />
        </View>

        {/* Settings Section */}
        <Animatable.View animation="fadeInUp" delay={400} duration={800} style={styles.settingsContainer}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingsCard}>
            <SettingItem
              icon="notifications-outline"
              title="Notifications"
              subtitle="Get reminders for daily training"
              value={settings.notifications}
              onToggle={(value) => saveSettings({ ...settings, notifications: value })}
            />
            
            <SettingItem
              icon="volume-high-outline"
              title="Sound Effects"
              subtitle="Play audio feedback during training"
              value={settings.soundEffects}
              onToggle={(value) => saveSettings({ ...settings, soundEffects: value })}
            />
            
            <SettingItem
              icon="phone-portrait-outline"
              title="Haptic Feedback"
              subtitle="Feel vibrations for pose corrections"
              value={settings.hapticFeedback}
              onToggle={(value) => saveSettings({ ...settings, hapticFeedback: value })}
            />
            
            <SettingItem
              icon="save-outline"
              title="Data Saving Mode"
              subtitle="Reduce data usage for AR/VR features"
              value={settings.dataSaving}
              onToggle={(value) => saveSettings({ ...settings, dataSaving: value })}
            />
          </View>
        </Animatable.View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <ActionButton
            icon="cloud-upload-outline"
            title="Backup Progress"
            subtitle="Save your training data to cloud"
            color="#16A085"
            onPress={() => Alert.alert('Feature Coming Soon', 'Cloud backup will be available in a future update.')}
            delay={500}
          />

          <ActionButton
            icon="cloud-download-outline"
            title="Restore Progress"
            subtitle="Restore from previous backup"
            color="#2980B9"
            onPress={() => Alert.alert('Feature Coming Soon', 'Cloud restore will be available in a future update.')}
            delay={600}
          />

          <ActionButton
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help with the app"
            color="#8E44AD"
            onPress={() => Alert.alert(
              'Help & Support',
              'Self-Defense Training App\n\n• Use Computer Vision mode for real-time pose detection\n• Try AR/VR mode for immersive training\n• Track your progress in the dashboard\n• Earn badges by completing lessons\n\nFor support, contact: support@selfdefenseapp.com'
            )}
            delay={700}
          />

          <ActionButton
            icon="info"
            title="About"
            subtitle="App version and information"
            color="#34495E"
            onPress={() => Alert.alert(
              'About Self-Defense Training',
              'Version 1.0.0\n\nThis app uses advanced Computer Vision and AR/VR technology to provide interactive self-defense training.\n\nBuilt for Sprint 4 - Qwabe\'s Self-Defense Lessons'
            )}
            delay={800}
          />

          <ActionButton
            icon="delete-forever"
            title="Reset Progress"
            subtitle="Clear all training data"
            color="#E74C3C"
            onPress={() => setShowResetModal(true)}
            delay={900}
          />
        </View>
      </ScrollView>

      {/* Reset Progress Modal */}
      <Modal
        visible={showResetModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animatable.View animation="zoomIn" duration={300} style={styles.modalContent}>
            <Text style={{ fontSize: 48, color: '#E74C3C' }}>
              {getIconEmoji('warning-outline')}
            </Text>
            <Text style={styles.modalTitle}>Reset Progress?</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete all your training data, including:
              {'\n\n'}• Completed lessons
              {'\n'}• Earned points and badges
              {'\n'}• Training history and statistics
              {'\n\n'}This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowResetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.resetButton]}
                onPress={resetProgress}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </Animatable.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  profileHeader: {
    backgroundColor: '#34495E',
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#3498DB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  userLevel: {
    fontSize: 16,
    color: '#BDC3C7',
    marginBottom: 10,
  },
  levelProgress: {
    width: 200,
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 3,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    width: '47%',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statsTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  settingsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ECF0F1',
  },
  settingIconContainer: {
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconContainer: {
    marginRight: 15,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 15,
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#BDC3C7',
    marginRight: 10,
  },
  resetButton: {
    backgroundColor: '#E74C3C',
    marginLeft: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});