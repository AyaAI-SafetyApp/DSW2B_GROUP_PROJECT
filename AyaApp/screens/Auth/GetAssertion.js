import React, { useState, useRef } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { supabase } from "../../lib/supabaseClient";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function GetAssertion() {
  const navigation = useNavigation();
  const route = useRoute();
  const userID = route?.params?.userID || "demo-user";

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showStatus = (message) => {
    setStatusMessage(message);
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };

  const handleLogin = async () => {
    setLoading(true);
    setStatusMessage("");
    try {
      // Check if biometric hardware is available
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        showStatus("Biometric not available");
        setLoading(false);
        return;
      }

      // Authenticate with biometrics
      const bioAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to login",
        fallbackLabel: "Enter PIN",
        disableDeviceFallback: false,
      });

      if (!bioAuth.success) {
        showStatus("Authentication failed");
        setLoading(false);
        return;
      }

      showStatus("Verifying passkey...");

      // Fetch user's passkeys directly from Supabase
      const { data: passkeys, error } = await supabase
        .from("passkeys")
        .select("*")
        .eq("user_id", userID)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        showStatus("Failed to retrieve passkey");
        setLoading(false);
        return;
      }

      if (!passkeys || passkeys.length === 0) {
        showStatus("No passkey found. Please register first.");
        setLoading(false);
        return;
      }

      // Use the most recent passkey
      const latestPasskey = passkeys[0];
      console.log("Login successful with passkey:", latestPasskey.credential_id);

      // Update last_used_at timestamp
      await supabase
        .from("passkeys")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", latestPasskey.id);

      // Load full user profile from Supabase
      const { getUserProfile, updateLastLogin } = require('../../lib/profileService');
      console.log('🔍 Loading profile for user:', userID);
      
      let userProfile = null;
      try {
        userProfile = await getUserProfile(userID);
        console.log('📊 Profile loaded:', userProfile);
      } catch (profileError) {
        console.warn('⚠️ Could not load profile:', profileError);
      }

      // Store comprehensive user session data
      const userData = {
        email: userID,
        userId: latestPasskey.user_id,
        name: userProfile?.full_name || (userID.includes("@") ? userID.split("@")[0] : userID),
        provider: latestPasskey.provider || "Biometric",
        loginTime: new Date().toISOString(),
        fullName: userProfile?.full_name,
        phone: userProfile?.phone,
        location: userProfile?.location,
        age: userProfile?.age,
        gender: userProfile?.gender,
        profilePicture: userProfile?.profile_picture_url,
        username: userProfile?.username,
      };
      
      console.log('💾 Saving session data:', userData);
      await AsyncStorage.setItem("@user_session", JSON.stringify(userData));
      
      // Verify session was saved
      const savedSession = await AsyncStorage.getItem("@user_session");
      console.log('✅ Session verified:', savedSession ? 'Saved successfully' : 'Failed to save');

      // Update last login timestamp in profile
      if (userProfile) {
        try {
          await updateLastLogin(userID);
        } catch (updateError) {
          console.warn('⚠️ Could not update last login:', updateError);
        }
      }

      showStatus("Login successful!");

      // Navigate to main app
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      }, 1000);
    } catch (err) {
      console.error("Login error:", err);
      showStatus("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Ionicons name="finger-print" size={80} color="#555" />
      <Text style={styles.title}>Login with Biometrics</Text>

      <TouchableOpacity
        onPress={handleLogin}
        style={[styles.loginButton, loading && { opacity: 0.7 }]}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="large" />
        ) : (
          <Text style={styles.loginText}>Authenticate</Text>
        )}
      </TouchableOpacity>

      {statusMessage ? (
        <Animated.View style={{ opacity: fadeAnim, marginTop: 20 }}>
          <Text style={styles.statusText}>{statusMessage}</Text>
        </Animated.View>
      ) : null}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "#555",
    marginVertical: 20,
  },
  loginButton: {
    backgroundColor: "#555",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  statusText: {
    fontSize: 16,
    color: "#555",
  },
  backButton: {
    marginTop: 30,
    padding: 12,
  },
  backText: {
    fontSize: 16,
    color: "#555",
  },
});