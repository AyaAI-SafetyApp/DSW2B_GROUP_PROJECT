import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AccountDetailsScreen({ navigation }) {
  const [userData, setUserData] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
    location: '',
    age: '',
    gender: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const sessionData = await AsyncStorage.getItem('@user_session');
      if (sessionData) {
        const user = JSON.parse(sessionData);
        setUserData({
          fullName: user.fullName || user.name || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || '',
          location: user.location || '',
          age: user.age?.toString() || '',
          gender: user.gender || '',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Update session storage
      const sessionData = await AsyncStorage.getItem('@user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const updatedSession = {
          ...session,
          fullName: userData.fullName,
          name: userData.fullName,
          username: userData.username,
          phone: userData.phone,
          location: userData.location,
          age: userData.age,
          gender: userData.gender,
        };
        await AsyncStorage.setItem('@user_session', JSON.stringify(updatedSession));
      }

      // TODO: Update Supabase database
      const { updateUserProfile } = require('../../lib/profileService');
      await updateUserProfile(userData.email, {
        full_name: userData.fullName,
        username: userData.username,
        phone: userData.phone,
        location: userData.location,
        age: parseInt(userData.age) || null,
        gender: userData.gender,
      });

      Alert.alert('Success', 'Your account details have been updated!');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to update account details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (label, value, field, icon, editable = true, keyboardType = 'default') => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Ionicons name={icon} size={20} color="#FF1493" />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing && editable ? (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => setUserData({ ...userData, [field]: text })}
          placeholder={`Enter ${label.toLowerCase()}`}
          keyboardType={keyboardType}
          editable={!loading}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not set'}</Text>
      )}
    </View>
  );

  if (loading && !isEditing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Details</Text>
        <TouchableOpacity
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
          style={styles.editButton}
        >
          <Text style={styles.editButtonText}>{isEditing ? 'Save' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {renderField('Full Name', userData.fullName, 'fullName', 'person-outline')}
          {renderField('Username', userData.username, 'username', 'at-outline')}
          {renderField('Email', userData.email, 'email', 'mail-outline', false)}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          {renderField('Phone', userData.phone, 'phone', 'call-outline', true, 'phone-pad')}
          {renderField('Location', userData.location, 'location', 'location-outline')}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          {renderField('Age', userData.age, 'age', 'calendar-outline', true, 'numeric')}
          {renderField('Gender', userData.gender, 'gender', 'person-outline')}
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              setIsEditing(false);
              loadUserData(); // Reload original data
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  editButton: {
    padding: 5,
  },
  editButtonText: {
    fontSize: 16,
    color: '#FF1493',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#666',
    paddingLeft: 28,
  },
  input: {
    fontSize: 16,
    color: '#333',
    paddingLeft: 28,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#FFB6D9',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});
