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
  SafeAreaView,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");
export const PRIMARY = "#D81B60";
export const API_BASE_URL = "https://dsw2b-backend.onrender.com";

const NEWS_DATA = [
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

// Fade-in animation helper
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

// Header component
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
      <View
        style={[styles.statusDot, { backgroundColor: riskColor }]}
        accessibilityLabel={`Safety color ${riskColor}`}
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
              {notificationsCount}
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

// Notification modal
const NotificationModal = ({ visible, notifications, onClose }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent} accessibilityViewIsModal>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={styles.modalTitle}>Notifications</Text>
          <TouchableOpacity
            onPress={onClose}
            accessibilityLabel="Close notifications"
          >
            <Ionicons name="close" size={22} color="#111" />
          </TouchableOpacity>
        </View>
        {notifications.length === 0 ? (
          <View style={{ paddingVertical: 24 }}>
            <Text>No notifications</Text>
          </View>
        ) : (
          notifications.map((n, i) => (
            <Text
              key={i}
              style={styles.modalItem}
              accessibilityLabel={`Notification ${i + 1}`}
            >
              {n}
            </Text>
          ))
        )}
        <TouchableOpacity
          style={styles.modalCloseButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onClose();
          }}
          accessibilityLabel="Close"
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Risk card
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
            {crimeProbability}%
          </Text>
          <Text style={styles.riskLabel}>{riskLabel}</Text>
        </View>
      </View>
      <Text style={styles.riskDescription}>{safetyTip}</Text>
    </View>
  </FadeView>
);

// Quick actions
const QuickActions = ({ navigation }) => {
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
    <FadeView style={styles.quickActions} delay={300}>
      {actions.map((a, i) => (
        <TouchableOpacity
          key={i}
          style={styles.quickActionItem}
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate(a.route);
          }}
          accessibilityLabel={a.text}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: a.color }]}>
            <Ionicons name={a.icon} size={22} color="#fff" />
          </View>
          <Text style={styles.quickActionText}>{a.text}</Text>
        </TouchableOpacity>
      ))}
    </FadeView>
  );
};

// News feed
const NewsFeed = ({ data, onOpenNews }) => (
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

// Home screen
export default function HomeScreen() {
  const navigation = useNavigation();
  const [currentLocation, setCurrentLocation] = useState("Loading...");
  const [crimeProbability, setCrimeProbability] = useState(0);
  const [safetyData, setSafetyData] = useState(null);
  const [notifications, setNotifications] = useState([
    "Welcome to AyaAI!",
    "New AI safety tools launched.",
  ]);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSafety, setLoadingSafety] = useState(true);
  const [showLottie, setShowLottie] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const cached = await AsyncStorage.getItem("@safety_last");
        if (cached) setSafetyData(JSON.parse(cached));
      } catch {}
    })();
  }, []);

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
        const addresses = await Location.reverseGeocodeAsync(loc.coords);
        if (!mounted) return;
        const city =
          addresses[0]?.city ||
          addresses[0]?.subregion ||
          addresses[0]?.region ||
          "Unknown";
        setCurrentLocation(city);
        await fetchSafetyData(city);
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

  useEffect(() => {
    let start = crimeProbability;
    const target = safetyData?.Danger_Percentage ?? 65;
    const step = target > start ? 1 : -1;
    let raf = null;
    const tick = () => {
      start += step;
      setCrimeProbability(Math.round(start));
      if ((step > 0 && start < target) || (step < 0 && start > target))
        raf = requestAnimationFrame(tick);
      else if (Platform.OS !== "web")
        Speech.speak(`${target} percent. ${riskLabel}.`, { rate: 1 });
    };
    if (start !== target) raf = requestAnimationFrame(tick);
    return () => raf && cancelAnimationFrame(raf);
  }, [safetyData]);

  const fetchSafetyData = useCallback(async (area = "Johannesburg") => {
    setLoadingSafety(true);
    setShowLottie(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/safety-status/${encodeURIComponent(area)}`
      );
      const data = res.ok
        ? await res.json()
        : {
            Danger_Percentage: 65,
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
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSafetyData(currentLocation || "Johannesburg");
    setRefreshing(false);
  }, [currentLocation]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />
      <Header
        notificationsCount={notifications.length}
        onOpenNotifications={() => setModalVisible(true)}
        onProfilePress={() => navigation.navigate("ProfileScreen")}
        riskColor={riskColor}
      />
      <NotificationModal
        visible={modalVisible}
        notifications={notifications}
        onClose={() => setModalVisible(false)}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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

        <QuickActions navigation={navigation} />
        <NewsFeed
          data={NEWS_DATA}
          onOpenNews={() => navigation.navigate("NewsFeed")}
        />

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
        </FadeView>
      </ScrollView>
    </SafeAreaView>
  );
}

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
  modalItem: { fontSize: 14, marginVertical: 6 },
  modalCloseButton: {
    backgroundColor: PRIMARY,
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
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
});
