import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabaseAuth } from "../../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function EditProfileScreen() {
  const navigation = useNavigation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user from Supabase
      const user = await supabaseAuth.getCurrentUser();
      
      if (user && user.email) {
        setEmail(user.email);
        // Get full name from user metadata or default to email username
        const fullName = user.user_metadata?.full_name || user.email.split('@')[0];
        setName(fullName);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !email) {
      Alert.alert("Error", "Name and Email cannot be empty.");
      return;
    }

    // Validate password fields if any are filled
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill all password fields.");
        return;
      }

      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "New password and confirmation do not match.");
        return;
      }

      if (currentPassword === newPassword) {
        Alert.alert(
          "Error",
          "New password cannot be the same as your current password."
        );
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert("Error", "New password must be at least 6 characters.");
        return;
      }
    }

    try {
      setSaving(true);
      console.log("💾 Starting profile update...");

      // Prepare update data
      const updateData = {
        data: {
          full_name: name,
        }
      };

      // Add password if changing
      if (newPassword) {
        updateData.password = newPassword;
      }

      // Update user in Supabase
      const result = await supabaseAuth.updateUser(updateData);
      console.log("✅ Profile updated in Supabase:", result);

      // Update AsyncStorage with new name
      const userSession = await AsyncStorage.getItem("userSession");
      if (userSession) {
        const session = JSON.parse(userSession);
        session.user = {
          ...session.user,
          user_metadata: {
            ...session.user.user_metadata,
            full_name: name,
          }
        };
        await AsyncStorage.setItem("userSession", JSON.stringify(session));
        console.log("✅ AsyncStorage updated");
      }

      // Clear password fields on success
      if (newPassword) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        Alert.alert("Success", "Profile and password updated successfully!");
      } else {
        Alert.alert("Success", "Profile updated successfully!");
      }

      // Navigate back after a short delay
      setTimeout(() => {
        navigation.goBack();
      }, 1000);

    } catch (error) {
      console.error("❌ Error updating profile:", error);
      
      // Handle specific error cases
      if (error.message?.includes("password")) {
        Alert.alert("Error", "Current password is incorrect.");
      } else {
        Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF1493" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Full Name"
          />
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={email}
            placeholder="Email"
            keyboardType="email-address"
            editable={false}
          />

          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Current Password"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="New Password"
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm New Password"
            secureTextEntry
          />

          <TouchableOpacity 
            style={[styles.button, saving && styles.buttonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF1493",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "black",
    marginBottom: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: "#f5f5f5",
    color: "#999",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF1493',
  },
  button: {
    backgroundColor: "#FF1493",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 25,
  },
  buttonDisabled: {
    backgroundColor: "#FFB3D9",
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
