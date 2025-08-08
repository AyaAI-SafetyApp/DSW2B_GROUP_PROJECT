import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen() {
  const safetyScore = 72;
  const currentLocation = "Johannesburg CBD";
  const recentAlerts = 3;

  const getSafetyColor = (score) => {
    if (score >= 70) return "#22c55e";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Logo</Text>
          </View>
          <View style={styles.nearbyContainer}>
            <Ionicons name="eye-outline" size={16} color="#6b7280" />
            <Text style={styles.nearbyText}>1,247 nearby</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.locationText}>{currentLocation}</Text>
          </View>
          <View
            style={[
              styles.safetyCircle,
              { backgroundColor: getSafetyColor(safetyScore) },
            ]}
          >
            <Ionicons name="shield-outline" size={32} color="white" />
          </View>
          <View style={styles.safetyInfo}>
            <Text style={styles.safetyScore}>{safetyScore}% Safe</Text>
            <Text style={styles.subtext}>Real-time reports & AI analysis</Text>
            <Text style={styles.subtext}>
              {recentAlerts > 0
                ? `${recentAlerts} incidents in 24h`
                : "No incidents nearby"}
            </Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.buttonDark}>
            <Ionicons name="map-outline" size={20} color="white" />
            <Text style={styles.buttonText}>Safe Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buttonPink}
            onPress={() => Alert.alert("🚨 Emergency team notified!")}
          >
            <Ionicons name="alert" size={20} color="white" />
            <Text style={styles.buttonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  logoPlaceholder: {
    width: 100,
    height: 40,
    backgroundColor: "#ddd",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#888",
    fontWeight: "700",
  },
  nearbyContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  nearbyText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  card: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#4b5563",
    marginLeft: 6,
  },
  safetyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  safetyInfo: {
    alignItems: "center",
  },
  safetyScore: {
    fontSize: 24,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  subtext: {
    fontSize: 12,
    color: "#6b7280",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonDark: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginRight: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buttonPink: {
    flex: 1,
    backgroundColor: "#e11d48",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginLeft: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  buttonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
});
