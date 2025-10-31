import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SafetyPreferencesScreen({ navigation }) {
  const [preferences, setPreferences] = useState({
    autoSOS: false,
    locationSharing: true,
    emergencyAlerts: true,
    safeZoneAlerts: false,
    panicMode: true,
    voiceActivation: false,
    silentMode: false,
    shakeToAlert: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@safety_preferences");
        if (saved) setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    })();
  }, []);

  const togglePreference = async (key) => {
    try {
      const updated = { ...preferences, [key]: !preferences[key] };
      setPreferences(updated);
      await AsyncStorage.setItem(
        "@safety_preferences",
        JSON.stringify(updated)
      );
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to save preference");
    }
  };

  const renderItem = (title, desc, key, IconComponent, iconName) => (
    <View style={styles.preferenceItem} key={key}>
      <View style={styles.preferenceLeft}>
        <IconComponent name={iconName} size={24} color="#6e6e6e" />
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceDescription}>{desc}</Text>
        </View>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={() => togglePreference(key)}
        trackColor={{ false: "#ccc", true: "#888" }}
        thumbColor={preferences[key] ? "#444" : "#f4f3f4"}
      />
    </View>
  );

  const sections = [
    {
      title: "Emergency Features",
      items: [
        {
          key: "autoSOS",
          title: "Auto SOS",
          desc: "Automatically send SOS after 3 shakes",
          icon: "error-outline",
          lib: Ionicons,
        },
        {
          key: "panicMode",
          title: "Panic Mode",
          desc: "Quick access to emergency services",
          icon: "warning",
          lib: MaterialIcons,
        },
        {
          key: "shakeToAlert",
          title: "Shake to Alert",
          desc: "Shake phone to trigger emergency alert",
          icon: "phone-portrait-outline",
          lib: Ionicons,
        },
        {
          key: "voiceActivation",
          title: "Voice Activation",
          desc: "Use voice commands for SOS",
          icon: "mic-outline",
          lib: Ionicons,
        },
      ],
    },
    {
      title: "Location & Tracking",
      items: [
        {
          key: "locationSharing",
          title: "Location Sharing",
          desc: "Share your location with emergency contacts",
          icon: "location-outline",
          lib: Ionicons,
        },
        {
          key: "safeZoneAlerts",
          title: "Safe Zone Alerts",
          desc: "Get notified when entering/leaving safe zones",
          icon: "shield-outline",
          lib: Ionicons,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          key: "emergencyAlerts",
          title: "Emergency Alerts",
          desc: "Receive safety alerts in your area",
          icon: "notifications-none",
          lib: MaterialIcons,
        },
        {
          key: "silentMode",
          title: "Silent Mode",
          desc: "Disable sound for discrete alerts",
          icon: "volume-off",
          lib: MaterialIcons,
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View style={styles.section} key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) =>
              renderItem(item.title, item.desc, item.key, item.lib, item.icon)
            )}
          </View>
        ))}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color="#6e6e6e"
          />
          <Text style={styles.infoText}>
            Adjust your safety preferences. Enable only the features you need
            for a clean and secure experience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#222" },
  content: { flex: 1 },
  section: { backgroundColor: "#fff", marginTop: 15, paddingVertical: 10 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
    marginHorizontal: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 15,
  },
  preferenceText: { marginLeft: 15, flex: 1 },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 3,
  },
  preferenceDescription: { fontSize: 13, color: "#777" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    margin: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
});
