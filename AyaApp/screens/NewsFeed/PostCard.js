import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Video } from "expo-av";

const { width } = Dimensions.get("window");
const COLORS = {
  primary: "#E91E63",
  background: "#F9FAFB",
  card: "#fff",
  text: "#1F2937",
  textSecondary: "#6B7280",
  reward: "#FFD700",
};

const REACTIONS = [
  { type: "like", icon: "thumb-up-outline" },
  { type: "heart", icon: "heart-outline" },
  { type: "fun", icon: "emoticon-happy-outline" },
];

const PostCard = ({ post, onAddReaction }) => {
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleComments = () => {
    const finalValue = expanded ? 0 : 1;
    setExpanded(!expanded);
    Animated.timing(animation, {
      toValue: finalValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, (post?.comments?.length || 0) * 50 + 20],
  });

  if (!post) return null;

  return (
    <View style={styles.postCard}>
      {/* Header */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <MaterialCommunityIcons
            name="account-circle"
            size={36}
            color={COLORS.primary}
          />
          <Text style={styles.username}>{post.username || "Anonymous"}</Text>
          {post.verified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={16}
              color={COLORS.primary}
              style={{ marginLeft: 4 }}
            />
          )}
          {post.isVerifiedIncident && (
            <View style={styles.rewardBadge}>
              <MaterialCommunityIcons
                name="star"
                size={14}
                color={COLORS.text}
              />
              <Text style={styles.rewardText}>
                {post.rewardPoints || 0} Points
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.location}>{post.location || "Unknown"}</Text>
      </View>

      {/* Content */}
      <Text style={styles.content}>{post.content || ""}</Text>

      {/* Media */}
      {post.media?.length > 0 && (
        <FlatList
          horizontal
          data={post.media}
          keyExtractor={(item, index) => `${post.id}_${index}`}
          renderItem={({ item }) =>
            item.type === "image" ? (
              <Image source={{ uri: item.uri }} style={styles.media} />
            ) : (
              <Video
                source={{ uri: item.uri }}
                style={styles.media}
                resizeMode="cover"
                shouldPlay
                isLooping
              />
            )
          }
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
        />
      )}

      {/* Reactions */}
      <View style={styles.reactionBar}>
        {REACTIONS.map((r) => (
          <TouchableOpacity
            key={r.type}
            style={styles.reactionButton}
            onPress={() => onAddReaction?.(post.id, r.type)}
          >
            <MaterialCommunityIcons
              name={r.icon}
              size={20}
              color={COLORS.textSecondary}
            />
            <Text style={styles.reactionText}>
              {post.reactions?.[r.type] || 0}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          onPress={toggleComments}
          style={styles.reactionButton}
        >
          <MaterialCommunityIcons
            name="comment-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.reactionText}>{post.comments?.length || 0}</Text>
        </TouchableOpacity>
      </View>

      {/* Comments */}
      <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
        {expanded &&
          post.comments?.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <MaterialCommunityIcons
                name="account-circle"
                size={28}
                color={COLORS.primary}
              />
              <Text style={styles.commentText}>{c.text}</Text>
            </View>
          ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
  },
  postHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  postHeaderLeft: { flexDirection: "row", alignItems: "center" },
  username: { fontWeight: "700", fontSize: 16, marginLeft: 8 },
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
    marginLeft: 4,
  },
  location: { color: COLORS.textSecondary, fontSize: 12 },
  content: { marginTop: 8, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  media: {
    width: width * 0.7,
    height: width * 0.4,
    borderRadius: 12,
    marginRight: 12,
  },
  reactionBar: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  reactionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  reactionText: { marginLeft: 6, fontSize: 13, color: COLORS.textSecondary },
  commentItem: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  commentText: { marginLeft: 8, color: COLORS.textSecondary },
});

export default PostCard;
