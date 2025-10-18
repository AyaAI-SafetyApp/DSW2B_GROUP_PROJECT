import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to get emoji for icon names
const getIconEmoji = (iconName) => {
  const emojiMap = {
    'help-circle-outline': '❓',
    'checkmark': '✅',
    'time-outline': '⏰',
    'locate-outline': '📍',
    'trophy-outline': '🏆',
    'star-outline': '⭐',
    'flame-outline': '🔥',
    'calendar-outline': '📅',
    'bar-chart-outline': '📊',
    'camera-outline': '📷',
    'cube-outline': '🧊'
  };
  return emojiMap[iconName] || '❓';
};

const screenWidth = Dimensions.get('window').width;

const chartConfig = {
  backgroundColor: '#FFFFFF',
  backgroundGradientFrom: '#FFFFFF',
  backgroundGradientTo: '#FFFFFF',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(52, 152, 219, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(44, 62, 80, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#3498DB',
  },
};

export default function ProgressDashboardScreen() {
  const [userStats, setUserStats] = useState({
    totalLessons: 0,
    currentStreak: 0,
    totalPoints: 0,
    badges: 0
  });
  const [lessonHistory, setLessonHistory] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState([]);
  const [badges, setBadges] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      // Load user stats
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        setUserStats(JSON.parse(stats));
      }

      // Load lesson history
      const history = await AsyncStorage.getItem('lessonHistory');
      if (history) {
        const historyData = JSON.parse(history);
        setLessonHistory(historyData);
        generateWeeklyProgress(historyData);
      }

      // Generate badges based on achievements
      generateBadges();

    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const generateWeeklyProgress = (history) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayLessons = history.filter(lesson => 
        lesson.completedAt.split('T')[0] === dateString
      );
      
      last7Days.push({
        date: dateString,
        lessons: dayLessons.length,
        points: dayLessons.reduce((sum, lesson) => sum + lesson.score, 0),
        accuracy: dayLessons.length > 0 
          ? Math.round(dayLessons.reduce((sum, lesson) => sum + lesson.accuracy, 0) / dayLessons.length)
          : 0
      });
    }
    
    setWeeklyProgress(last7Days);
  };

  const generateBadges = () => {
    const badgeList = [
      {
        id: 1,
        name: 'First Steps',
        description: 'Complete your first lesson',
        icon: 'star',
        color: '#F39C12',
        earned: userStats.totalLessons >= 1
      },
      {
        id: 2,
        name: 'Dedicated Learner',
        description: 'Complete 5 lessons',
        icon: 'school-outline',
        color: '#3498DB',
        earned: userStats.totalLessons >= 5
      },
      {
        id: 3,
        name: 'Point Master',
        description: 'Earn 500 points',
        icon: 'star-outline',
        color: '#E74C3C',
        earned: userStats.totalPoints >= 500
      },
      {
        id: 4,
        name: 'Streak Master',
        description: 'Maintain a 7-day streak',
        icon: 'flame-outline',
        color: '#E67E22',
        earned: userStats.currentStreak >= 7
      },
      {
        id: 5,
        name: 'Self-Defense Expert',
        description: 'Complete 10 lessons',
        icon: 'shield-outline',
        color: '#8E44AD',
        earned: userStats.totalLessons >= 10
      }
    ];
    
    setBadges(badgeList);
  };

  const StatCard = ({ icon, title, value, color, subtitle, delay = 0 }) => (
    <Animatable.View animation="fadeInUp" delay={delay} duration={800} style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statIconContainer}>
        <Text style={{ fontSize: 32, color }}>
          {getIconEmoji(icon)}
        </Text>
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </Animatable.View>
  );

  const BadgeItem = ({ badge, index }) => (
    <Animatable.View 
      animation="fadeInRight" 
      delay={index * 100} 
      duration={600}
      style={[styles.badgeCard, { opacity: badge.earned ? 1 : 0.4 }]}
    >
      <View style={[styles.badgeIcon, { backgroundColor: badge.color }]}> 
        <Text style={{ fontSize: 24, color: '#FFFFFF' }}>
          {getIconEmoji(badge.icon)}
        </Text>
        {badge.earned && (
          <View style={styles.earnedIndicator}>
            <Text style={{ fontSize: 12, color: '#FFFFFF' }}>
              {getIconEmoji('checkmark')}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.badgeInfo}>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
      </View>
    </Animatable.View>
  );

  const renderRecentLesson = ({ item, index }) => (
    <Animatable.View animation="fadeInUp" delay={index * 50} duration={500} style={styles.lessonHistoryCard}>
      <View style={[styles.modeIndicator, { 
        backgroundColor: item.mode === 'computer_vision' ? '#8E44AD' : '#E67E22' 
      }]}>
        <Text style={{ fontSize: 16, color: '#FFFFFF' }}>
          {item.mode === 'computer_vision' ? getIconEmoji('camera-outline') : getIconEmoji('cube-outline')}
        </Text>
      </View>
      <View style={styles.lessonInfo}>
        <Text style={styles.lessonTitle}>Lesson #{item.lessonId}</Text>
        <Text style={styles.lessonDate}>
          {new Date(item.completedAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.lessonStats}>
        <Text style={styles.lessonScore}>{item.score}pts</Text>
        <Text style={styles.lessonAccuracy}>{item.accuracy}%</Text>
      </View>
    </Animatable.View>
  );

  // Chart data preparation
  const progressData = {
    labels: weeklyProgress.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en', { weekday: 'short' });
    }),
    datasets: [{
      data: weeklyProgress.map(day => day.lessons),
      strokeWidth: 3,
    }]
  };

  const accuracyData = {
    labels: weeklyProgress.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en', { weekday: 'short' });
    }),
    datasets: [{
      data: weeklyProgress.map(day => day.accuracy / 100),
    }]
  };

  const getTotalTrainingTime = () => {
    // Calculate total training time from lesson history
    const totalTime = lessonHistory.reduce((sum, lesson) => sum + (lesson.timeElapsed || 0), 0);
    const hours = Math.floor(totalTime / 3600);
    const minutes = Math.floor((totalTime % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const getAverageAccuracy = () => {
    if (lessonHistory.length === 0) return 0;
    const totalAccuracy = lessonHistory.reduce((sum, lesson) => sum + lesson.accuracy, 0);
    return Math.round(totalAccuracy / lessonHistory.length);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Progress Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your self-defense journey</Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard 
            icon="school" 
            title="Lessons Completed" 
            value={userStats.totalLessons}
            subtitle="Keep learning!"
            color="#3498DB" 
            delay={0}
          />
          <StatCard 
            icon="local-fire-department" 
            title="Current Streak" 
            value={`${userStats.currentStreak}`}
            subtitle="days in a row"
            color="#E74C3C" 
            delay={100}
          />
          <StatCard 
            icon="stars" 
            title="Total Points" 
            value={userStats.totalPoints.toLocaleString()}
            subtitle="points earned"
            color="#F39C12" 
            delay={200}
          />
          <StatCard 
            icon="military-tech" 
            title="Badges Earned" 
            value={badges.filter(b => b.earned).length}
            subtitle={`of ${badges.length} badges`}
            color="#27AE60" 
            delay={300}
          />
        </View>

        {/* Weekly Progress Chart */}
        <Animatable.View animation="fadeInUp" delay={400} duration={800} style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Weekly Training Activity</Text>
          <View style={styles.weeklyBars}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
              <View key={day} style={styles.dayBar}>
                <View 
                  style={[
                    styles.dayBarFill, 
                    { 
                      height: Math.max(weeklyProgress[index] * 20, 5),
                      backgroundColor: weeklyProgress[index] > 0 ? '#3498DB' : '#ECF0F1'
                    }
                  ]} 
                />
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            ))}
          </View>
        </Animatable.View>

        {/* Training Summary */}
        <Animatable.View animation="fadeInUp" delay={500} duration={800} style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Training Summary</Text>
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 32, color: '#16A085' }}>
                {getIconEmoji('time-outline')}
              </Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
              <Text style={styles.summaryValue}>{getTotalTrainingTime()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={{ fontSize: 32, color: '#27AE60' }}>
                {getIconEmoji('locate-outline')}
              </Text>
              <Text style={styles.summaryLabel}>Avg Accuracy</Text>
              <Text style={styles.summaryValue}>{getAverageAccuracy()}%</Text>
            </View>
          </View>
        </Animatable.View>

        {/* Badges Section */}
        <View style={styles.badgesContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <FlatList
            data={badges}
            renderItem={({ item, index }) => <BadgeItem badge={item} index={index} />}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
          />
        </View>

        {/* Recent Lessons */}
        <View style={styles.recentLessonsContainer}>
          <Text style={styles.sectionTitle}>Recent Training Sessions</Text>
          <FlatList
            data={lessonHistory.slice(-5).reverse()}
            renderItem={renderRecentLesson}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
          />
        </View>
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
  headerTitle: {
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    width: (screenWidth - 60) / 2,
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
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  statTitle: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#95A5A6',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
    textAlign: 'center',
  },
  chart: {
    borderRadius: 16,
  },
  badgesContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  earnedIndicator: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#27AE60',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeInfo: {
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  recentLessonsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  lessonHistoryCard: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  lessonDate: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  lessonStats: {
    alignItems: 'flex-end',
  },
  lessonScore: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F39C12',
  },
  lessonAccuracy: {
    fontSize: 12,
    color: '#27AE60',
    marginTop: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8EBF0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  simpleChart: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 12,
    textAlign: 'center',
  },
});