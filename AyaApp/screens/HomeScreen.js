import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const tipsData = [
  "Stay alert in dimly lit areas.",
  "Trust your instincts and leave unsafe spots.",
  "Keep your phone charged and nearby.",
  "Avoid sharing your location publicly.",
];

const newsData = [
  { id: "1", title: "City safety improves this month", source: "News Agency" },
  { id: "2", title: "New AI safety tools launched", source: "Tech Daily" },
  { id: "3", title: "Tips for safe evening walks", source: "Daily Safety" },
];

export default function HomeScreen() {
  const [currentTip, setCurrentTip] = useState(0);
  const tipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(tipAnim, {
          toValue: -20,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(tipAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentTip((prev) => (prev + 1) % tipsData.length);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>Aya</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="person-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="more-vertical" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Location */}
      <View style={styles.locationCard}>
        <Ionicons name="location-outline" size={20} color="#000" />
        <Text style={styles.locationText}>Current Location: Johannesburg</Text>
      </View>

      {/* AI Crime Prediction */}
      <View style={styles.aiCard}>
        <Text style={styles.aiTitle}>Crime Prediction:</Text>
        <Text style={styles.aiModelData}>
          Moderate risk detected in your area. Avoid isolated streets between 10 PM – 6 AM.
        </Text>
        <Animated.Text
          style={[styles.aiTip, { transform: [{ translateY: tipAnim }] }]}
        >
          {tipsData[currentTip]}
        </Animated.Text>
      </View>

      {/* Safety Route Button */}
      <TouchableOpacity style={styles.routeButton}>
        <Text style={styles.routeButtonText}>Find Safe Route</Text>
      </TouchableOpacity>

      {/* Recent News */}
      <View style={styles.newsSection}>
        <Text style={styles.newsHeader}>Recent News</Text>
        <View style={styles.newsRow}>
          {newsData.map((item) => (
            <View key={item.id} style={styles.newsCard}>
              <Text style={styles.newsTitle}>{item.title}</Text>
              <Text style={styles.newsSource}>{item.source}</Text>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 16 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  logo: { fontSize: 28, fontWeight: "700", color: "#000" },
  headerIcons: { flexDirection: "row" },
  iconButton: { marginLeft: 16 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    marginBottom: 16,
  },
  locationText: { marginLeft: 8, fontSize: 16, color: "#000" },
  aiCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    minHeight: 100,
    justifyContent: "center",
  },
  aiTitle: { fontSize: 18, fontWeight: "600", marginBottom: 8, color: "#000" },
  aiModelData: { fontSize: 16, color: "#333", marginBottom: 8 },
  aiTip: { fontSize: 14, color: "#555" },
  routeButton: {
    backgroundColor: "#000",
    borderRadius: 30,
    paddingVertical: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  routeButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  newsSection: { marginBottom: 20 },
  newsHeader: { fontSize: 20, fontWeight: "700", marginBottom: 12, color: "#000" },
  newsRow: { flexDirection: "row", justifyContent: "space-between" },
  newsCard: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    padding: 12,
    width: (width - 64) / 3,
  },
  newsTitle: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: "#000" },
  newsSource: { fontSize: 12, color: "#555" },
});
