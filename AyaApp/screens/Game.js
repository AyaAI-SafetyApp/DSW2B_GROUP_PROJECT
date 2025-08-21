import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Dimensions, Vibration, SafeAreaView, Alert, Linking } from 'react-native';

const { width, height } = Dimensions.get('window');

const SelfDefenseGame = () => {
  const [gameState, setGameState] = useState('menu');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [currentTechnique, setCurrentTechnique] = useState(null);
  const [techniqueFeedback, setTechniqueFeedback] = useState('');
  const [connectionError, setConnectionError] = useState(false);
  
  // Animation values
  const playerAnim = useRef(new Animated.Value(0)).current;
  const opponentAnim = useRef(new Animated.Value(0)).current;
  const techniqueAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Character states
  const [playerAction, setPlayerAction] = useState('idle');
  const [opponentAction, setOpponentAction] = useState('approaching');
  
  // Game elements
  const techniques = [
    { 
      id: 1, 
      name: 'Palm Strike', 
      points: 10, 
      description: 'Use the heel of your palm to strike the nose or chin',
      playerAnimation: 'strike',
      opponentReaction: 'stagger'
    },
    { 
      id: 2, 
      name: 'Groin Kick', 
      points: 15, 
      description: 'A swift kick to the groin can disable an attacker',
      playerAnimation: 'kick',
      opponentReaction: 'doubleOver'
    },
    { 
      id: 3, 
      name: 'Elbow Strike', 
      points: 12, 
      description: 'Powerful close-range strike to the head or ribs',
      playerAnimation: 'elbow',
      opponentReaction: 'recoil'
    },
    { 
      id: 4, 
      name: 'Eye Gouge', 
      points: 8, 
      description: 'Target the eyes to create an escape opportunity',
      playerAnimation: 'gouge',
      opponentReaction: 'coverFace'
    },
  ];
  
  const opponents = [
    { 
      id: 1, 
      name: 'Street Harasser', 
      speed: 1.0, 
      health: 100, 
      description: 'Verbal harassment escalating to physical approach',
    },
    { 
      id: 2, 
      name: 'Grabber', 
      speed: 1.2, 
      health: 120, 
      description: 'Attempts to grab wrists or clothing',
    },
    { 
      id: 3, 
      name: 'Armed Attacker', 
      speed: 0.8, 
      health: 150, 
      description: 'Displays a weapon and makes threats',
    },
  ];

  // Character icons
  const characterIcons = {
    player: {
      idle: '🙂',
      strike: '👊',
      kick: '🦶',
      elbow: '💪',
      gouge: '🖐️',
      victory: '💃'
    },
    opponent: {
      approaching: '🚶‍♂️',
      grabbing: '🫴',
      attacking: '⚔️',
      stagger: '😵',
      doubleOver: '🤢',
      recoil: '👊',
      coverFace: '🤕',
      defeated: '😵'
    }
  };

  // Technique icons
  const techniqueIcons = {
    1: '👊',
    2: '🦶',
    3: '💪',
    4: '🖐️'
  };

  // Check connection on app start
  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      // Simulate connection check
      await new Promise(resolve => setTimeout(resolve, 2000));
      setConnectionError(false);
    } catch (error) {
      setConnectionError(true);
    }
  };

  // Start the game
  const startGame = () => {
    setGameState('playing');
    setScore(0);
    setLives(3);
    setLevel(1);
    setCombo(0);
    setPlayerAction('idle');
    setOpponentAction('approaching');
    generateNewTechnique();
    startLevel();
  };

  // Generate a random technique to perform - FIXED THIS FUNCTION
  const generateNewTechnique = () => {
    const randomIndex = Math.floor(Math.random() * techniques.length);
    setCurrentTechnique(techniques[randomIndex]);
    setTechniqueFeedback('Perform: ' + techniques[randomIndex].name);
    
    // Flash the technique name - FIXED THE ANIMATION SEQUENCE
    const animationSequence = Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }),
    ]);
    
    animationSequence.start(); // Correctly calling start on the sequence
  };

  // Start a level with specific opponent
  const startLevel = () => {
    const currentOpponent = opponents[level - 1] || opponents[0];
    
    // Reset animations
    opponentAnim.setValue(0);
    
    // Animate opponent approach
    Animated.timing(opponentAnim, {
      toValue: 1,
      duration: 2000 / currentOpponent.speed,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && gameState === 'playing') {
        // Opponent reached you - lose a life
        setOpponentAction('grabbing');
        Vibration.vibrate(500);
        setLives(prev => {
          const newLives = prev - 1;
          if (newLives <= 0) {
            endGame();
          }
          return newLives;
        });
        setTechniqueFeedback('Too slow! ' + currentOpponent.name + ' grabbed you!');
        resetOpponent();
      }
    });
  };

  // Reset opponent position
  const resetOpponent = () => {
    opponentAnim.setValue(0);
    setOpponentAction('approaching');
    if (gameState === 'playing') {
      startLevel();
    }
  };

  // Animate technique performance
  const animateTechnique = (technique, success) => {
    // Player performs the technique
    setPlayerAction(technique.playerAnimation);
    
    // Animate the technique motion
    Animated.sequence([
      Animated.timing(techniqueAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      Animated.timing(techniqueAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
    ]).start();
    
    if (success) {
      // Show opponent reaction
      setOpponentAction(technique.opponentReaction);
      
      // Push opponent back
      Animated.timing(opponentAnim, {
        toValue: 0,
        duration: 500,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }).start(() => {
        // Return to idle after successful technique
        setTimeout(() => {
          setPlayerAction('idle');
          setOpponentAction('approaching');
          generateNewTechnique();
          if (score + technique.points + (combo * 2) >= level * 100) {
            levelUp();
          } else {
            startLevel();
          }
        }, 1000);
      });
    } else {
      // Wrong technique - opponent continues approach
      setTimeout(() => {
        setPlayerAction('idle');
      }, 1000);
    }
  };

  // Handle player performing a technique
  const performTechnique = (techniqueId) => {
    if (gameState !== 'playing') return;
    
    const selectedTechnique = techniques.find(t => t.id === techniqueId);
    
    if (selectedTechnique.id === currentTechnique.id) {
      // Correct technique
      const pointsEarned = currentTechnique.points + (combo * 2);
      setScore(prev => prev + pointsEarned);
      setCombo(prev => prev + 1);
      setTechniqueFeedback('Perfect! +' + pointsEarned + ' points! Combo x' + (combo + 1));
      
      animateTechnique(selectedTechnique, true);
    } else {
      // Wrong technique
      setCombo(0);
      setTechniqueFeedback('Wrong technique! Perform ' + currentTechnique.name);
      Vibration.vibrate(200);
      
      animateTechnique(selectedTechnique, false);
    }
  };

  // Level up
  const levelUp = () => {
    if (level < opponents.length) {
      setLevel(prev => prev + 1);
      setPlayerAction('victory');
      setTechniqueFeedback('Level up! Now facing: ' + opponents[level].name);
      setTimeout(() => {
        setPlayerAction('idle');
        generateNewTechnique();
        startLevel();
      }, 2000);
    } else {
      // Game completed
      setPlayerAction('victory');
      setOpponentAction('defeated');
      setTechniqueFeedback('You mastered all self-defense techniques!');
      setTimeout(() => {
        endGame();
      }, 3000);
    }
  };

  // End the game
  const endGame = () => {
    setGameState('gameOver');
    opponentAnim.setValue(0);
  };

  // Get current opponent
  const getCurrentOpponent = () => {
    return opponents[level - 1] || opponents[0];
  };

  // Show connection help
  const showConnectionHelp = () => {
    Alert.alert(
      "Connection Help",
      "If you're experiencing connection timeouts:\n\n1. Make sure your device is on the same WiFi as your computer\n2. Try using the Expo app's 'Connection' menu to switch to Tunnel\n3. Restart the Expo development server\n4. Check your firewall settings",
      [
        { text: "Open Expo Docs", onPress: () => Linking.openURL('https://docs.expo.dev/workflow/run-on-device/') },
        { text: "OK", style: "cancel" }
      ]
    );
  };

  // Render connection error screen
  const renderConnectionError = () => (
    <SafeAreaView style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Connection Error</Text>
      <Text style={styles.errorText}>The app couldn't connect to the development server.</Text>
      <Text style={styles.errorDetails}>URL: exp://10.250.222.247:8088</Text>
      
      <TouchableOpacity style={styles.errorButton} onPress={checkConnection}>
        <Text style={styles.errorButtonText}>Retry Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.errorButton} onPress={showConnectionHelp}>
        <Text style={styles.errorButtonText}>Connection Help</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.errorButton} onPress={() => setConnectionError(false)}>
        <Text style={styles.errorButtonText}>Continue Offline</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  // Render game menu
  const renderMenu = () => (
    <SafeAreaView style={styles.menuContainer}>
      <Text style={styles.title}>Self-Defense Trainer</Text>
      <Text style={styles.subtitle}>Learn real self-defense techniques through interactive gameplay</Text>
      
      <View style={styles.characterDemo}>
        <View style={styles.demoItem}>
          <Text style={styles.demoIcon}>{characterIcons.player.idle}</Text>
          <Text style={styles.demoLabel}>Player</Text>
        </View>
        <View style={styles.demoItem}>
          <Text style={styles.demoIcon}>{characterIcons.opponent.approaching}</Text>
          <Text style={styles.demoLabel}>Opponent</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>START TRAINING</Text>
      </TouchableOpacity>
      
      <View style={styles.techniquesList}>
        <Text style={styles.sectionTitle}>Techniques You'll Learn:</Text>
        {techniques.map(tech => (
          <View key={tech.id} style={styles.techItem}>
            <Text style={styles.techName}>
              <Text style={styles.techIcon}>{techniqueIcons[tech.id]}</Text> {tech.name}
            </Text>
            <Text style={styles.techDesc}>{tech.description}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );

  // Render game screen
  const renderGame = () => {
    const currentOpponent = getCurrentOpponent();
    
    return (
      <SafeAreaView style={styles.gameContainer}>
        <View style={styles.header}>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>SCORE</Text>
            <Text style={styles.score}>{score}</Text>
          </View>
          
          <View style={styles.levelContainer}>
            <Text style={styles.levelLabel}>LEVEL</Text>
            <Text style={styles.level}>{level}</Text>
          </View>
          
          <View style={styles.livesContainer}>
            <Text style={styles.livesLabel}>LIVES</Text>
            <View style={styles.livesIcons}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Text key={i} style={[styles.life, i < lives && styles.lifeActive]}>❤️</Text>
              ))}
            </View>
          </View>
          
          {combo > 0 && (
            <View style={styles.comboContainer}>
              <Text style={styles.comboLabel}>COMBO</Text>
              <Text style={styles.combo}>x{combo}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.arena}>
          <Animated.View 
            style={[
              styles.opponent,
              { 
                transform: [
                  { 
                    translateX: opponentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [width - 120, 80]
                    })
                  }
                ] 
              }
            ]}
          >
            <Text style={styles.character}>{characterIcons.opponent[opponentAction]}</Text>
            <Text style={styles.characterLabel}>{currentOpponent.name}</Text>
          </Animated.View>
          
          <Animated.View 
            style={[
              styles.player,
              { 
                transform: [
                  { 
                    translateX: techniqueAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 30]
                    })
                  }
                ] 
              }
            ]}
          >
            <Text style={styles.character}>{characterIcons.player[playerAction]}</Text>
            <Text style={styles.characterLabel}>YOU</Text>
          </Animated.View>
        </View>
        
        <Animated.View style={[styles.techniquePrompt, { opacity: fadeAnim }]}>
          <Text style={styles.techniqueText}>{currentTechnique?.name}</Text>
          <Text style={styles.techniqueDesc}>{currentTechnique?.description}</Text>
        </Animated.View>
        
        <Text style={styles.feedback}>{techniqueFeedback}</Text>
        
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            {techniques.map(tech => (
              <TouchableOpacity 
                key={tech.id} 
                style={[
                  styles.techniqueButton,
                  currentTechnique?.id === tech.id && styles.highlightedTechnique
                ]}
                onPress={() => performTechnique(tech.id)}
              >
                <Text style={styles.techniqueIcon}>{techniqueIcons[tech.id]}</Text>
                <Text style={styles.techniqueButtonText}>{tech.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // Render game over screen
  const renderGameOver = () => (
    <SafeAreaView style={styles.menuContainer}>
      <Text style={styles.title}>Training Complete</Text>
      <Text style={styles.subtitle}>Final Score: {score}</Text>
      <Text style={styles.subtitle}>Level Reached: {level}</Text>
      
      <View style={styles.characterDemo}>
        <View style={styles.demoItem}>
          <Text style={styles.demoIcon}>{characterIcons.player.victory}</Text>
          <Text style={styles.demoLabel}>You</Text>
        </View>
        <View style={styles.demoItem}>
          <Text style={styles.demoIcon}>{characterIcons.opponent.defeated}</Text>
          <Text style={styles.demoLabel}>Opponent</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.startButton} onPress={startGame}>
        <Text style={styles.startButtonText}>TRAIN AGAIN</Text>
      </TouchableOpacity>
      
      <View style={styles.stats}>
        <Text style={styles.sectionTitle}>Real Self-Defense Tips:</Text>
        <Text style={styles.tip}>• Awareness is your first defense - always be aware of your surroundings</Text>
        <Text style={styles.tip}>• Your voice is a weapon - shout "Back off!" or "Fire!" to draw attention</Text>
        <Text style={styles.tip}>• Target vulnerable areas: eyes, nose, throat, groin, and knees</Text>
        <Text style={styles.tip}>• The goal is to escape, not to win a fight</Text>
      </View>
    </SafeAreaView>
  );

  if (connectionError) {
    return renderConnectionError();
  }

  return (
    <View style={styles.container}>
      {gameState === 'menu' && renderMenu()}
      {gameState === 'playing' && renderGame()}
      {gameState === 'gameOver' && renderGameOver()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetails: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'monospace',
    marginBottom: 30,
  },
  errorButton: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    width: '80%',
    alignItems: 'center',
  },
  errorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  characterDemo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginVertical: 20,
  },
  demoItem: {
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    width: 120,
  },
  demoIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  demoLabel: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500',
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  techniquesList: {
    width: '100%',
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    textAlign: 'center',
  },
  techItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  techName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  techIcon: {
    fontSize: 16,
  },
  techDesc: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  gameContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  levelContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  levelLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  level: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  livesContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  livesLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
    marginBottom: 4,
  },
  livesIcons: {
    flexDirection: 'row',
  },
  life: {
    fontSize: 18,
    marginHorizontal: 2,
    opacity: 0.3,
  },
  lifeActive: {
    opacity: 1,
  },
  comboContainer: {
    alignItems: 'center',
    backgroundColor: '#ffeaa7',
    padding: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  comboLabel: {
    fontSize: 12,
    color: '#d35400',
    fontWeight: '600',
    marginBottom: 4,
  },
  combo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d35400',
  },
  arena: {
    height: 180,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 15,
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  opponent: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e74c3c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  player: {
    position: 'absolute',
    left: 20,
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#3498db',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  character: {
    fontSize: 30,
    textAlign: 'center',
  },
  characterLabel: {
    color: '#2c3e50',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 10,
    textAlign: 'center',
  },
  techniquePrompt: {
    backgroundColor: '#3498db',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  techniqueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  techniqueDesc: {
    fontSize: 13,
    color: 'white',
    textAlign: 'center',
    lineHeight: 18,
  },
  feedback: {
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 15,
    minHeight: 40,
    fontWeight: '500',
  },
  controlsContainer: {
    marginBottom: 25,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  techniqueButton: {
    backgroundColor: '#f8f9fa',
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  highlightedTechnique: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd',
    borderWidth: 2,
  },
  techniqueIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  techniqueButtonText: {
    color: '#2c3e50',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  stats: {
    width: '100%',
    marginTop: 20,
  },
  tip: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#3498db',
    lineHeight: 20,
  },
});

export default SelfDefenseGame;