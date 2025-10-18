import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
// import Icon from 'react-native-vector-icons/MaterialIcons';
// import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

// Helper function to get emoji for icon names
const getIconEmoji = (iconName) => {
  const emojiMap = {
    'help-circle-outline': '❓',
    'flame-outline': '🔥',
    'checkmark': '✅',
    'time-outline': '⏰',
    'star-outline': '⭐',
    'play-outline': '▶️',
    'close-circle': '❌',
    'checkmark-circle': '✅',
    'warning': '⚠️',
    'information-circle': 'ℹ️',
    'alert-circle': '🚨'
  };
  return emojiMap[iconName] || '❓';
};

/**
 * Badge Unlock Modal Component
 * Shows celebration animation when user unlocks a new badge
 */
export const BadgeUnlockModal = ({ visible, badge, onClose }) => {
  if (!badge) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animatable.View
          animation="bounceIn"
          duration={800}
          style={styles.badgeModalContent}
        >
          <Animatable.Text
            animation="flash"
            iterationCount={3}
            style={styles.congratsText}
          >
            🎉 BADGE UNLOCKED! 🎉
          </Animatable.Text>
          
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            style={[styles.badgeIcon, { backgroundColor: badge.color }]}
          >
            <Text style={{ fontSize: 48, color: '#FFFFFF' }}>
              {getIconEmoji(badge.icon)}
            </Text>
          </Animatable.View>
          
          <Text style={styles.badgeName}>{badge.name}</Text>
          <Text style={styles.badgeDescription}>{badge.description}</Text>
          <Text style={styles.badgePoints}>+{badge.points} bonus points!</Text>
          
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Awesome!</Text>
          </TouchableOpacity>
        </Animatable.View>
      </View>
    </Modal>
  );
};

/**
 * Progress Circle Component
 * Animated circular progress indicator (simplified version)
 */
export const ProgressCircle = ({ progress, size = 100, strokeWidth = 8, color = '#3498DB' }) => {
  return (
    <View style={[styles.progressCircle, { width: size, height: size }]}>
      <View style={[styles.progressCircleBackground, { 
        width: size, 
        height: size, 
        borderRadius: size / 2,
        borderWidth: strokeWidth,
        borderColor: '#ECF0F1'
      }]}>
        <View style={[styles.progressCircleFill, {
          width: size - strokeWidth * 2,
          height: size - strokeWidth * 2,
          borderRadius: (size - strokeWidth * 2) / 2,
          backgroundColor: progress > 0 ? color : 'transparent',
          opacity: progress / 100
        }]} />
      </View>
      <View style={styles.progressText}>
        <Text style={[styles.progressPercentage, { color }]}>{Math.round(progress)}%</Text>
      </View>
    </View>
  );
};

/**
 * Accuracy Meter Component
 * Visual representation of pose accuracy
 */
export const AccuracyMeter = ({ accuracy, size = 120 }) => {
  const getColor = (acc) => {
    if (acc >= 90) return '#27AE60';
    if (acc >= 80) return '#F39C12';
    if (acc >= 70) return '#E67E22';
    return '#E74C3C';
  };

  const color = getColor(accuracy);

  return (
    <View style={styles.accuracyMeter}>
      <ProgressCircle 
        progress={accuracy} 
        size={size} 
        color={color}
        strokeWidth={10}
      />
      <Text style={[styles.accuracyLabel, { color }]}>
        {accuracy >= 90 ? 'Excellent' : 
         accuracy >= 80 ? 'Great' : 
         accuracy >= 70 ? 'Good' : 'Practice'}
      </Text>
    </View>
  );
};

/**
 * Streak Flame Component
 * Animated flame icon for streak display
 */
export const StreakFlame = ({ streak, size = 32 }) => {
  const getFlameColor = (streakDays) => {
    if (streakDays >= 30) return '#C0392B'; // Dark red for 30+ days
    if (streakDays >= 14) return '#E74C3C'; // Red for 14+ days
    if (streakDays >= 7) return '#E67E22';  // Orange for 7+ days
    if (streakDays >= 3) return '#F39C12';  // Yellow for 3+ days
    return '#BDC3C7'; // Gray for less than 3 days
  };

  const color = getFlameColor(streak);

  return (
    <Animatable.View
      animation={streak > 0 ? "pulse" : undefined}
      iterationCount="infinite"
      style={styles.streakFlame}
    >
      <Text style={{ fontSize: size, color }}>{getIconEmoji('flame-outline')}</Text>
      {streak > 0 && (
        <View style={[styles.streakBadge, { backgroundColor: color }]}>
          <Text style={styles.streakNumber}>{streak}</Text>
        </View>
      )}
    </Animatable.View>
  );
};

/**
 * Lesson Card Component
 * Reusable card for displaying lesson information
 */
export const LessonCard = ({ 
  lesson, 
  onPress, 
  isCompleted = false, 
  showProgress = false,
  progress = 0 
}) => {
  return (
    <Animatable.View animation="fadeInUp" duration={600} style={styles.lessonCard}>
      <TouchableOpacity
        onPress={onPress}
        style={[styles.lessonCardContent, isCompleted && styles.completedLesson]}
      >
        <View style={[styles.lessonIcon, { backgroundColor: lesson.color }]}>
          <Text style={{ fontSize: 28, color: '#FFFFFF' }}>
            {getIconEmoji(lesson.icon)}
          </Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={{ fontSize: 14, color: '#FFFFFF' }}>
                {getIconEmoji('checkmark')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.lessonInfo}>
          <Text style={styles.lessonTitle}>{lesson.title}</Text>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>
          
          {showProgress && (
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          )}
          
          <View style={styles.lessonMeta}>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: '#7F8C8D' }}>
                {getIconEmoji('time-outline')}
              </Text>
              <Text style={styles.metaText}>{lesson.duration}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={{ fontSize: 14, color: '#F39C12' }}>
                {getIconEmoji('star-outline')}
              </Text>
              <Text style={styles.metaText}>{lesson.points} pts</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 24, color: lesson.color }}>
          {getIconEmoji('play-outline')}
        </Text>
      </TouchableOpacity>
    </Animatable.View>
  );
};

/**
 * Loading Spinner Component
 * Custom loading indicator with message
 */
export const LoadingSpinner = ({ message = 'Loading...', color = '#3498DB' }) => {
  return (
    <View style={styles.loadingContainer}>
      <Animatable.View
        animation="rotate"
        iterationCount="infinite"
        duration={1000}
        style={[styles.spinner, { borderTopColor: color }]}
      />
      <Text style={[styles.loadingText, { color }]}>{message}</Text>
    </View>
  );
};

/**
 * Feedback Toast Component
 * Temporary feedback message overlay
 */
export const FeedbackToast = ({ visible, message, type = 'info', onHide }) => {
  const getToastColor = (toastType) => {
    switch (toastType) {
      case 'success': return '#27AE60';
      case 'error': return '#E74C3C';
      case 'warning': return '#F39C12';
      default: return '#3498DB';
    }
  };

  const getToastIcon = (toastType) => {
    switch (toastType) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  if (!visible) return null;

  setTimeout(() => {
    if (onHide) onHide();
  }, 3000);

  return (
    <Animatable.View
      animation="slideInDown"
      duration={300}
      style={[styles.toast, { backgroundColor: getToastColor(type) }]}
    >
      <Text style={{ fontSize: 20, color: '#FFFFFF' }}>
        {getToastIcon(type)}
      </Text>
      <Text style={styles.toastText}>{message}</Text>
    </Animatable.View>
  );
};

const styles = StyleSheet.create({
  // Badge Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  badgeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  congratsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  badgeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 10,
    textAlign: 'center',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  badgePoints: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F39C12',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#3498DB',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 20,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Progress Circle Styles
  progressCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleBackground: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircleFill: {
    // Visual fill for progress indication
  },
  progressText: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Accuracy Meter Styles
  accuracyMeter: {
    alignItems: 'center',
  },
  accuracyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },

  // Streak Flame Styles
  streakFlame: {
    position: 'relative',
    alignItems: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  streakNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Lesson Card Styles
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
  lessonCardContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  completedLesson: {
    opacity: 0.8,
    backgroundColor: '#F8F9FA',
  },
  lessonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  lessonDescription: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 8,
    lineHeight: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#ECF0F1',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 2,
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
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },

  // Loading Spinner Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: '#ECF0F1',
    borderTopColor: '#3498DB',
    borderRadius: 20,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },

  // Toast Styles
  toast: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
});