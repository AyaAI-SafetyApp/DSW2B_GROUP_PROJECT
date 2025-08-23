import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

export default function SosScreen() {
  const [location, setLocation] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
  });
  const [contacts, setContacts] = useState([
    "+1 (555) 123-4567",
    "+1 (555) 987-6543",
  ]);
  const [isCountdownActive, setIsCountdownActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [newContact, setNewContact] = useState("");
  const [editingContactIndex, setEditingContactIndex] = useState(null);
  const countdownInterval = useRef(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Cannot access location");
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    })();
  }, []);

  const startCountdown = useCallback(() => {
    setIsCountdownActive(true);
    setCountdown(10);
    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval.current);
          sendSOS();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const cancelCountdown = useCallback(() => {
    clearInterval(countdownInterval.current);
    setIsCountdownActive(false);
  }, []);

  const handleSOSPress = useCallback(() => {
    Alert.alert(
      "Send SOS Alert?",
      "This will start a countdown before sending your location to emergency contacts.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Start", onPress: startCountdown },
      ]
    );
  }, [startCountdown]);

  const sendSOS = useCallback(() => {
    setIsCountdownActive(false);
    Alert.alert(
      "SOS Alert Sent",
      `Location: ${location.latitude}, ${location.longitude}\nContacts notified: ${contacts.length}`
    );
  }, [location, contacts]);

  const addOrUpdateContact = useCallback(() => {
    if (!newContact.trim()) return;
    let updatedContacts;
    if (editingContactIndex !== null) {
      updatedContacts = [...contacts];
      updatedContacts[editingContactIndex] = newContact;
      setEditingContactIndex(null);
    } else {
      updatedContacts = [...contacts, newContact];
    }
    setContacts(updatedContacts);
    setNewContact("");
    setContactModalVisible(false);
  }, [contacts, newContact, editingContactIndex]);

  const deleteContact = useCallback(
    (index) => {
      Alert.alert("Remove contact?", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => setContacts(contacts.filter((_, i) => i !== index)),
        },
      ]);
    },
    [contacts]
  );

  const editContact = (index) => {
    setNewContact(contacts[index]);
    setEditingContactIndex(index);
    setContactModalVisible(true);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Header */}
      <View style={styles.header}></View>

      {/* Warning Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          Use only in real emergencies • Fall detection active
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.infoText}>
          Press and hold the button below to send your location to emergency
          contacts
        </Text>

        {/* SOS Button */}
        <TouchableOpacity
          onPress={handleSOSPress}
          style={styles.sosButton}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>

        {/* Emergency Contacts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardTitle}>
              <Ionicons name="people" size={20} color="#4B5563" />
              <Text style={styles.cardHeaderText}>Emergency Contacts</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setNewContact("");
                setEditingContactIndex(null);
                setContactModalVisible(true);
              }}
              style={styles.addButton}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {contacts.map((contact, index) => (
            <View key={index} style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <Ionicons name="call" size={18} color="#9CA3AF" />
                <Text style={styles.contactText}>{contact}</Text>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  onPress={() => editContact(index)}
                  style={styles.iconButton}
                >
                  <Ionicons name="pencil" size={18} color="#6B7280" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteContact(index)}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {contacts.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="call" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No emergency contacts added</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add contacts
              </Text>
            </View>
          )}
        </View>

        {/* Location Status */}
        <View style={styles.card}>
          <Text style={styles.cardHeaderText}>Location Status</Text>
          <View style={styles.locationRow}>
            <View style={styles.dot} />
            <Text style={styles.locationText}>Location services enabled</Text>
          </View>
          <Text style={styles.locationSubtext}>
            Your current location will be shared with emergency contacts
          </Text>
        </View>
      </View>

      {/* Countdown Modal */}
      <Modal transparent visible={isCountdownActive} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
            <Text style={styles.modalTitle}>Sending SOS Alert</Text>
            <Text style={styles.modalSubtitle}>
              Emergency alert will be sent in {countdown} seconds
            </Text>
            <TouchableOpacity
              onPress={cancelCountdown}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Contact Modal */}
      <Modal transparent visible={contactModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContactIndex !== null
                ? "Edit Contact"
                : "Add Emergency Contact"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="+1 (555) 123-4567"
              value={newContact}
              onChangeText={setNewContact}
              keyboardType="phone-pad"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                onPress={addOrUpdateContact}
                style={styles.confirmButton}
              >
                <Text style={styles.confirmText}>
                  {editingContactIndex !== null ? "Update" : "Add Contact"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setContactModalVisible(false);
                  setNewContact("");
                  setEditingContactIndex(null);
                }}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginLeft: 10,
    color: "#111827",
  },
  banner: { backgroundColor: "#FEF3C7", paddingVertical: 8 },
  bannerText: { textAlign: "center", color: "#B45309", fontWeight: "500" },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  infoText: {
    textAlign: "center",
    color: "#4B5563",
    fontSize: 16,
    marginBottom: 20,
  },
  sosButton: {
    backgroundColor: "#EF4444",
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 30,
    elevation: 5,
  },
  sosText: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { flexDirection: "row", alignItems: "center" },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
    color: "#111827",
  },
  addButton: { backgroundColor: "#E91E63", padding: 6, borderRadius: 16 },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  contactInfo: { flexDirection: "row", alignItems: "center" },
  contactText: { marginLeft: 8, fontSize: 16, color: "#111827" },
  contactActions: { flexDirection: "row" },
  iconButton: { padding: 6, marginLeft: 6 },
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyText: { color: "#6B7280", marginTop: 4 },
  emptySubtext: { color: "#9CA3AF", fontSize: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34D399",
    marginRight: 8,
  },
  locationText: { color: "#4B5563", fontSize: 14 },
  locationSubtext: { color: "#9CA3AF", fontSize: 12, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  countdownText: { fontSize: 32, fontWeight: "bold", color: "#B91C1C" },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
    color: "#111827",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  cancelButtonText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    marginVertical: 12,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between" },
  confirmButton: {
    backgroundColor: "#E91E63",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
  },
  confirmText: { color: "#fff", textAlign: "center", fontWeight: "600" },
});
