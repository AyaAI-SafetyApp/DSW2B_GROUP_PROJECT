import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import * as Location from "expo-location";
import axios from "axios";

export default function SOSScreen() {
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [status, setStatus] = useState("");

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setStatus("Permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  const sendAlert = async () => {
    try {
      const res = await axios.post(
        "https://b953799c016f.ngrok-free.app/api/send-location",
        {
          userId: "User123",
          timestamp: Date.now(),
          coords,
        }
      );
      setStatus(res.data.status);
    } catch (err) {
      console.error(err);
      setStatus("Failed to send alert");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SOS Alert</Text>
      <Text>Latitude: {coords.latitude}</Text>
      <Text>Longitude: {coords.longitude}</Text>
      <Button title="Send Alert" onPress={sendAlert} />
      {status ? <Text>Status: {status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
});
