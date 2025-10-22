import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
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

const PostCard = ({ post, onAddReaction, onEdit, onDelete }) => {
  const createdAt = useMemo(() => timeAgo(post.created_at), [post.created_at]);

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

      {post.media_type === "image" && post.media_url ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      ) : null}

      {post.media_type === "video" && post.media_url ? (
        <View style={styles.mediaVideo}>
          <Video
            source={{ uri: post.media_url }}
            style={styles.videoPlayer}
            useNativeControls
            resizeMode="cover"
            isLooping
          />
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => onAddReaction?.("like", post.id)}
        >
          <MaterialCommunityIcons
            name="heart-outline"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
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

      {createdAt ? <Text style={styles.timestamp}>{createdAt}</Text> : null}
    </View>
  );
};

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
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
  mediaImage: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.muted,
    alignSelf: "center",
  },
  mediaVideo: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    backgroundColor: COLORS.muted,
    borderRadius: 10,
    marginBottom: 8,
  },
  videoPlayer: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 10,
    backgroundColor: "#000",
    alignSelf: "center",
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
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
});

export default PostCard;