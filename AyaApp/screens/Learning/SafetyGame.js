import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";

const SafetyGame = () => {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  const scenarios = [
    {
      id: 1,
      title: "Walking Home Alone",
      description:
        "It's getting dark and you need to walk home. What do you do?",
      image: "���‍♀️",
      options: [
        {
          text: "Take the shortest path through the park",
          outcome:
            "Not the safest choice. Parks can have poor lighting and limited visibility.",
          points: 0,
        },
        {
          text: "Stick to well-lit main roads with people around",
          outcome: "Good choice! Well-populated areas are safer when alone.",
          points: 10,
        },
        {
          text: "Call a trusted friend to walk with you or pick you up",
          outcome: "Excellent! There's safety in numbers.",
          points: 15,
        },
      ],
    },
    {
      id: 2,
      title: "Ride Sharing",
      description:
        "You've ordered a ride share. The car arrives but something seems off.",
      image: "���",
      options: [
        {
          text: "Get in anyway - you're in a hurry",
          outcome: "Risky! Always verify your ride for safety.",
          points: 0,
        },
        {
          text: "Check the license plate and driver's photo before entering",
          outcome: "Smart! Verifying your ride is crucial for safety.",
          points: 15,
        },
        {
          text: "Cancel the ride and order another one",
          outcome: "Good instinct! Trust your gut when something feels wrong.",
          points: 10,
        },
      ],
    },
    {
      id: 3,
      title: "Social Situation",
      description:
        "At a party, someone keeps offering you drinks you didn't see poured.",
      image: "���",
      options: [
        {
          text: "Politely decline and get your own drinks",
          outcome: "Excellent! Always keep control of your beverages.",
          points: 15,
        },
        {
          text: "Accept one drink but keep an eye on it",
          outcome:
            "Still risky - it's best to only accept drinks you've seen prepared.",
          points: 5,
        },
        {
          text: "Drink it - you don't want to be rude",
          outcome: "Dangerous! Never prioritize politeness over safety.",
          points: 0,
        },
      ],
    },
    {
      id: 4,
      title: "Stranger Approach",
      description:
        "A stranger approaches you asking for help finding their lost dog.",
      image: "���",
      options: [
        {
          text: "Help them search - it's just a lost dog",
          outcome: "Risky! This is a common tactic used by predators.",
          points: 0,
        },
        {
          text: "Politely decline and keep walking",
          outcome: "Good! It's okay to prioritize your safety.",
          points: 10,
        },
        {
          text: "Offer to call animal control for them instead",
          outcome: "Smart compromise! You're helping while maintaining safety.",
          points: 15,
        },
      ],
    },
  ];

  const handleAnswer = (option) => {
    setScore(score + option.points);

    Alert.alert(
      option.points > 7 ? "Good Choice!" : "Be Careful!",
      option.outcome,
      [
        {
          text: "Continue",
          onPress: () => {
            if (currentScenario < scenarios.length - 1) {
              setCurrentScenario(currentScenario + 1);
            } else {
              setGameCompleted(true);
            }
          },
        },
      ]
    );
  };

  const restartGame = () => {
    setCurrentScenario(0);
    setScore(0);
    setGameCompleted(false);
  };

  if (gameCompleted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Game Complete!</Text>
        <Text style={styles.score}>
          Your Safety Score: {score}/{scenarios.length * 15}
        </Text>
        <Text style={styles.feedback}>
          {score >= 50
            ? "Excellent! You make great safety decisions."
            : score >= 30
            ? "Good awareness, but there's room for improvement."
            : "Please review safety tips to better protect yourself."}
        </Text>
        <TouchableOpacity style={styles.button} onPress={restartGame}>
          <Text style={styles.buttonText}>Play Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Quest</Text>
      <Text style={styles.scenarioTitle}>
        {scenarios[currentScenario].title}
      </Text>
      <Text style={styles.scenarioEmoji}>
        {scenarios[currentScenario].image}
      </Text>
      <Text style={styles.description}>
        {scenarios[currentScenario].description}
      </Text>

      <View style={styles.optionsContainer}>
        {scenarios[currentScenario].options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.optionButton}
            onPress={() => handleAnswer(option)}
          >
            <Text style={styles.optionText}>{option.text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.progress}>
        Scenario {currentScenario + 1} of {scenarios.length}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#2c3e50",
  },
  scenarioTitle: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    color: "#34495e",
  },
  scenarioEmoji: {
    fontSize: 50,
    textAlign: "center",
    marginBottom: 15,
  },
  description: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    color: "#7f8c8d",
    lineHeight: 24,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  optionText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
  },
  progress: {
    textAlign: "center",
    color: "#95a5a6",
    fontSize: 16,
  },
  score: {
    fontSize: 24,
    textAlign: "center",
    marginVertical: 20,
    color: "#2c3e50",
  },
  feedback: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
    color: "#7f8c8d",
  },
  button: {
    backgroundColor: "#2ecc71",
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default SafetyGame;
