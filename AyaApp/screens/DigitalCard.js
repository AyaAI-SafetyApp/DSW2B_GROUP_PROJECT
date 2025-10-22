import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  SafeAreaView,
  Image,
} from "react-native";

const { width } = Dimensions.get("window");

const DigitalCard = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnimation = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnimation, {
        toValue: 0,
        tension: 10,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnimation, {
        toValue: 1,
        tension: 10,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
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

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.centerContainer}>
            <Text style={styles.medicalInfoHeading}>Medical Info</Text>
          </View>
          <View style={styles.rightSpacer} />
        </View>
        <Text style={styles.title}>Aya Medical Card</Text>
        <Text style={styles.subtitle}>Tap to flip the card</Text>
      </View>

      <TouchableOpacity
        onPress={flipCard}
        activeOpacity={0.9}
        style={styles.cardContainer}
      >
        {/* Front Side - Medical Details */}
        <Animated.View
          style={[styles.card, styles.frontCard, frontAnimatedStyle]}
        >
          <View style={styles.pinkSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoWithPlus}>
                <Image
                  source={require("../assets/Logos/Aya_AI_Logo.png")}
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
              <Text style={styles.detailItem}>
                <Text style={styles.detailLabel}>Allergies:</Text> Rice
              </Text>
            </View>
          </View>
        </Animated.View>

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
                  source={require("../assets/Logos/Aya_AI_Logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
                <Text style={styles.plusSign}>+</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Aya Medical Card</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>

      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.disconnectButton}>
          <Text style={styles.disconnectButtonText}>Disconnect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Text style={styles.shareButtonText}>Share Card</Text>
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
  appContainer: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
    gap: 30,
    bottom: 150,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  rightSpacer: {
    width: 40,
  },
  backButton: {
    padding: 8,
    backgroundColor: "#ff69b4",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ff69b4",
  },
  backButtonText: {
    fontSize: 18,
    color: "ff69b4",
    fontWeight: "bold",
  },
  medicalInfoHeading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff69b4",
    textAlign: "center",
  },

  bottomButtons: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
  },
  disconnectButton: {
    backgroundColor: "#ff69b4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  disconnectButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  shareButton: {
    backgroundColor: "#ff69b4",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
  },
  shareButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  cardContainer: {
    width: width * 0.9,
    height: 200,
  },
  card: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: "absolute",
    backfaceVisibility: "hidden",
  },
  frontCard: {
    backgroundColor: "#f5f5f5",
  },
  backCard: {
    backgroundColor: "#ff69b4",
    shadowColor: "#ff69b4",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  pinkSection: {
    width: 150,
    height: 200,
    backgroundColor: "#ff69b4",
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
    backgroundColor: "#ff69b4",
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
  circle1: {
    width: 80,
    height: 80,
    top: 20,
    right: 20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 60,
    left: 20,
  },
  circle3: {
    width: 40,
    height: 40,
    bottom: 40,
    right: 40,
  },
  circle4: {
    width: 100,
    height: 100,
    top: 100,
    right: -20,
  },
  circle5: {
    width: 50,
    height: 50,
    bottom: 20,
    left: 40,
  },
  circle6: {
    width: 30,
    height: 30,
    top: 30,
    left: 50,
  },
  decorativeElements: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logoWithPlus: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 150,
    height: 150,
  },
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
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  detailsSection: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    left: 180,
  },
  backDetailsSection: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  separator: {
    height: 2,
    backgroundColor: "#ff69b4",
    marginBottom: 15,
    width: "50%",
  },
  detailsList: {
    gap: 8,
  },
  detailItem: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  detailLabel: {
    fontWeight: "bold",
  },
});

export default DigitalCard;
