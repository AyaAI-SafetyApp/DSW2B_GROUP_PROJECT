import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import axios from "axios";
import { MaterialIcons } from "@expo/vector-icons";

const FALL_THRESHOLD = 1.8;
const FALL_DETECTION_COOLDOWN = 30000;

export default function FallDetectionScreen() {
  const [fallDetected, setFallDetected] = useState(false);
  const [location, setLocation] = useState(null);
  const [sending, setSending] = useState(false);

  const lastFallTime = useRef(0);

  useEffect(() => {
    let accelSubscription = null;

    const subscribeSensors = () => {
      accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);

        const now = Date.now();
        if (
          magnitude > FALL_THRESHOLD &&
          now - lastFallTime.current > FALL_DETECTION_COOLDOWN &&
          !fallDetected
        ) {
          lastFallTime.current = now;
          setFallDetected(true);
        }
      });

      Accelerometer.setUpdateInterval(200);
    };

    subscribeSensors();

    return () => {
      if (accelSubscription) accelSubscription.remove();
    };
  }, [fallDetected]);

  useEffect(() => {
    const sendSOS = async () => {
      if (!fallDetected) return;

      setSending(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required to send SOS alerts."
          );
          setSending(false);
          setFallDetected(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        setLocation(loc.coords);

        const payload = {
          userId: "Ms Manyamboze",
          timestamp: new Date().toISOString(),
          coords: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
          trustedContacts: trustedContacts.map((c) => c.phone),
        };

        await axios.post(
          "https://3a721eb96aa9.ngrok-free.app/api/send-location",
          payload
        );

        Alert.alert("SOS Sent", "Emergency alert has been sent to contacts.");
      } catch (error) {
        console.error("Error sending SOS:", error);
        Alert.alert("Error", "Failed to send SOS alert.");
      } finally {
        setSending(false);
        setFallDetected(false);
      }
    };

    sendSOS();
  }, [fallDetected]);

  const manualSOS = () => {
    if (!sending) setFallDetected(true);
  };

  const handleContactOptions = (contact) => {
    Alert.alert(
      "Contact Options",
      `${contact.name} (${contact.phone})`,
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setTrustedContacts((prev) =>
              prev.filter((c) => c.id !== contact.id)
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  const renderContact = ({ item }) => (
    <View style={styles.contactRow}>
      <Text style={styles.contactText}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleContactOptions(item)}>
        <MaterialIcons name="more-vert" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aya - Fall Detection SOS</Text>

      <FlatList
        data={trustedContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        style={styles.contactList}
        ListHeaderComponent={
          <Text style={styles.contactHeader}>Trusted Contacts</Text>
        }
        ListEmptyComponent={
          <Text style={styles.emptyContacts}>No trusted contacts added.</Text>
        }
      />

      {sending ? (
        <>
          <ActivityIndicator size="large" color="#FF3B30" />
          <Text style={styles.status}>Sending SOS alert...</Text>
        </>
      ) : (
        <Text style={styles.status}>
          {fallDetected
            ? "Fall detected! Sending alert..."
            : "Monitoring for falls..."}
        </Text>
      )}

      {location && (
        <Text style={styles.location}>
          Last Location: {location.latitude.toFixed(5)},{" "}
          {location.longitude.toFixed(5)}
        </Text>
      )}

      <TouchableOpacity style={styles.sosButton} onPress={manualSOS}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 20,
    textAlign: "center",
  },
  contactList: {
    maxHeight: 150,
    marginBottom: 20,
  },
  contactHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3B30",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffe6e6",
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#FF3B30",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  contactText: {
    fontSize: 16,
    color: "#b30000",
  },
  emptyContacts: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  status: {
    fontSize: 18,
    color: "#555",
    textAlign: "center",
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 30,
  },
  sosButton: {
    backgroundColor: "#FF0000",
    paddingVertical: 20,
    borderRadius: 50,
    alignItems: "center",
    marginHorizontal: 80,
    shadowColor: "#FF0000",
    shadowOpacity: 0.7,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  sosText: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    letterSpacing: 2,
  },
});
