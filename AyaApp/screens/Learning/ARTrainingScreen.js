import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function ARTrainingScreen({ route, navigation }) {
  const { training, type } = route.params;
  
  // Training state
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [totalReps] = useState(training.moves.length * 5); // 5 reps per move
  
  // Sensor data
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const moveIndicatorAnim = useRef(new Animated.Value(0)).current;
  
  // Sensor subscriptions
  const accelerometerRef = useRef(null);
  const gyroscopeRef = useRef(null);

  // Define functions before useEffect
  const startSensors = () => {
    // Set sensor update intervals
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    // Subscribe to accelerometer
    accelerometerRef.current = Accelerometer.addListener((data) => {
      setMotionData(data);
      detectMovement(data);
    });

    // Subscribe to gyroscope
    gyroscopeRef.current = Gyroscope.addListener((data) => {
      setGyroData(data);
    });
  };

  const stopSensors = () => {
    accelerometerRef.current?.remove();
    gyroscopeRef.current?.remove();
  };

  const startMoveAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(moveIndicatorAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(moveIndicatorAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const detectMovement = (data) => {
    if (!isTrainingActive) return;

    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    
    // Different thresholds for different training types
    let threshold = 1.5;
    if (type === "fall") threshold = 2.0;
    if (type === "reaction") threshold = 1.8;

    if (magnitude > threshold) {
      onMoveDetected();
    }
  };

  const onMoveDetected = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Flash animation
    Animated.sequence([
      Animated.timing(glowAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(glowAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();

    // Update progress
    const newReps = repsCompleted + 1;
    setRepsCompleted(newReps);
    setScore(score + 10);

    // Check if move is complete (5 reps)
    if (newReps % 5 === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (currentMoveIndex < training.moves.length - 1) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      } else {
        completeTraining();
      }
    }
  };

  const completeTraining = () => {
    setIsTrainingActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Alert.alert(
      "🎉 Training Complete!",
      `Great job! You've completed all ${training.moves.length} moves.\n\nScore: ${score}\nReps: ${repsCompleted}/${totalReps}`,
      [
        { text: "Train Again", onPress: resetTraining },
        { text: "Done", onPress: () => navigation.goBack() },
      ]
    );
  };

  const resetTraining = () => {
    setCurrentMoveIndex(0);
    setScore(0);
    setRepsCompleted(0);
    startCountdown();
  };

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTrainingActive(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return prev - 1;
      });
    }, 1000);
  };

  const handleStart = () => {
    startCountdown();
  };

  const handlePause = () => {
    setIsTrainingActive(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleResume = () => {
    setIsTrainingActive(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // useEffect hooks
  useEffect(() => {
    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-start countdown after 1 second
    const autoStartTimer = setTimeout(() => {
      startCountdown();
    }, 1000);

    return () => {
      clearTimeout(autoStartTimer);
      stopSensors();
    };
  }, []);

  useEffect(() => {
    if (isTrainingActive) {
      startSensors();
      startMoveAnimation();
    } else {
      stopSensors();
    }
  }, [isTrainingActive]);

  const currentMove = training.moves[currentMoveIndex];
  const progress = (repsCompleted / totalReps) * 100;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(79, 70, 229, 0.3)", "rgba(34, 197, 94, 0.8)"],
  });

  return (
    <LinearGradient
      colors={["#1F2937", "#111827", "#000000"]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{training.title}</Text>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>{score}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {repsCompleted}/{totalReps} reps
        </Text>
      </View>

      {/* AR View Area */}
      <View style={styles.arView}>
        {countdown > 0 && !isTrainingActive ? (
          <Animated.View
            style={[styles.countdownContainer, { transform: [{ scale: pulseAnim }] }]}
          >
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.countdownLabel}>Get Ready...</Text>
          </Animated.View>
        ) : isTrainingActive ? (
          <>
            {/* Move Indicator */}
            <Animated.View style={[styles.moveIndicator, { opacity: glowAnim }]}>
              <LinearGradient
                colors={["rgba(34, 197, 94, 0.5)", "rgba(34, 197, 94, 0.1)"]}
                style={styles.glowEffect}
              />
            </Animated.View>

            {/* Current Move Display */}
            <View style={styles.moveDisplay}>
              <Ionicons name="fitness" size={80} color="#22C55E" />
              <Text style={styles.moveTitle}>{currentMove}</Text>
              <Text style={styles.moveInstruction}>
                {type === "motion" && "Perform the movement with your device"}
                {type === "fall" && "Practice the falling technique safely"}
                {type === "reaction" && "React quickly to complete the move"}
              </Text>
              <View style={styles.repCounter}>
                <Text style={styles.repText}>
                  Rep {(repsCompleted % 5) + 1}/5
                </Text>
              </View>
            </View>

            {/* Motion Feedback */}
            <View style={styles.motionFeedback}>
              <Text style={styles.feedbackLabel}>Motion Detected</Text>
              <View style={styles.sensorBars}>
                <View style={styles.sensorBar}>
                  <View
                    style={[
                      styles.sensorFill,
                      { width: `${Math.abs(motionData.x) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.sensorBar}>
                  <View
                    style={[
                      styles.sensorFill,
                      { width: `${Math.abs(motionData.y) * 100}%` },
                    ]}
                  />
                </View>
                <View style={styles.sensorBar}>
                  <View
                    style={[
                      styles.sensorFill,
                      { width: `${Math.abs(motionData.z) * 100}%` },
                    ]}
                  />
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.welcomeContainer}>
            <Ionicons name="cube-outline" size={100} color="#4F46E5" />
            <Text style={styles.welcomeTitle}>AR Training Ready</Text>
            <Text style={styles.welcomeDescription}>
              {training.description}
            </Text>
            <View style={styles.movesList}>
              <Text style={styles.movesListTitle}>Moves to Practice:</Text>
              {training.moves.map((move, index) => (
                <View key={index} style={styles.moveItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                  <Text style={styles.moveItemText}>{move}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isTrainingActive && countdown === 0 && repsCompleted === 0 ? (
          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <LinearGradient
              colors={["#4F46E5", "#6366F1"]}
              style={styles.buttonGradient}
            >
              <Ionicons name="play" size={28} color="#FFFFFF" />
              <Text style={styles.buttonText}>Start Training</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : isTrainingActive ? (
          <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
            <LinearGradient
              colors={["#F59E0B", "#EF4444"]}
              style={styles.buttonGradient}
            >
              <Ionicons name="pause" size={28} color="#FFFFFF" />
              <Text style={styles.buttonText}>Pause</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : countdown === 0 ? (
          <TouchableOpacity style={styles.resumeButton} onPress={handleResume}>
            <LinearGradient
              colors={["#22C55E", "#16A34A"]}
              style={styles.buttonGradient}
            >
              <Ionicons name="play" size={28} color="#FFFFFF" />
              <Text style={styles.buttonText}>Resume</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  scoreBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#374151",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
  },
  progressText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  arView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  countdownLabel: {
    fontSize: 24,
    color: "#9CA3AF",
    marginTop: 20,
  },
  moveIndicator: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    justifyContent: "center",
    alignItems: "center",
  },
  glowEffect: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
  },
  moveDisplay: {
    alignItems: "center",
    zIndex: 1,
  },
  moveTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
    textAlign: "center",
  },
  moveInstruction: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  repCounter: {
    marginTop: 24,
    backgroundColor: "rgba(79, 70, 229, 0.3)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#4F46E5",
  },
  repText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  motionFeedback: {
    position: "absolute",
    bottom: 20,
    width: "100%",
    paddingHorizontal: 20,
  },
  feedbackLabel: {
    fontSize: 12,
    color: "#9CA3AF",
    marginBottom: 8,
    textAlign: "center",
  },
  sensorBars: {
    gap: 8,
  },
  sensorBar: {
    height: 6,
    backgroundColor: "#374151",
    borderRadius: 3,
    overflow: "hidden",
  },
  sensorFill: {
    height: "100%",
    backgroundColor: "#22C55E",
  },
  welcomeContainer: {
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 20,
  },
  welcomeDescription: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 12,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  movesList: {
    marginTop: 32,
    width: "100%",
  },
  movesListTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  moveItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  moveItemText: {
    fontSize: 16,
    color: "#D1D5DB",
    marginLeft: 12,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  startButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  pauseButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  resumeButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
