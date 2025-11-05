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
  Animated,
  ScrollView,
} from "react-native";
import * as Location from "expo-location";
import { Accelerometer } from "expo-sensors";
import { WebView } from "react-native-webview";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import * as contactsService from "../SosCRUD/contactsService";
import { supabase } from "../SosCRUD/supabaseClient";

const FALL_THRESHOLD = 2.5;
const SOS_COUNTDOWN = 5;
const DEV_EMAIL = "dev@local";
const DEV_PASSWORD = "DevPass123!";

export default function AyaEmergencyApp() {
  const [location, setLocation] = useState(null);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(false);
  const [contacts, setContacts] = useState(["+27712233272"]);
  const [status, setStatus] = useState("Alerts inactive");
  const [sosCountdown, setSosCountdown] = useState(0);
  const [newContact, setNewContact] = useState("");
  const countdownRef = useRef(null);
  const webview = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const ensureDevSignedIn = async () => {
    try {
      const { data: current } = await supabase.auth.getUser();
      if (current?.user) return true;

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        });
      if (!signInError && signInData?.user) return true;

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });
      if (signUpError) return false;

      const { data: signInAfter, error: signInAfterErr } =
        await supabase.auth.signInWithPassword({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        });
      return !!signInAfter?.user;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required!");
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await ensureDevSignedIn();
        const dbContacts = await contactsService.fetchContacts();
        if (Array.isArray(dbContacts) && dbContacts.length > 0) {
          setContacts(dbContacts);
        }
      } catch (e) {
        Alert.alert("Error", e?.message || "Failed to load contacts");
      }
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
    setStatus("Fall detected! Sending alert...");
    const loc = location || (await Location.getCurrentPositionAsync({}));
    sendAlert("fall", loc);
    triggerSOS();
  };

  const sendAlert = async (type, loc) => {
    const payload = {
      userId: "user123",
      timestamp: Date.now(),
      coords: loc.coords,
      contacts,
    };
    const endpoint = "https://dsw2b-backend.onrender.com/api/send-location";
    try {
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setStatus(`${type.toUpperCase()} alert sent`);
    } catch {
      setOfflineQueue((prev) => [...prev, { type, payload }]);
      setStatus("Alert queued");
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      offlineQueue.forEach(async (item, index) => {
        try {
          const endpoint = "https://dsw2b-backend.onrender.com/api/send-location";
          await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });
          setOfflineQueue((prev) => prev.filter((_, i) => i !== index));
          setStatus(`Queued ${item.type} alert sent`);
        } catch { }
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

  const addContact = async () => {
    if (newContact && !contacts.includes(newContact) && newContact.match(/^\+?\d{10,15}$/)) {
      try {
        const signed = await ensureDevSignedIn();
        if (!signed) throw new Error("Not authenticated");
        const updated = await contactsService.addContact(null, newContact);
        if (Array.isArray(updated) && updated.length > 0) setContacts(updated);
        else setContacts((prev) => [...prev, newContact]);
        setNewContact("");
      } catch (e) {
        Alert.alert("Error", e?.message || "Failed to add contact");
      }
    } else if (newContact) Alert.alert("Invalid Number", "Please enter a valid phone number");
  };

  const removeContact = (contact) => {
    Alert.alert("Remove Contact", `Remove ${contact}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            const signed = await ensureDevSignedIn();
            if (!signed) throw new Error("Not authenticated");
            const updated = await contactsService.removeContact(null, contact);
            if (Array.isArray(updated)) setContacts(updated);
            else setContacts((prev) => prev.filter((c) => c !== contact));
          } catch (e) {
            Alert.alert("Error", e?.message || "Failed to remove contact");
          }
        },
      },
    ]);
  };

  const startSOSCountdown = async () => {
    if (sosCountdown > 0) {
      clearInterval(countdownRef.current);
      setSosCountdown(0);
      Animated.timing(progressAnim, { toValue: 0, duration: 0, useNativeDriver: false }).start();
      setStatus("SOS cancelled");
      return;
    }
    if (contacts.length === 0) return Alert.alert("No Contacts", "Add emergency contacts first");

    setSosCountdown(SOS_COUNTDOWN);
    setStatus("SOS countdown started...");
    progressAnim.setValue(0);
    Animated.timing(progressAnim, { toValue: 1, duration: SOS_COUNTDOWN * 1000, useNativeDriver: false }).start();

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
    setStatus("SOS triggered!");

    sendAlert("sos", loc);

    // Trigger call to first contact via backend
    if (contacts.length > 0) {
      try {
        const response = await fetch("http://172.16.26.108:3000/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: contacts[0] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Call failed");
        setStatus("SOS call initiated to " + contacts[0]);
      } catch (e) {
        Alert.alert("Call Error", e.message);
        setStatus("SOS call failed");
      }
    }
  };

  return (
    <ScrollView>
      <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <WebView
        ref={webview}
        originWhitelist={["*"]}
        source={{ html: webviewHtml }}
        onMessage={() => triggerSOS()}
        javaScriptEnabled
        style={{ flex: 0, height: 0 }}
      />

        <View style={styles.topContainer}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertText}>{status}</Text>
          </View>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Alerts</Text>
            <Switch
              value={fallDetectionEnabled}
              onValueChange={(v) => {
                setFallDetectionEnabled(v);
                setStatus(v ? "⚠️ Alerts active" : "⚠️ Alerts inactive");
              }}
              trackColor={{ false: "#E5E5EA", true: "#34C75950" }}
              thumbColor={fallDetectionEnabled ? "#34C759" : "#FFFFFF"}
            />
          </View>
        </View>

        <View style={styles.sosWrapper}>
          <Animated.View
            style={[styles.progressRing, { transform: [{ scale: progressAnim }] }]}
          />
        </View>
     

        <View style={styles.contactsContainer}>
          <Text style={styles.contactsHeader}>Emergency Contacts</Text>
          <FlatList
            data={contacts}
            keyExtractor={(item) => item}
            style={styles.contactsList}
            renderItem={({ item }) => (
              <View style={styles.contactRow}>
                <Text style={styles.contactNumber}>{item}</Text>
                <TouchableOpacity onPress={() => removeContact(item)} style={styles.contactRemove}>
                  <Ionicons name="close-circle" size={24} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity
            onPress={addContact}
            style={[
              styles.addButton,
              !newContact && { backgroundColor: "#E5E5EA" },
            ]}
            disabled={!newContact}
          />
            <Ionicons
              name="add"
              size={24}
              color={newContact ? "#FFFFFF" : "#999"}
            />
            <TouchableOpacity
              onPress={addContact}
              style={[styles.addButton, !newContact && { backgroundColor: "#E5EEA" }]}
              disabled={!newContact}
            >
              <Ionicons name="add" size={24} color={newContact ? "#FFFFFF" : "#999"} />
            </TouchableOpacity>
          </View>
         
    </SafeAreaView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9F9F9" },
  topContainer: { paddingHorizontal: 20, paddingTop: 20 },
  alertContainer: { paddingVertical: 12, backgroundColor: "#FFF3F3", borderRadius: 12, alignItems: "center", marginBottom: 12 },
  alertText: { fontSize: 16, color: "#FF3B30", fontWeight: "600" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  switchLabel: { fontSize: 18, fontWeight: "600", color: "#1C1C1E" },
  sosWrapper: { flex: 1, justifyContent: "center", alignItems: "center" },
  sosButton: { backgroundColor: "#FF3B30", width: 160, height: 160, borderRadius: 80, justifyContent: "center", alignItems: "center", shadowColor: "#FF3B3030", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12 },
  sosButtonActive: { backgroundColor: "#FF9500" },
  sosCountdownText: { color: "#FFFFFF", fontSize: 48, fontWeight: "700" },
  sosInstruction: { marginTop: 12, color: "#999", fontSize: 14 },
  progressRing: { position: "absolute", width: 180, height: 180, borderRadius: 90, borderWidth: 4, borderColor: "#FF9500" },
  contactsContainer: { paddingHorizontal: 20, paddingBottom: 40 },
  contactsHeader: { fontSize: 18, fontWeight: "700", color: "#1C1C1E", marginBottom: 12 },
  contactsList: { maxHeight: 180 },
  contactRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 8, paddingHorizontal: 12, shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  contactNumber: { fontSize: 16, color: "#1C1C1E" },
  contactRemove: {},
  addContactContainer: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  input: { flex: 1, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderRadius: 12, fontSize: 16, color: "#000", shadowColor: "#00000010", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  addButton: { marginLeft: 12, backgroundColor: "#007AFF", width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
});
