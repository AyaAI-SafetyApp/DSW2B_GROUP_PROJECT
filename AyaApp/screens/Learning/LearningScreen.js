import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { WebView } from "react-native-webview";

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
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    url: "https://www.youtube.com/embed/PXgPZsak9y0",
  },
];

const tutorials = [
  {
    id: 1,
    title: "Basic Self-Defense Moves",
    description: "Learn simple strikes and blocks",
    image: require("../../assets/Games/tut.webp"),
    status: "Not started",
  },
  {
    id: 2,
    title: "Fall Safety Techniques",
    description: "Prevent injuries from falls",
    image: require("../../assets/Games/tut.webp"),
    status: "In progress",
  },
  {
    id: 3,
    title: "Escape & Evasion",
    description: "Learn to escape dangerous situations",
    image: require("../../assets/Games/tut.webp"),
    status: "Completed",
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
];

export default function LearningScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Videos");

  const handleGamePress = (game) => {
    if (game.id === 1) {
      navigation.navigate("ReactionGame", { game });
    } else if (game.id === 2) {
      navigation.navigate("PoliceGame", { game });
    }
  };

  const handleTrainingPress = (tutorial) => {
    console.log("Starting training for:", tutorial.title);
    // Placeholder: integrate Computer Vision training model here
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
                style={styles.verticalCard}
                onPress={() => handleTrainingPress(tut)}
              >
                <Image source={tut.image} style={styles.verticalCardImage} />
                <View style={styles.verticalCardContent}>
                  <Text style={styles.cardTitle}>{tut.title}</Text>
                  <Text style={styles.cardDesc}>{tut.description}</Text>
                  <Text
                    style={[styles.trainingStatus, getStatusColor(tut.status)]}
                  >
                    {tut.status}
                  </Text>
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
