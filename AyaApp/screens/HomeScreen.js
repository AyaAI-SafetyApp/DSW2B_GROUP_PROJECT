import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Modal,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const PRIMARY = "#D81B60";
const API_BASE_URL = "https://dsw2b-backend.onrender.com";

const newsData = [
  {
    id: "2",
    title: "New AI safety tools launched",
    source: "News 24",
    time: "4h",
    priority: "medium",
    logoUri:
      "https://journalism.co.za/wp-content/uploads/2019/01/news24-300x300.png",
  },
  {
    id: "1",
    title: "Woman just got saved by AyaAI app",
    source: "Daily Sun",
    time: "30m",
    priority: "high",
    logoUri:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3fhRGgdLERXOyD2nTXHErfs0RZgC86YMRsg&s",
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const [notifications, setNotifications] = useState([
    "Welcome to AyaAI!",
    "New AI safety tools launched.",
    "Woman saved by AyaAI app.",
  ]);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setCurrentLocation("Permission denied");
          fetchSafetyData("Johannesburg");
          return;
        }

        // Get precise location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });

        // Reverse geocode
        const addresses = await Location.reverseGeocodeAsync(loc.coords);
        if (addresses.length > 0) {
          const city =
            addresses[0].city ||
            addresses[0].subregion ||
            addresses[0].region ||
            "Unknown";
          setCurrentLocation(city);
          fetchSafetyData(city);
        } else {
          setCurrentLocation("Unknown location");
          fetchSafetyData("Johannesburg");
        }
      } catch (err) {
        console.error("Location fetch error:", err);
        setCurrentLocation("Error fetching location");
        fetchSafetyData("Johannesburg");
      }
    };

    fetchLocation();
  }, []);

  // Animate crime probability
  useEffect(() => {
    const target = safetyData?.Danger_Percentage || 65;
    Animated.timing(animatedValue, {
      toValue: target,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) =>
      setCrimeProbability(Math.round(value))
    );
    return () => animatedValue.removeListener(listener);
  }, [safetyData]);

  const fetchSafetyData = async (area = "Johannesburg") => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/safety-status/${area}`);
      const data = await response.json();
      if (response.ok) setSafetyData(data);
    } catch {
      setSafetyData({ Danger_Percentage: 65, safetyTips: [] });
    }
  };

  const getRiskColor = () =>
    crimeProbability < 40
      ? "#34C759"
      : crimeProbability < 70
      ? "#FF9500"
      : "#FF3B30";

  const getRiskText = () =>
    crimeProbability < 40
      ? "Low Risk"
      : crimeProbability < 70
      ? "Moderate Risk"
      : "High Risk";

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../assets/Logos/Aya_AI_Logo.png")}
            style={styles.logoImage}
          />
          <View
            style={[styles.statusDot, { backgroundColor: getRiskColor() }]}
          />
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="notifications-outline" size={28} color="#1C2526" />

            {notifications.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <View style={styles.profilePicture}>
              <Ionicons name="person" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notifications</Text>
            {notifications.length === 0 && <Text>No notifications</Text>}
            {notifications.map((n, i) => (
              <Text key={i} style={styles.modalItem}>
                {n}
              </Text>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 100 }}
      >
        {/* Location Banner */}
        <View style={styles.locationBanner}>
          <Ionicons name="location-outline" size={16} color={PRIMARY} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.locationText}>{currentLocation}</Text>
            {safetyData?.closestStation && (
              <Text style={styles.nearestStationText}>
                Nearest: {safetyData.closestStation.name} (
                {safetyData.closestStation.distance}km)
              </Text>
            )}
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Risk Card */}
        <View style={styles.riskCard}>
          <View style={styles.riskHeader}>
            <Ionicons name="shield-outline" size={20} color={PRIMARY} />
            <Text style={styles.riskTitle}>Safety Status</Text>
          </View>
          <View style={styles.riskContent}>
            <View style={styles.progressSection}>
              <Svg width={110} height={110}>
                <Circle
                  stroke="#F2F2F7"
                  cx={55}
                  cy={55}
                  r={52}
                  strokeWidth={6}
                />
                <Circle
                  stroke={getRiskColor()}
                  cx={55}
                  cy={55}
                  r={52}
                  strokeWidth={6}
                  strokeDasharray={`${2 * Math.PI * 52} ${2 * Math.PI * 52}`}
                  strokeDashoffset={
                    (2 * Math.PI * 52 * (100 - crimeProbability)) / 100
                  }
                  strokeLinecap="round"
                  rotation="-90"
                  origin="55,55"
                />
              </Svg>
              <View style={styles.progressCenter}>
                <Text
                  style={[styles.percentageText, { color: getRiskColor() }]}
                >
                  {crimeProbability}%
                </Text>
                <Text style={styles.riskLabel}>{getRiskText()}</Text>
              </View>
            </View>
            <Text style={styles.riskDescription}>
              {safetyData?.safetyTips?.[0] ||
                "AI suggests caution in your area. Avoid isolated areas after 10 PM."}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {[
            {
              icon: "navigate-outline",
              color: PRIMARY,
              text: "Safe Route",
              route: "MapViewScreen",
            },
            {
              icon: "call-outline",
              color: "#e1170c",
              text: "Emergency",
              route: "EmergencyScreen",
            },
            {
              icon: "medkit-outline",
              color: "#34C759",
              text: "Medical",
              route: "Health",
            },
          ].map((a, i) => (
            <TouchableOpacity
              key={i}
              style={styles.quickActionItem}
              onPress={() => navigation.navigate(a.route)}
            >
              <View
                style={[styles.quickActionIcon, { backgroundColor: a.color }]}
              >
                <Ionicons name={a.icon} size={22} color="#fff" />
              </View>
              <Text style={styles.quickActionText}>{a.text}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* News Feed */}
        <View style={styles.newsSection}>
          <View style={styles.newsSectionHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons name="newspaper-outline" size={20} color={PRIMARY} />
              <Text style={styles.sectionTitle}>Last Updates</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("NewsFeed")}>
              <Text style={styles.moreButton}>More</Text>
            </TouchableOpacity>
          </View>

          {newsData.map((item) => (
            <TouchableOpacity key={item.id} style={styles.newsItem}>
              <View
                style={[
                  styles.newsIndicator,
                  {
                    backgroundColor:
                      item.priority === "high" ? "#FF3B30" : "#FF9500",
                  },
                ]}
              />
              <Image source={{ uri: item.logoUri }} style={styles.newsLogo} />
              <View style={styles.newsContent}>
                <Text style={styles.newsTitle}>{item.title}</Text>
                <View style={styles.newsMeta}>
                  <Text style={styles.newsSource}>{item.source}</Text>
                  <Text style={styles.newsTime}>{item.time}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 50 : 44,
    paddingBottom: 16,
    backgroundColor: "#fff",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 44, height: 44, resizeMode: "contain" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerButton: { marginLeft: 16, position: "relative" },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },

  profilePicture: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: width - 60,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  modalItem: { fontSize: 14, marginVertical: 4 },
  modalCloseButton: {
    backgroundColor: PRIMARY,
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },

  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
  },
  locationText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  nearestStationText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center" },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  liveText: { fontSize: 13, color: "#6B7280", fontWeight: "500" },

  riskCard: {
    backgroundColor: "#F9FAFB",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  riskTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginLeft: 8,
  },
  riskContent: { alignItems: "center" },
  progressSection: { position: "relative", marginBottom: 24 },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: { fontSize: 28, fontWeight: "800" },
  riskLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
    marginTop: 6,
  },
  riskDescription: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
    textAlign: "center",
  },

  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 28,
    justifyContent: "space-between",
  },
  quickActionItem: { alignItems: "center", flex: 1 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
    textAlign: "center",
  },

  newsSection: { paddingHorizontal: 20, marginTop: 28, marginBottom: 32 },
  newsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1C2526",
    marginLeft: 8,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  newsIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  newsLogo: { width: 28, height: 28, marginRight: 8, borderRadius: 6 },
  newsContent: { flex: 1 },
  newsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1C2526",
    marginBottom: 4,
  },
  newsMeta: { flexDirection: "row", alignItems: "center" },
  newsSource: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  newsTime: { fontSize: 13, color: "#8E8E93", marginLeft: 8 },
});

export default HomeScreen;
