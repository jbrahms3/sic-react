import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Theme } from "../constants/theme";
import type { Post } from "../services/types";
import { timeAgo } from "../services/time";
import { Avatar } from "./Avatar";
import { CaptionText } from "./CaptionText";
import { RemoteImage } from "./RemoteImage";

export function PostCard({
  post,
  onLike,
  onOpen,
  onOpenProfile,
}: {
  post: Post;
  onLike: () => void;
  onOpen: () => void;
  onOpenProfile: () => void;
}) {
  const [heartPop, setHeartPop] = useState(false);
  const popScale = useRef(new Animated.Value(0)).current;

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!post.likedByMe) {
      setHeartPop(true);
      popScale.setValue(0);
      Animated.spring(popScale, {
        toValue: 1,
        damping: 6,
        stiffness: 140,
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(popScale, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => setHeartPop(false));
      }, 600);
    }
    onLike();
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <Pressable onPress={onOpenProfile} style={styles.header}>
        <Avatar imageId={post.avatarImageId} username={post.username} />
        <View style={styles.headerText}>
          <Text style={styles.username}>{post.username}</Text>
          <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={styles.acronymBadge}>
          <Text style={styles.acronymBadgeText}>{post.acronym}</Text>
        </View>
      </Pressable>

      {/* Photo */}
      <Pressable onPress={onOpen} style={styles.photo}>
        <RemoteImage imageId={post.imageId} style={StyleSheet.absoluteFill} />
        {heartPop && (
          <Animated.View style={{ transform: [{ scale: popScale }] }}>
            <Ionicons name="heart" size={90} color="#FFFFFF" />
          </Animated.View>
        )}
      </Pressable>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.action}>
          <Ionicons
            name={post.likedByMe ? "heart" : "heart-outline"}
            size={20}
            color={post.likedByMe ? Theme.like : Theme.ink}
          />
          <Text style={styles.actionText}>{post.likeCount}</Text>
        </Pressable>

        <Pressable onPress={onOpen} style={styles.action}>
          <Ionicons name="chatbubble-outline" size={19} color={Theme.ink} />
          <Text style={styles.actionText}>{post.commentCount}</Text>
        </Pressable>
      </View>

      {/* Caption */}
      <CaptionText caption={post.caption} acronym={post.acronym} style={styles.caption} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Theme.card,
    borderRadius: Theme.cardRadius,
    overflow: "hidden",
    shadowColor: Theme.ink,
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerText: {
    flex: 1,
    gap: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  timeAgo: {
    fontSize: 11,
    color: Theme.inkSoft,
  },
  acronymBadge: {
    backgroundColor: Theme.sunshineSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  acronymBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    color: Theme.ink,
  },
  photo: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: Theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    gap: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
    color: Theme.ink,
  },
  caption: {
    fontSize: 15,
    paddingHorizontal: 14,
    paddingBottom: 16,
  },
});
