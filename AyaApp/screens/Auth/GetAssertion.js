import React, { useState } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import axios from "axios";
import { useNavigation, useRoute } from "@react-navigation/native";

const API_BASE = "http://172.16.26.108:3000";

export default function GetAssertion() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userID } = route.params;
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const bioAuth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Authenticate to login",
    });
    if (!bioAuth.success) return setLoading(false);

    const fakeAssertion = { id: `${userID}-cred-${Date.now()}` };
    await axios.post(`${API_BASE}/login/verify`, {
      userID,
      assertion: fakeAssertion,
    });

    navigation.navigate("MainTabs");
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <TouchableOpacity
        onPress={handleLogin}
        style={{ padding: 16, backgroundColor: "#de0973ff", borderRadius: 10 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff" }}>Login</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
