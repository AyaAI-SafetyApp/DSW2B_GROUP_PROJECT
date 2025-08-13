import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const CommunityScreen = () => {
  const navigation = useNavigation();

  const communityPosts = [
    {
      id: 1,
      user: 'Lethabo Scofield.',
      time: '2 hours ago',
      location: 'Nukerk',
      type: 'safety_tip',
      content: 'Just a heads up - there\'s a lot of nyash selling there. Everything seems fine, just wanted to let everyone know!',
      likes: 12,
      comments: 3,
    },
    {
      id: 2,
      user: 'Stakio.',
      time: '4 hours ago',
      location: 'University of Johannesburg',
      type: 'alert',
      content: 'Avoid the parking lot behind the mall tonight. Poor lighting and seems unsafe. they will chow you.',
      likes: 8,
      comments: 5,
    },
    {
      id: 3,
      user: 'Community Safety',
      time: '1 day ago',
      location: 'City Wide',
      type: 'announcement',
      content: 'New safety initiative launched! Emergency response time has improved by 30% in our area. Thank you all for participating!',
      likes: 25,
      comments: 10,
    }
  ];

  const safetyTips = [
    { id: 1, tip: 'Always share your location with trusted contacts when going out alone' },
    { id: 2, tip: 'Trust your instincts - if something feels wrong, leave immediately' },
    { id: 3, tip: 'Keep emergency contacts easily accessible on your phone' },
  ];

  const getPostIcon = (type) => {
    switch (type) {
      case 'safety_tip':
        return { name: 'bulb', color: '#F59E0B' };
      case 'alert':
        return { name: 'warning', color: '#EF4444' };
      case 'announcement':
        return { name: 'megaphone', color: '#3B82F6' };
      default:
        return { name: 'chatbubble', color: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Community</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Safety Tips</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsContainer}>
            {safetyTips.map((tip) => (
              <View key={tip.id} style={styles.tipCard}>
                <Ionicons name="shield-checkmark" size={24} color="#10B981" />
                <Text style={styles.tipText}>{tip.tip}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Community Stats */}
        <View style={styles.section}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>1,247</Text>
              <Text style={styles.statLabel}>Active Members</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>98%</Text>
              <Text style={styles.statLabel}>Safety Rating</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>24/7</Text>
              <Text style={styles.statLabel}>Support</Text>
            </View>
          </View>
        </View>

        {/* Community Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Community Feed</Text>
          {communityPosts.map((post) => {
            const icon = getPostIcon(post.type);
            return (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postUser}>
                    <View style={styles.userAvatar}>
                      <Ionicons name="person" size={16} color="#6366F1" />
                    </View>
                    <View>
                      <Text style={styles.userName}>{post.user}</Text>
                      <Text style={styles.postTime}>{post.time} • {post.location}</Text>
                    </View>
                  </View>
                  <View style={[styles.postTypeIcon, { backgroundColor: `${icon.color}20` }]}>
                    <Ionicons name={icon.name} size={16} color={icon.color} />
                  </View>
                </View>
                
                <Text style={styles.postContent}>{post.content}</Text>
                
                <View style={styles.postActions}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="heart-outline" size={18} color="#6B7280" />
                    <Text style={styles.actionText}>{post.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
                    <Text style={styles.actionText}>{post.comments}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-outline" size={18} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>

        {/* Report Something */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.reportButton}>
            <Ionicons name="flag" size={20} color="#EF4444" />
            <Text style={styles.reportText}>Report a Safety Concern</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  tipsContainer: {
    marginBottom: 8,
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 200,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  postTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  postTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 32,
  },
  reportText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
});

export default CommunityScreen;
