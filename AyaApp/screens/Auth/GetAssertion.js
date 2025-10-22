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
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";

const API_BASE = "https://dsw2b-backend.onrender.com";

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

      // Get user's passkeys from backend
      try {
        const passkeysResponse = await axios.get(`${API_BASE}/api/passkey/${userID}`);
        
        if (!passkeysResponse.data.passkeys || passkeysResponse.data.passkeys.length === 0) {
          showStatus("No passkey found. Please register first.");
          setLoading(false);
          return;
        }

        // Use the most recent passkey
        const latestPasskey = passkeysResponse.data.passkeys[0];
        
        // Verify login with the passkey
        const verifyResponse = await axios.post(`${API_BASE}/login/verify`, {
          userID,
          assertion: {
            id: latestPasskey.credential_id,
            type: "public-key"
          },
        });

        if (verifyResponse.data.authenticated) {
          showStatus("Login successful!");
          
          // Navigate to main app
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            });
          }, 1000);
        }
      } catch (err) {
        console.error("Login verification error:", err);
        const errorMsg = err.response?.data?.error || "Failed to verify login";
        showStatus(errorMsg);
        setLoading(false);
        return;
      }
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
