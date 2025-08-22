import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const tutorials = [
  {
    id: 1,
    title: "Basic Self-Defense Moves",
    description: "Learn simple strikes and blocks",
    image: require("../../assets/Games/tut.webp"),
  },
  {
    id: 2,
    title: "Fall Safety Techniques",
    description: "Prevent injuries from falls",
    image: require("../../assets/Games/tut.webp"),
  },
  {
    id: 3,
    title: "Escape & Evasion",
    description: "Learn to escape dangerous situations",
    image: require("../../assets/Games/tut.webp"),
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
    title: "Virtual Sparring",
    description: "Practice moves against AI opponent",
    image: require("../../assets/Games/Game_icon.jpg"),
  },
];

export default function LearningScreen() {
  const navigation = useNavigation();

  const handleGamePress = (game) => {
    navigation.navigate("Game", { game });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Self-Defense Tutorials</Text>
      {tutorials.map((tut) => (
        <TouchableOpacity key={tut.id} style={styles.card}>
          <Image source={tut.image} style={styles.cardImage} />
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>{tut.title}</Text>
            <Text style={styles.cardDesc}>{tut.description}</Text>
          </View>
          <View style={styles.iconWrapper}>
            <Ionicons name="shield-outline" size={28} color="#E91E63" />
          </View>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Games & Training</Text>
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 15 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", marginVertical: 10 },
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
