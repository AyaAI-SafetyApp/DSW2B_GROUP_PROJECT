import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Animated,
  FlatList,
  TouchableOpacity,
  Easing,
} from "react-native";
import { ChevronRight } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

const { width } = Dimensions.get("window");

const screens = [
  {
    id: "voice-activation",
    title: "Your Voice is Your Shield",
    subtitle: "Instant emergency response with just your voice",
    description:
      'Simply say "Dear Lord" or "Aya" and we\'ll immediately activate emergency assistance - even when you can\'t reach your phone.',
    image: require("../assets/2.png"),
    gradient: ["#d63384", "#e55fa8"],
  },
  {
    id: "smart-detection",
    title: "AI-Powered Protection",
    subtitle: "Advanced sensors detect danger automatically",
    description:
      "Our intelligent system monitors for falls, assaults, and emergencies using cutting-edge AI models and sensor technology.",
    image: require("../assets/3.png"),
    gradient: ["#d63384", "#e55fa8"],
  },
  {
    id: "crime-aware-routing",
    title: "Stay One Step Ahead",
    subtitle: "Real-time crime data keeps you safer",
    description:
      "Navigate confidently with routes optimized using real SAPS crime data, helping you avoid high-risk areas day and night.",
    image: require("../assets/2.png"),
    gradient: ["#d63384", "#e55fa8"],
  },
  {
    id: "ai-emergency-assistant",
    title: "Automated Help on Call",
    subtitle: "AI contacts authorities instantly",
    description:
      "Aya can automatically call emergency contacts or authorities if you’re unable to do so.",
    image: require("../assets/2.png"),
    gradient: ["#d63384", "#e55fa8"],
  },
  {
    id: "offline-mode",
    title: "Always Ready, Online or Offline",
    subtitle: "Safety features work without internet",
    description:
      "Aya ensures your safety even in areas with no internet connectivity by using offline emergency protocols.",
    image: require("../assets/2.png"),
    gradient: ["#d63384", "#e55fa8"],
  },
];

const ProgressDots = memo(({ total, current }) => (
  <View style={styles.progressContainer}>
    {Array.from({ length: total }).map((_, index) => {
      const isActive = index === current;
      return (
        <Animated.View
          key={index}
          style={[
            styles.progressDot,
            {
              backgroundColor: isActive ? "#d63384" : "#afafaf",
              transform: [{ scale: isActive ? 1.2 : 1 }],
            },
          ]}
        />
      );
    })}
  </View>
));

const OnboardingScreen = () => {
  const navigation = useNavigation();
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentScreen, setCurrentScreen] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const imageBounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createLoop = (anim, toValue, duration, type = "scale") =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: type === "scale" ? 1 : 0,
            duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

    createLoop(pulseAnim, 1.2, 1000, "scale");
    createLoop(bounceAnim, 15, 1000, "translate");
    createLoop(imageBounce, -10, 1000, "translate");
  }, []);

  const renderScreen = useCallback(
    ({ item, index }) => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const fade = scrollX.interpolate({
        inputRange,
        outputRange: [0, 1, 0],
        extrapolate: "clamp",
      });

      return (
        <View style={styles.screenContainer}>
          <Animated.View
            style={{
              transform: [{ translateY: imageBounce }],
              flex: 0.6,
              justifyContent: "center",
            }}
          >
            <Image
              source={item.image}
              style={styles.screenImage}
              resizeMode="contain"
            />
          </Animated.View>

          <View style={[styles.textContainer, { flex: 0.4 }]}>
            <Animated.Text style={[styles.title, { opacity: fade }]}>
              {item.title}
            </Animated.Text>

            <Animated.Text style={[styles.description, { opacity: fade }]}>
              {item.description}
            </Animated.Text>
            {currentScreen < screens.length - 1 && index === currentScreen && (
              <Text style={styles.swipeHint}>Swipe →</Text>
            )}
          </View>
        </View>
      );
    },
    [currentScreen]
  );

  const circles = [
    { top: 40, left: 40, size: 128, anim: pulseAnim, animType: "pulse" },
    { top: 128, right: 64, size: 80, anim: bounceAnim, animType: "bounce" },
    { bottom: 80, left: 80, size: 96, anim: bounceAnim, animType: "bounce" },
    { bottom: 160, right: 40, size: 64, anim: pulseAnim, animType: "pulse" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require("../assets/Logos/Aya_AI_Logo.png")}
          style={styles.logoImage}
        />
        <Text style={styles.appTagline}>Your Personal Safety Guardian</Text>
      </View>

      <Animated.FlatList
        data={screens}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={renderScreen}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentScreen(index);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      />

      <ProgressDots total={screens.length} current={currentScreen} />

      {currentScreen === screens.length - 1 && (
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              navigation.replace("CreateCredential");
            }}
            style={[styles.nextButton, { backgroundColor: "#d63384" }]}
          >
            <Text style={styles.nextButtonText}>Get Started</Text>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  header: { paddingTop: 64, paddingBottom: 32, alignItems: "center" },
  logoImage: { width: 44, height: 44, resizeMode: "contain" },
  appTagline: { fontSize: 14, color: "#6b7280" },
  screenContainer: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  iconBackground: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 10,
  },
  screenImage: { width: 200, height: 250 },
  textContainer: {
    width: width * 0.8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#111827",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 16,
    color: "#4b5563",
  },
  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  swipeHint: {
    fontSize: 14,
    color: "#d63384",
    marginTop: 24,
    fontWeight: "600",
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 48,
  },
  progressDot: { width: 25, height: 8, borderRadius: 6, marginHorizontal: 6 },
  navigationContainer: {
    position: "absolute",
    bottom: 40,
    left: 32,
    right: 32,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 9999,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default OnboardingScreen;
