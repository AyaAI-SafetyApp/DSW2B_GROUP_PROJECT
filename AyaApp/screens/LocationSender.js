import React from "react";
import { View, Button, Alert } from "react-native";
import * as Location from "expo-location";

export default function LocationSender() {
  async function sendLocationToBackend() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    console.log("Location:", location);

    const backendUrl = "https://your-backend.example.com/api/send-location";

    const data = {
      userId: "user123",
      timestamp: new Date().toISOString(),
      coords: {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      },
    };

    try {
      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        Alert.alert("Location sent successfully!");
      } else {
        Alert.alert("Failed to send location");
      }
    } catch (error) {
      Alert.alert("Error sending location: " + error.message);
    }
  }

  return (
    <View style={{ marginTop: 50, paddingHorizontal: 20 }}>
      <Button
        title="Send Location to Backend"
        onPress={sendLocationToBackend}
      />
    </View>
  );
}
