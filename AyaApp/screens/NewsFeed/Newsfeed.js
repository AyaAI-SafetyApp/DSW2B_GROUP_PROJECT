import React, { useState } from "react";
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
} from "react-native";
import PostCard from "./PostCard";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width } = Dimensions.get("window");

const DUMMY_POSTS = [
  {
    id: "1",
    username: "Anonymous",
    verified: false,
    isVerifiedIncident: true,
    rewardPoints: 100,
    timestamp: Date.now() - 3600000,
    location: "Downtown Mall",
    category: "Incident",
    content: "Suspicious activity reported near the mall entrance.",
    media: [
      { type: "image", uri: "https://via.placeholder.com/400" },
      {
        type: "video",
        uri: "https://youtu.be/O66hcuKJKn4",
      },
    ],
    reactions: { like: 2, heart: 5, fun: 1 },
    comments: [
      { id: "c1", username: "Anonymous", text: "Thanks for reporting!" },
      { id: "c2", username: "Anonymous", text: "Stay safe everyone." },
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
        uri: "https://www.globalsistersreport.org/files/20200305T1103-VATICAN-RELIGIOUS-FREEDOM-603167%20resizse.jpg",
      },
    ],
    reactions: { like: 3, heart: 2, fun: 1 },
    comments: [],
  },
];

// Dummy stories for top carousel
const DUMMY_STORIES = [
  {
    id: "s1",
    username: "Katlego",
    uri: "https://www.gov.za/sites/default/files/unnamed.jpg",
  },
  {
    id: "s2",
    username: "Steve Jobs",
    uri: "https://www.svai.africa/wp-content/uploads/2022/03/svai-nl_mar22_blog3-NSP-GBVF_WEB2.png",
  },
  {
    id: "s3",
    username: "Malema",
    uri: "https://sahistory.org.za/sites/default/files/The%20Dark%20and%20Heavy%20Shadow%20main%20image.jpg",
  },
  {
    id: "s4",
    username: "Dana",
    uri: "https://media.meer.com/attachments/4ff35d0711b761b883a98b8deae35a08d64cdfd1/store/fill/860/645/46e3852faa1670b39d136c44816ac9dcb7b238aabc821bbcd0b0d85ec1ef/Gender-based-violence.jpg",
  },
  {
    id: "s1",
    username: "Katlego",
    uri: "https://www.gov.za/sites/default/files/unnamed.jpg",
  },
  {
    id: "s2",
    username: "Steve Jobs",
    uri: "https://www.svai.africa/wp-content/uploads/2022/03/svai-nl_mar22_blog3-NSP-GBVF_WEB2.png",
  },
  {
    id: "s3",
    username: "Malema",
    uri: "https://sahistory.org.za/sites/default/files/The%20Dark%20and%20Heavy%20Shadow%20main%20image.jpg",
  },
  {
    id: "s4",
    username: "Dana",
    uri: "https://media.meer.com/attachments/4ff35d0711b761b883a98b8deae35a08d64cdfd1/store/fill/860/645/46e3852faa1670b39d136c44816ac9dcb7b238aabc821bbcd0b0d85ec1ef/Gender-based-violence.jpg",
  },
];

const Newsfeed = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [bitcoinBalance, setBitcoinBalance] = useState(2.34); // User-only balance

  const handleAddReaction = (postId, type) => {
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
  };

  const handleCreatePost = () => {
    alert("Create post button clicked!");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Bitcoin Balance */}
      <View style={styles.balanceContainer}>
        <MaterialCommunityIcons name="bitcoin" size={24} color="#F2A900" />
        <Text style={styles.balanceText}>{bitcoinBalance} BTC</Text>
      </View>

      {/* Stories Carousel */}
      <View style={styles.storiesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DUMMY_STORIES.map((story) => (
            <View key={story.id} style={styles.storyItem}>
              <Image source={{ uri: story.uri }} style={styles.storyImage} />
              <Text style={styles.storyUsername}>{story.username}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} onAddReaction={handleAddReaction} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />

      {/* Floating Post Button */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreatePost}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  balanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 39,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  balanceText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
  },
  storiesContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  storyItem: {
    marginLeft: 16,
    alignItems: "center",
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#E91E63",
  },
  storyUsername: {
    marginTop: 4,
    fontSize: 12,
    color: "#1F2937",
  },
  floatingButton: {
    position: "absolute",
    bottom: 75,
    right: 10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E91E63",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});

export default Newsfeed;
