import React, { useState } from "react";
import { View, TextInput, Button } from "react-native";
import axios from "axios";
import { useRoute, useNavigation } from "@react-navigation/native";

const API_BASE = "http://172.16.26.108:3000";

export default function AccountForm() {
  const route = useRoute();
  const navigation = useNavigation();
  const { userID } = route.params;
  const [name, setName] = useState("");

  const handleSubmit = async () => {
    await axios.post(`${API_BASE}/account`, { userID, account: { name } });
    navigation.navigate("GetAssertion", { userID });
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={{ marginBottom: 12, borderWidth: 1, padding: 10 }}
      />
      <Button title="Submit" onPress={handleSubmit} />
    </View>
  );
}
