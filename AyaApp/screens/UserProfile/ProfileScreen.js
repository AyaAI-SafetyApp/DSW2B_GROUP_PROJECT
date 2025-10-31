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
      // Replace this with your upload logic
      setTimeout(() => {
        setUserData((prev) => ({ ...prev, profilePicture: uri }));
        setUploading(false);
      }, 1500);
    } catch (err) {
      setUploading(false);
      Alert.alert("Error", "Failed to upload image.");
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
      case 6:
        // Achievements
        navigation.navigate('SubscriptionUpgrade');
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
        },
      },
    ]);
  };

  const profileOptions = [
    { id: 1, title: 'Account Details', icon: 'person-circle-outline', subtitle: 'View and edit your information', 
      data: { phone: userData.phone, location: userData.location, age: userData.age, gender: userData.gender, email: userData.email } },
    { id: 2, title: 'Safety Preferences', icon: 'shield-outline', subtitle: 'Configure safety settings' },
    { id: 3, title: 'Privacy & Security', icon: 'lock-closed-outline', subtitle: 'Account security' },
    { id: 4, title: 'Help & Support', icon: 'help-circle-outline', subtitle: 'Get assistance' },
    { id: 5, title: 'Achievements', icon: 'ribbon-outline', subtitle: 'Safety milestones and badges'},
    { id: 6, title: 'Account upgrade', icon: 'crown', subtitle: 'Subscription plans'},
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
    marginBottom: 50,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    marginTop: 8,
  },
  logoutText: { fontSize: 16, fontWeight: "600", color: "#000", marginLeft: 8 },
});

export default ProfileScreen;
