import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";

const API_BASE = "https://dsw2b-backend.onrender.com";
const CONFETTI_COUNT = 10;

export default function CreateCredentials() {
  const navigation = useNavigation();
  const [userID, setUserID] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [success, setSuccess] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const confetti = useRef(
    Array.from({ length: CONFETTI_COUNT }, () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (loading && !success) startPulse();
  }, [loading, success]);

  const startPulse = () => {
    pulseAnim.setValue(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const showSuccess = () => {
    successScale.setValue(0);
    Animated.spring(successScale, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start(() => startConfetti());
  };

  const startConfetti = () => {
    confetti.forEach((c) => {
      c.x.setValue(0);
      c.y.setValue(0);
      c.rotation.setValue(0);
      c.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(c.x, {
          toValue: Math.random() * 200 - 100,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(c.y, {
          toValue: -Math.random() * 200 - 50,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(c.rotation, {
          toValue: Math.random() * 360,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(c.opacity, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleRegister = async (provider) => {
    if (!userID) return setMessage("Enter email or phone");
    setLoading(true);
    setMessage("");
    animateButton();

    try {
      const bioAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${provider}`,
      });
      if (!bioAuth.success) throw new Error("Biometric failed");

      const fakeCredential = {
        id: `${userID}-cred-${Date.now()}`,
        rawId: `${userID}-raw-${Date.now()}`,
        type: "public-key",
      };

      await axios.post(`${API_BASE}/register`, {
        userID,
        credential: fakeCredential,
        provider,
      });

      setSuccess(true);
      setLoading(false);
      showSuccess();

      setTimeout(() => navigation.navigate("AccountForm", { userID }), 1800);
    } catch (err) {
      setMessage(err.message);
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />

          {/* Header */}
          <View style={styles.headerSection}>
            <Image
              source={require("../../assets/Logos/Aya_AI_Logo.png")}
              style={styles.appLogo}
            />
            <Text style={styles.title}>Create Your Passkey</Text>
          </View>

          {/* Form */}
          <View style={styles.formSection}>
            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email or Phone"
                placeholderTextColor="#8E8E93"
                style={[styles.input, inputFocused && styles.inputFocused]}
                value={userID}
                onChangeText={setUserID}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
              />
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleRegister("Apple")}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require("../../assets/apple.png")}
                    style={styles.buttonIcon}
                  />
                  {loading ? (
                    <ActivityIndicator
                      color="#fff"
                      size="small"
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      Continue with iCloud Keychain
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => handleRegister("Google")}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Image
                    source={require("../../assets/google.png")}
                    style={styles.buttonIcon}
                  />
                  {loading ? (
                    <ActivityIndicator
                      color="#1C1C1E"
                      size="small"
                      style={{ marginLeft: 8 }}
                    />
                  ) : (
                    <Text style={styles.secondaryButtonText}>
                      Continue with Google Passkey
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>

            {/* Error */}
            {message ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{message}</Text>
              </View>
            ) : null}

            {/* Fingerprint Pulse */}
            {loading && !success && (
              <Animated.View
                style={[
                  styles.pulseCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Image
                  source={require("../../assets/animations/fingerprint_icon.jpg")}
                  style={styles.fingerprintIcon}
                />
              </Animated.View>
            )}

            {/* Success Check */}
            {success && (
              <Animated.View
                style={[
                  styles.successCircle,
                  { transform: [{ scale: successScale }] },
                ]}
              >
                <Text style={styles.checkmark}>✓</Text>
                {/* Confetti */}
                {confetti.map((c, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.confetti,
                      {
                        transform: [
                          { translateX: c.x },
                          { translateY: c.y },
                          {
                            rotate: c.rotation.interpolate({
                              inputRange: [0, 360],
                              outputRange: ["0deg", "360deg"],
                            }),
                          },
                        ],
                        opacity: c.opacity,
                      },
                    ]}
                  />
                ))}
              </Animated.View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footerSection}>
            <TouchableOpacity
              style={styles.fallbackButton}
              onPress={() => navigation.navigate("AccountForm", { userID })}
              activeOpacity={0.6}
            ></TouchableOpacity>
            <Text style={styles.disclaimerText}>
              Your passkey will be saved to your device and synced{"\n"}across
              your signed-in devices.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
  },
  headerSection: { alignItems: "center", paddingTop: 40, paddingBottom: 48 },
  appLogo: { width: 64, height: 64, marginBottom: 24, borderRadius: 14 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  formSection: { flex: 1, justifyContent: "flex-start", paddingTop: 8 },
  inputContainer: { marginBottom: 32 },
  input: {
    height: 50,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 17,
    color: "#1C1C1E",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputFocused: { backgroundColor: "#FFFFFF", borderColor: "#007AFF" },
  buttonContainer: { gap: 12, marginBottom: 24 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000ff",
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  secondaryButtonText: {
    color: "#1C1C1E",
    fontSize: 17,
    fontWeight: "600",
    marginLeft: 8,
  },
  buttonIcon: { width: 20, height: 20 },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#D32F2F",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  pulseCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#007AFF33",
    alignSelf: "center",
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  fingerprintIcon: { width: 36, height: 36, tintColor: "#007AFF" },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4BB543",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  checkmark: { color: "#fff", fontSize: 40, fontWeight: "700" },
  confetti: {
    position: "absolute",
    width: 6,
    height: 12,
    backgroundColor: "#FFD700",
    borderRadius: 2,
  },
  footerSection: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 34 : 24,
    paddingTop: 16,
  },
  fallbackButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  fallbackText: {
    color: "#007AFF",
    fontSize: 17,
    fontWeight: "500",
    textAlign: "center",
  },
  disclaimerText: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
