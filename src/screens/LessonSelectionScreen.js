import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// Ionicons removed. Use emoji for icons.
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');


const getIconEmoji = (iconName) => {
  const iconMap = {
    'shield-outline': '🛡️',
    'hand-left-outline': '🤚',
    'walk-outline': '🚶',
    'lock-open-outline': '🔓',
    'fitness-outline': '💪',
    'person-remove-outline': '🚫',
    'checkmark': '✅',
    'time-outline': '⏰',
    'star': '⭐',
    'play-outline': '▶️',
  };
  return iconMap[iconName] || '❓';
};

const SELF_DEFENSE_LESSONS = [
  {
    id: 1,
    title: 'Basic Defensive Stance',
    description: 'Learn the fundamental defensive position for self-defense',
    difficulty: 'Beginner',
    duration: '5 min',
    points: 100,
    poses: ['standing', 'guard_position'],
    category: 'basics',
    icon: 'shield-outline',
    color: '#3498DB'
  },
  {
    id: 2,
    title: 'Palm Strike Defense',
    description: 'Master the palm strike technique for close-range defense',
    difficulty: 'Beginner',
    duration: '7 min',
    points: 150,
    poses: ['guard_position', 'palm_strike'],
    category: 'strikes',
    icon: 'hand-left-outline',
    color: '#E74C3C'
  },
  {
    id: 3,
    title: 'Front Kick Technique',
    description: 'Learn proper front kick form and application',
    difficulty: 'Intermediate',
    duration: '8 min',
    points: 200,
    poses: ['standing', 'kick_preparation', 'front_kick'],
    category: 'kicks',
    icon: 'walk-outline',
    color: '#F39C12'
  },
  {
    id: 4,
    title: 'Wrist Grab Escape',
    description: 'Effective techniques to break free from wrist grabs',
    difficulty: 'Intermediate',
    duration: '10 min',
    points: 250,
    poses: ['grabbed_position', 'escape_motion'],
    category: 'escapes',
    icon: 'lock-open-outline',
    color: '#9B59B6'
  },
  {
    id: 5,
    title: 'Elbow Strike Defense',
    description: 'Close-quarters elbow strike techniques',
    difficulty: 'Intermediate',
    duration: '6 min',
    points: 180,
    poses: ['guard_position', 'elbow_strike'],
    category: 'strikes',
    icon: 'fitness-outline',
    color: '#E67E22'
  },
  {
    id: 6,
    title: 'Bear Hug Escape',
    description: 'Break free from rear bear hug attacks',
    difficulty: 'Advanced',
    duration: '12 min',
    points: 300,
    poses: ['grabbed_rear', 'hip_movement', 'counter_attack'],
    category: 'escapes',
    icon: 'person-remove-outline',
    color: '#1ABC9C'
  }
];

export default function LessonSelectionScreen({ navigation }) {
  const [completedLessons, setCompletedLessons] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCompletedLessons();
  }, []);

  const loadCompletedLessons = async () => {
    try {
      const completed = await AsyncStorage.getItem('completedLessons');
      if (completed) {
        setCompletedLessons(JSON.parse(completed));
      }
    } catch (error) {
      console.error('Error loading completed lessons:', error);
    }
  };

  const filterLessons = () => {
    if (filter === 'all') return SELF_DEFENSE_LESSONS;
    return SELF_DEFENSE_LESSONS.filter(lesson => lesson.category === filter);
  };

  const isLessonCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  const startLesson = (lesson, mode) => {
    Alert.alert(
      'Select Training Mode',
      'Choose how you want to practice this lesson:',
      [
        {
          text: 'Computer Vision',
          onPress: () => navigation.navigate('ComputerVisionMode', { lesson }),
        },
        {
          text: 'AR/VR Mode',
          onPress: () => navigation.navigate('ARVRMode', { lesson }),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const FilterButton = ({ category, title, isActive }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.activeFilterButton]}
      onPress={() => setFilter(category)}
    >
      <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Beginner': return '#27AE60';
      case 'Intermediate': return '#F39C12';
      case 'Advanced': return '#E74C3C';
      default: return '#7F8C8D';
    }
  };

  const renderLessonItem = ({ item, index }) => {
    const completed = isLessonCompleted(item.id);
    
    return (
      <Animatable.View
        animation="fadeInUp"
        delay={index * 100}
        duration={600}
        style={styles.lessonCard}
      >
        <TouchableOpacity
          onPress={() => startLesson(item)}
          style={[styles.lessonContent, completed && styles.completedLesson]}
        >
          <View style={[styles.lessonIconContainer, { backgroundColor: item.color }]}>
            <Text style={{ fontSize: 32 }}>{getIconEmoji(item.icon)}</Text>
            {completed && (
              <View style={styles.completedBadge}>
                <Text style={{ fontSize: 16 }}>{getIconEmoji('checkmark')}</Text>
              </View>
            )}
          </View>

          <View style={styles.lessonInfo}>
            <Text style={styles.lessonTitle}>{item.title}</Text>
            <Text style={styles.lessonDescription}>{item.description}</Text>
            
            <View style={styles.lessonMeta}>
              <View style={styles.metaItem}>
                <Text style={{ fontSize: 16 }}>{getIconEmoji('time-outline')}</Text>
                <Text style={styles.metaText}>{item.duration}</Text>
              </View>
              
              <View style={styles.metaItem}>
                            <Text style={{ fontSize: 16 }}>{getIconEmoji('star')}</Text>
                <Text style={styles.metaText}>{item.points} pts</Text>
              </View>
              
              <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                <Text style={styles.difficultyText}>{item.difficulty}</Text>
              </View>
            </View>
          </View>

                      <Text style={{ fontSize: 20, marginRight: 8 }}>{getIconEmoji('play-outline')}</Text>
        </TouchableOpacity>
      </Animatable.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Self-Defense Lessons</Text>
        <Text style={styles.headerSubtitle}>Choose your training module</Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <FilterButton category="all" title="All" isActive={filter === 'all'} />
        <FilterButton category="basics" title="Basics" isActive={filter === 'basics'} />
        <FilterButton category="strikes" title="Strikes" isActive={filter === 'strikes'} />
        <FilterButton category="kicks" title="Kicks" isActive={filter === 'kicks'} />
        <FilterButton category="escapes" title="Escapes" isActive={filter === 'escapes'} />
      </View>

      <FlatList
        data={filterLessons()}
        renderItem={renderLessonItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
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
    paddingVertical: 20,
    backgroundColor: '#34495E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#BDC3C7',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ECF0F1',
  },
  activeFilterButton: {
    backgroundColor: '#3498DB',
  },
  filterText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 20,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lessonContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  completedLesson: {
    opacity: 0.8,
    backgroundColor: '#F8F9FA',
  },
  lessonIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  completedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#27AE60',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 10,
    lineHeight: 18,
  },
  lessonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  difficultyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});