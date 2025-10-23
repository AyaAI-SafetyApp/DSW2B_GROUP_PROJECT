import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabaseAuth } from "../lib/supabaseClient";

export default function SignupScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (fullName.trim().length < 2) {
      Alert.alert("Error", "Please enter your full name");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (!agreedToTerms) {
      Alert.alert("Terms Required", "Please agree to the Terms of Service and Privacy Policy to continue");
      return;
    }

    setLoading(true);
    try {
      const data = await supabaseAuth.signUp(email, password);
      
      if (data.user) {
        await AsyncStorage.setItem("userID", data.user.id);
        
        if (data.session) {
          await AsyncStorage.setItem("userSession", JSON.stringify(data.session));
        }
        
        navigation.navigate("AccountForm", { userID: data.user.id });
        
        if (data.session) {
          Alert.alert("Success", "Account created! Please complete your profile.");
        } else {
          Alert.alert(
            "Account Created!", 
            "Please check your email to verify your account. You can complete your profile now and login after verification.",
            [{ text: "Continue" }]
          );
        }
      } else {
        throw new Error("Failed to create account. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      Alert.alert("Signup Failed", error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#d9c9ff", "#f6d5ef"]} style={styles.container}>
      <View style={styles.content}>
        <Image source={require("../assets/Logos/Aya_AI_Logo.png")} style={styles.logo} />

        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            style={styles.input}
            autoCapitalize="words"
          />
          <TextInput
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
          />

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.termsText}>
              I agree to the <Text style={styles.link}>Terms of Service</Text> and{" "}
              <Text style={styles.link}>Privacy Policy</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.signUpButton, loading && styles.disabledButton]} 
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.signUpText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>or sign up with</Text>

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
            Already have an account?{" "}
            <Text style={styles.link} onPress={() => navigation.navigate("Login")}>
              Login
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
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 15,
    marginBottom: 5,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#e91e63",
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#e91e63",
  },
  termsText: { 
    fontSize: 13, 
    color: "#777", 
    flex: 1,
  },
  link: { color: "#e91e63", fontWeight: "600" },
  signUpButton: {
    backgroundColor: "#e91e63",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  signUpText: { color: "#fff", fontWeight: "600", textAlign: "center" },
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
});
