import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import Player from "../../components/Player";
import Civilian from "../../components/Civilian";
import Hazard from "../../components/Hazard";
import AICompanion from "../../components/AICompanion";

const { width, height } = Dimensions.get("window");

export default function Mt() {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [hazards, setHazards] = useState([]);
  const [civilians, setCivilians] = useState([]);
  const [gameOver, setGameOver] = useState(false);

  // Spawn hazards & civilians randomly
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      setHazards((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * (width - 30),
          y: Math.random() * (height - 100),
        },
      ]);
      setCivilians((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * (width - 30),
          y: Math.random() * (height - 100),
        },
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, [gameOver]);

  // Check game over
  useEffect(() => {
    if (health <= 0) setGameOver(true);
  }, [health]);

  const handleRescue = (id) => {
    setScore((prev) => prev + 10);
    setCivilians((prev) => prev.filter((c) => c.id !== id));
    setHealth((prev) => Math.min(prev + 5, 100));
  };

  const handleHazard = (id) => {
    setHealth((prev) => Math.max(prev - 20, 0));
    setHazards((prev) => prev.filter((h) => h.id !== id));
  };

  const resetGame = () => {
    setScore(0);
    setHealth(100);
    setHazards([]);
    setCivilians([]);
    setGameOver(false);
  };

  return (
    <ImageBackground
      source={require("../../assets/Games/map.jpg")}
      style={styles.container}
    >
      <Text style={styles.score}>Score: {score}</Text>

      <View style={styles.healthBar}>
        <View
          style={[
            styles.health,
            {
              width: `${health}%`,
              backgroundColor:
                health > 50 ? "green" : health > 20 ? "orange" : "red",
            },
          ]}
        />
      </View>

      <AICompanion />

      {!gameOver && (
        <Player
          civilians={civilians}
          hazards={hazards}
          onRescue={handleRescue}
          onHitHazard={handleHazard}
        />
      )}

      {civilians.map((c) => (
        <Civilian key={c.id} x={c.x} y={c.y} />
      ))}

      {hazards.map((h) => (
        <Hazard key={h.id} x={h.x} y={h.y} />
      ))}

      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>GAME OVER</Text>
          <Text style={styles.finalScore}>Your Score: {score}</Text>
          <TouchableOpacity style={styles.button} onPress={resetGame}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, width: "100%", height: "100%" },
  score: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 40,
    color: "#fff",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  healthBar: {
    height: 20,
    width: "80%",
    backgroundColor: "#ccc",
    borderRadius: 10,
    margin: 10,
    alignSelf: "center",
  },
  health: { height: "100%", borderRadius: 10 },
  gameOverContainer: {
    position: "absolute",
    top: height / 2 - 80,
    alignSelf: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 20,
    borderRadius: 12,
  },
  gameOverText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "red",
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2196f3",
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
});
