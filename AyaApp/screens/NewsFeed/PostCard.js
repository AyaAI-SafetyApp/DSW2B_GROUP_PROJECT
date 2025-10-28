// ...existing code...
import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Video } from "expo-av"; // Use expo-av for video playback

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  text: "#262626",
  textSecondary: "#8E8E8E",
  border: "#EFEFEF",
  accent: "#E91E63",
  background: "#FFFFFF",
  muted: "#F5F5F5",
};

const isVideoUrl = (uri) => {
  if (!uri) return false;
  try {
    const u = String(uri);
    return /\.(mp4|mov|webm|mkv|3gp)(?:\?.*)?$/i.test(u) || u.includes("/video/") || u.includes("content-type=video");
  } catch {
    return false;
  }
};

const PostCard = ({
  post,
  onAddReaction,
  onLike,
  onEdit,
  onDelete,
  onComment,
  onViewComments,
  currentUsername,
  // added props
  shouldPlay,
  onViewMedia,
  onViewLikes, // <-- added prop so parent can show likers
}) => {
  const createdAt = useMemo(() => timeAgo(post.created_at), [post.created_at]);
  const media = Array.isArray(post.media_urls)
    ? post.media_urls
    : post.media_url
    ? [post.media_url]
    : [];

  const [loadingMap, setLoadingMap] = useState({}); // keyed by index

  const onLoadStart = useCallback((index) => {
    setLoadingMap((m) => ({ ...m, [index]: true }));
  }, []);

  const onLoadEnd = useCallback((index) => {
    setLoadingMap((m) => ({ ...m, [index]: false }));
  }, []);

  // track last tap for single vs double tap
  const lastTapRef = useRef(null);

  // track currently visible media index (so we only autoplay the visible video)
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

  const handleSingleOrDoubleTap = useCallback(
    (index) => {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current < 300) {
        // double tap -> like
        lastTapRef.current = null;
        if (typeof onLike === "function") onLike(post.id);
        return;
      }
      lastTapRef.current = now;
      setTimeout(() => {
        if (!lastTapRef.current) return;
        const diff = Date.now() - now;
        if (diff >= 300) {
          // single tap -> open media viewer for currently visible media (use index param)
          const idx = typeof index === "number" ? index : currentMediaIndexRef.current || 0;
          const uri = media[idx];
          if (uri && typeof onViewMedia === "function") {
            const isVideo = isVideoUrl(uri);
            onViewMedia(uri, isVideo);
          }
          lastTapRef.current = null;
        }
      }, 300);
    },
    [onLike, post.id, media, onViewMedia]
  );

  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username ? post.username.slice(0, 2).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.username}>{post.username || "Unknown User"}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => onEdit?.(post.id, post)}
          style={styles.iconAction}
        >
          <MaterialCommunityIcons name="pencil" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete?.(post.id)}>
          <MaterialCommunityIcons
            name="delete"
            size={22}
            color={COLORS.accent}
          />
        </TouchableOpacity>
      </View>

      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}

      {media && media.length > 0 ? (
        <View style={styles.mediaContainer}>
          <FlatList
            data={media}
            horizontal
            pagingEnabled
            keyExtractor={(_, i) => `${post.id}_media_${i}`}
            showsHorizontalScrollIndicator={false}
            viewabilityConfig={mediaViewabilityConfig}
            onViewableItemsChanged={onViewableMediaChanged}
            renderItem={({ item, index }) => {
              const video = isVideoUrl(item);
              return (
                <View style={styles.mediaItem}>
                  {loadingMap[index] && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="small" color={COLORS.accent} />
                    </View>
                  )}
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => handleSingleOrDoubleTap(index)}
                    style={{ flex: 1 }}
                  >
                    {video ? (
                      <Video
                        source={{ uri: item }}
                        style={styles.mediaFull}
                        useNativeControls
                        resizeMode="cover"
                        isLooping
                        onLoadStart={() => onLoadStart(index)}
                        onLoad={() => onLoadEnd(index)}
                        onError={() => onLoadEnd(index)}
                        // autoplay only when this post is marked shouldPlay and this media index is the visible one
                        shouldPlay={!!(shouldPlay && currentMediaIndexRef.current === index)}
                        isMuted={!(shouldPlay && currentMediaIndexRef.current === index)}
                      />
                    ) : (
                      <Image
                        source={{ uri: item }}
                        style={styles.mediaFull}
                        resizeMode="cover"
                        onLoadStart={() => onLoadStart(index)}
                        onLoadEnd={() => onLoadEnd(index)}
                        onError={() => onLoadEnd(index)}
                      />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => {
            if (typeof onLike === "function") return onLike(post.id);
            return onAddReaction?.("like", post.id);
          }}
        >
          <MaterialCommunityIcons
            name={
              Array.isArray(post.likes) && currentUsername && post.likes.includes(currentUsername)
                ? "heart"
                : "heart-outline"
            }
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => onComment?.(post.id)}>
          <MaterialCommunityIcons
            name="comment-outline"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons
            name="send-outline"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons
            name="bookmark-outline"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* clickable likes count: ask parent to show likers when provided */}
      {likesCount > 0 ? (
        <TouchableOpacity onPress={() => typeof onViewLikes === "function" && onViewLikes(post)}>
          <Text style={styles.viewLikes}>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {post.comments && post.comments.length > 0 ? (
        <TouchableOpacity onPress={() => onViewComments?.(post)}>
          <Text style={styles.viewComments}>View all {post.comments.length} comments</Text>
        </TouchableOpacity>
      ) : null}

      {createdAt ? <Text style={styles.timestamp}>{createdAt}</Text> : null}
    </View>
  );
};

function timeAgo(dateInput) {
  if (!dateInput) return "";
  const date = typeof dateInput === "number" ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: COLORS.text,
    fontWeight: "600",
  },
  username: {
    fontWeight: "bold",
    color: COLORS.text,
    fontSize: 15,
  },
  content: {
    color: COLORS.text,
    fontSize: 15.5,
    marginBottom: 8,
    lineHeight: 21,
  },
  mediaContainer: {
    height: 220,
    marginBottom: 8,
  },
  mediaItem: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 10,
    marginRight: Platform.OS === "android" ? 0 : 0,
    overflow: "hidden",
    backgroundColor: COLORS.muted,
  },
  mediaFull: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.muted,
  },
  loadingOverlay: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  iconBtn: {
    marginRight: 20,
  },
  iconAction: {
    marginRight: 12,
  },
  viewLikes: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "600",
  },
  viewComments: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PostCard;
