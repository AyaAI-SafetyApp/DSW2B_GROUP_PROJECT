import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const { width } = Dimensions.get("window");

// Constants
const COLORS = {
  primary: "#E91E63",
  background: "#F9FAFB",
  card: "#FFFFFF",
  text: "#1F2937",
  textSecondary: "#6B7280",
  accent: "#8B5CF6",
  reward: "#FFD700", // Gold for reward badges
};

const CATEGORIES = ["Safety Tip", "Incident", "Event", "General"];

// Simulated blockchain reward system
const REWARD_POINTS = {
  incident: 100, // Points for verified incident reports
  safetyTip: 20, // Points for safety tips
  event: 10, // Points for events
  general: 5, // Points for general posts
};

// Initial in-memory data
const DUMMY_POSTS = [
  {
    id: "1",
    userId: "u1",
    username: "SafetyFirst_Jane",
    verified: true,
    isVerifiedIncident: true, // Blockchain-verified incident
    rewardPoints: REWARD_POINTS.incident, // Reward for verified incident
    timestamp: Date.now() - 1000000,
    location: "Downtown Mall",
    category: "Incident",
    content:
      "Suspicious activity reported near the mall entrance. Security notified.",
    media: null,
    reactions: { like: 2, heart: 5, fun: 1 },
    comments: [
      {
        id: "c1",
        userId: "u2",
        text: "Thanks for reporting!",
        commenter: {
          username: "LocalGuardian_Sarah",
          avatar: "https://via.placeholder.com/48",
          bio: "Community advocate and safety enthusiast.",
        },
        timestamp: Date.now() - 1800000,
      },
      {
        id: "c2",
        userId: "u3",
        text: "Hope everyone stays safe!",
        commenter: {
          username: "SafeCommuter_Alex",
          avatar: "https://via.placeholder.com/48",
          bio: "Daily commuter sharing tips for safe travels.",
        },
        timestamp: Date.now() - 1200000,
      },
    ],
  },
  {
    id: "2",
    userId: "u4",
    username: "CommunityWatch_Mike",
    verified: true,
    isVerifiedIncident: false, // Not verified yet
    rewardPoints: 0, // No rewards until verified
    timestamp: Date.now() - 3600000,
    location: "Greenside Park",
    category: "Incident",
    content:
      "Witnessed suspicious activity near the playground. Security notified.",
    media: null,
    reactions: { like: 3, heart: 1, fun: 0 },
    comments: [],
  },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 40,
    backgroundColor: COLORS.card,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
  },
  postList: { paddingHorizontal: 16, paddingBottom: 120 },
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  postHeaderLeft: { flexDirection: "row", alignItems: "center" },
  username: {
    fontWeight: "700",
    fontSize: 16,
    color: COLORS.text,
  },
  verifiedIcon: { marginLeft: 4 },
  rewardBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.reward,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  rewardText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: "600",
  },
  location: {
    marginTop: 4,
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  categoryTag: {
    backgroundColor: "#FCE7F3",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 8,
  },
  categoryText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  content: {
    marginTop: 10,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  media: {
    marginTop: 12,
    width: "100%",
    height: width * 0.5,
    borderRadius: 10,
  },
  reactionBar: {
    flexDirection: "row",
    marginTop: 12,
    alignItems: "center",
  },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 18,
  },
  reactionText: {
    marginLeft: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  comment: {
    marginTop: 6,
  },
  commentText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  moreComments: {
    fontWeight: "600",
    marginTop: 4,
    color: COLORS.primary,
  },
  fab: {
    position: "absolute",
    bottom: 80,
    right: 28,
    backgroundColor: COLORS.primary,
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#E91E63",
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profileModal: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    width: "90%",
    padding: 20,
    alignItems: "center",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  profileInfo: {
    marginLeft: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  profileUsername: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalButtonPrimary: {
    marginTop: 22,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
  },
  modalButtonSecondary: {
    marginTop: 14,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
  },
  modalButtonClose: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 24,
    width: "100%",
    alignItems: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  menuModal: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    width: 220,
    paddingVertical: 16,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  newPostModal: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    width: "100%",
    maxWidth: 420,
    padding: 22,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 16,
  },
  categoryList: {
    marginBottom: 14,
  },
  categoryOption: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: "#F3F4F6",
    borderRadius: 20,
    marginRight: 12,
  },
  categoryOptionActive: {
    backgroundColor: COLORS.primary,
  },
  categoryOptionText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  categoryOptionTextActive: {
    color: "#fff",
  },
  input: {
    height: 110,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  attachButtonText: {
    marginLeft: 8,
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  mediaPreview: {
    width: "100%",
    height: width * 0.5,
    borderRadius: 10,
    marginBottom: 16,
  },
  postButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  postButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  commentModal: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    width: "90%",
    maxHeight: "85%",
    padding: 20,
  },
  commentItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  commenterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  commentContent: {
    marginLeft: 12,
    flex: 1,
  },
  commentUsername: {
    fontWeight: "700",
    color: COLORS.text,
    fontSize: 14,
  },
  commentTimestamp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  noCommentsText: {
    fontStyle: "italic",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 20,
  },
  addCommentContainer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 15,
    height: 40,
  },
  commentSendButton: {
    justifyContent: "center",
    paddingHorizontal: 12,
  },
});

// PostCard component
const PostCard = ({ post, onAddReaction, onOpenMenu, onOpenComments }) => (
  <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.postCard}>
    <View style={styles.postHeader}>
      <View style={styles.postHeaderLeft}>
        <Text style={styles.username}>{post.username}</Text>
        {post.verified && (
          <MaterialCommunityIcons
            name="check-decagram"
            size={16}
            color={COLORS.primary}
            style={styles.verifiedIcon}
          />
        )}
        {post.isVerifiedIncident && (
          <View style={styles.rewardBadge}>
            <MaterialCommunityIcons name="star" size={14} color={COLORS.text} />
            <Text style={styles.rewardText}>{post.rewardPoints} Points</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={() => onOpenMenu(post)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons
          name="dots-vertical"
          size={22}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>

    <Text style={styles.location}>
      <MaterialCommunityIcons
        name="map-marker"
        size={14}
        color={COLORS.textSecondary}
      />{" "}
      {post.location || "Unknown"}
    </Text>

    <View style={styles.categoryTag}>
      <Text style={styles.categoryText}>{post.category}</Text>
    </View>

    <Text style={styles.content}>{post.content}</Text>

    {post.media && (
      <Image
        source={{ uri: post.media }}
        style={styles.media}
        resizeMode="cover"
      />
    )}

    <View style={styles.reactionBar}>
      {["like", "heart", "fun"].map((type) => {
        const iconName =
          type === "like"
            ? "thumb-up-outline"
            : type === "heart"
            ? "heart-outline"
            : "emoticon-happy-outline";
        const userKey = `${post.id}_${type}`;
        const reacted = post.userReactions?.[userKey];
        return (
          <TouchableOpacity
            key={type}
            style={styles.reactionButton}
            onPress={() => onAddReaction(post.id, type)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name={reacted ? iconName.replace("-outline", "") : iconName}
              size={20}
              color={reacted ? COLORS.primary : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.reactionText,
                reacted && { color: COLORS.primary, fontWeight: "600" },
              ]}
            >
              {post.reactions[type] || 0}
            </Text>
          </TouchableOpacity>
        );
      })}
      <TouchableOpacity
        style={styles.reactionButton}
        onPress={() => onOpenComments(post)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons
          name="comment-outline"
          size={20}
          color={COLORS.textSecondary}
        />
        <Text style={styles.reactionText}>{post.comments.length}</Text>
      </TouchableOpacity>
    </View>

    <View>
      {post.comments.slice(0, 3).map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.comment}
          onPress={() => onOpenComments(post)}
        >
          <Text style={styles.commentText}>• {item.text}</Text>
        </TouchableOpacity>
      ))}
      {post.comments.length > 3 && (
        <Text style={[styles.commentText, styles.moreComments]}>
          View all {post.comments.length} comments
        </Text>
      )}
    </View>
  </Animated.View>
);

// Profile Modal component
const ProfileModal = ({ visible, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.modalOverlay}
    >
      <View style={styles.profileModal}>
        <View style={styles.profileHeader}>
          <MaterialCommunityIcons
            name="account-circle"
            size={48}
            color={COLORS.primary}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Your Name</Text>
            <Text style={styles.profileUsername}>@yourusername</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.modalButtonPrimary}>
          <Text style={styles.modalButtonText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.modalButtonSecondary}>
          <Text style={[styles.modalButtonText, { color: COLORS.text }]}>
            Settings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalButtonClose, { backgroundColor: "#EF4444" }]}
          onPress={onClose}
        >
          <Text style={styles.modalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </Modal>
);

// Menu Modal component
const MenuModal = ({ visible, onSelectOption, onClose }) => (
  <Modal visible={visible} transparent animationType="fade">
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.modalOverlay}
    >
      <View style={styles.menuModal}>
        {["Share", "Unfollow", "Report"].map((option) => (
          <TouchableOpacity
            key={option}
            style={styles.menuItem}
            onPress={() => onSelectOption(option)}
          >
            <Text style={styles.menuItemText}>{option}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.menuItem} onPress={onClose}>
          <Text style={[styles.menuItemText, { color: COLORS.primary }]}>
            Close
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </Modal>
);

// New Post Modal component
const NewPostModal = ({
  visible,
  onClose,
  onCreatePost,
  newCategory,
  setNewCategory,
  newContent,
  setNewContent,
  newMedia,
  setNewMedia,
}) => (
  <Modal visible={visible} transparent animationType="slide">
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.modalOverlay}
    >
      <View style={styles.newPostModal}>
        <Text style={styles.modalTitle}>New Post</Text>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item}
          renderItem={({ item: cat }) => (
            <TouchableOpacity
              style={[
                styles.categoryOption,
                cat === newCategory && styles.categoryOptionActive,
              ]}
              onPress={() => setNewCategory(cat)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryOptionText,
                  cat === newCategory && styles.categoryOptionTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />

        <TextInput
          style={styles.input}
          placeholder="What's happening?"
          multiline
          value={newContent}
          onChangeText={setNewContent}
          textAlignVertical="top"
          maxLength={500}
        />

        <TouchableOpacity
          style={styles.attachButton}
          onPress={() => setNewMedia("https://via.placeholder.com/400")}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="image-plus"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.attachButtonText}>Add Photo/Video</Text>
        </TouchableOpacity>

        {newMedia && (
          <Image
            source={{ uri: newMedia }}
            style={styles.mediaPreview}
            resizeMode="cover"
          />
        )}

        <TouchableOpacity
          style={styles.postButton}
          onPress={onCreatePost}
          activeOpacity={0.9}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modalButtonClose, { marginTop: 12 }]}
          onPress={onClose}
        >
          <Text style={styles.modalButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </Modal>
);

// Comment Modal component
const CommentModal = ({ visible, post, addComment, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={styles.modalOverlay}
    >
      <View style={styles.commentModal}>
        <Text style={styles.modalTitle}>Comments</Text>

        {post ? (
          <>
            <FlatList
              data={post.comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{
                      uri:
                        item.commenter.avatar ||
                        "https://via.placeholder.com/48",
                    }}
                    style={styles.commenterAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text style={styles.commentUsername}>
                      {item.commenter.username}
                    </Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <Text style={styles.commentTimestamp}>
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.noCommentsText}>No comments yet.</Text>
              }
              style={{ maxHeight: 200, marginBottom: 12 }}
            />
            <AddCommentInput postId={post.id} addComment={addComment} />
          </>
        ) : (
          <Text>No post selected.</Text>
        )}

        <TouchableOpacity
          style={[styles.modalButtonClose, { marginTop: 8 }]}
          onPress={onClose}
        >
          <Text style={styles.modalButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  </Modal>
);

// AddCommentInput component
const AddCommentInput = ({ postId, addComment }) => {
  const [text, setText] = useState("");

  const onSubmit = useCallback(() => {
    if (!text.trim()) return;
    addComment(postId, text);
    setText("");
  }, [text, postId, addComment]);

  return (
    <View style={styles.addCommentContainer}>
      <TextInput
        style={styles.commentInput}
        placeholder="Add a comment..."
        value={text}
        onChangeText={setText}
        multiline={false}
        returnKeyType="send"
        onSubmitEditing={onSubmit}
      />
      <TouchableOpacity onPress={onSubmit} style={styles.commentSendButton}>
        <MaterialCommunityIcons name="send" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const Community = () => {
  const [posts, setPosts] = useState(DUMMY_POSTS);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [newPostModalVisible, setNewPostModalVisible] = useState(false);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [newCategory, setNewCategory] = useState(CATEGORIES[0]);
  const [newContent, setNewContent] = useState("");
  const [newMedia, setNewMedia] = useState(null);
  const [userReactions, setUserReactions] = useState({});

  // Add reaction to a post
  const addReaction = useCallback(
    (postId, type) => {
      const userKey = `${postId}_${type}`;
      if (userReactions[userKey]) return;

      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                reactions: {
                  ...p.reactions,
                  [type]: (p.reactions[type] || 0) + 1,
                },
                userReactions: { ...p.userReactions, [userKey]: true },
              }
            : p
        )
      );
      setUserReactions((prev) => ({ ...prev, [userKey]: true }));
    },
    [userReactions]
  );

  // Add comment to a post
  const addComment = useCallback((postId, text) => {
    if (!text.trim()) {
      Alert.alert("Error", "Comment cannot be empty.");
      return;
    }
    const newComment = {
      id: Date.now().toString(),
      userId: "you",
      text,
      commenter: {
        username: "You",
        avatar: "https://via.placeholder.com/48",
        bio: "Aya community member.",
      },
      timestamp: Date.now(),
    };

    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
      )
    );
  }, []);

  // Create a new post with reward logic
  const createPost = useCallback(() => {
    if (!newContent.trim()) {
      Alert.alert("Error", "Post content cannot be empty.");
      return;
    }
    const isIncident = newCategory === "Incident";
    const newPost = {
      id: Date.now().toString(),
      userId: "you",
      username: "You",
      verified: true,
      isVerifiedIncident: false, // Incidents start unverified
      rewardPoints: isIncident
        ? 0
        : REWARD_POINTS[newCategory.toLowerCase()] || 0, // Only verified incidents get rewards later
      timestamp: Date.now(),
      location: "Unknown",
      category: newCategory,
      content: newContent,
      media: newMedia,
      reactions: { like: 0, heart: 0, fun: 0 },
      comments: [],
      userReactions: {},
    };

    setPosts((prev) => [newPost, ...prev]);
    setNewPostModalVisible(false);
    setNewCategory(CATEGORIES[0]);
    setNewContent("");
    setNewMedia(null);
    Alert.alert(
      "Success",
      isIncident
        ? "Incident report submitted for verification."
        : "Post created successfully!"
    );
  }, [newCategory, newContent, newMedia]);

  // Handle menu options
  const onSelectMenuOption = useCallback(
    (option) => {
      setMenuModalVisible(false);
      switch (option) {
        case "Share":
          Alert.alert("Share", "Share functionality will be implemented.");
          break;
        case "Unfollow":
          Alert.alert("Unfollow", `Unfollowed ${selectedPost?.username || ""}`);
          break;
        case "Report":
          Alert.alert(
            "Report",
            `Reported post by ${selectedPost?.username || ""}`
          );
          break;
      }
    },
    [selectedPost]
  );

  // Handlers for opening modals
  const onOpenMenu = useCallback((post) => {
    setSelectedPost(post);
    setMenuModalVisible(true);
  }, []);

  const onOpenComments = useCallback((post) => {
    setSelectedPost(post);
    setCommentModalVisible(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.appTitle}>Aya Community</Text>
        <TouchableOpacity onPress={() => setProfileModalVisible(true)}>
          <MaterialCommunityIcons
            name="account-circle"
            size={36}
            color={COLORS.primary}
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onAddReaction={addReaction}
            onOpenMenu={onOpenMenu}
            onOpenComments={onOpenComments}
          />
        )}
        contentContainerStyle={styles.postList}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        windowSize={5}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setNewPostModalVisible(true)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <ProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />

      <MenuModal
        visible={menuModalVisible}
        onSelectOption={onSelectMenuOption}
        onClose={() => setMenuModalVisible(false)}
      />

      <NewPostModal
        visible={newPostModalVisible}
        onClose={() => {
          setNewPostModalVisible(false);
          setNewContent("");
          setNewCategory(CATEGORIES[0]);
          setNewMedia(null);
        }}
        onCreatePost={createPost}
        newCategory={newCategory}
        setNewCategory={setNewCategory}
        newContent={newContent}
        setNewContent={setNewContent}
        newMedia={newMedia}
        setNewMedia={setNewMedia}
      />

      <CommentModal
        visible={commentModalVisible}
        post={selectedPost}
        addComment={addComment}
        onClose={() => setCommentModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default Community;
