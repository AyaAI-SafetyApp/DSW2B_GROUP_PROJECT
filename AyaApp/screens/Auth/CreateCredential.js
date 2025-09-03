// User enters email/phone -> biometric -> fake credential -> send to backend -> redirect to AccountForm
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import axios from "axios";
import { useNavigation } from "@react-navigation/native";

const API_BASE = "http://172.16.26.108:3000";

export default function CreateCredentials() {
  const navigation = useNavigation();
  const [userID, setUserID] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async () => {
    try {
      if (!userID) throw new Error("Enter email or phone");
      setLoading(true);

      const bioAuth = await LocalAuthentication.authenticateAsync({ promptMessage: "Authenticate to register" });
      if (!bioAuth.success) throw new Error("Biometric failed");

      const fakeCredential = {
        id: `${userID}-cred-${Date.now()}`,
        rawId: `${userID}-raw-${Date.now()}`,
        type: "public-key",
      };

      await axios.post(`${API_BASE}/register`, { userID, credential: fakeCredential });

      navigation.navigate("AccountForm", { userID });
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register Passkey</Text>
      <TextInput placeholder="Email or Phone" style={styles.input} value={userID} onChangeText={setUserID} />
      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
      </TouchableOpacity>
      {message ? <Text>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 12 },
  input: { width: "100%", padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 20 },
  button: { width: "100%", padding: 16, borderRadius: 10, backgroundColor: "#de0973ff", alignItems: "center" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
