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
import { supabaseAuth } from "../../lib/supabaseClient";

import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
} from "../../NewsfeedCRUD/api/posts";
import { pickMedia } from "../../NewsfeedCRUD/api/media";

import { enqueuePost, startAutoSync } from "../../NewsfeedCRUD/api/offlineQueue";
// changed: import entire storage module namespace and resolve uploader at runtime
import * as StorageAPI from "../../NewsfeedCRUD/api/storage";

// NOTE: removed static import of CallFeature that triggers native-module require in Expo Go
// Use runtime-safe require below so Expo Go doesn't crash if react-native-agora is not linked.
let VoiceCallComponent = null;
try {
  // eslint-disable-next-line global-require
  VoiceCallComponent = require("./CallFeature").default;
} catch (err) {
  VoiceCallComponent = null;
  // keep a warning for debugging in development
  // (this avoids the red screen in Expo Go when native module is missing)
  // eslint-disable-next-line no-console
  console.warn(
    "CallFeature not loaded (react-native-agora missing or native module not available).",
    err && err.message ? err.message : err
  );
}

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

const isVideoUrl = (uri) => {
  if (!uri) return false;
  try {
    const u = String(uri);
    return /\.(mp4|mov|webm|mkv|3gp)(?:\?.*)?$/i.test(u) || u.includes("/video/") || u.includes("content-type=video");
  } catch {
    return false;
  }
};

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

function getStorageUploader() {
  const s = StorageAPI || {};
  const candidates = [
    s.uploadFileToBucket,
    s.uploadFile,
    s.upload,
    s.default && s.default.uploadFileToBucket,
    s.default && s.default.uploadFile,
    s.default && s.default.upload,
  ];
  const fn = candidates.find((c) => typeof c === 'function');
  if (!fn) {
    console.error("Storage uploader not found. exports in ../../NewsfeedCRUD/api/storage:", Object.keys(s));
    return null;
  }
  return fn;
}

async function uploadMediaUrisToPostsBucket(uris = []) {
  const uploadedUrls = [];
  const uploader = getStorageUploader();
  for (const uri of uris || []) {
    if (!uri) continue;
    if (typeof uri === "string" && (uri.startsWith("http://") || uri.startsWith("https://"))) {
      uploadedUrls.push(uri);
      continue;
    }
    if (!uploader) {
      console.error("uploadMediaUrisToPostsBucket: no uploader available, skipping upload for", uri);
      continue;
    }
    try {
      const res = await uploader(uri, "posts");
      let url = null;
      if (!res) {
        url = null;
      } else if (typeof res === "string") {
        url = res;
      } else if (res.publicURL) {
        url = res.publicURL;
      } else if (res.publicUrl) {
        url = res.publicUrl;
      } else if (res.url) {
        url = res.url;
      } else if (res.Key) {
        url = res.Key;
      } else if (res.path) {
        url = res.path;
      } else {
        url = String(res);
      }

      if (url) {
        if (typeof url === "string" && !/^https?:\/\//i.test(url) && url.includes("/")) {
          try {
            const base = StorageAPI?.supabaseUrl || StorageAPI?.supabase?.url || null;
            if (base && !/^https?:\/\//i.test(url)) {
              const baseClean = String(base).replace(/\/+$/, "");
              const manual = `${baseClean}/storage/v1/object/public/posts/${encodeURIComponent(url.replace(/^\/+/, ''))}`;
              uploadedUrls.push(manual);
              continue;
            }
          } catch (e) {}
        }
        uploadedUrls.push(url);
      } else {
        console.warn("uploadMediaUrisToPostsBucket: unexpected upload result", res);
      }
    } catch (e) {
      console.error("uploadMediaUrisToPostsBucket upload failed for", uri, e);
    }
  }
  return uploadedUrls;
}

// ============ AVATAR COMPONENT ============
const UserAvatar = React.memo(({ username, avatarUrl, size = 40, style }) => {
  const getInitial = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const getBackgroundColor = (name) => {
    if (!name) return '#FF1493';
    const colors = ['#FF1493', '#9C27B0', '#3F51B5', '#2196F3', '#00BCD4', '#009688', '#4CAF50', '#FF9800', '#FF5722', '#E91E63'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (avatarUrl && !avatarUrl.includes('pravatar.cc')) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#f0f0f0',
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(username),
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#FFFFFF',
          fontSize: size * 0.5,
          fontWeight: 'bold',
        }}
      >
        {getInitial(username)}
      </Text>
    </View>
  );
});

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
  ({
    post,
    onLike,
    onEdit,
    onDelete,
    onComment,
    onViewComments,
    currentUsername,
    shouldPlay,
    onViewMedia,
    onViewLikes,
  }) => {
    const [imageLoading, setImageLoading] = useState(true);
    const isLiked = post.likes && post.likes.includes(currentUsername);
    const isOwnPost = post.username === currentUsername;

    const handleDoubleTap = useCallback(() => {
      if (!isLiked) {
        onLike(post.id);
      }
    }, [isLiked, onLike, post.id]);

    const lastTapRef = useRef(null);

    const currentMediaIndexRef = useRef(0);
    const mediaViewabilityConfig = useRef({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 50,
    }).current;
    const onViewableMediaChanged = useRef(({ viewableItems }) => {
      if (viewableItems && viewableItems.length > 0) {
        currentMediaIndexRef.current = viewableItems[0].index || 0;
      }
    }).current;

    const handleSingleOrDoubleTap = () => {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current < 300) {
        lastTapRef.current = null;
        handleDoubleTap();
        return;
      }
      lastTapRef.current = now;
      setTimeout(() => {
        if (!lastTapRef.current) return;
        const diff = Date.now() - now;
        if (diff >= 300) {
          const idx = currentMediaIndexRef.current || 0;
          const uri = (post.media_urls && post.media_urls[idx]) || null;
          if (uri && typeof onViewMedia === "function") {
            const isVideo = post.media_type === "video" || isVideoUrl(uri);
            onViewMedia(uri, isVideo);
          }
          lastTapRef.current = null;
        }
      }, 300);
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <UserAvatar
              username={post.username}
              avatarUrl={post.avatar}
              size={32}
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

        {post.media_urls && post.media_urls.length > 0 && (
          <TouchableOpacity activeOpacity={1} onPress={handleSingleOrDoubleTap}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.accent} />
              </View>
            )}
            <FlatList
              data={post.media_urls}
              horizontal
              pagingEnabled
              keyExtractor={(_, i) => `${post.id}_m_${i}`}
              renderItem={({ item }) => {
                const itemIsVideo = post.media_type === "video" || isVideoUrl(item);
                if (itemIsVideo) {
                  return (
                    <TouchableOpacity activeOpacity={1} onPress={() => onViewMedia?.(item, true)}>
                      <Video
                        source={{ uri: item }}
                        style={styles.postImage}
                        useNativeControls
                        resizeMode="contain"
                        isLooping
                        onLoadStart={() => setImageLoading(true)}
                        onLoad={() => setImageLoading(false)}
                        onError={() => setImageLoading(false)}
                        shouldPlay={!!shouldPlay}
                        isMuted={!shouldPlay ? true : false}
                      />
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity activeOpacity={1} onPress={() => onViewMedia?.(item, false)}>
                    <Image
                      source={{ uri: item }}
                      style={styles.postImage}
                      onLoadStart={() => setImageLoading(true)}
                      onLoadEnd={() => setImageLoading(false)}
                      onError={() => setImageLoading(false)}
                    />
                  </TouchableOpacity>
                );
              }}
              showsHorizontalScrollIndicator={false}
              viewabilityConfig={mediaViewabilityConfig}
              onViewableItemsChanged={onViewableMediaChanged}
            />
          </TouchableOpacity>
        )}

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

        {/* Likes Count - now clickable to ask parent to open likers list */}
        {post.likes && post.likes.length > 0 && (
          <TouchableOpacity onPress={() => typeof onViewLikes === "function" && onViewLikes(post)}>
            <Text style={styles.likesCount}>
              {post.likes.length} {post.likes.length === 1 ? "like" : "likes"}
            </Text>
          </TouchableOpacity>
        )}

        {post.content && (
          <View style={styles.postContentContainer}>
            <Text style={styles.postContent}>
              <Text style={styles.postUser}>{post.username}</Text>{" "}
              {post.content}
            </Text>
          </View>
        )}

        {post.comments && post.comments.length > 0 && (
          <TouchableOpacity onPress={() => onViewComments(post)}>
            <Text style={styles.viewComments}>
              View all {post.comments.length} comments
            </Text>
          </TouchableOpacity>
        )}

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
  currentUsername,
  currentUser,
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
              <UserAvatar
                username={item.user}
                avatarUrl={item.avatar}
                size={32}
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
              {item.user === currentUsername && (
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
          <UserAvatar
            username={currentUsername}
            avatarUrl={currentUser?.user_metadata?.avatar_url}
            size={32}
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

// ============ NEW: Likes Modal ============
const LikesModal = ({ visible, likes, onClose }) => {
  const items = Array.isArray(likes)
    ? likes.map((l, idx) => {
        if (!l) return { id: `l_${idx}`, username: String(l) };
        if (typeof l === "string") return { id: `l_${l}_${idx}`, username: l };
        if (typeof l === "object") {
          const username = l.username || l.user || l.name || l.id || JSON.stringify(l);
          const avatar = l.avatar || l.avatar_url || l.photo || null;
          return { id: `l_${username}_${idx}`, username, avatar };
        }
        return { id: `l_${idx}`, username: String(l) };
      })
    : [];

  return (
    <Modal isVisible={visible} onBackdropPress={onClose} style={styles.likesModal}>
      <View style={styles.likesContainer}>
        <View style={styles.likesHeader}>
          <Text style={styles.likesTitle}>Liked by</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={styles.likeRow}>
              <UserAvatar username={item.username} avatarUrl={item.avatar} size={36} style={styles.likeAvatar} />
              <Text style={styles.likeName}>{item.username}</Text>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyLikes}>
              <Text style={styles.emptyLikesText}>No likes yet</Text>
            </View>
          }
        />
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
                        ? `${progress}%`
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
  let ts = timestamp;
  if (typeof ts === "string") {
    const parsed = Date.parse(ts);
    ts = isNaN(parsed) ? undefined : parsed;
  } else if (typeof ts === "number") {
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
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
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
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUsername, setCurrentUsername] = useState("current_user");
  const storyTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // NEW: call modal visibility
  const [callModalVisible, setCallModalVisible] = useState(false);

  const [visiblePostIds, setVisiblePostIds] = useState([]);

  const [mediaViewerVisible, setMediaViewerVisible] = useState(false);
  const [mediaViewerItem, setMediaViewerItem] = useState(null);

  // NEW: likes modal state
  const [likesModalVisible, setLikesModalVisible] = useState(false);
  const [likesForModal, setLikesForModal] = useState([]);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await supabaseAuth.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "current_user";
        setCurrentUsername(fullName);
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const openMediaViewer = useCallback((uri, isVideo = false) => {
    setMediaViewerItem({ uri, isVideo });
    setMediaViewerVisible(true);
  }, []);

  const closeMediaViewer = useCallback(() => {
    setMediaViewerVisible(false);
    setMediaViewerItem(null);
  }, []);

  // NEW: open/close likes modal handlers
  const openLikesModal = useCallback((post) => {
    if (!post) return;
    setLikesForModal(post.likes || []);
    setLikesModalVisible(true);
  }, []);

  const closeLikesModal = useCallback(() => {
    setLikesModalVisible(false);
    setLikesForModal([]);
  }, []);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPosts();

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
            `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
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

  useEffect(() => {
    const uploader = getStorageUploader();
    const unsubscribe = startAutoSync({
      createPostFn: createPost,
      uploadFn: uploader,
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const processOpsQueue = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;
      let q = await getOpsQueue();
      if (!q || q.length === 0) return;

      for (const op of q.slice()) {
        try {
          if (String(op.postId || "").startsWith("local_")) {
            continue;
          }

          if (op.type === "delete") {
            await deletePost(op.postId);
          } else if (op.type === "update") {
            await updatePost(op.postId, op.payload);
          } else if (op.type === "like") {
            await updatePost(op.postId, { likes: op.payload.likes });
          } else if (op.type === "comment") {
            await updatePost(op.postId, { comments: op.payload.comments });
          }
          q = q.filter((x) => x.id !== op.id);
          await setOpsQueue(q);
        } catch (err) {
          console.error("processOpsQueue item failed, stop and retry later", err);
          break;
        }
      }
    } catch (e) {
      console.error("processOpsQueue failed", e);
    }
  }, []);

  useEffect(() => {
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

  const toggleLikePost = useCallback(
    async (postId) => {
      try {
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            const already = (p.likes || []).includes(currentUsername);
            const likes = already
              ? (p.likes || []).filter((l) => l !== currentUsername)
              : [...(p.likes || []), currentUsername];
            return { ...p, likes };
          })
        );

        if (String(postId).startsWith("local_")) {
          await enqueueOp({
            id: `op_${Date.now()}`,
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
        const already = (target.likes || []).includes(currentUsername);
        const likes = already
          ? (target.likes || []).filter((l) => l !== currentUsername)
          : [...(target.likes || []), currentUsername];

        if (!state.isConnected) {
          await enqueueOp({
            id: `op_${Date.now()}`,
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
    [posts, currentUsername]
  );

  const addCommentToPost = useCallback(
    async (postId, text) => {
      if (!text.trim()) return;

      const comment = {
        id: `c_${Date.now()}_${Math.random()}`,
        user: currentUsername,
        avatar: currentUser?.user_metadata?.avatar_url || null,
        text: text.trim(),
        created_at: Date.now(),
      };

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...(p.comments || []), comment] } : p
        )
      );

      setSelectedPost((prev) =>
        prev && prev.id === postId
          ? { ...prev, comments: [...(prev.comments || []), comment] }
          : prev
      );

      try {
        if (String(postId).startsWith("local_")) {
          await enqueueOp({
            id: `op_${Date.now()}`,
            type: "comment",
            postId,
            payload: { comments: (posts.find((p) => p.id === postId)?.comments || []).concat(comment) },
          });
          return;
        }

        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          const target = posts.find((p) => p.id === postId) || {};
          await enqueueOp({
            id: `op_${Date.now()}`,
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
    [posts, currentUsername, currentUser]
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
                if (String(postId).startsWith("local_")) {
                  const target = posts.find((p) => p.id === postId) || {};
                  await enqueueOp({
                    id: `op_${Date.now()}`,
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
                    id: `op_${Date.now()}`,
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

  // Submit post (unchanged) ...
  const handleSubmitPost = useCallback(async () => {
    if (!postContent.trim() && mediaUris.length === 0) {
      Alert.alert("Validation", "Please enter text or select media.");
      return;
    }

    try {
      if (editingPostId) {
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
              id: `op_${Date.now()}`,
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
            let finalMediaUrls = mediaUris;
            try {
              finalMediaUrls = await uploadMediaUrisToPostsBucket(mediaUris);
            } catch (uploadErr) {
              console.error("Failed to upload media while editing:", uploadErr);
            }

            await updatePost(editingPostId, {
              content: postContent,
              media_type: finalMediaUrls.length ? postType : "none",
              media_urls: finalMediaUrls,
            });
          }
        }
      } else {
        const state = await NetInfo.fetch();
        if (!state.isConnected) {
          const localId = `local_${Date.now()}`;
          const createdAtIso = new Date().toISOString();
          await enqueuePost({
            localId,
            username: currentUsername,
            avatar: currentUser?.user_metadata?.avatar_url || null,
            content: postContent,
            mediaUris,
            media_type: postType,
            likes: [],
            comments: [],
            created_at: createdAtIso,
            bucket: "posts",
          });

          setPosts((prev) => [
            {
              id: localId,
              username: currentUsername,
              avatar: currentUser?.user_metadata?.avatar_url || null,
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

        let uploadedUrls = [];
        if (mediaUris.length > 0) {
          uploadedUrls = await uploadMediaUrisToPostsBucket(mediaUris);
        }

        await createPost({
          username: currentUsername,
          avatar: currentUser?.user_metadata?.avatar_url || null,
          content: postContent,
          media_type: uploadedUrls.length ? postType : "none",
          media_urls: uploadedUrls,
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
        try {
          const localId = `local_${Date.now()}`;
          await enqueuePost({
            localId,
            username: currentUsername,
            avatar: currentUser?.user_metadata?.avatar_url || null,
            content: postContent,
            mediaUris,
            media_type: postType,
            likes: [],
            comments: [],
            created_at: new Date().toISOString(),
            bucket: "posts",
          });

          setPosts((prev) => [
            {
              id: localId,
              username: currentUsername,
              avatar: currentUser?.user_metadata?.avatar_url || null,
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
  }, [postContent, mediaUris, editingPostId, postType, loadPosts, currentUsername, currentUser]);

  const handleDeletePost = useCallback(async (postId) => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            if (String(postId).startsWith("local_")) {
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              await removeQueuedCreateByLocalId(postId);
              return;
            }

            const state = await NetInfo.fetch();
            if (!state.isConnected) {
              setPosts((prev) => prev.filter((p) => p.id !== postId));
              await enqueueOp({
                id: `op_${Date.now()}`,
                type: "delete",
                postId,
              });
              Alert.alert("Will delete when online", "The post will be deleted on the server when network is available.");
              return;
            }

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

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 200,
  }).current;

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    try {
      const ids = (viewableItems || []).map((v) => v.item?.id).filter(Boolean);
      setVisiblePostIds(ids);
    } catch (e) {
      // ignore
    }
  }).current;

  const renderStoryItem = useCallback(
    ({ item: story, index }) => (
      <StoryItem story={story} index={index} onPress={handleStoryPress} />
    ),
    [handleStoryPress]
  );

  const renderPostItem = useCallback(
    ({ item }) => {
      const shouldPlay = visiblePostIds.includes(item.id) && (item.media_urls || []).some(isVideoUrl);
      return (
        <PostCard
          post={item}
          onLike={toggleLikePost}
          onEdit={handleEditPost}
          onDelete={handleDeletePost}
          onComment={handleCommentPress}
          onViewComments={handleViewComments}
          currentUsername={currentUsername}
          shouldPlay={shouldPlay}
          onViewMedia={openMediaViewer}
          onViewLikes={openLikesModal}
        />
      );
    },
    [
      toggleLikePost,
      handleEditPost,
      handleDeletePost,
      handleCommentPress,
      handleViewComments,
      currentUsername,
      visiblePostIds,
      openMediaViewer,
      openLikesModal,
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

      {/* header with centered app name and call icon */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        {/* updated: styled app name with app colors */}
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitlePrimary}>Aya</Text>
          <Text style={styles.headerTitleSecondary}>Social</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => setCallModalVisible(true)}
            style={styles.iconCircle}
            accessibilityLabel="Voice call"
          >
            <MaterialCommunityIcons name="phone" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}

      <FAB
        style={styles.fab}
        icon="plus"
        color="#fff"
        onPress={handleAddPost}
        small
      />

      {/* Call modal */}
      <Modal
        isVisible={callModalVisible}
        onBackdropPress={() => setCallModalVisible(false)}
        style={styles.callModal}
        animationIn="slideInUp"
        animationOut="slideOutDown"
      >
        <View style={styles.callModalContent}>
          {VoiceCallComponent ? (
            <VoiceCallComponent />
          ) : (
            <View style={{flex:1,justifyContent:'center',alignItems:'center',padding:16}}>
              <Text style={{textAlign:'center',color:COLORS.text}}>
                Call feature unavailable in Expo Go. To enable it, install react-native-agora and run a custom dev client (EAS) or eject to the bare workflow and rebuild the app.
              </Text>
            </View>
          )}
        </View>
      </Modal>

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
                <UserAvatar
                  username={currentUsername}
                  avatarUrl={currentUser?.user_metadata?.avatar_url}
                  size={40}
                  style={styles.modalAvatar}
                />
                <Text style={styles.modalUsername}>{currentUsername}</Text>
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
                      {isVideoUrl(item) ? (
                        <Video
                          source={{ uri: item }}
                          style={styles.previewImage}
                          useNativeControls
                          resizeMode="contain"
                          isLooping
                        />
                      ) : (
                        <Image
                          source={{ uri: item }}
                          style={styles.previewImage}
                        />
                      )}
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

      <CommentsModal
        visible={commentsModalVisible}
        post={selectedPost}
        onClose={() => {
          setCommentsModalVisible(false);
          setSelectedPost(null);
        }}
        onAddComment={addCommentToPost}
        onDeleteComment={deleteComment}
        currentUsername={currentUsername}
        currentUser={currentUser}
      />

      {/* NEW: Likes modal rendered here */}
      <LikesModal visible={likesModalVisible} likes={likesForModal} onClose={closeLikesModal} />

      <RNModal visible={mediaViewerVisible} transparent animationType="fade" onRequestClose={closeMediaViewer}>
        <View style={{ flex: 1, backgroundColor: "#000" }}>
          <TouchableOpacity onPress={closeMediaViewer} style={{ position: "absolute", top: 40, right: 16, zIndex: 20 }}>
            <MaterialCommunityIcons name="close-circle" size={36} color="#fff" />
          </TouchableOpacity>

          {mediaViewerItem?.isVideo ? (
            <Video
              source={{ uri: mediaViewerItem.uri }}
              style={{ width: width, height: height, backgroundColor: "#000" }}
              useNativeControls
              resizeMode="contain"
              shouldPlay
            />
          ) : (
            <Image
              source={{ uri: mediaViewerItem?.uri }}
              style={{ width, height, resizeMode: "contain" }}
            />
          )}
        </View>
      </RNModal>

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
    alignItems: "center",
    paddingHorizontal: 12,
    // ensure header icon is not cut under status bar / notch on Android
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 12,
    paddingBottom: 10,
    backgroundColor: COLORS.cardBackground,
    // ensure header tall enough so content won't be cut
    minHeight: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 56 : 64,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    // placeholder to balance the right icon so title stays centered
    width: 44,
    height: 44,
  },
  /* header title container - updated styling for nicer app name */
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitlePrimary: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.accent,
    letterSpacing: 0.6,
    textShadowColor: "rgba(0,0,0,0.08)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerTitleSecondary: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    textTransform: "capitalize",
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.accent,
    overflow: "hidden",
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
  },
  headerRight: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  iconCircle: {
    backgroundColor: COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    right: 20,
    bottom: Platform.OS === 'ios' ? 120 : 100,
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

  /* Likes modal styles */
  likesModal: {
    margin: 0,
    justifyContent: "flex-end",
  },
  likesContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: height * 0.6,
    paddingBottom: Platform.OS === "ios" ? 34 : 12,
  },
  likesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  likesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  likeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  likeAvatar: {
    marginRight: 12,
    backgroundColor: COLORS.border,
  },
  likeName: {
    fontSize: 15,
    color: COLORS.text,
  },
  emptyLikes: {
    alignItems: "center",
    paddingVertical: 24,
  },
  emptyLikesText: {
    color: COLORS.textSecondary,
  },

  /* Call modal styles */
  callModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  callModalContent: {
    width: "92%",
    height: "78%",
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default Newsfeed;
// ...existing code...