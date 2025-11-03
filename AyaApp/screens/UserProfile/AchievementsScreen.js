import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

export default function AchievementsScreen({ navigation }) {
  const [achievements] = useState([
    {
      id: 1,
      title: "Safety First",
      description: "Complete your safety profile",
      icon: "shield-checkmark",
      unlocked: true,
      points: 50,
      date: "2025-10-20",
    },
    {
      id: 2,
      title: "Guardian Angel",
      description: "Add 3 emergency contacts",
      icon: "people",
      unlocked: true,
      points: 100,
      date: "2025-10-21",
    },
    {
      id: 3,
      title: "Location Master",
      description: "Enable location sharing",
      icon: "location",
      unlocked: true,
      points: 75,
      date: "2025-10-22",
    },
    {
      id: 4,
      title: "Safety Scholar",
      description: "Complete 5 safety lessons",
      icon: "school",
      unlocked: false,
      points: 150,
      progress: "3/5",
    },
    {
      id: 5,
      title: "Community Helper",
      description: "Share 10 safety tips",
      icon: "heart",
      unlocked: false,
      points: 200,
      progress: "2/10",
    },
    {
      id: 6,
      title: "Week Warrior",
      description: "Use the app for 7 consecutive days",
      icon: "calendar",
      unlocked: false,
      points: 125,
      progress: "4/7 days",
    },
    {
      id: 7,
      title: "Emergency Ready",
      description: "Complete emergency drill",
      icon: "alert-circle",
      unlocked: false,
      points: 100,
    },
    {
      id: 8,
      title: "Safety Ambassador",
      description: "Invite 5 friends to join Aya",
      icon: "share-social",
      unlocked: false,
      points: 250,
      progress: "0/5",
    },
  ]);

  const [stats] = useState({
    totalPoints: 225,
    level: 2,
    unlockedAchievements: 3,
    totalAchievements: 8,
  });

  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.45,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, []);

  const renderAchievement = (achievement) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    return (
      <Animated.View
        key={achievement.id}
        style={{ transform: [{ scale: scaleAnim }] }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() =>
            Animated.spring(scaleAnim, {
              toValue: 0.97,
              useNativeDriver: true,
            }).start()
          }
          onPressOut={() =>
            Animated.spring(scaleAnim, {
              toValue: 1,
              useNativeDriver: true,
            }).start()
          }
          style={[styles.card, !achievement.unlocked && styles.cardLocked]}
        >
          <View
            style={[
              styles.iconWrapper,
              achievement.unlocked ? styles.iconUnlocked : styles.iconLocked,
            ]}
          >
            <Ionicons
              name={achievement.icon}
              size={32}
              color={achievement.unlocked ? "#fff" : "#999"}
            />
          </View>
          <View style={styles.content}>
            <Text
              style={[
                styles.title,
                !achievement.unlocked && styles.titleLocked,
              ]}
            >
              {achievement.title}
            </Text>
            <Text style={styles.description}>{achievement.description}</Text>
            {achievement.progress && (
              <Text style={styles.progress}>{achievement.progress}</Text>
            )}
            <View style={styles.footer}>
              <View style={styles.points}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.pointsText}>{achievement.points} pts</Text>
              </View>
              {achievement.unlocked && achievement.date && (
                <Text style={styles.date}>Unlocked {achievement.date}</Text>
              )}
            </View>
            {achievement.unlocked && (
              <LottieView
                source={require("../../assets/animations/Certified SSL.json")}
                autoPlay
                loop={false}
                style={styles.lottie}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statsCard}>
          <View style={styles.levelBadge}>
            <Ionicons name="ribbon" size={32} color="#FFD700" />
            <Text style={styles.levelText}>Level {stats.level}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.unlockedAchievements}/{stats.totalAchievements}
              </Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress to Level {stats.level + 1}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>225/500 points</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked</Text>
          {achievements.filter((a) => a.unlocked).map(renderAchievement)}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          {achievements.filter((a) => !a.unlocked).map(renderAchievement)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color:"#FF1493" },
  scroll: { flex: 1 },
  statsCard: {
    backgroundColor: "#333",
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  levelBadge: { alignItems: "center", marginBottom: 15 },
  levelText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 5,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: { alignItems: "center", flex: 1 },
  divider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.3)" },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  statLabel: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 5 },
  progressSection: { marginHorizontal: 20, marginTop: 20 },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: "#E0E0E0",
    borderRadius: 5,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#000", borderRadius: 5 },
  progressText: {
    fontSize: 12,
    color: "#999",
    marginTop: 5,
    textAlign: "right",
  },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F8F8F8",
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLocked: { opacity: 0.6 },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  iconUnlocked: { backgroundColor: "#000" },
  iconLocked: { backgroundColor: "#E0E0E0" },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: "600", color: "#333", marginBottom: 3 },
  titleLocked: { color: "#999" },
  description: { fontSize: 13, color: "#666", marginBottom: 5 },
  progress: { fontSize: 12, color: "#999", marginBottom: 3 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  points: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FF8C00",
    marginLeft: 4,
  },
  date: { fontSize: 11, color: "#999" },
  lottie: { width: 60, height: 60, position: "absolute", top: -15, right: -15 },
});