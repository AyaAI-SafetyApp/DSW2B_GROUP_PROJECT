import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  Pressable,
  TouchableWithoutFeedback,
  Share,
  Easing,
  Platform,
  Image,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Video } from "expo-av";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Clean, neutral Instagram-inspired colors
const COLORS = {
  background: "#FFFFFF",
  text: "#262626",
  textSecondary: "#8E8E8E",
  textTertiary: "#C7C7C7",
  border: "#EFEFEF",
  divider: "#EFEFEF",
  heart: "#ED4956",
  overlay: "rgba(0, 0, 0, 0.3)",
};

const REACTIONS = [
  { type: "like", icon: "heart-outline", iconFilled: "heart", color: COLORS.heart },
  { type: "bookmark", icon: "bookmark-outline", iconFilled: "bookmark", color: COLORS.text },
];

const PostCard = ({ post, onAddReaction, style }) => {
  const [expanded, setExpanded] = useState(false);
  const [userReaction, setUserReaction] = useState(null);
  const [reactionCount, setReactionCount] = useState(post?.reactions?.length || 0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Animation refs
  const doubleTapAnim = useRef(new Animated.Value(0)).current;
  const reactionCountAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simple fade in
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleReaction = (type = "like") => {
    onAddReaction?.(post.id, type);
    
    const wasReacted = userReaction === type;
    setUserReaction(wasReacted ? null : type);
    setReactionCount(prev => wasReacted ? Math.max(0, prev - 1) : prev + 1);

    // Simple scale animation
    Animated.sequence([
      Animated.timing(reactionCountAnim, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(reactionCountAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this post: ${post.content || ""}`,
      });
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  const handleDoubleTap = () => {
    handleReaction("like");
    
    // Simple double tap animation
    doubleTapAnim.setValue(0);
    Animated.timing(doubleTapAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      doubleTapAnim.setValue(0);
    });
  };

  const renderMediaItem = ({ item }) => {
    if (item.type === "image") {
      return (
        <TouchableWithoutFeedback onPress={handleDoubleTap}>
          <Image
            source={{ uri: item.uri }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        </TouchableWithoutFeedback>
      );
    } else {
      return (
        <Video
          source={{ uri: item.uri }}
          style={styles.mediaVideo}
          resizeMode="cover"
          useNativeControls
          shouldPlay={false}
        />
      );
    }
  };

  return (
    <Animated.View 
      style={[
        styles.postCard, 
        style,
        { opacity: fadeAnim }
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Image 
              source={{ uri: post.userAvatar || `https://ui-avatars.com/api/?name=${post.username}&background=f0f0f0&color=262626` }}
              style={styles.avatarImage}
            />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.username}>{post.username || "user"}</Text>
            {post.location && (
              <Text style={styles.location}>{post.location}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <MaterialCommunityIcons 
            name="dots-horizontal" 
            size={20} 
            color={COLORS.text} 
          />
        </TouchableOpacity>
      </View>

      {/* Media */}
      {post.media?.length > 0 && (
        <View style={styles.mediaContainer}>
          <FlatList
            horizontal
            pagingEnabled
            data={post.media}
            keyExtractor={(item, index) => `${post.id}_media_${index}`}
            renderItem={renderMediaItem}
            showsHorizontalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const index = Math.round(nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentMediaIndex(index);
            }}
            scrollEventThrottle={16}
          />
          
          {/* Media dots */}
          {post.media.length > 1 && (
            <View style={styles.dotsContainer}>
              {post.media.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentMediaIndex ? styles.dotActive : styles.dotInactive
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Double-tap heart */}
      <Animated.View
        style={[
          styles.doubleTapHeart,
          {
            opacity: doubleTapAnim.interpolate({
              inputRange: [0, 0.2, 0.8, 1],
              outputRange: [0, 1, 1, 0],
            }),
            transform: [
              {
                scale: doubleTapAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1.3],
                }),
              },
            ],
          },
        ]}
      >
        <MaterialCommunityIcons name="heart" size={80} color={COLORS.heart} />
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleReaction("like")}
          >
            <MaterialCommunityIcons
              name={userReaction === "like" ? "heart" : "heart-outline"}
              size={24}
              color={userReaction === "like" ? COLORS.heart : COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setExpanded(!expanded)}
          >
            <MaterialCommunityIcons
              name="chat-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <MaterialCommunityIcons
              name="send-outline"
              size={24}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleReaction("bookmark")}
        >
          <MaterialCommunityIcons
            name={userReaction === "bookmark" ? "bookmark" : "bookmark-outline"}
            size={24}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* Likes count */}
      {reactionCount > 0 && (
        <View style={styles.likesContainer}>
          <Animated.Text 
            style={[
              styles.likesText,
              { transform: [{ scale: reactionCountAnim }] }
            ]}
          >
            {reactionCount === 1 ? "1 like" : `${reactionCount} likes`}
          </Animated.Text>
        </View>
      )}

      {/* Caption */}
      {post.content && (
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{post.username}</Text>
            {" "}{post.content}
          </Text>
        </View>
      )}

      {/* Comments */}
      {post.comments?.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.viewCommentsButton}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.viewCommentsText}>
              View all {post.comments.length} comments
            </Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.commentsContainer}>
              {post.comments.slice(0, 2).map((comment, index) => (
                <View key={comment.id || index} style={styles.comment}>
                  <Text style={styles.commentText}>
                    <Text style={styles.commentUsername}>{comment.username}</Text>
                    {" "}{comment.text}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <Text style={styles.timestamp}>2 hours ago</Text>
      </View>
    </Animated.View>
  );
};

export default PostCard;

const styles = StyleSheet.create({
  postCard: {
    backgroundColor: COLORS.background,
    marginBottom: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  avatar: {
    marginRight: 12,
  },

  avatarImage: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.border,
  },

  userDetails: {
    flex: 1,
  },

  username: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  location: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  moreButton: {
    padding: 8,
  },

  mediaContainer: {
    position: "relative",
  },

  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: COLORS.border,
  },

  mediaVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
  },

  dotsContainer: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },

  dot: {
    width: 6,
    height: 6,
    marginHorizontal: 2,
  },

  dotActive: {
    backgroundColor: COLORS.background,
  },

  dotInactive: {
    backgroundColor: COLORS.textTertiary,
  },

  doubleTapHeart: {
    position: "absolute",
    top: "45%",
    left: "50%",
    marginLeft: -40,
    marginTop: -40,
    zIndex: 1000,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  leftActions: {
    flexDirection: "row",
  },

  actionButton: {
    marginRight: 16,
    padding: 4,
  },

  likesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  likesText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },

  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },

  caption: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 18,
  },

  captionUsername: {
    fontWeight: "600",
  },

  viewCommentsButton: {
    paddingHorizontal: 16,
    paddingVertical: 2,
  },

  viewCommentsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },

  commentsContainer: {
    paddingHorizontal: 16,
  },

  comment: {
    paddingVertical: 2,
  },

  commentText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 16,
  },

  commentUsername: {
    fontWeight: "600",
  },

  timestampContainer: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },

  timestamp: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: "uppercase",
  },
});