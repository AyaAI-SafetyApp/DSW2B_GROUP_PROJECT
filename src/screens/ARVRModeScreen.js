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
import { GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as THREE from 'three';
// import Icon from 'react-native-vector-icons/MaterialIcons';

import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');


const getIconEmoji = (iconName) => {
  const iconMap = {
    'timer-outline': '⏰',
    'star-outline': '⭐',
    'cube-outline': '🧊',
    'stop-circle-outline': '⏹️',
    'play-circle-outline': '▶️',
  };
  return iconMap[iconName] || '❓';
};

export default function ARVRModeScreen({ route, navigation }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [score, setScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [lessonProgress, setLessonProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const intervalRef = useRef(null);
  
  const lesson = route?.params?.lesson || {
    title: 'Basic Defensive Stance',
    poses: ['standing', 'guard_position'],
    points: 100
  };

  const trainingSteps = [
    {
      instruction: 'Stand in a balanced position with feet shoulder-width apart',
      duration: 5000,
      points: 50
    },
    {
      instruction: 'Raise your hands to guard position near your face',
      duration: 5000,
      points: 50
    },
    {
      instruction: 'Maintain the stance while staying relaxed',
      duration: 5000,
      points: 50
    }
  ];

  useEffect(() => {
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

  const onContextCreate = async (gl) => {
    try {
      // Create renderer
      const renderer = new Renderer({ gl });
      renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight);
      renderer.setClearColor(0x000000, 0);
      rendererRef.current = renderer;

      // Create scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, 10, 5);
      scene.add(directionalLight);

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        gl.drawingBufferWidth / gl.drawingBufferHeight,
        0.1,
        1000
      );
      camera.position.set(0, 1.6, 3);

      // Add 3D instructional elements
      await addInstructionalElements(scene);

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate);
        
        // Rotate instructional elements
        scene.children.forEach(child => {
          if (child.userData && child.userData.type === 'instructor') {
            child.rotation.y += 0.01;
          }
        });

        renderer.render(scene, camera);
        gl.endFrameEXP();
      };

      animate();
      setIsInitialized(true);
      setFeedback('AR/VR environment loaded! Ready to start immersive training.');

    } catch (error) {
      console.error('Error initializing 3D environment:', error);
      setFeedback('Error loading 3D environment. Please restart.');
    }
  };

  const addInstructionalElements = async (scene) => {
    try {
      // Create a simple 3D figure representation
      const figureGeometry = new THREE.CapsuleGeometry(0.3, 1.5, 4, 8);
      const figureMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x3498db,
        transparent: true,
        opacity: 0.7 
      });
      const figure = new THREE.Mesh(figureGeometry, figureMaterial);
      figure.position.set(0, 0, 0);
      figure.userData = { type: 'instructor' };
      scene.add(figure);

      // Add ground plane
      const groundGeometry = new THREE.PlaneGeometry(10, 10);
      const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x34495e,
        transparent: true,
        opacity: 0.3 
      });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1;
      scene.add(ground);

      // Add position markers
      const markerGeometry = new THREE.RingGeometry(0.8, 1, 16);
      const markerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xe74c3c,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide 
      });
      const marker = new THREE.Mesh(markerGeometry, markerMaterial);
      marker.rotation.x = -Math.PI / 2;
      marker.position.y = -0.99;
      scene.add(marker);

    } catch (error) {
      console.error('Error adding 3D elements:', error);
    }
  };

  const startTraining = () => {
    if (!isInitialized) {
      Alert.alert('Environment Not Ready', 'Please wait for the 3D environment to load.');
      return;
    }
    
    setIsTraining(true);
    setLessonProgress(0);
    setScore(0);
    setAccuracy(0);
    setTimeElapsed(0);
    setCurrentStep(0);
    setFeedback('Immersive training started! Follow the 3D instructor.');
    
    // Start step-by-step training
    executeTrainingSteps();
  };

  const executeTrainingSteps = () => {
    let stepIndex = 0;
    
    const nextStep = () => {
      if (!isTraining || stepIndex >= trainingSteps.length) {
        if (isTraining) {
          completeTraining();
        }
        return;
      }
      
      const step = trainingSteps[stepIndex];
      setCurrentStep(stepIndex);
      setFeedback(step.instruction);
      
      // Simulate AR guidance
      setTimeout(() => {
        if (isTraining) {
          // Simulate successful completion
          const stepAccuracy = Math.random() * 0.3 + 0.7; // 70-100%
          setAccuracy(Math.round(stepAccuracy * 100));
          setScore(prev => prev + Math.round(step.points * stepAccuracy));
          setLessonProgress(((stepIndex + 1) / trainingSteps.length) * 100);
          
          if (stepAccuracy > 0.85) {
            setFeedback('Excellent form! Moving to next step...');
          } else if (stepAccuracy > 0.7) {
            setFeedback('Good! Small adjustments needed. Moving forward...');
          }
          
          stepIndex++;
          setTimeout(nextStep, 2000);
        }
      }, step.duration);
    };
    
    nextStep();
  };

  const completeTraining = () => {
    setIsTraining(false);
    saveLessonProgress();
    showResults();
  };

  const stopTraining = () => {
    setIsTraining(false);
    Alert.alert(
      'Stop Training?',
      'Are you sure you want to stop the current training session?',
      [
        { text: 'Continue', style: 'cancel' },
        { text: 'Stop', onPress: () => setFeedback('Training stopped.') }
      ]
    );
  };

  const saveLessonProgress = async () => {
    try {
      const lessonData = {
        lessonId: lesson.id,
        score,
        accuracy,
        timeElapsed,
        completedAt: new Date().toISOString(),
        mode: 'ar_vr'
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
      
      // Award AR/VR bonus
      if (accuracy > 85) {
        stats.totalPoints += 50; // Bonus for high accuracy in AR/VR mode
      }
      
      await AsyncStorage.setItem(statsKey, JSON.stringify(stats));
      
    } catch (error) {
      console.error('Error saving lesson progress:', error);
    }
  };

  const showResults = () => {
    const successRate = accuracy;
    let message = '';
    
    if (successRate >= 90) {
      message = `Outstanding! ${successRate}% accuracy in AR/VR mode!`;
    } else if (successRate >= 80) {
      message = `Excellent! ${successRate}% accuracy. Great immersive training!`;
    } else if (successRate >= 70) {
      message = `Good work! ${successRate}% accuracy. Practice makes perfect!`;
    } else {
      message = `${successRate}% accuracy. Try the lesson again to improve.`;
    }
    
    Alert.alert(
      'AR/VR Training Complete!',
      `${message}\n\nScore: ${score} points (including AR/VR bonus)\nTime: ${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')}`,
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 3D View */}
      <View style={styles.glContainer}>
        <GLView
          style={styles.glView}
          onContextCreate={onContextCreate}
        />
        
        {/* AR Overlays */}
        {isTraining && (
          <View style={styles.arOverlay}>
            <Animatable.View
              animation="fadeInDown"
              style={styles.stepIndicator}
            >
              <Text style={styles.stepText}>
                Step {currentStep + 1} of {trainingSteps.length}
              </Text>
            </Animatable.View>
            
            <View style={styles.accuracyDisplay}>
              <Text style={styles.accuracyText}>{accuracy}% Accuracy</Text>
              <View style={styles.accuracyBar}>
                <View 
                  style={[styles.accuracyFill, { width: `${accuracy}%` }]} 
                />
              </View>
            </View>
          </View>
        )}
        
        {!isInitialized && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Initializing AR/VR Environment...</Text>
          </View>
        )}
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
            <Text style={{ fontSize: 20 }}>{getIconEmoji('cube-outline')}</Text>
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
          {!isInitialized ? (
            <View style={styles.initializingContainer}>
              <ActivityIndicator size="small" color="#E67E22" />
              <Text style={styles.initializingText}>Loading 3D Environment...</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.controlButton, isTraining ? styles.stopButton : styles.startButton]}
              onPress={isTraining ? stopTraining : startTraining}
            >
              <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
                {isTraining ? '⏹️' : '▶️'}
              </Text>
              <Text style={styles.controlButtonText}>
                {isTraining ? 'Stop AR Training' : 'Start AR Training'}
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
  glContainer: {
    flex: 1,
    position: 'relative',
  },
  glView: {
    flex: 1,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  stepIndicator: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'center',
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  accuracyDisplay: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
  },
  accuracyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  accuracyBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
  },
  accuracyFill: {
    height: '100%',
    backgroundColor: '#27AE60',
    borderRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
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
    backgroundColor: '#E67E22',
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
    minHeight: 40,
    lineHeight: 20,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  initializingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initializingText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#E67E22',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: '#E67E22',
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