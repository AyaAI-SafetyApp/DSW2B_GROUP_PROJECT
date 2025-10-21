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
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabaseAuth } from "../lib/supabaseClient";

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
  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const navigation = useNavigation();

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentLocation("Permission denied");
        fetchSafetyData("Johannesburg");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);
      const city = address[0]?.city || address[0]?.region || "Unknown";
      setCurrentLocation(city);

      fetchSafetyDataByLocation(
        loc.coords.latitude,
        loc.coords.longitude,
        city
      );
    } catch (error) {
      console.error("Error fetching location:", error);
      fetchSafetyData("Johannesburg");
    }
  };

  const fetchSafetyDataByLocation = async (lat, lon, fallbackCity) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/safety-status/location/${lat}/${lon}`
      );
      const data = await response.json();

      if (response.ok) {
        updateSafetyState(data);
      } else {
        fetchSafetyData(fallbackCity);
      }
    } catch {
      fetchSafetyData(fallbackCity);
    }
  };

  const fetchSafetyData = async (area = "Johannesburg") => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/safety-status/${area}`);
      const data = await response.json();
      if (response.ok) updateSafetyState(data);
      else animateDefault();
    } catch {
      animateDefault();
    }
  };

  const updateSafetyState = (data) => {
    setSafetyData(data);
    const danger = data.Danger_Percentage || data.safetyStatus || 65;
    Animated.timing(animatedValue, {
      toValue: danger,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) =>
      setCrimeProbability(Math.round(value))
    );
    return () => animatedValue.removeListener(listener);
  };

  const animateDefault = () => {
    Animated.timing(animatedValue, {
      toValue: 65,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  };

  const getRiskColor = () => {
    if (crimeProbability < 40) return "#34C759";
    if (crimeProbability < 70) return "#FF9500";
    return "#FF3B30";
  };

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              // Sign out from Supabase
              await supabaseAuth.signOut();
              
              // Clear any stored data
              await AsyncStorage.removeItem("userSession");
              await AsyncStorage.removeItem("userID");
              await AsyncStorage.removeItem("profilePic");
              
              // Navigate to CreateCredential (login/signup) screen
              navigation.reset({
                index: 0,
                routes: [{ name: "CreateCredential" }],
              });
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Header riskColor={getRiskColor()} onLogout={handleLogout} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <LocationBanner location={currentLocation} safetyData={safetyData} />
        <RiskCard crimeProbability={crimeProbability} safetyData={safetyData} />
        <QuickActions />
        <NewsFeed />
      </ScrollView>
    </SafeAreaView>
  );
};

/* ------------------------- HEADER ------------------------- */
const Header = ({ riskColor, onLogout }) => (
  <View style={styles.header}>
    <View style={styles.headerLeft}>
      <Image
        source={require("../assets/Logos/Aya_AI_Logo.png")}
        style={styles.logoImage}
      />
      <View style={[styles.statusDot, { backgroundColor: riskColor }]} />
    </View>
    <View style={styles.headerRight}>
      <TouchableOpacity style={styles.headerButton}>
        <Ionicons name="notifications-outline" size={24} color="#1C2526" />
        <View style={styles.notificationBadge} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerButton}>
        <View style={styles.profilePicture}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  </View>
);

/* ------------------------- LOCATION BANNER ------------------------- */
const LocationBanner = ({ location, safetyData }) => (
  <View style={styles.locationBanner}>
    <Ionicons name="location-outline" size={16} color={PRIMARY} />
    <View style={styles.locationContent}>
      <Text style={styles.locationText}>{location}</Text>
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
);

/* ------------------------- RISK CARD ------------------------- */
const RiskCard = ({ crimeProbability, safetyData }) => {
  const size = 110;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (circumference * crimeProbability) / 100;

  const getRiskColor = () => {
    if (crimeProbability < 40) return "#34C759";
    if (crimeProbability < 70) return "#FF9500";
    return "#FF3B30";
  };

  const getRiskText = () => {
    if (crimeProbability < 40) return "Low Risk";
    if (crimeProbability < 70) return "Moderate Risk";
    return "High Risk";
  };

  const getSafetyTip = () => {
    if (safetyData?.safetyTips?.length > 0) return safetyData.safetyTips[0];
    return "AI suggests caution in your area. Avoid isolated areas after 10 PM.";
  };

  return (
    <View style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <Ionicons name="shield-outline" size={20} color={PRIMARY} />
        <Text style={styles.riskTitle}>Safety Status</Text>
      </View>
      <View style={styles.riskContent}>
        <View style={styles.progressSection}>
          <Svg width={size} height={size}>
            <Circle
              stroke="#F2F2F7"
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
            />
            <Circle
              stroke={getRiskColor()}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={strokeWidth}
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View style={styles.progressCenter}>
            <Text style={[styles.percentageText, { color: getRiskColor() }]}>
              {crimeProbability}%
            </Text>
            <Text style={styles.riskLabel}>{getRiskText()}</Text>
          </View>
        </View>
        <Text style={styles.riskDescription}>{getSafetyTip()}</Text>
      </View>
    </View>
  );
};

/* ------------------------- QUICK ACTIONS ------------------------- */
const QuickActions = () => {
  const navigation = useNavigation();
  const actions = [
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
  ];

  return (
    <View style={styles.quickActions}>
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          style={styles.quickActionItem}
          onPress={() => navigation.navigate(a.route)}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: a.color }]}>
            <Ionicons name={a.icon} size={22} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>{a.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

/* ------------------------- NEWS FEED ------------------------- */
const NewsFeed = () => {
  const navigation = useNavigation();

  const getPriorityColor = (priority) => {
    if (priority === "high") return "#FF3B30";
    if (priority === "medium") return "#FF9500";
    if (priority === "low") return "#34C759";
    return "#D1D5DB";
  };

  return (
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
              { backgroundColor: getPriorityColor(item.priority) },
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
  );
};

/* ------------------------- STYLES ------------------------- */
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
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 44, height: 44, resizeMode: "contain" },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginLeft: 8 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerButton: { marginLeft: 16, position: "relative" },
  notificationBadge: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  profilePicture: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButton: {
    marginLeft: 16,
    padding: 4,
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
  locationContent: { flex: 1, marginLeft: 8 },
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
  moreButton: { color: PRIMARY, fontWeight: "600", fontSize: 14 },
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