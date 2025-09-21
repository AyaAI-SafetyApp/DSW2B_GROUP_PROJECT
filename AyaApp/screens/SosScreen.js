import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  Switch,
  SafeAreaView,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";

const FALL_THRESHOLD = 2.5;
const SOS_COUNTDOWN = 5;

export default function App() {
  const [location, setLocation] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(true);
  const [contacts, setContacts] = useState(["+27712233272"]);
  const [status, setStatus] = useState("System initializing...");
  const [sosCountdown, setSosCountdown] = useState(0);
  const [newContact, setNewContact] = useState("");
  const countdownRef = useRef(null);
  const webview = useRef(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required!");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setStatus("System ready - Location obtained");
    })();
  }, []);

  useEffect(() => {
    if (!fallDetectionEnabled) return;
    const subscription = Accelerometer.addListener((data) => {
      const totalAcc = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
      if (totalAcc > FALL_THRESHOLD) handleFall();
    });
    Accelerometer.setUpdateInterval(200);
    return () => subscription.remove();
  }, [location, fallDetectionEnabled]);

  const handleFall = async () => {
    setStatus("⚠️ Fall detected! Sending alert...");
    const loc = location || (await Location.getCurrentPositionAsync({}));
    sendAlert("fall", loc);
  };

  const sendAlert = async (type, loc) => {
    const payload = {
      userId: "user123",
      timestamp: Date.now(),
      coords: loc.coords,
      contacts,
    };
    const endpoint =
      type === "fall"
        ? "https://e732255ca395.ngrok-free.app/api/send-location"
        : "https://e732255ca395.ngrok-free.app/api/sos-call";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setStatus(`✅ ${type.toUpperCase()} alert sent successfully`);
    } catch (err) {
      console.warn("Offline or failed, adding to queue:", err);
      setOfflineQueue((prev) => [...prev, { type, payload }]);
      setStatus("📡 Alert queued - Will retry when online");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (offlineQueue.length === 0) return;
      offlineQueue.forEach(async (item, index) => {
        try {
          const endpoint =
            item.type === "fall"
              ? "https://e732255ca395.ngrok-free.app/api/send-location"
              : "https://e732255ca395.ngrok-free.app/api/sos-call";
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          setOfflineQueue((prev) => prev.filter((_, i) => i !== index));
          setStatus(`✅ Queued ${item.type} alert sent`);
        } catch {}
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [offlineQueue]);

  const webviewHtml = `
    <!DOCTYPE html>
    <html>
      <body>
        <script>
          const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            if(transcript.includes("aya")){
              window.ReactNativeWebView.postMessage("aya detected");
            }
          };
          recognition.start();
        </script>
      </body>
    </html>
  `;

  const addContact = () => {
    if (newContact && !contacts.includes(newContact)) {
      if (newContact.match(/^\+?\d{10,15}$/)) {
        setContacts([...contacts, newContact]);
        setNewContact("");
      } else {
        Alert.alert("Invalid Number", "Please enter a valid phone number");
      }
    }
  };

  const removeContact = (contact) => {
    Alert.alert(
      "Remove Contact",
      `Remove ${contact} from emergency contacts?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setContacts(contacts.filter((c) => c !== contact)),
        },
      ]
    );
  };

  const startSOSCountdown = async () => {
    if (sosCountdown > 0) {
      // Cancel countdown if already running
      clearInterval(countdownRef.current);
      setSosCountdown(0);
      setStatus("SOS cancelled");
      return;
    }

    if (contacts.length === 0) {
      Alert.alert("No Contacts", "Please add emergency contacts first");
      return;
    }

    setSosCountdown(SOS_COUNTDOWN);
    setStatus("🚨 SOS countdown started...");

    countdownRef.current = setInterval(() => {
      setSosCountdown((prev) => {
        if (prev === 1) {
          clearInterval(countdownRef.current);
          triggerSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const triggerSOS = async () => {
    const loc = location || (await Location.getCurrentPositionAsync({}));
    setStatus("🚨 SOS alert triggered! Contacting emergency contacts...");
    sendAlert("sos", loc);
  };

  const getStatusColor = () => {
    if (status.includes("⚠️") || status.includes("🚨")) return "#FF3B30";
    if (status.includes("✅")) return "#34C759";
    if (status.includes("📡")) return "#FF9500";
    return "#666";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <WebView
        ref={webview}
        originWhitelist={["*"]}
        source={{ html: webviewHtml }}
        onMessage={() => {
          setStatus("🎤 Voice command detected!");
          triggerSOS();
        }}
        javaScriptEnabled
        style={{ flex: 0, height: 0 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialIcons name="shield" size={32} color="#FF3B30" />
          <Text style={styles.title}>Aya Emergency</Text>
        </View>
        <View
          style={[
            styles.statusContainer,
            { backgroundColor: getStatusColor() + "15" },
          ]}
        >
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor() }]}
          />
          <Text style={[styles.status, { color: getStatusColor() }]}>
            {status}
          </Text>
        </View>
      </View>

      {/* Warning Banner */}
      {offlineQueue.length > 0 && (
        <View style={styles.warningBanner}>
          <Ionicons name="warning" size={20} color="#FF9500" />
          <Text style={styles.warningText}>
            {offlineQueue.length} alert{offlineQueue.length > 1 ? "s" : ""}{" "}
            pending retry
          </Text>
        </View>
      )}

      {/* Fall Detection Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <MaterialIcons
              name="trending-down"
              size={24}
              color={fallDetectionEnabled ? "#34C759" : "#999"}
            />
            <Text style={styles.cardTitle}>Fall Detection</Text>
          </View>
          <Switch
            value={fallDetectionEnabled}
            onValueChange={setFallDetectionEnabled}
            trackColor={{ false: "#E5E5EA", true: "#34C75950" }}
            thumbColor={fallDetectionEnabled ? "#34C759" : "#FFFFFF"}
          />
        </View>
        <Text style={styles.cardDescription}>
          {fallDetectionEnabled
            ? "Monitoring for sudden movements and falls"
            : "Fall detection is disabled"}
        </Text>
      </View>

      {/* Emergency Contacts Section */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Ionicons name="people" size={24} color="#007AFF" />
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
            <Text style={styles.contactCount}>({contacts.length})</Text>
          </View>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="person-add" size={48} color="#999" />
            <Text style={styles.emptyStateText}>
              No emergency contacts added
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Add contacts to enable SOS alerts
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item}
            style={styles.contactsList}
            renderItem={({ item }) => (
              <View style={styles.contactRow}>
                <View style={styles.contactInfo}>
                  <Ionicons name="call" size={20} color="#007AFF" />
                  <Text style={styles.contactNumber}>{item}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeContact(item)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={styles.addContactContainer}>
          <TextInput
            placeholder="Enter phone number (+27...)"
            style={styles.input}
            value={newContact}
            onChangeText={setNewContact}
            keyboardType="phone-pad"
            returnKeyType="done"
            onSubmitEditing={addContact}
          />
          <TouchableOpacity
            style={[styles.addButton, !newContact && styles.addButtonDisabled]}
            onPress={addContact}
            disabled={!newContact}
          >
            <Ionicons
              name="add"
              size={24}
              color={newContact ? "#FFFFFF" : "#999"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={[styles.sosButton, sosCountdown > 0 && styles.sosButtonActive]}
          onPress={startSOSCountdown}
        >
          {sosCountdown > 0 ? (
            <>
              <Text style={styles.sosCountdownText}>{sosCountdown}</Text>
              <Text style={styles.sosCancelText}>Tap to Cancel</Text>
            </>
          ) : (
            <>
              <FontAwesome name="phone" size={40} color="#FFFFFF" />
              <Text style={styles.sosButtonText}>Emergency SOS</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.sosInstructions}>
          <Ionicons name="information-circle-outline" size={16} color="#999" />
          <Text style={styles.sosInstructionsText}>
            Press and hold for emergency or say "Aya" for voice activation
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },

  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1D1D1F",
    marginLeft: 12,
  },

  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },

  status: {
    fontSize: 14,
    fontWeight: "500",
  },

  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF4E6",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9500",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 8,
  },

  warningText: {
    color: "#D1940C",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F2F2F7",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },

  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D1D1F",
    marginLeft: 8,
  },

  contactCount: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },

  cardDescription: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },

  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#999",
    marginTop: 12,
  },

  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },

  contactsList: {
    maxHeight: 150,
  },

  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F2F7",
  },

  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  contactNumber: {
    fontSize: 16,
    color: "#1D1D1F",
    marginLeft: 12,
  },

  removeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#FFF2F2",
  },

  addContactContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 12,
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E5E5EA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },

  addButton: {
    backgroundColor: "#007AFF",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  addButtonDisabled: {
    backgroundColor: "#F2F2F7",
  },

  sosContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  sosButton: {
    backgroundColor: "#FF3B30",
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  sosButtonActive: {
    backgroundColor: "#FF9500",
    shadowColor: "#FF9500",
  },

  sosButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },

  sosCountdownText: {
    color: "#FFFFFF",
    fontSize: 48,
    fontWeight: "700",
  },

  sosCancelText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },

  sosInstructions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
  },

  sosInstructionsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    marginLeft: 6,
    lineHeight: 16,
  },
});
