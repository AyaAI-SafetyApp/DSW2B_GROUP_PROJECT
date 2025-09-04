import React, { useState, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  StatusBar,
} from "react-native";
import PostCard from "./PostCard";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

// Clean neutral colors
const COLORS = {
  background: "#FFFFFF",
  text: "#262626",
  textSecondary: "#8E8E8E",
  border: "#EFEFEF",
  black: "#000000",
};

const DUMMY_POSTS = [
  {
    id: "2",
    username: "community_watch",
    timestamp: Date.now() - 7200000,
    location: "Greenside Park",
    content: "Community gathering at the park. Everyone welcome! 🌳",
    media: [
      {
        type: "image",
        uri: "https://images.theconversation.com/files/423587/original/file-20210928-22-12e4587.jpg?ixlib=rb-4.1.0&q=45&auto=format&w=926&fit=clip",
      },
    ],
    reactions: [{ type: "like", count: 156 }],
    comments: [
      { id: "c3", username: "park_visitor", text: "Great turnout today!" },
    ],
  },
  {
    id: "1",
    username: "safetyfirst",
    timestamp: Date.now() - 3600000,
    location: "Sandton City",
    content: "Security incident resolved. Area is now safe for pedestrians.",
    media: [
      {
        type: "video",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      },
    ],
    reactions: [{ type: "like", count: 23 }],
    comments: [
      { id: "c1", username: "anonymous_user", text: "Thanks for the update!" },
      {
        id: "c2",
        username: "local_resident",
        text: "Good to know it's safe now.",
      },
    ],
  },

  {
    id: "3",
    username: "neighborhood_patrol",
    timestamp: Date.now() - 1800000,
    location: "Main Street",
    content:
      "Attempted robbery reported near Main Street. Suspect fled on foot. Stay alert.",
    media: [],
    reactions: [{ type: "like", count: 89 }],
    comments: [
      {
        id: "c4",
        username: "witness",
        text: "I saw police cars rushing there.",
      },
      { id: "c5", username: "safety_advocate", text: "Stay safe everyone!" },
    ],
  },
  {
    id: "4",
    username: "local_news",
    timestamp: Date.now() - 5400000,
    location: "Hillbrow Station",
    content: "Reminder: Avoid dark alleys at night. Stick to well-lit areas.",
    media: [
      {
        type: "image",
        uri: "https://hsrc.ac.za/wp-content/uploads/2024/11/Screenshot-2024-11-18-113921.jpg",
      },
    ],
    reactions: [{ type: "like", count: 234 }],
    comments: [
      { id: "c6", username: "safety_tips", text: "Good reminder, thanks." },
    ],
  },
  {
    id: "5",
    username: "student_life",
    timestamp: Date.now() - 300000,
    location: "UJ Campus",
    content:
      "Lost wallet near the library. Black leather, contains student card. Please DM if found.",
    media: [
      {
        type: "image",
        uri: "https://www.svai.africa/wp-content/uploads/2022/03/svai-nl_mar22_blog3-NSP-GBVF_WEB2.png",
      },
    ],
    reactions: [{ type: "like", count: 45 }],
    comments: [
      {
        id: "c7",
        username: "helpful_student",
        text: "Check with campus security too.",
      },
    ],
  },
];

const DUMMY_STORIES = [
  {
    id: "s1",
    username: "your_story",
    uri: "https://media.licdn.com/dms/image/v2/D5603AQGA7NcHFrxS5w/profile-displayphoto-crop_800_800/B56Zgi.6WqG4AM-/0/1752933579945?e=1759968000&v=beta&t=7nvwTlFBAtS-TYd6YTyc0biS1k2SCnULRWijKhvgBUY",
    isAddStory: true,
  },
  {
    id: "s2",
    username: "katlego_m",
    uri: "https://ifp.org.za/wp-content/uploads/2021/09/Stopgbv-v2.jpg",
    viewed: false,
  },
  {
    id: "s3",
    username: "safety_patrol",
    uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    viewed: true,
  },
  {
    id: "s4",
    username: "community_hero",
    uri: "https://bolandcollege.com/wp-content/uploads/2023/02/stop-gender-based-violence.jpg",
    viewed: false,
  },
  {
    id: "s5",
    username: "local_news",
    uri: "https://media.licdn.com/dms/image/v2/D5603AQGA7NcHFrxS5w/profile-displayphoto-crop_800_800/B56Zgi.6WqG4AM-/0/1752933579945?e=1759968000&v=beta&t=7nvwTlFBAtS-TYd6YTyc0biS1k2SCnULRWijKhvgBUY",
    viewed: true,
  },
];

const Newsfeed = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [refreshing, setRefreshing] = useState(false);

  const handleAddReaction = useCallback((postId, type) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: [
                { type, count: (post.reactions?.[0]?.count || 0) + 1 },
              ],
            }
          : post
      )
    );
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const handleStoryPress = useCallback((story) => {
    if (story.isAddStory) {
      console.log("Add story");
    } else {
      console.log(`Viewing story: ${story.username}`);
    }
  }, []);

  const renderStoryItem = useCallback(
    ({ item: story }) => (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => handleStoryPress(story)}
        activeOpacity={0.7}
      >
        {story.isAddStory ? (
          <View style={styles.addStoryContainer}>
            <View style={styles.addStoryPlus}>
              <MaterialCommunityIcons
                name="plus"
                size={20}
                color={COLORS.text}
              />
            </View>
            <Text style={styles.storyUsername}>Your Story</Text>
          </View>
        ) : (
          <>
            <View
              style={[
                styles.storyBorder,
                story.viewed
                  ? styles.storyBorderViewed
                  : styles.storyBorderUnviewed,
              ]}
            >
              <Image source={{ uri: story.uri }} style={styles.storyImage} />
            </View>
            <Text style={styles.storyUsername} numberOfLines={1}>
              {story.username}
            </Text>
          </>
        )}
      </TouchableOpacity>
    ),
    [handleStoryPress]
  );

  const renderPostItem = useCallback(
    ({ item }) => <PostCard post={item} onAddReaction={handleAddReaction} />,
    [handleAddReaction]
  );

  const getKeyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SafeLife</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="heart-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIcon}>
            <MaterialCommunityIcons
              name="send-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={getKeyExtractor}
        renderItem={renderPostItem}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.text}
          />
        }
        ListHeaderComponent={
          <View style={styles.storiesContainer}>
            <FlatList
              data={DUMMY_STORIES}
              renderItem={renderStoryItem}
              keyExtractor={getKeyExtractor}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storiesContent}
            />
          </View>
        }
        contentContainerStyle={styles.feedContent}
        initialNumToRender={3}
        maxToRenderPerBatch={5}
        windowSize={10}
        removeClippedSubviews={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  logo: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    letterSpacing: -0.5,
  },

  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },

  storiesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  storiesContent: {
    paddingHorizontal: 16,
  },

  storyItem: {
    marginRight: 16,
    alignItems: "center",
    width: 66,
  },

  addStoryContainer: {
    alignItems: "center",
  },

  addStoryPlus: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    marginBottom: 4,
  },

  storiesContainer: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  storiesContent: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  storyItem: {
    marginRight: 16,
    alignItems: "center",
    width: 70,
  },

  addStoryContainer: {
    alignItems: "center",
  },

  addStoryPlus: {
    width: 64,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 32,
    marginBottom: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  storyBorder: {
    padding: 2,
    marginBottom: 4,
    borderRadius: 34,
  },

  storyBorderUnviewed: {
    borderWidth: 2,
    borderColor: "#E91E63",
    padding: 2,
    borderRadius: 34,
  },

  storyBorderViewed: {
    borderWidth: 2,
    borderColor: COLORS.textSecondary,
    padding: 2,
    borderRadius: 34,
  },

  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  storyUsername: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
    width: 70,
    marginTop: 4,
  },

  feedContent: {
    paddingBottom: 20,
  },
});

export default Newsfeed;
