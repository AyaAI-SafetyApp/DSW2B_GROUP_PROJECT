import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const EmergencyScreen = () => {
  const navigation = useNavigation();
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);

  const handleEmergencyPress = () => {
    if (isEmergencyActive) {
      // Cancel emergency
      Alert.alert(
        'Cancel Emergency',
        'Are you sure you want to cancel the emergency alert?',
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes', 
            onPress: () => {
              setIsEmergencyActive(false);
              Alert.alert('Emergency Cancelled', 'Your emergency alert has been cancelled.');
            }
          },
        ]
      );
    } else {
      // Activate emergency
      Alert.alert(
        'Emergency Alert',
        'This will send your location and alert to all emergency contacts. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Send Alert', 
            style: 'destructive',
            onPress: () => {
              setIsEmergencyActive(true);
              Alert.alert('Alert Sent!', 'Emergency contacts have been notified with your location.');
            }
          },
        ]
      );
    }
  };

  const emergencyContacts = [
    { id: 1, name: 'Mom', phone: '+1 234 567 8900', relation: 'Mother' },
    { id: 2, name: 'Police', phone: '911', relation: 'Emergency Services' },
    { id: 3, name: 'Medical', phone: '+1 234 567 8901', relation: 'Doctor' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency SOS</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Emergency Button */}
        <View style={styles.emergencySection}>
          <Text style={styles.emergencyTitle}>
            {isEmergencyActive ? 'Emergency Active' : 'Emergency SOS'}
          </Text>
          <Text style={styles.emergencySubtitle}>
            {isEmergencyActive 
              ? 'Your emergency contacts have been notified. Tap to cancel.'
              : 'Press and hold the button below to send emergency alert'
            }
          </Text>

          <TouchableOpacity
            style={[
              styles.emergencyButton,
              isEmergencyActive && styles.emergencyButtonActive
            ]}
            onPress={handleEmergencyPress}
            activeOpacity={0.7}
          >
            <View style={styles.emergencyButtonInner}>
              <Ionicons 
                name={isEmergencyActive ? "checkmark" : "warning"} 
                size={48} 
                color="#FFFFFF" 
              />
            </View>
          </TouchableOpacity>

          {isEmergencyActive && (
            <View style={styles.activeAlert}>
              <Text style={styles.activeAlertText}>🚨 Emergency Alert Active</Text>
              <Text style={styles.activeAlertSubtext}>Location sharing enabled</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="call" size={24} color="#10B981" />
              <Text style={styles.quickActionText}>Call 911</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="location" size={24} color="#3B82F6" />
              <Text style={styles.quickActionText}>Share Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Ionicons name="medical" size={24} color="#EF4444" />
              <Text style={styles.quickActionText}>Medical Info</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.contactsSection}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          {emergencyContacts.map((contact) => (
            <TouchableOpacity key={contact.id} style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Ionicons name="person" size={20} color="#6366F1" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relation}</Text>
              </View>
              <TouchableOpacity style={styles.callButton}>
                <Ionicons name="call" size={20} color="#10B981" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emergencySection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  emergencyButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  emergencyButtonActive: {
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
  },
  emergencyButtonInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeAlert: {
    marginTop: 24,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  activeAlertText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
    textAlign: 'center',
  },
  activeAlertSubtext: {
    fontSize: 14,
    color: '#7F1D1D',
    textAlign: 'center',
    marginTop: 4,
  },
  quickActionsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAction: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: (width - 80) / 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  contactsSection: {
    marginTop: 32,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  contactRelation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default EmergencyScreen;
