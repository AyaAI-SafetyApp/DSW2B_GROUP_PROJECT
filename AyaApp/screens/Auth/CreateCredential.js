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
  Alert,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { supabase } from "../../lib/supabaseClient";

const CONFETTI_COUNT = 10;

export default function CreateCredentials({ route }) {
  const navigation = useNavigation();
  
  // Get data from previous screen (AccountForm)
  const { userID: passedUserID, initialFullName, userEmail } = route?.params || {};
  
  const [fullName, setFullName] = useState(initialFullName || "");
  const [userID, setUserID] = useState(passedUserID || "");
  const [email, setEmail] = useState(userEmail || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [inputFocused, setInputFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null); // 'Apple' or 'Google'

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

  const handleCreatePasskey = async () => {
    if (!selectedProvider) {
      Alert.alert("Error", "Please select a passkey provider (Apple or Google)");
      return;
    }
    if (!fullName.trim()) {
      setMessage("Please enter your full name");
      return;
    }
    if (!userID) {
      setMessage("Enter email or phone");
      return;
    }
    setLoading(true);
    setMessage("");
    animateButton();

    try {
      // First authenticate with biometrics
      const bioAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: `Authenticate with ${selectedProvider}`,
        fallbackLabel: "Use PIN",
      });
      
      if (!bioAuth.success) {
        throw new Error("Biometric authentication failed");
      }

      // Generate unique passkey credentials
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const credentialId = `cred_${userID}_${timestamp}_${randomString}`;
      const publicKey = `key_${userID}_${timestamp}_${randomString}`;

      // Store passkey directly in Supabase
      const { data, error } = await supabase
        .from("passkeys")
        .insert([
          {
            user_id: userID,
            credential_id: credentialId,
            public_key: publicKey,
            provider: selectedProvider,
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Supabase error:", error);
        throw new Error(error.message || "Failed to store passkey");
      }

      console.log("Passkey stored successfully:", data);

      // Send welcome email with passkey
      if (email && email.trim()) {
        try {
          console.log('📧 Attempting to send welcome email...');
          console.log('📧 Email:', email);
          console.log('📧 Credential ID:', credentialId);
          console.log('📧 Provider:', selectedProvider);
          console.log('📧 User Name:', fullName.trim());
          console.log('📧 Is Welcome:', true);
          
          const emailPayload = {
            email: email,
            credentialId: credentialId,
            provider: selectedProvider,
            userName: fullName.trim(),
            isWelcome: true,
          };
          
          console.log('📧 Full payload:', JSON.stringify(emailPayload, null, 2));
          
          const { data: emailData, error: emailError } = await supabase.functions.invoke('dynamic-api', {
            body: emailPayload,
          });

          if (emailError) {
            console.error("⚠️ Email sending failed!");
            console.error("Error name:", emailError.name);
            console.error("Error message:", emailError.message);
            console.error("Error context:", emailError.context);
            console.error("Full email error:", JSON.stringify(emailError, null, 2));
            
            // Try to get the response body for more details
            try {
              const errorBody = await emailError.context.json();
              console.error("📄 Error response body:", errorBody);
            } catch (e) {
              console.error("Could not parse error response body");
            }
            
            // Show user-friendly error
            Alert.alert(
              "Email Error",
              "Passkey created successfully but welcome email failed to send. Please check Supabase function logs.",
              [{ text: "OK" }]
            );
          } else {
            console.log("✅ Welcome email sent successfully!");
            console.log("Email response:", emailData);
            setMessage("Welcome email sent! Check your inbox.");
            
            Alert.alert(
              "Success!",
              "Passkey created and welcome email sent! 🎉",
              [{ text: "OK" }]
            );
          }
        } catch (emailErr) {
          console.error("⚠️ Email sending exception caught!");
          console.error("Exception type:", emailErr.constructor.name);
          console.error("Exception message:", emailErr.message);
          console.error("Exception stack:", emailErr.stack);
          console.error("Full error details:", JSON.stringify(emailErr, null, 2));
          
          Alert.alert(
            "Email Error",
            "Passkey created but email failed: " + (emailErr.message || "Unknown error"),
            [{ text: "OK" }]
          );
        }
      }

      // Show success animation
      setSuccess(true);
      setLoading(false);
      showSuccess();

      // Navigate to subscription screen after success animation
      setTimeout(() => navigation.navigate("subscription", { 
        userID 
      }), 1800);
    } catch (err) {
      console.error("Registration error:", err);
      setMessage(err.message || "Registration failed");
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

          {/* Back Arrow */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={26} color="#1C1C1E" />
          </TouchableOpacity>

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
                placeholder="Full Name"
                placeholderTextColor="#8E8E93"
                style={[
                  styles.input, 
                  nameFocused && styles.inputFocused,
                  initialFullName && styles.inputPrefilled
                ]}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                editable={!initialFullName}
              />
              {initialFullName && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#34C759" 
                  style={styles.checkIcon} 
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                placeholder="Email or Phone"
                placeholderTextColor="#8E8E93"
                style={[
                  styles.input, 
                  inputFocused && styles.inputFocused,
                  passedUserID && styles.inputPrefilled
                ]}
                value={userID}
                onChangeText={setUserID}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                editable={!passedUserID}
              />
              {passedUserID && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={20} 
                  color="#34C759" 
                  style={styles.checkIcon} 
                />
              )}
            </View>

            {/* Provider Selection Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  selectedProvider === 'Apple' && styles.selectedButton
                ]}
                onPress={() => setSelectedProvider("Apple")}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../assets/apple.png")}
                  style={styles.buttonIcon}
                />
                <Text style={[
                  styles.primaryButtonText,
                  selectedProvider === 'Apple' && styles.selectedButtonText
                ]}>
                  iCloud Keychain
                </Text>
                {selectedProvider === 'Apple' && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#34C759" 
                    style={{ marginLeft: 8 }} 
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  selectedProvider === 'Google' && styles.selectedButton
                ]}
                onPress={() => setSelectedProvider("Google")}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Image
                  source={require("../../assets/googleicon.jpg")}
                  style={styles.buttonIcon}
                />
                <Text style={[
                  styles.secondaryButtonText,
                  selectedProvider === 'Google' && styles.selectedButtonText
                ]}>
                  Google Passkey
                </Text>
                {selectedProvider === 'Google' && (
                  <Ionicons 
                    name="checkmark-circle" 
                    size={20} 
                    color="#34C759" 
                    style={{ marginLeft: 8 }} 
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Create Passkey Button - Only show when provider is selected */}
            {selectedProvider && (
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity
                  style={[
                    styles.createPasskeyButton,
                    loading && styles.createPasskeyButtonDisabled
                  ]}
                  onPress={handleCreatePasskey}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="finger-print" size={24} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.createPasskeyButtonText}>
                        Create Passkey
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}

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
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 20,
    zIndex: 10,
    padding: 8,
  },
  headerSection: { alignItems: "center", paddingTop: 60, paddingBottom: 48 },
  appLogo: { width: 64, height: 64, marginBottom: 24, borderRadius: 14 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1C1C1E",
    marginBottom: 8,
    textAlign: "center",
  },
  formSection: { flex: 1, justifyContent: "flex-start", paddingTop: 8 },
  inputContainer: { 
    marginBottom: 32,
    position: 'relative',
  },
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
  inputPrefilled: {
    backgroundColor: "#E8F5E9",
    borderColor: "#34C759",
    color: "#1C1C1E",
    fontWeight: "500",
  },
  checkIcon: {
    position: 'absolute',
    right: 16,
    top: 15,
  },
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
  selectedButton: {
    borderColor: "#34C759",
    borderWidth: 2,
    backgroundColor: "#E8F5E9",
  },
  selectedButtonText: {
    color: "#34C759",
    fontWeight: "700",
  },
  createPasskeyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF1493",
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#FF1493",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createPasskeyButtonDisabled: {
    opacity: 0.6,
  },
  createPasskeyButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
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
  disclaimerText: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
