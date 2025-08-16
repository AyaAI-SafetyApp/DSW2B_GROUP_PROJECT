import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Button,
  Platform,
} from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";

const FALL_THRESHOLD = 2.5; // Adjusted for impact detection based on typical values (2-3g for fall impact)

export default function SOSScreen() {
  const [accelerometerData, setAccelerometerData] = useState({
    x: 0,
    y: 0,
    z: 0,
  });
  const [alertActive, setAlertActive] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef(null);
  const [trustedNumbers, setTrustedNumbers] = useState([]);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [newNumber, setNewNumber] = useState("");

  // Load trusted numbers from storage
  useEffect(() => {
    const loadTrustedNumbers = async () => {
      try {
        const storedNumbers = await AsyncStorage.getItem("trustedNumbers");
        if (storedNumbers) {
          setTrustedNumbers(JSON.parse(storedNumbers));
        }
      } catch (error) {
        console.error("Failed to load trusted numbers", error);
      }
    };
    loadTrustedNumbers();
  }, []);

  // Save trusted numbers to storage
  const saveTrustedNumbers = async (numbers) => {
    try {
      await AsyncStorage.setItem("trustedNumbers", JSON.stringify(numbers));
      setTrustedNumbers(numbers);
    } catch (error) {
      console.error("Failed to save trusted numbers", error);
    }
  };

  // Add new number
  const addNumber = () => {
    if (newNumber && !trustedNumbers.includes(newNumber)) {
      const updatedNumbers = [...trustedNumbers, newNumber];
      saveTrustedNumbers(updatedNumbers);
      setNewNumber("");
    } else {
      Alert.alert("Invalid", "Please enter a valid unique number.");
    }
  };

  // Remove number
  const removeNumber = (number) => {
    const updatedNumbers = trustedNumbers.filter((n) => n !== number);
    saveTrustedNumbers(updatedNumbers);
  };

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location access is required for SOS.");
      }
    })();
  }, []);

  // Start accelerometer
  useEffect(() => {
    Accelerometer.setUpdateInterval(100); // 100ms
    const subscription = Accelerometer.addListener((data) => {
      setAccelerometerData(data);
      const totalForce = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);

      if (totalForce > FALL_THRESHOLD && !alertActive) {
        startCountdown();
      }
    });

    return () => subscription?.remove();
  }, [alertActive]);

  // Countdown timer with haptics
  const startCountdown = () => {
    if (trustedNumbers.length === 0) {
      Alert.alert("No Trusted Contacts", "Please add trusted contacts in settings.");
      return;
    }
    setAlertActive(true);
    setCountdown(10);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          sendSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelCountdown = () => {
    clearInterval(countdownRef.current);
    setAlertActive(false);
    setCountdown(10);
  };

  // Send SOS with location
  const sendSOS = async () => {
    setAlertActive(false);
    try {
      const location = await Location.getCurrentPositionAsync({});
      const message = `🚨 Emergency! I may have fallen. My location: https://maps.google.com/?q=${location.coords.latitude},${location.coords.longitude}`;

      const isAvailable = await SMS.isAvailableAsync();
      if (isAvailable) {
        await SMS.sendSMSAsync(trustedNumbers, message);
        Alert.alert("SOS Sent", "Trusted contacts have been notified with your location!");
      } else {
        Alert.alert("SMS Not Available", "Cannot send message on this device.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to send SOS. Please check permissions.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AYA SOS</Text>
      <Text style={styles.instruction}>
        Detects falls automatically and sends your location to trusted contacts. Press the button for manual SOS.
      </Text>

      <TouchableOpacity style={styles.sosButton} onPress={startCountdown}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setSettingsModalVisible(true)}
      >
        <Text style={styles.settingsText}>Settings</Text>
      </TouchableOpacity>

      <Modal visible={alertActive} transparent animationType="fade">
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownText}>{countdown}</Text>
          <Text style={styles.countdownSubText}>Sending SOS in...</Text>
          <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        visible={settingsModalVisible}
        animationType="slide"
        onRequestClose={() => setSettingsModalVisible(false)}
      >
        <View style={styles.settingsModal}>
          <Text style={styles.modalTitle}>Trusted Contacts</Text>
          <FlatList
            data={trustedNumbers}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <View style={styles.numberItem}>
                <Text>{item}</Text>
                <Button title="Remove" color="#E91E63" onPress={() => removeNumber(item)} />
              </View>
            )}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter phone number (e.g., +1234567890)"
            value={newNumber}
            onChangeText={setNewNumber}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.addButton} onPress={addNumber}>
            <Text style={styles.addText}>Add Number</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSettingsModalVisible(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8", // Softer background
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#E91E63",
    marginBottom: 20,
  },
  instruction: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
    paddingHorizontal: 20,
  },
  sosButton: {
    backgroundColor: "#E91E63",
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E91E63",
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 24,
    elevation: 12,
  },
  sosText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  settingsButton: {
    marginTop: 40,
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 8,
  },
  settingsText: {
    fontSize: 16,
    color: "#333",
  },
  countdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  countdownText: {
    fontSize: 100,
    color: "#fff",
    fontWeight: "bold",
  },
  countdownSubText: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 30,
  },
  cancelButton: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 200,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#E91E63",
  },
  settingsModal: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  numberItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: "#E91E63",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  addText: {
    color: "#fff",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#ddd",
    borderRadius: 8,
    alignItems: "center",
  },
  closeText: {
    fontWeight: "bold",
  },
});