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
import { Video } from "expo-av";

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
  return (
    /\.(mp4|mov|webm|mkv|3gp)(?:\?.*)?$/i.test(uri) ||
    uri.includes("/video/") ||
    uri.includes("content-type=video")
  );
};

export default function PostCard({
  post,
  onAddReaction,
  onLike,
  onEdit,
  onDelete,
  onComment,
  onViewComments,
  currentUsername,
  shouldPlay,
  onViewMedia,
  onViewLikes,
}) {
  const createdAt = useMemo(() => timeAgo(post.created_at), [post.created_at]);
  const media = useMemo(
    () =>
      Array.isArray(post.media_urls)
        ? post.media_urls
        : post.media_url
        ? [post.media_url]
        : [],
    [post.media_urls, post.media_url]
  );
  const [loadingMap, setLoadingMap] = useState({});
  const lastTapRef = useRef(null);
  const currentMediaIndexRef = useRef(0);

  const onLoadStart = useCallback(
    (index) => setLoadingMap((m) => ({ ...m, [index]: true })),
    []
  );
  const onLoadEnd = useCallback(
    (index) => setLoadingMap((m) => ({ ...m, [index]: false })),
    []
  );

  const mediaViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 50,
  }).current;

  const onViewableMediaChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length)
      currentMediaIndexRef.current = viewableItems[0].index || 0;
  }).current;

  const handleTap = useCallback(
    (index) => {
      const now = Date.now();
      if (lastTapRef.current && now - lastTapRef.current < 300) {
        lastTapRef.current = null;
        onLike?.(post.id);
        return;
      }
      lastTapRef.current = now;
      setTimeout(() => {
        if (!lastTapRef.current) return;
        if (Date.now() - now >= 300) {
          const idx =
            typeof index === "number" ? index : currentMediaIndexRef.current;
          const uri = media[idx];
          if (uri) onViewMedia?.(uri, isVideoUrl(uri));
          lastTapRef.current = null;
        }
      }, 300);
    },
    [onLike, post.id, media, onViewMedia]
  );

  const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
  const isLiked =
    currentUsername &&
    Array.isArray(post.likes) &&
    post.likes.includes(currentUsername);

  const renderMedia = ({ item, index }) => {
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
          onPress={() => handleTap(index)}
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
              shouldPlay={
                !!(shouldPlay && currentMediaIndexRef.current === index)
              }
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
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username?.slice(0, 2).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.username}>{post.username || "Unknown User"}</Text>
        <View style={{ flex: 1 }} />
        {onEdit && (
          <TouchableOpacity
            onPress={() => onEdit(post.id, post)}
            style={styles.iconAction}
          >
            <MaterialCommunityIcons
              name="pencil"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(post.id)}>
            <MaterialCommunityIcons
              name="delete"
              size={22}
              color={COLORS.accent}
            />
          </TouchableOpacity>
        )}
      </View>

      {post.content && <Text style={styles.content}>{post.content}</Text>}

      {media.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            data={media}
            horizontal
            pagingEnabled
            keyExtractor={(_, i) => `${post.id}_media_${i}`}
            showsHorizontalScrollIndicator={false}
            viewabilityConfig={mediaViewabilityConfig}
            onViewableItemsChanged={onViewableMediaChanged}
            renderItem={renderMedia}
          />
        </View>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() =>
            isLiked ? onLike?.(post.id) : onAddReaction?.("like", post.id)
          }
        >
          <MaterialCommunityIcons
            name={isLiked ? "heart" : "heart-outline"}
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onComment?.(post.id)}
        >
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

      {likesCount > 0 && (
        <TouchableOpacity onPress={() => onViewLikes?.(post)}>
          <Text style={styles.viewLikes}>
            {likesCount} {likesCount === 1 ? "like" : "likes"}
          </Text>
        </TouchableOpacity>
      )}
      {post.comments?.length > 0 && (
        <TouchableOpacity onPress={() => onViewComments?.(post)}>
          <Text style={styles.viewComments}>
            View all {post.comments.length} comments
          </Text>
        </TouchableOpacity>
      )}
      {createdAt && <Text style={styles.timestamp}>{createdAt}</Text>}
    </View>
  );
}

function timeAgo(dateInput) {
  if (!dateInput) return "";
  const date = new Date(dateInput);
  if (isNaN(date)) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
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
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.muted,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: { color: COLORS.text, fontWeight: "600" },
  username: { fontWeight: "bold", color: COLORS.text, fontSize: 15 },
  content: {
    color: COLORS.text,
    fontSize: 15.5,
    marginBottom: 8,
    lineHeight: 21,
  },
  mediaContainer: { height: 220, marginBottom: 8 },
  mediaItem: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: COLORS.muted,
  },
  mediaFull: { width: "100%", height: "100%", backgroundColor: COLORS.muted },
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
  footer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  iconBtn: { marginRight: 20 },
  iconAction: { marginRight: 12 },
  viewLikes: {
    color: COLORS.text,
    fontSize: 14,
    marginTop: 6,
    marginLeft: 4,
    fontWeight: "600",
  },
  viewComments: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6 },
  timestamp: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
});