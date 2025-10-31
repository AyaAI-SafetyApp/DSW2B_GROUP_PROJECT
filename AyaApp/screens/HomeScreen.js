import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation, CommonActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { supabaseAuth } from "../lib/supabaseClient";
import { fetchNews } from "./GBVNews/newsService";
import NotificationModal from "../components/NotificationModal";
import {
  initializeAllNotificationServices,
  registerForPushNotifications,
  sendTokenToBackend,
  setupNotificationListeners,
  clearAllNotifications,
  getStoredNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
  saveNotification,
  storeLastKnownLocation,
  manualBackgroundTask,
  getBackgroundTaskStatus,
} from "../components/NotificationService";

const { width } = Dimensions.get("window");
export const PRIMARY = "#D81B60";
export const API_BASE_URL = "https://dsw2b-backend.onrender.com";
const FEATURES = {
  AI_SAFE_ROUTES: "AI_SAFE_ROUTES",
  EMERGENCY_SOS: "EMERGENCY_SOS",
  HEALTH_MONITORING: "HEALTH_MONITORING",
};

// ==================== ANIMATED COMPONENTS ====================
const FadeView = ({ children, delay = 0, style }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: fadeAnim }, style]}>
      {children}
    </Animated.View>
  );
};

// ==================== HEADER COMPONENT ====================
const Header = ({
  notificationsCount,
  onOpenNotifications,
  onProfilePress,
  riskColor,
}) => (
  <FadeView style={styles.header} delay={100}>
    <View style={styles.headerLeft}>
      <Image
        source={require("../assets/Logos/Aya_AI_Logo.png")}
        style={styles.logoImage}
        accessibilityIgnoresInvertColors
      />
    </View>
    <View style={styles.headerRight}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          Haptics.selectionAsync();
          onOpenNotifications();
        }}
        accessibilityLabel={`Open notifications. ${notificationsCount} unread`}
      >
        <Ionicons name="notifications-outline" size={28} color="#1C2526" />
        {notificationsCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>
              {notificationsCount > 99 ? "99+" : notificationsCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => {
          Haptics.selectionAsync();
          onProfilePress();
        }}
        accessibilityLabel="Open profile"
      >
        <View style={styles.profilePicture}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  </FadeView>
);

// ==================== RISK CARD COMPONENT ====================
const RiskCard = ({ crimeProbability, riskColor, riskLabel, safetyTip }) => (
  <FadeView style={styles.riskCard} delay={200}>
    <View style={styles.riskHeader}>
      <Ionicons name="shield-outline" size={20} color={PRIMARY} />
      <Text style={styles.riskTitle}>Safety Status</Text>
    </View>
    <View style={styles.riskContent}>
      <View style={styles.progressSection}>
        <Svg width={110} height={110} accessibilityLabel="Safety meter">
          <Circle stroke="#F2F2F7" cx={55} cy={55} r={52} strokeWidth={6} />
          <Circle
            stroke={riskColor}
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
          <Text style={[styles.percentageText, { color: riskColor }]}>
            {crimeProbability.toFixed(1)}%
          </Text>
          <Text style={styles.riskLabel}>{riskLabel}</Text>
        </View>
      </View>
      <Text style={styles.riskDescription}>{safetyTip}</Text>
    </View>
  </FadeView>
);

// ==================== QUICK ACTIONS COMPONENT ====================
const QuickActions = ({ navigation }) => {
  const actions = [
    {
      icon: "navigate-outline",
      color: PRIMARY,
      text: "Safe Route",
      route: "MapViewScreen",
      requiresFeature: FEATURES.AI_SAFE_ROUTES,
      isPremium: true,
    },
    {
      icon: "call-outline",
      color: "#e1170c",
      text: "Emergency",
      route: "EmergencyScreen",
      requiresFeature: FEATURES.EMERGENCY_SOS,
      isPremium: false,
    },
    {
      icon: "medkit-outline",
      color: "#34C759",
      text: "Medical",
      route: "Health",
      requiresFeature: FEATURES.HEALTH_MONITORING,
      isPremium: true,
    },
  ];

  const handleActionPress = async (action) => {
    // Implement feature access check
    Haptics.selectionAsync();
    navigation.navigate(action.route);
  };

  return (
    <FadeView style={styles.quickActions} delay={300}>
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          style={styles.quickActionItem}
          onPress={() => handleActionPress(a)}
          accessibilityLabel={a.text}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: a.color }]}>
            <Ionicons name={a.icon} size={22} color="#fff" />
            {a.isPremium && (
              <View style={styles.premiumBadge}>
                <Ionicons name="lock-closed" size={10} color="#FFD700" />
              </View>
            )}
          </View>
          <Text style={styles.quickActionText}>{a.text}</Text>
        </TouchableOpacity>
      ))}
    </FadeView>
  );
};

// ==================== NEWS FEED COMPONENT ====================
const NewsFeed = ({ data, onOpenNews, navigation }) => (
  <FadeView style={styles.newsSection} delay={400}>
    <View style={styles.newsSectionHeader}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Ionicons name="newspaper-outline" size={20} color={PRIMARY} />
        <Text style={styles.sectionTitle}>Last Updates</Text>
      </View>
      <TouchableOpacity
        onPress={onOpenNews}
        accessibilityLabel="Open news feed"
      >
        <Text style={styles.moreButton}>More</Text>
      </TouchableOpacity>
    </View>
    {data.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={styles.newsItem}
        accessibilityRole="button"
        onPress={() => navigation.navigate("ArticleScreen", { url: item.url })}
      >
        <View
          style={[
            styles.newsIndicator,
            {
              backgroundColor: item.priority === "high" ? "#FF3B30" : "#FF9500",
            },
          ]}
        />
        <Image
          source={{ uri: item.logoUri }}
          style={styles.newsLogo}
          accessibilityLabel={`${item.source} logo`}
        />
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
  </FadeView>
);

// ==================== DEBUG COMPONENT (Optional) ====================
const DebugNotificationButton = ({ onPress }) => (
  <TouchableOpacity
    style={styles.debugButton}
    onPress={onPress}
  >
    <Text style={styles.debugButtonText}>Test Notifications</Text>
  </TouchableOpacity>
);

// ==================== MAIN HOME SCREEN COMPONENT ====================
export default function HomeScreen() {
  const navigation = useNavigation();

  // ========== Location & Safety State ==========
  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const [loadingSafety, setLoadingSafety] = useState(true);
  const [showLottie, setShowLottie] = useState(true);
  const [currentCoords, setCurrentCoords] = useState(null);

  // ========== News State ==========
  const [newsArticles, setNewsArticles] = useState([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // ========== Notification State ==========
  const [notifications, setNotifications] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [backgroundTaskStatus, setBackgroundTaskStatus] = useState("Unknown");

  // ========== UI State ==========
  const [refreshing, setRefreshing] = useState(false);

  // ==================== NOTIFICATION MANAGEMENT ====================
  // Load notifications from storage
  const loadNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const stored = await getStoredNotifications();
      setNotifications(stored);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Handle new notification received
  const handleNotificationReceived = async (notification) => {
    console.log("📬 New notification received:", notification);
    await loadNotifications(); // Refresh the list
  };

  // Handle notification tapped
  const handleNotificationResponse = async (response) => {
    console.log("👆 Notification tapped:", response);
    await loadNotifications(); // Refresh to show read state
  };

  // Mark single notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      const updated = await markNotificationAsRead(notificationId);
      setNotifications(updated);
      const count = await getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const updated = await markAllNotificationsAsRead();
      setNotifications(updated);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      await clearAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // Open modal and refresh notifications
  const handleOpenNotifications = async () => {
    setModalVisible(true);
    await loadNotifications();
  };

  // Test background task manually
  const handleTestNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log("🧪 Testing background task...");
    
    const success = await manualBackgroundTask();
    if (success) {
      alert("Background task triggered successfully! Check notifications.");
    } else {
      alert("Background task not available. Make sure it's registered.");
    }
    
    // Update status
    const status = await getBackgroundTaskStatus();
    setBackgroundTaskStatus(status.status);
  };

  // ==================== INITIALIZE AUTOMATIC NOTIFICATION SYSTEM ====================
  useEffect(() => {
    let cleanupListeners;

    const initializeAllServices = async () => {
      try {
        console.log("🚀 Initializing all services...");

        // 1. Initialize automatic notification system (6-hour intervals)
        await initializeAllNotificationServices();

        // 2. Load initial notifications
        await loadNotifications();

        // 3. Setup notification listeners
        cleanupListeners = setupNotificationListeners(
          handleNotificationReceived,
          handleNotificationResponse
        );

        // 4. Check background task status
        const status = await getBackgroundTaskStatus();
        setBackgroundTaskStatus(status.status);
        console.log("📊 Background task status:", status);

        console.log("✅ All services initialized successfully");

      } catch (error) {
        console.error("❌ Error initializing services:", error);
      }
    };

    initializeAllServices();

    return () => {
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, []);

  // ==================== LOAD CACHED SAFETY DATA ====================
  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem("@safety_last");
        if (cached) setSafetyData(JSON.parse(cached));
      } catch {}
    })();
  }, []);

  // ==================== LOAD NEWS ARTICLES ====================
  useEffect(() => {
    loadNewsArticles();
  }, []);

  const loadNewsArticles = async () => {
    try {
      setLoadingNews(true);
      const articles = await fetchNews("");

      const formattedNews = articles.slice(0, 2).map((article, index) => {
        const timeAgo = getTimeAgo(article.published_at);
        const sourceName = article.source || "News Source";

        return {
          id: index.toString(),
          title: article.title || "Untitled",
          source: sourceName,
          time: timeAgo,
          priority: index < 2 ? "high" : "medium",
          logoUri: article.image || "https://via.placeholder.com/50",
          url: article.url,
        };
      });

      setNewsArticles(formattedNews);
    } catch (error) {
      console.error("Error loading news:", error);
      setNewsArticles([]);
    } finally {
      setLoadingNews(false);
    }
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Recently";

    const now = new Date();
    const published = new Date(dateString);
    const diffMs = now - published;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  // ==================== FETCH LOCATION & SAFETY DATA ====================
  useEffect(() => {
    let mounted = true;
    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setCurrentLocation("Permission denied");
          await fetchSafetyData("Johannesburg");
          setLoadingSafety(false);
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Highest,
        });
        
        // Store coordinates for location-based notifications
        setCurrentCoords(loc.coords);
        
        // Store last known location for automatic notifications
        await storeLastKnownLocation(loc.coords.latitude, loc.coords.longitude);
        
        const addresses = await Location.reverseGeocodeAsync(loc.coords);
        if (!mounted) return;
        const city =
          addresses[0]?.city ||
          addresses[0]?.subregion ||
          addresses[0]?.region ||
          "Unknown";
        setCurrentLocation(city);
        await fetchSafetyData(city, loc.coords.latitude, loc.coords.longitude);
      } catch {
        setCurrentLocation("Error fetching location");
        await fetchSafetyData("Johannesburg");
      } finally {
        if (mounted) setLoadingSafety(false);
      }
    };
    fetchLocation();
    return () => (mounted = false);
  }, []);

  // ==================== COMPUTE RISK INDICATORS ====================
  const riskColor = useMemo(
    () =>
      crimeProbability < 40
        ? "#34C759"
        : crimeProbability < 70
        ? "#FF9500"
        : "#FF3B30",
    [crimeProbability]
  );

  const riskLabel = useMemo(
    () =>
      crimeProbability < 40
        ? "Low Risk"
        : crimeProbability < 70
        ? "Moderate Risk"
        : "High Risk",
    [crimeProbability]
  );

  // ==================== UPDATE CRIME PROBABILITY ====================
  useEffect(() => {
    const target = safetyData?.Danger_Percentage ?? 65;
    setCrimeProbability(target);
  }, [safetyData, riskLabel]);

  // ==================== FETCH SAFETY DATA FROM API ====================
  const fetchSafetyData = useCallback(
    async (area = "Johannesburg", lat = null, lon = null) => {
      setLoadingSafety(true);
      setShowLottie(true);
      try {
        const endpoint =
          lat && lon
            ? `${API_BASE_URL}/api/safety-status/location/${lat}/${lon}`
            : `${API_BASE_URL}/api/safety-status/${encodeURIComponent(area)}`;

        const res = await fetch(endpoint);
        const data = res.ok
          ? await res.json()
          : {
              Danger_Percentage: 50,
              safetyTips: ["Data unavailable. Stay alert."],
            };
        setSafetyData(data);
        await AsyncStorage.setItem("@safety_last", JSON.stringify(data));
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        setSafetyData(
          (prev) =>
            prev || {
              Danger_Percentage: 65,
              safetyTips: ["Data unavailable. Stay alert."],
            }
        );
      } finally {
        setLoadingSafety(false);
        setTimeout(() => setShowLottie(false), 2000);
      }
    },
    []
  );

  // ==================== REFRESH HANDLER ====================
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      // Update stored location
      await storeLastKnownLocation(loc.coords.latitude, loc.coords.longitude);
      
      await fetchSafetyData(
        currentLocation,
        loc.coords.latitude,
        loc.coords.longitude
      );
      
      // Trigger background task to check for new alerts
      await manualBackgroundTask();
      
    } catch {
      await fetchSafetyData(currentLocation || "Johannesburg");
    }
    setRefreshing(false);
  }, [currentLocation]);

  // ==================== LOGOUT HANDLER ====================
  const handleLogout = useCallback(async () => {
    try {
      console.log("🚪 HomeScreen: Starting logout...");

      await supabaseAuth.signOut();
      console.log("✅ Supabase signout complete");

      await AsyncStorage.removeItem("userSession");
      await AsyncStorage.removeItem("userID");
      console.log("✅ AsyncStorage cleared");

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "OnboardingScreen" }],
        })
      );
      console.log("✅ Navigation reset to OnboardingScreen");
    } catch (error) {
      console.error("❌ Logout error:", error);
      alert("Logout failed. Please try again.");
    }
  }, [navigation]);

  // ==================== RENDER ====================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Header */}
      <Header
        notificationsCount={unreadCount}
        onOpenNotifications={handleOpenNotifications}
        onProfilePress={() => navigation.navigate("ProfileScreen")}
        riskColor={riskColor}
      />

      {/* Notification Modal */}
      <NotificationModal
        visible={modalVisible}
        notifications={notifications}
        loading={loadingNotifications}
        onClose={() => setModalVisible(false)}
        onClearAll={handleClearAll}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Location Banner */}
        <View style={styles.locationBanner}>
          <Ionicons name="location-outline" size={16} color={PRIMARY} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Text style={styles.locationText}>{currentLocation}</Text>
            {safetyData?.closestStation && (
              <Text style={styles.nearestStationText}>
                Nearest: {safetyData.closestStation.name} (
                {Math.round(safetyData.closestStation.distance * 10) / 10}km)
              </Text>
            )}
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        </View>

        {/* Loading Animation or Risk Card */}
        {showLottie ? (
          <FadeView style={{ alignItems: "center", marginTop: 24 }}>
            <LottieView
              source={require("../assets/animations/Locate GPS.json")}
              autoPlay
              loop
              style={{ width: 140, height: 140 }}
            />
            <Text style={{ marginTop: 8, color: "#6B7280" }}>
              Updating safety for your area
            </Text>
          </FadeView>
        ) : (
          <RiskCard
            crimeProbability={crimeProbability}
            riskColor={riskColor}
            riskLabel={riskLabel}
            safetyTip={
              safetyData?.safetyTips?.[0] ||
              "AI suggests caution in your area. Avoid isolated areas after 10 PM."
            }
          />
        )}

        {/* Quick Actions */}
        <QuickActions navigation={navigation} />

        {/* News Feed */}
        {!loadingNews && newsArticles.length > 0 && (
          <NewsFeed
            data={newsArticles}
            onOpenNews={() => navigation.navigate("NewsFeed")}
            navigation={navigation}
          />
        )}

        {/* Debug Section (Remove in production) */}
        {__DEV__ && (
          <FadeView style={styles.debugSection} delay={500}>
            <Text style={styles.debugTitle}>Notification System</Text>
            <Text style={styles.debugText}>
              Background Task: {backgroundTaskStatus}
            </Text>
            <Text style={styles.debugText}>
              Unread Notifications: {unreadCount}
            </Text>
            <DebugNotificationButton onPress={handleTestNotifications} />
          </FadeView>
        )}

        {/* Footer Animation */}
        <FadeView
          style={{ alignItems: "center", marginTop: 0, marginBottom: 80 }}
          delay={0}
        >
          <LottieView
            source={require("../assets/animations/Certified SSL.json")}
            autoPlay
            loop
            style={{ width: 90, height: 90 }}
          />
          <Text style={{ color: "#6B7280", marginTop: 4 }}>
            AyaAI keeps you informed quietly and clearly
          </Text>
          <Text style={styles.autoNotificationText}>
            Automatic safety alerts every 6 hours
          </Text>
        </FadeView>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
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
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
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
    color: "#5c6169ff",
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
    position: "relative",
  },
  premiumBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1F2937",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  quickActionText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
    textAlign: "center",
  },
  newsSection: { paddingHorizontal: 20, marginTop: 28, marginBottom: 4 },
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
  moreButton: { color: PRIMARY, fontWeight: "600" },
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
  // Debug styles
  debugSection: {
    backgroundColor: "#F3F4F6",
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  debugButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  autoNotificationText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    fontStyle: "italic",
  },
});