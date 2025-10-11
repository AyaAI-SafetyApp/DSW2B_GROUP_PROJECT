import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const COLORS = {
  text: "#262626",
  textSecondary: "#8E8E8E",
  border: "#EFEFEF",
  accent: "#E91E63",
};

const PostCard = ({ post, onAddReaction, onEdit, onDelete }) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {post.username ? post.username.slice(0, 2).toUpperCase() : "U"}
          </Text>
        </View>
        <Text style={styles.username}>{post.username}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => onEdit(post.id, post)}
          style={{ marginRight: 12 }}
        >
          <MaterialCommunityIcons name="pencil" size={22} color="#444" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onDelete(post.id)}>
          <MaterialCommunityIcons name="delete" size={22} color={COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {post.content ? (
        <Text style={styles.content}>{post.content}</Text>
      ) : null}

      {/* Media */}
      {post.media_type === "image" && post.media_url ? (
        <Image
          source={{ uri: post.media_url }}
          style={styles.mediaImage}
          resizeMode="cover"
        />
      ) : null}
      {post.media_type === "video" && post.media_url ? (
        <View style={styles.mediaVideo}>
          <MaterialCommunityIcons name="play-circle" size={48} color={COLORS.textSecondary} />
          <Text style={{ color: COLORS.textSecondary, marginTop: 8 }}>Video: {post.media_url}</Text>
        </View>
      ) : null}

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="heart-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="comment-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="send-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <MaterialCommunityIcons name="bookmark-outline" size={22} color={COLORS.text} />
        </TouchableOpacity>
      </View>
      <Text style={styles.timestamp}>
        {post.created_at ? timeAgo(post.created_at) : ""}
      </Text>
    </View>
  );
};

// Helper to show "x hours ago"
function timeAgo(dateString) {
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
    backgroundColor: "#fff",
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#eee",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#444",
    fontWeight: "bold",
  },
  username: {
    fontWeight: "bold",
    color: COLORS.text,
    fontSize: 15,
  },
  content: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 8,
  },
  mediaImage: {
    width: SCREEN_WIDTH - 48,
    height: 220,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#eee",
    alignSelf: "center",
  },
  mediaVideo: {
    alignItems: "center",
    justifyContent: "center",
    height: 220,
    backgroundColor: "#eee",
    borderRadius: 10,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 2,
  },
  iconBtn: {
    marginRight: 18,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});

export default PostCard;