import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import * as Haptics from "expo-haptics";
import { Accelerometer, Gyroscope } from "expo-sensors";

const { width } = Dimensions.get("window");

// Sample Data
const videos = [
  {
    id: 1,
    title: "What Is Domestic Violence?",
    url: "https://www.youtube.com/embed/zuN1wlwQLEA",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
  {
    id: 3,
    title: "Protective Stance & Footwork",
    url: "https://www.youtube.com/embed/abcd1234",
  },
  {
    id: 4,
    title: "Quick Escapes & Verbal De-escalation",
    url: "https://www.youtube.com/embed/wxyz5678",
  },
];

const tutorials = [
  {
    id: 1,
    title: "🥊 Basic Self-Defense",
    description: "Essential strikes and defensive moves for personal safety",
    image: require("../../assets/Games/tut.webp"),
    status: "FREE • 10 moves",
    trainingType: "defense",
    duration: "8-12 mins",
    difficulty: "Beginner",
    moves: [
      { name: "Palm Strike to Face", instruction: "Push phone forward quickly, like striking attacker's nose" },
      { name: "Elbow Strike", instruction: "Swing phone sideways fast, like hitting with your elbow" },
      { name: "Knee Strike", instruction: "Lift phone up sharply, like kneeing an attacker" },
      { name: "Hammer Fist", instruction: "Swing phone down hard, like hammering downward" },
      { name: "Front Kick", instruction: "Push phone forward with leg motion" },
      { name: "Low Block", instruction: "Sweep phone down to block low attacks" },
      { name: "High Block", instruction: "Raise phone up to block head strikes" },
      { name: "Push Away", instruction: "Shove phone forward with both hands to create distance" },
      { name: "Side Step", instruction: "Move phone quickly left or right to evade" },
      { name: "Throat Strike", instruction: "Jab phone forward at throat level" },
    ],
  },
  {
    id: 2,
    title: "⚡ Escape Techniques",
    description: "Break free from grabs, holds, and dangerous situations",
    image: require("../../assets/Games/tut.webp"),
    status: "FREE • 8 moves",
    trainingType: "escape",
    duration: "6-10 mins",
    difficulty: "Intermediate",
    moves: [
      { name: "Wrist Grab Escape", instruction: "Rotate phone sharply in circular motion to break wrist hold" },
      { name: "Bear Hug Break", instruction: "Drop phone down then thrust upward to break rear hold" },
      { name: "Choke Defense", instruction: "Raise phone up quickly while turning to break choke" },
      { name: "Hair Grab Release", instruction: "Cover phone with other hand, twist body away" },
      { name: "Shirt Grab Break", instruction: "Strike phone down on attacker's arms" },
      { name: "Ground Escape", instruction: "Swing phone side to side, then thrust up to escape pin" },
      { name: "Headlock Escape", instruction: "Turn phone into attacker, then push away" },
      { name: "Wall Pin Break", instruction: "Drop phone low, then push up and out" },
    ],
  },
  {
    id: 3,
    title: "🏃 Reaction & Evasion",
    description: "Fast reflexes and movement to avoid attacks",
    image: require("../../assets/Games/tut.webp"),
    status: "FREE • 6 moves",
    trainingType: "reaction",
    duration: "4-8 mins",
    difficulty: "Beginner",
    moves: [
      { name: "Quick Duck", instruction: "Drop phone down fast to avoid head strike" },
      { name: "Side Dodge Left", instruction: "Move phone sharply left to evade attack" },
      { name: "Side Dodge Right", instruction: "Move phone sharply right to evade attack" },
      { name: "Backward Jump", instruction: "Pull phone back quickly to create distance" },
      { name: "Spin Away", instruction: "Rotate phone 180° to turn and run" },
      { name: "Roll Forward", instruction: "Tilt phone forward in rolling motion to escape low" },
    ],
  },
];

const games = [
  {
    id: 1,
    title: "Reaction Time Challenge",
    description: "Test your reflexes",
    image: require("../../assets/Games/Game_icon.jpg"),
  },
  {
    id: 2,
    title: "MT Maja Toomuch",
    description: "Rescue victims ",
    image: require("../../assets/Games/Mt_icon.webp"),
  },
  {
    id: 3,
    title: "Safety Game",
    description: "Rescue victims ",
    image: require("../../assets/Games/safety.png"),
  },
];

export default function LearningScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Videos");

  const handleGamePress = (game) => {
    if (game.id === 1) {
      navigation.navigate("ReactionGame", { game });
    } else if (game.id === 2) {
      navigation.navigate("PoliceGame", { game });
    } else if (game.id === 3) {
      navigation.navigate("Safety", { game });
    }
  };

  const handleTrainingPress = (tutorial) => {
    // Navigate to Camera-based AR training for visual movement detection
    navigation.navigate("CameraARTraining", { 
      training: tutorial,
      type: tutorial.trainingType 
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return { color: "#10B981" };
      case "In progress":
        return { color: "#F59E0B" };
      case "Not started":
      default:
        return { color: "#6B7280" };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Videos":
        return (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
          >
            {videos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <Text style={styles.horizontalCardTitle}>{video.title}</Text>
                <WebView
                  style={styles.videoWebView}
                  source={{ uri: video.url }}
                  javaScriptEnabled={true}
                  allowsFullscreenVideo
                />
              </View>
            ))}
          </ScrollView>
        );

      case "Tutorials":
        return (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}
          >
            {tutorials.map((tut) => (
              <TouchableOpacity
                key={tut.id}
                style={styles.arTrainingCard}
                onPress={() => handleTrainingPress(tut)}
                activeOpacity={0.7}
              >
                <View style={styles.arCardHeader}>
                  <Image source={tut.image} style={styles.verticalCardImage} />
                  <View style={styles.arBadge}>
                    <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.arBadgeText}>AR/VR</Text>
                  </View>
                </View>
                <View style={styles.verticalCardContent}>
                  <Text style={styles.cardTitle}>{tut.title}</Text>
                  <Text style={styles.cardDesc}>{tut.description}</Text>
                  <View style={styles.trainingMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{tut.duration}</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="fitness-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{tut.moves.length} moves</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="bar-chart-outline" size={14} color="#6B7280" />
                      <Text style={styles.metaText}>{tut.difficulty}</Text>
                    </View>
                  </View>
                  <Text style={styles.statusBadge}>{tut.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      case "Games":
        return (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}
          >
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={styles.card}
                onPress={() => handleGamePress(game)}
              >
                <Image source={game.image} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardDesc}>{game.description}</Text>
                </View>
                <View style={styles.iconWrapper}>
                  <Ionicons
                    name="game-controller-outline"
                    size={28}
                    color="#10B981"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );

      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[
              styles.navButton,
              activeTab === "Videos" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Videos")}
          >
            <Ionicons name="videocam-outline" size={20} color="#111827" />
            <Text style={styles.navButtonText}>Videos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              activeTab === "Tutorials" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Tutorials")}
          >
            <Ionicons name="book-outline" size={20} color="#111827" />
            <Text style={styles.navButtonText}>Training</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.navButton,
              activeTab === "Games" && styles.activeTab,
            ]}
            onPress={() => setActiveTab("Games")}
          >
            <Ionicons
              name="game-controller-outline"
              size={20}
              color="#111827"
            />
            <Text style={styles.navButtonText}>Games</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {renderContent()}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  // Navbar
  navbar: {
    width: "100%",
    paddingVertical: 60,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  navButtons: { flexDirection: "row", justifyContent: "space-around" },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navButtonText: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    marginLeft: 4,
  },
  activeTab: { backgroundColor: "#E5E7EB" },

  // Horizontal Cards (for videos if needed)
  videoCard: {
    width: width * 0.9,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    elevation: 2,
    paddingBottom: 10,
  },
  videoWebView: { width: "100%", height: 200 },
  horizontalCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    margin: 10,
  },

  // Vertical Cards (Training & Games)
  verticalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  verticalCardImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    marginRight: 10,
  },
  verticalCardContent: { flex: 1 },
  trainingStatus: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  
  // AR/VR Training Card Styles
  arTrainingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#E0E7FF",
  },
  arCardHeader: {
    position: "relative",
    height: 120,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
  },
  arBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  arBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  trainingMeta: {
    flexDirection: "row",
    marginTop: 8,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  metaText: {
    fontSize: 12,
    color: "#6B7280",
    marginLeft: 4,
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },

  // Games Cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 2,
  },
  cardImage: { width: 60, height: 60, borderRadius: 12, marginRight: 10 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  cardDesc: { fontSize: 12, color: "#555", marginTop: 2 },
  iconWrapper: { marginLeft: 10 },
});
