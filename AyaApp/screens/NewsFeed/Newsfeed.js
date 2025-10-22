// ...existing code...
import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
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
  TextInput as RNTextInput,
  Modal as RNModal,
  Animated,
  PanResponder,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import Modal from "react-native-modal";
import { Button, FAB } from "react-native-paper";
import { Video } from "expo-av";

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "../../NewsfeedCRUD/api/posts";
import { pickMedia } from "../../NewsfeedCRUD/api/media";

// added imports for offline queue and storage upload
import { enqueuePost, startAutoSync } from "../../NewsfeedCRUD/api/offlineQueue";
import { uploadFileToBucket } from "../../NewsfeedCRUD/api/storage";

const { width, height } = Dimensions.get("window");

const COLORS = {
  background: "#FAFAFA",
  cardBackground: "#FFFFFF",
  text: "#262626",
  textSecondary: "#8E8E8E",
  border: "#DBDBDB",
  accent: "#f6007bff",
  like: "#ED4956",
  white: "#FFFFFF",
};

const STORY_DURATION = 5000;
const STORY_PROGRESS_INTERVAL = 50;

const OFFLINE_POST_QUEUE_KEY = "OFFLINE_POST_QUEUE"; // used by offlineQueue.js
const OFFLINE_CRUD_QUEUE_KEY = "OFFLINE_CRUD_QUEUE"; // local ops (delete/like/comment/update)

const DUMMY_STORIES = [
  {
    id: "s1",
    username: "Your Story",
    avatar: "https://i.pravatar.cc/150?img=1",
    images: ["https://picsum.photos/400/600?random=1"],
    isAddStory: true,
    likedByMe: false,
  },
  {
    id: "s2",
    username: "katlego_m",
    avatar: "https://i.pravatar.cc/150?img=2",
    images: ["https://ifp.org.za/wp-content/uploads/2021/09/Stopgbv-v2.jpg"],
    viewed: false,
    likedByMe: false,
  },
  {
    id: "s3",
    username: "safety_patrol",
    avatar: "https://i.pravatar.cc/150?img=3",
    images: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    ],
    viewed: true,
    likedByMe: false,
  },
  {
    id: "s4",
    username: "community_hero",
    avatar: "https://i.pravatar.cc/150?img=4",
    images: [
      "https://bolandcollege.com/wp-content/uploads/2023/02/stop-gender-based-violence.jpg",
    ],
    viewed: false,
    likedByMe: false,
  },
];

// ============ small helpers for offline CRUD queue ============
async function getOpsQueue() {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_CRUD_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("getOpsQueue error", e);
    return [];
  }
}
async function setOpsQueue(q) {
  try {
    await AsyncStorage.setItem(OFFLINE_CRUD_QUEUE_KEY, JSON.stringify(q || []));
  } catch (e) {
    console.error("setOpsQueue error", e);
  }
}
async function enqueueOp(op) {
  const q = await getOpsQueue();
  q.push(op);
  await setOpsQueue(q);
}
async function removeQueuedCreateByLocalId(localId) {
  try {
    const raw = await AsyncStorage.getItem(OFFLINE_POST_QUEUE_KEY);
    if (!raw) return;
    const queue = JSON.parse(raw);
    const filtered = (queue || []).filter((i) => {
      // keep items that do not match localId
      try {
        return !(i.payload && i.payload.localId && i.payload.localId === localId);
      } catch {
        return true;
      }
    });
    await AsyncStorage.setItem(OFFLINE_POST_QUEUE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("removeQueuedCreateByLocalId", e);
  }
}

// ============ STORY ITEM COMPONENT ============
const StoryItem = React.memo(({ story, index, onPress }) => {
  if (story.isAddStory) {
    return (
      <TouchableOpacity
        style={styles.storyItem}
        onPress={() => onPress(story, index)}
        activeOpacity={0.7}
      >
        <View style={styles.addStoryBorder}>
          <Image source={{ uri: story.avatar }} style={styles.storyImage} />
          <View style={styles.addStoryPlus}>
            <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          </View>
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          Your Story
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.storyItem}
      onPress={() => onPress(story, index)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.storyBorder,
          story.viewed ? styles.storyBorderViewed : styles.storyBorderUnviewed,
        ]}
      >
        <Image source={{ uri: story.avatar }} style={styles.storyImage} />
      </View>
      <Text style={styles.storyUsername} numberOfLines={1}>
        {story.username}
      </Text>
    </TouchableOpacity>
  );
});

// ============ POST CARD COMPONENT ============
const PostCard = React.memo(
  ({ post, onLike, onEdit, onDelete, onComment, onViewComments }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const isLiked = post.likes && post.likes.includes("current_user");
    const isOwnPost = post.username === "current_user";

    const handleDoubleTap = useCallback(() => {
      if (!isLiked) {
        onLike(post.id);
      }
    }, [isLiked, onLike, post.id]);

    let lastTap = null;
    const handleImagePress = () => {
      const now = Date.now();
      if (lastTap && now - lastTap < 300) {
        handleDoubleTap();
      }
      lastTap = now;
    };

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Image
              source={{ uri: post.avatar || "https://i.pravatar.cc/150?img=5" }}
              style={styles.postAvatar}
            />
            <View>
              <Text style={styles.postUser}>{post.username}</Text>
            </View>
          </View>
          {isOwnPost && (
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Post Options", "What would you like to do?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Edit", onPress: () => onEdit(post.id) },
                  {
                    text: "Delete",
                    onPress: () => onDelete(post.id),
                    style: "destructive",
                  },
                ]);
              }}
            >
              <MaterialCommunityIcons
                name="dots-vertical"
                size={24}
                color={COLORS.text}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Media */}
        {post.media_urls && post.media_urls.length > 0 && (
          <TouchableOpacity activeOpacity={1} onPress={handleImagePress}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.accent} />
              </View>
            )}
            <FlatList
              data={post.media_urls}
              horizontal
              pagingEnabled
              keyExtractor={(_, i) => ${post.id}_m_${i}}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={styles.postImage}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={() => setImageLoading(false)}
                />
              )}
              showsHorizontalScrollIndicator={false}
            />
          </TouchableOpacity>
        )}

        {/* Post Actions */}
        <View style={styles.postActions}>
          <View style={styles.postActionsLeft}>
            <TouchableOpacity
              onPress={() => onLike(post.id)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons
                name={isLiked ? "heart" : "heart-outline"}
                size={28}
                color={isLiked ? COLORS.like : COLORS.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onComment(post.id)}
              style={styles.actionBtn}
            >
              <MaterialCommunityIcons
                name="comment-outline"
                size={26}
                color={COLORS.text}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MaterialCommunityIcons
                name="send-outline"
                size={26}
                color={COLORS.text}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="bookmark-outline"
              size={26}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        {/* Likes Count */}
        {post.likes.length > 0 && (
          <Text style={styles.likesCount}>
            {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
          </Text>
        )}

        {/* Post Content */}
        {post.content && (
          <View style={styles.postContentContainer}>
            <Text style={styles.postContent}>
              <Text style={styles.postUser}>{post.username}</Text>{" "}
              {post.content}
            </Text>
          </View>
        )}

        {/* Comments Preview */}
        {post.comments && post.comments.length > 0 && (
          <TouchableOpacity onPress={() => onViewComments(post)}>
            <Text style={styles.viewComments}>
              View all {post.comments.length} comments
            </Text>
          </TouchableOpacity>
        )}

        {/* Time Ago */}
        <Text style={styles.postTime}>{getTimeAgo(post.created_at)}</Text>
      </View>
    );
  }
);

// ============ COMMENTS MODAL ============
const CommentsModal = ({
  visible,
  post,
  onClose,
  onAddComment,
  onDeleteComment,
}) => {
  const [commentText, setCommentText] = useState("");
  const flatListRef = useRef(null);

  useEffect(() => {
    if (visible && post?.comments?.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [visible, post?.comments?.length]);

  const handleSubmit = () => {
    if (commentText.trim()) {
      onAddComment(post.id, commentText.trim());
      setCommentText("");
    }
  };

  if (!post) return null;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      style={styles.commentsModal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
    >
      <View style={styles.commentsContainer}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={flatListRef}
          data={post.comments || []}
          keyExtractor={(c) => c.id}
          style={styles.commentsList}
          renderItem={({ item }) => (
            <View style={styles.commentItem}>
              <Image
                source={{
                  uri: item.avatar || "https://i.pravatar.cc/150?img=6",
                }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentContent}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentUser}>{item.user}</Text>{" "}
                  {item.text}
                </Text>
                <Text style={styles.commentTime}>
                  {getTimeAgo(item.created_at)}
                </Text>
              </View>
              {item.user === "current_user" && (
                <TouchableOpacity
                  onPress={() => onDeleteComment(post.id, item.id)}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={18}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <MaterialCommunityIcons
                name="comment-outline"
                size={48}
                color={COLORS.textSecondary}
              />
              <Text style={styles.emptyCommentsText}>No comments yet</Text>
              <Text style={styles.emptyCommentsSubtext}>
                Be the first to comment!
              </Text>
            </View>
          }
        />

        <View style={styles.commentInputContainer}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=1" }}
            style={styles.commentInputAvatar}
          />
          <RNTextInput
            placeholder="Add a comment..."
            value={commentText}
            onChangeText={setCommentText}
            style={styles.commentInput}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!commentText.trim()}
          >
            <Text
              style={[
                styles.postButtonText,
                !commentText.trim() && styles.postButtonDisabled,
              ]}
            >
              Post
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ============ STORY VIEWER ============
const StoryViewer = ({
  visible,
  stories,
  activeIndex,
  activeImageIndex,
  onClose,
  onNext,
  onPrev,
  onLike,
  progress,
}) => {
  const [paused, setPaused] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.abs(gestureState.dx) > 50) {
          if (gestureState.dx > 0) {
            onPrev();
          } else {
            onNext();
          }
        }
      },
      onPanResponderRelease: () => {
        pan.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  const currentStory = stories[activeIndex];

  if (!visible || !currentStory) return null;

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.storyViewerOverlay}>
        <View style={styles.storyProgressContainer}>
          {stories.map((s, i) => (
            <View key={s.id} style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width:
                      i < activeIndex
                        ? "100%"
                        : i === activeIndex
                        ? ${progress}%
                        : "0%",
                  },
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.storyTopBar}>
          <View style={styles.storyUserInfo}>
            <Image
              source={{ uri: currentStory.avatar }}
              style={styles.storyAvatar}
            />
            <Text style={styles.storyUsernameLarge}>
              {currentStory.username}
            </Text>
            <Text style={styles.storyTime}>
              {getTimeAgo(Date.now() - 3600000)}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.storyCloseBtn}>
            <MaterialCommunityIcons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.storyViewerContent}
          activeOpacity={1}
          onLongPress={() => setPaused(true)}
          onPressOut={() => setPaused(false)}
          {...panResponder.panHandlers}
        >
          <Image
            source={{ uri: currentStory.images[activeImageIndex] }}
            style={styles.storyViewerImage}
            resizeMode="cover"
          />
        </TouchableOpacity>

        <View style={styles.storyBottomBar}>
          <View style={styles.storyReplyContainer}>
            <RNTextInput
              placeholder="Send message"
              placeholderTextColor="rgba(255,255,255,0.6)"
              style={styles.storyReplyInput}
            />
          </View>
          <TouchableOpacity
            onPress={() => onLike(activeIndex)}
            style={styles.storyLikeBtn}
          >
            <MaterialCommunityIcons
              name={currentStory.likedByMe ? "heart" : "heart-outline"}
              size={28}
              color={currentStory.likedByMe ? COLORS.like : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </RNModal>
  );
};

// ============ HELPER FUNCTIONS ============
const getTimeAgo = (timestamp) => {
  // tolerant: accept numeric ms, seconds, or ISO strings
  let ts = timestamp;
  if (typeof ts === "string") {
    const parsed = Date.parse(ts);
    ts = isNaN(parsed) ? undefined : parsed;
  } else if (typeof ts === "number") {
    // ensure it's milliseconds; if it looks like seconds (10-digit), convert to ms
    if (String(ts).length === 10) ts = ts * 1000;
  } else {
    ts = undefined;
  }
  if (!ts || isNaN(ts)) ts = Date.now();

  const now = Date.now();
  const diff = now - ts;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) return new Date(ts).toLocaleDateString();
  if (days > 0) return ${days}d ago;
  if (hours > 0) return ${hours}h ago;
  if (minutes > 0) return ${minutes}m ago;
  return "Just now";
};

// ============ MAIN COMPONENT ============
const Newsfeed = () => {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [postType, setPostType] = useState("text");
  const [postContent, setPostContent] = useState("");
  const [mediaUris, setMediaUris] = useState([]);
  const [editingPostId, setEditingPostId] = useState(null);
  const [stories, setStories] = useState(DUMMY_STORIES);
  const [storyViewerVisible, setStoryViewerVisible] = useState(false);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [activeStoryImageIndex, setActiveStoryImageIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const storyTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // ============ POST OPERATIONS ============
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();

      // normalize created_at to numeric ms for posts and comments
      const normalized = (data || []).map((p) => {
        const rawCreated = p.created_at ?? p.createdAt ?? Date.now();
        const created_at =
          typeof rawCreated === "string"
            ? Date.parse(rawCreated) || Date.now()
            : typeof rawCreated === "number"
            ? String(rawCreated).length === 10
              ? rawCreated * 1000
              : rawCreated
            : Date.now();

        const comments = Array.isArray(p.comments)
          ? p.comments.map((c) => {
              const rawC = c.created_at ?? c.createdAt ?? Date.now();
              const created_at_c =
                typeof rawC === "string"
                  ? Date.parse(rawC) || Date.now()
                  : typeof rawC === "number"
                  ? String(rawC).length === 10
                    ? rawC * 1000
                    : rawC
                  : Date.now();
              return { ...c, created_at: created_at_c };
            })
          : [];

        return {
          id: p.id,
          username: p.username || "unknown",
          avatar:
            p.avatar ||
            https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)},
          content: p.content || "",
          media_type: p.media_type || "none",
          media_urls: Array.isArray(p.media_urls)
            ? p.media_urls
            : p.media_url
            ? [p.media_url]
            : [],
          likes: Array.isArray(p.likes) ? p.likes : [],
          comments,
          created_at,
        };
      });

      // ensure numeric created_at and sort by descending created_at
      setPosts(
        normalized
          .map((x) => ({ ...x, created_at: Number(x.created_at || Date.now()) }))
          .sort((a, b) => b.created_at - a.created_at)
      );
    } catch (e) {
      console.error("Failed to load posts:", e);
      Alert.alert("Error", "Failed to load posts. Please try again.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // start offline auto-sync (uploads + create handled by offlineQueue)
  useEffect(() => {
    const unsubscribe = startAutoSync({
      createPostFn: createPost,
      uploadFn: uploadFileToBucket,
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  // process CRUD ops queue (delete/like/comment/update on server) when network available
  const processOpsQueue = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;
      let q = await getOpsQueue();
      if (!q || q.length === 0) return;

      // process sequentially
      for (const op of q.slice()) {
        try {
          // If op targets a local placeholder id, skip processing here.
          // These ops must be applied after the create sync maps localId -> serverId.
          if (String(op.postId || "").startsWith("local_")) {
            // keep in queue for now
            continue;
          }

          if (op.type === "delete") {
            await deletePost(op.postId);
          } else if (op.type === "update") {
            await updatePost(op.postId, op.payload);
          } else if (op.type === "like") {
            // payload contains likes array
            await updatePost(op.postId, { likes: op.payload.likes });
          } else if (op.type === "comment") {
            // comments array
            await updatePost(op.postId, { comments: op.payload.comments });
          }
          // on success remove the op from queue
          q = q.filter((x) => x.id !== op.id);
          await setOpsQueue(q);
        } catch (err) {
          console.error("processOpsQueue item failed, stop and retry later", err);
          break; // stop and retry later
        }
      }
    } catch (e) {
      console.error("processOpsQueue failed", e);
    }
  }, []);

  useEffect(() => {
    // run on mount and when connectivity changes
    processOpsQueue();
    const unsub = NetInfo.addEventListener((state) => {
      if (state.isConnected) processOpsQueue();
    });
    return () => unsub();
  }, [processOpsQueue]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, [loadPosts]);

  // Toggle like with optimistic update. Skip server update for local-only posts; if offline queue server op.
  const toggleLikePost = useCallback(
    async (postId) => {
      try {
        // optimistic local update
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const already = (p.likes || []).includes("current_user");
            const likes = already
              ? (p.likes || []).filter((l) => l !== "current_user")
              : [...(p.likes || []), "current_user"];
            return { ...p, likes };
          })
        );

        // if local placeholder, do not call server — enqueue op referencing local id
        if (String(postId).startsWith("local_")) {
          await enqueueOp({
            id: op_${Date.now()},
            type: "like",
            postId,
            payload: {
              likes: (posts.find((p) => p.id === postId)?.likes || []),
            },
          });
          return;
        }

        const state = await NetInfo.fetch();
        const target = posts.find((p) => p.id === postId);
        if (!target) return;
        const already = (target.likes || []).includes("current_user");
        const likes = already
          ? (target.likes || []).filter((l) => l !== "current_user")
          : [...(target.likes || []), "current_user"];

        if (!state.isConnected) {
          // enqueue op to update likes later
          await enqueueOp({
            id: op_${Date.now()},
            type: "like",
            postId,
            payload: { likes },
          });
          return;
        }

        await updatePost(postId, { likes });
      } catch (e) {
        console.error("Like failed:", e);
      }
    },
    [posts]
  );

  const addCommentToPost = useCallback(
    async (postId, text) => {
      if (!text.trim()) return;

      const comment = {
        id: c_${Date.now()}_${Math.random()},
        user: "current_user",
        avatar: "https://i.pravatar.cc/150?img=1",
        text: text.trim(),
        created_at: Date.now(),
      };

      // optimistic local update
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p
        )
      );

      // Update selected post for modal
      setSelectedPost((prev) =>
        prev && prev.id === postId
          ? { ...prev, comments: [...(prev.comments || []), comment] }
          : prev
      );

      try {
        // If target is a local placeholder, enqueue local comment op and do NOT call server.
        if (String(postId).startsWith("local_")) {
          await enqueueOp({
            id: op_${Date.now()},
            type: "comment",
            postId,
            payload: { comments: (posts.find((p) => p.id === postId)?.comments || []).concat(comment) },
          });
          return;
        }

        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          // enqueue comment update for later
          const target = posts.find((p) => p.id === postId) || {};
          await enqueueOp({
            id: op_${Date.now()},
            type: "comment",
            postId,
            payload: { comments: [...(target.comments || []), comment] },
          });
          return;
        }

        const target = posts.find((p) => p.id === postId);
        if (target) {
          await updatePost(postId, {
            comments: [...(target.comments || []), comment],
          });
        }
      } catch (e) {
        console.error("Comment failed:", e);
      }
    },
    [posts]
  );

  const deleteComment = useCallback(
    async (postId, commentId) => {
      Alert.alert(
        "Delete Comment",
        "Are you sure you want to delete this comment?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              setPosts((prev) =>
                prev.map((p) =>
                  p.id === postId
                    ? {
                        ...p,
                        comments: (p.comments || []).filter((c) => c.id !== commentId),
                      }
                    : p
                )
              );

              setSelectedPost((prev) =>
                prev && prev.id === postId
                  ? {
                      ...prev,
                      comments: (prev.comments || []).filter((c) => c.id !== commentId),
                    }
                  : prev
              );

              try {
                // If local placeholder, enqueue local comment change and do not call server
                if (String(postId).startsWith("local_")) {
                  const target = posts.find((p) => p.id === postId) || {};
                  await enqueueOp({
                    id: op_${Date.now()},
                    type: "comment",
                    postId,
                    payload: { comments: (target.comments || []).filter((c) => c.id !== commentId) },
                  });
                  return;
                }

                const state = await NetInfo.fetch();
                if (!state.isConnected) {
                  const target = posts.find((p) => p.id === postId) || {};
                  await enqueueOp({
                    id: op_${Date.now()},
                    type: "comment",
                    postId,
                    payload: { comments: (target.comments || []).filter((c) => c.id !== commentId) },
                  });
                  return;
                }

                const target = posts.find((p) => p.id === postId);
                if (target) {
                  await updatePost(postId, {
                    comments: target.comments.filter((c) => c.id !== commentId),
                  });
                }
              } catch (e) {
                console.error("Delete comment failed:", e);
              }
            },
          },
        ]
      );
    },
    [posts]
  );

  const handleAddPost = useCallback(() => {
    setPostType("text");
    setPostContent("");
    setMediaUris([]);
    setEditingPostId(null);
    setModalVisible(true);
  }, []);

  const handleEditPost = useCallback(
    (postId) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      setEditingPostId(postId);
      setPostContent(post.content || "");
      setPostType(
        post.media_urls && post.media_urls.length ? post.media_type || "image" : "text"
      );
      setMediaUris(post.media_urls || []);
      setModalVisible(true);
    },
    [posts]
  );

  const handlePickMedia = useCallback(async (type) => {
    try {
      const uri = await pickMedia(type);
      if (uri) {
        setMediaUris((prev) => [...prev, uri]);
        setPostType(type);
      }
    } catch (e) {
      Alert.alert("Error", "Failed to pick media");
    }
  }, []);

  const handleRemoveMediaAt = useCallback((index) => {
    setMediaUris((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Submit post. If offline, create local placeholder and enqueue create payload (with localId).
  const handleSubmitPost = useCallback(async () => {
    if (!postContent.trim() && mediaUris.length === 0) {
      Alert.alert("Validation", "Please enter text or select media.");
      return;
    }

    try {
      if (editingPostId) {
        // editing existing post - if local placeholder just update local state,
        // otherwise attempt server update or enqueue.
        if (String(editingPostId).startsWith("local_")) {
          setPosts((prev) =>
            prev.map((p) =>
              p.id === editingPostId
                ? { ...p, content: postContent, media_urls: mediaUris, media_type: mediaUris.length ? postType : "none" }
                : p
            )
          );
        } else {
          const state = await NetInfo.fetch();
          if (!state.isConnected) {
            await enqueueOp({
              id: op_${Date.now()},
              type: "update",
              postId: editingPostId,
              payload: {
                content: postContent,
                media_type: mediaUris.length ? postType : "none",
                media_urls: mediaUris,
              },
            });
            setPosts((prev) =>
              prev.map((p) =>
                p.id === editingPostId
                  ? { ...p, content: postContent, media_urls: mediaUris, media_type: mediaUris.length ? postType : "none" }
                  : p
              )
            );
          } else {
            await updatePost(editingPostId, {
              content: postContent,
              media_type: mediaUris.length ? postType : "none",
              media_urls: mediaUris,
            });
          }
        }
      } else {
        // new post
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          // offline -> create local placeholder + enqueue create payload (include localId)
          const localId = local_${Date.now()};
          const createdAtIso = new Date().toISOString();
          await enqueuePost({
            // offlineQueue expects simple post payload; include localId so we can remove it if user deletes before sync
            localId,
            username: "current_user",
            avatar: "https://i.pravatar.cc/150?img=1",
            content: postContent,
            mediaUris, // local URIs so offlineQueue can upload later
            media_type: postType,
            likes: [],
            comments: [],
            created_at: createdAtIso,
          });

          // optimistic UI: add local placeholder post
          setPosts((prev) => [
            {
              id: localId,
              username: "current_user",
              avatar: "https://i.pravatar.cc/150?img=1",
              content: postContent,
              media_urls: mediaUris,
              media_type: postType,
              likes: [],
              comments: [],
              created_at: Date.now(),
              _offline: true,
            },
            ...prev,
          ]);

          Alert.alert("Saved offline", "Your post will be uploaded when network is available.");
          setModalVisible(false);
          setPostContent("");
          setMediaUris([]);
          setEditingPostId(null);
          return;
        }

        // online: create immediately
        await createPost({
          username: "current_user",
          avatar: "https://i.pravatar.cc/150?img=1",
          content: postContent,
          media_type: mediaUris.length ? postType : "none",
          media_urls: mediaUris,
          likes: [],
          comments: [],
          created_at: new Date().toISOString(),
        });
      }

      setModalVisible(false);
      setPostContent("");
      setMediaUris([]);
      setEditingPostId(null);
      await loadPosts();
    } catch (e) {
      console.error("Post submission failed:", e);

      const msg = (e && e.message) ? String(e.message) : "";
      const isNetworkErr =
        msg.toLowerCase().includes("network") || msg === "Network request failed";

      if (isNetworkErr) {
        // fallback to offline create path
        try {
          const localId = local_${Date.now()};
          await enqueuePost({
            localId,
            username: "current_user",
            avatar: "https://i.pravatar.cc/150?img=1",
            content: postContent,
            mediaUris,
            media_type: postType,
            likes: [],
            comments: [],
            created_at: new Date().toISOString(),
          });

          setPosts((prev) => [
            {
              id: localId,
              username: "current_user",
              avatar: "https://i.pravatar.cc/150?img=1",
              content: postContent,
              media_urls: mediaUris,
              media_type: postType,
              likes: [],
              comments: [],
              created_at: Date.now(),
              _offline: true,
            },
            ...prev,
          ]);

          Alert.alert("Saved offline", "Your post will be uploaded when network is available.");
          setModalVisible(false);
          setPostContent("");
          setMediaUris([]);
          setEditingPostId(null);
          return;
        } catch (qErr) {
          console.error("Failed to enqueue post:", qErr);
        }
      }

      Alert.alert("Error", "Failed to submit post");
    }
  }, [postContent, mediaUris, editingPostId, postType, loadPosts]);

  // Delete post handler: works for local placeholders and server posts.
  const handleDeletePost = useCallback(async (postId) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            // if local placeholder -> remove locally and remove queued create if exists
            if (String(postId).startsWith("local_")) {
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              // remove from offline create queue so it won't be uploaded later
              await removeQueuedCreateByLocalId(postId);
              return;
            }

            // for server posts: if offline, remove locally and enqueue delete op to run later
            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              await enqueueOp({
                id: op_${Date.now()},
                type: "delete",
                postId,
              });
              Alert.alert("Will delete when online", "The post will be deleted on the server when network is available.");
              return;
            }

            // online: call API
            await deletePost(postId);
            setPosts((prev) => prev.filter((p) => p.id !== postId));
          } catch (e) {
            console.error("Delete failed:", e);
            Alert.alert("Error", "Failed to delete post");
          }
        },
      },
    ]);
  }, []);

  const handleCommentPress = useCallback(
    (postId) => {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        setSelectedPost(post);
        setCommentsModalVisible(true);
      }
    },
    [posts]
  );

  const handleViewComments = useCallback((post) => {
    setSelectedPost(post);
    setCommentsModalVisible(true);
  }, []);

  // ============ STORY OPERATIONS ============
  const openStoryViewer = useCallback((index) => {
    setActiveStoryIndex(index);
    setActiveStoryImageIndex(0);
    setStoryProgress(0);
    setStoryViewerVisible(true);

    setStories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, viewed: true } : s))
    );
  }, []);

  const closeStoryViewer = useCallback(() => {
    setStoryViewerVisible(false);
    if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  }, []);

  const advanceStory = useCallback(() => {
    const story = stories[activeStoryIndex];
    if (!story) return;

    const atLastImage = activeStoryImageIndex >= story.images.length - 1;

    if (!atLastImage) {
      setActiveStoryImageIndex((s) => s + 1);
      setStoryProgress(0);
      return;
    }

    const atLastStory = activeStoryIndex >= stories.length - 1;
    if (!atLastStory) {
      setActiveStoryIndex((s) => s + 1);
      setActiveStoryImageIndex(0);
      setStoryProgress(0);
      return;
    }

    closeStoryViewer();
  }, [stories, activeStoryIndex, activeStoryImageIndex, closeStoryViewer]);

  const goToPreviousStory = useCallback(() => {
    if (activeStoryImageIndex > 0) {
      setActiveStoryImageIndex((s) => s - 1);
      setStoryProgress(0);
    } else if (activeStoryIndex > 0) {
      setActiveStoryIndex((s) => s - 1);
      setActiveStoryImageIndex(0);
      setStoryProgress(0);
    }
  }, [activeStoryIndex, activeStoryImageIndex]);

  const toggleLikeStory = useCallback((index) => {
    setStories((prev) =>
      prev.map((s, i) => (i === index ? { ...s, likedByMe: !s.likedByMe } : s))
    );
  }, []);

  const handleStoryPress = useCallback(
    (story, index) => {
      if (story.isAddStory) {
        handlePickMedia("image").then((uri) => {
          if (uri) {
            Alert.alert("Story Created", "Your story has been added!");
          }
        });
      } else {
        openStoryViewer(index);
      }
    },
    [openStoryViewer, handlePickMedia]
  );

  useEffect(() => {
    if (!storyViewerVisible) {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
      return;
    }

    setStoryProgress(0);

    let currentProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      currentProgress += (STORY_PROGRESS_INTERVAL / STORY_DURATION) * 100;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(progressIntervalRef.current);
      }
      setStoryProgress(currentProgress);
    }, STORY_PROGRESS_INTERVAL);

    storyTimerRef.current = setTimeout(() => {
      advanceStory();
    }, STORY_DURATION);

    return () => {
      if (storyTimerRef.current) clearTimeout(storyTimerRef.current);
      if (progressIntervalRef.current)
        clearInterval(progressIntervalRef.current);
    };
  }, [
    storyViewerVisible,
    activeStoryIndex,
    activeStoryImageIndex,
    advanceStory,
  ]);

  // ============ RENDER METHODS ============
  const renderStoryItem = useCallback(
    ({ item: story, index }) => (
      <StoryItem story={story} index={index} onPress={handleStoryPress} />
    ),
    [handleStoryPress]
  );

  const renderPostItem = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onLike={toggleLikePost}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onComment={handleCommentPress}
        onViewComments={handleViewComments}
      />
    ),
    [
      toggleLikePost,
      handleEditPost,
      handleDeletePost,
      handleCommentPress,
      handleViewComments,
    ]
  );

  const keyExtractor = useCallback((item) => item.id, []);

  const ListHeaderComponent = useMemo(
    () => (
      <View style={styles.storiesContainer}>
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesContent}
        />
      </View>
    ),
    [stories, renderStoryItem]
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.cardBackground}
      />

      {/* Header */}
      <View style={styles.header}></View>

      {loading ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centerFill}>
          <MaterialCommunityIcons
            name="camera-outline"
            size={64}
            color={COLORS.textSecondary}
          />
          <Text style={styles.noPostsText}>No posts yet</Text>
          <Text style={styles.noPostsSubtext}>Start sharing your moments!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={keyExtractor}
          renderItem={renderPostItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          ListHeaderComponent={ListHeaderComponent}
          contentContainerStyle={styles.feedContent}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={Platform.OS === "android"}
        />
      )}

      {/* FAB */}
      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={handleAddPost}
        small
      />

      {/* Create/Edit Post Modal */}
      <Modal
        isVisible={modalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.createPostModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={28}
                  color={COLORS.text}
                />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingPostId ? "Edit Post" : "New Post"}
              </Text>
              <TouchableOpacity onPress={handleSubmitPost}>
                <Text style={styles.modalDoneText}>
                  {editingPostId ? "Update" : "Share"}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.modalUserInfo}>
                <Image
                  source={{ uri: "https://i.pravatar.cc/150?img=1" }}
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalUsername}>current_user</Text>
              </View>

              <RNTextInput
                placeholder="What's on your mind?"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                style={styles.nativeTextInput}
                maxLength={2200}
                autoFocus
              />

              {mediaUris.length > 0 && (
                <FlatList
                  data={mediaUris}
                  horizontal
                  keyExtractor={(_, i) => String(i)}
                  showsHorizontalScrollIndicator={false}
                  style={styles.mediaPreviewList}
                  renderItem={({ item, index }) => (
                    <View style={styles.mediaPreviewItem}>
                      <Image
                        source={{ uri: item }}
                        style={styles.previewImage}
                      />
                      <TouchableOpacity
                        style={styles.removeMediaBtn}
                        onPress={() => handleRemoveMediaAt(index)}
                      >
                        <MaterialCommunityIcons
                          name="close-circle"
                          size={28}
                          color="#fff"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              )}

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => handlePickMedia("image")}
                >
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={28}
                    color={COLORS.accent}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalActionBtn}
                  onPress={() => handlePickMedia("video")}
                >
                  <MaterialCommunityIcons
                    name="video-outline"
                    size={28}
                    color={COLORS.accent}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Comments Modal */}
      <CommentsModal
        visible={commentsModalVisible}
        post={selectedPost}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedPost(null);
        }}
        onAddComment={addCommentToPost}
        onDeleteComment={deleteComment}
      />

      {/* Story Viewer */}
      <StoryViewer
        visible={storyViewerVisible}
        stories={stories}
        activeIndex={activeStoryIndex}
        activeImageIndex={activeStoryImageIndex}
        onClose={closeStoryViewer}
        onNext={advanceStory}
        onPrev={goToPreviousStory}
        onLike={toggleLikeStory}
        progress={storyProgress}
      />
    </SafeAreaView>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noPostsText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  noPostsSubtext: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.cardBackground,
  },

  storiesContainer: {
    paddingVertical: 22,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  storiesContent: {
    paddingHorizontal: 12,
  },
  storyItem: {
    marginRight: 12,
    alignItems: "center",
    width: 72,
  },
  addStoryBorder: {
    position: "relative",
  },
  addStoryPlus: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.cardBackground,
  },
  storyBorder: {
    padding: 2,
    borderRadius: 38,
    marginBottom: 4,
  },
  storyBorderUnviewed: {
    borderWidth: 3,
    borderColor: COLORS.like,
  },
  storyBorderViewed: {
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  storyImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.border,
  },
  storyUsername: {
    fontSize: 12,
    color: COLORS.text,
    textAlign: "center",
    width: 72,
    marginTop: 2,
  },
  feedContent: {
    paddingBottom: 20,
  },
  postCard: {
    backgroundColor: COLORS.cardBackground,
    marginBottom: 12,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  postAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: COLORS.border,
  },
  postUser: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.text,
  },
  imageLoadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 10,
  },
  postImage: {
    width: width,
    height: width,
    backgroundColor: COLORS.border,
  },
  postActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  postActionsLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionBtn: {
    marginRight: 16,
  },
  likesCount: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.text,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  postContentContainer: {
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  postContent: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  viewComments: {
    color: COLORS.textSecondary,
    fontSize: 14,
    paddingHorizontal: 12,
    marginBottom: 4,
  },
  postTime: {
    color: COLORS.textSecondary,
    fontSize: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  createPostModal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.accent,
  },
  modalBody: {
    padding: 16,
  },
  modalUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: COLORS.border,
  },
  modalUsername: {
    fontWeight: "600",
    fontSize: 14,
    color: COLORS.text,
  },
  nativeTextInput: {
    minHeight: 120,
    maxHeight: 300,
    fontSize: 16,
    color: COLORS.text,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  mediaPreviewList: {
    marginBottom: 16,
  },
  mediaPreviewItem: {
    marginRight: 8,
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    backgroundColor: COLORS.border,
  },
  removeMediaBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 14,
  },
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  modalActionBtn: {
    padding: 8,
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 80,
    backgroundColor: COLORS.accent,
  },
  commentsModal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  commentsContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
    paddingBottom: Platform.OS === "ios" ? 34 : 0,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    textAlign: "center",
  },
  commentsList: {
    maxHeight: height * 0.6,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
    alignItems: "flex-start",
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: COLORS.border,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },
  commentUser: {
    fontWeight: "600",
    marginRight: 6,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyComments: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyCommentsText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  commentInputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: COLORS.border,
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    maxHeight: 100,
    paddingVertical: 8,
  },
  postButtonText: {
    color: COLORS.accent,
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 12,
  },
  postButtonDisabled: {
    color: COLORS.textSecondary,
  },
  storyViewerOverlay: {
    flex: 1,
    backgroundColor: "#000",
  },
  storyProgressContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 8,
    right: 8,
    flexDirection: "row",
    zIndex: 20,
  },
  progressTrack: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.3)",
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#fff",
  },
  storyTopBar: {
    marginTop: Platform.OS === "ios" ? 70 : 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    zIndex: 10,
  },
  storyUserInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  storyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  storyUsernameLarge: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 8,
  },
  storyTime: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
  },
  storyCloseBtn: {
    padding: 4,
  },
  storyViewerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  storyViewerImage: {
    width: width,
    height: height,
  },
  storyBottomBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  storyReplyContainer: {
    flex: 1,
    marginRight: 12,
  },
  storyReplyInput: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#fff",
    fontSize: 14,
  },
  storyLikeBtn: {
    padding: 4,
  },
});

export default Newsfeed;
// ...existing code...
