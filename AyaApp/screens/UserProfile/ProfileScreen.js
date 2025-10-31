import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, CommonActions, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabaseClient';
import { uploadProfilePic, saveUserProfile } from '../../lib/profileService';

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({
    name: 'Loading...',
    email: 'Loading...',
    provider: 'Biometric',
    phone: null,
    location: null,
    age: null,
    gender: null,
    profilePicture: null,
    username: null,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const sessionData = await AsyncStorage.getItem('@user_session');
      console.log('📱 Session data:', sessionData);
      
      if (sessionData) {
        const user = JSON.parse(sessionData);
        console.log('👤 User from session:', user);
        
        // Load profile from Supabase user_profiles table
        const { getUserProfile } = require('../../lib/profileService');
        console.log('🔍 Fetching profile for:', user.email);
        
        const profile = await getUserProfile(user.email);
        console.log('📊 Profile from Supabase:', profile);
        
        if (profile) {
          const loadedData = {
            name: profile.full_name || user.name || user.email.split('@')[0],
            email: profile.email || user.email,
            provider: profile.provider || user.provider || 'Biometric',
            phone: profile.phone || null,
            location: profile.location || null,
            age: profile.age || null,
            gender: profile.gender || null,
            profilePicture: profile.profile_picture_url || null,
            username: profile.username || null,
          };
          console.log('✅ Setting user data:', loadedData);
          setUserData(loadedData);
        } else {
          console.log('⚠️ No profile found in Supabase, using session data');
          // Fallback to session data if no profile found
          setUserData({
            name: user.fullName || user.name || user.email.split('@')[0],
            email: user.email,
            provider: user.provider || 'Biometric',
            phone: user.phone || null,
            location: user.location || null,
            age: user.age || null,
            gender: user.gender || null,
            profilePicture: user.profilePicture || null,
            username: user.username || null,
          });
        }
      } else {
        console.log('❌ No session data found');
      }
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      // If error, try to load from session as fallback
      try {
        const sessionData = await AsyncStorage.getItem('@user_session');
        if (sessionData) {
          const user = JSON.parse(sessionData);
          console.log('🔄 Using fallback session data:', user);
          setUserData({
            name: user.fullName || user.name || user.email.split('@')[0],
            email: user.email,
            provider: user.provider || 'Biometric',
            phone: user.phone || null,
            location: user.location || null,
            age: user.age || null,
            gender: user.gender || null,
            profilePicture: user.profilePicture || null,
            username: user.username || null,
          });
        }
      } catch (fallbackError) {
        console.error('❌ Fallback error:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    try {
      setUploading(true);
      const { uploadProfilePicture: upload, saveUserProfile } = require('../../lib/profileService');
      
      // Upload image to Supabase
      const publicUrl = await upload(imageUri, userData.email);
      
      // Update profile with new image URL
      await saveUserProfile({
        userId: userData.email,
        email: userData.email,
        fullName: userData.name,
        username: userData.username,
        phone: userData.phone,
        location: userData.location,
        age: userData.age,
        gender: userData.gender,
        profilePicUri: publicUrl,
        provider: userData.provider,
      });

      // Update local state and session
      const updatedUser = { ...userData, profilePicture: publicUrl };
      setUserData(updatedUser);
      
      const sessionData = await AsyncStorage.getItem('@user_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.profilePicture = publicUrl;
        await AsyncStorage.setItem('@user_session', JSON.stringify(session));
      }

      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleOptionPress = (option) => {
    switch (option.id) {
      case 1:
        // Account Details
        navigation.navigate('AccountDetailsScreen');
        break;
      case 2:
        // Safety Preferences
        navigation.navigate('SafetyPreferencesScreen');
        break;
      case 3:
        // Privacy & Security
        navigation.navigate('PrivacySecurityScreen');
        break;
      case 4:
        // Help & Support
        navigation.navigate('HelpSupportScreen');
        break;
      case 5:
        // Achievements
        navigation.navigate('AchievementsScreen');
        break;
      default:
        Alert.alert(option.title, option.subtitle);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🚪 Logging out, clearing session...');
              await AsyncStorage.removeItem('@user_session');
              await AsyncStorage.removeItem('@safety_last');
              console.log('✅ Session cleared successfully');
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'OnboardingScreen' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be temporarily disabled. You can reactivate it anytime by logging in again.\n\nAre you sure you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Update user_profiles to mark as deactivated
              const { error } = await supabase
                .from('user_profiles')
                .update({ 
                  is_active: false,
                  deactivated_at: new Date().toISOString()
                })
                .eq('email', userData.email);

              if (error) {
                console.error('Deactivation error:', error);
                Alert.alert('Error', 'Failed to deactivate account. Please try again.');
                setLoading(false);
                return;
              }

              Alert.alert(
                'Account Deactivated',
                'Your account has been deactivated successfully. You can reactivate it by logging in again.',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      await AsyncStorage.removeItem('@user_session');
                      await AsyncStorage.removeItem('@safety_last');
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'OnboardingScreen' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Deactivation error:', error);
              Alert.alert('Error', 'An error occurred. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.prompt(
      'Delete Account Permanently',
      'This action cannot be undone! All your data will be permanently deleted.\n\nType "DELETE" to confirm:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async (inputText) => {
            if (inputText?.toUpperCase() !== 'DELETE') {
              Alert.alert('Cancelled', 'Account deletion cancelled.');
              return;
            }

            try {
              setLoading(true);
              console.log('🗑️ Starting account deletion for:', userData.email);

              // 1. Delete profile picture from storage if exists
              if (userData.profilePicture) {
                try {
                  const fileName = userData.profilePicture.split('/').pop();
                  console.log('🖼️ Deleting profile picture:', fileName);
                  const { error: storageError } = await supabase.storage
                    .from('profile-pictures')
                    .remove([`${userData.email}/${fileName}`]);
                  
                  if (storageError) {
                    console.warn('⚠️ Storage deletion warning:', storageError);
                  } else {
                    console.log('✅ Profile picture deleted from storage');
                  }
                } catch (storageError) {
                  console.warn('⚠️ Could not delete profile picture:', storageError);
                }
              }

              // 2. Delete from passkeys table
              console.log('🔑 Deleting passkeys...');
              const { error: passkeysError } = await supabase
                .from('passkeys')
                .delete()
                .eq('user_id', userData.email);

              if (passkeysError) {
                console.warn('⚠️ Passkeys deletion warning:', passkeysError);
              } else {
                console.log('✅ Passkeys deleted');
              }

              // 3. Delete from user_profiles table
              console.log('👤 Deleting user profile...');
              const { error: profileError } = await supabase
                .from('user_profiles')
                .delete()
                .eq('email', userData.email);

              if (profileError) {
                console.error('❌ Delete profile error:', profileError);
                Alert.alert('Error', 'Failed to delete profile. Please try again.');
                setLoading(false);
                return;
              }
              console.log('✅ User profile deleted');

              // 4. Sign out the user from Supabase Auth
              console.log('🚪 Signing out from Supabase Auth...');
              const { error: signOutError } = await supabase.auth.signOut();
              if (signOutError) {
                console.warn('⚠️ Sign out warning:', signOutError);
              } else {
                console.log('✅ Signed out from Supabase Auth');
              }

              // 5. Clear all local storage
              console.log('🧹 Clearing local storage...');
              await AsyncStorage.clear();
              console.log('✅ Local storage cleared');

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      navigation.reset({
                        index: 0,
                        routes: [{ name: 'OnboardingScreen' }],
                      });
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Error', 'An error occurred while deleting your account. Please try again.');
              setLoading(false);
            }
          },
        },
      ],
      'plain-text'
    );
  };

  const profileOptions = [
    { id: 1, title: 'Account Details', icon: 'person-circle-outline', subtitle: 'View and edit your information', 
      data: { phone: userData.phone, location: userData.location, age: userData.age, gender: userData.gender, email: userData.email } },
    { id: 2, title: 'Safety Preferences', icon: 'shield-outline', subtitle: 'Configure safety settings' },
    { id: 3, title: 'Privacy & Security', icon: 'lock-closed-outline', subtitle: 'Account security' },
    { id: 4, title: 'Help & Support', icon: 'help-circle-outline', subtitle: 'Get assistance' },
    { id: 5, title: 'Achievements', icon: 'ribbon-outline', subtitle: 'Safety milestones and badges'},
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('EditProfileScreen')}
        >
          <Ionicons name="create-outline" size={24} color="#FF1493" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF1493" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        ) : (
          <>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                {userData.profilePicture ? (
                  <Image 
                    source={{ uri: userData.profilePicture }} 
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Ionicons name="person" size={40} color="#FF1493" />
                  </View>
                )}
                <TouchableOpacity 
                  style={styles.cameraButton}
                  onPress={handleImagePick}
                  disabled={uploading}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
              <Text style={styles.userName}>{userData.name}</Text>
              {userData.username && (
                <Text style={styles.username}>@{userData.username}</Text>
              )}
              {userData.email && (
                <Text style={styles.userEmail}>{userData.email}</Text>
              )}

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Verified Account • {userData.provider}</Text>
              </View>
            </View>

            <View style={styles.optionsSection}>
              {profileOptions.map((option) => (
                <TouchableOpacity 
                  key={option.id} 
                  style={styles.optionItem}
                  onPress={() => handleOptionPress(option)}
                >
                  <View style={styles.optionLeft}>
                    <View style={styles.optionIcon}>
                      <Ionicons name={option.icon} size={20} color="#FF1493" />
                    </View>
                    <View>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#FF1493" />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
              
              <TouchableOpacity 
                style={styles.deactivateButton} 
                onPress={handleDeactivateAccount}
              >
                <Ionicons name="pause-circle-outline" size={20} color="#FF8C00" />
                <View style={styles.dangerButtonText}>
                  <Text style={styles.deactivateText}>Deactivate Account</Text>
                  <Text style={styles.dangerSubtext}>Temporarily disable your account</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FF8C00" />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.deleteButton} 
                onPress={handleDeleteAccount}
              >
                <Ionicons name="trash-outline" size={20} color="#FF0000" />
                <View style={styles.dangerButtonText}>
                  <Text style={styles.deleteText}>Delete Account</Text>
                  <Text style={styles.dangerSubtext}>Permanently remove all your data</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FF0000" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#FF1493" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f3f6ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FECACA',
    
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF1493',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
   
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF1493',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 14,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE4EC',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF1493',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  username: {
    fontSize: 16,
    color: '#FF1493',
    marginBottom: 4,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE4EC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eee',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'green',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: 'green',
    fontWeight: '500',
  },
  optionsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 12,
    paddingVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFE4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  optionSubtitle: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  dangerZone: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#FFE4EC',
  },
  dangerZoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    paddingHorizontal: 20,
    paddingBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deactivateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4EC',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  dangerButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  deactivateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF8C00',
    marginBottom: 2,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 2,
  },
  dangerSubtext: {
    fontSize: 13,
    color: '#999',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 50,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF1493',
    marginLeft: 8,
  },
});

export default ProfileScreen;