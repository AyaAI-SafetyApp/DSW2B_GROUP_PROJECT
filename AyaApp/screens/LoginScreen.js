import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AntDesign,
  FontAwesome,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as LocalAuthentication from "expo-local-authentication";
import { supabaseAuth, supabase } from "../lib/supabaseClient";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasPasskey, setHasPasskey] = useState(false);
  const [savedEmail, setSavedEmail] = useState("");

  useEffect(() => {
    checkForPasskey();
  }, []);

  const checkForPasskey = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return;

      const lastSession = await AsyncStorage.getItem("@user_session");
      if (!lastSession) return;

      const userData = JSON.parse(lastSession);
      const userEmail = userData.email;

      const { data: passkeys } = await supabase
        .from("passkeys")
        .select("*")
        .eq("user_id", userEmail)
        .limit(1);

      if (passkeys?.length > 0) {
        setHasPasskey(true);
        setSavedEmail(userEmail);
        setEmail(userEmail);
      }
    } catch (error) {
      console.log("Passkey check error:", error);
    }
  };

  const handlePasskeyLogin = async () => {
    try {
      setLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Login with your passkey",
        fallbackLabel: "Use password instead",
      });

      if (!result.success) {
        Alert.alert(
          "Authentication Failed",
          "Biometric authentication was cancelled or failed"
        );
        return;
      }

      const userEmail = savedEmail || email;
      const { getUserProfile } = require("../lib/profileService");
      const userProfile = await getUserProfile(userEmail);
      if (!userProfile) throw new Error("User profile not found");

      if (userProfile.is_active === false) {
        await supabase
          .from("user_profiles")
          .update({
            is_active: true,
            deactivated_at: null,
            last_login_at: new Date().toISOString(),
          })
          .eq("email", userEmail);
      }

      const userData = {
        email: userEmail,
        userId: userProfile.user_id,
        name: userProfile.full_name || userEmail.split("@")[0],
        provider: "passkey",
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem("@user_session", JSON.stringify(userData));
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
      Alert.alert("Success", "Login successful with passkey");
    } catch (error) {
      console.error("Passkey login error:", error);
      Alert.alert(
        "Login Failed",
        error.message || "Failed to login with passkey"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseAuth.signIn(email, password);
      if (!data.session) {
        Alert.alert(
          "Email Not Verified",
          "Please verify your email before logging in."
        );
        return;
      }

      const { getUserProfile } = require("../lib/profileService");
      const userProfile = await getUserProfile(email);

      const userData = {
        email,
        userId: data.user.id,
        name: userProfile?.full_name || email.split("@")[0],
        provider: "email",
        loginTime: new Date().toISOString(),
      };

      await AsyncStorage.setItem("@user_session", JSON.stringify(userData));
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (error) {
      Alert.alert("Login Failed", error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Enter your email address first");
      return;
    }
    try {
      await supabaseAuth.resetPassword(email);
      Alert.alert("Success", "Password reset email sent. Check your inbox.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    }
  };

  return (
    <LinearGradient colors={["#f9f9f9", "#ececec"]} style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/Logos/Aya_AI_Logo.png")}
          style={styles.logo}
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            placeholderTextColor="#888"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            placeholderTextColor="#888"
            secureTextEntry
          />

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.signInButton, loading && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signInText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {hasPasskey && (
            <>
              <Text style={styles.orText}>or</Text>
              <TouchableOpacity
                style={[styles.passkeyButton, loading && styles.disabledButton]}
                onPress={handlePasskeyLogin}
                disabled={loading}
              >
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={24}
                  color="#fff"
                  style={styles.passkeyIcon}
                />
                <Text style={styles.passkeyText}>Login with Passkey</Text>
              </TouchableOpacity>
            </>
          )}

          <Text style={styles.orText}>or continue with</Text>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialButton}>
              <AntDesign name="google" size={22} color="#DB4437" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <FontAwesome name="facebook" size={22} color="#1877F2" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={22} color="#000" />
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Don’t have an account?{" "}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate("Signup")}
            >
              Sign Up
            </Text>
          </Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: { width: 80, height: 80, resizeMode: "contain", marginBottom: 16 },
  inputContainer: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#000",
  },
  forgotText: { textAlign: "right", color: "#333", marginTop: 6, fontSize: 13 },
  signInButton: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  disabledButton: { opacity: 0.5 },
  signInText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  passkeyButton: {
    backgroundColor: "#4a90e2",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  passkeyIcon: { marginRight: 8 },
  passkeyText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  orText: { textAlign: "center", color: "#777", marginTop: 20, fontSize: 13 },
  socialRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  socialButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: "#eee",
  },
  footerText: { textAlign: "center", marginTop: 20, color: "#555" },
  link: { color: "#333", fontWeight: "600" },
});
