import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
// import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PoseDetectionService from '../services/PoseDetectionService';

const { width, height } = Dimensions.get('window');


const getIconEmoji = (iconName) => {
  const iconMap = {
    'camera-outline': '📷',
    'timer-outline': '⏰',
    'star-outline': '⭐',
    'trending-up-outline': '📈',
  };
  return iconMap[iconName] || '❓';
};

export default function ComputerVisionModeScreen({ route, navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [currentPose, setCurrentPose] = useState(null);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [lessonProgress, setLessonProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  const cameraRef = useRef(null);
  const intervalRef = useRef(null);
  const lesson = route?.params?.lesson || {
    title: 'Basic Defensive Stance',
    poses: ['standing', 'guard_position'],
    points: 100
  };

  useEffect(() => {
    initializeCamera();
    initializeTensorFlow();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isTraining) {
      intervalRef.current = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isTraining]);

  const initializeCamera = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const initializeTensorFlow = async () => {
    try {
      setFeedback('Loading AI model...');
      await PoseDetectionService.initialize();
      setIsModelLoaded(true);
      setFeedback('AI Model ready! Start training to begin pose detection.');
    } catch (error) {
      console.error('Error initializing AI model:', error);
      setFeedback('Error loading AI model. Please restart the app.');
    }
  };

  const startTraining = () => {
    if (!isModelLoaded) {
      Alert.alert('Model Not Ready', 'Please wait for the AI model to load.');
      return;
    }
    
    setIsTraining(true);
    setLessonProgress(0);
    setScore(0);
    setAccuracy(0);
    setTimeElapsed(0);
    setFeedback('Training started! Follow the pose instructions.');
    
    // Simulate pose detection and training
    simulatePoseDetection();
  };

  const stopTraining = () => {
    setIsTraining(false);
    saveLessonProgress();
    showResults();
  };

  const runPoseDetection = async () => {
    try {
      if (!PoseDetectionService.isReady()) {
        // Fallback to mock behavior if service isn't ready
        simulateMockPoseDetection();
        return;
      }

      // In a real implementation, you would capture the camera frame
      // For now, we'll use mock data until camera integration is complete
      const mockImageData = { width: 640, height: 480 };
      const poses = await PoseDetectionService.detectPoses(mockImageData, {
        maxPoses: 1,
        scoreThreshold: 0.3
      });

      if (poses && poses.length > 0) {
        const detectedPose = poses[0];
        processDetectedPose(detectedPose);
      } else {
        // Fallback to mock if no poses detected
        simulateMockPoseDetection();
      }
    } catch (error) {
      console.error('Error in pose detection:', error);
      // Fallback to mock behavior on error
      simulateMockPoseDetection();
    }
  };

  const simulateMockPoseDetection = () => {
    // Simple mock pose detection for demo purposes
    const mockAccuracy = Math.floor(Math.random() * 40) + 60; // 60-100% accuracy
    setAccuracy(mockAccuracy);
    
    if (mockAccuracy > 80) {
      setScore(prev => prev + Math.round(mockAccuracy / 10));
      setFeedback('Great pose! Keep it up!');
      
      if (lessonProgress < 100) {
        setLessonProgress(prev => Math.min(prev + 2, 100));
      }
    } else {
      setFeedback('Adjust your stance and try again!');
    }
  };

  const processDetectedPose = (detectedPose) => {
    const currentTargetPose = lesson.poses[Math.floor(lessonProgress / (100 / lesson.poses.length))];
    const targetPoseData = PoseDetectionService.getDefensivePoseKeypoints(currentTargetPose);
    
    if (targetPoseData) {
      const accuracy = PoseDetectionService.calculatePoseAccuracy(detectedPose, targetPoseData);
      setAccuracy(accuracy);
      
      if (accuracy > 80) {
        setScore(prev => prev + Math.round(accuracy / 10));
        setFeedback(`Excellent ${targetPoseData.name}! Accuracy: ${accuracy}%`);
        
        // Progress lesson
        if (lessonProgress < 100) {
          setLessonProgress(prev => Math.min(prev + 2, 100));
        }
      } else {
        setFeedback(`Adjust your ${targetPoseData.name}. Current accuracy: ${accuracy}%`);
      }
    } else {
      // Fallback for unknown poses
      setFeedback('Unknown pose detected. Follow the lesson instructions.');
    }
  };

  const simulatePoseDetection = () => {
    // Real-time pose detection loop
    const poseDetectionInterval = setInterval(async () => {
      if (!isTraining) {
        clearInterval(poseDetectionInterval);
        return;
      }
      
      await runPoseDetection();
      
      // Check if lesson is complete
      if (lessonProgress >= 100) {
        clearInterval(poseDetectionInterval);
        setTimeout(() => {
          stopTraining();
        }, 2000);
      }
    }, 1000); // Run pose detection every second
  };

  const saveLessonProgress = async () => {
    try {
      const lessonData = {
        lessonId: lesson.id,
        score,
        accuracy,
        timeElapsed,
        completedAt: new Date().toISOString(),
        mode: 'computer_vision'
      };
      
      // Save to lesson history
      const historyKey = 'lessonHistory';
      const existingHistory = await AsyncStorage.getItem(historyKey);
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      history.push(lessonData);
      await AsyncStorage.setItem(historyKey, JSON.stringify(history));
      
      // Update completed lessons
      const completedKey = 'completedLessons';
      const existingCompleted = await AsyncStorage.getItem(completedKey);
      const completed = existingCompleted ? JSON.parse(existingCompleted) : [];
      if (!completed.includes(lesson.id)) {
        completed.push(lesson.id);
        await AsyncStorage.setItem(completedKey, JSON.stringify(completed));
      }
      
      // Update user stats
      const statsKey = 'userStats';
      const existingStats = await AsyncStorage.getItem(statsKey);
      const stats = existingStats ? JSON.parse(existingStats) : {
        totalLessons: 0,
        currentStreak: 0,
        totalPoints: 0,
        badges: 0
      };
      
      stats.totalLessons += 1;
      stats.totalPoints += score;
      await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
      
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  const showResults = () => {
    const successRate = accuracy;
    let message = '';
    
    if (successRate >= 90) {
      message = `Excellent! ${successRate}% accuracy achieved!`;
    } else if (successRate >= 80) {
      message = `Great job! ${successRate}% accuracy. Keep practicing!`;
    } else if (successRate >= 70) {
      message = `Good effort! ${successRate}% accuracy. Room for improvement.`;
    } else {
      message = `${successRate}% accuracy. Practice more to improve your form.`;
    }
    
    Alert.alert(
      'Training Complete!',
      `${message}\n\nScore: ${score} points\nTime: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
      [
        { text: 'Try Again', onPress: startTraining },
        { text: 'Back to Lessons', onPress: () => navigation.goBack() }
      ]
    );
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (hasPermission === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498DB" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.errorContainer}>
        <Text style={{ fontSize: 64 }}>{getIconEmoji('camera-outline')}</Text>
        <Text style={styles.errorText}>Camera permission is required for pose detection</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeCamera}>
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={Camera.Constants.Type.front}
          autoFocus={Camera.Constants.AutoFocus.on}
        >
          {/* Pose Overlay */}
          {isTraining && (
            <View style={styles.overlay}>
              <Animatable.View
                animation="pulse"
                iterationCount="infinite"
                style={styles.poseIndicator}
              >
                <Text style={styles.poseText}>
                  {currentPose ? currentPose.replace('_', ' ').toUpperCase() : 'GET READY'}
                </Text>
              </Animatable.View>
              
              {/* Accuracy Indicator */}
              <View style={styles.accuracyContainer}>
                <Text style={styles.accuracyText}>{accuracy}% Accurate</Text>
                <View style={styles.accuracyBar}>
                  <View 
                    style={[styles.accuracyFill, { width: `${accuracy}%` }]} 
                  />
                </View>
              </View>
            </View>
          )}
        </Camera>
      </View>

      {/* Control Panel */}
      <View style={styles.controlPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20 }}>{getIconEmoji('timer-outline')}</Text>
            <Text style={styles.statValue}>{formatTime(timeElapsed)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20 }}>{getIconEmoji('star-outline')}</Text>
            <Text style={styles.statValue}>{score}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={{ fontSize: 20 }}>{getIconEmoji('trending-up-outline')}</Text>
            <Text style={styles.statValue}>{Math.round(lessonProgress)}%</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${lessonProgress}%` }]} />
          </View>
          <Text style={styles.progressText}>{Math.round(lessonProgress)}% Complete</Text>
        </View>

        {/* Feedback */}
        <Text style={styles.feedbackText}>{feedback}</Text>

        {/* Controls */}
        <View style={styles.controlsContainer}>
          {!isModelLoaded ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3498DB" />
              <Text style={styles.loadingText}>Loading AI Model...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, isTraining ? styles.stopButton : styles.startButton]}
              onPress={isTraining ? stopTraining : startTraining}
            >
              <Icon 
                name={isTraining ? 'stop' : 'play-arrow'} 
                size={24} 
                color="#FFFFFF" 
              />
              <Text style={styles.controlButtonText}>
                {isTraining ? 'Stop Training' : 'Start Training'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    textAlign: 'center',
    marginVertical: 20,
  },
  retryButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poseIndicator: {
    backgroundColor: 'rgba(52, 73, 94, 0.8)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  poseText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  accuracyContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  accuracyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  accuracyBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 3,
  },
  controlPanel: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 5,
  },
  progressContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#ECF0F1',
    borderRadius: 4,
    marginBottom: 5,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 16,
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 20,
    minHeight: 20,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 180,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#27AE60',
  },
  stopButton: {
    backgroundColor: '#E74C3C',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});