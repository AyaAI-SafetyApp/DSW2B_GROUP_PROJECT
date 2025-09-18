import React, { useState } from "react";
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

const API_BASE = "http://172.16.26.108:3000";

export default function GetAssertion() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userID } = route.params;

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const fadeAnim = new Animated.Value(0);

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
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();

      if (!compatible || !enrolled) {
        showStatus("Biometric not available");
        setLoading(false);
        return;
      }

      const bioAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate",
        fallbackLabel: "Enter PIN",
        disableDeviceFallback: false,
      });

      if (!bioAuth.success) {
        showStatus("Authentication failed");
        setLoading(false);
        return;
      }

      showStatus("Authenticated successfully");

      const fakeAssertion = { id: `${userID}-cred-${Date.now()}` };
      await axios.post(`${API_BASE}/login/verify`, {
        userID,
        assertion: fakeAssertion,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "subscription" }],
      });
    } catch (err) {
      console.log(err);
      showStatus("Something went wrong");
    } finally {
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
