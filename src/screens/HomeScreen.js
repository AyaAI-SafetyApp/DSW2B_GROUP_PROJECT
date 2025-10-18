import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// Ionicons removed. Use emoji for icons.
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');


const getIconEmoji = (iconName) => {
  const iconMap = {
    'school-outline': '📚',
    'flame-outline': '🔥',
    'star-outline': '⭐',
    'medal-outline': '🏅',
    'camera-outline': '📷',
    'cube-outline': '🧊',
    'list-outline': '📋',
    'trending-up-outline': '📈',
    'chevron-forward': '➡️',
    'fitness-outline': '💪',
  };
  return iconMap[iconName] || '❓';
};

export default function HomeScreen({ navigation }) {
  const [userStats, setUserStats] = useState({
    totalLessons: 0,
    currentStreak: 0,
    totalPoints: 0,
    badges: 0
  });

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        setUserStats(JSON.parse(stats));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const StatCard = ({ icon, title, value, color }) => (
    <Animatable.View animation="fadeInUp" duration={800} style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <Text style={{ fontSize: 24 }}>{getIconEmoji(icon)}</Text>
      </View>
      <View style={styles.statTextContainer}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </Animatable.View>
  );

  const ActionButton = ({ icon, title, subtitle, color, onPress, delay = 0 }) => (
    <Animatable.View animation="fadeInUp" delay={delay} duration={800}>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: color }]} onPress={onPress}>
        <View style={styles.actionIconContainer}>
          <Text style={{ fontSize: 32 }}>{getIconEmoji(icon)}</Text>
        </View>
        <View style={styles.actionTextContainer}>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <Text style={{ fontSize: 24 }}>{getIconEmoji('chevron-forward')}</Text>
      </TouchableOpacity>
    </Animatable.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animatable.View animation="fadeInDown" duration={800} style={styles.header}>
          <Text style={styles.welcomeText}>Welcome Back!</Text>
          <Text style={styles.headerSubtitle}>Ready for your self-defense training?</Text>
        </Animatable.View>

      
        <View style={styles.statsContainer}>
          <StatCard 
            icon="school-outline" 
            title="Lessons Completed" 
            value={userStats.totalLessons} 
            color="#3498DB" 
          />
          <StatCard 
            icon="flame-outline" 
            title="Current Streak" 
            value={`${userStats.currentStreak} days`} 
            color="#E74C3C" 
          />
          <StatCard 
            icon="star-outline" 
            title="Total Points" 
            value={userStats.totalPoints} 
            color="#F39C12" 
          />
          <StatCard 
            icon="medal-outline" 
            title="Badges Earned" 
            value={userStats.badges} 
            color="#27AE60" 
          />
        </View>

    
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Training Modes</Text>
          
          <ActionButton
            icon="camera-outline"
            title="Computer Vision Mode"
            subtitle="Real-time pose detection training"
            color="#8E44AD"
            onPress={() => navigation.navigate('Lessons', { screen: 'ComputerVisionMode' })}
            delay={200}
          />

          <ActionButton
            icon="cube-outline"
            title="AR/VR Mode"
            subtitle="Immersive 3D training experience"
            color="#E67E22"
            onPress={() => navigation.navigate('Lessons', { screen: 'ARVRMode' })}
            delay={400}
          />

          <ActionButton
            icon="list-outline"
            title="Browse All Lessons"
            subtitle="Choose from available training modules"
            color="#2C3E50"
            onPress={() => navigation.navigate('Lessons')}
            delay={600}
          />

          <ActionButton
            icon="trending-up-outline"
            title="View Progress"
            subtitle="Track your improvement and achievements"
            color="#16A085"
            onPress={() => navigation.navigate('Progress')}
            delay={800}
          />
        </View>

       
        <Animatable.View animation="fadeInUp" delay={1000} duration={800} style={styles.motivationContainer}>
          <Text style={{ fontSize: 40 }}>{getIconEmoji('fitness-outline')}</Text>
          <Text style={styles.motivationTitle}>Daily Training Tip</Text>
          <Text style={styles.motivationText}>
            "Practice makes perfect. Consistency in training builds muscle memory for effective self-defense techniques."
          </Text>
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECF0F1',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#34495E',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: (width - 60) / 2,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    marginRight: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  actionIconContainer: {
    marginRight: 15,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  motivationContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 25,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  motivationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginTop: 10,
    marginBottom: 10,
  },
  motivationText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    lineHeight: 20,
  },
});