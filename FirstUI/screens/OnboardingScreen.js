import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import { ChevronRight, Mic, Shield, MapPin, Smartphone, AlertTriangle, Wifi, WifiOff } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const [currentScreen, setCurrentScreen] = useState(0);
  const pulseAnim = new Animated.Value(1);
  const bounceAnim = new Animated.Value(0);
  const navigation = useNavigation();

  // Animation setup
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 15,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  const screens = [
  {
    id: 'voice-activation',
    title: 'Your Voice is Your Shield',
    subtitle: 'Instant emergency response with just your voice',
    description: 'Simply say "Dear Lord" or "Aya" and we\'ll immediately activate emergency assistance - even when you can\'t reach your phone.',
    image: require('../assets/2.png'),
    gradient: ['#7c5db9ff', '#a47df1'], 
  },
  {
    id: 'smart-detection',
    title: 'AI-Powered Protection',
    subtitle: 'Advanced sensors detect danger automatically',
    description: 'Our intelligent system monitors for falls, assaults, and emergencies using cutting-edge AI models and sensor technology.',
    image: require('../assets/3.png'),
    gradient: ['#7c5db9ff', '#a47df1'],
  },
  {
    id: 'crime-aware-routing',
    title: 'Stay One Step Ahead',
    subtitle: 'Real-time crime data keeps you safer',
    description: 'Navigate confidently with routes optimized using real SAPS crime data, helping you avoid high-risk areas day and night.',
    image: require('../assets/4.png'),
    gradient: ['#7c5db9ff', '#a47df1'],
  }
  ];


  const nextScreen = () => {
    if (currentScreen < screens.length - 1) {
      setCurrentScreen(currentScreen + 1);
    } else {
      navigation.navigate('SignUp');
    }
  };

  const prevScreen = () => {
    if (currentScreen > 0) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const currentScreenData = screens[currentScreen];

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Animated background pattern */}
      <View style={styles.backgroundPattern}>
        <Animated.View style={[
          styles.circle,
          { 
            top: 40, 
            left: 40, 
            width: 128, 
            height: 128, 
            transform: [{ scale: pulseAnim }],
            borderColor: currentScreenData.gradient[0]
          }
        ]} />
        <Animated.View style={[
          styles.circle,
          { 
            top: 128, 
            right: 64, 
            width: 80, 
            height: 80, 
            opacity: bounceAnim.interpolate({
              inputRange: [0, 15],
              outputRange: [0.5, 0]
            }),
            borderColor: currentScreenData.gradient[1]
          }
        ]} />
        <Animated.View style={[
          styles.circle,
          { 
            bottom: 80, 
            left: 80, 
            width: 96, 
            height: 96, 
            transform: [{ translateY: bounceAnim }],
            borderColor: currentScreenData.gradient[0]
          }
        ]} />
        <Animated.View style={[
          styles.circle,
          { 
            bottom: 160, 
            right: 40, 
            width: 64, 
            height: 64, 
            transform: [{ scale: pulseAnim }],
            borderColor: currentScreenData.gradient[1]
          }
        ]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>AYA</Text>
          <Text style={styles.appTagline}>Your Personal Safety Guardian</Text>
        </View>

        {/* Main content */}
        <View style={styles.contentContainer}>
          {/* Icon */}
          <View>
            <LinearGradient
              colors={currentScreenData.gradient}
              style={[styles.iconBackground, { opacity: 0.2 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.iconWrapper}>
              <Image
                source={currentScreenData.image}
                style={styles.screenImage}
                resizeMode="contain"
              />
            </View>

          </View>

          {/* Title and description */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentScreenData.title}</Text>
            <Text style={styles.subtitle}>{currentScreenData.subtitle}</Text>
            <Text style={styles.description}>{currentScreenData.description}</Text>
          </View>
        </View>

        {/* Progress indicators */}
        <View style={styles.progressContainer}>
          {screens.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index === currentScreen 
                  ? { backgroundColor: currentScreenData.gradient[0] }
                  : index < currentScreen 
                    ? { backgroundColor: '#afafafff' }
                    : { backgroundColor: '#afafafff' }
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        <View style={styles.buttonRow}>
          {currentScreen === 0 ? (
            <TouchableOpacity 
              onPress={() => setCurrentScreen(screens.length - 1)}
              style={styles.navButton}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={prevScreen}
              style={styles.navButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Next/Get Started button */}
          <TouchableOpacity
            onPress={nextScreen}
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: currentScreenData.gradient[0] },
              currentScreen === screens.length - 1 && styles.getStartedButton
            ]}
          >
            <Text style={styles.nextButtonText}>
              {currentScreen === screens.length - 1 ? 'Get Started' : 'Continue'}
            </Text>
            <ChevronRight size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1,
  },
  header: {
    paddingTop: 64,
    paddingBottom: 32,
    alignItems: 'center',
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 48,
    paddingHorizontal: 16,
  },
  progressDot: {
    width: 25,
    height: 8,
    borderRadius: 6,
    marginHorizontal: 6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  textContainer: {
    marginBottom: 48,
    maxWidth: width * 0.8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  navigationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 32,
    paddingBottom: 48,
    backgroundColor: 'white',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 9999,
  },
  disabledButton: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backButtonText: {
    color: '#6b7280',
  },
  disabledButtonText: {
    color: '#d1d5db',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  getStartedButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  skipButton: {
    alignSelf: 'center',
  },
  skipButtonText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  screenImage: {
    width: 200,
    height: 250,
  },
});

export default OnboardingScreen;