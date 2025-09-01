import React, { useState, useCallback, useMemo } from "react";
import {
  SafeAreaView,
  FlatList,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native";
import PostCard from "./PostCard";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const DUMMY_POSTS = [
  {
    id: "1",
    username: "SafetyFirst",
    verified: true,
    isVerifiedIncident: true,
    timestamp: Date.now() - 3600000,
    location: "Sandton City",
    category: "Safety Alert",
    content: "Security incident resolved. Area is now safe for pedestrians.",
    media: [
      {
        type: "video",
        uri: "https://www.tiktok.com/@5fm/video/7509412669825355014?is_from_webapp=1&sender_device=pc",
        thumbnail:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQktZDwcoRhh3QXrQzBchkHSr7QmpyllsVcAai4yashk-WtonuR7TDrVXjPy8GP&s&ec=73086141",
        duration: 120,
      },
    ],
    reactions: { like: 15, heart: 8, fun: 2 },
    comments: [
      { id: "c1", username: "Anonymous", text: "Thanks for the update!" },
      {
        id: "c2",
        username: "LocalResident",
        text: "Good to know it's safe now.",
      },
    ],
  },
  {
    id: "2",
    username: "Anonymous",
    verified: false,
    isVerifiedIncident: false,
    rewardPoints: 0,
    timestamp: Date.now() - 7200000,
    location: "Greenside Park",
    category: "Event",
    content: "Community gathering at the park.",
    media: [
      {
        type: "image",
        uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3e-lcQf5cRQspWDxl-DKsVkNDnMKlaAw8fQ&s",
      },
    ],
    reactions: { like: 3, heart: 2, fun: 1 },
    comments: [],
  },
  {
    id: "3",
    username: "SafetyPatrol",
    verified: true,
    isVerifiedIncident: true,
    rewardPoints: 250,
    timestamp: Date.now() - 1800000,
    location: "Main Street",
    category: "Crime Alert",
    content:
      "Attempted robbery reported near Main Street. Suspect fled on foot.",
    media: [],
    reactions: { like: 10, heart: 4, fun: 0 },
    comments: [
      {
        id: "c3",
        username: "Anonymous",
        text: "I saw police cars rushing there.",
      },
      { id: "c4", username: "CommunityWatch", text: "Stay alert, folks!" },
    ],
  },
  {
    id: "4",
    username: "Neighborhood Watch",
    verified: true,
    isVerifiedIncident: false,
    rewardPoints: 50,
    timestamp: Date.now() - 5400000,
    location: "Hillbrow Station",
    category: "Safety Tip",
    content: "Reminder: Avoid dark alleys at night. Stick to well-lit areas.",
    media: [
      {
        type: "image",
        uri: "https://images.unsplash.com/photo-1574515171624-0e6e0b9b5f7c?w=800",
      },
    ],
    reactions: { like: 8, heart: 6, fun: 2 },
    comments: [
      { id: "c5", username: "Anonymous", text: "Good reminder, thanks." },
    ],
  },
  {
    id: "5",
    username: "Anonymous",
    verified: false,
    isVerifiedIncident: false,
    rewardPoints: 10,
    timestamp: Date.now() - 300000,
    location: "UJ Campus",
    category: "Lost & Found",
    content:
      "Lost wallet near the library. Black leather, contains student card.",
    media: [
      {
        type: "image",
        uri: "https://ww1.clms.ukzn.ac.za/wp-content/uploads/2021/09/College-Hosts-Colloquium-on-Eradicating-Gender-Based-Violence.png",
      },
    ],
    reactions: { like: 1, heart: 3, fun: 0 },
    comments: [
      {
        id: "c6",
        username: "Anonymous",
        text: "I think I saw it near the cafeteria.",
      },
    ],
  },
  {
    id: "6",
    username: "Community Hero",
    verified: true,
    isVerifiedIncident: false,
    rewardPoints: 500,
    timestamp: Date.now() - 10800000,
    location: "City Hall",
    category: "Celebration",
    content: "Honoring volunteers who kept our community safe this year 🎉",
    media: [
      {
        type: "image",
        uri: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800",
      },
      {
        type: "video",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        thumbnail: "https://i.ytimg.com/vi/YE7VzlLtp-4/maxresdefault.jpg",
        duration: 654,
      },
    ],
    reactions: { like: 20, heart: 15, fun: 5 },
    comments: [
      { id: "c7", username: "Anonymous", text: "Amazing work 👏" },
      {
        id: "c8",
        username: "SafeLife",
        text: "Proud to be part of this community!",
      },
    ],
  },
  {
    id: "7",
    username: "NewsReporter",
    verified: true,
    isVerifiedIncident: false,
    rewardPoints: 100,
    timestamp: Date.now() - 14400000,
    location: "Downtown",
    category: "News",
    content: "Live coverage of the community safety initiative launch.",
    media: [
      {
        type: "video",
        uri: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        thumbnail: "https://i.ytimg.com/vi/gKAT2tGAInA/maxresdefault.jpg",
        duration: 15,
      },
    ],
    reactions: { like: 25, heart: 12, fun: 3 },
    comments: [
      {
        id: "c9",
        username: "CityMayor",
        text: "Excited about this initiative!",
      },
    ],
  },
];

const DUMMY_STORIES = [
  {
    id: "s1",
    username: "Katlego",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: false,
  },
  {
    id: "s2",
    username: "Steve Jobs",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: true,
  },
  {
    id: "s3",
    username: "Malema",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: false,
  },
  {
    id: "s4",
    username: "Dana",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: true,
  },
  {
    id: "s5",
    username: "Alex",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: false,
  },
  {
    id: "s6",
    username: "Maya",
    uri: "https://www.vukuzenzele.gov.za/sites/default/files/images_2022_12/GBVF%202.jpg",
    hasVideo: true,
  },
];

const Newsfeed = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [bitcoinBalance, setBitcoinBalance] = useState(2.34);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(
    () => [
      "All",
      "Safety Alert",
      "Crime Alert",
      "Event",
      "Safety Tip",
      "Lost & Found",
      "Celebration",
      "News",
    ],
    []
  );

  const filteredPosts = useMemo(() => {
    if (selectedCategory === "All") return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  const handleAddReaction = useCallback((postId, type) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: {
                ...post.reactions,
                [type]: (post.reactions[type] || 0) + 1,
              },
            }
          : post
      )
    );
  }, []);

  const handleCreatePost = useCallback(() => {
    Alert.alert("Create Post", "Choose post type", [
      { text: "Text Post", onPress: () => console.log("Text post") },
      { text: "Photo Post", onPress: () => console.log("Photo post") },
      { text: "Video Post", onPress: () => console.log("Video post") },
      { text: "Cancel", style: "cancel" },
    ]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In real app, fetch new posts here
    setRefreshing(false);
  }, []);

  const handleStoryPress = useCallback((story) => {
    console.log(`Viewing story: ${story.username}`);
    // Navigate to story viewer
  }, []);

  const handleCategoryPress = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const renderStoryItem = useCallback(
    ({ item: story }) => (
      <TouchableOpacity
        key={story.id}
        style={styles.storyItem}
        onPress={() => handleStoryPress(story)}
        activeOpacity={0.7}
      >
        <View style={styles.storyImageContainer}>
          <Image source={{ uri: story.uri }} style={styles.storyImage} />
          {story.hasVideo && (
            <View style={styles.videoIndicator}>
              <MaterialCommunityIcons name="play" size={12} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {story.username}
        </Text>
      </TouchableOpacity>
    ),
    [handleStoryPress]
  );

  const renderCategoryItem = useCallback(
    ({ item: category }) => (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          selectedCategory === category && styles.selectedCategoryItem,
        ]}
        onPress={() => handleCategoryPress(category)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.categoryText,
            selectedCategory === category && styles.selectedCategoryText,
          ]}
        >
          {category}
        </Text>
      </TouchableOpacity>
    ),
    [selectedCategory, handleCategoryPress]
  );

  const renderPostItem = useCallback(
    ({ item }) => <PostCard post={item} onAddReaction={handleAddReaction} />,
    [handleAddReaction]
  );

  const getKeyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Bitcoin Balance Header */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceContent}>
          <MaterialCommunityIcons name="bitcoin" size={24} color="#F7931A" />
          <Text style={styles.balanceText}>
            {bitcoinBalance.toFixed(4)} BTC
          </Text>
        </View>
        <TouchableOpacity style={styles.walletButton}>
          <MaterialCommunityIcons name="wallet" size={20} color="#374151" />
        </TouchableOpacity>
      </View>

      {/* Stories Carousel */}
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

      {/* Categories Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Posts Feed */}
      <FlatList
        data={filteredPosts}
        keyExtractor={getKeyExtractor}
        renderItem={renderPostItem}
        contentContainerStyle={styles.feedContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#E91E63"]}
            tintColor="#E91E63"
          />
        }
        initialNumToRender={5}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        getItemLayout={(data, index) => ({
          length: 400, // Approximate item height
          offset: 400 * index,
          index,
        })}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreatePost}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  balanceContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  balanceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  walletButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  storiesContainer: {
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  storiesContent: {
    paddingHorizontal: 12,
  },
  storyItem: {
    marginHorizontal: 4,
    alignItems: "center",
    width: 70,
  },
  storyImageContainer: {
    position: "relative",
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#E91E63",
    borderRadius: 8,
    padding: 2,
  },
  storyUsername: {
    marginTop: 4,
    fontSize: 12,
    color: "#374151",
    textAlign: "center",
  },
  categoriesContainer: {
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoriesContent: {
    paddingHorizontal: 12,
  },
  categoryItem: {
    marginHorizontal: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  selectedCategoryItem: {
    backgroundColor: "#E91E63",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  feedContent: {
    padding: 16,
    paddingBottom: 100,
  },
  floatingButton: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

export default Newsfeed;
