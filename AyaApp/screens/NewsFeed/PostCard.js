import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
  Share,
  LayoutAnimation,
  UIManager,
  Platform,
  RefreshControl,
  ScrollView,
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
  { type: "like", icon: "thumb-up", label: "Like", color: "#1877F2" },
  { type: "heart", icon: "heart", label: "Love", color: "#E91E63" },
  { type: "fun", icon: "emoticon-happy", label: "Fun", color: "#F59E0B" },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PostCard = ({ post, onAddReaction }) => {
  const [expanded, setExpanded] = useState(false);
  const [reactionPickerVisible, setReactionPickerVisible] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [animation] = useState(new Animated.Value(0));
  const pickerAnim = useRef(new Animated.Value(0)).current;
  const [reactionCount, setReactionCount] = useState(
    post?.reactions?.length || 0
  );

  const toggleComments = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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
    outputRange: [0, (post?.comments?.length || 0) * 55 + 20],
  });

  const handleLikePress = () => {
    const type = userReaction || "like";
    onAddReaction?.(post.id, type);
    setUserReaction(type);
    setReactionCount((prev) => prev + 1);
    Animated.sequence([
      Animated.timing(animation, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleLongPress = () => {
    setReactionPickerVisible(true);
    Animated.spring(pickerAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handleSelectReaction = (type) => {
    onAddReaction?.(post.id, type);
    setUserReaction(type);
    setReactionCount((prev) => prev + 1);
    Animated.timing(pickerAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() =>
      setReactionPickerVisible(false)
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post: ${post.content || ""}`,
        url: post.media?.[0]?.uri || "",
      });
    } catch (e) {
      console.log("Share error:", e);
    }
  };

  const currentReaction =
    REACTIONS.find((r) => r.type === userReaction) || REACTIONS[0];

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
          {post.isVerifiedIncident && (
            <View style={styles.rewardBadge}>
              <MaterialCommunityIcons name="star" size={14} color={COLORS.text} />
              <Text style={styles.rewardText}>{post.rewardPoints || 0} Points</Text>
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
          pagingEnabled
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
                useNativeControls
              />
            )
          }
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 12 }}
        />
      )}

      {/* Reaction Bar */}
      <View style={styles.reactionBar}>
        <Pressable
          style={styles.reactionButton}
          onPress={handleLikePress}
          onLongPress={handleLongPress}
        >
          <MaterialCommunityIcons
            name={currentReaction.icon}
            size={20}
            color={userReaction ? currentReaction.color : COLORS.textSecondary}
          />
          <Text style={[styles.reactionText, userReaction && { color: currentReaction.color, fontWeight: "600" }]}>
            {currentReaction.label} {reactionCount > 0 && `(${reactionCount})`}
          </Text>
        </Pressable>

        <TouchableOpacity onPress={toggleComments} style={styles.reactionButton}>
          <MaterialCommunityIcons name="comment-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.reactionText}>{post.comments?.length || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={styles.reactionButton}>
          <MaterialCommunityIcons name="share-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.reactionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {/* Reaction Picker Overlay */}
      {reactionPickerVisible && (
        <TouchableWithoutFeedback onPress={() => setReactionPickerVisible(false)}>
          <View style={styles.overlay}>
            <Animated.View
              style={[
                styles.reactionPicker,
                {
                  transform: [
                    {
                      scale: pickerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }),
                    },
                  ],
                  opacity: pickerAnim,
                },
              ]}
            >
              {REACTIONS.map((r) => (
                <TouchableOpacity key={r.type} style={styles.reactionOption} onPress={() => handleSelectReaction(r.type)}>
                  <MaterialCommunityIcons name={r.icon} size={28} color={r.color} />
                  <Text style={[styles.reactionLabel, { color: r.color }]}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Comments */}
      <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
        {expanded &&
          post.comments?.map((c) => (
            <View key={c.id} style={styles.commentItem}>
              <MaterialCommunityIcons name="account-circle" size={28} color={COLORS.primary} />
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
  rewardText: { color: COLORS.text, fontSize: 12, fontWeight: "600", marginLeft: 4 },
  location: { color: COLORS.textSecondary, fontSize: 12 },
  content: { marginTop: 8, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  media: { width: width * 0.9, height: width * 0.5, borderRadius: 12, marginRight: 12 },
  reactionBar: { flexDirection: "row", marginTop: 12, alignItems: "center" },
  reactionButton: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  reactionText: { marginLeft: 6, fontSize: 14, color: COLORS.textSecondary },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", alignItems: "center" },
  reactionPicker: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 40,
    marginBottom: 80,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  reactionOption: { alignItems: "center", marginHorizontal: 10 },
  reactionLabel: { fontSize: 12, marginTop: 4 },
  commentItem: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  commentText: { marginLeft: 8, color: COLORS.textSecondary },
});

export default PostCard;
