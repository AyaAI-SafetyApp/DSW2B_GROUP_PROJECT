import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../../lib/supabaseClient";

const { width, height } = Dimensions.get("window");

export default function CameraARTrainingScreen({ route, navigation }) {
  const { training, type } = route.params;
  
  // Camera permissions
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  
  // Training state
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [repsCompleted, setRepsCompleted] = useState(0);
  const [totalReps] = useState(training.moves.length * 3); // 3 reps per move (more manageable)
  const [currentRep, setCurrentRep] = useState(1); // Track current rep (1-3)
  const [sessionData, setSessionData] = useState({
    startTime: null,
    movements: [],
    accuracy: [],
  });
  
  // Sensor data for movement detection
  const [motionData, setMotionData] = useState({ x: 0, y: 0, z: 0 });
  const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
  const [movementIntensity, setMovementIntensity] = useState(0);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0.5)).current;
  
  // Sensor subscriptions
  const accelerometerRef = useRef(null);
  const gyroscopeRef = useRef(null);
  const cameraRef = useRef(null);

  // Request camera permission on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Define functions before useEffect
  const startSensors = () => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    accelerometerRef.current = Accelerometer.addListener((data) => {
      setMotionData(data);
      detectMovement(data);
    });

    gyroscopeRef.current = Gyroscope.addListener((data) => {
      setGyroData(data);
    });
  };

  const stopSensors = () => {
    accelerometerRef.current?.remove();
    gyroscopeRef.current?.remove();
  };

  const detectMovement = (data) => {
    if (!isTrainingActive) return;

    const magnitude = Math.sqrt(data.x ** 2 + data.y ** 2 + data.z ** 2);
    setMovementIntensity(magnitude);
    
    // Different thresholds for different training types
    let threshold = 1.5;
    let accuracyThreshold = 2.0;
    
    if (type === "fall") {
      threshold = 2.0;
      accuracyThreshold = 2.5;
    }
    if (type === "reaction") {
      threshold = 1.8;
      accuracyThreshold = 2.3;
    }

    if (magnitude > threshold) {
      // Calculate accuracy based on movement intensity
      const accuracy = magnitude >= accuracyThreshold ? "Perfect" : "Good";
      onMoveDetected(accuracy, magnitude);
    }
  };

  const onMoveDetected = (accuracy, magnitude) => {
    Haptics.impactAsync(
      accuracy === "Perfect" 
        ? Haptics.ImpactFeedbackStyle.Heavy 
        : Haptics.ImpactFeedbackStyle.Medium
    );
    
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

    // Get current move details
    const currentMove = training.moves[currentMoveIndex];
    const moveName = typeof currentMove === 'string' ? currentMove : currentMove.name;
    
    // Record movement data
    const movementRecord = {
      moveIndex: currentMoveIndex,
      moveName: moveName,
      accuracy,
      magnitude,
      timestamp: new Date().toISOString(),
      gyro: { ...gyroData },
      accelerometer: { ...motionData },
    };

    setSessionData(prev => ({
      ...prev,
      movements: [...prev.movements, movementRecord],
      accuracy: [...prev.accuracy, accuracy],
    }));

    // Update progress
    const newReps = repsCompleted + 1;
    setRepsCompleted(newReps);
    
    // Update current rep (1-3)
    const newCurrentRep = currentRep + 1;
    
    // Points based on accuracy
    const points = accuracy === "Perfect" ? 15 : 10;
    setScore(score + points);

    // Check if move is complete (3 reps)
    if (newCurrentRep > 3) {
      setCurrentRep(1); // Reset rep counter
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (currentMoveIndex < training.moves.length - 1) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      } else {
        completeTraining();
      }
    } else {
      setCurrentRep(newCurrentRep);
    }
  };

  const completeTraining = async () => {
    setIsTrainingActive(false);
    stopSensors();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Calculate session statistics
    const endTime = new Date();
    const duration = Math.round((endTime - sessionData.startTime) / 1000); // seconds
    const perfectMoves = sessionData.accuracy.filter(a => a === "Perfect").length;
    const goodMoves = sessionData.accuracy.filter(a => a === "Good").length;
    const accuracyPercentage = Math.round((perfectMoves / sessionData.accuracy.length) * 100);

    // Save to database
    await saveTrainingSession({
      duration,
      perfectMoves,
      goodMoves,
      accuracyPercentage,
    });
    
    Alert.alert(
      "🎉 Training Complete!",
      `Great job! You've completed all ${training.moves.length} moves.\n\n` +
      `Score: ${score}\n` +
      `Reps: ${repsCompleted}/${totalReps}\n` +
      `Accuracy: ${accuracyPercentage}%\n` +
      `Perfect Moves: ${perfectMoves}\n` +
      `Duration: ${Math.floor(duration / 60)}m ${duration % 60}s`,
      [
        { text: "Train Again", onPress: resetTraining },
        { text: "Done", onPress: () => navigation.goBack() },
      ]
    );
  };

  const saveTrainingSession = async (stats) => {
    try {
      // Get user info from AsyncStorage
      const sessionData = await AsyncStorage.getItem("userSession");
      if (!sessionData) return;

      const { userId, email } = JSON.parse(sessionData);

      // Save to Supabase
      const trainingRecord = {
        user_id: userId,
        user_email: email,
        training_type: type,
        training_title: training.title,
        score: score,
        reps_completed: repsCompleted,
        total_reps: totalReps,
        duration_seconds: stats.duration,
        accuracy_percentage: stats.accuracyPercentage,
        perfect_moves: stats.perfectMoves,
        good_moves: stats.goodMoves,
        movements_data: sessionData.movements,
        completed_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("training_sessions")
        .insert([trainingRecord]);

      if (error) {
        console.error("Error saving training session:", error);
      } else {
        console.log("✅ Training session saved successfully");
      }
    } catch (error) {
      console.error("Error saving training session:", error);
    }
  };

  const resetTraining = () => {
    setCurrentMoveIndex(0);
    setScore(0);
    setRepsCompleted(0);
    setCurrentRep(1);
    setSessionData({
      startTime: new Date(),
      movements: [],
      accuracy: [],
    });
    startCountdown();
  };

  const startCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsTrainingActive(true);
          setSessionData({
            startTime: new Date(),
            movements: [],
            accuracy: [],
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        return prev - 1;
      });
    }, 1000);
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

    // Auto-start countdown after camera is ready
    if (cameraReady && countdown === 3) {
      const autoStartTimer = setTimeout(() => {
        startCountdown();
      }, 1000);

      return () => clearTimeout(autoStartTimer);
    }

    return () => {
      stopSensors();
    };
  }, [cameraReady]);

  useEffect(() => {
    if (isTrainingActive) {
      startSensors();
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

  // Check camera permission
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission is required for AR training</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="front"
        onCameraReady={() => setCameraReady(true)}
      >
        {/* Overlay for AR effect */}
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <LinearGradient
            colors={["rgba(31, 41, 55, 0.7)", "rgba(17, 24, 39, 0.9)"]}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>📸 {training.title}</Text>
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

        {/* AR Overlay Content */}
        <View style={styles.content}>
          {countdown > 0 && !isTrainingActive ? (
            <Animated.View
              style={[styles.countdownContainer, { transform: [{ scale: pulseAnim }] }]}
            >
              <Text style={styles.countdownText}>{countdown}</Text>
              <Text style={styles.countdownLabel}>Get Ready...</Text>
              <Text style={styles.instructionText}>Position yourself in the camera</Text>
            </Animated.View>
          ) : isTrainingActive ? (
            <>
              {/* Current Move Display */}
              <Animated.View style={[styles.moveCard, { backgroundColor: glowColor }]}>
                <Text style={styles.moveNumber}>
                  Move {currentMoveIndex + 1}/{training.moves.length}
                </Text>
                <Text style={styles.moveName}>
                  {typeof currentMove === 'string' ? currentMove : currentMove.name}
                </Text>
                {currentMove.instruction && (
                  <Text style={styles.moveInstruction}>
                    💡 {currentMove.instruction}
                  </Text>
                )}
                <Text style={styles.repCount}>
                  Rep {currentRep}/3
                </Text>
              </Animated.View>

              {/* Movement Intensity Indicator */}
              <View style={styles.intensityContainer}>
                <Text style={styles.intensityLabel}>Movement Intensity</Text>
                <View style={styles.intensityBar}>
                  <View
                    style={[
                      styles.intensityFill,
                      {
                        width: `${Math.min(movementIntensity * 30, 100)}%`,
                        backgroundColor:
                          movementIntensity > 2 ? "#22C55E" : "#EAB308",
                      },
                    ]}
                  />
                </View>
                <Text style={styles.intensityText}>
                  {movementIntensity > 2 ? "Perfect!" : movementIntensity > 1.5 ? "Good!" : "Move more!"}
                </Text>
              </View>

              {/* Pose Guide Overlay */}
              <View style={styles.poseGuideContainer}>
                <View style={styles.bodyOutline}>
                  <View style={styles.jointDot} />
                  <View style={[styles.jointDot, { top: "30%" }]} />
                  <View style={[styles.jointDot, { top: "60%" }]} />
                  <View style={[styles.jointDot, { top: "90%" }]} />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.pausedContainer}>
              <Text style={styles.pausedText}>⏸️ Training Paused</Text>
            </View>
          )}
        </View>

        {/* Control Buttons */}
        <View style={styles.controls}>
          {isTrainingActive ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.pauseButton]}
              onPress={handlePause}
            >
              <Ionicons name="pause" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : countdown === 0 ? (
            <TouchableOpacity
              style={[styles.controlButton, styles.playButton]}
              onPress={handleResume}
            >
              <Ionicons name="play" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  camera: {
    flex: 1,
    width: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 40,
  },
  permissionButton: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  scoreBadge: {
    backgroundColor: "rgba(79, 70, 229, 0.9)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  progressContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#22C55E",
    borderRadius: 4,
  },
  progressText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 5,
    textAlign: "center",
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  countdownContainer: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 40,
    borderRadius: 20,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: "bold",
    color: "#4F46E5",
  },
  countdownLabel: {
    fontSize: 24,
    color: "#FFFFFF",
    marginTop: 10,
  },
  instructionText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 10,
  },
  moveCard: {
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: 20,
    minWidth: width * 0.8,
  },
  moveNumber: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 5,
  },
  moveName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 10,
  },
  moveInstruction: {
    fontSize: 14,
    color: "#E5E7EB",
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 15,
    lineHeight: 20,
  },
  repCount: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  intensityContainer: {
    width: width * 0.8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  intensityLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  intensityBar: {
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },
  intensityFill: {
    height: "100%",
    borderRadius: 6,
  },
  intensityText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  poseGuideContainer: {
    position: "absolute",
    top: height * 0.15,
    alignItems: "center",
  },
  bodyOutline: {
    width: 80,
    height: 200,
    borderWidth: 2,
    borderColor: "rgba(79, 70, 229, 0.5)",
    borderRadius: 40,
    position: "relative",
  },
  jointDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4F46E5",
    position: "absolute",
    left: "50%",
    marginLeft: -6,
  },
  pausedContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 30,
    borderRadius: 20,
  },
  pausedText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  controls: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    gap: 20,
  },
  controlButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: "#EF4444",
  },
  playButton: {
    backgroundColor: "#22C55E",
  },
});
