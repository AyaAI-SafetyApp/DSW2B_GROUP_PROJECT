
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
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const PRIMARY = "#D81B60";

const LOCAL_IP = "192.168.101.106"; // Your machine's IP
const API_BASE_URL =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:3001` // For Android emulator or device
    : `http://localhost:3001`;  // For iOS simulator or web

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
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchLocation();
  }, []);

  // Updated fetchLocation to use API for safety data
  const fetchLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentLocation("Permission denied");
        // Fallback to default location with API call
        fetchSafetyData("Johannesburg");
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);
      const city = address[0]?.city || address[0]?.region || "Unknown";
      
      setCurrentLocation(city);
      setUserCoordinates({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      // Fetch safety data using GPS coordinates
      fetchSafetyDataByLocation(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error("Error fetching location:", error);
      setCurrentLocation("Error fetching location");
      // Fallback with API call
      fetchSafetyData("Johannesburg");
    }
  };

  // Fetch safety data by GPS coordinates
  const fetchSafetyDataByLocation = async (latitude, longitude) => {
    try {
      console.log(`Fetching safety data for coordinates: ${latitude}, ${longitude}`);
      const response = await fetch(`${API_BASE_URL}/api/safety-status/location/${latitude}/${longitude}`);
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (response.ok) {
        setSafetyData(data);
        
        // Use Danger_Percentage if available, otherwise fallback to safetyStatus
        const dangerPercentage = data.Danger_Percentage || data.safetyStatus || 65;
        console.log("Using danger percentage:", dangerPercentage);
        
        // Animate to the new crime probability
        Animated.timing(animatedValue, {
          toValue: dangerPercentage,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value }) => {
          setCrimeProbability(Math.round(value));
        });

        return () => animatedValue.removeListener(listener);
      } else {
        console.error("API Error:", data.error);
        // Fallback to name-based lookup
        fetchSafetyData(currentLocation);
      }
    } catch (error) {
      console.error("Error fetching location-based safety data:", error);
      // Fallback to name-based lookup
      fetchSafetyData(currentLocation);
    } finally {
      setLoading(false);
    }
  };

  // Fallback safety data fetch by area name
  const fetchSafetyData = async (area = "Johannesburg") => {
    try {
      console.log(`Fetching safety data for area: ${area}`);
      const response = await fetch(`${API_BASE_URL}/api/safety-status/${area}`);
      const data = await response.json();
      
      console.log("API Response:", data);
      
      if (response.ok) {
        setSafetyData(data);
        
        // Use Danger_Percentage if available, otherwise fallback to safetyStatus
        const dangerPercentage = data.Danger_Percentage || data.safetyStatus || 65;
        console.log("Using danger percentage:", dangerPercentage);
        
        // Animate to the new crime probability
        Animated.timing(animatedValue, {
          toValue: dangerPercentage,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value }) => {
          setCrimeProbability(Math.round(value));
        });

        return () => animatedValue.removeListener(listener);
      } else {
        console.error("API Error:", data.error);
        // Use default animation for visual consistency
        animateToDefault();
      }
    } catch (error) {
      console.error("Error fetching safety data:", error);
      // Use default animation for visual consistency
      animateToDefault();
    } finally {
      setLoading(false);
    }
  };

  // Default animation when API fails
  const animateToDefault = () => {
    const targetProbability = 65; // Default value from your original code
    
    Animated.timing(animatedValue, {
      toValue: targetProbability,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setCrimeProbability(Math.round(value));
    });

    return () => animatedValue.removeListener(listener);
  };

  // Initialize default animation on mount (for visual consistency)
  useEffect(() => {
    const targetProbability = 65; // Your original default

    Animated.timing(animatedValue, {
      toValue: targetProbability,
      duration: 2000,
      useNativeDriver: false,
    }).start();

    const listener = animatedValue.addListener(({ value }) => {
      setCrimeProbability(Math.round(value));
    });

    return () => animatedValue.removeListener(listener);
  }, [animatedValue]);

  const getRiskColor = () => {
    if (crimeProbability < 40) return "#34C759";
    if (crimeProbability < 70) return "#FF9500";
    return "#FF3B30";
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Header riskColor={getRiskColor()} />
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
const Header = ({ riskColor }) => (
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
    </View>
  </View>
);

const LocationBanner = ({ location, safetyData }) => (
  <View style={styles.locationBanner}>
    <Ionicons name="location-outline" size={16} color={PRIMARY} />
    <View style={styles.locationContent}>
      <Text style={styles.locationText}>{location}</Text>
      {safetyData?.closestStation && (
        <Text style={styles.nearestStationText}>
          Nearest: {safetyData.closestStation.name} ({safetyData.closestStation.distance}km)
        </Text>
      )}
    </View>
    <View style={styles.liveIndicator}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  </View>
);

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

  // Use safety tips from API or fallback to default message
  const getSafetyTip = () => {
    if (safetyData?.safetyTips && safetyData.safetyTips.length > 0) {
      return safetyData.safetyTips[0];
    }
    return "AI suggests caution in your area. Avoid isolated areas after 10 PM.";
  };

  return (
    <View style={styles.riskCard}>
      <View style={styles.riskHeader}>
        <View style={styles.riskTitleContainer}>
          <Ionicons name="shield-outline" size={20} color={PRIMARY} />
          <Text style={styles.riskTitle}>Safety Status</Text>
        </View>
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
        <View style={styles.riskDetails}>
          <Text style={styles.riskDescription}>
            {getSafetyTip()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    {
      icon: "navigate-outline",
      color: PRIMARY,
      text: "Safe Route",
      onPress: () => navigation.navigate("MapViewScreen"),
    },
    {
      icon: "call-outline",
      color: "#e1170cff",
      text: "Emergency",
      onPress: () => navigation.navigate("EmergencyScreen"),
    },
    {
      icon: "medkit-outline",
      color: "#34C759",
      text: "Medical",
      onPress: () => navigation.navigate("Health"),
    },
  ];

  return (
    <View style={styles.quickActions}>
      {actions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickActionItem}
          onPress={action.onPress}
        >
          <View
            style={[styles.quickActionIcon, { backgroundColor: action.color }]}
          >
            <Ionicons name={action.icon} size={22} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>{action.text}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const NewsFeed = () => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#FF3B30";
      case "medium":
        return "#FF9500";
      case "low":
        return "#34C759";
      default:
        return "#D1D5DB";
    }
  };

  return (
    <View style={styles.newsSection}>
      <View style={styles.newsSectionHeader}>
        <Ionicons name="newspaper-outline" size={20} color={PRIMARY} />
        <Text style={styles.sectionTitle}>Last Updates</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
  scrollView: { flex: 1 },

  /* ------------------------- Header ------------------------- */
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

  /* ------------------------- Location Banner ------------------------- */
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB", // subtle soft background
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24, // nice pill shape
  },
  locationContent: {
    flex: 1, // allow content to take available space
    marginLeft: 8,
  },
  locationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827", // darker, cleaner text
  },
  nearestStationText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280", // subtle gray
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  liveText: {
    fontSize: 13,
    color: "#6B7280", // slightly lighter gray for subtlety
    fontWeight: "500",
  },

  /* ------------------------- Risk Card ------------------------- */
  riskCard: {
    backgroundColor: "#F9FAFB", // subtle off-white for clean look
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    padding: 24,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  riskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827", // darker, sharper
    marginLeft: 8,
  },
  riskContent: {
    flexDirection: "column",
    alignItems: "center",
  },
  progressSection: {
    position: "relative",
    marginBottom: 24,
  },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: {
    fontSize: 28,
    fontWeight: "800",
    color: PRIMARY,
  },
  riskLabel: {
    fontSize: 14,
    color: "#6B7280", // subtle gray for secondary info
    fontWeight: "500",
    marginTop: 6,
  },
  riskDetails: {
    width: "100%",
  },
  riskDescription: {
    fontSize: 15,
    color: "#4B5563", // slightly darker for readability
    lineHeight: 24,
    marginBottom: 16,
    textAlign: "center",
  },

  /* ------------------------- Quick Actions ------------------------- */
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

  /* ------------------------- News Section ------------------------- */
  newsSection: { paddingHorizontal: 20, marginTop: 28, marginBottom: 32 },
  newsSectionHeader: {
    flexDirection: "row",
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
    lineHeight: 20,
  },
  newsMeta: { flexDirection: "row", alignItems: "center" },
  newsSource: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  newsTime: { fontSize: 13, color: "#8E8E93", marginLeft: 8 },
});

export default HomeScreen;


