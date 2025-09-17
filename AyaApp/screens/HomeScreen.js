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

const { width } = Dimensions.get("window");
const PRIMARY = "#D81B60";



const LOCAL_IP = "192.168.101.106"; // Your machine's IP
const API_BASE_URL =
  Platform.OS === "android"
    ? `http://${LOCAL_IP}:3001` // For Android emulator or device
    : `http://localhost:3001`;  // For iOS simulator or web




const HomeScreen = () => {
  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [userCoordinates, setUserCoordinates] = useState(null);
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUserLocation();
    fetchNewsData();
  }, []);

  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setCurrentLocation("Permission denied");
        // Fallback to default location (Johannesburg)
        fetchSafetyData();
        return;
      }
      
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const address = await Location.reverseGeocodeAsync(loc.coords);
      const city = address[0]?.city || address[0]?.region || "Johannesburg";
      
      setCurrentLocation(city);
      setUserCoordinates({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      
      // Fetch safety data using GPS coordinates
      fetchSafetyDataByLocation(loc.coords.latitude, loc.coords.longitude);
    } catch (error) {
      console.error("Error fetching location:", error);
      setCurrentLocation("Johannesburg");
      // Fallback to name-based lookup
      fetchSafetyData("Johannesburg");
    }
  };

  const fetchSafetyDataByLocation = async (latitude, longitude) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/safety-status/location/${latitude}/${longitude}`);
      const data = await response.json();
      
      if (response.ok) {
        setSafetyData(data);
        
        // Animate to the new crime probability
        Animated.timing(animatedValue, {
          toValue: data.safetyStatus,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value }) => {
          setCrimeProbability(Math.round(value));
        });

        return () => animatedValue.removeListener(listener);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch safety data");
        // Fallback to name-based lookup
        fetchSafetyData();
      }
    } catch (error) {
      console.error("Error fetching location-based safety data:", error);
      // Fallback to name-based lookup
      fetchSafetyData();
    } finally {
      setLoading(false);
    }
  };

  const fetchSafetyData = async (area = "Johannesburg") => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/safety-status/${area}`);
      const data = await response.json();
      
      if (response.ok) {
        setSafetyData(data);
        
        // Animate to the new crime probability
        Animated.timing(animatedValue, {
          toValue: data.safetyStatus,
          duration: 2000,
          useNativeDriver: false,
        }).start();

        const listener = animatedValue.addListener(({ value }) => {
          setCrimeProbability(Math.round(value));
        });

        return () => animatedValue.removeListener(listener);
      } else {
        Alert.alert("Error", data.error || "Failed to fetch safety data");
      }
    } catch (error) {
      console.error("Error fetching safety data:", error);
      Alert.alert("Error", "Could not connect to safety service");
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/news-feed`);
      const data = await response.json();
      setNewsData(data);
    } catch (error) {
      console.error("Error fetching news:", error);
      // Fallback to local news data if API fails
      setNewsData([
        {
          id: "1",
          title: "New AI safety tools launched",
          source: "News 24",
          time: "4h",
          priority: "medium",
          logoUri: "https://journalism.co.za/wp-content/uploads/2019/01/news24-300x300.png",
        },
        {
          id: "2",
          title: "Woman just got saved by AyaAI app",
          source: "Daily Sun",
          time: "30m",
          priority: "high",
          logoUri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR3fhRGgdLERXOyD2nTXHErfs0RZgC86YMRsg&s",
        },
      ]);
    }
  };

  const getRiskColor = () => {
    if (crimeProbability < 40) return "#34C759";
    if (crimeProbability < 70) return "#FF9500";
    return "#FF3B30";
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading safety data...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <LocationBanner location={currentLocation} />
        <RiskCard 
          crimeProbability={crimeProbability} 
          safetyTips={safetyData?.safetyTips}
          safetyData={safetyData}
        />
        <QuickActions />
        <NewsFeed newsData={newsData} />
      </ScrollView>
    </SafeAreaView>
  );
};

// Updated RiskCard to use dynamic safety tips
const RiskCard = ({ crimeProbability, safetyTips, safetyData }) => {
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
        {safetyData?.closestStation && (
          <Text style={styles.stationInfo}>
            Nearest: {safetyData.closestStation.name} ({safetyData.closestStation.distance}km)
          </Text>
        )}
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
            {safetyTips?.[0] || "Stay alert and follow safety guidelines."}
          </Text>
          {safetyData?.statistics?.nearbyStations && safetyData.statistics.nearbyStations.length > 1 && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.nearbyStationsTitle}>Nearby Stations:</Text>
              {safetyData.statistics.nearbyStations.slice(0, 2).map((station, index) => (
                <Text key={index} style={styles.stationDetail}>
                  • {station.name} - {station.distance}km ({station.dangerLevel})
                </Text>
              ))}
            </View>
          )}
          {safetyTips && safetyTips.length > 1 && (
            <View style={{ marginTop: 8 }}>
              {safetyTips.slice(1, 3).map((tip, index) => (
                <Text key={index} style={[styles.riskDescription, { fontSize: 14 }]}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Updated NewsFeed to use fetched data
const NewsFeed = ({ newsData }) => {
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

// Header component
const Header = ({ riskColor }) => (
  <View style={styles.header}>
    <Text style={styles.headerTitle}>AyaAI Safety</Text>
    <View style={[styles.statusIndicator, { backgroundColor: riskColor }]} />
  </View>
);

// LocationBanner component
const LocationBanner = ({ location }) => (
  <View style={styles.locationBanner}>
    <Ionicons name="location-outline" size={20} color={PRIMARY} />
    <Text style={styles.locationText}>{location}</Text>
  </View>
);

// QuickActions component
const QuickActions = () => {
  const navigation = useNavigation();
  
  const actions = [
    { id: 1, title: "Emergency", icon: "call-outline", color: "#FF3B30", screen: "Emergency" },
    { id: 2, title: "Map View", icon: "map-outline", color: "#007AFF", screen: "MapView" },
    { id: 3, title: "Health", icon: "fitness-outline", color: "#34C759", screen: "Health" },
    { id: 4, title: "Profile", icon: "person-outline", color: "#FF9500", screen: "Profile" },
  ];

  return (
    <View style={styles.quickActions}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => navigation.navigate(action.screen)}
          >
            <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
              <Ionicons name={action.icon} size={24} color="white" />
            </View>
            <Text style={styles.actionTitle}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 0 : StatusBar.currentHeight,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1C1C1E",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  locationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F2F7",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  riskCard: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  riskHeader: {
    marginBottom: 20,
  },
  riskTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  riskTitle: {
    marginLeft: 8,
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
  },
  stationInfo: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
  },
  nearbyStationsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  stationDetail: {
    fontSize: 12,
    color: "#8E8E93",
    marginLeft: 8,
  },
  riskContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressSection: {
    position: "relative",
    marginRight: 20,
  },
  progressCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  percentageText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  riskLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  riskDetails: {
    flex: 1,
  },
  riskDescription: {
    fontSize: 16,
    color: "#3C3C43",
    lineHeight: 22,
  },
  quickActions: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 16,
    marginLeft: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1C1C1E",
    textAlign: "center",
  },
  newsSection: {
    marginHorizontal: 20,
  },
  newsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  newsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  newsIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  newsLogo: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1C1C1E",
    marginBottom: 4,
  },
  newsMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  newsSource: {
    fontSize: 14,
    color: "#8E8E93",
    marginRight: 8,
  },
  newsTime: {
    fontSize: 14,
    color: "#8E8E93",
  },
});

export default HomeScreen;