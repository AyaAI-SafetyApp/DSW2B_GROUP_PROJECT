import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Image,
  Alert,
  Share,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const DigitalCard = () => {
  const [isFlipped, setIsFlipped] = useState(true); // default to back card
  const flipAnimation = useRef(new Animated.Value(1)).current; // start from back

  useEffect(() => {
    // Ensure flipAnimation matches isFlipped state
    flipAnimation.setValue(isFlipped ? 1 : 0);
  }, []);

  const flipCard = () => {
    Animated.spring(flipAnimation, {
      toValue: isFlipped ? 0 : 1,
      tension: 10,
      friction: 8,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
  const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

  const handleNFC = () => {
    Alert.alert("NFC", "Card disconnected via NFC."); // placeholder
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: "Check out my Aya Medical Card!",
      });
    } catch (error) {
      Alert.alert("Error", "Unable to share card.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Tap to flip the card</Text>
      </View>

      <TouchableOpacity
        onPress={flipCard}
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        <Animated.View
          style={[styles.card, styles.backCard, backAnimatedStyle]}
        >
          <View style={styles.pinkSectionBack}>
            <View style={styles.decorativeCircles}>
              <View style={[styles.circle, styles.circle1]} />
              <View style={[styles.circle, styles.circle2]} />
              <View style={[styles.circle, styles.circle3]} />
              <View style={[styles.circle, styles.circle4]} />
              <View style={[styles.circle, styles.circle5]} />
              <View style={[styles.circle, styles.circle6]} />
            </View>

            <View style={styles.logoContainer}>
              <View style={styles.logoWithPlus}>
                <Image
                  source={require("../assets/Logos/Icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.plusSign}>+</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Aya Medical Card</Text>
          </View>
        </Animated.View>
        <Animated.View
          style={[styles.card, styles.frontCard, frontAnimatedStyle]}
        >
          <View style={styles.pinkSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWithPlus}>
                <Image
                  source={require("../assets/Logos/Icon.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.plusSign}>+</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <Text style={styles.name}>William Gates</Text>
            <View style={styles.separator} />
            <View style={styles.detailsList}>
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>DOB:</Text> 1955-10-28
              </Text>
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>Gender:</Text> Male
              </Text>
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>Blood Type:</Text> A+
              </Text>
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>Medical Aid:</Text> 123456789
              </Text>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.iconButton} onPress={handleNFC}>
          <Ionicons name="link-outline" size={20} color="#555" />
          <Text style={styles.iconButtonText}>NFC Sharing</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color="#555" />
          <Text style={styles.iconButtonText}>Share Card</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const TestApp = () => {
  return (
    <SafeAreaView style={styles.appContainer}>
      <DigitalCard />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#f0f0f0" },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    gap: 30,
  },
  header: { alignItems: "center", marginBottom: 30, width: "100%" },
  subtitle: { fontSize: 16, color: "#666" },
  cardContainer: { width: width * 0.9, height: 200 },
  card: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  frontCard: { backgroundColor: "#f5f5f5" },
  backCard: {
    backgroundColor: "#de0973",
    shadowColor: "#de0973",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  pinkSection: {
    width: 150,
    height: 200,
    backgroundColor: "#de0973",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 80,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
  },
  pinkSectionBack: {
    width: "100%",
    height: "100%",
    backgroundColor: "#de0973",
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  decorativeCircles: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "rgba(255, 255, 255, 0.5)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  circle1: { width: 80, height: 80, top: 20, right: 20 },
  circle2: { width: 60, height: 60, top: 60, left: 20 },
  circle3: { width: 40, height: 40, bottom: 40, right: 40 },
  circle4: { width: 100, height: 100, top: 100, right: -20 },
  circle5: { width: 50, height: 50, bottom: 20, left: 40 },
  circle6: { width: 30, height: 30, top: 30, left: 50 },
  logoContainer: { alignItems: "center", marginBottom: 10 },
  logoWithPlus: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: { width: 150, height: 150 },
  plusSign: {
    position: "absolute",
    color: "white",
    fontSize: 70,
    fontWeight: "bold",
    top: 60,
    right: 30,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cardTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailsSection: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    marginLeft: width * 0.38,
  },
  name: { fontSize: 20, fontWeight: "bold", color: "#333", marginBottom: 5 },
  separator: {
    height: 2,
    backgroundColor: "#de0973",
    marginBottom: 10,
    width: "50%",
  },
  detailsList: { gap: 8 },
  detailItem: { fontSize: 14, color: "#333", lineHeight: 22 },
  detailLabel: { fontWeight: "bold" },
  bottomButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 15,
    marginTop: 20,
  },
  iconButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ddd",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  iconButtonText: { color: "#555", fontWeight: "600", fontSize: 14 },
});

export default DigitalCard;
