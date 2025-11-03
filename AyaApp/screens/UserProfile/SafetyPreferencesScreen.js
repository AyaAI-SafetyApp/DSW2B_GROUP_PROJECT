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
        <IconComponent name={iconName} size={24} color="#FF1493" />
        <View style={styles.preferenceText}>
          <Text style={styles.preferenceTitle}>{title}</Text>
          <Text style={styles.preferenceDescription}>{desc}</Text>
        </View>
      </View>
      <Switch
        value={preferences[key]}
        onValueChange={() => togglePreference(key)}
        trackColor={{ false: "#D3D3D3", true: "#FFB6D9" }}
        thumbColor={preferences[key] ? "#FF1493" : "#f4f3f4"}
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
          icon: "warning",
          lib: MaterialIcons,
        },
        {
          key: "panicMode",
          title: "Panic Mode",
          desc: "Quick access to emergency services",
          icon: "alert-circle-outline",
          lib: Ionicons,
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
          icon: "notifications-outline",
          lib: Ionicons,
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
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
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
          <Ionicons name="information-circle-outline" size={24} color="#FF1493" />
          <Text style={styles.infoText}>
            Adjust your safety preferences. Enable only the features you need
            for a safe and personalised experience.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF1493",
  },
  content: { flex: 1 },
  section: {
    backgroundColor: "#FFFFFF",
    marginTop: 15,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
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
    borderBottomColor: "#F5F5F5",
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
  preferenceDescription: { fontSize: 13, color: "#999" },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FFF0F8",
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FFB6D9",
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});
