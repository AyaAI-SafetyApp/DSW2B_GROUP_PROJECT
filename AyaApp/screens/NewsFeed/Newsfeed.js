import React, { useState, useCallback, useEffect } from "react";
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
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import PostCard from "./PostCard";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { fetchPosts, createPost, updatePost, deletePost } from "../../NewsfeedCRUD/api/posts";
import { pickMedia } from "../../NewsfeedCRUD/api/media";
import Modal from "react-native-modal";
import { TextInput, Button, FAB } from "react-native-paper";

const { width } = Dimensions.get("window");

const COLORS = {
  background: "#FFFFFF",
  text: "#262626",
  textSecondary: "#8E8E8E",
  border: "#EFEFEF",
  black: "#000000",
  accent: "#E91E63",
};

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
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [postType, setPostType] = useState("text"); // text, image, video
  const [postContent, setPostContent] = useState("");
  const [mediaUri, setMediaUri] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);

  // Fetch posts from Supabase
  const loadPosts = async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (e) {
      Alert.alert("Error", e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  // Add Reaction (example: likes)
  const handleAddReaction = useCallback(async (postId, type) => {
    await loadPosts();
  }, []);

  // Open modal to create post
  const handleAddPost = () => {
    setPostType("text");
    setPostContent("");
    setMediaUri(null);
    setEditingPostId(null);
    setModalVisible(true);
  };

  // Open modal to edit post
  const handleEditPost = (postId, updates) => {
    setEditingPostId(postId);
    setPostContent(updates.content || "");
    setPostType(updates.media_type || "text");
    setMediaUri(updates.media_url || null);
    setModalVisible(true);
  };

  // Pick media for image/video post
  const handlePickMedia = async (type) => {
    const uri = await pickMedia(type);
    if (uri) {
      setMediaUri(uri);
      setPostType(type);
    }
  };

  // Submit post (create or update)
  const handleSubmitPost = async () => {
    if (!postContent && !mediaUri) {
      Alert.alert("Please enter text or select media.");
      return;
    }
    try {
      if (editingPostId) {
        await updatePost(editingPostId, {
          content: postContent,
          media_type: mediaUri ? postType : "none",
          media_url: mediaUri,
        });
      } else {
        await createPost({
          username: "current_user",
          content: postContent,
          media_type: mediaUri ? postType : "none",
          media_url: mediaUri,
        });
      }
      setModalVisible(false);
      setPostContent("");
      setMediaUri(null);
      setEditingPostId(null);
      await loadPosts();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  // Delete Post
  const handleDeletePost = async (postId) => {
    try {
      await deletePost(postId);
      await loadPosts();
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  const handleStoryPress = useCallback((story) => {
    if (story.isAddStory) {
      Alert.alert("Add story", "Feature coming soon!");
    } else {
      Alert.alert("View story", `Viewing story: ${story.username}`);
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
    ({ item }) => (
      <PostCard
        post={item}
        onAddReaction={handleAddReaction}
        onEdit={(id, updates) => handleEditPost(id, updates)}
        onDelete={handleDeletePost}
      />
    ),
    [handleAddReaction, handleEditPost, handleDeletePost]
  );

  const getKeyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>SafeLife</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon} onPress={handleAddPost}>
            <MaterialCommunityIcons
              name="plus-box"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
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

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={COLORS.text} />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 16, marginBottom: 16 }}>
            No posts yet. Be the first to post!
          </Text>
        </View>
      ) : (
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
      )}

      {/* Floating Create Post Button */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={handleAddPost}
        label="Create Post"
      />

      {/* Create/Edit Post Modal */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={{ margin: 0, justifyContent: "center" }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPostId ? "Edit Post" : "Create Post"}
            </Text>
            <View style={styles.modalTypeRow}>
              <Button
                mode={postType === "text" ? "contained" : "outlined"}
                onPress={() => {
                  setPostType("text");
                  setMediaUri(null);
                }}
                style={styles.typeButton}
              >
                Text
              </Button>
              <Button
                mode={postType === "image" ? "contained" : "outlined"}
                onPress={() => handlePickMedia("image")}
                style={styles.typeButton}
              >
                Image
              </Button>
              <Button
                mode={postType === "video" ? "contained" : "outlined"}
                onPress={() => handlePickMedia("video")}
                style={styles.typeButton}
              >
                Video
              </Button>
            </View>
            <TextInput
              label="Write something..."
              value={postContent}
              onChangeText={setPostContent}
              multiline
              style={styles.textInput}
              mode="outlined"
              theme={{ colors: { primary: COLORS.text } }}
            />
            {mediaUri && postType === "image" && (
              <Image
                source={{ uri: mediaUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            {mediaUri && postType === "video" && (
              <View style={styles.previewVideoContainer}>
                <Text style={{ color: COLORS.textSecondary, marginBottom: 8 }}>
                  Video selected
                </Text>
                {/* You can use expo-av or react-native-video for preview */}
              </View>
            )}
            <Button
              mode="contained"
              onPress={handleSubmitPost}
              style={styles.submitButton}
              contentStyle={{ paddingVertical: 6 }}
            >
              {editingPostId ? "Update" : "Post"}
            </Button>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    borderColor: COLORS.accent,
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
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 24,
    alignItems: "stretch",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  modalTypeRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 12,
  },
  typeButton: {
    marginHorizontal: 4,
  },
  textInput: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: COLORS.border,
  },
  previewVideoContainer: {
    alignItems: "center",
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: COLORS.text,
  },
  // ...existing styles...
fab: {
  position: "absolute",
  right: 24,
  bottom: 90, // Increased so it's above the tab bar
  backgroundColor: COLORS.accent,
  zIndex: 100,
},
// ...existing styles...
});

export default Newsfeed;