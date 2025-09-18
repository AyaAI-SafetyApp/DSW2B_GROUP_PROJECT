import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Vibration,
} from "react-native";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import { Audio } from "expo-av";

export default function SosScreen({ userId = "user123" }) {
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosSent, setSosSent] = useState(false);
  const countdownRef = useRef(null);
  const accelerometerActive = useRef(true);

  // Request location permission at start
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot access location");
      }
    })();
  }, []);

  // Fall detection
  useEffect(() => {
    Accelerometer.setUpdateInterval(400);

    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const totalAcc = Math.sqrt(x * x + y * y + z * z);

      if (totalAcc > 3.5 && !sosSent && accelerometerActive.current) {
        accelerometerActive.current = false;
        triggerSOS();
      }
    });

    return () => subscription && subscription.remove();
  }, [sosSent]);

  const triggerSOS = useCallback(() => {
    Vibration.vibrate([500, 500, 500]); // vibrate pattern
    playBeep();

    Alert.alert("⚠️ Fall detected!", "Sending SOS in 3 seconds...");

    setIsCountdownActive(true);
    setCountdown(3);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          sendSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const playBeep = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("./assets/beep.mp3") // add a beep mp3 in assets
      );
      await sound.playAsync();
    } catch (e) {
      console.warn("Beep failed", e);
    }
  };

  const sendSOS = useCallback(async () => {
    setIsCountdownActive(false);
    setSosSent(true);

    try {
      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      const response = await fetch(
        "https://9fbd5416a90a.ngrok-free.app/api/send-location",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, timestamp: Date.now(), coords }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "🚨 SOS Sent",
          `Location: ${coords.latitude}, ${coords.longitude}`
        );
      } else {
        Alert.alert("❌ Failed", data.error || "Something went wrong");
      }
    } catch (error) {
      console.error("Error sending SOS:", error);
      Alert.alert(
        "⚠️ Error",
        "Could not send SOS. Check internet/permissions."
      );
    }
  }, [userId]);

  const handlePress = () => {
    if (!sosSent) triggerSOS();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.sosButton} onPress={handlePress}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      {isCountdownActive && (
        <Text style={styles.countdown}>Sending in {countdown}s...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  sosButton: {
    backgroundColor: "red",
    padding: 40,
    borderRadius: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  sosText: { color: "white", fontSize: 28, fontWeight: "bold" },
  countdown: { marginTop: 20, fontSize: 18, color: "gray" },
});
