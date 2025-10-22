import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabaseAuth } from "../lib/supabaseClient";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      console.log("🔐 Attempting login for:", email);
      const data = await supabaseAuth.signIn(email, password);
      
      console.log("✅ Login response:", data);
      
      if (!data.session) {
        Alert.alert(
          "Email Not Verified",
          "Please check your email and click the verification link before logging in.",
          [{ text: "OK" }]
        );
        return;
      }

      if (!data.user) {
        throw new Error("No user data returned");
      }
      
      // Store user session
      await AsyncStorage.setItem("userSession", JSON.stringify(data.session));
      await AsyncStorage.setItem("userID", data.user.id);
      
      console.log("💾 Session stored for user:", data.user.id);
      
      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: "MainTabs" }],
      });
      
      Alert.alert("Success", "Login successful!");
    } catch (error) {
      console.error("❌ Login error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Check if it's an email verification error
      const errorMsg = error.message || "";
      if (errorMsg.toLowerCase().includes("email") && errorMsg.toLowerCase().includes("confirm")) {
        Alert.alert(
          "Email Not Verified",
          "Please check your email and click the verification link before logging in.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Login Failed", error.message || "Invalid email or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address first");
      return;
    }

    try {
      await supabaseAuth.resetPassword(email);
      Alert.alert("Success", "Password reset email sent! Check your inbox.");
    } catch (error) {
      Alert.alert("Error", error.message || "Failed to send reset email");
    }
  };

  return (
    <LinearGradient colors={["#d9c9ff", "#f6d5ef"]} style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/Logos/Aya_AI_Logo.png")}
          style={styles.logo}
        />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
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
            <Text style={styles.link} onPress={() => navigation.navigate("Signup")}>
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
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  logo: { width: 80, height: 80, resizeMode: "contain" },
  title: { fontSize: 28, fontWeight: "bold", color: "#e91e63", marginBottom: 24 },
  inputContainer: { width: "100%", backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  forgotText: { textAlign: "right", color: "#e91e63", marginTop: 4 },
  signInButton: {
    backgroundColor: "#e91e63",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signInText: { color: "#fff", fontWeight: "600", textAlign: "center" },
  orText: { textAlign: "center", color: "#999", marginTop: 20 },
  socialRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  socialButton: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 6,
    elevation: 1,
  },
  footerText: { textAlign: "center", marginTop: 20, color: "#555" },
  link: { color: "#e91e63", fontWeight: "600" },
});
