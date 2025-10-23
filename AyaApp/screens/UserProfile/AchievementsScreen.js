import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AchievementsScreen({ navigation }) {
  const [achievements, setAchievements] = useState([
    { 
      id: 1, 
      title: 'Safety First', 
      description: 'Complete your safety profile', 
      icon: 'shield-checkmark', 
      unlocked: true,
      points: 50,
      date: '2025-10-20'
    },
    { 
      id: 2, 
      title: 'Guardian Angel', 
      description: 'Add 3 emergency contacts', 
      icon: 'people', 
      unlocked: true,
      points: 100,
      date: '2025-10-21'
    },
    { 
      id: 3, 
      title: 'Location Master', 
      description: 'Enable location sharing', 
      icon: 'location', 
      unlocked: true,
      points: 75,
      date: '2025-10-22'
    },
    { 
      id: 4, 
      title: 'Safety Scholar', 
      description: 'Complete 5 safety lessons', 
      icon: 'school', 
      unlocked: false,
      points: 150,
      progress: '3/5'
    },
    { 
      id: 5, 
      title: 'Community Helper', 
      description: 'Share 10 safety tips', 
      icon: 'heart', 
      unlocked: false,
      points: 200,
      progress: '2/10'
    },
    { 
      id: 6, 
      title: 'Week Warrior', 
      description: 'Use the app for 7 consecutive days', 
      icon: 'calendar', 
      unlocked: false,
      points: 125,
      progress: '4/7 days'
    },
    { 
      id: 7, 
      title: 'Emergency Ready', 
      description: 'Complete emergency drill', 
      icon: 'alert-circle', 
      unlocked: false,
      points: 100
    },
    { 
      id: 8, 
      title: 'Safety Ambassador', 
      description: 'Invite 5 friends to join Aya', 
      icon: 'share-social', 
      unlocked: false,
      points: 250,
      progress: '0/5'
    },
  ]);

  const [stats, setStats] = useState({
    totalPoints: 225,
    level: 2,
    unlockedAchievements: 3,
    totalAchievements: 8,
  });

  const renderAchievementCard = (achievement) => (
    <View 
      key={achievement.id} 
      style={[
        styles.achievementCard, 
        !achievement.unlocked && styles.achievementCardLocked
      ]}
    >
      <View style={[
        styles.iconContainer,
        achievement.unlocked ? styles.iconUnlocked : styles.iconLocked
      ]}>
        <Ionicons 
          name={achievement.icon} 
          size={32} 
          color={achievement.unlocked ? '#FFFFFF' : '#999'} 
        />
      </View>
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          !achievement.unlocked && styles.achievementTitleLocked
        ]}>
          {achievement.title}
        </Text>
        <Text style={styles.achievementDescription}>{achievement.description}</Text>
        {achievement.progress && (
          <Text style={styles.progressText}>{achievement.progress}</Text>
        )}
        <View style={styles.achievementFooter}>
          <View style={styles.pointsBadge}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.pointsText}>{achievement.points} pts</Text>
          </View>
          {achievement.unlocked && achievement.date && (
            <Text style={styles.dateText}>Unlocked {achievement.date}</Text>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FF1493" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.levelBadge}>
            <Ionicons name="ribbon" size={32} color="#FFD700" />
            <Text style={styles.levelText}>Level {stats.level}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.totalPoints}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.unlockedAchievements}/{stats.totalAchievements}
              </Text>
              <Text style={styles.statLabel}>Achievements</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <Text style={styles.progressLabel}>
            Progress to Level {stats.level + 1}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '45%' }]} />
          </View>
          <Text style={styles.progressText}>225/500 points</Text>
        </View>

        {/* Achievements Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unlocked</Text>
          {achievements
            .filter(a => a.unlocked)
            .map(achievement => renderAchievementCard(achievement))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          {achievements
            .filter(a => !a.unlocked)
            .map(achievement => renderAchievementCard(achievement))}
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="trophy-outline" size={24} color="#FF1493" />
          <Text style={styles.infoText}>
            Complete challenges to unlock achievements and earn points. Level up to unlock exclusive rewards!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF1493',
  },
  content: {
    flex: 1,
  },
  statsCard: {
    backgroundColor: 'linear-gradient(135deg, #FF1493 0%, #FFB6D9 100%)',
    backgroundColor: '#FF1493',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  levelBadge: {
    alignItems: 'center',
    marginBottom: 15,
  },
  levelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 5,
  },
  progressSection: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF1493',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    textAlign: 'right',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 20,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  achievementCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconUnlocked: {
    backgroundColor: '#FF1493',
  },
  iconLocked: {
    backgroundColor: '#E0E0E0',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  achievementTitleLocked: {
    color: '#999',
  },
  achievementDescription: {
    fontSize: 13,
    color: '#666',
    marginBottom: 5,
  },
  achievementFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pointsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C00',
    marginLeft: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0F8',
    marginHorizontal: 20,
    marginVertical: 20,
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB6D9',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
