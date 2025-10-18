import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Gamification Service for Self-Defense Training App
 * Handles points, badges, streaks, and achievements
 */
class GamificationService {
  constructor() {
    this.achievements = this.initializeAchievements();
    this.pointMultipliers = {
      computer_vision: 1.0,
      ar_vr: 1.2, // 20% bonus for AR/VR mode
      perfect_accuracy: 1.5, // 50% bonus for perfect form
      streak_bonus: 0.1 // 10% per day streak (max 100%)
    };
  }

  /**
   * Initialize achievement definitions
   */
  initializeAchievements() {
    return [
      {
        id: 'first_lesson',
        name: 'First Steps',
        description: 'Complete your first self-defense lesson',
        icon: 'star',
        color: '#F39C12',
        points: 50,
        type: 'milestone',
        requirement: { lessons: 1 },
        unlocked: false
      },
      {
        id: 'lesson_streak_3',
        name: 'Getting Started',
        description: 'Complete lessons for 3 days in a row',
  icon: 'flame-outline',
        color: '#E74C3C',
        points: 100,
        type: 'streak',
        requirement: { streak: 3 },
        unlocked: false
      },
      {
        id: 'lesson_streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day training streak',
  icon: 'flame-outline',
        color: '#E67E22',
        points: 200,
        type: 'streak',
        requirement: { streak: 7 },
        unlocked: false
      },
      {
        id: 'lesson_streak_30',
        name: 'Monthly Master',
        description: 'Train consistently for 30 days',
  icon: 'flame-outline',
        color: '#C0392B',
        points: 500,
        type: 'streak',
        requirement: { streak: 30 },
        unlocked: false
      },
      {
        id: 'lessons_5',
        name: 'Dedicated Learner',
        description: 'Complete 5 different lessons',
  icon: 'school-outline',
        color: '#3498DB',
        points: 150,
        type: 'milestone',
        requirement: { lessons: 5 },
        unlocked: false
      },
      {
        id: 'lessons_10',
        name: 'Self-Defense Student',
        description: 'Complete 10 different lessons',
  icon: 'shield-outline',
        color: '#8E44AD',
        points: 300,
        type: 'milestone',
        requirement: { lessons: 10 },
        unlocked: false
      },
      {
        id: 'lessons_25',
        name: 'Defense Expert',
        description: 'Master 25 self-defense techniques',
  icon: 'medal-outline',
        color: '#27AE60',
        points: 750,
        type: 'milestone',
        requirement: { lessons: 25 },
        unlocked: false
      },
      {
        id: 'points_500',
        name: 'Point Collector',
        description: 'Earn 500 training points',
  icon: 'star-outline',
        color: '#F39C12',
        points: 100,
        type: 'points',
        requirement: { points: 500 },
        unlocked: false
      },
      {
        id: 'points_1000',
        name: 'Point Master',
        description: 'Accumulate 1000 training points',
  icon: 'trophy-outline',
        color: '#E74C3C',
        points: 200,
        type: 'points',
        requirement: { points: 1000 },
        unlocked: false
      },
      {
        id: 'perfect_accuracy_5',
        name: 'Precision Trainee',
        description: 'Achieve perfect accuracy (100%) in 5 lessons',
  icon: 'locate-outline',
        color: '#16A085',
        points: 250,
        type: 'accuracy',
        requirement: { perfectLessons: 5 },
        unlocked: false
      },
      {
        id: 'perfect_accuracy_10',
        name: 'Precision Master',
        description: 'Achieve perfect accuracy (100%) in 10 lessons',
  icon: 'locate-outline',
        color: '#1ABC9C',
        points: 500,
        type: 'accuracy',
        requirement: { perfectLessons: 10 },
        unlocked: false
      },
      {
        id: 'ar_vr_enthusiast',
        name: 'AR/VR Enthusiast',
        description: 'Complete 5 lessons in AR/VR mode',
  icon: 'cube-outline',
        color: '#E67E22',
        points: 300,
        type: 'mode',
        requirement: { arVrLessons: 5 },
        unlocked: false
      },
      {
        id: 'cv_master',
        name: 'Computer Vision Master',
        description: 'Complete 10 lessons in CV mode',
  icon: 'camera-outline',
        color: '#8E44AD',
        points: 250,
        type: 'mode',
        requirement: { cvLessons: 10 },
        unlocked: false
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Complete a lesson in under 2 minutes',
  icon: 'speedometer-outline',
        color: '#E91E63',
        points: 150,
        type: 'speed',
        requirement: { fastCompletion: 120 }, // 2 minutes in seconds
        unlocked: false
      },
      {
        id: 'night_owl',
        name: 'Night Owl',
        description: 'Train between 10 PM and 6 AM',
  icon: 'moon-outline',
        color: '#34495E',
        points: 100,
        type: 'time',
        requirement: { nightTraining: true },
        unlocked: false
      }
    ];
  }

  /**
   * Calculate points for a completed lesson
   * @param {Object} lessonData - Lesson completion data
   * @returns {number} Calculated points
   */
  calculatePoints(lessonData) {
    const { score, accuracy, mode, timeElapsed, currentStreak } = lessonData;
    
    let points = score || 0;
    
    // Mode multiplier
    if (mode === 'ar_vr') {
      points *= this.pointMultipliers.ar_vr;
    }
    
    // Perfect accuracy bonus
    if (accuracy >= 100) {
      points *= this.pointMultipliers.perfect_accuracy;
    }
    
    // Streak bonus (capped at 100% bonus)
    const streakBonus = Math.min(currentStreak * this.pointMultipliers.streak_bonus, 1.0);
    points *= (1 + streakBonus);
    
    // Speed bonus for quick completion (under 3 minutes gets 25% bonus)
    if (timeElapsed && timeElapsed < 180) {
      points *= 1.25;
    }
    
    return Math.round(points);
  }

  /**
   * Award points and check for new achievements
   * @param {Object} lessonData - Lesson completion data
   * @returns {Object} Results including points awarded and new badges
   */
  async awardPoints(lessonData) {
    try {
      const points = this.calculatePoints(lessonData);
      
      // Update user stats
      const stats = await this.getUserStats();
      stats.totalPoints += points;
      stats.totalLessons += 1;
      
      // Update streak
      await this.updateStreak();
      const currentStreak = await this.getCurrentStreak();
      stats.currentStreak = currentStreak;
      
      // Track mode-specific completions
      if (lessonData.mode === 'ar_vr') {
        stats.arVrLessons = (stats.arVrLessons || 0) + 1;
      } else if (lessonData.mode === 'computer_vision') {
        stats.cvLessons = (stats.cvLessons || 0) + 1;
      }
      
      // Track perfect accuracy lessons
      if (lessonData.accuracy >= 100) {
        stats.perfectLessons = (stats.perfectLessons || 0) + 1;
      }
      
      // Check for new achievements
      const newBadges = await this.checkAchievements(stats, lessonData);
      stats.badges = await this.getUnlockedBadgesCount();
      
      // Save updated stats
      await AsyncStorage.setItem('userStats', JSON.stringify(stats));
      
      return {
        pointsAwarded: points,
        totalPoints: stats.totalPoints,
        newBadges,
        currentStreak: stats.currentStreak
      };
      
    } catch (error) {
      console.error('Error awarding points:', error);
      throw error;
    }
  }

  /**
   * Check for newly unlocked achievements
   * @param {Object} userStats - Current user statistics
   * @param {Object} lessonData - Recent lesson data
   * @returns {Array} Newly unlocked badges
   */
  async checkAchievements(userStats, lessonData) {
    const newBadges = [];
    
    try {
      const unlockedBadges = await this.getUnlockedBadges();
      
      for (const achievement of this.achievements) {
        // Skip if already unlocked
        if (unlockedBadges.includes(achievement.id)) {
          continue;
        }
        
        let shouldUnlock = false;
        
        switch (achievement.type) {
          case 'milestone':
            shouldUnlock = userStats.totalLessons >= achievement.requirement.lessons;
            break;
            
          case 'streak':
            shouldUnlock = userStats.currentStreak >= achievement.requirement.streak;
            break;
            
          case 'points':
            shouldUnlock = userStats.totalPoints >= achievement.requirement.points;
            break;
            
          case 'accuracy':
            shouldUnlock = (userStats.perfectLessons || 0) >= achievement.requirement.perfectLessons;
            break;
            
          case 'mode':
            if (achievement.requirement.arVrLessons) {
              shouldUnlock = (userStats.arVrLessons || 0) >= achievement.requirement.arVrLessons;
            } else if (achievement.requirement.cvLessons) {
              shouldUnlock = (userStats.cvLessons || 0) >= achievement.requirement.cvLessons;
            }
            break;
            
          case 'speed':
            shouldUnlock = lessonData.timeElapsed <= achievement.requirement.fastCompletion;
            break;
            
          case 'time':
            if (achievement.requirement.nightTraining) {
              const hour = new Date().getHours();
              shouldUnlock = hour >= 22 || hour <= 6;
            }
            break;
        }
        
        if (shouldUnlock) {
          await this.unlockBadge(achievement.id);
          newBadges.push(achievement);
        }
      }
      
      return newBadges;
      
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    }
  }

  /**
   * Get current user statistics
   * @returns {Object} User stats
   */
  async getUserStats() {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      return stats ? JSON.parse(stats) : {
        totalLessons: 0,
        currentStreak: 0,
        totalPoints: 0,
        badges: 0,
        arVrLessons: 0,
        cvLessons: 0,
        perfectLessons: 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      return {
        totalLessons: 0,
        currentStreak: 0,
        totalPoints: 0,
        badges: 0,
        arVrLessons: 0,
        cvLessons: 0,
        perfectLessons: 0
      };
    }
  }

  /**
   * Update user's training streak
   */
  async updateStreak() {
    try {
      const today = new Date().toDateString();
      const lastTrainingDate = await AsyncStorage.getItem('lastTrainingDate');
      const currentStreak = await this.getCurrentStreak();
      
      if (lastTrainingDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastTrainingDate === yesterday.toDateString()) {
          // Continue streak
          await AsyncStorage.setItem('currentStreak', String(currentStreak + 1));
        } else if (lastTrainingDate === today) {
          // Same day, don't change streak
        } else {
          // Streak broken, reset to 1
          await AsyncStorage.setItem('currentStreak', '1');
        }
        
        await AsyncStorage.setItem('lastTrainingDate', today);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  }

  /**
   * Get current training streak
   * @returns {number} Current streak days
   */
  async getCurrentStreak() {
    try {
      const streak = await AsyncStorage.getItem('currentStreak');
      return streak ? parseInt(streak) : 0;
    } catch (error) {
      console.error('Error getting current streak:', error);
      return 0;
    }
  }

  /**
   * Unlock a badge
   * @param {string} badgeId - Badge identifier
   */
  async unlockBadge(badgeId) {
    try {
      const unlockedBadges = await this.getUnlockedBadges();
      if (!unlockedBadges.includes(badgeId)) {
        unlockedBadges.push(badgeId);
        await AsyncStorage.setItem('unlockedBadges', JSON.stringify(unlockedBadges));
      }
    } catch (error) {
      console.error('Error unlocking badge:', error);
    }
  }

  /**
   * Get list of unlocked badge IDs
   * @returns {Array} Unlocked badge IDs
   */
  async getUnlockedBadges() {
    try {
      const badges = await AsyncStorage.getItem('unlockedBadges');
      return badges ? JSON.parse(badges) : [];
    } catch (error) {
      console.error('Error getting unlocked badges:', error);
      return [];
    }
  }

  /**
   * Get count of unlocked badges
   * @returns {number} Number of unlocked badges
   */
  async getUnlockedBadgesCount() {
    const unlockedBadges = await this.getUnlockedBadges();
    return unlockedBadges.length;
  }

  /**
   * Get all achievement definitions with unlock status
   * @returns {Array} Achievement data with unlock status
   */
  async getAchievementsWithStatus() {
    try {
      const unlockedBadges = await this.getUnlockedBadges();
      
      return this.achievements.map(achievement => ({
        ...achievement,
        unlocked: unlockedBadges.includes(achievement.id)
      }));
    } catch (error) {
      console.error('Error getting achievements with status:', error);
      return this.achievements;
    }
  }

  /**
   * Get user's current level based on points
   * @param {number} totalPoints - User's total points
   * @returns {Object} Level information
   */
  getUserLevel(totalPoints) {
    const level = Math.floor(totalPoints / 100) + 1;
    const pointsToNextLevel = (level * 100) - totalPoints;
    const progressToNextLevel = ((totalPoints % 100) / 100) * 100;
    
    return {
      level,
      pointsToNextLevel,
      progressToNextLevel,
      currentLevelPoints: totalPoints % 100
    };
  }

  /**
   * Reset all gamification data (for testing or user request)
   */
  async resetProgress() {
    try {
      await AsyncStorage.multiRemove([
        'userStats',
        'unlockedBadges',
        'currentStreak',
        'lastTrainingDate'
      ]);
    } catch (error) {
      console.error('Error resetting gamification progress:', error);
      throw error;
    }
  }
}

export default GamificationService;