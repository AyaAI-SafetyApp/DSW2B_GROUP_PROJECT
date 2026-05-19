import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");

const videos = [
  {
    id: 1,
    title: "What Is Domestic Violence?",
    src: require("../../assets/video/video1.mp4"),
    avatar: require("../../assets/avatars/avatar1.png"),
    uploader: "SafeLife Channel",
    views: "12K views",
    date: "3 days ago",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    src: require("../../assets/video/video2.mp4"),
    avatar: require("../../assets/avatars/avatar2.png"),
    uploader: "Defend Yourself",
    views: "8.5K views",
    date: "1 week ago",
  },
  {
    id: 3,
    title: "Advanced Self Defence",
    src: require("../../assets/video/video3.mp4"),
    avatar: require("../../assets/avatars/avatar3.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 4,
    title: "Awareness Training",
    src: require("../../assets/video/video4.mp4"),
    avatar: require("../../assets/avatars/avatar4.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 1,
    title: "What Is Domestic Violence?",
    src: require("../../assets/video/video1.mp4"),
    avatar: require("../../assets/avatars/avatar1.png"),
    uploader: "SafeLife Channel",
    views: "12K views",
    date: "3 days ago",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    src: require("../../assets/video/video2.mp4"),
    avatar: require("../../assets/avatars/avatar2.png"),
    uploader: "Defend Yourself",
    views: "8.5K views",
    date: "1 week ago",
  },
  {
    id: 3,
    title: "Advanced Self Defence",
    src: require("../../assets/video/video3.mp4"),
    avatar: require("../../assets/avatars/avatar3.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 4,
    title: "Awareness Training",
    src: require("../../assets/video/video4.mp4"),
    avatar: require("../../assets/avatars/avatar4.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 1,
    title: "What Is Domestic Violence?",
    src: require("../../assets/video/video1.mp4"),
    avatar: require("../../assets/avatars/avatar1.png"),
    uploader: "SafeLife Channel",
    views: "12K views",
    date: "3 days ago",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    src: require("../../assets/video/video2.mp4"),
    avatar: require("../../assets/avatars/avatar2.png"),
    uploader: "Defend Yourself",
    views: "8.5K views",
    date: "1 week ago",
  },
  {
    id: 3,
    title: "Advanced Self Defence",
    src: require("../../assets/video/video3.mp4"),
    avatar: require("../../assets/avatars/avatar3.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 4,
    title: "Awareness Training",
    src: require("../../assets/video/video4.mp4"),
    avatar: require("../../assets/avatars/avatar4.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 1,
    title: "What Is Domestic Violence?",
    src: require("../../assets/video/video1.mp4"),
    avatar: require("../../assets/avatars/avatar1.png"),
    uploader: "SafeLife Channel",
    views: "12K views",
    date: "3 days ago",
  },
  {
    id: 2,
    title: "Self Defence Basics",
    src: require("../../assets/video/video2.mp4"),
    avatar: require("../../assets/avatars/avatar2.png"),
    uploader: "Defend Yourself",
    views: "8.5K views",
    date: "1 week ago",
  },
  {
    id: 3,
    title: "Advanced Self Defence",
    src: require("../../assets/video/video3.mp4"),
    avatar: require("../../assets/avatars/avatar3.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
  {
    id: 4,
    title: "Awareness Training",
    src: require("../../assets/video/video4.mp4"),
    avatar: require("../../assets/avatars/avatar4.png"),
    uploader: "Defend Yourself",
    views: "5K views",
    date: "2 weeks ago",
  },
];

const tutorials = [
  {
    id: 1,
    title: "Basic Self-Defense",
    description: "Essential strikes and defensive moves",
    image: require("../../assets/Games/tut.webp"),
    status: "FREE • 10 moves",
    trainingType: "defense",
    duration: "8-12 mins",
    difficulty: "Beginner",
    moves: [
      { name: "Palm Strike", instruction: "Push phone forward quickly" },
      { name: "Elbow Strike", instruction: "Swing phone sideways fast" },
      { name: "Knee Strike", instruction: "Lift phone sharply" },
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
    description: "Rescue victims",
    image: require("../../assets/Games/Mt_icon.webp"),
  },
];

function VideoCard({ video }) {
  const [loading, setLoading] = useState(true);
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 800, useNativeDriver: false }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const shimmerBackground = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E5E7EB", "#F3F4F6"],
  });

  return (
    <View style={styles.videoCard}>
      {loading && <Animated.View style={[styles.videoSkeleton, { backgroundColor: shimmerBackground }]} />}
      <Video
        source={video.src}
        style={styles.videoPlayer}
        useNativeControls
        resizeMode="cover"
        shouldPlay={false}
        onLoad={() => setLoading(false)}
      />
      <View style={styles.videoMeta}>
        <Image source={video.avatar} style={styles.videoAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.videoTitle}>{video.title}</Text>
          <Text style={styles.videoSubInfo}>
            {video.uploader} • {video.views} • {video.date}
          </Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </View>
    </View>
  );
}

export default function LearningScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Videos");

  const handleTrainingPress = (tutorial) => {
    navigation.navigate("CameraARTraining", { training: tutorial, type: tutorial.trainingType });
  };

  const handleGamePress = (game) => {
    navigation.navigate(game.id === 1 ? "ReactionGame" : "PoliceGame", { game });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "Videos":
        return (
          <FlatList
            data={videos}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <VideoCard video={item} />}
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 15 }}
          />
        );
      case "Tutorials":
        return (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}>
            {tutorials.map((tut) => (
              <TouchableOpacity
                key={tut.id}
                style={styles.arTrainingCard}
                onPress={() => handleTrainingPress(tut)}
                activeOpacity={0.7}
              >
                <Image source={tut.image} style={styles.verticalCardImage} />
                <View style={styles.verticalCardContent}>
                  <Text style={styles.cardTitle}>{tut.title}</Text>
                  <Text style={styles.cardDesc}>{tut.description}</Text>
                  <View style={styles.trainingMeta}>
                    <Text style={styles.metaText}>
                      {tut.duration} • {tut.moves.length} moves • {tut.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.statusBadge}>{tut.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        );
      case "Games":
        return (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 15, paddingTop: 10 }}>
            {games.map((game) => (
              <TouchableOpacity key={game.id} style={styles.card} onPress={() => handleGamePress(game)}>
                <Image source={game.image} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{game.title}</Text>
                  <Text style={styles.cardDesc}>{game.description}</Text>
                </View>
                <Ionicons name="game-controller-outline" size={28} color="#111827" />
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
      <View style={styles.navbar}>
        <View style={styles.navButtons}>
          <TouchableOpacity
            style={[styles.navButton, activeTab === "Videos" && styles.activeTab]}
            onPress={() => setActiveTab("Videos")}
          >
            <Ionicons name="videocam-outline" size={20} color="#111827" />
            <Text style={styles.navButtonText}>Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeTab === "Tutorials" && styles.activeTab]}
            onPress={() => setActiveTab("Tutorials")}
          >
            <Ionicons name="book-outline" size={20} color="#111827" />
            <Text style={styles.navButtonText}>Training</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.navButton, activeTab === "Games" && styles.activeTab]}
            onPress={() => setActiveTab("Games")}
          >
            <Ionicons name="game-controller-outline" size={20} color="#111827" />
            <Text style={styles.navButtonText}>Games</Text>
          </TouchableOpacity>
        </View>
      </View>
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    width: "100%",
    paddingVertical: 60,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderBottomColor: "#E5E7EB",
    borderBottomWidth: 1,
  },
  navButtons: { flexDirection: "row", justifyContent: "space-around" },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  navButtonText: { fontSize: 14, color: "#111827", fontWeight: "600", marginLeft: 4 },
  activeTab: { backgroundColor: "#F3F4F6" },

  videoCard: {
    width: width * 0.95,
    marginBottom: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
  },
  videoPlayer: { width: "100%", height: 200, backgroundColor: "#000" },
  videoSkeleton: { width: "100%", height: 200, borderRadius: 12, marginBottom: 8 },
  videoMeta: { flexDirection: "row", alignItems: "center", marginTop: 8, paddingHorizontal: 8, paddingBottom: 8 },
  videoAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  videoTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  videoSubInfo: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  verticalCardImage: { width: "100%", height: 140, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  verticalCardContent: { padding: 12 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  cardDesc: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  trainingMeta: { marginTop: 6 },
  metaText: { fontSize: 12, color: "#6B7280" },
  statusBadge: {
    fontSize: 11,
    fontWeight: "700",
    color: "#10B981",
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 6,
  },
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
});
