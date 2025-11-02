import React, { useState, useEffect, useRef } from "react";
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
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { supabase, supabaseAdmin } from "../../lib/supabaseClient";

const API_BASE_URL = "https://dsw2b-backend.onrender.com";

// Reusable Option Card
const OptionCard = ({ title, subtitle, icon, onPress }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }], marginVertical: 4 }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
        style={styles.optionCard}
      >
        <View style={styles.optionLeft}>
          <View style={styles.optionIcon}>
            <Ionicons name={icon} size={22} color="#333" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>{title}</Text>
            <Text style={styles.optionSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </TouchableOpacity>
    </Animated.View>
  );
};

// Avatar component with edit
const AvatarWithEdit = ({ uri, onPick, uploading }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () =>
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

  return (
    <Animated.View style={[styles.avatarContainer, { transform: [{ scale }] }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#666" />
        </View>
      )}
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={onPick}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="camera" size={16} color="#fff" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    provider: "",
    phone: "",
    location: "",
    age: "",
    gender: "",
    profilePicture: "",
    username: "",
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const sessionData = await AsyncStorage.getItem("@user_session");
      if (sessionData) {
        const user = JSON.parse(sessionData);
        setUserData({
          name: user.fullName || user.name || user.email.split("@")[0],
          email: user.email,
          provider: user.provider || "Biometric",
          phone: user.phone || null,
          location: user.location || null,
          age: user.age || null,
          gender: user.gender || null,
          profilePicture: user.profilePicture || null,
          username: user.username || null,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission required", "Please allow access to gallery.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image.");
    }
  };

  const uploadProfilePicture = async (uri) => {
    try {
      setUploading(true);
      console.log('📤 Uploading profile picture:', uri);

      // Get user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        setUploading(false);
        return;
      }

      // Create file name
      const fileExt = uri.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${user.email}/${fileName}`;

      // Convert URI to blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image. Please try again.');
        setUploading(false);
        return;
      }

      console.log('✅ Image uploaded:', uploadData.path);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(filePath);

      console.log('📸 Public URL:', publicUrl);

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('email', user.email);

      if (updateError) {
        console.error('Profile update error:', updateError);
        Alert.alert('Error', 'Failed to update profile. Please try again.');
        setUploading(false);
        return;
      }

      // Update local state and session
      setUserData((prev) => ({ ...prev, profilePicture: publicUrl }));
      
      // Update session storage
      const sessionData = await AsyncStorage.getItem("@user_session");
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.profilePicture = publicUrl;
        await AsyncStorage.setItem("@user_session", JSON.stringify(session));
      }

      console.log('✅ Profile picture updated successfully');
      Alert.alert('Success', 'Profile picture updated!');
      
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const profileOptions = [
    {
      id: 1,
      title: "Account Details",
      icon: "person-circle-outline",
      subtitle: "View and edit info",
    },
    {
      id: 2,
      title: "Safety Preferences",
      icon: "shield-outline",
      subtitle: "Configure safety settings",
    },
    {
      id: 3,
      title: "Privacy & Security",
      icon: "lock-closed-outline",
      subtitle: "Account security",
    },
    {
      id: 4,
      title: "Help & Support",
      icon: "help-circle-outline",
      subtitle: "Get assistance",
    },
    {
      id: 5,
      title: "Achievements",
      icon: "ribbon-outline",
      subtitle: "Milestones & badges",
    },
    {
      id: 6,
      title: "Upgrade",
      icon: "crown",
      subtitle: "Subscription plans",
    },
    {
      id: 7,
      title: "About Us",
      icon: "group-rows-outline",
      subtitle: "Wiew Info About Us",
    },
  ];

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
      case 7:
        // About Us
        navigation.navigate('AboutUsScreen');
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
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        }
      ]);
  };

  const handleDeactivateAccount = () => {
    Alert.alert(
      'Deactivate Account',
      'Your account will be suspended and you will not be able to log in. Contact support to reactivate your account.\n\nAre you sure you want to continue?',
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

              // Send deactivation notification email via Supabase Edge Function
              try {
                // Get email from Supabase auth session
                const { data: { user } } = await supabase.auth.getUser();
                const emailToUse = user?.email || userData.email;
                
                console.log('📧 Preparing deactivation email...');
                console.log('📧 Email data:', { 
                  email: emailToUse, 
                  userName: userData.name || userData.fullName,
                  emailValid: emailToUse?.includes('@')
                });
                
                // Validate email before sending
                if (!emailToUse || emailToUse === 'Loading...' || !emailToUse.includes('@')) {
                  console.warn('⚠️ Invalid email, skipping deactivation notification');
                } else {
                  const { data: emailResult, error: emailError } = await supabase.functions.invoke('dynamic-api', {
                    body: {
                      email: emailToUse,
                      userName: userData.name || userData.fullName || 'User',
                      isDeactivation: true,
                    },
                  });
                  
                  if (emailResult?.success) {
                    console.log('✅ Deactivation notification email sent');
                  } else {
                    console.warn('⚠️ Failed to send deactivation email:', emailError || emailResult?.error);
                  }
                }
              } catch (emailError) {
                console.error('❌ Email service error:', emailError);
                // Continue with account deactivation even if email fails
              }

              Alert.alert(
                'Account Deactivated',
                'Your account has been deactivated. Check your email for details on how to reactivate it.',
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
    Alert.alert(
      'Delete Account Permanently',
      'This action cannot be undone! All your data will be permanently deleted.\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Delete Forever',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              '⚠️ Final Confirmation',
              'This is your last chance! Type DELETE in the next prompt to confirm permanent deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand, Continue',
                  style: 'destructive',
                  onPress: () => {
                    // For cross-platform support, we'll use a simple second confirmation
                    Alert.alert(
                      'Type DELETE to Confirm',
                      'Please confirm by pressing "DELETE FOREVER" below:',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'DELETE FOREVER',
                          style: 'destructive',
                          onPress: async () => {
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

                              // 4. Send deletion confirmation email via Supabase Edge Function (before signing out)
                              try {
                                // Get email from Supabase auth session before deleting
                                const { data: { user } } = await supabase.auth.getUser();
                                const emailToUse = user?.email || userData.email;
                                
                                console.log('📧 Sending deletion confirmation email...');
                                console.log('📧 Email data:', { 
                                  email: emailToUse, 
                                  userName: userData.name || userData.fullName,
                                  emailType: typeof emailToUse,
                                  emailLength: emailToUse?.length 
                                });
                                
                                // Validate email before sending
                                if (!emailToUse || emailToUse === 'Loading...' || !emailToUse.includes('@')) {
                                  console.warn('⚠️ Invalid email, skipping deletion notification');
                                } else {
                                  const { data: emailResult, error: emailError } = await supabase.functions.invoke('dynamic-api', {
                                    body: {
                                      email: emailToUse,
                                      userName: userData.name || userData.fullName || 'User',
                                      isDeletion: true,
                                    },
                                  });
                                  
                                  if (emailResult?.success) {
                                    console.log('✅ Deletion confirmation email sent');
                                  } else {
                                    console.warn('⚠️ Failed to send deletion email:', emailError || emailResult?.error);
                                  }
                                }
                              } catch (emailError) {
                                console.error('❌ Email service error:', emailError);
                                // Continue with account deletion even if email fails
                              }

                              // 5. Delete user from Supabase Authentication
                              try {
                                const { data: { user } } = await supabase.auth.getUser();
                                const userId = user?.id;
                                
                                if (userId) {
                                  console.log('🔐 Deleting user from Supabase Auth...');
                                  const { data, error } = await supabaseAdmin.auth.admin.deleteUser(userId);
                                  
                                  if (error) {
                                    console.error('❌ Failed to delete from Auth:', error);
                                  } else {
                                    console.log('✅ User deleted from Supabase Authentication');
                                  }
                                } else {
                                  console.warn('⚠️ No user ID found, skipping auth deletion');
                                }
                              } catch (authDeleteError) {
                                console.error('❌ Auth deletion error:', authDeleteError);
                                // Continue even if auth deletion fails
                              }

                              // 6. Sign out the user from Supabase Auth (cleanup)
                              console.log('🚪 Signing out from Supabase Auth...');
                              const { error: signOutError } = await supabase.auth.signOut();
                              if (signOutError) {
                                console.warn('⚠️ Sign out warning:', signOutError);
                              } else {
                                console.log('✅ Signed out from Supabase Auth');
                              }

                              // 7. Clear all local storage
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
                      ]
                    );
                  },
                },
              ]
            );
          },
        },
      ]
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("EditProfileScreen")}
        >
          <Ionicons name="create-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.profileSection}>
              <AvatarWithEdit
                uri={userData.profilePicture}
                onPick={handleImagePick}
                uploading={uploading}
              />
              <Text style={styles.userName}>{userData.name}</Text>
              {userData.username && (
                <Text style={styles.username}>@{userData.username}</Text>
              )}
              <Text style={styles.userEmail}>{userData.email}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  Verified • {userData.provider}
                </Text>
              </View>
            </View>

            <View style={styles.optionsSection}>
              {profileOptions.map((option) => (
                <OptionCard
                  key={option.id}
                  {...option}
                  onPress={() => handleOptionPress(option)}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#000" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deactivateButton}
              onPress={handleDeactivateAccount}
            >
              <Ionicons name="pause-circle-outline" size={20} color="#ff9800" />
              <Text style={styles.deactivateText}>Deactivate Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              <Text style={styles.deleteText}>Delete Account Permanently</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#f9f9f9",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },
  cameraButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 4,
  },
  username: { fontSize: 16, color: "#555", marginBottom: 4 },
  userEmail: { fontSize: 14, color: "#777", marginBottom: 12 },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "green",
    marginRight: 6,
  },
  statusText: { fontSize: 12, color: "green", fontWeight: "500" },
  optionsSection: { marginHorizontal: 20, marginBottom: 16 },
  optionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  optionLeft: { flexDirection: "row", alignItems: "center" },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  optionTitle: { fontSize: 16, fontWeight: "600", color: "#000" },
  optionSubtitle: { fontSize: 14, color: "#666", marginTop: 2 },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#000", marginLeft: 8 },
  deactivateButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff9800",
    backgroundColor: "#fff8e1",
  },
  deactivateText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#ff9800", 
    marginLeft: 8 
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 50,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ff3b30",
    backgroundColor: "#ffebee",
  },
  deleteText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#ff3b30", 
    marginLeft: 8 
  },
});

export default ProfileScreen;
