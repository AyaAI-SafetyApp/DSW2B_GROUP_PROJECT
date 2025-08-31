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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollView: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 0 : 44,
    paddingBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  logoImage: { width: 40, height: 40, resizeMode: "contain" },
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0.4,
    borderColor: "#E5E7EB",
  },
  locationText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C2526",
    marginHorizontal: 8,
  },
  liveIndicator: { flexDirection: "row", alignItems: "center" },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#34C759",
    marginRight: 6,
  },
  liveText: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  riskCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    padding: 20,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    elevation: 3,
  },
  riskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  riskTitleContainer: { flexDirection: "row", alignItems: "center" },
  riskTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C2526",
    marginLeft: 8,
  },
  riskContent: { flexDirection: "column", alignItems: "center" },
  progressSection: { position: "relative", marginBottom: 20 },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  percentageText: { fontSize: 22, fontWeight: "700" },
  riskLabel: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "500",
    marginTop: 4,
  },
  riskDetails: { width: "100%" },
  riskDescription: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 22,
    marginBottom: 12,
    textAlign: "center",
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 24,
    justifyContent: "space-between",
  },
  quickActionItem: { alignItems: "center", flex: 1 },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "center",
  },
  newsSection: { paddingHorizontal: 16, marginTop: 24, marginBottom: 30 },
  newsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1C2526",
    marginLeft: 8,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    elevation: 2,
  },
  newsIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 12 },
  newsLogo: { width: 24, height: 24, marginRight: 8, borderRadius: 4 },
  newsContent: { flex: 1 },
  newsTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1C2526",
    marginBottom: 4,
    lineHeight: 20,
  },
  newsMeta: { flexDirection: "row", alignItems: "center" },
  newsSource: { fontSize: 13, color: "#8E8E93", fontWeight: "500" },
  newsTime: { fontSize: 13, color: "#8E8E93", marginLeft: 8 },
});

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

const LocationBanner = ({ location }) => (
  <View style={styles.locationBanner}>
    <Ionicons name="location-outline" size={16} color={PRIMARY} />
    <Text style={styles.locationText}>{location}</Text>
    <View style={styles.liveIndicator}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>Live</Text>
    </View>
  </View>
);

const RiskCard = ({ crimeProbability }) => {
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
            AI suggests caution in your area. Avoid isolated areas after 10 PM.
          </Text>
        </View>
      </View>
    </View>
  );
};

const QuickActions = () => {
  const navigation = useNavigation();

  const actions = [
    { icon: "navigate-outline", color: PRIMARY, text: "Safe Route" },
    {
      icon: "call-outline",
      color: "#e1170cff",
      text: "Emergency",
      onPress: () => navigation.navigate("EmergancyScreen"),
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

const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [crimeProbability, setCrimeProbability] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const targetProbability = 65;

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setCurrentLocation("Permission denied");
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        const address = await Location.reverseGeocodeAsync(loc.coords);
        setCurrentLocation(address[0]?.city || address[0]?.region || "Unknown");
      } catch (error) {
        console.error("Error fetching location:", error);
        setCurrentLocation("Error fetching location");
      }
    };
    fetchLocation();
  }, []);

  useEffect(() => {
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
      >
        <LocationBanner location={currentLocation} />
        <RiskCard crimeProbability={crimeProbability} />
        <QuickActions />
        <NewsFeed />
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
